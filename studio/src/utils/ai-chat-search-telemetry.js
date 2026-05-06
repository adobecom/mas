/**
 * Dark-launch flag and telemetry for the deterministic search router.
 *
 * The router is hidden behind `localStorage.masChatDeterministicSearch` so it
 * can be turned on per-user during the rollout window. Once we have a week of
 * dual-classify telemetry confirming the router agrees with the LLM where it
 * fires, the default flips to "on" and the flag is removed.
 */

const FLAG_KEY = 'masChatDeterministicSearch';

export function isDeterministicSearchEnabled() {
    if (typeof localStorage === 'undefined') return false;
    try {
        return localStorage.getItem(FLAG_KEY) === 'on';
    } catch {
        return false;
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
