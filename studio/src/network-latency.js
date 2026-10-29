import { showToast } from './utils.js';
import { HEADER_X_REQUEST_ID } from '../../web-components/src/constants.js';

/**
 * Studio network requests slower than this are logged to Lana and surfaced via a warning toast.
 */
export const SLOW_REQUEST_THRESHOLD_MS = 5000;

/**
 * Classification buckets used to group Studio network requests in Lana logs.
 */
export const REQUEST_TYPE = {
    GET: 'GET',
    SAVE: 'save',
    PUBLISH: 'publish',
    DELETE: 'delete',
};

const DELETE_URL_PATTERNS = ['deleteAndUnpublish', ':operation=delete', 'cmd=deletePage'];
const PUBLISH_URL_PATTERNS = ['/publish', 'unpublish', '/bulk-publish', '/bulk-revert', '/bulk-publish-reset'];

/**
 * Classifies a Studio network request by URL and HTTP method into one of REQUEST_TYPE,
 * so slow-request Lana logs and warnings can report GET / save / publish / delete requests.
 * @param {string} url
 * @param {string} [method]
 * @returns {string} one of REQUEST_TYPE
 */
export function classifyRequest(url, method = 'GET') {
    const upperMethod = method.toUpperCase();
    if (upperMethod === 'GET' || upperMethod === 'HEAD') return REQUEST_TYPE.GET;
    if (upperMethod === 'DELETE' || DELETE_URL_PATTERNS.some((pattern) => url.includes(pattern))) {
        return REQUEST_TYPE.DELETE;
    }
    if (PUBLISH_URL_PATTERNS.some((pattern) => url.includes(pattern))) return REQUEST_TYPE.PUBLISH;
    return REQUEST_TYPE.SAVE;
}

let hasShownSlowRequestToast = false;

/**
 * Clears the once-per-page-load slow-request toast guard. For tests only - Studio
 * itself never needs to show the warning more than once per real page load.
 */
export function resetSlowRequestToastGuard() {
    hasShownSlowRequestToast = false;
}

/**
 * Logs a slow Studio network request to Lana (every time) and shows a warning toast
 * (only the first time per page load). Mirrors the clientId/sampleRate/tags shape
 * already used for Studio Lana logging in utils/corrector-helper.js.
 * @param {{ domain: string, durationMs: number, requestType: string, requestId: string }} report
 */
export function reportSlowRequest({ domain, durationMs, requestType, requestId }) {
    const { pathname, search } = window.location;
    const page = `¶page=${pathname}${search}`;
    const facts = JSON.stringify({ domain, durationMs: Math.round(durationMs), requestType, requestId });
    window.lana?.log(`Slow Studio network request${page}¶facts=${facts}`, {
        clientId: 'merch-at-scale-studio',
        delimiter: '¶',
        sampleRate: 100,
        tags: 'studio',
    });

    if (hasShownSlowRequestToast) return;
    hasShownSlowRequestToast = true;
    showToast(`${domain} took longer than 5 seconds to respond - expect slowness. Request Id: ${requestId}`, 'warning');
}

/**
 * Drop-in replacement for fetch() that measures request duration and, for requests
 * slower than SLOW_REQUEST_THRESHOLD_MS, reports them via reportSlowRequest. Duration
 * is measured in a finally block so a slow failing request is reported too; the
 * original result or rejection is always returned/rethrown unchanged.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function trackedFetch(url, options) {
    const start = performance.now();
    let response;
    try {
        response = await fetch(url, options);
        return response;
    } finally {
        const durationMs = performance.now() - start;
        if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
            const domain = new URL(url, window.location.href).hostname;
            const requestId = response?.headers.get(HEADER_X_REQUEST_ID) ?? 'unknown';
            reportSlowRequest({
                domain,
                durationMs,
                requestType: classifyRequest(url, options?.method),
                requestId,
            });
        }
    }
}
