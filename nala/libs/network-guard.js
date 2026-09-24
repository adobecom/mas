/**
 * Single network guard for all Nala browser traffic: proactive RPS pacing for the two named,
 * budgeted systems (EDS/Helix preview hosts, ODIN AEM author/preview hosts) PLUS generic reactive
 * 429 (Too Many Requests) handling for ANY host any test talks to.
 *
 * All shards/jobs now use ONE shared User-Agent (see playwright.config.js) — there is no more
 * per-shard/per-run UA differentiation. That means the "20 rps per UA" ODIN budget and the
 * "200 rps" EDS budget are both genuinely GLOBAL, single pools shared by every worker, every
 * shard, and (best-effort, see shared-pause-state.js) every concurrent PR run — not per-runner
 * pools. Static pacing below divides the budget by NALA_TOTAL_WORKERS (see playwright.config.js /
 * run-nala.yml), which assumes a KNOWN, fixed total worker count. That assumption only holds if
 * at most one full Nala workflow run is active repo-wide at a time — see the docs-job mutex step
 * in run-nala.yml, which enforces this for the docs job specifically. If multiple full runs (from
 * different PRs) can truly run their studio shards fully concurrently, the static division alone
 * is not sufficient — the reactive 429 handling below (with cross-run pause propagation) is the
 * real safety net for that case, not the static caps.
 *
 * Static pacing keeps normal-case traffic under budget proactively. Reactive 429 handling is the
 * safety net for whatever the static pacing didn't account for (bursts, another run, a lower
 * limit than assumed, etc.) — on any 429, ALL further calls to that domain (from this process,
 * and best-effort every other concurrent run) pause for Retry-After (or 60s default).
 *
 * Override env vars:
 *   NALA_EDS_THROTTLE_DISABLED=1     disable EDS proactive pacing
 *   NALA_EDS_MAX_RPS=<n>             force a specific per-worker EDS cap
 *   NALA_ODIN_MAX_RPS=<n>            force a specific TOTAL (not per-worker) ODIN cap (default 20)
 *   NALA_429_DEFAULT_PAUSE_MS=<n>    default pause when a 429 has no Retry-After (default 60000)
 *   NALA_SHARED_PAUSE_DISABLED=1     disable cross-run pause propagation (local-only pausing)
 */

import { getSharedPauseUntil, reportSharedPause } from './shared-pause-state.js';

/** Combined RPS budget with headroom under the 200 rps/hostname tenant limit. */
const EDS_SAFE_TOTAL_RPS = 180;

/** Maximum RPS a single worker should ever use, regardless of how few workers are running. */
const EDS_MAX_RPS_PER_WORKER = 45;

/** Default pause duration (ms) when a 429 response has no usable Retry-After header. */
const DEFAULT_429_PAUSE_MS = 60000;

/**
 * Resolve the divisor for the shared RPS budgets: prefer NALA_TOTAL_WORKERS (workers across every
 * concurrently-running job sharing this budget — see run-nala.yml); fall back to this job's own
 * local worker count for standalone/local runs where nothing else shares the budget.
 */
export function resolveBudgetDivisor() {
    const total = Number.parseInt(process.env.NALA_TOTAL_WORKERS ?? '', 10);
    if (Number.isFinite(total) && total > 0) return total;
    const local = Number.parseInt(process.env.NALA_WORKER_COUNT ?? '1', 10);
    return Number.isFinite(local) && local > 0 ? local : 1;
}

export function resolveEdsMaxRps() {
    if (process.env.NALA_EDS_THROTTLE_DISABLED === '1') return 0;
    if (process.env.NALA_EDS_MAX_RPS !== undefined && process.env.NALA_EDS_MAX_RPS !== '') {
        const v = Number.parseInt(process.env.NALA_EDS_MAX_RPS, 10);
        if (Number.isFinite(v) && v > 0) return v;
        console.warn(
            `[NALA] NALA_EDS_MAX_RPS="${process.env.NALA_EDS_MAX_RPS}" is not a positive integer — ignoring, falling back to worker-derived default.\n`,
        );
    }
    const n = resolveBudgetDivisor();
    return Math.min(Math.floor(EDS_SAFE_TOTAL_RPS / n), EDS_MAX_RPS_PER_WORKER);
}

