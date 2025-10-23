import { odinReferences, odinPath } from './paths.js';
import { fetch, log, logDebug, logError } from './common.js';
const DICTIONARY_ID_PATH = 'dictionary/index';
const PH_REGEXP = /{{(\s*([\w\-\_]+)\s*)}}/gi;

const TRANSFORMER_NAME = 'replace';

async function getDictionaryId(context) {
    const { surface, locale, preview } = context;
    const dictionaryPath = odinPath(surface, locale, DICTIONARY_ID_PATH, preview);
    const response = await fetch(dictionaryPath, context, 'dictionary-id');
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
    const value = ref.value || ref.richTextValue?.value || '';
    // Escape control characters and double quotes before parsing
    return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').replace(/"/g, '\\"');
}

// Helper function to process entries for a fragment and its parents
function processFragmentHierarchy(fragmentId, rootFragment, references, dictionary) {
    // Get the fragment from references or use root
    const fragment = fragmentId === rootFragment.id ? rootFragment : references[fragmentId]?.value;

    if (!fragment) return;

    // Process this fragment's entries first (child takes precedence)
    const entries = fragment.fields?.entries || [];
    entries.forEach((entryId) => {
        const entry = references[entryId]?.value?.fields;
        if (entry?.key && !(entry.key in dictionary)) {
            //we just test truthy keys as we can have empty placeholders
            //(treated different from absent ones)
            dictionary[entry.key] = extractValue(entry);
        }
    });

    // Then process parent if exists
    const parentId = fragment.fields?.parent;
    if (parentId) {
        processFragmentHierarchy(parentId, rootFragment, references, dictionary);
    }
}

export async function getDictionary(context) {
    /* c8 ignore next 1 */
    if (context.hasExternalDictionary) return context.dictionary;
    const dictionary = context.dictionary || {};
    const id = context.dictionaryId ?? (await getDictionaryId(context));
    if (!id) {
        return dictionary;
    }
    const response = await fetch(odinReferences(id, true, context.preview), context, 'dictionary');
    if (response.status == 200) {
        const references = response.body.references;
        const rootFragment = response.body;

        // Start processing from root fragment (handles hierarchical parent chain)
        processFragmentHierarchy(rootFragment.id, rootFragment, references, dictionary);

        // Also process any additional entries in references not in entries array
        // (for backward compatibility with flat dictionary structure)
        Object.keys(references).forEach((refId) => {
            const ref = references[refId]?.value?.fields;
            if (ref?.key && !(ref.key in dictionary)) {
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
    return context.dictionaryId ? await getDictionary(context) : null;
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
