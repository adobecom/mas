import { isStaticResource, serveStaticResource, recordStaticCacheHit } from './static-resource-cache.js';
import { installRunStaticHar, STATIC_HAR_URLS } from './run-static-har.js';
import {
    fetchWithRateLimitRetry,
    isReadOnlyRequest,
    isRetryableRead,
    logRateLimitedResponses,
    waitForRateLimit,
} from './rate-limit.js';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { isOdinOrigin, isPreviewOrigin } from './rate-limit-coordinator.js';

const pendingPageRoutes = new WeakMap();
let throttleChain = Promise.resolve();
let lastRequestAt = 0;
let throttleLogged = false;
const UUID_QUERY = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export async function drainPageRoutes(page) {
    const state = pendingPageRoutes.get(page);
    if (!state) return;
    while (state.pending.size) await Promise.all(state.pending);
}

export function getPageRouteMetrics(page) {
    const state = pendingPageRoutes.get(page);
    return {
        cancelledReads: state?.cancelled.size ?? 0,
        applicationCancelledReads: state?.applicationCancelled.size ?? 0,
        foregroundSearchActive: state?.foregroundSearch ?? false,
        foregroundMutationActive: state?.foregroundMutation ?? false,
        coalescedSettingsReads: state?.coalescedSettingsReads ?? 0,
        pendingRoutes: state?.pending.size ?? 0,
        teardownMs: state?.teardownMs ?? 0,
    };
}

async function serveConcurrentSettingsRead(page, route, beforeFetch, options, state) {
    const request = route.request();
    const headers = Object.entries(await request.allHeaders()).sort(([a], [b]) => a.localeCompare(b));
    options.signal.throwIfAborted();
    const key = JSON.stringify([request.url(), headers, state.settingsRequestEpochs.get(request)]);
    let entry = state.settingsReads.get(key);
    if (!entry) {
        entry = { controller: new AbortController(), consumers: new Set() };
        state.settingsReads.set(key, entry);
        const sharedOptions = { ...options, signal: AbortSignal.any([state.controller.signal, entry.controller.signal]) };
        entry.pending = (async () => {
            try {
                const response = await fetchWithRateLimitRetry(route, () => beforeFetch(sharedOptions), sharedOptions);
                try {
                    const headers = response.headers();
                    const body = await response.body();
                    delete headers['content-encoding'];
                    delete headers['content-length'];
                    delete headers['transfer-encoding'];
                    return { status: response.status(), headers, body };
                } finally {
                    await response.dispose();
                }
            } finally {
                if (state.settingsReads.get(key) === entry) state.settingsReads.delete(key);
            }
        })();
    } else {
        state.coalescedSettingsReads++;
        page.emit('nala:coalesced-settings-read', request.url());
    }
    entry.consumers.add(options.signal);
    const release = () => {
        entry.consumers.delete(options.signal);
        if (!entry.consumers.size) {
            entry.controller.abort();
            if (state.settingsReads.get(key) === entry) state.settingsReads.delete(key);
        }
    };
    options.signal.addEventListener('abort', release, { once: true });
    try {
        const response = await entry.pending;
        options.signal.throwIfAborted();
        await route.fulfill(response);
    } finally {
        options.signal.removeEventListener('abort', release);
        release();
    }
}

/** Close only the owned page; preserve author mutations and their creation-ledger responses. */
export async function removePageRoutes(page, beforeClose = async () => {}) {
    const state = pendingPageRoutes.get(page);
    if (!state || state.closing) return;
    const started = Date.now();
    state.closing = true;
    state.controller.abort();
    let timer;
    try {
        // Closing a page can release intercepted requests to the network unless they are aborted first.
        await Promise.all(
            [...state.routes]
                .filter((route) => isReadOnlyRequest(route.request()))
                .map(async (route) => {
                    state.cancelled.add(route.request());
                    try {
                        await route.abort('aborted');
                    } catch (error) {
                        if (!/Route is already handled|Target (?:page|browser|context).*closed/.test(error.message))
                            throw error;
                    }
                }),
        );
        await Promise.race([
            (async () => {
                while (state.mutations.size) await Promise.all([...state.mutations.values()].map(({ done }) => done));
                await beforeClose();
                if (state.errors.length) {
                    throw new AggregateError(
                        state.errors,
                        `Author mutation transport failed:\n${state.errors.map((error) => error.message).join('\n')}`,
                    );
                }
            })(),
            new Promise((resolve, reject) => {
                timer = setTimeout(
                    () => reject(new Error('Author mutations did not settle within the 30s teardown budget')),
                    30000,
                );
            }),
        ]);
    } finally {
        clearTimeout(timer);
        await page.close();
        state.readControllers.clear();
        state.teardownMs = Date.now() - started;
    }
}

/**
 * Pace EDS requests per worker; aggregate traffic scales with worker count.
 */

