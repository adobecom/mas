(() => {
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const MANIFEST_PATTERN = /^[\w.-]+\.json$/;
    const OVERRIDES_SELECTOR = 'div.mas-overrides aem-fragment[fragment]';

    let latestState = null;
    let pendingState = null;
    let settlePending = null;

    function isBridgeEvent(event) {
        return (
            event?.source === window &&
            event.origin === location.origin &&
            event.data?.source === 'mas-ext-page-bridge' &&
            event.data?.type === 'MEP_STATE'
        );
    }

    function sanitizeSwap(swap) {
        if (!UUID_PATTERN.test(swap?.authoredId) || !UUID_PATTERN.test(swap?.replacementId)) return null;
        const manifestId =
            typeof swap.manifestId === 'string' && MANIFEST_PATTERN.test(swap.manifestId) ? swap.manifestId : null;
        return {
            authoredId: swap.authoredId,
            field: typeof swap.field === 'string' ? swap.field : '',
            replacementId: swap.replacementId,
            manifestId,
        };
    }

    function parseMepStateMessage(event) {
        if (!isBridgeEvent(event)) return null;
        let parsed;
        try {
            parsed = JSON.parse(event.data.state);
        } catch {
            return null;
        }
        if (!parsed || !Array.isArray(parsed.swaps)) return null;
        return {
            preview: parsed.preview === true,
            swaps: parsed.swaps.map(sanitizeSwap).filter(Boolean),
        };
    }

    function normalizeField(field) {
        return String(field ?? '').replace(/\[[^\]]*\]$/, '');
    }

    function findSwap(state, { requestedId, field, resolvedId } = {}) {
        const replacementId = requestedId ?? resolvedId;
        const wanted = normalizeField(field);
        const swap = state?.swaps.find(
            (entry) => entry.replacementId === replacementId && normalizeField(entry.field) === wanted,
        );
        return swap ? { authoredId: swap.authoredId, manifestId: swap.manifestId } : null;
    }

    function readOverrideIds(root = document) {
        return new Set([...root.querySelectorAll(OVERRIDES_SELECTOR)].map((element) => element.getAttribute('fragment')));
    }

    function latest() {
        return latestState;
    }

    // Resolves with the bridge's next reply. The bridge always replies (null on any failure), so there is
    // no timer; callers asking while a reply is pending share it.
    function request() {
        if (pendingState) return pendingState;
        const reply = new Promise((resolve) => {
            settlePending = resolve;
        });
        pendingState = reply;
        window.postMessage({ source: 'mas-ext', type: 'GET_MEP_STATE' }, location.origin);
        return reply;
    }

    function receive(event) {
        if (!isBridgeEvent(event)) return;
        latestState = parseMepStateMessage(event);
        const settle = settlePending;
        pendingState = null;
        settlePending = null;
        settle?.(latestState);
    }

    const MASMepState = { parseMepStateMessage, normalizeField, findSwap, readOverrideIds, latest, request };

    if (typeof window !== 'undefined') {
        window.MASMepState = MASMepState;
        window.addEventListener('message', receive);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MASMepState;
    }
})();
