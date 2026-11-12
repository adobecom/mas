import {
    Commitment,
    ERROR_MESSAGE_BAD_REQUEST,
    ERROR_MESSAGE_OFFER_NOT_FOUND,
    Env,
    MARK_DURATION_SUFFIX,
    MARK_START_SUFFIX,
    PlanType,
    SUPPORTED_COUNTRIES,
    Term,
} from './constants.js';
import { applyPlanType } from '../../price/src/index.js';
import { Defaults } from './defaults.js';
import { Log } from './log.js';
import { MasError } from './mas-error.js';
import { getLogHeaders, getService } from './utilities.js';
import { printMeasure } from './utils.js';
import { masFetch } from './utils/mas-fetch.js';

const NAMESPACE = 'wcs';

/**
 * @typedef {Object} Offer
 * @property {string} offerType - The type of offer (e.g. 'BASE')
 * @property {string} offerId - Unique identifier for the offer
 * @property {string} productArrangementCode - Code identifying the product arrangement
 * @property {string} pricePoint - The price point identifier
 * @property {string} customerSegment - The customer segment this offer targets
 * @property {string} commitment - The commitment period (e.g. 'YEAR')
 * @property {string} term - The billing term (e.g. 'MONTHLY')
 * @property {string[]} offerSelectorIds - Array of offer selector IDs
 * @property {Object} priceDetails - Details about the price
 * @property {number} priceDetails.price - The price value
 * @property {string} priceDetails.formatString - Format string for price display
 * @property {string} [language] - The language code for the offer
 * @property {PlanType} [planType] - The plan type for the offer (applied by applyPlanType)
 */

/**
 * @typedef {Object} Settings
 * @property {string} env - The environment (e.g. 'STAGE', 'PROD')
 * @property {string} wcsApiKey - The WCS API key
 * @property {string} wcsURL - The WCS API URL
 * @property {string} landscape - The landscape setting, read on every request
 */

/**
 * Creates a WCS client. Each OSI is requested on its own and its promise is
 * cached; a flushed cache stays available as a fallback for failed requests.
 * @param {Object} params
 * @param {Settings} params.settings - The settings for the WCS client
 * @param {number} [params.fetchTimeout] - Optional fetch timeout in milliseconds
 */
