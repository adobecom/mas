import { fetch, getFragmentId } from '../utils/common.js';
import { getErrorContext, logDebug } from '../utils/log.js';
import { PATH_TOKENS, odinReferences, odinUrl } from '../utils/paths.js';
import { getDefaultLocaleCode, getLocaleCode, getRegionLocales, parseLocaleCode } from '../locales.js';

/**
 * get fragment associated to default language, just returning the body
 * @param {*} context
 *  - 'locale' comes from request parameter, so can be optional
 *  - 'parsedLocale' is the actual location of the fetched fragment
 * @returns null if something wrong, [] if not found, body if found
 */
export async function getDefaultLanguageVariation(context) {
    let { body } = context;
    const { surface, locale, fragmentPath, preview, parsedLocale } = context;
    if (!locale) {
        context.defaultLocale = parsedLocale;
        return { body, parsedLocale, status: 200 };
    }
    const defaultLocale = getDefaultLocaleCode(surface, locale);
    if (!defaultLocale) {
        return { status: 400, message: `Default locale not found for requested locale '${locale}'` };
    }
    if (defaultLocale !== parsedLocale) {
        logDebug(() => `Looking for fragment id for ${surface}/${defaultLocale}/${fragmentPath}`, context);
        const defaultLocaleIdUrl = odinUrl(surface, { locale: defaultLocale, fragmentPath, preview });
        const { id: defaultLocaleId, status, message } = await getFragmentId(context, defaultLocaleIdUrl, 'default-locale-id');
        if (status != 200) {
            return { status, message };
        }
        const defaultLocaleUrl = odinReferences(defaultLocaleId, true, preview);
        const response = await fetch(defaultLocaleUrl, context, 'default-locale-fragment');
        if (response.status != 200 || !response.body) {
            /* c8 ignore next */
            const message = response.message || 'Error fetching default locale fragment';
            /* c8 ignore next */
            return { status: response.status || 503, message };
        }
        ({ body } = response);
    }
    context.defaultLocale = defaultLocale;
    return { body, defaultLocale, status: 200 };
}

/**
 * Returns the locale used for regional paths and personalization.
 * If the request uses the default locale code but country differs from that locale's default country and maps to a
 * known region for that language on the surface, returns that regional code (e.g. fr_FR + CA → fr_CA).
 * If the requested locale is already a regional code, it is preserved when no country override applies.
 * @param {*} context
 * @returns {string}
 */
export function computeRegionLocale(context) {
    const { locale, defaultLocale: defaultLocaleCode, surface } = context;
    const country = context.country?.toUpperCase();
    const [, defaultCountry] = parseLocaleCode(defaultLocaleCode);
    const defaultCountryUpper = defaultCountry?.toUpperCase();
    const effectiveCountry = country && defaultCountryUpper != null && country !== defaultCountryUpper ? country : null;

    let regionLocale = locale;
    if (locale !== defaultLocaleCode || effectiveCountry != null) {
        const regionObjects = getRegionLocales(surface, defaultLocaleCode, true);
        const regionLocaleObject =
            effectiveCountry != null ? regionObjects.find((r) => r.country?.toUpperCase() === effectiveCountry) : null;
        const mapped = regionLocaleObject ? getLocaleCode(regionLocaleObject) : null;
        regionLocale = mapped || locale;
    }
    logDebug(
        () =>
            `Computed region locale '${regionLocale}' for requested locale '${locale}' with country '${country}' on surface '${surface}'`,
        context,
    );
    return regionLocale;
}

const TRANSFORMER_NAME = 'fetchFragment';

async function init(initContext) {
    const { id, locale, fragmentsIds, preview } = initContext;
    if (id && locale) {
        const toFetchId = fragmentsIds?.['default-locale-id'] || id;
        const path = odinReferences(toFetchId, true, preview);
        const response = await fetch(path, initContext, 'fragment');
        if (response?.status != 200) {
            return await getErrorContext(response);
        }
        const match = response?.body?.path?.match(PATH_TOKENS);
        if (!match) {
            return {
                status: 400,
                message: 'source path is either not here or invalid',
            };
        }

        const { parsedLocale, surface, fragmentPath } = match.groups;
        let context = { ...initContext, body: response.body, parsedLocale, surface, fragmentPath };
        const variationResult = await getDefaultLanguageVariation(context);
        /* c8 ignore next 3 — default-locale fetch errors are covered via customize / pipeline */
        if (variationResult.status != 200) {
            return variationResult;
        }
        context = { ...context, body: variationResult.body };
        const defaultLocale = context.defaultLocale;
        const regionLocale = computeRegionLocale({ ...context, defaultLocale });
        return {
            ...initContext,
            status: 200,
            body: variationResult.body,
            parsedLocale,
            surface,
            fragmentPath,
            defaultLocale,
            locale: regionLocale,
            regionLocale,
        };
    }
    return {
        status: 400,
        message: 'requested parameters id & locale are not present',
    };
}

async function fetchFragment(context) {
    const response = await context.promises?.[TRANSFORMER_NAME];
    if (response?.status !== 200) {
        return response;
    }
    return {
        ...context,
        body: response.body,
        parsedLocale: response.parsedLocale,
        surface: response.surface,
        fragmentPath: response.fragmentPath,
        defaultLocale: response.defaultLocale,
        locale: response.locale,
        regionLocale: response.regionLocale,
    };
}

export const transformer = {
    init,
    name: TRANSFORMER_NAME,
    process: fetchFragment,
};
