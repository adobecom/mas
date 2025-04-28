const { odinReferences, odinPath } = require('./paths.js');
const { fetch, log, logError } = require('./common.js');
const DICTIONARY_ID_PATH = 'dictionary/index';
const PH_REGEXP = /{{(\s*([\w\-]+)\s*)}}/gi;

async function getDictionaryId(context) {
    const { surface, locale, preview } = context;
    const dictionaryPath = odinPath(
        surface,
        locale,
        DICTIONARY_ID_PATH,
        preview,
    );
    const response = await fetch(dictionaryPath, context);
    if (response.status == 200) {
        const { items } = response.body;
        if (items?.length > 0) {
            const id = items[0].id;
            context.dictionaryId = id;
            return id;
        }
    }
    return null;
}

function extractValue(ref) {
    const value = ref.value || ref?.richTextValue?.value || '';
    // Escape control characters before parsing
    return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

async function getDictionary(context) {
    const id = context.dictionaryId || (await getDictionaryId(context));
    if (!id) {
        return null;
    }
    const response = await fetch(
        odinReferences(id, true, context.preview),
        context,
    );
    if (response.status == 200) {
        const references = response.body.references;
        const dictionary = {};
        Object.keys(references).forEach((id) => {
            const ref = references[id]?.value?.fields;
            if (ref?.key) {
                //we just test truthy keys as we can have empty placeholders
                //(treated different from absent ones)
                dictionary[ref.key] = extractValue(ref);
            }
        });
        return dictionary;
    }
    return null;
}

function replaceValues(input, dictionary, calls) {
    const placeholders = input.matchAll(PH_REGEXP);
    let replaced = '';
    let nextIndex = 0;
    for (const match of placeholders) {
        //match without {{ }}
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
    let body = context.body;
    let bodyString = JSON.stringify(body);
    if (bodyString.match(PH_REGEXP)) {
        const dictionary = await getDictionary(context);
        if (dictionary && Object.keys(dictionary).length > 0) {
            bodyString = replaceValues(bodyString, dictionary, []);
            try {
                body = JSON.parse(bodyString);
            } catch (e) {
                /* istanbul ignore next */
                logError(`[replace] ${e.message}`, context);
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
