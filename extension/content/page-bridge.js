(() => {
    const MILO_UTILS_PATH = /\/libs\/utils\/utils\.js$/;
    // Milo serves its libs from the page's own origin, www/stage, or an adobecom milolibs branch host.
    const MILO_HOSTS = ['www.adobe.com', 'www.stage.adobe.com', 'milo.adobe.com'];
    const MILO_BRANCH_HOST = /^[a-z0-9_-]+--milo--adobecom\.(aem|hlx)\.(live|page)$/i;
    const SCRIPT_INITIATORS = ['script', 'other'];
    const BRIDGE_SOURCE = 'mas-ext-page-bridge';
    const REQUEST_SOURCE = 'mas-ext';

    function isMiloUtilsUrl(name, pageOrigin) {
        try {
            const { protocol, origin, hostname, pathname } = new URL(name);
            if (protocol !== 'https:' || !MILO_UTILS_PATH.test(pathname)) return false;
            return origin === pageOrigin || MILO_HOSTS.includes(hostname) || MILO_BRANCH_HOST.test(hostname);
        } catch {
            return false;
        }
    }

    // Resource Timing also lists images and stylesheets; only a script from a Milo origin may run in the page.
    function findMiloUtilsUrl(entries, pageOrigin) {
        const entry = entries.find(
            ({ name, initiatorType }) => SCRIPT_INITIATORS.includes(initiatorType) && isMiloUtilsUrl(name, pageOrigin),
        );
        return entry?.name ?? null;
    }

    function serializeMepState(config) {
        const fragments = config?.mep?.inBlock?.mas?.fragments;
        const swaps = [];
        for (const [authoredId, fields] of Object.entries(fragments || {})) {
            for (const [field, command] of Object.entries(fields || {})) {
                if (command?.action !== 'replace') continue;
                swaps.push({
                    authoredId,
                    field,
                    replacementId: String(command.content),
                    manifestId: typeof command.manifestId === 'string' ? command.manifestId : null,
                    ...(command.pzn ? { pzn: command.pzn } : {}),
                    ...(!field && command.pzn
                        ? {
                              excludedFields: Object.fromEntries(
                                  Object.keys(fields)
                                      .filter(Boolean)
                                      .map((name) => [name, true]),
                              ),
                          }
                        : {}),
                });
            }
        }
        return { preview: config?.mep?.preview === true, swaps };
    }

    // The mapping entries that render a slotted element, keyed as merch-card names them.
    function serializeFieldSlots(mapping) {
        const slots = {};
        for (const [name, config] of Object.entries(mapping || {})) {
            if (typeof config?.slot !== 'string') continue;
            slots[name] = { slot: config.slot, ...(typeof config.tag === 'string' ? { tag: config.tag } : {}) };
        }
        return slots;
    }

    function postFieldSlots(variant) {
        let slots = {};
        try {
            slots = serializeFieldSlots(customElements.get('merch-card')?.getFragmentMapping?.(variant));
        } catch {
            // A page without merch-card has no slots to report.
        }
        window.postMessage(
            { source: BRIDGE_SOURCE, type: 'FIELD_SLOTS', variant, slots: JSON.stringify(slots) },
            location.origin,
        );
    }

    async function readMepState() {
        try {
            const url = findMiloUtilsUrl(performance.getEntriesByType('resource'), location.origin);
            if (!url) return null;
            const utils = await import(url);
            return serializeMepState(utils.getConfig());
        } catch {
            return null;
        }
    }

    async function postMepState() {
        const state = await readMepState();
        window.postMessage({ source: BRIDGE_SOURCE, type: 'MEP_STATE', state: JSON.stringify(state) }, location.origin);
    }

    // Studio is excluded like in content.js: nothing there asks for MEP state.
    const isPage = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (isPage && !location.pathname.endsWith('/studio.html')) {
        window.addEventListener('message', (event) => {
            if (event.source !== window || event.origin !== location.origin) return;
            if (event.data?.source !== REQUEST_SOURCE) return;
            if (event.data.type === 'GET_MEP_STATE') postMepState();
            if (event.data.type === 'GET_FIELD_SLOTS') postFieldSlots(event.data.variant);
        });
        postMepState();
    }

    // This runs in the page's own world, so a page global named module must never be written.
    if (typeof module === 'object' && module && module.exports && typeof window === 'undefined') {
        module.exports = { findMiloUtilsUrl, serializeMepState, serializeFieldSlots };
    }
})();
