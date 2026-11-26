import { createTimeoutPromise, getJsonFromState } from './common.js';
import { logDebug } from './log.js';

// ADR DLV-0002: accepted api keys with their request parameter defaults, in the state `apiKeyDefaults` form (merged over these)
const API_KEY_DEFAULTS = {
    '/wcms\\-commerce\\-ims\\-ro\\-user\\-milo(-[a-z]+)?$/': {},
    '/^CreativeCloud_v\\d+_\\d+$/': { surface: 'ccd' },
    AdobeExpressWeb: { surface: 'express' },
    unified_checkout_client_v3: {},
    'concierge-conversation-service': {},
    'acom-bc-service': {},
};

const HARDCODED_WCS_CONFIGURATION = [{ wcsURL: 'https://www.adobe.com/web_commerce_artifact', env: 'prod' }];

const REGEX_FORM = /^\/(.+)\/$/;
const CONFIG_CACHE_TTL = 5 * 60 * 1000;

let cachedConfiguration = null;
let configurationTimestamp = null;

function parseStateApiKeys(values) {
    return values.map((value) => {
        const match = REGEX_FORM.exec(value);
        return match ? new RegExp(match[1]) : value;
    });
}

function isApiKeyAccepted(apiKey, list) {
    return list.some((entry) => (entry instanceof RegExp ? entry.test(apiKey) : entry === apiKey));
}

function mergeWcsConfiguration(stateConfig) {
    const stateEnvs = new Set((stateConfig || []).map((c) => c.env));
    return [...HARDCODED_WCS_CONFIGURATION.filter((c) => !stateEnvs.has(c.env)), ...(stateConfig || [])];
}

async function refreshFromState(context, now) {
    const configTimeout = cachedConfiguration.networkConfig?.configTimeout || 200;
    try {
        const result = await Promise.race([
            getJsonFromState('configuration', context),
            createTimeoutPromise(configTimeout, () => {}),
        ]);
        if (result.json) {
            cachedConfiguration = result.json;
            configurationTimestamp = now;
            logDebug(() => 'Configuration cache expired, refreshed from state', context);
            return result.json;
        }
        logDebug(() => 'Configuration refresh returned null, using stale cache', context);
    } catch (error) {
        if (!error.isTimeout) throw error;
        logDebug(() => 'Configuration refresh timed out, using stale cache', context);
    }
    return cachedConfiguration;
}

async function readConfiguration(context, now) {
    if (!cachedConfiguration) {
        const result = await getJsonFromState('configuration', context);
        if (result.json) {
            cachedConfiguration = result.json;
            configurationTimestamp = now;
        }
        logDebug(() => 'Configuration cache empty, fetched from state', context);
        return result.json;
    }
    if (now - configurationTimestamp <= CONFIG_CACHE_TTL) {
        logDebug(() => 'Using cached configuration', context);
        return cachedConfiguration;
    }
    return refreshFromState(context, now);
}

export async function loadConfiguration(context, now) {
    const configuration = await readConfiguration(context, now);
    const merged = configuration ? { ...context, ...configuration } : context;
    merged.wcsConfiguration = mergeWcsConfiguration(merged.wcsConfiguration);
    return merged;
}

export function validateApiKey(context) {
    if (!context.api_key) return { statusCode: 400, message: 'missing api_key' };
    const accepted = parseStateApiKeys([...Object.keys(API_KEY_DEFAULTS), ...(context.apiKeys ?? [])]);
    if (!isApiKeyAccepted(context.api_key, accepted)) {
        return { statusCode: 401, message: 'unauthorized api_key' };
    }
    return { statusCode: 200 };
}

const findApiKeyEntry = (api_key, config) =>
    Object.entries(config ?? {}).find(([key]) => isApiKeyAccepted(api_key, parseStateApiKeys([key])))?.[1];

/**
 * Request parameter defaults bound to the request api key by the `apiKeyDefaults` configuration
 * (`{ [apiKey or /regex/]: { surface, type } }`), see ADR DLV-0002.
 * The legacy `apiKeySurfaces` configuration (`{ [apiKey or /regex/]: surface }`) is still honoured during the rollout.
 * @returns {{ surface?: string, type?: string }}
 */
export function getApiKeyDefaults({ api_key, apiKeyDefaults, apiKeySurfaces }) {
    const surface = findApiKeyEntry(api_key, apiKeySurfaces);
    return {
        ...(surface && { surface }),
        ...findApiKeyEntry(api_key, API_KEY_DEFAULTS),
        ...findApiKeyEntry(api_key, apiKeyDefaults),
    };
}

export function resetCache() {
    cachedConfiguration = null;
    configurationTimestamp = null;
}
