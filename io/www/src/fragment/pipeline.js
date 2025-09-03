'use strict';

const fetchFragment = require('./fetch.js').fetchFragment;
const {
    createTimeoutPromise,
    log,
    logDebug,
    logError,
    mark,
    measureTiming,
    getFromState,
    getJsonFromState,
} = require('./common.js');
const corrector = require('./corrector.js').corrector;
const crypto = require('crypto');
const replace = require('./replace.js').replace;
const settings = require('./settings.js').settings;
const stateLib = require('@adobe/aio-lib-state');
const translate = require('./translate.js').translate;
const wcs = require('./wcs.js').wcs;
const zlib = require('zlib');

function calculateHash(body) {
    return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

const RESPONSE_HEADERS = {
    'Access-Control-Expose-Headers': 'X-Request-Id,Etag,Last-Modified,server-timing',
    'Content-Type': 'application/json',
    'Content-Encoding': 'br',
};

async function main(params) {
    const requestId = params.__ow_headers?.['x-request-id'] || 'mas-' + Date.now();
    const region = params.__ow_region || 'unknown';
    const api_key = params.api_key || 'n/a';
    const DEFAULT_HEADERS = {
        Accept: 'application/json',
        'X-Request-ID': requestId,
    };
    let context = {
        ...params,
        api_key,
        requestId,
        transformer: 'pipeline',
        DEFAULT_HEADERS,
        status: 200,
    };
    mark(context, 'start');
    let returnValue;
    log(`starting request pipeline for ${JSON.stringify(context)}`, context);
    /* istanbul ignore next */
    if (!context.state) {
        context.state = await stateLib.init();
    }
    try {
        const { json } = await getJsonFromState('network-config', context);
        context.networkConfig = json || {};
        const initTime = measureTiming(context, 'init', 'start').duration;
        let timeout = context.networkConfig.mainTimeout || 5000;
        timeout = Math.max(timeout - initTime, 0);
        returnValue = await Promise.race([
            mainProcess(context),
            createTimeoutPromise(timeout, () => {
                context.timedOut = true;
            }),
        ]);
    } catch (error) {
        logError(`Error occurred while processing request: ${error.message} ${error.stack}`, context);
        /* istanbul ignore next */
        if (error.isTimeout) {
            returnValue = {
                statusCode: 504,
                headers: RESPONSE_HEADERS,
                message: 'Fragment pipeline timed out',
            };
        } else {
            /* istanbul ignore next */
            returnValue = {
                statusCode: 503,
                message: error?.message || 'Internal Server Error',
                headers: RESPONSE_HEADERS,
            };
        }
    }
    const pipelineMeasure = measureTiming(context, 'pipeline', 'start');
    log(
        `pipeline completed: ${context.id} ${context.locale} -> ${returnValue.id} (${returnValue.statusCode}) in ${pipelineMeasure.duration}ms`,
        {
            ...context,
            transformer: 'pipeline',
        },
    );
    const measures = context.measures
        .map((measure) => `${measure.label} t:${measure.startTime}, d:${measure.duration}`)
        .join('|');
    log(`timings (_t_ime and _d_uration) region: ${region}: ${measures}`, context);
    delete returnValue.id; // id is not part of the response
    returnValue.headers = {
        ...returnValue.headers,
        ...RESPONSE_HEADERS,
    };
    returnValue.body = returnValue.body?.length > 0 ? zlib.brotliCompressSync(returnValue.body).toString('base64') : undefined;
    logDebug(() => 'full response: ' + JSON.stringify(returnValue), context);
    return returnValue;
}

async function mainProcess(context) {
    context.debugLogs = await getFromState('debugFragmentLogs', context);
    const originalContext = context;
    const requestKey = `req-${context.id}-${context.locale}`;
    const { json: cachedMetadata, str: cachedMetadataStr } = await getJsonFromState(requestKey, context);
    if (cachedMetadata) {
        log(`found cached metadata for ${requestKey} -> ${cachedMetadataStr}`, context);
        const { translatedId, dictionaryId } = cachedMetadata;
        context = { ...context, translatedId, dictionaryId };
    }

    for (const transformer of [fetchFragment, translate, settings, replace, wcs, corrector]) {
        /* istanbul ignore next */
        if (originalContext.timedOut) {
            logError(`Pipeline timed out during ${transformer.name}, aborting...`, context);
            break;
        }
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.transformer = transformer.name;
        mark(context, transformer.name);
        context = await transformer(context);
        measureTiming(context, transformer.name);
    }
    context.transformer = 'pipeline';
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
        if (updated) {
            const metadata = JSON.stringify({
                hash,
                lastModified: lastModified.toUTCString(),
                translatedId: context.translatedId,
                dictionaryId: context.dictionaryId,
            });
            log(`updating cache for ${requestKey} -> ${metadata}`, context);
            await context.state.put(requestKey, metadata);
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

exports.main = main;
