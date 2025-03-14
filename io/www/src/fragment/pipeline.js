const fetchFragment = require('./fetch.js').fetchFragment;
const translate = require('./translate.js').translate;
const replace = require('./replace.js').replace;
const collection = require('./collection.js').collection;
const stateLib = require('@adobe/aio-lib-state');
const { log, logError } = require('./common.js');
const crypto = require('crypto');

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
    log(
        `starting request pipeline for ${context.id} in ${context.locale}`,
        context,
    );
    /* istanbul ignore next */
    if (!context.state) {
        context.state = await stateLib.init();
    }
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

    for (const transformer of [fetchFragment, translate, collection, replace]) {
        if (context.status != 200) break;
        context.transformer = transformer.name;
        context = await transformer(context);
    }
    returnValue = {
        statusCode: context.status,
    };
    if (context.status == 200) {
        returnValue.body = context.body;
        // Calculate hash of response body
        const hash = calculateHash(context.body);
        const updated = !cachedMetadata?.hash || cachedMetadata.hash !== hash;
        let lastModified = new Date(Date.now());
        if (updated) {
            const metadata = JSON.stringify({
                hash,
                lastModified: lastModified.toISOString(),
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
                delete returnValue.body;
            }
        }
        returnValue.headers = {
            ...returnValue.headers,
            ETag: `${hash}`,
            'Last-Modified': lastModified.toUTCString(),
        };
    } else {
        returnValue.message = context.message;
    }
    const endTime = Date.now();
    log(
        `pipeline completed: ${context.id} ${context.locale} -> (${returnValue.statusCode}) in ${endTime - startTime}ms`,
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
