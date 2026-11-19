import { createTimeoutPromise, mark, measureTiming, VALID_PARAMETER_VALUE_REGEX } from './utils/common.js';
import {
    clearRequestCaches,
    extractContextFromMetadata,
    getRequestMetadata,
    getStoredResponse,
    rereadRequestMetadata,
    STALE_MAX_AGE,
    storeRequestMetadata,
} from './utils/cache.js';
import {
    getApiKeySurface,
    loadConfiguration,
    resetCache as resetConfiguration,
    validateApiKey,
} from './utils/configuration.js';
import { logMemoryUsage, resetMemoryLog, setHeapBudget } from './utils/swr-cache.js';
import { log, logError, logDebug } from './utils/log.js';
import crypto from 'crypto';
import v8 from 'v8';
import zlib from 'zlib';
import stateLib from '@adobe/aio-lib-state';
import { getFilesClient, resetFilesClient } from './utils/files-client.js';
import openwhisk from 'openwhisk';

import { transformer as fetchFragment } from './transformers/fetchFragment.js';
import { transformer as defaultLanguage } from './transformers/defaultLanguage.js';
import { transformer as offer } from './transformers/offer.js';
import { transformer as corrector } from './transformers/corrector.js';
import { transformer as replace } from './transformers/replace.js';
import { transformer as promotions } from './transformers/promotions.js';
import { transformer as mask } from './transformers/mask.js';
import { transformer as settings } from './transformers/settings.js';
import { transformer as customize } from './transformers/customize.js';
import { transformer as wcs } from './transformers/wcs.js';
import { isKnownLocale, resolveTerritoryCountries } from './locales.js';

