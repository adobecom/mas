(() => {
    const MILO_UTILS_PATH = /\/libs\/utils\/utils\.js$/;
    // Milo serves its libs from the page's own origin, www/stage, or a milolibs branch host.
    const MILO_HOSTS = ['www.adobe.com', 'www.stage.adobe.com', 'milo.adobe.com'];
    const MILO_BRANCH_HOST = /^[a-z0-9_-]+--milo--[a-z0-9_-]+\.(aem|hlx)\.(live|page)$/i;
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
                });
            }
        }
        return { preview: config?.mep?.preview === true, swaps };
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
