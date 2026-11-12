/**
 * Builds the Universal Promo Terms page URL for an offer. Shared by UptLink.render and the
 * server-side agent action (io/www, in Node), so both point "See terms" at the same page.
 * @param {{ env: string, language: string, country: string, offerId: string, promotionCode?: string }} options
 * @returns {string}
 */
export function getPromoTermsUrl({
    env,
    language,
    country,
    offerId,
    promotionCode,
}) {
    const host = env === 'PRODUCTION' ? 'www.adobe.com' : 'www.stage.adobe.com';
    let params = `locale=${language}_${country}&country=${country}&offer_id=${offerId}`;
    if (promotionCode)
        params += `&promotion_code=${encodeURIComponent(promotionCode)}`;
    return `https://${host}/offers/promo-terms.html?${params}`;
}