function calculateHash(body) {
    return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

const encode = (body) => (body?.length > 0 ? zlib.brotliCompressSync(body).toString('base64') : undefined);

// The caches grow until the heap used reaches 75% of the V8 heap limit, the rest being left to the requests in flight.
setHeapBudget(v8.getHeapStatistics().heap_size_limit * 0.75, () => v8.getHeapStatistics().used_heap_size);

// e.g. "42s" or "7m12s"
const formatAge = (ms) => {
    const seconds = Math.round(ms / 1000);
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m${seconds % 60}s`;
};

function resetCache() {
    resetConfiguration();
    clearRequestCaches();
    resetMemoryLog();
    resetFilesClient();
    refreshes.clear();
}

/** 200 (or 304 when not modified since `If-Modified-Since`) response for an already encoded body. */
function successResponse(context, { id, hash, lastModified, body }) {
    const ifModifiedSince = context.__ow_headers?.['if-modified-since'];
    const notModified = ifModifiedSince && lastModified.getTime() <= new Date(ifModifiedSince).getTime();
    return {
        statusCode: notModified ? 304 : 200,
        id,
        headers: { ETag: hash, 'Last-Modified': lastModified.toUTCString() },
        body: notModified ? undefined : body,
        encoded: true,
    };
}

const PIPELINE = [fetchFragment, defaultLanguage, offer, promotions, mask, customize, settings, replace, wcs, corrector];

const RESPONSE_HEADERS = {
    'Access-Control-Expose-Headers': 'X-Request-Id,Etag,Last-Modified,server-timing',
    'Content-Type': 'application/json',
    'Content-Encoding': 'br',
};

async function main(params, { openwhiskFactory = openwhisk } = {}) {
    const requestId = params.__ow_headers?.['x-request-id'] || `mas-${performance.now()}`;
    const region = process.env.__OW_REGION || 'unknown';
    const DEFAULT_HEADERS = {
        Accept: 'application/json, */*',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'Mozilla/5.0 (compatible; mas-io-Pipeline/1.0)',
        'X-Correlation-ID': requestId,
    };
    let context = {
        ...params,
        requestId,
        loggedTransformer: 'pipeline',
        DEFAULT_HEADERS,
        status: 200,
        measures: [],
        // only a non-web invocation (see triggerRefresh) can ask for a refresh
        refresh: !params.__ow_method && params.refresh === true,
    };
    mark(context, 'start');
    let returnValue;
    let cacheControl;
    log(`starting request pipeline for ${JSON.stringify(context)}`, context);
    if (context.preview) {
        logError('Preview mode is not supported in this pipeline', context);
        return {
            statusCode: 400,
            headers: RESPONSE_HEADERS,
            message: 'Preview mode is not supported in this pipeline',
        };
    }
    /* c8 ignore next 4*/
    if (!context.state) {
        context.state = await stateLib.init();
        context.files = getFilesClient(context);
    }
    try {
        const now = mark(context, 'config-check');
        context = await loadConfiguration(context, now);
        const maxAge = context.networkConfig?.cacheMaxAge || 300;
        const staleWhileRevalidate = context.networkConfig?.cacheStaleWhileRevalidate || 86400;
        cacheControl = `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

        const validationResponse = validateApiKey(context);
        if (validationResponse.statusCode !== 200) {
            returnValue = validationResponse;
        } else {
            const initTime = measureTiming(context, 'init', 'start').duration;
            let timeout = context.networkConfig?.mainTimeout || 5000;
            timeout = Math.max(timeout - initTime, 0);
            const refresh = () => triggerRefresh(params, openwhiskFactory);
            returnValue = await Promise.race([mainProcess(context, refresh), createTimeoutPromise(timeout)]);
        }
    } catch (error) {
        logError(`Error occurred while processing request: ${error.message} ${error.stack}`, context);
        if (error.isTimeout) {
            returnValue = {
                statusCode: 504,
                headers: RESPONSE_HEADERS,
                message: 'Fragment pipeline timed out',
            };
            /* c8 ignore next 7*/
        } else {
            returnValue = {
                statusCode: 503,
                message: error?.message || 'Internal Server Error',
                headers: RESPONSE_HEADERS,
            };
        }
    }
    mark(context, 'end');
    context.loggedTransformer = 'pipeline';
    const { cache, requestKey, cacheDetail } = returnValue;
    delete returnValue.cache;
    delete returnValue.requestKey;
    delete returnValue.cacheDetail;
    delete returnValue.id; // id is not part of the response
    // a stale response is refreshed in the background: the CDN keeps it shortly, to get the refreshed one soon
    if (cache === 'stale') {
        cacheControl = cacheControl.replace(/max-age=\d+/, `max-age=${context.networkConfig?.staleCacheMaxAge || 30}`);
    }
    returnValue.headers = {
        ...returnValue.headers,
        ...RESPONSE_HEADERS,
        'Cache-Control': cacheControl,
    };
    if (!returnValue.encoded) returnValue.body = encode(returnValue.body);
    delete returnValue.encoded;
    logDebug(() => `full response: ${JSON.stringify(returnValue)}`, context);
    measureTiming(context, 'endProcess', 'end');
    const { duration } = measureTiming(context, 'pipeline', 'start');
    const parts = [
        `pipeline completed: ${context.id} ${context.locale} -> ${returnValue.statusCode} in ${duration}ms`,
        cache && `cache ${cache} ${requestKey}${cacheDetail ? ` (${cacheDetail})` : ''}`,
    ];
    // a stored response only reports its cache outcome; a built one also reports the timings of its steps
    if (!cache || cache === 'miss' || cache === 'refresh') {
        const measures = context.measures
            .map((measure) => `${measure.label} t:${measure.startTime}, d:${measure.duration}`)
            .join('|');
        parts.push(`timings (time and duration) region: ${region}: ${measures}`);
    }
    log(parts.filter(Boolean).join(' | '), context);
    logMemoryUsage(context);
    return returnValue;
}

// in-progress rebuilds by request key
const rebuilds = new Map();
// times of the refreshes triggered by this container, by request key, oldest first
const refreshes = new Map();
// a refresh is not triggered again for the same key before this delay, while the first one is (most likely) running
const REFRESH_INTERVAL = 60 * 1000;
// the (non-blocking) refresh invocation is not awaited longer, so that the stale response is not delayed
const REFRESH_TRIGGER_TIMEOUT = 500;

