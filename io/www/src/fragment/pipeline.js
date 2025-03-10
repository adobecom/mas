const fetchFragment = require('./fetch.js').fetchFragment;
const translate = require('./translate.js').translate;
const replace = require('./replace.js').replace;
const collection = require('./collection.js').collection;
const { log } = require('./common.js');

async function main(params) {
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
    log('starting request pipeline', context);
    for (const transformer of [fetchFragment, translate, collection, replace]) {
        if (context.status != 200) break;
        context.transformer = transformer.name;
        context = await transformer(context);
    }
    returnValue = {
        status: context.status,
    };
    if (context.status == 200) {
        returnValue.body = context.body;
    } else {
        returnValue.message = context.message;
    }
    log('ending request pipeline', context);
    return returnValue;
}

exports.main = main;
