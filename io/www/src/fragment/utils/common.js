import { transformBody } from './odinSchemaTransform.js';
import { log, logDebug, logError, getErrorMessage } from '../utils/log.js';

/**
 * Shared shape of the pipeline context passed between transformers. Documented here
 * because locale-related properties are easy to confuse. Only the load-bearing
 * properties are listed — transformers may attach surface-specific state too.
 *
 * Locale lifecycle (set by `defaultLanguage` init, read by everyone downstream):
 *   request:  { locale: 'fr_FR', country: 'LU' }
 *   →  parsedLocale = 'fr_LU'   (locale segment of the matched fragment's AEM path)
 *   →  defaultLocale = 'fr_FR'  (surface's base locale for that lang — fetch source for translation)
 *   →  regionLocale = 'fr_LU'   (regional variant resolved from locale + country, surface-aware)
 *   context.locale stays 'fr_FR' the whole time — never mutated. Use {@link getRegionalLocale}
 *   to read the effective regional locale for dictionary/settings/WCS calls.
 *
 * @typedef {Object} PipelineContext
 * @property {string} id - Fragment id requested by the caller.
 * @property {string} locale - Original request locale (e.g. 'fr_FR'). Never mutated.
 * @property {string} [country] - Explicit country override from the request (e.g. 'LU').
 * @property {string} [pzn] - Personalization segment from the request.
 * @property {string} [api_key] - Client API key (selects WCS configuration).
 * @property {boolean} [preview] - Whether the request targets preview Odin (studio-only).
 * @property {string} [surface] - Surface identifier (e.g. 'acom'), parsed from fragment path.
 * @property {string} [fragmentPath] - Fragment path under the surface (no locale prefix).
 * @property {string} [parsedLocale] - Locale segment of the matched fragment's AEM path.
 * @property {string} [defaultLocale] - Surface's base locale for the request lang (e.g. 'fr_FR').
 *   Used to fetch the default-language fragment when a regional variation is missing.
 * @property {string} [regionLocale] - Resolved regional locale (e.g. 'fr_LU') derived from
 *   (locale, country, surface). Set by `defaultLanguage`. Consumed by dictionary fetch
 *   ({@link transformers/replace.js}), settings overrides ({@link transformers/settings.js}),
 *   and WCS pricing ({@link transformers/wcs.js}).
 * @property {*} [body] - Response body being built across transformers.
 * @property {*} [state] - aio-lib-state instance for the per-request metadata cache.
 * @property {Object<string, Promise>} [promises] - Per-transformer init promises.
 * @property {Object<string, string>} [__ow_headers] - OpenWhisk request headers (e.g. for If-Modified-Since).
 */

const CARD_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ';
const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';
const VALID_PARAMETER_VALUE_REGEX = /^[a-zA-Z0-9_-]+$/;

async function computeBody(response, context) {
    let body = await response.json();
    if (context.preview && Array.isArray(body.fields)) {
        log('massaging old school schema for preview', context);
        body = transformBody(body);
    }
    return body;
}

function createTimeoutPromise(timeout, handler) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            const error = new Error(`Request timed out after ${timeout}ms`);
            error.isTimeout = true;
            handler?.(error);
            reject(error);
        }, timeout);
    });
}

function mark(context, label) {
    context.marks = context.marks || {};
    return (context.marks[label] = performance.now()?.toFixed(2));
}

function measureTiming(context, label, startLabel = label) {
    const measure = { label, duration: 0 };
    if (context.marks && context.marks[startLabel]) {
        const start = context.marks.start;
        measure.startTime = (context.marks[startLabel] - start).toFixed(2);
        measure.duration = (performance.now() - context.marks[startLabel]).toFixed(2);
    }
    context.measures = context.measures || [];
    context.measures.push(measure);
    return measure;
}

