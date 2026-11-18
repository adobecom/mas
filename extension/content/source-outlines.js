(function initSourceOutlines() {
    const BASE_CLASS = 'mas-ext-src-outline';
    // element -> title it had before outlining (null when it had none)
    const outlined = new Map();
    // Fragment fields merch-card renders under another mapping name, or without a mapping entry.
    const FIELD_ALIASES = { cardTitle: 'title' };
    const FIXED_SLOTS = { mnemonicIcon: { tag: 'merch-icon', slot: 'icons' } };
    const PRICE_MARKER = '[is="inline-price"], [data-wcs-osi]';
    const NAME_PATTERN = /^[a-z][\w-]*$/i;
    // variant -> the page bridge's pending reply and its resolver
    const slotRequests = new Map();
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

    // Which slotted element merch-card renders each field into is the variant's own mapping, which only
    // the page world can read. The bridge always replies, so callers asking for one variant share a reply.
    function fieldSlots(variant) {
        if (!variant) return Promise.resolve({});
        if (!slotRequests.has(variant)) {
            const request = {};
            request.reply = new Promise((resolve) => {
                request.settle = resolve;
            });
            slotRequests.set(variant, request);
            window.postMessage({ source: 'mas-ext', type: 'GET_FIELD_SLOTS', variant }, location.origin);
        }
        return slotRequests.get(variant).reply;
    }

    function receiveFieldSlots(event) {
        if (event?.source !== window || event.origin !== location.origin) return;
        const { source, type, variant, slots } = event.data ?? {};
        if (source !== 'mas-ext-page-bridge' || type !== 'FIELD_SLOTS') return;
        const request = slotRequests.get(variant);
        slotRequests.delete(variant);
        let parsed = {};
        try {
            parsed = JSON.parse(slots) ?? {};
        } catch {
            // An unreadable reply means no known slots.
        }
        request?.settle(parsed);
    }

    function isName(value) {
        return typeof value === 'string' && NAME_PATTERN.test(value);
    }

    function holdsPrice(element) {
        return Boolean(element.querySelector?.(PRICE_MARKER));
    }

    // Some variants (catalog) render the title and the price as separate elements of one slot.
    function pricesShareSlot(slots, tag, slot) {
        return slots.prices?.slot === slot && (slots.prices.tag ?? '') === tag;
    }

    // The page supplies tag and slot, so neither reaches a selector unless it is a plain name.
    function fieldElements(card, field, slots) {
        const { tag = '', slot } = FIXED_SLOTS[field] ?? slots[FIELD_ALIASES[field] ?? field] ?? {};
        if (!isName(slot) || (tag !== '' && !isName(tag))) return [];
        const elements = [...card.querySelectorAll(`:scope > ${tag}[slot="${slot}"]`)];
        if (!pricesShareSlot(slots, tag, slot)) return elements;
        return elements.filter((element) => holdsPrice(element) === (field === 'prices'));
    }

    // Each rendered field gets its own source; a card whose fields cannot be located keeps one outline.
    async function outlineCard(card, entries, current) {
        const slots = await fieldSlots(card.getAttribute('variant'));
        if (current !== generation) return;
        const located = entries.flatMap((entry) => fieldElements(card, entry.field, slots).map((element) => [element, entry]));
        if (!located.length) {
            apply(card, dominantSource(entries), `${entries.length} fields from ${uniqueLabels(entries).join(', ')}`);
            return;
        }
        located.forEach(([element, entry]) => apply(element, entry, `${entry.label} — ${entry.reason}`));
    }

    async function enable() {
        const current = generation;
        const groups = await window.MASSources.getPageGroups();
        if (current !== generation) return;
        await Promise.all(
            [...entriesByOverlay(groups)].map(([overlayId, entries]) => outlineOverlay(entries, overlayId, current)),
        );
    }

    async function outlineOverlay(entries, overlayId, current) {
        const cardData = window.MASCardDetector.getCardByFragmentId(overlayId);
        if (!cardData) return;
        if (cardData.elementType === 'card') {
            await outlineCard(cardData.element, entries, current);
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
        if (own.length) await outlineOverlay(own, overlayId, current);
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
        window.addEventListener('message', receiveFieldSlots);
        window.MASSourceOutlines = MASSourceOutlines;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MASSourceOutlines;
    }
})();
