// Collects the source engine's inputs on demand: the page's stamps, the MEP state, and the variation,
// mask and replacement fragments fetched through the background (cached, within the shared budget).
(() => {
    const FETCH_BUDGET = 50;
    const SELECTOR_CARD = 'merch-card, merch-card-collection';
    const BARE_TYPES = ['price', 'cta'];
    const SURFACE_PATTERN = /^\/content\/dam\/mas\/([^/]+)\//;

    let fetchCount = 0;
    const fragmentCache = new Map();

    const detector = () => window.MASCardDetector;
    const engine = () => window.MASSourceEngine;
    const mep = () => window.MASMepState;

    // Shared with content.js's card-name fetches; once spent, it returns false without consuming.
    function consumeBudget(n = 1) {
        if (fetchCount + n > FETCH_BUDGET) return false;
        fetchCount += n;
        return true;
    }

    function requestFragment(fragmentId, locale, country) {
        const message = { type: 'FETCH_FRAGMENT_DATA', fragmentId, locale, country, ...detector().getServiceConfig() };
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage(message, (response) => {
                    resolve(!chrome.runtime.lastError && response?.success ? (response.data ?? null) : null);
                });
            } catch {
                resolve(null);
            }
        });
    }

    // Concurrent callers share one request; a cached id costs no budget.
    function fetchFragment(id, locale, country) {
        if (!id) return Promise.resolve(null);
        const key = `${id}|${locale ?? ''}|${country ?? ''}`;
        if (!fragmentCache.has(key)) {
            if (!consumeBudget()) return Promise.resolve(null);
            fragmentCache.set(key, requestFragment(id, locale, country));
        }
        return fragmentCache.get(key);
    }

    function emptyResult() {
        return { groupKey: null, entries: [], mixed: false, focusField: null };
    }

    // A standalone offer was never rendered from a fragment.
    function isStandalone(stamps) {
        return !stamps.requestedId && !stamps.resolvedId;
    }

    // MEP can resolve after the bridge's on-load post, so every computation asks for the current map.
    async function pageState() {
        const mepState = await mep().request();
        return { mepState, overrideIds: mep().readOverrideIds() };
    }

    function isSwapped(stamps, { mepState, overrideIds }) {
        return engine().swapFor(stamps, mepState, overrideIds).swapped;
    }

    // Default locales differ per surface, which the variation's DAM path names.
    function isRegionLocale(locale, variationData) {
        const locales = window.MASLocales;
        if (!locales) return false;
        const surface = variationData?.path?.match(SURFACE_PATTERN)?.[1] ?? 'acom';
        return !locales.isDefaultLocale(locale, surface);
    }

    // A whole card always needs its requested fragment to list its fields (the card-name fetch already
    // cached it); an inline field needs it only to label a swap.
    async function collectInputs(stamps, { locale, country }, page, { wholeCard = false } = {}) {
        const inputs = { ...page, variationData: null, requestedData: null, maskData: null, isRegionLocale: false };
        // The engine resolves a failed or loading field from its stamps alone, so it spends no budget.
        if (stamps.failed || stamps.loading) return inputs;
        const requestedId = wholeCard || isSwapped(stamps, page) ? (stamps.requestedId ?? stamps.resolvedId) : null;
        const load = (id) => fetchFragment(id, locale, country);
        const [variationData, maskData, requestedData] = await Promise.all(
            [stamps.variationId, stamps.maskId, requestedId].map(load),
        );
        return { ...inputs, variationData, maskData, requestedData, isRegionLocale: isRegionLocale(locale, variationData) };
    }

    // The same element the detector anchors a field's badge to, so shown agrees with badged.
    function isShown(field) {
        return detector().hasBox(detector().fieldAnchor(field));
    }

    // Every mas-field counts, badged or not: the detector skips one without fragment-id, such as a
    // failed MEP-swapped field. Badged bare prices/CTAs join through their own stamps.
    function inlineMembers(mepState) {
        const overlayIds = new Map([...detector().detectedCards].map(([overlayId, { element }]) => [element, overlayId]));
        const fields = [...document.querySelectorAll('mas-field')]
            .filter((element) => !element.closest(SELECTOR_CARD))
            .map((element) => ({ element, stamps: engine().readStamps(element, 'field'), shown: isShown(element) }));
        const bare = [...detector().detectedCards.values()]
            .filter(({ elementType }) => BARE_TYPES.includes(elementType))
            .map(({ element, elementType }) => ({
                element,
                stamps: engine().readStamps(element, elementType),
                shown: detector().hasBox(element),
            }));
        return [...fields, ...bare]
            .filter(({ stamps }) => !stamps.loading && !isStandalone(stamps))
            .map((member) => ({
                ...member,
                overlayId: overlayIds.get(member.element) ?? null,
                groupKey: engine().groupKey(member.stamps, mepState),
            }));
    }

    function twinKey({ field, requestedId, resolvedId, variationId }) {
        return `${field}|${requestedId ?? resolvedId ?? ''}|${variationId ?? ''}`;
    }

    // Badged first, so the outline and mixed flag reach the badge; then a shown copy.
    function twinRank({ overlayId, shown }) {
        return (overlayId ? 2 : 0) + (shown ? 1 : 0);
    }

    // Adobe pages render hidden responsive twins: keep one element per field and fetch. A failed
    // field renders nothing, so it is kept without a box.
    function dedupeTwins(members) {
        const kept = new Map();
        for (const member of members.filter(({ overlayId, shown, stamps }) => overlayId || shown || stamps.failed)) {
            const key = twinKey(member.stamps);
            const current = kept.get(key);
            if (!current || twinRank(member) > twinRank(current)) kept.set(key, member);
        }
        return [...kept.values()];
    }

    function groupByKey(members) {
        const groups = new Map();
        for (const member of members) {
            if (!groups.has(member.groupKey)) groups.set(member.groupKey, []);
            groups.get(member.groupKey).push(member);
        }
        return groups;
    }

    function finishGroup(group) {
        const mixed = engine().isMixed(group.entries);
        group.overlayIds.forEach((overlayId) => window.MASCardOverlay?.markMixed?.(overlayId, mixed));
        return { ...group, mixed };
    }

    async function resolveInlineGroup(groupKey, members, page) {
        const overlayIds = members.map(({ overlayId }) => overlayId).filter(Boolean);
        const cardData = detector().getCardByFragmentId(overlayIds[0]);
        // A group the detector has not badged yet falls back to the page locale every badge uses.
        const context = cardData ?? detector().pageLocale ?? {};
        const entries = await Promise.all(
            dedupeTwins(members).map(async ({ stamps, overlayId }) => ({
                ...engine().resolveField(stamps, await collectInputs(stamps, context, page)),
                overlayId,
            })),
        );
        return finishGroup({ groupKey, cardName: cardData?.cardName ?? null, overlayIds, entries });
    }

    async function resolveCardGroup(overlayId, cardData, page) {
        const stamps = engine().readStamps(cardData.element, 'card');
        const inputs = await collectInputs(stamps, cardData, page, { wholeCard: true });
        const entries = engine()
            .resolveCard(stamps, inputs, { variant: cardData.variant })
            .map((entry) => ({ ...entry, overlayId }));
        const groupKey = engine().groupKey(stamps, page.mepState);
        return finishGroup({ groupKey, cardName: cardData.cardName ?? null, overlayIds: [overlayId], entries });
    }

    async function getSourcesFor(overlayId) {
        const cardData = detector().getCardByFragmentId(overlayId);
        if (!cardData || cardData.elementType === 'collection') return emptyResult();
        if (cardData.elementType === 'card') {
            const { groupKey, entries, mixed } = await resolveCardGroup(overlayId, cardData, await pageState());
            return { groupKey, entries, mixed, focusField: null };
        }
        const stamps = engine().readStamps(cardData.element, cardData.elementType);
        if (isStandalone(stamps)) return emptyResult();
        const page = await pageState();
        const groupKey = engine().groupKey(stamps, page.mepState);
        const members = inlineMembers(page.mepState).filter((member) => member.groupKey === groupKey);
        const { entries, mixed } = await resolveInlineGroup(groupKey, members, page);
        return { groupKey, entries, mixed, focusField: stamps.field };
    }

    async function getPageGroups() {
        const page = await pageState();
        const inline = [...groupByKey(inlineMembers(page.mepState))].map(([groupKey, members]) =>
            resolveInlineGroup(groupKey, members, page),
        );
        const cards = [...detector().detectedCards]
            .filter(([, cardData]) => cardData.elementType === 'card')
            .map(([overlayId, cardData]) => resolveCardGroup(overlayId, cardData, page));
        return Promise.all([...inline, ...cards]);
    }

    const MASSources = { getSourcesFor, getPageGroups, fetchFragment, consumeBudget };

    if (typeof window !== 'undefined') {
        window.MASSources = MASSources;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MASSources;
    }
})();
