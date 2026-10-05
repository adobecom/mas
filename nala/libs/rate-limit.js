import { coordinateRateLimit, isPreviewOrigin } from './rate-limit-coordinator.js';

const loggedRequests = new WeakSet();
const metrics = new Map();
const retryCounts = new Map();
const pendingReports = new Set();
let coordinatorError;

function originMetrics(url) {
    const { origin } = new URL(url);
    if (!metrics.has(origin)) metrics.set(origin, { responses429: 0, retries: 0, waitMs: 0 });
    return metrics.get(origin);
}

export function getRateLimitMetrics() {
    return Object.fromEntries([...metrics].map(([origin, counts]) => [origin, { ...counts }]));
}

export function getReadRetryCounts() {
    return new Map(retryCounts);
}

export function retryAfterMs(value, now = Date.now()) {
    if (!value?.trim()) return 10000;
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return seconds >= 0 ? seconds * 1000 : 10000;
    const date = Date.parse(value);
    return Number.isFinite(date) ? Math.max(0, date - now) : 10000;
}

async function logRateLimit(request, headers, applyCooldown = true) {
    const { origin, pathname } = new URL(request.url());
    const delay = retryAfterMs(headers['retry-after']);
    originMetrics(request.url()).responses429++;
    loggedRequests.add(request);
    console.warn(
        `[NALA] HTTP 429 ${request.method()} ${origin}${pathname}; ` +
            `Retry-After: ${headers['retry-after'] || 'missing/empty (10s fallback)'}; ` +
            `${applyCooldown ? `cooldown ${delay / 1000}s` : 'logging only (no Nala cooldown)'}.`,
    );
    if (applyCooldown) await coordinateRateLimit('cooldown', origin, Date.now() + delay);
}

export function logRateLimitedResponses(page, applyCooldown = true) {
    page.on('response', (response) => {
        if (response.status() === 429 && !loggedRequests.has(response.request())) {
            const report = logRateLimit(response.request(), response.headers(), applyCooldown);
            pendingReports.add(report);
            report.then(
                () => pendingReports.delete(report),
                (error) => {
                    coordinatorError = error;
                    console.error(`[NALA] Failed to share HTTP 429 cooldown: ${error.message}`);
                },
            );
        }
    });
}

export async function waitForRateLimit(url, { reservePreview = true } = {}) {
    const { origin } = new URL(url);
    if (coordinatorError) throw coordinatorError;
    await Promise.all(pendingReports);
    if (!reservePreview && isPreviewOrigin(url)) return;
    const waitMs = await coordinateRateLimit('wait', origin);
    if (waitMs > 0) originMetrics(url).waitMs += waitMs;
}

/** Fetch/XHR GETs are read-only; exclude streams, ranges and authentication endpoints. */
export async function isRetryableRead(request) {
    if (request.method() !== 'GET' || !['fetch', 'xhr'].includes(request.resourceType())) return false;
    const { pathname } = new URL(request.url());
    if (/\/(?:signin|signout|login|logout|authorize|oauth)(?:\/|$)/i.test(pathname)) return false;
    const headers = await request.allHeaders();
    return !headers.range && !headers.accept?.includes('text/event-stream');
}

/** Retry an eligible GET once; return persistent 429s unchanged, never replay writes. */
export async function fetchWithRateLimitRetry(route, beforeFetch) {
    for (let attempt = 0; attempt < 2; attempt++) {
        await beforeFetch();
        const request = route.request();
        const url = new URL(request.url());
        const permit = isPreviewOrigin(request.url())
            ? await coordinateRateLimit('acquire', url.origin, undefined, {
                  path: url.pathname,
                  userAgent: await request.headerValue('user-agent'),
              })
            : null;
        if (permit) originMetrics(request.url()).waitMs += permit.waitMs;
        const started = Date.now();
        let finished;
        let response;
        try {
            response = await route.fetch({ maxRedirects: 0, timeout: permit ? 60000 : undefined });
            finished = Date.now();
            if (response.status() === 429) await logRateLimit(route.request(), response.headers());
        } finally {
            if (permit) {
                await coordinateRateLimit('release', url.origin, undefined, {
                    id: permit.id,
                    status: response?.status() ?? 0,
                    latencyMs: (finished ?? Date.now()) - started,
                });
            }
        }
        if (response.status() !== 429) return response;
        if (attempt === 1 || response.headers()['set-cookie']) return response;
        await response.dispose();
        originMetrics(route.request().url()).retries++;
        const requestUrl = route.request().url();
        retryCounts.set(requestUrl, (retryCounts.get(requestUrl) ?? 0) + 1);
        const { origin, pathname } = new URL(route.request().url());
        console.info(`[NALA] Retrying GET ${origin}${pathname} once after the origin cooldown.`);
    }
}
