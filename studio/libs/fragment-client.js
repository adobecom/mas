/**
 * Fragment Client Library
 * A reusable client-side library for working with content fragments
 */

// Import the modules
import { logError } from '../../io/www/src/fragment/utils/log.js';
import { getRequestMetadata, storeRequestMetadata, extractContextFromMetadata } from '../../io/www/src/fragment/utils/cache.js';
import { transformer as corrector } from '../../io/www/src/fragment/transformers/corrector.js';
import { transformer as fetchFragment } from '../../io/www/src/fragment/transformers/fetchFragment.js';
import { getDictionary, transformer as replace } from '../../io/www/src/fragment/transformers/replace.js';
import { transformer as settings } from '../../io/www/src/fragment/transformers/settings.js';
import { transformer as customize, LOCALE_DEFAULTS } from '../../io/www/src/fragment/transformers/customize.js';
import { transformer as promotions } from '../../io/www/src/fragment/transformers/promotions.js';

const PIPELINE = [fetchFragment, promotions, customize, settings, replace, corrector];
class LocaleStorageState {
    constructor() {        
    }

    async get(key) {
        return new Promise((resolve) => {
            resolve({
                value: window.localStorage.getItem(key),
            });
        });
    }

    async put(key, value) {
        return new Promise((resolve) => {
            window.localStorage.setItem(key, value);
            resolve();
        });
    }
}

const DEFAULT_CONTEXT = {
    status: 200,
    preview:{
        url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
    },
    requestId: 'preview',
    state: new LocaleStorageState(),
    networkConfig: {
        mainTimeout: 15000,
        fetchTimeout: 10000,
        retries: 3,
    },
    api_key: 'n/a',
    locale: 'en_US',
};

async function previewFragment(id, options) {
    let context = { ...DEFAULT_CONTEXT, ...options, id };
    const initPromises = {};    
    const cachedMetadata = await getRequestMetadata(context);
    const metadataContext = extractContextFromMetadata(cachedMetadata);
    context = { ...context, ...metadataContext };
    context.fragmentsIds = context.fragmentsIds || {};
    for (const transformer of PIPELINE) {
        if (transformer.init) {
            //we fork context to avoid init to override any context property
            const initContext = {
                ...structuredClone(context),
                promises: initPromises,
                fragmentsIds: context.fragmentsIds,
            };
            initContext.loggedTransformer = `${transformer.name}-init`;
            initPromises[transformer.name] = transformer.init(initContext);
        }
    }
    context.promises = initPromises;
    for (const transformer of PIPELINE) {
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.loggedTransformer = transformer.name;
        context = await transformer.process(context);
    }
    if (context.status != 200) {
        logError(context.message, context);
    } else {
        await storeRequestMetadata(context, cachedMetadata, 'nohash');
    }
    return context.body;
}

async function previewFragmentForEditor(id, options) {
    let context = { ...DEFAULT_CONTEXT, ...options, id };
    const initPromises = {};
    context.fragmentsIds = context.fragmentsIds || {};
    for (const transformer of PIPELINE) {
        if (transformer.init) {
            const initContext = {
                ...structuredClone(context),
                promises: initPromises,
                fragmentsIds: context.fragmentsIds,
            };
            initContext.loggedTransformer = `${transformer.name}-init`;
            initPromises[transformer.name] = transformer.init(initContext);
        }
    }
    context.promises = initPromises;
    for (const transformer of PIPELINE) {
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.loggedTransformer = transformer.name;
        context = await transformer.process(context);
    }
    if (context.status != 200) {
        logError(context.message, context);
    }
    return context;
}

/* c8 ignore next 38 */
async function previewStudioFragment(body, options) {
    let context = { ...DEFAULT_CONTEXT, ...options, body };
    context.hasExternalDictionary = Boolean(context.dictionary);
    for (const transformer of [settings, replace, corrector]) {
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.transformer = transformer.name;
        context = await transformer.process(context);
    }
    if (context.status != 200) {
        logError(context.message, context);
    }
    return context.body;
}

export { previewFragment, previewFragmentForEditor, previewStudioFragment, customize, settings, replace, getDictionary, corrector, LOCALE_DEFAULTS };
