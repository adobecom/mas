const fetchFragment = require('./fetch.js').fetchFragment;
const replace = require('./replace.js').replace;
const collection = require('./collection.js').collection;
const { log } = require('./common.js');
const { Ims } = require('@adobe/aio-lib-ims');

async function main(params) {
    let token;
    let imsValidation;
    const authHeader = params.__ow_headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
        if (token) {
            imsValidation = await new Ims('prod').validateToken(token);
        }
    }
    if (!imsValidation || imsValidation.valid !== true) {
        return {
            statusCode: 401,
            body: 'Unauthorized: Bearer token is missing or invalid',
        };
    }
    const requestId =
        params.__ow_headers?.['x-request-id'] || 'mas-' + Date.now();
    const api_key = params.api_key || 'n/a';
    const DEFAULT_HEADERS = {
        Accept: 'application/json',
        'X-Request-ID': requestId,
        Authorization: `Bearer ${token}`,
    };
    let context = {
        ...params,
        api_key,
        requestId,
        transformer: 'pipeline',
        DEFAULT_HEADERS,
        status: 200,
    };
    log('starting request pipeline', context);
    for (const transformer of [fetchFragment, collection, replace]) {
        if (context.status != 200) break;
        context.transformer = transformer.name;
        context = await transformer(context);
    }
    returnValue = {
        statusCode: context.status,
    };
    if (context.status == 200) {
        returnValue.body = context.body;
    } else {
        returnValue.message = context.message;
    }
    return returnValue;
}

exports.main = main;
