'use strict';

const crypto = require('crypto');
const fetchFragment = require('./fetch.js').fetchFragment;
const { log, logDebug, logError } = require('./common.js');
const translate = require('./translate.js').translate;
const replace = require('./replace.js').replace;
const stateLib = require('@adobe/aio-lib-state');
const zlib = require('zlib');

function calculateHash(body) {
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex');
}

async function main(params) {
    const startTime = Date.now();
    const requestId =
        params.__ow_headers?.['x-request-id'] || 'mas-' + Date.now();
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
    log(`starting request pipeline for ${JSON.stringify(context)}`, context);
    /* istanbul ignore next */
    if (!context.state) {
        context.state = await stateLib.init();
    }
    context.debugLogs =
        (await context.state.get('debugFragmentLogs')).value || false;
    const requestKey = `req-${context.id}-${context.locale}`;
    const cachedMetadataStr = (await context.state.get(requestKey))?.value;
    let cachedMetadata = {};
    if (cachedMetadataStr) {
        log(
            `(${Date.now() - startTime}ms) found cached metadata for ${requestKey} -> ${cachedMetadataStr}`,
            context,
        );
        try {
            cachedMetadata = JSON.parse(cachedMetadataStr);
            const { translatedId, dictionaryId } = cachedMetadata || {};
            context = { ...context, translatedId, dictionaryId };
        } catch (e) {
            logError(
                `Error parsing cached metadata ${cachedMetadataStr}: ${e.message}`,
                context,
            );
        }
    }

    for (const transformer of [fetchFragment, translate, replace]) {
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.transformer = transformer.name;
        context = await transformer(context);
    }
    context.transformer = 'pipeline';
    const returnValue = {
        statusCode: context.status,
    };
    let id = undefined;
    let responseBody = undefined;
    if (context.status == 200) {
        id = context.body.id;
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
        const ifModifiedSince = params.__ow_headers?.['if-modified-since'];
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
    returnValue.headers = {
        ...returnValue.headers,
        'Content-Type': 'application/json',
        'Content-Encoding': 'br',
    };
    returnValue.body =
        responseBody?.length > 0
            ? zlib.brotliCompressSync(responseBody).toString('base64')
            : undefined;
    log(
        `pipeline completed: ${context.id} ${context.locale} -> ${id} (${returnValue.statusCode}) in ${Date.now() - startTime}ms`,
        {
            ...context,
            transformer: 'pipeline',
            requestId,
            api_key,
        },
    );
    return returnValue;
}

exports.main = main;
