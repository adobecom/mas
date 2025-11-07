import { createTimeoutPromise, mark, measureTiming, getJsonFromState } from './utils/common.js';
import { log, logError, logDebug } from './utils/log.js';
import crypto from 'crypto';
import zlib from 'zlib';
import stateLib from '@adobe/aio-lib-state';

import { transformer as fetchFragment } from './transformers/fetchFragment.js';
import { transformer as corrector } from './transformers/corrector.js';
import { transformer as replace } from './transformers/replace.js';
import { transformer as promotions } from './transformers/promotions.js';
import { transformer as settings } from './transformers/settings.js';
import { transformer as customize } from './transformers/customize.js';
import { transformer as wcs } from './transformers/wcs.js';

let cachedConfiguration = null;
let configurationTimestamp = null;
const CONFIG_CACHE_TTL = 5 * 60 * 1000;

function calculateHash(body) {
    return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

const PIPELINE = [fetchFragment, promotions, customize, settings, replace, wcs, corrector];

const RESPONSE_HEADERS = {
    'Access-Control-Expose-Headers': 'X-Request-Id,Etag,Last-Modified,server-timing',
    'Content-Type': 'application/json',
    'Content-Encoding': 'br',
};

async function getRequestMetadata(context) {
    const requestKey = `req-${context.id}-${context.locale}`;
    const { json: cachedMetadata, str: cachedMetadataStr } = await getJsonFromState(requestKey, context);
    if (cachedMetadata) {
        log(`found cached metadata for ${requestKey} -> ${cachedMetadataStr}`, context);
        return cachedMetadata;
    }
    return null;
}

async function main(params) {
    const requestId = params.__ow_headers?.['x-request-id'] || 'mas-' + performance.now();
    const region = process.env.__OW_REGION || 'unknown';
    const api_key = params.api_key || 'n/a';
    const DEFAULT_HEADERS = {
        Accept: 'application/json, */*',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'Mozilla/5.0 (compatible; mas-io-Pipeline/1.0)',
        'X-Request-ID': requestId,
    };
    let context = {
        ...params,
        api_key,
        requestId,
        loggedTransformer: 'pipeline',
        DEFAULT_HEADERS,
        status: 200,
    };
    mark(context, 'start');
    let returnValue;
    let cacheControl;
    log(`starting request pipeline for ${JSON.stringify(context)}`, context);
    /* c8 ignore next 3*/
    if (!context.state) {
        context.state = await stateLib.init();
    }
    try {
        const now = mark(context, 'config-check');
        const cacheExpired = !configurationTimestamp || now - configurationTimestamp > CONFIG_CACHE_TTL;
        let configuration;
        if (!cachedConfiguration) {
            const result = await getJsonFromState('configuration', context);
            configuration = result.json;
            cachedConfiguration = configuration;
            configurationTimestamp = now;
            logDebug(() => 'Configuration cache empty, fetched from state', context);
        } else if (cacheExpired) {
            try {
                const configTimeout = cachedConfiguration.networkConfig?.configTimeout || 200;
                const result = await Promise.race([
                    getJsonFromState('configuration', context),
                    createTimeoutPromise(configTimeout, () => {}),
                ]);
                configuration = result.json;
                cachedConfiguration = configuration;
                configurationTimestamp = now;
                logDebug(() => 'Configuration cache expired, refreshed from state', context);
            } catch (error) {
                if (error.isTimeout) {
                    configuration = cachedConfiguration;
                    logDebug(() => 'Configuration refresh timed out, using stale cache', context);
                }
            }
        } else {
            configuration = cachedConfiguration;
            logDebug(() => 'Using cached configuration', context);
        }
        context = configuration ? { ...context, ...configuration } : context;
        const maxAge = context.networkConfig?.cacheMaxAge || 300;
        const staleWhileRevalidate = context.networkConfig?.cacheStaleWhileRevalidate || 86400;
        cacheControl = `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

        const initTime = measureTiming(context, 'init', 'start').duration;
        let timeout = context.networkConfig?.mainTimeout || 5000;
        timeout = Math.max(timeout - initTime, 0);
        returnValue = await Promise.race([
            mainProcess(context),
            createTimeoutPromise(timeout, () => {
                context.timedOut = true;
            }),
        ]);
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
    delete returnValue.id; // id is not part of the response
    returnValue.headers = {
        ...returnValue.headers,
        ...RESPONSE_HEADERS,
        'Cache-Control': cacheControl,
    };
    returnValue.body = returnValue.body?.length > 0 ? zlib.brotliCompressSync(returnValue.body).toString('base64') : undefined;
    logDebug(() => 'full response: ' + JSON.stringify(returnValue), context);
    measureTiming(context, 'endProcess', 'end');
    const pipelineMeasure = measureTiming(context, 'pipeline', 'start');
    const measures = context.measures
        .map((measure) => `${measure.label} t:${measure.startTime}, d:${measure.duration}`)
        .join('|');
    log(`timings (time and duration) region: ${region}: ${measures}`, context);
    log(
        `pipeline completed: ${context.id} ${context.locale} -> ${returnValue.id} (${returnValue.statusCode}) in ${pipelineMeasure.duration}ms`,
        context,
    );
    return returnValue;
}

async function mainProcess(context) {
    const originalContext = context;

    const cachedMetadata = await getRequestMetadata(context);
    const { fragmentsIds, surface, parsedLocale, fragmentPath } = cachedMetadata || {};
    const requestKey = `req-${context.id}-${context.locale}`;
    context = {
        ...context,
        fragmentsIds,
        surface,
        parsedLocale,
        fragmentPath,
    };
    // Initialize all transformers that have an init function
    // those requests are done in parallel and results stored in context.promises
    const initPromises = {};
    context.fragmentsIds = context.fragmentsIds || {};
    for (const transformer of PIPELINE) {
        if (transformer.init) {
            //we fork context to avoid init to override any context property
            const initContext = {
                ...structuredClone(context),
                promises: initPromises,
                fragmentsIds: context.fragmentsIds,
            };
            initContext.loggedTransformer = `${transformer.name}-init`;
            initPromises[transformer.name] = transformer.init(initContext);
        }
    }
    context.status = 200;
    context.promises = initPromises;

    for (const transformer of PIPELINE) {
        logDebug(() => `starting transformer ${transformer.name}`, context);
        /* c8 ignore next 5*/
        if (originalContext.timedOut) {
            context.status = 504;
            logError(`Pipeline timed out during ${transformer.name}, aborting...`, context);
            break;
        }
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
    const returnValue = {
        statusCode: context.status,
        id: context.body?.id,
    };
    let responseBody = undefined;
    if (context.status == 200) {
        responseBody = JSON.stringify(context.body, null, 0);
        logDebug(() => `response body: ${responseBody}`, context);
        // Calculate hash of response body
        const hash = calculateHash(responseBody);
        const updated = !cachedMetadata?.hash || cachedMetadata.hash !== hash;
        let lastModified = new Date(Date.now());
        if (updated || !cachedMetadata?.fragmentPath) {
            //we add fragment path to condition to ensure cache is updated
            const metadata = JSON.stringify({
                fragmentsIds: context.fragmentsIds,
                fragmentPath: context.fragmentPath,
                hash,
                lastModified: lastModified.toUTCString(),
                parsedLocale: context.parsedLocale,
                surface: context.surface,
            });
            log(`updating cache for ${requestKey} -> ${metadata}`, context);
            mark(context, 'req-state-put');
            await context.state.put(requestKey, metadata);
            measureTiming(context, 'req-state-put');
        } else if (cachedMetadata?.lastModified) {
            lastModified = new Date(cachedMetadata.lastModified);
        }
        // Check If-Modified-Since header
        const ifModifiedSince = context.__ow_headers?.['if-modified-since'];
        if (ifModifiedSince) {
            const modifiedSince = new Date(ifModifiedSince);
            if (lastModified.getTime() <= modifiedSince.getTime()) {
                returnValue.statusCode = 304;
                responseBody = undefined;
            }
        }
        returnValue.headers = {
            ...returnValue.headers,
            ETag: `${hash}`,
            'Last-Modified': lastModified.toUTCString(),
        };
    } else {
        responseBody = JSON.stringify({
            message: context.message,
        });
    }
    returnValue.body = responseBody;
    return returnValue;
}

export function resetCache() {
    cachedConfiguration = null;
    configurationTimestamp = null;
}

export { main };
