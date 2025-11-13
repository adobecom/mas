import { fetch } from '../utils/common.js';
import { log, logError } from '../utils/log.js';

const MAS_ELEMENT_REGEXP = /<[^>]+data-wcs-osi=\\"(?<osi>[^\\]+)\\"[^>]*?>/gm;
const PROMOCODE_REGEXP = /(?<promo>data-promotion-code=\\"(?<promotionCode>[^\\]+)\\")/;

async function fetchArtifact(osi, promotionCode, wcsContext, idx) {
    const url = new URL(wcsContext.wcsURL);
    url.searchParams.set('country', wcsContext.country);
    url.searchParams.set('locale', wcsContext.locale);
    url.searchParams.set('landscape', wcsContext.landscape);
    url.searchParams.set('api_key', wcsContext.context.api_key);
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

async function getWcsConfigurations(context) {
    if (context.wcsConfiguration) {
        return context.wcsConfiguration.filter((config) => config.api_keys?.includes(context.api_key));
    }
    return null;
}

async function wcs(context) {
    const wcsConfigs = await getWcsConfigurations(context);
    if (!wcsConfigs || wcsConfigs.length === 0) {
        log(`No WCS configurations found for API key ${context.api_key}`, context);
        return context;
    }
    const { body, locale } = context;
    const bodyString = JSON.stringify(body);
    const matches = [...bodyString.matchAll(MAS_ELEMENT_REGEXP)];
    if (matches.length > 0) {
        const tokenMap = new Map();
        const tokenKey = ({ osi, promotionCode }) => `${osi}-${promotionCode || ''}`;
        matches.forEach((match) => {
            const token = {
                osi: match.groups.osi,
            };
            const promoMatch = match[0].match(PROMOCODE_REGEXP);
            if (promoMatch && promoMatch.groups?.promotionCode) {
                token.promotionCode = promoMatch.groups.promotionCode;
            }
            tokenMap.set(tokenKey(token), token);
        });

        if (body.fields.osi) {
            const token = {
                osi: body.fields.osi,
                promotionCode: body.fields.promoCode,
            };
            tokenMap.set(tokenKey(token), token);
        }

        // Convert Map values back to array
        const tokens = Array.from(tokenMap.values());
        const country = context.country || locale.split('_')[1];
        const wcsContext = {
            locale,
            country,
            context,
        };
        context.body.wcs ??= {};
        for (const config of wcsConfigs) {
            wcsContext.wcsURL = config.wcsURL;
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
