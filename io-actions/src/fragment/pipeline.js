const fetchFragment = require('./fetch.js').fetchFragment;
const translate = require('./translate.js').translate;
const replace = require('./replace.js').replace;
const collection = require('./collection.js').collection;

async function main(params) {
    let context = { ...params, status: 200 };
    for (const transformer of [fetchFragment, translate, collection, replace]) {
        if (context.status != 200) break;
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
    return returnValue;
}

exports.main = main;
