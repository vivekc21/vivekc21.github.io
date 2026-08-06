# vivekc21.github.io

My personal site — work, reading, and a few things I'm building.
Live at **https://vivekc21.github.io**.

Hand-written HTML and CSS with no framework, no build step, and no
dependencies. What's in the repo is exactly what gets served.

## Layout

```
index.html      home
about.html      who i am
work.html       analytics work at onepay and capital one
media.html      articles, podcasts, music, movies
bookshelf.html  reading list
projects.html   side projects
lockin.html     pomodoro timer

styles.css      all styling
script.js       collapsible sections on the media page (the only site-wide JS)
pomodoro.js     the timer, loaded by lockin.html only
favicon.svg     VC monogram
og-image.png    link preview card (1200x630)
og-template.html  source for og-image.png - see below
check.sh        site checks - see below
.nojekyll       tells GitHub Pages to serve the files as-is
```

Every page shares the same shell: a `.page` flex container holding the `.nav`
sidebar and a `.content` column. The sidebar is `position: sticky` inside that
container rather than `fixed` to the viewport, so it stays beside the content
at any width instead of drifting to the screen edge.

## Running locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

No install step. Edit a file, reload the page.

## Regenerating the link preview image

`og-image.png` is what LinkedIn, Slack, and iMessage show when the site is
shared. It is a screenshot of `og-template.html` at exactly 1200x630 — edit
the template, then re-shoot it:

```bash
python3 -m http.server 8000
# open http://localhost:8000/og-template.html in a browser sized to
# 1200x630 and capture it, or use any headless screenshot tool
```

Keep the dimensions exact. Social platforms crop anything else.

## Checks

`check.sh` verifies the things that have actually broken before:

```bash
./check.sh                          # against the live site
./check.sh http://localhost:8000    # against a local server
```

It asserts that every page returns 200, that the favicon resolves, that
description and Open Graph tags are present, that project content is visible
without a click, that no dead fonts or markup have crept back in, and that all
external links still resolve.

The important one is the **deploy-freshness canary**, which diffs each live
page against the working tree. The site once served a seven-month-old build
because the Pages job was failing silently; this check turns that into a
visible failure instead of something you notice by accident.

## Deploying

Push to `main`. GitHub Pages builds from the repository root.

`.nojekyll` matters more than it looks: without it, Pages runs the site through
Jekyll, and that is what was failing. If a deploy seems not to land, check the
build directly rather than guessing:

```bash
gh api repos/vivekc21/vivekc21.github.io/pages/builds \
  --jq '.[0:5][] | "\(.status) | \(.commit[0:7]) | \(.error.message // "ok")"'
```

Then confirm what's actually being served with `./check.sh`.
