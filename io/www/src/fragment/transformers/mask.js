import {
    fetch,
    getFragmentId,
    getRequestInfos,
    skimFragmentFromReferences,
    VALID_PARAMETER_VALUE_REGEX,
} from '../utils/common.js';
import { odinUrl, odinReferences } from '../utils/paths.js';
import { logDebug, logError } from '../utils/log.js';
import { createSwrCache } from '../utils/swr-cache.js';

const MASKS_FOLDER = 'masks';
const maskIdCache = createSwrCache({
    name: 'mask-ids',
    ttl: 5 * 60 * 1000,
    previewTtl: 60 * 1000,
    jitter: 0,
    staleWhileRevalidate: false,
    shouldCache: ({ status }) => status === 404,
});

export function clearMaskCache(preview = false) {
    maskIdCache.clear(preview);
}

/**
 * Fetches the mask card fragment by path convention (`masks/<name>`) for a given surface/locale.
 * Returns the skimmed fragment or the failed lookup/hydration status.
 */
async function fetchMaskAtLocale(context, surface, locale, mask) {
    const { preview } = context;
    const url = odinUrl(surface, { locale, fragmentPath: `${MASKS_FOLDER}/${mask}`, preview });
    const { id, status } = await maskIdCache.get(context, url, () =>
        getFragmentId(context, url, `mask-id-${surface}-${locale}-${mask}`),
    );
    if (status !== 200) return { status, operation: 'lookup' };
    const response = await fetch(odinReferences(id, preview), context, `mask-${locale}`);
    if (response.status !== 200) return { status: response.status, operation: 'hydrate' };
    return { fragment: skimFragmentFromReferences(response.body) };
}

function maskFailure({ mask, surface, defaultLocale }, failures) {
    const unavailable = failures.find(({ status, operation }) => status !== 404 || operation !== 'lookup');
    return {
        error: {
            code: unavailable ? 'mask-fetch-failed' : 'mask-not-found',
            status: unavailable?.status ?? 404,
            mask,
            surface,
            defaultLocale,
            failures,
            message: unavailable
                ? `Unable to load mask '${mask}' for ${surface}/${defaultLocale}: ${unavailable.operation} failed in ${unavailable.locale} (HTTP ${unavailable.status}).`
                : `Mask '${mask}' not found for ${surface}/${defaultLocale}. Please translate and publish the mask.`,
        },
    };
}

/**
 * Resolves the mask fragment for `mask`, trying the regional locale first and falling back to the
 * surface default locale. Region/default locales are read from the context (set by `defaultLanguage`).
 */
async function fetchMask(context) {
    const { defaultLocale, mask, regionLocale, surface } = context;
    const locales = regionLocale === defaultLocale ? [regionLocale] : [regionLocale, defaultLocale];
    const failures = [];
    for (const locale of locales) {
        const result = await fetchMaskAtLocale(context, surface, locale, mask);
        if (result.fragment) return result.fragment;
        failures.push({ locale, ...result });
    }
    return maskFailure(context, failures);
}

async function init(context) {
    // mask transformer is only relevant if mask param is present in the request, otherwise we can skip it entirely
    const { mask } = context;
    if (!mask) {
        logDebug(() => `No mask added in that request`, context);
        return null;
    }

    if (!VALID_PARAMETER_VALUE_REGEX.test(mask)) {
        logError(`Invalid mask name '${mask}', ignoring...`, context);
        return null;
    }

    const [{ surface }, { defaultLocale, regionLocale }] = await Promise.all([
        getRequestInfos(context),
        context.promises?.defaultLanguage,
    ]);
    logDebug(() => `Initializing mask transformer for mask '${mask}' on surface ${surface}`, context);
    return fetchMask({ ...context, defaultLocale, regionLocale, surface, mask });
}

/**
 * Resolves the requested mask to its card fragment and exposes it on `context.maskFragment` for the
 * `customize` transformer to overlay.
 * The fetch runs here (not in init) because the region locale is already computed by `defaultLanguage`
 * and the mask identifier is only final after promotions. `context.mask` (the request param) is left
 * untouched so it keeps driving the response cache key.
 */
async function mask(context) {
    const maskFragment = await context.promises?.mask;
    if (maskFragment?.error) {
        const { error } = maskFragment;
        logError(JSON.stringify({ event: 'mask-resolution-failed', ...error }), context);
        return {
            ...context,
            maskError: error,
            ...(context.preview ? { status: error.status, message: error.message } : {}),
        };
    }
    if (!maskFragment) {
        logDebug(() => `No mask to process`, context);
        return context;
    }
    if (maskFragment.fields?.variables?.length > 0) {
        //in that case we add so called variables to the context dictionary,
        // for later user in the replace transformer,
        // those variables are defined in the mask fragment as an array of "key:value" strings,
        // we split them and add them to the context dictionary as key->value pairs
        context.dictionary = {
            ...context?.dictionary,
            ...Object.fromEntries(
                maskFragment.fields.variables
                    .filter((v) => v.includes(':'))
                    .map((v) => [v.slice(0, v.indexOf(':')), v.slice(v.indexOf(':') + 1)]),
            ),
        };
    }

    // maskFragment will later been used in customize transformer to overlay the fragment content with the mask content
    return { ...context, maskFragment };
}

export const transformer = {
    name: 'mask',
    init,
    process: mask,
};
