import { HEADER_X_REQUEST_ID } from '../../../web-components/src/constants.js';
import Events from '../events.js';
import { logToLana } from './lana-logger.js';

export const SLOW_REQUEST_THRESHOLD_MS = 5000;

export const REQUEST_TYPE = { GET: 'get', SAVE: 'save', PUBLISH: 'publish', DELETE: 'delete', CHAT: 'chat' };

const LANA_SAMPLE_RATE = 100;
const UNKNOWN_REQUEST_ID = 'unknown';
const READ_URL_PATTERNS = ['/bulk-publish-access', '/listMembers'];
const PUBLISH_URL_PATTERNS = ['/publish', '/bulk-publish', '/bulk-revert'];

function isDeleteForm(body) {
    return body instanceof FormData && body.get(':operation') === 'delete';
}

export function classifyRequest(url, method, body) {
    if (url.includes('/ai-chat')) return REQUEST_TYPE.CHAT;
    if (method === 'GET' || method === 'HEAD') return REQUEST_TYPE.GET;
    if (method === 'DELETE' || isDeleteForm(body)) return REQUEST_TYPE.DELETE;
    if (READ_URL_PATTERNS.some((pattern) => url.includes(pattern))) return REQUEST_TYPE.GET;
    if (PUBLISH_URL_PATTERNS.some((pattern) => url.includes(pattern))) return REQUEST_TYPE.PUBLISH;
    return REQUEST_TYPE.SAVE;
}

export function createTrackedFetch({ fetch, log, warn, now = () => performance.now() }) {
    let hasWarned = false;

    function report(input, options, durationMs, response, error) {
        if (durationMs <= SLOW_REQUEST_THRESHOLD_MS || error?.name === 'AbortError') return;
        const url = input.url ?? String(input);
        const method = (options?.method ?? input.method ?? 'GET').toUpperCase();
        const domain = new URL(url, window.location.href).hostname;
        const requestType = classifyRequest(url, method, options?.body);
        const requestId = response?.headers.get(HEADER_X_REQUEST_ID) ?? UNKNOWN_REQUEST_ID;
        log({
            domain,
            durationMs: Math.round(durationMs),
            requestType,
            method,
            requestId,
            ...(response && { status: response.status }),
            ...(error && { error: error.name }),
        });
        if (hasWarned || requestType === REQUEST_TYPE.CHAT) return;
        hasWarned = true;
        warn(
            `${domain} took longer than ${SLOW_REQUEST_THRESHOLD_MS / 1000} seconds to respond - expect slowness. Request Id: ${requestId}`,
        );
    }

    return async function trackedFetch(input, options) {
        const start = now();
        let response;
        let error;
        try {
            response = await fetch(input, options);
            return response;
        } catch (err) {
            error = err;
            throw err;
        } finally {
            try {
                report(input, options, now() - start, response, error);
            } catch {
                // Reporting must never change the outcome of the request.
            }
        }
    };
}

export function startNetworkLatencyMonitor() {
    window.fetch = createTrackedFetch({
        fetch: window.fetch.bind(window),
        log: (facts) => logToLana('Slow Studio network request', facts, LANA_SAMPLE_RATE),
        warn: (message) => Events.toast.emit({ variant: 'warning', content: message, persistent: true }),
    });
}