export function resolveOdinMaxRps() {
    if (process.env.NALA_EDS_THROTTLE_DISABLED === '1') return 0;
    const totalLimit = Number.parseInt(process.env.NALA_ODIN_MAX_RPS ?? '20', 10);
    const n = resolveBudgetDivisor();
    return Math.max(1, Math.floor((Number.isFinite(totalLimit) && totalLimit > 0 ? totalLimit : 20) / n));
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

/**
 * Classify a URL into a rate-limit domain key: the two named/budgeted systems get a fixed class
 * ("eds"/"odin") so their pacing + reactive pause is shared CI-wide by system, not by exact
 * hostname (each PR branch is technically a different EDS hostname, but the limit is believed to
 * be tenant-wide — see the IP-vs-tenant discussion). Anything else falls back to its own
 * hostname, so 429s from unrelated services (IMS, adobeioruntime, etc.) still get paced/paused,
 * just scoped to that one hostname instead of a shared class.
 */
export function domainKeyFor(url) {
    if (isEdsEdgeHost(url)) return 'eds';
    if (isOdinHost(url)) return 'odin';
    try {
        return new URL(url).hostname;
    } catch {
        return 'unknown';
    }
}

/** Per-worker-process pacing chains, keyed by domain key. Separate chains so pacing one domain
 * never blocks requests to another. */
const throttleChains = new Map();
const throttleLastContinueAt = new Map();

async function throttleGap(domainKey, maxRps) {
    if (!(maxRps > 0)) return;
    const minGapMs = 1000 / maxRps;
    const chain = throttleChains.get(domainKey) ?? Promise.resolve();

    const next = chain.then(async () => {
        const last = throttleLastContinueAt.get(domainKey) ?? 0;
        const wait = Math.max(0, minGapMs - (Date.now() - last));
        if (wait > 0) {
            await new Promise((r) => setTimeout(r, wait));
        }
        throttleLastContinueAt.set(domainKey, Date.now());
    });

    throttleChains.set(
        domainKey,
        next.catch(() => {}),
    );
    return next;
}

/** Local (in-process) "paused until" per domain key, set on a 429 and checked before every request. */
const localPauseUntil = new Map();
const loggedThrottleStart = new Set();

/**
 * Parse a Retry-After header per RFC 9110 §10.2.3: either delta-seconds ("120") or an HTTP-date.
 * @param {string|null|undefined} headerValue
 * @returns {number} milliseconds to wait; falls back to NALA_429_DEFAULT_PAUSE_MS / 60000 if unusable
 */
export function parseRetryAfterMs(headerValue) {
    const defaultMs = (() => {
        const v = Number.parseInt(process.env.NALA_429_DEFAULT_PAUSE_MS ?? '', 10);
        return Number.isFinite(v) && v > 0 ? v : DEFAULT_429_PAUSE_MS;
    })();
    if (!headerValue) return defaultMs;
    const trimmed = String(headerValue).trim();
    if (/^\d+$/.test(trimmed)) {
        const seconds = Number.parseInt(trimmed, 10);
        return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : defaultMs;
    }
    const dateMs = Date.parse(trimmed);
    if (Number.isFinite(dateMs)) {
        const delta = dateMs - Date.now();
        return delta > 0 ? delta : 0;
    }
    return defaultMs;
}

/**
 * Wait out any active pause (local to this process, or reported by another run) for a domain.
 * Re-checks periodically in case the pause is extended while waiting.
 * @param {string} domainKey
 */
export async function waitIfPaused(domainKey) {
    for (;;) {
        const local = localPauseUntil.get(domainKey) ?? 0;
        // eslint-disable-next-line no-await-in-loop
        const shared = await getSharedPauseUntil(domainKey);
        const pauseUntil = Math.max(local, shared);
        const remaining = pauseUntil - Date.now();
        if (remaining <= 0) return;
        console.info(`[NALA] Waiting ${Math.ceil(remaining / 1000)}s — "${domainKey}" is paused after a 429.\n`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, Math.min(remaining, 5000)));
    }
}

