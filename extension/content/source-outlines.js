(function initSourceOutlines() {
    const BASE_CLASS = 'mas-ext-src-outline';
    // element -> title it had before outlining (null when it had none)
    const outlined = new Map();
    let generation = 0;

    function outlineClassFor(entry) {
        return `${BASE_CLASS} ${BASE_CLASS}-${entry.source || 'unknown'}`;
    }

    function dominantSource(entries) {
        const counts = new Map();
        entries.forEach((entry) => counts.set(entry.source, (counts.get(entry.source) || 0) + 1));
        let best = entries[0];
        entries.forEach((entry) => {
            if (counts.get(entry.source) > counts.get(best.source)) best = entry;
        });
        return best;
    }

    function uniqueLabels(entries) {
        return [...new Set(entries.map((entry) => entry.label))];
    }

    function allClasses() {
        return [BASE_CLASS, ...window.MASSourceLegend.SOURCES.map((name) => `${BASE_CLASS}-${name}`)];
    }

    function apply(element, entry, title) {
        if (!outlined.has(element)) {
            outlined.set(element, element.hasAttribute('title') ? element.getAttribute('title') : null);
        }
        element.classList.remove(...allClasses());
        element.classList.add(...outlineClassFor(entry).split(' '));
        element.setAttribute('title', title);
    }

    function entriesByOverlay(groups) {
        const byOverlay = new Map();
        groups.forEach((group) => {
            group.entries.forEach((entry) => {
                if (!entry.overlayId) return;
                if (!byOverlay.has(entry.overlayId)) byOverlay.set(entry.overlayId, []);
                byOverlay.get(entry.overlayId).push(entry);
            });
        });
        return byOverlay;
    }

    async function enable() {
        const current = generation;
        const groups = await window.MASSources.getPageGroups();
        if (current !== generation) return;
        entriesByOverlay(groups).forEach(outlineOverlay);
    }

    function outlineOverlay(entries, overlayId) {
        const cardData = window.MASCardDetector.getCardByFragmentId(overlayId);
        if (!cardData) return;
        if (cardData.elementType === 'card') {
            const labels = uniqueLabels(entries).join(', ');
            apply(cardData.element, dominantSource(entries), `${entries.length} fields from ${labels}`);
            return;
        }
        const entry = entries[0];
        apply(cardData.anchorElement, entry, `${entry.label} — ${entry.reason}`);
    }

    // Outlines one badge detected after enable(); its group's other badges are already outlined.
    async function outline(overlayId) {
        const current = generation;
        const { entries } = await window.MASSources.getSourcesFor(overlayId);
        if (current !== generation) return;
        const own = entries.filter((entry) => entry.overlayId === overlayId);
        if (own.length) outlineOverlay(own, overlayId);
    }

    function disable() {
        generation += 1;
        outlined.forEach((savedTitle, element) => {
            element.classList.remove(...allClasses());
            if (savedTitle === null) {
                element.removeAttribute('title');
            } else {
                element.setAttribute('title', savedTitle);
            }
        });
        outlined.clear();
    }

    const MASSourceOutlines = { enable, disable, outline, outlineClassFor };

    if (typeof window !== 'undefined') {
        window.MASSourceOutlines = MASSourceOutlines;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MASSourceOutlines;
    }
})();