export function Wcs({ settings, fetchTimeout }) {
    const log = Log.module(NAMESPACE);
    const { env, wcsApiKey } = settings;
    /** @type {Map<string, Promise<Offer[]>>} */
    let cache = new Map();
    /** @type {Map<string, Promise<Offer[]>>} */
    let staleCache = new Map();

    /**
     * Requests the offers of one OSI.
     * @param {string} osi
     * @param {{ country: string, locale: string, language?: string, promotionCode?: string }} options
     * @returns {Promise<Offer[]>}
     * @throws {MasError} When WCS fails or provides no offer for the OSI
     */
    async function fetchOffers(osi, options) {
        const service = getService();
        log.debug('Fetching:', options);
        const uniqueId =
            Date.now() + Math.random().toString(36).substring(2, 7);
        const startMark = `${NAMESPACE}:${osi}:${uniqueId}${MARK_START_SUFFIX}`;
        const measureName = `${NAMESPACE}:${osi}:${uniqueId}${MARK_DURATION_SUFFIX}`;
        let message = ERROR_MESSAGE_OFFER_NOT_FOUND;
        let response;
        let measure;
        try {
            performance.mark(startMark);
            const url = new URL(settings.wcsURL);
            const { searchParams } = url;
            searchParams.set('offer_selector_ids', osi);
            searchParams.set('country', options.country);
            searchParams.set('locale', options.locale);
            searchParams.set(
                'landscape',
                env === Env.STAGE ? 'ALL' : settings.landscape,
            );
            searchParams.set('api_key', wcsApiKey);
            // language is undefined for GB and perpetual offers
            if (options.language) {
                searchParams.set('language', options.language);
            }
            if (options.promotionCode) {
                searchParams.set('promotion_code', options.promotionCode);
            }
            response = await masFetch(url.toString(), {
                credentials: 'omit',
                ...(fetchTimeout && {
                    signal: AbortSignal.timeout(fetchTimeout),
                }),
            });
            if (response.ok) {
                let offers = [];
                try {
                    const data = await response.json();
                    log.debug('Fetched:', options, data);
                    offers = data.resolvedOffers ?? [];
                } catch (e) {
                    log.error(`Error parsing JSON: ${e.message}`, {
                        ...e.context,
                        ...service?.duration,
                    });
                }
                const resolved = offers
                    .filter(({ offerSelectorIds }) =>
                        offerSelectorIds.includes(osi),
                    )
                    .map(applyPlanType);
                if (resolved.length) return resolved;
            } else {
                message = ERROR_MESSAGE_BAD_REQUEST;
            }
        } catch (e) {
            /* c8 ignore next 2 */
            message = `Network error: ${e.message}`;
        } finally {
            measure = performance.measure(measureName, startMark);
            performance.clearMarks(startMark);
            performance.clearMeasures(measureName);
        }
        log.debug('Missing:', { offerSelectorIds: [osi] });
        throw new MasError(message, {
            ...options,
            ...getLogHeaders(response),
            response,
            measure: printMeasure(measure),
            ...service?.duration,
        });
    }

    /**
     * Fills the cache with offers keyed like `${osi}-${country}-${language}[-${promotionCode}]`.
     * @param {{ prod?: Record<string, Offer[]>, stage?: Record<string, Offer[]> }} preloadedCache
     */
    function prefillWcsCache(preloadedCache) {
        const envCache = preloadedCache[env === Env.STAGE ? 'stage' : 'prod'];
        if (!envCache) {
            log.warn(`No cache found for environment: ${env}`);
            return;
        }
        const entries = Object.entries(envCache);
        for (const [key, offers] of entries) {
            cache.set(key, Promise.resolve(offers.map(applyPlanType)));
        }
        log.debug(`Prefilled WCS cache with ${entries.length} entries`);
    }

    /** Flushes the cache, keeping its entries as fallback for failed requests. */
    function flushWcsCacheInternal() {
        log.debug(`Moved ${cache.size} cache entries to stale cache`);
        staleCache = cache;
        cache = new Map();
    }

    /**
     * Falls back to the default country for unsupported countries and to the
     * multi-language offers (MULT) unless the country is GB or perpetual offers are requested.
     * @param {string} country - The country code
     * @param {string} language - The language code
     * @param {boolean} perpetual - Whether to use perpetual offers
     * @returns {{ validCountry: string, validLanguage: string, locale: string }}
     */
    function normalizeCountryLanguageAndLocale(country, language, perpetual) {
        const validLanguage = country !== 'GB' && !perpetual ? 'MULT' : 'en';
        const validCountry = SUPPORTED_COUNTRIES.includes(country)
            ? country
            : Defaults.country;
        return {
            validCountry,
            validLanguage,
            locale: `${language}_${validCountry}`,
        };
    }

    /**
     * Resolves "Offer Selector Ids" from WCS or the cache, one promise per OSI.
     * @param {Object} params
     * @param {string} params.country - The country code
     * @param {string} params.language - The language code
     * @param {boolean} [params.perpetual=false] - Whether to use perpetual offers
     * @param {string} [params.promotionCode=''] - The promotion code
     * @param {string[]} [params.promotionCodes] - Per-OSI promotion codes, positionally aligned to `wcsOsi`
     * @param {string[]} [params.wcsOsi=[]] - Array of offer selector IDs
     * @returns {Promise<Offer[]>[]} Promises rejecting with a MasError when WCS fails or has no offer
     */
    function resolveOfferSelectors({
        country,
        language,
        perpetual = false,
        promotionCode = '',
        promotionCodes,
        wcsOsi = [],
    }) {
        const { validCountry, validLanguage, locale } =
            normalizeCountryLanguageAndLocale(country, language, perpetual);
        const codes =
            Array.isArray(promotionCodes) && promotionCodes.length
                ? promotionCodes
                : [promotionCode];
        return wcsOsi.map((osi, index) => {
            // A single code broadcasts to every OSI (backward compatible);
            // 2+ codes zip positionally, missing positions default to ''.
            const code = codes.length === 1 ? codes[0] : (codes[index] ?? '');
            const groupKey = [validCountry, validLanguage, code]
                .filter(Boolean)
                .join('-')
                .toLowerCase();
            const cacheKey = `${osi}-${groupKey}`;
            if (cache.has(cacheKey)) return cache.get(cacheKey);
            const promise = fetchOffers(osi, {
                country: validCountry,
                locale,
                ...(validLanguage === 'MULT' && { language: validLanguage }),
                offerSelectorIds: [osi],
                ...(code && { promotionCode: code }),
            }).catch((error) => {
                if (staleCache.has(cacheKey)) return staleCache.get(cacheKey);
                throw error;
            });
            cache.set(cacheKey, promise);
            return promise;
        });
    }

    return {
        Commitment,
        PlanType,
        Term,
        applyPlanType,
        resolveOfferSelectors,
        flushWcsCacheInternal,
        prefillWcsCache,
        normalizeCountryLanguageAndLocale,
    };
}

export { applyPlanType };
