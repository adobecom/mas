/**
 * Single network guard for all Nala browser traffic: proactive RPS pacing for the two named,
 * budgeted systems (EDS/Helix preview hosts, ODIN AEM author/preview hosts) PLUS generic reactive
 * throttle-response (429, and by default 503/529) handling for ANY host any test talks to.
 *
 * All shards/jobs now use ONE shared User-Agent (see playwright.config.js) — there is no more
 * per-shard/per-run UA differentiation. That means the "20 rps per UA" ODIN budget and the
 * "200 rps" EDS budget are both genuinely GLOBAL, single pools shared by every worker and every
 * shard — not per-runner pools. Static pacing below divides the budget by NALA_TOTAL_WORKERS (see
 * playwright.config.js / nala-execution.yml), which assumes a KNOWN, fixed total worker count.
 * That assumption only holds if at most one full Nala workflow run is active repo-wide at a time
 * — see the repo-wide `concurrency:` block at the top of nala-execution.yml, which enforces
 * exactly that (queues, rather than runs concurrently, any other PR's full run).
 *
 * Static pacing keeps normal-case traffic under budget proactively. Reactive throttle handling is
 * a LOCAL (in-process only) safety net for whatever the static pacing didn't account for (bursts,
 * a lower limit than assumed, etc.) — on any throttle-like response, this worker process pauses
 * ITS OWN further calls to that domain for Retry-After (or 60s default). There is deliberately no
 * cross-worker/cross-job/cross-run coordination (e.g. via `gh` CLI + repo variables) — that
 * required a PAT with elevated repo permissions (GITHUB_TOKEN cannot write repo Variables, ever,
 * regardless of settings) and was judged not worth the ongoing maintenance burden for the
 * marginal benefit, given static pacing is already conservative and only one run is ever active
 * at a time. A sibling worker or job not immediately learning about another's 429 is an accepted
 * trade-off: an isolated 429 is far more likely transient burstiness than sustained overage.
 *
 * Override env vars:
 *   NALA_EDS_THROTTLE_DISABLED=1     disable EDS proactive pacing
 *   NALA_EDS_MAX_RPS=<n>             force a specific per-worker EDS cap
 *   NALA_ODIN_MAX_RPS=<n>            force a specific TOTAL (not per-worker) ODIN cap (default 20)
 *   NALA_429_DEFAULT_PAUSE_MS=<n>    default pause when a 429 has no Retry-After (default 60000)
 *   NALA_THROTTLE_STATUS_CODES=<csv> status codes treated as throttle-like (default "429,503,529")
 */

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
 * Wait out any active local pause for a domain (set by a prior 429/503/529 in this same worker
 * process). Re-checks periodically in case the pause is extended while waiting.
 * @param {string} domainKey
 */
export async function waitIfPaused(domainKey) {
    for (;;) {
        const pauseUntil = localPauseUntil.get(domainKey) ?? 0;
        const remaining = pauseUntil - Date.now();
        if (remaining <= 0) return;
        console.info(`[NALA] Waiting ${Math.ceil(remaining / 1000)}s — "${domainKey}" is paused after a 429.\n`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, Math.min(remaining, 5000)));
    }
}

/**
 * Handle a throttle-like response (429, and by default also 503/529 — some CDN/edge stacks use
 * non-standard codes like 529 "site is overloaded" for the same underlying condition) for a
 * domain: parse Retry-After, log it, and pause this process's further calls to that domain.
 * @param {string} domainKey
 * @param {string} url the request URL that got the throttle-like response (for logging)
 * @param {string|null} retryAfterHeader
 * @param {number} status the actual HTTP status code observed (for logging only)
 */
export async function reportThrottled(domainKey, url, retryAfterHeader, status = 429) {
    const delayMs = parseRetryAfterMs(retryAfterHeader);
    const pauseUntil = Date.now() + delayMs;
    const existingLocal = localPauseUntil.get(domainKey) ?? 0;
    localPauseUntil.set(domainKey, Math.max(existingLocal, pauseUntil));

    if (!retryAfterHeader) {
        console.warn(
            `[NALA] ${status} response from "${domainKey}" (${url}) had NO Retry-After header — a well-behaved ` +
                `429/503/529 SHOULD include one (seconds, per RFC 9110 §10.2.3). Falling back to the default ` +
                `pause (${Math.round(DEFAULT_429_PAUSE_MS / 1000)}s, override via NALA_429_DEFAULT_PAUSE_MS). ` +
                `Consider flagging this to the backend/CDN team so pause durations can be precise instead of guessed.\n`,
        );
    }
    const source = retryAfterHeader
        ? `Retry-After=${retryAfterHeader}${/^\d+$/.test(String(retryAfterHeader).trim()) ? 's' : ' (HTTP-date)'}`
        : 'no Retry-After header, using default';
    console.warn(
        `[NALA] ${status} response from "${domainKey}" (${url}). Pausing this worker's calls to "${domainKey}" for ` +
            `~${Math.round(delayMs / 1000)}s (${source}).\n`,
    );
}

/** Status codes treated as "throttle-like" — i.e. worth pausing the domain over, not just
 * logging. Configurable via NALA_THROTTLE_STATUS_CODES (comma-separated), default 429/503/529. */
const DEFAULT_THROTTLE_STATUS_CODES = [429, 503, 529];
function resolveThrottleStatusCodes() {
    const raw = process.env.NALA_THROTTLE_STATUS_CODES;
    if (!raw) return DEFAULT_THROTTLE_STATUS_CODES;
    const codes = raw
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter(Number.isFinite);
    return codes.length ? codes : DEFAULT_THROTTLE_STATUS_CODES;
}

