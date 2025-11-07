import { odinReferences, odinUrl } from '../utils/paths.js';
import { fetch, getFragmentId, getRequestInfos } from '../utils/common.js';
import { log, logDebug, logError } from '../utils/log.js';

const DICTIONARY_ID_PATH = 'dictionary/index';
const PH_REGEXP = /{{(\s*([\w\-\_]+)\s*)}}/gi;

const TRANSFORMER_NAME = 'replace';

async function getDictionaryId(context) {
    const { surface } = await getRequestInfos(context);
    const { locale, preview } = context;
    const dictionaryUrl = odinUrl(surface, locale, DICTIONARY_ID_PATH, preview);
    const { id, status, message } = await getFragmentId(context, dictionaryUrl, 'dictionary-id');
    if (status != 200) {
        return { status, message };
    }
    return { status: 200, id };
}

function extractValue(ref) {
    const value = ref.value || ref.richTextValue?.value || '';
    // Escape control characters and double quotes before parsing
    return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').replace(/"/g, '\\"');
}

export async function getDictionary(context) {
    /* c8 ignore next 1 */
    if (context.hasExternalDictionary) return context.dictionary;
    const dictionary = context.dictionary || {};
    const { id } = await getDictionaryId(context);
    if (!id) {
        return dictionary;
    }
    const response = await fetch(odinReferences(id, true, context.preview), context, 'dictionary');
    if (response.status == 200) {
        const references = response.body.references;
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
    return dictionary;
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
        let value = dictionary[key] == undefined || calls.includes(key) ? key : dictionary[key];
        if (value?.match(PH_REGEXP)) {
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

async function init(context) {
    // we fetch dictionary at this stage only if id has already been cached
    // because we can't know surface of fragment *before* first fetch
    // if dictionaryId is present in cache - early load dictionary
    // if nothing in cache - dictionaryId and dictionary itself will be loaded later,
    // during process
    return await getDictionary(context);
}

async function replace(context) {
    let body = context.body;
    let bodyString = JSON.stringify(body);
    if (bodyString.match(PH_REGEXP)) {
        let dictionary = await context?.promises?.[TRANSFORMER_NAME];
        if (dictionary) {
            //we need to merge init dictionary with the one initiated in context
            dictionary = { ...dictionary, ...context.dictionary };
        } else {
            dictionary = await getDictionary(context);
        }
        if (dictionary && Object.keys(dictionary).length > 0) {
            bodyString = replaceValues(bodyString, dictionary, []);
            try {
                body = JSON.parse(bodyString);
                /* c8 ignore next 4 */
            } catch (e) {
                logError(`[replace] ${e.message}`, context);
                logDebug(() => `[replace] invalid json: ${bodyString}`, context);
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
export const transformer = {
    name: TRANSFORMER_NAME,
    process: replace,
    init,
};
