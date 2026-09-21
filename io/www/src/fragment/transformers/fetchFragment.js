import { fetch } from '../utils/common.js';
import { getErrorContext } from '../utils/log.js';
import { PATH_TOKENS, odinReferences, REFERENCES } from '../utils/paths.js';
import { resolveTerritoryCountries, restrictCountryToLocaleMarket } from '../locales.js';

const TRANSFORMER_NAME = 'fetchFragment';

/**
 * First fragment fetch + path parse only. Resolves as soon as surface / parsedLocale / fragmentPath / body are known,
 * without waiting on default-locale variation fetch. Shared via `promises.requestInfos` so dictionary/settings inits
 * can proceed in parallel with that work.
 *
 * Also resolves `wcsCountry` here: this is the earliest point in the pipeline where `surface` is
 * known, which `restrictCountryToLocaleMarket` needs to scope its market lookup (MWPW-207865).
 * `country` is passed through unchanged (it is already the "fixed" content country pipeline.js
 * resolved via `resolveTerritoryCountries` before the init fan-out) — the two are returned
 * separately so a caller reading one never mistakes it for the other.
 * @example
 * // locale es_PR, country: PR -> country: PR, wcsCountry: US
 */
async function resolveRequestInfos(initContext) {
    const { id, locale, country, fragmentsIds, preview } = initContext;
    const toFetchId = fragmentsIds?.['default-locale-id'] || id;
    const path = odinReferences(toFetchId, preview, REFERENCES.ALL);
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
    // `country` is already the "fixed" content country (pipeline.js resolved it via
    // resolveTerritoryCountries before the init fan-out) — pass it through unchanged and only
    // restrict a copy of it for wcsCountry, so the two never collapse into the same value.
    const { wcsCountry } = resolveTerritoryCountries(locale, restrictCountryToLocaleMarket(surface, locale, country));
    return {
        status: 200,
        body: response.body,
        parsedLocale,
        surface,
        fragmentPath,
        country,
        wcsCountry,
    };
}

/**
 * First fragment fetch + path parse. Result is `promises.fetchFragment` (and `promises.requestInfos`).
 * Default-language variation + region locale run in the `defaultLanguage` transformer (before promotions).
 */
function init(initContext) {
    const { promises } = initContext;
    const requestInfosPromise = resolveRequestInfos(initContext);
    if (promises) {
        promises.requestInfos = requestInfosPromise;
    }
    return requestInfosPromise;
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
        country: response.country,
        wcsCountry: response.wcsCountry,
    };
}

export const transformer = {
    init,
    name: TRANSFORMER_NAME,
    process: fetchFragment,
};
