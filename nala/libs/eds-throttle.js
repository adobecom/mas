import { isStaticResource, serveStaticResource, recordStaticCacheHit } from './static-resource-cache.js';
import { installRunStaticHar, STATIC_HAR_URLS } from './run-static-har.js';

const installedPages = new WeakSet();

/**
 * Pace requests to EDS / Helix preview hosts (~200 rps tenant limit).
 *
 * Throttle state is per Playwright *worker process*. Multiple workers each run their own chain,
 * so effective RPS to the same hostname is multiplied. Keep workflow worker counts
 * and the existing pacing policy aligned; setup caching does not change either.
 *
 * Auth setup loads studio.html before GlobalRequestCounter runs; call installEdsThrottleOnPage(page)
 * there so the first navigation is paced too.
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
 * Serialize route.continue() for EDS hosts with a minimum gap (per worker).
 * @param {number} maxRps
 */
export function throttleEdsGap(maxRps) {
    const minGapMs = 1000 / maxRps;
    if (!globalThis._edsThrottleChain) {
        globalThis._edsThrottleChain = Promise.resolve();
    }

    const next = globalThis._edsThrottleChain.then(async () => {
        const last = globalThis._edsThrottleLastContinueAt ?? 0;
        const now = Date.now();
        const wait = Math.max(0, minGapMs - (now - last));
        if (wait > 0) {
            await new Promise((r) => setTimeout(r, wait));
        }
        globalThis._edsThrottleLastContinueAt = Date.now();
    });

    globalThis._edsThrottleChain = next.catch(() => {});
    return next;
}

export function logEdsThrottleOnce(edsMaxRps) {
    if (edsMaxRps <= 0 || globalThis._edsThrottleLogged) return;
    globalThis._edsThrottleLogged = true;
    console.info(
        `[NALA] EDS request pacing ~${edsMaxRps} rps per worker for EDS / Helix hosts. ` +
            `NALA_EDS_THROTTLE_DISABLED=1 disables; NALA_EDS_MAX_RPS sets cap. Pacing is multiplied by worker count.\n`,
    );
}

/**
 * Register a route handler that paces EDS-bound requests (auth / any page without GlobalRequestCounter).
 * @param {import('@playwright/test').Page} page
 */
export async function installEdsThrottleOnPage(page, { replayHar = true, cache = true } = {}) {
    if (installedPages.has(page)) return;
    const edsMaxRps = resolveEdsMaxRps();
    const cacheEnabled = cache && process.env.NALA_STATIC_CACHE_DISABLED !== '1';
    if (edsMaxRps <= 0 && !cacheEnabled) return;
    installedPages.add(page);
    logEdsThrottleOnce(edsMaxRps);
    const handleRoute = async (route) => {
        const url = route.request().url();
        const pace = async () => {
            if (edsMaxRps > 0 && isEdsEdgeHost(url)) await throttleEdsGap(edsMaxRps);
        };
        if (cacheEnabled && (await isStaticResource(route.request()))) {
            await serveStaticResource(route, pace);
            return;
        }
        await pace();
        await route.continue();
    };
    await page.route('**/*', handleRoute);
    if (cacheEnabled && replayHar) {
        const harUrls = await installRunStaticHar(page);
        if (harUrls.size) {
            await page.route(STATIC_HAR_URLS, async (route) => {
                if (harUrls.has(route.request().url()) && (await isStaticResource(route.request()))) {
                    recordStaticCacheHit();
                    await route.fallback();
                } else {
                    await handleRoute(route);
                }
            });
        }
    }
}
