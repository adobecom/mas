// What each content-source color means. The panel's labels and the page outlines style themselves
// from the same source names, so this list is the one place those names live.
(() => {
    const SOURCE_LEGEND = [
        { source: 'default', label: 'Default card', meaning: 'Authored card, no variation applied' },
        { source: 'grouped', label: 'Grouped', meaning: 'Personalized for an audience (PZN)' },
        { source: 'promo', label: 'Promo', meaning: 'Promotion content' },
        { source: 'mask', label: 'Mask', meaning: 'Mask applied after the variation' },
        { source: 'locale', label: 'Locale', meaning: 'Legacy locale variation' },
        { source: 'failed', label: 'Not rendered', meaning: 'No copy in this language, not found, or failed to load' },
        { source: 'unknown', label: 'Unknown', meaning: 'Not enough data to tell' },
    ];
    const NOTES = [
        'An amber badge means the card mixes sources.',
        '"Swapped by MEP" means an MEP manifest replaced the field.',
    ];
    const SOURCES = SOURCE_LEGEND.map(({ source }) => source);

    // Each swatch wears both the label color and the page outline, so one key explains both.
    function renderSourceLegend({ open = false } = {}) {
        const items = SOURCE_LEGEND.map(
            ({ source, label, meaning }) => `
      <li class="mas-ext-legend-item">
        <span class="mas-ext-legend-swatch mas-ext-src-${source} mas-ext-src-outline-${source}"></span>
        <span class="mas-ext-legend-label">${label}</span>
        <span class="mas-ext-legend-meaning">${meaning}</span>
      </li>`,
        ).join('');
        const notes = NOTES.map((note) => `<p class="mas-ext-legend-note">${note}</p>`).join('');
        return `<details class="mas-ext-legend"${open ? ' open' : ''}><summary>What do the colors mean?</summary><ul class="mas-ext-legend-list">${items}</ul>${notes}</details>`;
    }

    const MASSourceLegend = { SOURCES, renderSourceLegend };

    if (typeof window !== 'undefined') {
        window.MASSourceLegend = MASSourceLegend;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MASSourceLegend;
    }
})();