/**
 * fetch attempt with a timeout
 * @param {*} path
 * @param {*} context
 * @param {*} timeout
 * @returns response with status, out of which status 200 is success, 503 is fetch error, 504 is timeout,
 * other errors code from the server
 */
async function fetchAttempt(path, context, timeout, marker) {
    try {
        mark(context, marker);
        const responsePromise = fetch(path, {
            headers: {
                ...context.DEFAULT_HEADERS,
                'X-Request-ID': globalThis.crypto.randomUUID(),
            },
        });

        // Race the fetch promise with a timeout
        const response = await Promise.race([responsePromise, createTimeoutPromise(timeout)]);
        const measure = measureTiming(context, marker);
        const success = response.status === 200;
        response.message = success ? 'ok' : response.message || (await getErrorMessage(response));
        log(
            `fetch ${path} (${response?.status}) ${response?.message} in ${measure.duration}ms`,
            context,
            success ? 'info' : 'error',
        );
        logDebug(() => `response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`, context);
        if (success) {
            return {
                status: 200,
                message: 'ok',
                body: await Promise.race([computeBody(response, context), createTimeoutPromise(timeout)]),
            };
        }
        return response;
    } catch (e) {
        const errorMeasure = measureTiming(context, `fetch-error-${marker}`, marker);
        // Check if this is a timeout error
        if (e.isTimeout) {
            logError(`[fetch] ${path} timed out after ${errorMeasure.duration}ms`, context);
            return {
                ...context,
                status: 504, // Request Timeout
                message: 'fetch timeout',
            };
        }

        // This is a fetch error (network, DNS, etc.)
        logError(`[fetch] ${path} fetch error: ${e.message} after ${errorMeasure.duration}ms`, context);
        return {
            ...context,
            status: 503,
            message: 'fetch error',
        };
    }
}

/**
 * fetches a path with retries and timeout
 * @param {*} path
 * @param {*} context
 * @param {*} timeout
 * @param {*} retries
 */
