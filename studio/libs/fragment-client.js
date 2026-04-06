/**
 * Fragment Client Library
 * A reusable client-side library for working with content fragments
 */

// Import the modules
import { logDebug, logError } from '../../io/www/src/fragment/utils/log.js';
import { getRequestMetadata, storeRequestMetadata, extractContextFromMetadata } from '../../io/www/src/fragment/utils/cache.js';
import { transformer as corrector } from '../../io/www/src/fragment/transformers/corrector.js';
import { transformer as fetchFragment } from '../../io/www/src/fragment/transformers/fetchFragment.js';
import { clearDictionaryCache, getDictionary, transformer as replace } from '../../io/www/src/fragment/transformers/replace.js';
import { clearSettingsCache, transformer as settings } from '../../io/www/src/fragment/transformers/settings.js';
import { transformer as customize } from '../../io/www/src/fragment/transformers/customize.js';
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
        mainTimeout: 20000,
        fetchTimeout: 15000,
        retries: 3,
    },
    locale: 'en_US',
};

if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    DEFAULT_CONTEXT.debugLogs = params.has('debug.io') || DEFAULT_CONTEXT.state.get('debug.io') === 'true';
    if (params.has('clearCaches.io')) {
        clearCaches();
    }
}

function clearCaches() {
    clearDictionaryCache(true);
    clearSettingsCache(true);
}

async function previewFragment(id, options) {
    const serviceElement = document.head.querySelector('mas-commerce-service');
    const locale = serviceElement?.getAttribute('locale');
    const country = serviceElement?.getAttribute('country');
    let context = { ...DEFAULT_CONTEXT, locale, country, ...options, id, api_key: 'fragment-client' };
    const initPromises = {};    
    const cachedMetadata = await getRequestMetadata(context);
    const metadataContext = extractContextFromMetadata(cachedMetadata);
    context = { ...context, ...metadataContext };
    context.fragmentsIds = context.fragmentsIds || {};
    try {    
        for (const transformer of PIPELINE) {
            if (transformer.init) {
                //we fork context to avoid init to override any context property
                const initContext = {
                    ...structuredClone(context),
                    promises: initPromises,
                    fragmentsIds: context.fragmentsIds,
                };
                initContext.loggedTransformer = `${transformer.name}-init`;
                logDebug(() => `Initializing transformer ${transformer.name}`, initContext);
                initPromises[transformer.name] = transformer.init(initContext);
            }
        }
        context.promises = initPromises;
        for (const transformer of PIPELINE) {
            if (context.status != 200) {
                break;
            }
            context.loggedTransformer = transformer.name;
            logDebug(() => `Processing transformer ${transformer.name}`, context);
            context = await transformer.process(context);
        }
    } catch (error) {
        logError(error.message, context);
        context = { ...context, status: 500, message: error.message };
        return context;
    }
    if (context.status != 200) {
        const { message } = context;
        logError(message, context);
        context.body = { message };
    } else {
        await storeRequestMetadata(context, cachedMetadata, 'nohash');
    }
    return options.fullContext ? context : context.body;
}

/* c8 ignore next 38 */
async function previewStudioFragment(body, options) {
    let context = { ...DEFAULT_CONTEXT, ...options, body, api_key: 'fragment-client-studio' };
    const { locale, surface } = options;
    const initPromises = {
        fetchFragment: Promise.resolve({
            status: 200,
            body: context.body,
            locale,
            surface,
        }),
    };
    context.fragmentsIds = context.fragmentsIds || {};
    context.hasExternalDictionary = Boolean(context.dictionary);
    for (const transformer of [settings, replace, corrector]) {
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
    for (const transformer of [settings, replace, corrector]) {
        if (context.status != 200) {
            break;
        }
        context.transformer = transformer.name;
        context = await transformer.process(context);
    }
    if (context.status != 200) {
        const { message } = context;
        logError(message, context);
        context.body = { message };
    }
    return context.body;
}

export { clearCaches, previewFragment, previewStudioFragment, customize, settings, replace, getDictionary, corrector };
