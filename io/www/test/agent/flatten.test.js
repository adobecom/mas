import { expect } from 'chai';
import { flattenOffer } from '../../src/agent/flatten.js';

const FRAGMENT = {
    id: 'frag-1',
    fields: {
        variant: 'plans',
        cardTitle: '  Photoshop ',
        badge: { value: '<span>Save 25%</span>', mimeType: 'text/html' },
        prices: { value: '<span is="inline-price" data-wcs-osi="OSI-PRICE"></span>', mimeType: 'text/html' },
        ctas: { value: '<p><a data-wcs-osi="OSI-CTA">Buy now</a></p>', mimeType: 'text/html' },
        description: {
            value: '<p>Save. <a href="https://www.adobe.com/offer-terms/x.html">See terms.</a></p>',
            mimeType: 'text/html',
        },
        promoCode: 'PROMO50',
        promoText: 'Save 50%',
        tags: ['mas:offer_type/base', 'mas:plan_type/abm', 'mas:product/cc/photoshop', 'invalid-tag'],
    },
};

describe('flattenOffer', () => {
    it('flattens identity, osis, terms, and tags from a resolved fragment', () => {
        expect(flattenOffer(FRAGMENT)).to.deep.equal({
            fragment: 'frag-1',
            productName: 'Photoshop',
            template: 'plans',
            badge: 'Save 25%',
            cta_label: 'Buy now',
            wcs_osi: 'OSI-PRICE',
            checkout_osi: 'OSI-CTA',
            terms_url: 'https://www.adobe.com/offer-terms/x.html',
            promotion_code: 'PROMO50',
            promo_text: 'Save 50%',
            offer_type: 'base',
            plan_type: 'abm',
            product_line: 'cc/photoshop',
        });
    });

    it('returns null fields for an empty fragment', () => {
        const offer = flattenOffer({});
        expect(offer.fragment).to.be.null;
        expect(offer.productName).to.be.null;
        expect(offer.template).to.be.null;
        expect(offer.badge).to.be.null;
        expect(offer.wcs_osi).to.be.null;
        expect(offer.terms_url).to.be.null;
        expect(offer.promotion_code).to.be.null;
    });

    it('handles a nullish fragment', () => {
        expect(flattenOffer(null).fragment).to.be.null;
    });

    it('returns null for empty long-text fields and missing osi/terms', () => {
        const offer = flattenOffer({
            id: 'frag-2',
            fields: {
                badge: { value: '<span></span>' },
                ctas: { mimeType: 'text/html' },
                prices: { value: '<span is="inline-price"></span>' },
                description: { value: '<p>No terms here.</p>' },
            },
        });
        expect(offer.badge).to.be.null;
        expect(offer.cta_label).to.be.null;
        expect(offer.wcs_osi).to.be.null;
        expect(offer.checkout_osi).to.be.null;
        expect(offer.terms_url).to.be.null;
    });
});
