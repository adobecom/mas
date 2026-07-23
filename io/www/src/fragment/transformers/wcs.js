import { fetch, getCountry, getRegionalLocale } from '../utils/common.js';
import { log, logDebug, logError } from '../utils/log.js';

const MAS_ELEMENT_REGEXP = /<[^>]+data-wcs-osi=\\"(?<osi>[^\\]+)\\"[^>]*?>/gm;
const PROMOCODE_REGEXP = /(?<promo>data-promotion-code=\\"(?<promotionCode>[^\\]+)\\")/;

async function fetchArtifact(osi, promotionCode, wcsContext, idx) {
    const url = new URL(wcsContext.wcsURL);
    url.searchParams.set('country', wcsContext.country);
    url.searchParams.set('locale', wcsContext.locale);
    url.searchParams.set('landscape', wcsContext.landscape);
    url.searchParams.set('api_key', wcsContext.apiKey);
    if (wcsContext.language) {
        url.searchParams.set('language', wcsContext.language);
    }
    url.searchParams.set('offer_selector_ids', osi);
    if (promotionCode) {
        url.searchParams.set('promotion_code', promotionCode);
    }
    const response = await fetch(url.toString(), wcsContext.context, `wcs-req-${idx}`);
    if (response.status === 200) {
        return response.body;
    }
    return null;
}

async function computeCache(tokens, wcsContext) {
    const cache = {};
    let idx = 0;
    const promises = tokens.map(
        ({ osi, promotionCode }) =>
            new Promise(async (resolve, reject) => {
                const response = await fetchArtifact(osi, promotionCode, wcsContext, idx++);
                if (response) {
                    const { resolvedOffers } = response;
                    const cacheKey = [
                        osi,
                        wcsContext.country.toLowerCase(),
                        wcsContext.language?.toLowerCase(),
                        promotionCode?.toLowerCase(),
                    ]
                        .filter((val) => val)
                        .join('-');
                    resolve({
                        cacheKey,
                        resolvedOffers,
                    });
                } else {
                    reject('failed wcs request');
                }
            }),
    );
    const responses = await Promise.allSettled(promises);
    responses.forEach((response) => {
        if (response.status === 'fulfilled') {
            const { cacheKey, resolvedOffers } = response.value;
            cache[cacheKey] = resolvedOffers;
        }
    });
    return cache;
}

async function wcs(context) {
    const { body } = context;
    const bodyString = JSON.stringify(body);
    const matches = [...bodyString.matchAll(MAS_ELEMENT_REGEXP)];

    const parts = [];
    let lastEnd = 0;
    matches.forEach((match) => {
        const originalOsi = match.groups.osi;
        const substitutedOsi = context.substituteMap?.[originalOsi];
        if (substitutedOsi) {
            logDebug(() => `Substituting OSI ${originalOsi} with ${substitutedOsi}`, context);
            parts.push(bodyString.slice(lastEnd, match.index));
            parts.push(match[0].replace(`\\"${originalOsi}\\"`, `\\"${substitutedOsi}\\"`));
            lastEnd = match.index + match[0].length;
        }
    });
    if (parts.length > 0) {
        parts.push(bodyString.slice(lastEnd));
        try {
            context.body = JSON.parse(parts.join(''));
        } catch (error) {
            logError(`Failed to rewrite body with substituted OSIs: ${error.message}`, context);
        }
    }
    if (context.body.fields?.osi) {
        const substitutedOsi = context.substituteMap?.[context.body.fields.osi] ?? context.body.fields.osi;
        if (substitutedOsi !== context.body.fields.osi) {
            context.body.fields.osi = substitutedOsi;
        }
    }

    const wcsConfigs = context.wcsConfiguration;
    if (!wcsConfigs || wcsConfigs.length === 0) {
        log('No WCS configurations available', context);
        return context;
    }
    if (matches.length > 0) {
        // Promo codes applied to referenced cards live on each card's fields.promoCode (keyed by its base osi),
        // not in the price HTML nor on the collection root. Build a base-osi -> promoCode lookup to fill the cache
        // with the right promotion_code for each card's offer. The same osi may be used by several cards with
        // different promo treatments (e.g. one with a promo, one without), so also track osis used without a promo
        // to fill their plain (no promo) entry too.
        const promoCodeByOsi = {};
        const noPromoOsis = new Set();
        for (const ref of Object.values(context.body.references ?? {})) {
            const fields = ref?.value?.fields;
            if (!fields?.osi) continue;
            const { osi } = fields;
            if (fields.promoCode) {
                promoCodeByOsi[osi] = fields.promoCode;
            } else {
                noPromoOsis.add(osi);
            }
        }
        const tokenMap = new Map();
        const tokenKey = ({ osi, promotionCode }) => `${osi}-${promotionCode || ''}`;
        const addToken = (token) => {
            const key = tokenKey(token);
            if (!tokenMap.has(key)) tokenMap.set(key, token);
        };
        matches.forEach((match) => {
            const baseOsi = match.groups.osi;
            const osi = context.substituteMap?.[baseOsi] ?? baseOsi;
            const promoMatch = match[0].match(PROMOCODE_REGEXP);
            if (promoMatch && promoMatch.groups?.promotionCode) {
                addToken({ osi, promotionCode: promoMatch.groups.promotionCode });
                return;
            }
            // Bare markup OSIs (no own data-promotion-code, no matching reference) belong to the
            // top-level fragment itself — fall back to its own fields.promoCode (set by customize.js).
            const promoCode = promoCodeByOsi[baseOsi] ?? context.body.fields?.promoCode;
            if (promoCode) addToken({ osi, promotionCode: promoCode });
            // Cache the plain (no promo) offer when no card promotes this osi, or when a card shares
            // this osi without a promo of its own (mixed case) — otherwise that card would miss the cache.
            if (!promoCode || noPromoOsis.has(baseOsi)) addToken({ osi });
        });

        if (context.body.fields?.osi) {
            const token = {
                osi: context.substituteMap?.[context.body.fields.osi] ?? context.body.fields.osi,
                promotionCode: context.body.fields.promoCode,
            };
            tokenMap.set(tokenKey(token), token);
        }

        // Convert Map values back to array
        const tokens = Array.from(tokenMap.values());
        const country = getCountry(context);
        const wcsContext = {
            locale: getRegionalLocale(context),
            country,
            context,
        };
        context.body.wcs ??= {};
        for (const config of wcsConfigs) {
            wcsContext.wcsURL = config.wcsURL;
            wcsContext.apiKey = config.apiKey;
            wcsContext.landscape = config.landscape || 'PUBLISHED';
            if (country !== 'GB') wcsContext.language = 'MULT';
            context.body.wcs ??= {};
            try {
                context.body.wcs[config.env] = await computeCache(tokens, wcsContext);
                /* c8 ignore next 3*/
            } catch (error) {
                logError(`Error computing WCS cache for ${config.env}: ${error.message}`, context);
            }
        }
    } else {
        log('No WCS placeholders found in fragment content', context);
    }
    return context;
}

export const transformer = {
    name: 'wcs',
    process: wcs,
};
export { MAS_ELEMENT_REGEXP };
