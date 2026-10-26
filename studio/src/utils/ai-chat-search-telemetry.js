/**
 * Feature flag and telemetry for the deterministic search router.
 *
 * The router is on by default. `localStorage.masChatDeterministicSearch = 'off'`
 * provides an emergency opt-out for rollback without a redeploy. Telemetry
 * still records `source: router` vs `source: llm` so we can monitor real usage.
 */

const FLAG_KEY = 'masChatDeterministicSearch';

export function isDeterministicSearchEnabled() {
    if (typeof localStorage === 'undefined') return true;
    try {
        return localStorage.getItem(FLAG_KEY) !== 'off';
    } catch {
        return true;
    }
}

/**
 * Push a single classification event to the global dataLayer (if present).
 * No-op when dataLayer is unavailable, so this is safe to call from any
 * environment.
 */
export function recordSearchIntentTelemetry({ source, intent, confidence, tool }) {
    if (typeof window === 'undefined') return;
    const layer = window.dataLayer;
    if (!Array.isArray(layer)) return;
    layer.push({
        event: 'mas-chat-search',
        source,
        intent: intent || 'unknown',
        confidence: typeof confidence === 'number' ? confidence : 0,
        tool: tool || null,
    });
}