/** Truncate a response body for logging so a huge HTML error page doesn't flood CI logs. */
const BODY_LOG_LIMIT = 500;

/**
 * Log full diagnostic detail for a throttle-like response: timestamp, worker id, method, url,
 * status, key headers, and a truncated body snippet (best-effort — reading the body can itself
 * fail for some response types, which is caught and noted rather than thrown).
 * @param {import('@playwright/test').Response} response
 */
async function logResponseDetails(response) {
    const request = response.request();
    const headers = response.headers();
    const workerId = process.env.TEST_WORKER_INDEX ?? process.env.TEST_PARALLEL_INDEX ?? '?';
    let bodySnippet = '<unavailable>';
    try {
        const body = await response.text();
        bodySnippet = body.length > BODY_LOG_LIMIT ? `${body.slice(0, BODY_LOG_LIMIT)}… (truncated)` : body;
    } catch (error) {
        bodySnippet = `<failed to read body: ${error.message}>`;
    }
    console.warn(
        `[NALA] THROTTLE RESPONSE DETECTED\n` +
            `  time:        ${new Date().toISOString()}\n` +
            `  worker:      ${workerId}\n` +
            `  method/url:  ${request.method()} ${response.url()}\n` +
            `  status:      ${response.status()} ${response.statusText()}\n` +
            `  retry-after: ${headers['retry-after'] ?? '<none>'}\n` +
            `  server:      ${headers.server ?? '<none>'}\n` +
            `  cf-ray:      ${headers['cf-ray'] ?? '<none>'}\n` +
            `  content-type:${headers['content-type'] ?? '<none>'}\n` +
            `  body:        ${bodySnippet}\n`,
    );
}

/** Log the pacing-active summary once per WORKER PROCESS, not once per browser context/test — a
 * job with N workers otherwise reprints this N× per test, which reads as noisy duplication even
 * though it's really "N independent processes each announcing their own pacing once". Gate on
 * worker index 0 so a job's console output shows exactly one line per domain, not one per worker. */
function logThrottleStartOnce(domainKey, maxRps, budgetLabel) {
    const key = `${domainKey}:${maxRps}`;
    if (maxRps <= 0 || loggedThrottleStart.has(key)) return;
    const workerIndex = process.env.TEST_WORKER_INDEX;
    if (workerIndex !== undefined && workerIndex !== '0') return;
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
 * Watch a page's responses for throttle-like statuses (429/503/529 by default, see
 * NALA_THROTTLE_STATUS_CODES) on ANY host: always logs full diagnostic detail, and triggers
 * reportThrottled() to pause + broadcast. Also watches 'requestfailed' for connection-level
 * blocks (TCP reset, aborted connection, etc.) that never produce an HTTP response at all — a
 * WAF/CDN under load may drop the connection instead of returning a proper 429/503/529, in which
 * case 'response' never fires and only 'requestfailed' does. These are logged (with the
 * network-level error text) but NOT treated as a throttle signal on their own (no Retry-After to
 * honor, and plenty of legitimate causes — e.g. a test navigating away mid-request — produce the
 * same event), so they don't trigger reportThrottled()/pausing.
 * Call this explicitly for pages that exist before installNetworkGuard(context) runs
 * (context.on('page') only covers pages created after that call).
 * @param {import('@playwright/test').Page} page
 */
export function attachResponseWatcher(page) {
    page.on('response', (response) => {
        const status = response.status();
        if (!resolveThrottleStatusCodes().includes(status)) return;
        const domainKey = domainKeyFor(response.url());
        const retryAfter = response.headers()['retry-after'] ?? null;
        logResponseDetails(response).catch(() => {});
        reportThrottled(domainKey, response.url(), retryAfter, status).catch((error) => {
            console.warn(`[NALA] Error while handling ${status} for "${domainKey}": ${error.message}\n`);
        });
    });

    page.on('requestfailed', (request) => {
        const domainKey = domainKeyFor(request.url());
        const failure = request.failure();
        const errorText = failure ? failure.errorText : '<unknown>';

        // 'requestfailed' fires very often for benign reasons (e.g. a navigation cancels an
        // in-flight request with net::ERR_ABORTED) — only surface this for the two budgeted
        // systems, or for errors that actually look like a connection-level block/reset (as
        // opposed to a routine cancel), to avoid drowning the throttle signal in noise.
        const looksLikeConnectionBlock = /ERR_CONNECTION|ERR_HTTP2|ERR_EMPTY_RESPONSE|ERR_TIMED_OUT|ERR_NETWORK_CHANGED|ERR_FAILED/.test(
            errorText,
        );
        if (domainKey !== 'eds' && domainKey !== 'odin' && !looksLikeConnectionBlock) return;

        const workerId = process.env.TEST_WORKER_INDEX ?? process.env.TEST_PARALLEL_INDEX ?? '?';
        console.warn(
            `[NALA] REQUEST FAILED (no HTTP response — possible connection-level block, e.g. a WAF/CDN ` +
                `resetting the connection instead of returning 429/503/529 — this is diagnostic-only, ` +
                `no Retry-After is available so no pause is triggered from this alone)\n` +
                `  time:        ${new Date().toISOString()}\n` +
                `  worker:      ${workerId}\n` +
                `  domain key:  ${domainKey}\n` +
                `  method/url:  ${request.method()} ${request.url()}\n` +
                `  error:       ${errorText}\n`,
        );
    });
}