/**
 * Handle a 429 response for a domain: parse Retry-After, log it, pause this process's further
 * calls to that domain, and best-effort broadcast the pause to every other concurrent Nala run.
 * @param {string} domainKey
 * @param {string} url the request URL that got the 429 (for logging)
 * @param {string|null} retryAfterHeader
 */
export async function reportThrottled(domainKey, url, retryAfterHeader) {
    const delayMs = parseRetryAfterMs(retryAfterHeader);
    const pauseUntil = Date.now() + delayMs;
    const existingLocal = localPauseUntil.get(domainKey) ?? 0;
    localPauseUntil.set(domainKey, Math.max(existingLocal, pauseUntil));

    const source = retryAfterHeader ? `Retry-After=${retryAfterHeader}` : 'no Retry-After header, using default';
    console.warn(
        `[NALA] 429 Too Many Requests from "${domainKey}" (${url}). Pausing ALL calls to "${domainKey}" for ` +
            `~${Math.round(delayMs / 1000)}s (${source}). Broadcasting pause to other concurrent Nala runs.\n`,
    );

    // Best-effort; never let a broken coordination channel fail/hang the test.
    await reportSharedPause(domainKey, pauseUntil).catch(() => {});
}

function logThrottleStartOnce(domainKey, maxRps, budgetLabel) {
    const key = `${domainKey}:${maxRps}`;
    if (maxRps <= 0 || loggedThrottleStart.has(key)) return;
    loggedThrottleStart.add(key);
    const localWorkers = process.env.NALA_WORKER_COUNT ?? '?';
    const totalWorkers = process.env.NALA_TOTAL_WORKERS ?? localWorkers;
    console.info(
        `[NALA] "${domainKey}" pacing active: ~${maxRps} rps/worker (budget divided across ` +
            `${totalWorkers} total workers) × ${localWorkers} local workers in this job = ` +
            `~${maxRps * Number(localWorkers || 1)} rps from this job (shared budget ${budgetLabel}).\n`,
    );
}

/**
 * Register handlers on a Playwright browser context that:
 *   1. Pace outgoing requests to EDS and ODIN hosts to their static per-worker RPS caps.
 *   2. Before every request to any domain, wait out any active 429 pause (local or shared).
 * Covers all pages in the context, including those created after this call, via context.on('page').
 * Call attachResponseWatcher(page) for any page that already exists BEFORE this call, since
 * context.on('page') only fires for pages created afterwards.
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function installNetworkGuard(context) {
    const edsMaxRps = resolveEdsMaxRps();
    const odinMaxRps = resolveOdinMaxRps();
    logThrottleStartOnce('eds', edsMaxRps, `${EDS_SAFE_TOTAL_RPS} rps`);
    logThrottleStartOnce('odin', odinMaxRps, `${process.env.NALA_ODIN_MAX_RPS ?? '20'} rps`);

    await context.route('**/*', async (route) => {
        const url = route.request().url();
        const domainKey = domainKeyFor(url);

        await waitIfPaused(domainKey);
        if (domainKey === 'eds' && edsMaxRps > 0) await throttleGap('eds', edsMaxRps);
        if (domainKey === 'odin' && odinMaxRps > 0) await throttleGap('odin', odinMaxRps);

        await route.continue();
    });

    context.on('page', (page) => attachResponseWatcher(page));
}

/**
 * Watch a page's responses for 429s on ANY host and trigger reportThrottled(). Call this
 * explicitly for pages that exist before installNetworkGuard(context) runs (context.on('page')
 * only covers pages created after that call).
 * @param {import('@playwright/test').Page} page
 */
export function attachResponseWatcher(page) {
    page.on('response', (response) => {
        if (response.status() !== 429) return;
        const domainKey = domainKeyFor(response.url());
        const retryAfter = response.headers()['retry-after'] ?? null;
        reportThrottled(domainKey, response.url(), retryAfter).catch((error) => {
            console.warn(`[NALA] Error while handling 429 for "${domainKey}": ${error.message}\n`);
        });
    });
}
