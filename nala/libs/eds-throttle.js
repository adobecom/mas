/**
 * Pace requests to EDS / Helix preview hosts (~200 rps tenant limit).
 *
 * Throttle state is per Playwright *worker process*. Multiple workers each run their own chain,
 * so effective RPS to the same hostname is multiplied — use workers=1 on CI (see playwright.config.js).
 *
 * Auth setup loads studio.html before GlobalRequestCounter runs; call installEdsThrottleOnPage(page)
 * there so the first navigation is paced too.
 */

/** Default CI cap under 200 rps with headroom for edge burst rules. */
const DEFAULT_CI_EDS_MAX_RPS = 45;

export function resolveEdsMaxRps() {
    if (process.env.NALA_EDS_THROTTLE_DISABLED === '1') return 0;
    if (process.env.NALA_EDS_MAX_RPS !== undefined && process.env.NALA_EDS_MAX_RPS !== '') {
        const v = Number.parseInt(process.env.NALA_EDS_MAX_RPS, 10);
        return Number.isFinite(v) && v > 0 ? v : 0;
    }
    return process.env.CI === 'true' ? DEFAULT_CI_EDS_MAX_RPS : 0;
}

export function isEdsEdgeHost(url) {
    try {
        const { hostname } = new URL(url);
        return (
            hostname.endsWith('.aem.live') ||
            hostname.endsWith('.hlx.page') ||
            hostname.endsWith('.hlx.live') ||
            hostname === 'aem.live'
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
        `[NALA] EDS request pacing ~${edsMaxRps} rps per worker for .aem.live / hlx hosts. ` +
            `NALA_EDS_THROTTLE_DISABLED=1 disables; NALA_EDS_MAX_RPS sets cap. Use one Playwright worker on CI so pacing is not multiplied.\n`,
    );
}

/**
 * Register a route handler that paces EDS-bound requests (auth / any page without GlobalRequestCounter).
 * @param {import('@playwright/test').Page} page
 */
export async function installEdsThrottleOnPage(page) {
    const edsMaxRps = resolveEdsMaxRps();
    if (edsMaxRps <= 0) return;
    logEdsThrottleOnce(edsMaxRps);
    await page.route('**/*', async (route) => {
        const url = route.request().url();
        if (isEdsEdgeHost(url)) {
            await throttleEdsGap(edsMaxRps);
        }
        await route.continue();
    });
}
