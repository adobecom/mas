/**
 * Fragment Client Library
 * A reusable client-side library for working with content fragments
 */

// Import the modules
import { logDebug, logError } from '../../io/www/src/fragment/utils/log.js';
import { getRequestMetadata, storeRequestMetadata, extractContextFromMetadata } from '../../io/www/src/fragment/utils/cache.js';
import { FREYJA_PREVIEW_URL, ODIN_PREVIEW_URL } from '../../io/www/src/fragment/utils/paths.js';
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

let backendMode = 'default';

if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    backendMode = params.get('preview.backend') || 'default';
}

function getPreviewUrl() {
    if (backendMode === 'odin') return ODIN_PREVIEW_URL;
    return FREYJA_PREVIEW_URL;
}

function getPreviewFallback() {
    if (backendMode === 'odin' || backendMode === 'freyja') return undefined;
    return ODIN_PREVIEW_URL;
}

function getPreviewToken() {
    if (backendMode === 'odin') return undefined;
    if (typeof sessionStorage !== 'undefined') {
        const manualToken = sessionStorage.getItem('masFreyjaToken');
        if (manualToken) return manualToken;
    }
    return window.adobeIMS?.getAccessToken()?.token;
}

function getPreviewContext() {
    return {
        preview: { url: getPreviewUrl() },
        fallbackUrl: getPreviewFallback(),
        authToken: getPreviewToken(),
    };
}

const DEFAULT_CONTEXT = {
    status: 200,
    preview:{
        url: getPreviewUrl(),
    },
    fallbackUrl: getPreviewFallback(),
    get authToken() {
        return getPreviewToken();
    },
    requestId: 'preview',
    state: new LocaleStorageState(),
    networkConfig: {
        mainTimeout: 20000,
        fetchTimeout: 4000,
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

/* c8 ignore next 50 */
async function compareBackends(id, options = {}) {
    const runs = options.runs || 3;
    const results = { freyja: [], odin: [] };

    for (let i = 0; i < runs; i++) {
        clearCaches();
        const freyjaToken = sessionStorage.getItem('masFreyjaToken')
            ?? window.adobeIMS?.getAccessToken()?.token;

        const fStart = performance.now();
        const fResult = await previewFragment(id, {
            ...options,
            fullContext: true,
            preview: { url: FREYJA_PREVIEW_URL },
            fallbackUrl: undefined,
            authToken: freyjaToken,
        });
        const fDuration = performance.now() - fStart;
        results.freyja.push({ duration: Math.round(fDuration), status: fResult?.status ?? 200 });

        clearCaches();

        const oStart = performance.now();
        const oResult = await previewFragment(id, {
            ...options,
            fullContext: true,
            preview: { url: ODIN_PREVIEW_URL },
            fallbackUrl: undefined,
            authToken: undefined,
        });
        const oDuration = performance.now() - oStart;
        results.odin.push({ duration: Math.round(oDuration), status: oResult?.status ?? 200 });
    }

    const avg = (arr) => Math.round(arr.reduce((a, b) => a + b.duration, 0) / arr.length);
    const min = (arr) => Math.min(...arr.map((r) => r.duration));
    const max = (arr) => Math.max(...arr.map((r) => r.duration));

    console.group(`[MAS Perf] Freyja vs Odin — fragment ${id} (${runs} runs)`);
    console.table({
        Freyja: { avg_ms: avg(results.freyja), min_ms: min(results.freyja), max_ms: max(results.freyja), status: results.freyja[0]?.status },
        Odin: { avg_ms: avg(results.odin), min_ms: min(results.odin), max_ms: max(results.odin), status: results.odin[0]?.status },
    });
    console.log('Speedup:', `${((avg(results.odin) / avg(results.freyja)) || 0).toFixed(1)}x`);
    console.groupEnd();
    return results;
}

if (typeof window !== 'undefined') {
    window.masCompareBackends = compareBackends;
}

export { clearCaches, getPreviewContext, previewFragment, previewStudioFragment, compareBackends, customize, settings, replace, getDictionary, corrector };
