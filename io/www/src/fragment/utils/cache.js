import { getJsonFromState, mark, measureTiming } from './common.js';
import { geoCacheKey } from '../locales.js';
import { log, logError } from './log.js';
import { createSwrCache } from './swr-cache.js';
const getRequestMetadataKey = ({ id, locale, country, pzn, mask, offer, template, surface }) => {
    const geo = geoCacheKey(locale, country);
    const suffixes = [
        geo.country,
        pzn && `p_${pzn}`,
        mask && `m_${mask}`,
        offer && `o_${offer}`,
        template && `t_${template}`,
        surface && `s_${surface}`,
    ];
    return [`req-${id ?? 'offer'}-${geo.locale}`, ...suffixes].filter(Boolean).join('-');
};

// Memory copies of the State values, re-read from State at most every minute or so per container.
const MEMORY_TTL = 60 * 1000;
// A stored response refreshed less than this ago is served as is; an older one is rebuilt.
const RESPONSE_MAX_AGE = 5 * 60 * 1000;
// While a rebuild is in progress, an older stored response is still served, up to this age; beyond it requests wait.
const STALE_MAX_AGE = 15 * 60 * 1000;
// State values are limited to 1 MB.
const MAX_STORED_RESPONSE_LENGTH = 900 * 1024;

const metadataCache = createSwrCache({ name: 'request-metadata', ttl: MEMORY_TTL, maxEntries: 20000 });
const responseCache = createSwrCache({ name: 'response', ttl: MEMORY_TTL, maxEntries: 20000 });

const getResponseKey = (requestKey) => requestKey.replace(/^req-/, 'res-');

const readState = async (key, context) => (await getJsonFromState(key, context)).json;

// Preview (Studio) and `instant` (time travelling) requests neither use the memory copies nor the stored response.
const usesStoredResponse = ({ preview, instant }) => !preview && !instant;

/**
 * Reads the request metadata (`req-` key) and the stored response (`res-` key, a `{ hash, body }`
 * pair where `body` is the brotli + base64 encoded response) in parallel, from memory or State.
 * `fromState` tells whether both were just read from State rather than taken from the memory copies.
 */
async function getRequestMetadata(context) {
    const requestKey = getRequestMetadataKey(context);
    const responseKey = getResponseKey(requestKey);
    const shared = usesStoredResponse(context);
    const read = {};
    const load = (key) => async () => (read[key] = await readState(key, context));
    const [cachedMetadata, cachedResponse] = await Promise.all([
        shared ? metadataCache.get(context, requestKey, load(requestKey)) : readState(requestKey, context),
        shared ? responseCache.get(context, responseKey, load(responseKey)) : null,
    ]);
    if (cachedMetadata) {
        log(`found cached metadata for ${requestKey} -> ${JSON.stringify(cachedMetadata)}`, context);
    }
    const fromState = !shared || (cachedMetadata === read[requestKey] && cachedResponse === read[responseKey]);
    return { requestKey, cachedMetadata: cachedMetadata ?? null, cachedResponse: cachedResponse ?? null, fromState };
}

/**
 * Re-reads the request metadata and the stored response from State, bypassing (and updating) the memory copies:
 * another container may have refreshed them since this one copied them. Best effort: a failed read returns nulls.
 */
async function rereadRequestMetadata(context, requestKey) {
    const responseKey = getResponseKey(requestKey);
    const [cachedMetadata, cachedResponse] = await Promise.all([
        readState(requestKey, context),
        readState(responseKey, context),
    ]).catch((error) => {
        logError(`failed to re-read ${requestKey}: ${error.message}`, context);
        return [null, null];
    });
    if (cachedMetadata) metadataCache.set(context, requestKey, cachedMetadata);
    if (cachedResponse) responseCache.set(context, responseKey, cachedResponse);
    return { cachedMetadata, cachedResponse };
}

/** Returns the stored encoded body when it matches the metadata hash and was refreshed less than `maxAge` ago. */
function getStoredResponse(cachedMetadata, cachedResponse, maxAge = RESPONSE_MAX_AGE) {
    if (!cachedResponse || cachedResponse.hash !== cachedMetadata?.hash) return null;
    if (Date.now() - (cachedMetadata.refreshedAt ?? 0) > maxAge) return null;
    return cachedResponse.body;
}

function extractContextFromMetadata(cachedMetadata) {
    if (!cachedMetadata) {
        return {};
    }
    const { fragmentsIds, surface, parsedLocale, fragmentPath } = cachedMetadata;
    return {
        // the pipeline adds ids to it, while the metadata object is shared in memory
        fragmentsIds: { ...fragmentsIds },
        surface,
        parsedLocale,
        fragmentPath,
    };
}

// Cache writes are best effort: a throttled (429) State write must not fail the response.
async function putInState(context, key, value, label) {
    mark(context, label);
    try {
        await context.state.put(key, JSON.stringify(value));
    } catch (error) {
        logError(`failed to store ${key}: ${error.message}`, context);
    }
    measureTiming(context, label);
}

/**
 * Stores the request metadata with a new `refreshedAt`, and the encoded `body` when its hash changed.
 * Keeping the body under its own key spares rewriting it on every refresh.
 */
async function storeRequestMetadata(context, requestKey, cachedMetadata, hash, { body, cachedResponse } = {}) {
    const updated = cachedMetadata?.hash !== hash;
    const lastModified = !updated && cachedMetadata.lastModified ? new Date(cachedMetadata.lastModified) : new Date();
    if (context.instant) return { lastModified, hash };
    const shared = usesStoredResponse(context);
    const metadata = {
        fragmentsIds: context.fragmentsIds,
        fragmentPath: context.fragmentPath,
        hash,
        lastModified: lastModified.toUTCString(),
        parsedLocale: context.parsedLocale,
        surface: context.surface,
        refreshedAt: Date.now(),
    };
    if (updated) log(`updating cache for ${requestKey} -> ${JSON.stringify(metadata)}`, context);
    if (shared) metadataCache.set(context, requestKey, metadata);
    const writes = [putInState(context, requestKey, metadata, 'req-state-put')];
    if (shared && cachedResponse?.hash !== hash && body?.length <= MAX_STORED_RESPONSE_LENGTH) {
        const response = { hash, body };
        responseCache.set(context, getResponseKey(requestKey), response);
        writes.push(putInState(context, getResponseKey(requestKey), response, 'res-state-put'));
    }
    await Promise.all(writes);
    return { lastModified, hash };
}

function clearRequestCaches() {
    metadataCache.clear();
    responseCache.clear();
}

export {
    STALE_MAX_AGE,
    getRequestMetadata,
    rereadRequestMetadata,
    getStoredResponse,
    extractContextFromMetadata,
    storeRequestMetadata,
    clearRequestCaches,
};
