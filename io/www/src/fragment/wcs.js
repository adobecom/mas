const { log, logError, fetch } = require('./common.js');

const MAS_ELEMENT_REGEXP = /<[^>]+data-wcs-osi=\\"(?<osi>[^\\]+)\\"[^>]*?>/gm;
const PROMOCODE_REGEXP =
    /(?<promo>data-promotion-code=\\"(?<promotionCode>[^\\]+)\\")/;

async function fetchArtifact(osi, promotionCode, wcsContext) {
    const url = new URL(wcsContext.wcsURL);
    url.searchParams.set('country', wcsContext.country);
    url.searchParams.set('locale', wcsContext.locale);
    url.searchParams.set('landscape', wcsContext.landscape);
    url.searchParams.set('api_key', wcsContext.context.api_key);
    url.searchParams.set('language', wcsContext.language);
    url.searchParams.set('offer_selector_ids', osi);
    if (promotionCode) {
        url.searchParams.set('promotion_code', promotionCode);
    }
    const response = await fetch(url.toString(), wcsContext.context);
    if (response.status === 200) {
        return response.body;
    }
    return null;
}

async function computeCache(tokens, config, wcsContext) {
    const cache = {};
    wcsContext.wcsURL = config.wcsURL;
    const promises = tokens.map(
        ({ osi, promotionCode }) =>
            new Promise(async (resolve, reject) => {
                const response = await fetchArtifact(
                    osi,
                    promotionCode,
                    wcsContext,
                );
                if (response) {
                    const { resolvedOffers } = response;
                    const cacheKey = [
                        osi,
                        wcsContext.country.toLowerCase(),
                        wcsContext.language.toLowerCase(),
                        promotionCode,
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
    const wcsConfigurationStr =
        (await context.state.get('wcs-configuration'))?.value || false;
    if (wcsConfigurationStr) {
        try {
            const arrayConfig = JSON.parse(wcsConfigurationStr);
            return arrayConfig.filter((config) =>
                config.api_keys?.includes(context.api_key),
            );
        } catch (e) {
            logError(`Error parsing WCS configuration: ${e.message}`, context);
            return null;
        }
    }
    return null;
}

async function wcs(context) {
    const startTime = Date.now();
    const wcsConfigs = await getWcsConfigurations(context);
    if (!wcsConfigs || wcsConfigs.length === 0) {
        log(
            `No WCS configurations found for API key ${context.api_key}`,
            context,
        );
        return context;
    }
    const { body, locale } = context;
    let bodyString = JSON.stringify(body);
    const matches = [...bodyString.matchAll(MAS_ELEMENT_REGEXP)];
    if (matches.length > 0) {
        const tokens = matches
            .map((match) => {
                const token = {
                    osi: match.groups.osi,
                };
                const promoMatch = match[0].match(PROMOCODE_REGEXP);
                if (promoMatch && promoMatch.groups?.promotionCode) {
                    token.promotionCode = promoMatch.groups.promotionCode;
                }
                return token;
            })
            .filter((token) => token.osi);
        const country = locale.split('_')[1];
        const wcsContext = {
            locale,
            country,
            language: country === 'GB' ? 'EN' : 'MULT',
            landscape: 'PUBLISHED',
            context,
        };
        for (const config of wcsConfigs) {
            const cache = await computeCache(tokens, config, wcsContext);
            if (cache) {
                context.body.wcs ??= {};
                context.body.wcs[config.env] = cache;
            }
        }
    } else {
        log('No WCS placeholders found in fragment content', context);
    }
    log(`WCS processing completed in ${Date.now() - startTime}ms`, context);
    return context;
}

module.exports = {
    wcs,
    MAS_ELEMENT_REGEXP,
};
