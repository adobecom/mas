const { getDictionary } = require('../dictionary/dictionary');
const { log, logError } = require('./common.js');
const PH_REGEXP = /{{(\s*([\w\-]+)\s*)}}/gi;

function replaceValues(input, dictionary, calls) {
    const placeholders = input.matchAll(PH_REGEXP);
    let replaced = '';
    let nextIndex = 0;
    for (const match of placeholders) {
        //match without {{ }}
        const key = match[1];
        //we concatenate everything from last iteration to index of placeholder
        replaced = replaced + input.slice(nextIndex, match.index);
        //value will be key in case of undefined or circular reference
        let value =
            dictionary[key] == undefined || calls.includes(key)
                ? key
                : dictionary[key];
        if (value.match(PH_REGEXP)) {
            //the value has nested PH
            calls.push(key);
            value = replaceValues(value, dictionary, calls);
            calls.pop();
        }
        //we concatenate value
        replaced = replaced + value;
        //and update index for next iteration
        nextIndex = match.index + match[0].length;
    }
    replaced = replaced + input.slice(nextIndex);
    return replaced;
}

async function replace(context) {
    const { body } = context;
    let fieldsString = JSON.stringify(body.fields);
    if (fieldsString.match(PH_REGEXP)) {
        const dictionary = await getDictionary(context);
        if (dictionary && Object.keys(dictionary).length > 0) {
            fieldsString = replaceValues(fieldsString, dictionary, []);
            try {
                body.fields = JSON.parse(fieldsString);
            } catch (e) {
                logError(`Failed to parse fieldsString: ${e.message}`, context);
                body.fields = {};
            }
        }
    } else {
        log('no placeholders found in fragment content', context);
    }
    return {
        ...context,
        status: 200,
        body,
    };
}
exports.replace = replace;
