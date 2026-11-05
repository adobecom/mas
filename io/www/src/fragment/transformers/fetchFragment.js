import { fetch } from '../utils/common.js';
import { getErrorContext } from '../utils/log.js';
import { PATH_TOKENS, odinReferences, REFERENCES } from '../utils/paths.js';
import { resolveCommerceCountries } from '../locales.js';
import { resolveOfferInfos } from './offer.js';

const TRANSFORMER_NAME = 'fetchFragment';

/**
 * First fragment fetch + path parse only. Resolves as soon as surface / parsedLocale / fragmentPath / body are known,
 * without waiting on default-locale variation fetch. Shared via `promises.requestInfos` so dictionary/settings inits
 * can proceed in parallel with that work.
 *
 * Also resolves `country` (restricted to the locale's market family) and `wcsCountry` here: this
 * is the earliest point in the pipeline where `surface` is known, which
 * `restrictCountryToLocaleMarket` needs to scope its market lookup (MWPW-207865).
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
    const { requestedSurface } = initContext;
    if (requestedSurface && requestedSurface !== surface) {
        return { status: 404, message: `fragment ${id} not found on surface '${requestedSurface}'` };
    }
    return {
        status: 200,
        body: response.body,
        parsedLocale,
        surface,
        fragmentPath,
        ...resolveCommerceCountries(surface, locale, country),
    };
}

/**
 * First fragment fetch + path parse. Result is `promises.fetchFragment` (and `promises.requestInfos`).
 * Default-language variation + region locale run in the `defaultLanguage` transformer (before promotions).
 * Without a fragment `id`, the main body is an offer/template baseline resolved by the `offer` transformer
 * (see {@link resolveOfferInfos}), whose promise is shared as the `offer` init result.
 */
function init(initContext) {
    const { promises } = initContext;
    const requestInfosPromise = initContext.id ? resolveRequestInfos(initContext) : resolveOfferInfos(initContext);
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