async function internalFetch(path, context, marker) {
    mark(context, `${marker}`);
    const { retries = 3, fetchTimeout = 2000, retryDelay = 100 } = context.networkConfig || {};
    let delay = retryDelay;
    let response;
    for (let attempt = 0; attempt < retries; attempt++) {
        // Race the fetch promise with a timeout
        response = await fetchAttempt(path, context, fetchTimeout, `fetch-${marker}-${attempt}`);
        if ([503, 504].includes(response.status)) {
            log(
                `fetch ${path} (attempt #${attempt}) failed with status ${response.status}, retrying in ${delay}ms...`,
                context,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        } else {
            break;
        }
    }
    measureTiming(context, `main-fetch-${marker}`, marker);
    return response;
}

async function getFromState(key, context) {
    mark(context, `state-${key}`);
    const value = (await context?.state?.get(key))?.value;
    measureTiming(context, `state-${key}`);
    return value;
}

async function getJsonFromState(key, context) {
    const str = await getFromState(key, context);
    if (str) {
        try {
            return { str, json: JSON.parse(str) };
        } catch (e) {
            logError(`Error parsing cached ${key}->${str}: ${e.message}`, context);
        }
    }
    return { str: null, json: null };
}

/**
 * get fragment id from odin for a given path
 * @param {*} context
 * @param {*} odinUrl
 * @param {*} mark
 * @returns {id, status}
 */
async function getFragmentId(context, odinUrl, mark) {
    if (context.fragmentsIds) {
        const cachedId = context.fragmentsIds[mark];
        if (cachedId) {
            logDebug(() => `Using cached fragment id for ${mark}: ${cachedId}`, context);
            return {
                id: cachedId,
                status: 200,
            };
        }
    }
    const response = await internalFetch(odinUrl, context, mark);
    let { message, status } = response;
    if (response.status == 200) {
        const { id } = response.body || {};
        if (id) {
            context.fragmentsIds = context.fragmentsIds || {};
            context.fragmentsIds[mark] = id;
            return {
                id,
                status,
            };
        }
        message = 'No id found in response';
        status = 503;
    }
    return {
        message: response.message || 'Error fetching fragment id',
        status,
    };
}

/**
 * get default request information either from state cache, or from the early `requestInfos` promise (first fragment
 * fetch + path parse).
 * @param {*} context
 * @returns parsedLocale, surface, fragmentPath
 */
async function getRequestInfos(context) {
    let { body, parsedLocale, surface, fragmentPath } = context;
    if (!parsedLocale || !surface || !fragmentPath || !body) {
        const fetchResult = await context.promises?.requestInfos;
        if (fetchResult) {
            ({ parsedLocale, surface, fragmentPath, body } = fetchResult);
        }
    }
    return { parsedLocale, surface, fragmentPath, body };
}

/**
 * Returns which geo dimensions match between `tags` and the given locale/country,
 * or null if neither matches. Tags are CQ tag paths whose last two segments
 * must be `(locale|country)/<value>` — accepted in long form
 * (`/content/cq:tags/mas/locale/en_US`) or short form (`mas:locale/en_US`,
 * `mas:pzn/country/KW`). The `(locale|country)` segment must be at the start
 * of the tag or preceded by `/` or `:`, which prevents spurious matches against
 * unrelated taxonomies ending in `/<X>`.
 * Falls back to extracting country from regionLocale when country is not provided.
 * @param {string[]} tags
 * @param {{ regionLocale?: string, country?: string }} param1
 * @returns {{ region: boolean, country: boolean } | null}
 */
function matchesGeo(tags, { regionLocale, country }) {
    const effectiveCountry = country ?? regionLocale?.split('_')[1];
    const matchSuffix = (value) => tags.some((tag) => new RegExp(`(^|[/:])(locale|country)/([^/]+/)?${value}$`, 'i').test(tag));
    const region = Boolean(regionLocale) && matchSuffix(regionLocale);
    const countryMatch = Boolean(effectiveCountry) && matchSuffix(effectiveCountry);
    if (!region && !countryMatch) return null;
    return { region, country: countryMatch };
}

/**
 * Effective country for a request context. Prefer explicit `context.country`, otherwise
 * fall back to the country segment of `context.locale` (e.g. `en_US` → `US`).
 * @param {PipelineContext} context
 * @returns {string}
 */
const getCountry = (context) => context.country || context.locale?.split('_')[1] || '';

/**
 * Effective locale for region-aware operations (dictionary fetch, settings overrides, WCS).
 * Uses `regionLocale` once `defaultLanguage` has resolved it (e.g. fr_BE for fr_FR + country=BE),
 * otherwise falls back to the request `locale`.
 * @param {PipelineContext} context
 * @returns {string|undefined}
 */
const getRegionalLocale = (context) => context.regionLocale ?? context.locale;

/**
 * Skims a fragment by stripping its references, which can be large and are not needed for masks. This is used to keep the mask fragment lightweight since it's only used as an overlay and doesn't need to resolve references. The
 * full fragment with references is still fetched to check for existence and for validation against the card model, but
 * the skimmed version is what gets exposed on `context.maskFragment` for the `customize` transformer to apply.
 * @param {*} fragment
 * @returns skimmed fragment without references
 */
function skimFragmentFromReferences(fragment) {
    const skimmedFragment = structuredClone(fragment);
    delete skimmedFragment.references;
    delete skimmedFragment.modelReferences;
    delete skimmedFragment.referencesTree;
    return skimmedFragment;
}

export {
    CARD_MODEL_ID,
    COLLECTION_MODEL_ID,
    VALID_PARAMETER_VALUE_REGEX,
    createTimeoutPromise,
    internalFetch as fetch,
    getCountry,
    getRegionalLocale,
    getRequestInfos,
    getFragmentId,
    getJsonFromState,
    getFromState,
    mark,
    matchesGeo,
    measureTiming,
    skimFragmentFromReferences,
};
