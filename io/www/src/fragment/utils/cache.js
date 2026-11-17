import { getJsonFromState, mark, measureTiming } from './common.js';
import { geoCacheKey } from '../locales.js';
import { log, logError } from './log.js';
import { createSwrCache } from './swr-cache.js';
import filesLib from '@adobe/aio-lib-files';
// Escaped as in URLs, with `.` instead of `%` (State keys only allow letters, digits, `-`, `_` and `.`): in a key, `.`
// is then either an escape (followed by 2 uppercase hex digits) or the start of a tagged parameter (lowercase tag).
const escapeKeyValue = (value) =>
    encodeURIComponent(value)
        .replace(/[.!~*'()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
        .replaceAll('%', '.');

// e.g. `req-<id>-fr_FR-CA.p-edu.m-catalog`, or `req-.offer-en_US.o-<offer>.t-plans.s-acom` without a fragment id
const getRequestMetadataKey = ({ id, locale, country, pzn, mask, offer, template, surface }) => {
    const geo = geoCacheKey(locale, country);
    const fragment = [`req-${id ? escapeKeyValue(id) : '.offer'}`, geo.locale, geo.country].filter(Boolean).join('-');
    const parameters = Object.entries({ p: pzn, m: mask, o: offer, t: template, s: surface })
        .filter(([, value]) => value)
        .map(([tag, value]) => `.${tag}-${escapeKeyValue(value)}`);
    return [fragment, ...parameters].join('');
};

// Memory copies of the stored values, re-read from State and Files at most every minute or so per container.
const MEMORY_TTL = 60 * 1000;
// A stored response refreshed less than this ago is served as is; an older one is rebuilt.
const RESPONSE_MAX_AGE = 5 * 60 * 1000;
// While a rebuild is in progress, an older stored response is still served, up to this age; beyond it requests wait.
const STALE_MAX_AGE = 15 * 60 * 1000;
// Larger responses are neither stored nor kept in memory (most are under 20 KB).
const MAX_STORED_RESPONSE_LENGTH = 900 * 1024;
// A Files read or write taking longer is given up: a miss rather than a slow response.
const FILES_TIMEOUT = 500;
const TIMED_OUT = Symbol('timed out');

const metadataCache = createSwrCache({ name: 'request-metadata', ttl: MEMORY_TTL, maxEntries: 20000 });
const responseCache = createSwrCache({ name: 'response', ttl: MEMORY_TTL, maxEntries: 20000 });

const getResponseKey = (requestKey) => requestKey.replace(/^req-/, 'res-');

const getResponsePath = (responseKey) => `fragment-cache/${responseKey}.json`;

const readState = async (key, context) => (await getJsonFromState(key, context)).json;

// Preview (Studio) and `instant` (time travelling) requests neither use the memory copies nor the stored response.
const usesStoredResponse = ({ preview, instant }) => !preview && !instant;

let files;
let filesInit;

/**
 * Returns the Files client once initialised, `undefined` until then: its first initialisation in a container takes
 * a couple of seconds, which requests do not wait for (their stored responses are then just not read nor written).
 */
function getFilesClient(context) {
    filesInit ??= filesLib
        .init()
        .then((client) => (files = client))
        .catch((error) => {
            logError(`failed to initialise Files: ${error.message}`, context);
            filesInit = undefined;
        });
    return files;
}

async function withFilesTimeout(promise, label, context) {
    let timer;
    const timeout = new Promise((resolve) => (timer = setTimeout(resolve, FILES_TIMEOUT, TIMED_OUT)));
    mark(context, label);
    const result = await Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    measureTiming(context, label);
    if (result === TIMED_OUT) throw new Error(`timed out after ${FILES_TIMEOUT}ms`);
    return result;
}

/** Reads a stored response from Files; best effort: a missing, failed or slow read is a miss. */
async function readStoredResponse(responseKey, context) {
    if (!context.files) return null;
    try {
        const content = await withFilesTimeout(context.files.read(getResponsePath(responseKey)), 'res-files-read', context);
        return JSON.parse(content.toString());
    } catch (error) {
        if (error.code !== 'ERROR_FILE_NOT_EXISTS') logError(`failed to read ${responseKey}: ${error.message}`, context);
        return null;
    }
}

/** Writes a stored response to Files; best effort, as for State. */
async function writeStoredResponse(responseKey, response, context) {
    if (!context.files) return;
    try {
        await withFilesTimeout(
            context.files.write(getResponsePath(responseKey), JSON.stringify(response)),
            'res-files-write',
            context,
        );
    } catch (error) {
        logError(`failed to store ${responseKey}: ${error.message}`, context);
    }
}

/**
 * Reads the request metadata (`req-` key, from State) and the stored response (`res-` key, from Files, a `{ hash, body }`
 * pair where `body` is the brotli + base64 encoded response) in parallel, from memory or storage.
 * `fromState` tells whether both were just read from storage rather than taken from the memory copies.
 */
async function getRequestMetadata(context) {
    const requestKey = getRequestMetadataKey(context);
    const responseKey = getResponseKey(requestKey);
    const shared = usesStoredResponse(context);
    const read = {};
    const load = (key, reader) => async () => (read[key] = await reader(key, context));
    const [cachedMetadata, cachedResponse] = await Promise.all([
        shared ? metadataCache.get(context, requestKey, load(requestKey, readState)) : readState(requestKey, context),
        shared ? responseCache.get(context, responseKey, load(responseKey, readStoredResponse)) : null,
    ]);
    if (cachedMetadata) {
        log(`found cached metadata for ${requestKey} -> ${JSON.stringify(cachedMetadata)}`, context);
    }
    const fromState = !shared || (cachedMetadata === read[requestKey] && cachedResponse === read[responseKey]);
    return { requestKey, cachedMetadata: cachedMetadata ?? null, cachedResponse: cachedResponse ?? null, fromState };
}

/**
 * Re-reads the request metadata and the stored response from storage, bypassing (and updating) the memory copies:
 * another container may have refreshed them since this one copied them. Best effort: a failed read returns nulls.
 */
async function rereadRequestMetadata(context, requestKey) {
    const responseKey = getResponseKey(requestKey);
    const [cachedMetadata, cachedResponse] = await Promise.all([
        readState(requestKey, context),
        readStoredResponse(responseKey, context),
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
        writes.push(writeStoredResponse(getResponseKey(requestKey), response, context));
    }
    await Promise.all(writes);
    return { lastModified, hash };
}

function clearRequestCaches() {
    metadataCache.clear();
    responseCache.clear();
    files = undefined;
    filesInit = undefined;
}

export {
    STALE_MAX_AGE,
    getFilesClient,
    getRequestMetadata,
    rereadRequestMetadata,
    getStoredResponse,
    extractContextFromMetadata,
    storeRequestMetadata,
    clearRequestCaches,
};
