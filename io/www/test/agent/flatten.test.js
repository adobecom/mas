import { readFileSync } from 'fs';
import { expect } from 'chai';
import { flattenOffer } from '../../src/agent/flatten.js';

const ccPro = JSON.parse(readFileSync(new URL('./mocks/fragment-cc-pro.json', import.meta.url)));

describe('flattenOffer', () => {
    it('flattens a real Creative Cloud Pro fragment payload', () => {
        expect(flattenOffer(ccPro)).to.deep.equal({
            fragment: '2c5cd672-1db8-409c-96ff-46b1a1dfb7dc',
            productName: 'Creative Cloud Pro',
            template: 'plans',
            badge: 'Save 50%',
            cta_label: 'Buy now',
            wcs_osi: 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8',
            checkout_osi: 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8',
            terms_url: 'https://www.adobe.com/offer-terms/cc_full_special_offer.html',
            promotion_code: 'CCI_50_3_IP_US',
            offer_type: 'base',
            product_code: 'ccsn',
            cloud: 'creative',
            commitment: 'year',
            product_line: 'cc/creativecloud',
            plan_type: 'abm',
            customer_segment: 'individual',
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

    it('returns null for empty long-text fields, missing osi/terms, and skips malformed tags', () => {
        const offer = flattenOffer({
            id: 'frag-2',
            fields: {
                badge: { value: '<span></span>' },
                ctas: { mimeType: 'text/html' },
                prices: { value: '<span is="inline-price"></span>' },
                description: { value: '<p>No terms here.</p>' },
                tags: ['invalid-tag'],
            },
        });
        expect(offer.badge).to.be.null;
        expect(offer.cta_label).to.be.null;
        expect(offer.wcs_osi).to.be.null;
        expect(offer.checkout_osi).to.be.null;
        expect(offer.promotion_code).to.be.null;
        expect(offer.terms_url).to.be.null;
        expect(offer).to.not.have.property('offer_type');
    });
});
