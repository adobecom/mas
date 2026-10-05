import { isStaticResource, serveStaticResource, recordStaticCacheHit } from './static-resource-cache.js';
import { installRunStaticHar, STATIC_HAR_URLS } from './run-static-har.js';
import { fetchWithRateLimitRetry, isRetryableRead, logRateLimitedResponses, waitForRateLimit } from './rate-limit.js';

const pendingPageRoutes = new WeakMap();
let throttleChain = Promise.resolve();
let lastRequestAt = 0;
let throttleLogged = false;

export async function drainPageRoutes(page) {
    const pending = pendingPageRoutes.get(page);
    if (!pending) return;
    while (pending.size) await Promise.all(pending);
}

/** Drain before unrouteAll: removing handlers can continue other in-flight requests. */
export async function removePageRoutes(page) {
    await drainPageRoutes(page);
    await page.unrouteAll({ behavior: 'wait' });
}

/**
 * Pace EDS requests per worker; aggregate traffic scales with worker count.
 */

/** Default CI cap: 45 rps/worker × 4 workers (studio:3 + docs:1) = 180 rps, under 200 rps EDS limit. */
const DEFAULT_EDS_MAX_RPS = 45;

export function resolveEdsMaxRps() {
    if (process.env.NALA_EDS_THROTTLE_DISABLED === '1') return 0;
    if (process.env.NALA_EDS_MAX_RPS !== undefined && process.env.NALA_EDS_MAX_RPS !== '') {
        const v = Number.parseInt(process.env.NALA_EDS_MAX_RPS, 10);
        return Number.isFinite(v) && v > 0 ? v : 0;
    }
    return DEFAULT_EDS_MAX_RPS;
}

export function isEdsEdgeHost(url) {
    try {
        const { hostname } = new URL(url);
        return (
            hostname.endsWith('.aem.live') ||
            hostname.endsWith('.aem.page') ||
            hostname.endsWith('.hlx.page') ||
            hostname.endsWith('.hlx.live') ||
            hostname === 'aem.live' ||
            hostname === 'mas.adobe.com' ||
            hostname === 'mas.stage.adobe.com'
        );
    } catch {
        return false;
    }
}

/**
 * Space upstream EDS requests within each worker.
 * @param {number} maxRps
 */
export function throttleEdsGap(maxRps, url) {
    const minGapMs = 1000 / maxRps;
    const next = throttleChain.then(async () => {
        const now = Date.now();
        const wait = Math.max(0, Math.ceil(minGapMs - (now - lastRequestAt)));
        if (wait > 0) {
            await new Promise((r) => setTimeout(r, wait));
        }
        await waitForRateLimit(url);
        lastRequestAt = Date.now();
    });

    throttleChain = next;
    return next;
}

export function logEdsThrottleOnce(edsMaxRps) {
    if (edsMaxRps <= 0 || throttleLogged) return;
    throttleLogged = true;
    console.info(
        `[NALA] EDS request pacing ~${edsMaxRps} rps per worker for EDS / Helix hosts. ` +
            `NALA_EDS_THROTTLE_DISABLED=1 disables; NALA_EDS_MAX_RPS sets cap. Pacing is multiplied by worker count.\n`,
    );
}

/**
 * Register a route handler that paces EDS-bound requests (auth / any page without GlobalRequestCounter).
 * @param {import('@playwright/test').Page} page
 */
export async function installEdsThrottleOnPage(page, { replayHar = true, cache = true, nativeCooldowns = true } = {}) {
    if (pendingPageRoutes.has(page)) return;
    const edsMaxRps = resolveEdsMaxRps();
    const cacheEnabled = cache && process.env.NALA_STATIC_CACHE_DISABLED !== '1';
    const pending = new Set();
    pendingPageRoutes.set(page, pending);
    logRateLimitedResponses(page, nativeCooldowns);
    logEdsThrottleOnce(edsMaxRps);
    const handleRoute = async (route) => {
        const url = route.request().url();
        const pace = async (enforceCooldown = nativeCooldowns) => {
            if (edsMaxRps > 0 && isEdsEdgeHost(url)) {
                await throttleEdsGap(edsMaxRps, url);
            } else if (enforceCooldown) {
                await waitForRateLimit(url);
            }
        };
        if (await isStaticResource(route.request())) {
            if (cacheEnabled) {
                await serveStaticResource(route, () => pace(true));
            } else {
                const response = await fetchWithRateLimitRetry(route, () => pace(true));
                try {
                    await route.fulfill({ response });
                } finally {
                    await response.dispose();
                }
            }
            return;
        }
        if (nativeCooldowns && (await isRetryableRead(route.request()))) {
            let response;
            try {
                response = await fetchWithRateLimitRetry(route, pace);
            } catch (error) {
                const message = error.message.split('\n')[0];
                const networkFailure = message.match(
                    /\b(?:ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT)\b|socket hang up|Timeout \d+ms exceeded/,
                )?.[0];
                if (!message.startsWith('route.fetch:') || !networkFailure) throw error;
                const { origin, pathname } = new URL(url);
                console.warn(`[NALA] GET network failure ${origin}${pathname}: ${networkFailure}; returning a failed request.`);
                await route.abort('failed');
                return;
            }
            try {
                await route.fulfill({ response });
            } finally {
                await response.dispose();
            }
            return;
        }
        await pace();
        await route.continue();
    };
    const trackRoute = (handler) => async (route) => {
        const operation = handler(route);
        pending.add(operation);
        try {
            await operation;
        } finally {
            pending.delete(operation);
        }
    };
    await page.route('**/*', trackRoute(handleRoute));
    if (cacheEnabled && replayHar) {
        const harUrls = await installRunStaticHar(page);
        if (harUrls.size) {
            await page.route(
                STATIC_HAR_URLS,
                trackRoute(async (route) => {
                    if (harUrls.has(route.request().url()) && (await isStaticResource(route.request()))) {
                        recordStaticCacheHit();
                        await route.fallback();
                    } else {
                        await handleRoute(route);
                    }
                }),
            );
        }
    }
}
