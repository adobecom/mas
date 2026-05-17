import { fetch, getFragmentId } from '../utils/common.js';
import { logDebug } from '../utils/log.js';
import { odinReferences, odinUrl } from '../utils/paths.js';
import { getDefaultLocaleCode, getLocaleCode, getRegionLocales, parseLocaleCode } from '../locales.js';

/**
 * Resolves the fragment body for the default language of the requested locale.
 * On success, sets `context.defaultLocale` (when `locale` is omitted, to `parsedLocale`).
 *
 * @param {*} context - Must include `surface`, `fragmentPath`, `body`, `parsedLocale`. `locale` is optional (request param).
 * @returns {Promise<object>} Success and error shapes:
 *   - No `locale` param: `{ body, parsedLocale, status: 200 }`. `defaultLocale` is not on the return value; read `context.defaultLocale` (set to `parsedLocale`).
 *   - Normal success after resolving default language: `{ body, defaultLocale, status: 200 }` (also `context.defaultLocale`).
 *   - Failure: `{ status, message }` from unknown locale, fragment-id lookup, or default-locale fetch errors.
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

const TRANSFORMER_NAME = 'defaultLanguage';

/**
 * Runs after `fetchFragment` init. Awaits `promises.fetchFragment` (phase 1), then default-language variation +
 * `computeRegionLocale`. Result is `promises.defaultLanguage`.
 */
async function init(initContext) {
    const early = await initContext.promises?.fetchFragment;
    if (!early) {
        return { status: 400, message: 'fetchFragment init not available' };
    }
    if (early.status !== 200) {
        return early;
    }
    const { body: earlyBody, parsedLocale, surface, fragmentPath } = early;
    let context = { ...initContext, body: earlyBody, parsedLocale, surface, fragmentPath };
    const variationResult = await getDefaultLanguageVariation(context);
    /* c8 ignore next 3 — default-locale fetch errors covered via pipeline / customize tests */
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

async function defaultLanguageProcess(context) {
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
    name: TRANSFORMER_NAME,
    init,
    process: defaultLanguageProcess,
};
