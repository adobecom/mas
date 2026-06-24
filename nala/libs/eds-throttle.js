/**
 * Pace requests to EDS / Helix preview hosts (~200 rps tenant limit).
 *
 * Throttle state is per Playwright *worker process*. Multiple workers each run their own chain,
 * so effective RPS to the same hostname is multiplied.
 * playwright.config.js sets NALA_WORKER_COUNT so per-worker RPS is derived automatically:
 *   perWorkerRps = floor(180 / workers)  e.g. 4 workers → 45 rps each → 180 rps combined
 * Override env vars:
 *   NALA_EDS_THROTTLE_DISABLED=1   disable entirely
 *   NALA_EDS_MAX_RPS=<n>           force a specific per-worker cap
 */

/** Combined RPS budget with headroom under the 200 rps/hostname tenant limit. */
const EDS_SAFE_TOTAL_RPS = 180;

/** Maximum RPS a single worker should ever use, regardless of how few workers are running. */
const EDS_MAX_RPS_PER_WORKER = 45;

export function resolveEdsMaxRps() {
    if (process.env.NALA_EDS_THROTTLE_DISABLED === '1') return 0;
    if (process.env.NALA_EDS_MAX_RPS !== undefined && process.env.NALA_EDS_MAX_RPS !== '') {
        const v = Number.parseInt(process.env.NALA_EDS_MAX_RPS, 10);
        if (Number.isFinite(v) && v > 0) return v;
        console.warn(
            `[NALA] NALA_EDS_MAX_RPS="${process.env.NALA_EDS_MAX_RPS}" is not a positive integer — ignoring, falling back to worker-derived default.\n`,
        );
    }
    const workers = Number.parseInt(process.env.NALA_WORKER_COUNT ?? '1', 10);
    const n = Number.isFinite(workers) && workers > 0 ? workers : 1;
    return Math.min(Math.floor(EDS_SAFE_TOTAL_RPS / n), EDS_MAX_RPS_PER_WORKER);
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

export function isOdinHost(url) {
    try {
        const { hostname } = new URL(url);
        return (
            hostname.endsWith('adobeaemcloud.com') || hostname === 'odinpreview.corp.adobe.com' || hostname === 'odin.adobe.com'
        );
    } catch {
        return false;
    }
}

/** Separate throttle chain for ODIN (AEM author + preview) — independent of EDS chain. */
export function throttleOdinGap(maxRps) {
    const minGapMs = 1000 / maxRps;
    if (!globalThis.odinThrottleChain) {
        globalThis.odinThrottleChain = Promise.resolve();
    }

    const next = globalThis.odinThrottleChain.then(async () => {
        const last = globalThis.odinThrottleLastContinueAt ?? 0;
        const now = Date.now();
        const wait = Math.max(0, minGapMs - (now - last));
        if (wait > 0) {
            await new Promise((r) => setTimeout(r, wait));
        }
        globalThis.odinThrottleLastContinueAt = Date.now();
    });

    globalThis.odinThrottleChain = next.catch(() => {});
    return next;
}

export function throttleEdsGap(maxRps) {
    const minGapMs = 1000 / maxRps;
    if (!globalThis.edsThrottleChain) {
        globalThis.edsThrottleChain = Promise.resolve();
    }

    const next = globalThis.edsThrottleChain.then(async () => {
        const last = globalThis.edsThrottleLastContinueAt ?? 0;
        const now = Date.now();
        const wait = Math.max(0, minGapMs - (now - last));
        if (wait > 0) {
            await new Promise((r) => setTimeout(r, wait));
        }
        globalThis.edsThrottleLastContinueAt = Date.now();
    });

    globalThis.edsThrottleChain = next.catch(() => {});
    return next;
}

export function logEdsThrottleOnce(edsMaxRps) {
    if (edsMaxRps <= 0 || globalThis.edsThrottleLogged) return;
    globalThis.edsThrottleLogged = true;
    const workers = process.env.NALA_WORKER_COUNT ?? '?';
    console.info(
        `[NALA] EDS throttle active: ~${edsMaxRps} rps/worker × ${workers} workers = ` +
            `~${edsMaxRps * Number(workers || 1)} rps combined (budget ${EDS_SAFE_TOTAL_RPS}). ` +
            'Set NALA_EDS_THROTTLE_DISABLED=1 to disable or NALA_EDS_MAX_RPS to override.\n',
    );
}

/**
 * Register a route handler that paces EDS-bound requests on a Playwright browser context.
 * Covers all pages in the context, including those created after this call.
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function installEdsThrottleOnContext(context) {
    const edsMaxRps = resolveEdsMaxRps();
    if (edsMaxRps <= 0) return;
    logEdsThrottleOnce(edsMaxRps);
    await context.route('**/*', async (route) => {
        if (isEdsEdgeHost(route.request().url())) {
            await throttleEdsGap(edsMaxRps);
        }
        await route.continue();
    });
}
