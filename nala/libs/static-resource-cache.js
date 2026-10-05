import { fetchWithRateLimitRetry } from './rate-limit.js';

const resources = new Map();
const metrics = { cacheHits: 0, upstreamRequests: 0 };
const MAX_ENTRIES = 256;
const MAX_BODY_BYTES = 256 * 1024;
export const VARY_HEADERS = ['accept', 'accept-language', 'origin', 'user-agent', 'accept-encoding'];

export function isPublicStaticResponse(status, headers) {
    return (
        status === 200 &&
        !headers['set-cookie'] &&
        !/no-store|private/i.test(headers['cache-control'] || '') &&
        (headers.vary || '')
            .toLowerCase()
            .split(',')
            .every((name) => !name.trim() || VARY_HEADERS.includes(name.trim()))
    );
}

/**
 * Restrict replay to public code/assets, never documents or service responses.
 */
export async function isStaticResource(request) {
    const url = new URL(request.url());
    const publicHost =
        /\.(aem\.live|aem\.page|hlx\.live|hlx\.page)$/.test(url.hostname) ||
        url.hostname === 'milo.adobe.com' ||
        url.hostname === 'mas.adobe.com' ||
        url.hostname === 'mas.stage.adobe.com' ||
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1';
    const eligible =
        publicHost &&
        request.method() === 'GET' &&
        ['script', 'stylesheet', 'font', 'image'].includes(request.resourceType()) &&
        /\.(js|css|woff2?|ttf|otf|png|jpe?g|gif|webp|svg|avif)$/.test(url.pathname);
    if (!eligible) return false;
    const headers = await request.allHeaders();
    return !headers.authorization && !headers.cookie;
}

/**
 * Snapshot counters so a test can distinguish upstream traffic from cache hits.
 */
export function getResourceMetrics() {
    return { ...metrics };
}

export function recordStaticCacheHit() {
    metrics.cacheHits++;
}

/**
 * Share successful static responses and in-flight loads within one worker only.
 */
export async function serveStaticResource(route, beforeFetch) {
    const request = route.request();
    const requestHeaders = await request.allHeaders();
    const key = JSON.stringify([request.url(), ...VARY_HEADERS.map((name) => requestHeaders[name])]);
    const fetchResource = async () => {
        const response = await fetchWithRateLimitRetry(route, async () => {
            await beforeFetch();
            metrics.upstreamRequests++;
        });
        try {
            const headers = response.headers();
            const body = await response.body();
            delete headers['content-encoding'];
            delete headers['content-length'];
            delete headers['transfer-encoding'];
            const cacheable = body.length <= MAX_BODY_BYTES && isPublicStaticResponse(response.status(), headers);
            return { result: { status: response.status(), headers, body }, cacheable };
        } finally {
            await response.dispose();
        }
    };
    let pending = resources.get(key);
    const shared = !!pending;
    if (!pending) {
        pending = fetchResource();
        if (resources.size >= MAX_ENTRIES) resources.delete(resources.keys().next().value);
        resources.set(key, pending);
    }
    try {
        let response = await pending;
        if (!response.cacheable) {
            if (resources.get(key) === pending) resources.delete(key);
            if (shared) response = await fetchResource();
        } else if (shared) {
            metrics.cacheHits++;
        }
        await route.fulfill(response.result);
    } catch (error) {
        if (resources.get(key) === pending) resources.delete(key);
        throw error;
    }
}
