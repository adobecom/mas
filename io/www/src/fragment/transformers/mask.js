import { fetch, getFragmentId, getRequestInfos, skimFragmentFromReferences } from '../utils/common.js';
import { odinUrl, odinReferences } from '../utils/paths.js';
import { logDebug } from '../utils/log.js';

const MASKS_FOLDER = 'masks';

/**
 * Fetches the mask card fragment by path convention (`masks/<name>`) for a given surface/locale.
 * Returns the skimmed fragment (references stripped) or null when not found.
 */
async function fetchMaskAtLocale(context, surface, locale, mask) {
    const { preview } = context;
    const url = odinUrl(surface, { locale, fragmentPath: `${MASKS_FOLDER}/${mask}`, preview });
    const { id, status } = await getFragmentId(context, url, `mask-id-${locale}`);
    if (status !== 200) return null;
    const response = await fetch(odinReferences(id, false, preview), context, `mask-${locale}`);
    if (response.status !== 200) return null;
    return skimFragmentFromReferences(response.body);
}

/**
 * Resolves the mask fragment for `mask`, trying the regional locale first and falling back to the
 * surface default locale. Region/default locales are read from the context (set by `defaultLanguage`).
 */
async function fetchMask(context) {
    const { defaultLocale, mask, regionLocale, surface } = context;
    const locales = regionLocale === defaultLocale ? [regionLocale] : [regionLocale, defaultLocale];
    for (const locale of locales) {
        const maskFragment = await fetchMaskAtLocale(context, surface, locale, mask);
        if (maskFragment) return maskFragment;
    }
    return null;
}

async function init(context) {
    // mask transformer is only relevant if mask param is present in the request, otherwise we can skip it entirely
    // maskTag (set by the promotions transformer) takes precedence over the request mask param
    const { mask } = context;
    if (!mask) {
        logDebug(() => `No mask added in that request`, context);
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
 * `customize` transformer to overlay. Placed after `promotions` (which may set `context.maskTag`),
 * so the effective identifier is the promotion-set tag if present, otherwise the request `mask` param.
 * The fetch runs here (not in init) because the region locale is already computed by `defaultLanguage`
 * and the mask identifier is only final after promotions. `context.mask` (the request param) is left
 * untouched so it keeps driving the response cache key.
 */
async function mask(context) {
    const maskFragment = await context.promises?.mask;
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
            ...Object.fromEntries(maskFragment.fields.variables.map((v) => v.split(':'))),
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
