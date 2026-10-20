import { getPromoTermsUrl } from '../src/upt-link.js';
import { expect } from './utilities.js';

describe('function "getPromoTermsUrl"', () => {
    const offer = { language: 'en', country: 'US', offerId: 'OFFER1' };
    const query = 'locale=en_US&country=US&offer_id=OFFER1';

    for (const [label, options, url] of [
        [
            'points production at www.adobe.com',
            { env: 'PRODUCTION' },
            `https://www.adobe.com/offers/promo-terms.html?${query}`,
        ],
        [
            'points other environments at www.stage.adobe.com',
            { env: 'STAGE' },
            `https://www.stage.adobe.com/offers/promo-terms.html?${query}`,
        ],
        [
            'adds an encoded promotion code',
            { env: 'PRODUCTION', promotionCode: 'PROMO 1&2' },
            `https://www.adobe.com/offers/promo-terms.html?${query}&promotion_code=PROMO%201%262`,
        ],
        [
            'omits an empty promotion code',
            { env: 'PRODUCTION', promotionCode: null },
            `https://www.adobe.com/offers/promo-terms.html?${query}`,
        ],
    ]) {
        it(label, () => {
            expect(getPromoTermsUrl({ ...offer, ...options })).to.equal(url);
        });
    }
});
