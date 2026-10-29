(() => {
    const MILO_UTILS_PATTERN = /\/libs\/utils\/utils\.js(\?|$)/;
    const BRIDGE_SOURCE = 'mas-ext-page-bridge';
    const REQUEST_SOURCE = 'mas-ext';

    function findMiloUtilsUrl(resourceNames) {
        return resourceNames.find((name) => MILO_UTILS_PATTERN.test(name)) || null;
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
                });
            }
        }
        return { preview: config?.mep?.preview === true, swaps };
    }

    async function readMepState() {
        try {
            const names = performance.getEntriesByType('resource').map((entry) => entry.name);
            const url = findMiloUtilsUrl(names);
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
            if (event.data?.source !== REQUEST_SOURCE || event.data?.type !== 'GET_MEP_STATE') return;
            postMepState();
        });
        postMepState();
    }

    // This runs in the page's own world, so a page global named module must never be written.
    if (typeof module === 'object' && module && module.exports && typeof window === 'undefined') {
        module.exports = { findMiloUtilsUrl, serializeMepState };
    }
})();
