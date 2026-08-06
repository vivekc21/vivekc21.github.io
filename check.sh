#!/usr/bin/env bash
# Site checks for vivekc21.github.io
#
# Usage:
#   ./check.sh                          # check the live site
#   ./check.sh http://localhost:8000    # check a local server
#
# Start a local server with: python3 -m http.server 8000

set -uo pipefail

BASE="${1:-https://vivekc21.github.io}"
BASE="${BASE%/}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PAGES=(index about work media bookshelf projects now lockin)

PASS=0
FAIL=0
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; DIM=$'\033[2m'; OFF=$'\033[0m'

pass() { PASS=$((PASS+1)); printf '  %sok%s   %s\n' "$GREEN" "$OFF" "$1"; }
fail() { FAIL=$((FAIL+1)); printf '  %sFAIL%s %s\n' "$RED" "$OFF" "$1"; [ $# -gt 1 ] && printf '       %s%s%s\n' "$DIM" "$2" "$OFF"; }
group() { printf '\n%s\n' "$1"; }

CACHE="$(mktemp -d)"
trap 'rm -rf "$CACHE"' EXIT

# Fetch a path once, bypassing the CDN cache so we always see what is really
# deployed, then reuse it. Re-requesting per assertion made the run slow and
# turned any single transient failure into a spurious FAIL.
fetch() {
    local safe="${1//\//_}"
    if [ ! -f "$CACHE/$safe" ]; then
        curl -fsSL --retry 2 --retry-delay 1 --max-time 30 \
            "$BASE/$1?cb=$RANDOM$RANDOM" -o "$CACHE/$safe" 2>/dev/null || return 1
    fi
    cat "$CACHE/$safe"
}
status_of() { curl -o /dev/null -s -w '%{http_code}' --retry 2 "$BASE/$1?cb=$RANDOM$RANDOM" 2>/dev/null; }

printf 'Checking %s\n' "$BASE"

# ---------------------------------------------------------------------------
group 'reachability'
for p in "${PAGES[@]}"; do
    code="$(status_of "$p.html")"
    [ "$code" = "200" ] && pass "$p.html serves 200" || fail "$p.html serves 200" "got $code"
done

# ---------------------------------------------------------------------------
group 'favicon'
# pomodoro.js references an icon for notifications; a missing favicon is also a
# console 404 on every single page load.
found_icon=""
for candidate in favicon.svg favicon.ico favicon.png; do
    [ "$(status_of "$candidate")" = "200" ] && { found_icon="$candidate"; break; }
done
[ -n "$found_icon" ] && pass "favicon served ($found_icon)" || fail "favicon served" "none of favicon.svg/.ico/.png return 200"

for p in "${PAGES[@]}"; do
    if fetch "$p.html" | grep -q 'rel="icon"'; then
        pass "$p.html links a favicon"
    else
        fail "$p.html links a favicon" 'no <link rel="icon"> in head'
    fi
done

# ---------------------------------------------------------------------------
group 'meta tags (link previews)'
for p in "${PAGES[@]}"; do
    html="$(fetch "$p.html")"
    echo "$html" | grep -q 'name="description"' \
        && pass "$p.html has meta description" \
        || fail "$p.html has meta description" 'shares render with no summary text'
    echo "$html" | grep -q 'property="og:title"' \
        && pass "$p.html has og:title" \
        || fail "$p.html has og:title" 'LinkedIn/Slack preview will be blank'
done

# ---------------------------------------------------------------------------
group 'content is visible without interaction'
work_html="$(fetch work.html)"

# The prose must be in the served HTML *and* not hidden behind a collapse.
echo "$work_html" | grep -q 'rebinning analysis' \
    && pass 'work.html contains project prose' \
    || fail 'work.html contains project prose' 'the writing is missing from the served page'

css="$(fetch styles.css)"
# Look for the collapse mechanism itself (max-height:0 on a card child),
# not merely a selector mentioning .project-description.
echo "$css" | tr -d ' \n' | grep -qE '\.project-card\.project-(description|highlights)[^}]*max-height:0' \
    && fail 'project descriptions are not collapsed by default' 'styles.css still has the max-height:0 collapse rule' \
    || pass 'project descriptions are not collapsed by default'

js="$(fetch script.js)"
echo "$js" | grep -q "classList.toggle('expanded')" \
    && fail 'no click-to-expand on cards' 'script.js still toggles .expanded on project cards' \
    || pass 'no click-to-expand on cards'

# The media page keeps its section-level collapse - that one has a real
# affordance and should survive.
echo "$js" | grep -q 'collapse-indicator' \
    && pass 'media section collapse retained' \
    || fail 'media section collapse retained' 'the +/- section toggle was removed'

# ---------------------------------------------------------------------------
group 'deploy freshness (staleness canary)'
# This is the check that would have caught the site sitting on a January build
# for seven months. If it fails, GitHub Pages is not serving current main.
stale=0
for f in index about work media bookshelf projects now lockin; do
    if [ -f "$REPO_DIR/$f.html" ]; then
        live="$(fetch "$f.html")"
        if [ -z "$live" ]; then
            fail "$f.html matches local" 'could not fetch'
            stale=1
        # Both sides go through $(...) so trailing newlines are stripped
        # consistently - otherwise every page looks stale by one byte.
        elif diff -q <(printf '%s' "$live") <(printf '%s' "$(cat "$REPO_DIR/$f.html")") >/dev/null 2>&1; then
            pass "$f.html matches local"
        else
            fail "$f.html matches local" 'deployed content differs from working tree'
            stale=1
        fi
    fi
done
[ "$stale" = "1" ] && printf '       %sSite is serving a stale build. Check: gh api repos/vivekc21/vivekc21.github.io/pages/builds%s\n' "$DIM" "$OFF"

# ---------------------------------------------------------------------------
group 'no dead weight'
for p in "${PAGES[@]}"; do
    html="$(fetch "$p.html")"

    echo "$html" | grep -q 'Lexend' \
        && fail "$p.html does not load Lexend" 'font is downloaded but referenced nowhere in CSS' \
        || pass "$p.html does not load Lexend"

    echo "$html" | grep -q 'grain-overlay' \
        && fail "$p.html has no grain-overlay" 'display:none leftover from the dark theme' \
        || pass "$p.html has no grain-overlay"

    # JetBrains Mono is only used by the lockin timer.
    if [ "$p" != "lockin" ]; then
        echo "$html" | grep -q 'JetBrains' \
            && fail "$p.html does not load JetBrains Mono" 'only lockin.html uses it' \
            || pass "$p.html does not load JetBrains Mono"
    fi
done

# Match the call, not the word - script.js documents in a comment what used
# to be here, and that comment should not trip the check.
echo "$js" | grep -qE "setProperty\(\s*['\"]--gradient-mesh|requestAnimationFrame" \
    && fail 'no gradient-mesh animation loop' 'rAF loop runs every frame setting a variable no CSS reads' \
    || pass 'no gradient-mesh animation loop'

echo "$js" | grep -q 'scrollIndicator.style' \
    && fail 'no scrollIndicator null deref' 'throws TypeError on the 7 pages without a .scroll-indicator' \
    || pass 'no scrollIndicator null deref'

# ---------------------------------------------------------------------------
group 'external links resolve'
# Portable read loop - macOS ships bash 3.2, which has no mapfile.
# Skip preconnect/stylesheet hrefs: those are resource hints, not links a
# visitor can follow, and bare font CDN origins answer 404 by design.
links=()
while IFS= read -r line; do
    links+=("$line")
done < <(grep -ho 'href="https\?://[^"]*"' "$REPO_DIR"/*.html \
    | sed 's/href="//; s/"$//' \
    | grep -vE '^https://fonts\.(googleapis|gstatic)\.com' \
    | sort -u)

for url in "${links[@]}"; do
    # HEAD first; some hosts reject HEAD, so fall back to a ranged GET.
    code="$(curl -o /dev/null -s -w '%{http_code}' -I -L --max-time 15 "$url" 2>/dev/null)"
    if [ "$code" = "000" ] || [ "$code" -ge 400 ] 2>/dev/null; then
        code="$(curl -o /dev/null -s -w '%{http_code}' -L --max-time 15 -r 0-1024 "$url" 2>/dev/null)"
    fi
    if [ "$code" = "000" ]; then
        fail "link $url" 'no response (timeout or DNS failure)'
    elif [ "$code" -ge 400 ] 2>/dev/null; then
        # 403/405/429 usually mean bot-blocking, not a broken link.
        # 999 is LinkedIn's non-standard "go away, crawler" response.
        if [ "$code" = "403" ] || [ "$code" = "405" ] || [ "$code" = "429" ] || [ "$code" = "999" ]; then
            pass "link $url ($code - bot-blocked, assumed live)"
        else
            fail "link $url" "got $code"
        fi
    else
        pass "link $url ($code)"
    fi
done

# ---------------------------------------------------------------------------
printf '\n%s\n' '────────────────────────────────'
printf '%s%d passed%s, %s%d failed%s\n' "$GREEN" "$PASS" "$OFF" \
    "$( [ "$FAIL" -gt 0 ] && echo "$RED" || echo "$GREEN" )" "$FAIL" "$OFF"
[ "$FAIL" -eq 0 ] || exit 1
