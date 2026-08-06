// Collapsible sections on the media page.
//
// This is the only behaviour the site needs. Everything else that used to live
// here - a gradient-mesh rAF loop, scroll-reveal observers, a hero parallax,
// smooth-scroll for anchor links - was left over from the dark-theme design and
// drove nothing: the classes it toggled had no CSS behind them, and the anchor
// links it handled no longer exist.

const COLLAPSIBLE_SECTIONS = [
    'articles', 'podcasts', 'books', 'music',
    'movies', 'tweets', 'concepts', 'written'
];

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.section-header').forEach(header => {
        const section = header.closest('.projects');
        const sectionTitle = header.querySelector('.section-title');

        if (!section || !sectionTitle) return;

        const title = sectionTitle.textContent;
        if (!COLLAPSIBLE_SECTIONS.some(keyword => title.includes(keyword))) return;

        const indicator = document.createElement('span');
        indicator.className = 'collapse-indicator';
        indicator.textContent = '+';
        sectionTitle.appendChild(indicator);

        // Collapsed by default - the media page is long, and the section
        // headers act as its table of contents.
        section.classList.add('collapsed');
        header.style.cursor = 'pointer';

        header.addEventListener('click', () => {
            section.classList.toggle('collapsed');
            indicator.textContent = section.classList.contains('collapsed') ? '+' : '−';
        });
    });
});