/** Preserve the local cap; CI divides 180 rps across its fixed runner pool. */
const DEFAULT_EDS_MAX_RPS = 45;

export function resolveEdsMaxRps() {
    if (process.env.NALA_EDS_THROTTLE_DISABLED === '1') return 0;
    if (process.env.NALA_EDS_MAX_RPS !== undefined && process.env.NALA_EDS_MAX_RPS !== '') {
        const v = Number.parseInt(process.env.NALA_EDS_MAX_RPS, 10);
        return Number.isFinite(v) && v > 0 ? v : 0;
    }
    if (!process.env.NALA_TOTAL_WORKERS) return DEFAULT_EDS_MAX_RPS;
    const workers = Number(process.env.NALA_TOTAL_WORKERS);
    if (!Number.isInteger(workers) || workers <= 0 || workers > 180) {
        throw new Error('EDS total worker allocation must be an integer between 1 and 180');
    }
    return Math.min(DEFAULT_EDS_MAX_RPS, Math.floor(180 / workers));
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
export function throttleEdsGap(maxRps, url, { signal, owner } = {}) {
    const minGapMs = 1000 / maxRps;
    const next = throttleChain.then(async () => {
        signal?.throwIfAborted();
        const now = Date.now();
        const wait = Math.max(0, Math.ceil(minGapMs - (now - lastRequestAt)));
        if (wait > 0) {
            await delay(wait, undefined, { signal });
        }
        await waitForRateLimit(url, { signal, owner });
        lastRequestAt = Date.now();
    });

    throttleChain = next.catch((error) => {
        if (signal?.aborted && error.name === 'AbortError') return;
        throw error;
    });
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
    const state = {
        pending: new Set(),
        routes: new Set(),
        mutations: new Map(),
        errors: [],
        closing: false,
        controller: new AbortController(),
        owner: randomUUID(),
        cancelled: new Set(),
        applicationCancelled: new Set(),
        readControllers: new Map(),
        foregroundSearch: false,
        foregroundMutation: false,
        settingsReads: new Map(),
        settingsEpoch: 0,
        settingsRequestEpochs: new WeakMap(),
        coalescedSettingsReads: 0,
    };
    pendingPageRoutes.set(page, state);
    await page.exposeBinding('__nalaForegroundSearch', ({ frame }, foreground) => {
        if (!frame.parentFrame()) state.foregroundSearch = foreground;
    });
    await page.exposeBinding('__nalaForegroundMutation', ({ frame }, foreground) => {
        if (!frame.parentFrame()) state.foregroundMutation = foreground;
    });
    await page.addInitScript((uuidPattern) => {
        if (window !== window.top) return;
        const uuid = new RegExp(uuidPattern, 'i');
        const observeSearch = (event) => {
            const path = event.composedPath();
            const search = path.find((element) => element.localName === 'sp-search' && element.closest('#actions'));
            if (search) void window.__nalaForegroundSearch(uuid.test(path[0].value));
        };
        for (const event of ['input', 'change']) document.addEventListener(event, observeSearch, true);
        let subscribed = false;
        const observeOperation = () => {
            const operation = document.querySelector('mas-repository')?.operation;
            if (subscribed || !operation) return;
            subscribed = true;
            operation.subscribe((value) => void window.__nalaForegroundMutation(Boolean(value)));
            observer.disconnect();
        };
        const observer = new MutationObserver(observeOperation);
        observer.observe(document, { childList: true, subtree: true });
        void customElements.whenDefined('mas-repository').then(observeOperation);
    }, UUID_QUERY.source);
    page.on('domcontentloaded', () => {
        state.foregroundSearch = false;
        state.foregroundMutation = false;
    });
    page.on('request', (request) => {
        const { hostname } = new URL(request.url());
        if (isOdinOrigin(request.url()) && !isReadOnlyRequest(request)) state.settingsEpoch++;
        state.settingsRequestEpochs.set(request, state.settingsEpoch);
        if (!hostname.endsWith('.adobeaemcloud.com') || isReadOnlyRequest(request)) return;
        let finish;
        const done = new Promise((resolve) => (finish = resolve));
        state.mutations.set(request, { done, finish });
    });
    const finishMutation = (request) => {
        state.mutations.get(request)?.finish();
        state.mutations.delete(request);
    };
    page.on('requestfinished', (request) => {
        finishMutation(request);
        state.readControllers.delete(request);
    });
    page.on('requestfailed', (request) => {
        if (isReadOnlyRequest(request) && /ERR_ABORTED|NS_BINDING_ABORTED/.test(request.failure().errorText)) {
            state.cancelled.add(request);
            if (!state.closing) state.applicationCancelled.add(request);
            state.readControllers.get(request)?.abort();
        }
        if (state.mutations.has(request)) {
            const { origin, pathname } = new URL(request.url());
            const error = new Error(`${request.method()} ${origin}${pathname}: ${request.failure().errorText}`);
            state.errors.push(error);
            console.warn(`[NALA] Author mutation transport failure: ${error.message}`);
        }
        finishMutation(request);
        state.readControllers.delete(request);
    });
    logRateLimitedResponses(page, nativeCooldowns, true);
    logEdsThrottleOnce(edsMaxRps);
    const handleRoute = async (route, options) => {
        const url = route.request().url();
        const paceNativeReads = nativeCooldowns || isOdinOrigin(url);
        const pace = async (enforceCooldown = paceNativeReads, reservePreview = true, pacingOptions = options) => {
            if (isReadOnlyRequest(route.request())) pacingOptions.signal.throwIfAborted();
            if (edsMaxRps > 0 && isEdsEdgeHost(url)) {
                const read = isReadOnlyRequest(route.request());
                await throttleEdsGap(edsMaxRps, url, { owner: state.owner, signal: read ? pacingOptions.signal : undefined });
            } else if (enforceCooldown) {
                const read = isReadOnlyRequest(route.request());
                await waitForRateLimit(url, {
                    reservePreview,
                    owner: state.owner,
                    signal: read ? pacingOptions.signal : undefined,
                    priority: pacingOptions.priority,
                });
            }
        };
        if (await isStaticResource(route.request())) {
            if (cacheEnabled) {
                await serveStaticResource(route, () => pace(true, false), options);
            } else {
                const response = await fetchWithRateLimitRetry(route, () => pace(true, false), options);
                try {
                    options.signal.throwIfAborted();
                    await route.fulfill({ response });
                } finally {
                    await response.dispose();
                }
            }
            return;
        }
        if (paceNativeReads && (await isRetryableRead(route.request()))) {
            let response;
            try {
                const target = new URL(url);
                if (
                    isPreviewOrigin(url) &&
                    target.pathname === '/adobe/contentFragments/byPath' &&
                    /^\/content\/dam\/mas\/[^/]+\/settings\/index$/.test(target.searchParams.get('path'))
                ) {
                    await serveConcurrentSettingsRead(
                        page,
                        route,
                        (sharedOptions) => pace(paceNativeReads, false, sharedOptions),
                        options,
                        state,
                    );
                    return;
                }
                response = await fetchWithRateLimitRetry(route, () => pace(paceNativeReads, false), options);
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
                options.signal.throwIfAborted();
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
        const request = route.request();
        const read = isReadOnlyRequest(request);
        const controller = state.readControllers.get(request) ?? new AbortController();
        if (read) state.readControllers.set(request, controller);
        if (state.cancelled.has(request)) controller.abort();
        const { hostname, pathname } = new URL(request.url());
        const params = new URLSearchParams(new URL(page.url()).hash.slice(1));
        const foreground =
            !read ||
            (isOdinOrigin(request.url()) &&
                (params.get('fragmentId') ||
                    UUID_QUERY.test(params.get('query')) ||
                    state.foregroundSearch ||
                    state.foregroundMutation)) ||
            (hostname.endsWith('.adobeaemcloud.com') &&
                (pathname === '/libs/granite/csrf/token.json' || pathname.startsWith('/adobe/sites/cf/models/')));
        const options = {
            signal: AbortSignal.any([state.controller.signal, controller.signal]),
            owner: state.owner,
            priority: foreground ? 'foreground' : 'background',
        };
        state.routes.add(route);
        const operation = handler(route, options);
        state.pending.add(operation);
        try {
            await operation;
        } catch (error) {
            const closed = /Target (?:page|browser|context).*closed|Request context disposed|Browser has been closed/.test(
                error.message,
            );
            const alreadyCancelled = state.cancelled.has(request);
            if ((!state.closing && !alreadyCancelled) || !read || (error.name !== 'AbortError' && !closed)) throw error;
            state.cancelled.add(request);
            if (!alreadyCancelled && !page.isClosed()) {
                try {
                    await route.abort('aborted');
                } catch (abortError) {
                    if (!/Target (?:page|browser|context).*closed|Browser has been closed/.test(abortError.message))
                        throw abortError;
                }
            }
        } finally {
            state.routes.delete(route);
            state.pending.delete(operation);
        }
    };
    await page.route('**/*', trackRoute(handleRoute));
    if (cacheEnabled && replayHar) {
        const harUrls = await installRunStaticHar(page);
        if (harUrls.size) {
            await page.route(
                STATIC_HAR_URLS,
                trackRoute(async (route, options) => {
                    if (harUrls.has(route.request().url()) && (await isStaticResource(route.request()))) {
                        recordStaticCacheHit();
                        await route.fallback();
                    } else {
                        await handleRoute(route, options);
                    }
                }),
            );
        }
    }
}
