import { getPromoTermsUrl } from '../src/upt-link.js';
import { expect } from './utilities.js';

describe('function "getPromoTermsUrl"', () => {
    const offer = { language: 'en', country: 'US', offerId: 'OFFER1' };

    it('points production at www.adobe.com', () => {
        expect(getPromoTermsUrl({ ...offer, env: 'PRODUCTION' })).to.equal(
            'https://www.adobe.com/offers/promo-terms.html?locale=en_US&country=US&offer_id=OFFER1',
        );
    });

    it('points other environments at www.stage.adobe.com', () => {
        expect(getPromoTermsUrl({ ...offer, env: 'STAGE' })).to.equal(
            'https://www.stage.adobe.com/offers/promo-terms.html?locale=en_US&country=US&offer_id=OFFER1',
        );
    });

    it('adds an encoded promotion code when there is one', () => {
        expect(
            getPromoTermsUrl({
                ...offer,
                env: 'PRODUCTION',
                promotionCode: 'PROMO 1&2',
            }),
        ).to.equal(
            'https://www.adobe.com/offers/promo-terms.html?locale=en_US&country=US&offer_id=OFFER1&promotion_code=PROMO%201%262',
        );
        expect(
            getPromoTermsUrl({
                ...offer,
                env: 'PRODUCTION',
                promotionCode: null,
            }),
        ).to.not.include('promotion_code');
    });
});
