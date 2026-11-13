(function () {
    // popup.html loads utils/escape.js first; node tests require it.
    const { escapeHtmlText, escapeHtmlAttr } =
        typeof window !== 'undefined' && window.MASEscape ? window.MASEscape : require('../utils/escape.js');

    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // A link opens a fragment by id, or a promotion by the name and title the background looks up.
    function linkData(link) {
        if (link.fragmentId) return `data-fragment-id="${escapeHtmlAttr(link.fragmentId)}"`;
        const { name, title } = link.promotion;
        return [
            name && `data-promotion-name="${escapeHtmlAttr(name)}"`,
            title && `data-promotion-title="${escapeHtmlAttr(title)}"`,
        ]
            .filter(Boolean)
            .join(' ');
    }

    // Wraps each link's text in the escaped step in one pass, so no inserted anchor is scanned again.
    function linkify(step, links = []) {
        const html = escapeHtmlText(step);
        const byHtml = new Map(links.filter((link) => link.text).map((link) => [escapeHtmlText(link.text), link]));
        if (!byHtml.size) return html;
        const texts = [...byHtml.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
        return html.replace(
            new RegExp(texts.join('|'), 'g'),
            (match) => `<a href="#" class="mas-trace-link" ${linkData(byHtml.get(match))}>${match}</a>`,
        );
    }

    function renderManifests(mep) {
        if (!mep.available) return '<p class="mas-trace-note">MEP details unavailable on this page</p>';
        if (!mep.manifests.length) return '';
        const items = mep.manifests
            .map(
                (manifest) =>
                    `<li>${escapeHtmlText(manifest.manifestId || 'manifest unknown')} → ${manifest.swaps.length} swaps</li>`,
            )
            .join('');
        return `<ul class="mas-trace-manifests">${items}</ul>`;
    }

    function renderCard(card) {
        const flag = card.mixed ? ' <span class="mas-trace-mixed">mixed</span>' : '';
        const steps = card.steps.map((step) => `<li>${linkify(step, card.links)}</li>`).join('');
        return `<div class="mas-trace-card"><div class="mas-trace-card-name">${escapeHtmlText(card.cardName)}${flag}</div><ol class="mas-trace-steps">${steps}</ol></div>`;
    }

    function renderPageTraceHtml(trace) {
        return renderManifests(trace.mep) + trace.cards.map(renderCard).join('');
    }

    // The trace walks every card on the page, so it loads on the section's first open and on Refresh
    // while open, never on popup open. The body stays hidden until a load succeeds.
    function bindPageTrace({ section, body, fetchTrace, openLink }) {
        let loaded = false;

        body.addEventListener('click', (event) => {
            const link = event.target.closest('.mas-trace-link');
            if (!link) return;
            event.preventDefault();
            openLink(link.dataset);
        });

        async function load() {
            const trace = await fetchTrace();
            if (!trace) return;
            body.innerHTML = renderPageTraceHtml(trace);
            body.hidden = false;
            loaded = true;
        }

        section.addEventListener('toggle', () => {
            if (section.open && !loaded) load();
        });

        return { refresh: () => (section.open ? load() : Promise.resolve()) };
    }

    const MASPageTraceView = { renderPageTraceHtml, bindPageTrace };

    if (typeof window !== 'undefined') window.MASPageTraceView = MASPageTraceView;
    if (typeof module !== 'undefined' && module.exports) module.exports = MASPageTraceView;
})();