/** Invokes this action, without waiting for it, to rebuild and store the response for the same request parameters. */
async function triggerRefresh(params, openwhiskFactory) {
    const refreshParams = Object.fromEntries(Object.entries(params).filter(([key]) => !key.startsWith('__ow_')));
    const invocation = openwhiskFactory().actions.invoke({
        name: process.env.__OW_ACTION_NAME,
        params: { ...refreshParams, refresh: true },
        blocking: false,
    });
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${REFRESH_TRIGGER_TIMEOUT}ms`)), REFRESH_TRIGGER_TIMEOUT);
    });
    return Promise.race([invocation, timeout]).finally(() => clearTimeout(timer));
}

/** Triggers a refresh of `requestKey` unless one is in progress or was triggered recently; resolves to a log note. */
async function refreshInBackground(context, requestKey, refresh) {
    if (rebuilds.has(requestKey)) return ', rebuild in progress';
    const now = Date.now();
    for (const [key, triggeredAt] of refreshes) {
        if (now - triggeredAt < REFRESH_INTERVAL) break;
        refreshes.delete(key);
    }
    if (refreshes.has(requestKey)) return ', refresh already triggered';
    refreshes.set(requestKey, now);
    try {
        await refresh();
        return ', refresh triggered';
    } catch (error) {
        refreshes.delete(requestKey);
        logError(`failed to trigger the refresh of ${requestKey}: ${error.message}`, context);
        return ', refresh trigger failed';
    }
}

async function mainProcess(context, refresh) {
    // ADR CONT-0001: the `surface` parameter wins over the fragment's surface, which wins over the api key's one.
    // A requested surface conflicting with the api key's (here) or the fragment's (fetchFragment) one is a 404.
    const apiKeySurface = getApiKeySurface(context);
    context.requestedSurface = context.surface;
    if (context.surface && apiKeySurface && context.surface !== apiKeySurface) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: `surface '${context.surface}' is not available for this api_key` }),
        };
    }
    if (!context.id) context.surface ??= apiKeySurface;
    const { id, locale, offer, template, surface } = context;
    // without a fragment id, the offer baseline is resolved from `offer`, `template` & `surface`.
    if (!locale || (!id && !(offer && template && surface))) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'requested parameters id (or offer, template & surface) & locale are not present',
            }),
        };
    }
    const invalidParameter = Object.entries({ offer, template, surface }).find(
        ([, value]) => value !== undefined && !VALID_PARAMETER_VALUE_REGEX.test(value),
    );
    if (invalidParameter) {
        return { statusCode: 400, body: JSON.stringify({ message: `invalid parameter '${invalidParameter[0]}'` }) };
    }
    if (!isKnownLocale(context.locale)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: `unknown locale '${context.locale}'` }),
        };
    }
    // MWPW-204652: split content vs commerce country at ingress, before the metadata
    // read and the parallel init fan-out (promotions.init reads context.country).
    const territory = resolveTerritoryCountries(context.locale, context.country);
    context.country = territory.country;
    // MWPW-207865: fetchFragment's init, once `surface` is known, restricts `context.country` itself
    // to the locale's market family (see restrictCountryToLocaleMarket) — a request country outside
    // that family (e.g. fr_FR + country=DE, DE not being a registered region of fr_FR) is replaced
    // by the locale's own country everywhere downstream: promo/grouped-variation matching in
    // customize, geo-tag settings overrides, and WCS pricing all end up keyed on the same restricted
    // country. promotions.init's own project listing runs earlier (in the init fan-out, before
    // fetchFragment resolves) and still sees the raw country — see pipeline-e2e's "per-offer promo
    // ... for one country" tests.
    //
    // The request cache key is captured once, here — before that restriction happens — so the read
    // and the write below always agree on the same key, regardless of how context.country changes
    // mid-pipeline.
    const { requestKey, fromState, ...cached } = await getRequestMetadata(context);
    let { cachedMetadata, cachedResponse } = cached;
    const storedResponse = (body, cache, note = '') => {
        const { hash, lastModified, refreshedAt } = cachedMetadata;
        const response = successResponse(context, { hash, lastModified: new Date(lastModified), body });
        return { ...response, cache, requestKey, cacheDetail: `refreshed ${formatAge(Date.now() - refreshedAt)} ago${note}` };
    };
    const storedBody = getStoredResponse(cachedMetadata, cachedResponse);
    if (storedBody) return storedResponse(storedBody, 'hit');
    // The memory copies can be up to a minute old: before rebuilding, check whether another container refreshed State.
    if (cachedMetadata && !fromState && !rebuilds.has(requestKey)) {
        const reread = await rereadRequestMetadata(context, requestKey);
        cachedMetadata = reread.cachedMetadata ?? cachedMetadata;
        cachedResponse = reread.cachedResponse ?? cachedResponse;
        const rereadBody = getStoredResponse(cachedMetadata, cachedResponse);
        if (rereadBody) return storedResponse(rereadBody, 'hit', ', re-read from State');
    }
    // An older stored response, up to STALE_MAX_AGE, is served as is while this action refreshes it in the background;
    // the refresh invocation itself rebuilds it. `instant` (time travelling) requests have no stored response.
    const staleBody = !context.refresh && getStoredResponse(cachedMetadata, cachedResponse, STALE_MAX_AGE);
    if (staleBody) return storedResponse(staleBody, 'stale', await refreshInBackground(context, requestKey, refresh));
    // Concurrent requests for the same key in this container wait for the rebuild already in progress.
    // `instant` requests neither register nor join rebuilds: theirs is for another date.
    let rebuild = context.instant ? undefined : rebuilds.get(requestKey);
    let cache = 'joined';
    if (!rebuild) {
        cache = context.refresh ? 'refresh' : 'miss';
        rebuild = buildResponse(context, requestKey, cachedMetadata, cachedResponse);
        if (!context.instant) {
            rebuilds.set(requestKey, rebuild);
            rebuild.finally(() => rebuilds.delete(requestKey)).catch(() => {});
        }
    }
    const built = await rebuild;
    // error responses are copied: main() mutates the returned object
    if (built.statusCode) return { ...built };
    const cacheDetail = built.degraded && `degraded by ${built.degraded}, not stored`;
    return { ...successResponse(context, built), cache, requestKey, cacheDetail };
}

/**
 * Runs the transformers and stores the result; resolves to `{ id, hash, lastModified, body, degraded }` or an error
 * response. A degraded result (see `markDegraded`) is not stored, so that the previous stored response stays and the
 * next request rebuilds it.
 */
async function buildResponse(context, requestKey, cachedMetadata, cachedResponse) {
    const metadataContext = extractContextFromMetadata(cachedMetadata);
    context = { ...context, ...metadataContext };
    // Initialize all transformers that have an init function
    // those requests are done in parallel and results stored in context.promises
    const initPromises = {};
    context.fragmentsIds = context.fragmentsIds || {};
    context.degraded = new Set();
    for (const transformer of PIPELINE) {
        if (transformer.init) {
            //we fork context to avoid init to override any context property
            const initContext = {
                ...structuredClone({ ...context, state: undefined, files: undefined }),
                state: context.state,
                promises: initPromises,
                fragmentsIds: context.fragmentsIds,
                degraded: context.degraded,
                measures: context.measures,
            };
            initContext.loggedTransformer = `${transformer.name}-init`;
            initPromises[transformer.name] = transformer.init(initContext);
        }
    }
    context.status = 200;
    context.promises = initPromises;

    for (const transformer of PIPELINE) {
        logDebug(() => `starting transformer ${transformer.name}`, context);
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.loggedTransformer = transformer.name;
        mark(context, transformer.name);
        context = await transformer.process(context);
        measureTiming(context, transformer.name);
    }
    context.loggedTransformer = 'pipeline';
    if (context.status != 200) {
        return { statusCode: context.status, body: JSON.stringify({ message: context.message }) };
    }
    const responseBody = JSON.stringify(context.body, null, 0);
    logDebug(() => `response body: ${responseBody}`, context);
    const hash = calculateHash(responseBody);
    const body = encode(responseBody);
    if (context.degraded.size > 0) {
        const degraded = [...context.degraded].join(', ');
        logError(`not storing ${requestKey}, degraded by ${degraded}`, context);
        return { id: context.body?.id, hash, lastModified: new Date(), body, degraded };
    }
    const { lastModified } = await storeRequestMetadata(context, requestKey, cachedMetadata, hash, { body, cachedResponse });
    return { id: context.body?.id, hash, lastModified, body };
}

export { main, resetCache, PIPELINE };
