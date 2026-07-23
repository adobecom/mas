import { readFileSync } from 'fs';
import { expect } from 'chai';
import { extractMerchCard, flattenOffer } from '../../src/agent/flatten.js';

const ccPro = JSON.parse(readFileSync(new URL('./mocks/fragment-cc-pro.json', import.meta.url)));

describe('flattenOffer', () => {
    it('flattens a real Creative Cloud Pro fragment payload', async () => {
        const offer = await flattenOffer(ccPro);
        expect(offer).to.deep.include({
            fragment: '2c5cd672-1db8-409c-96ff-46b1a1dfb7dc',
            productName: 'Creative Cloud Pro',
            badge: 'Save 50%',
            cta_label: 'Buy now',
            terms_url: 'https://www.adobe.com/offer-terms/cc_full_special_offer.html',
            customer_segment: 'individual',
            title: 'Creative Cloud Pro',
            subtitle: undefined,
            promoText: undefined,
            shortDescription: undefined,
            description:
                'Save 50%. Get 20+ apps, including Photoshop, Illustrator, and Premiere, plus Adobe Firefly creative AI. Pay US$34.99 for the first 3 months and US$69.99 after that. New subscribers only. See terms. See all plans & pricing details',
            callout: undefined,
            promoPrice: 'US$34.99',
            regularPrice: 'US$69.99',
        });
        expect(offer.planTypeText).to.be.undefined;
        expect(offer.recurrenceText).to.be.undefined;
        expect(offer.description).to.be.a('string').and.not.empty;
        expect(offer).to.have.property('shortDescription');
    });

    it('returns null fields for an empty fragment', async () => {
        const offer = await flattenOffer({});
        expect(offer.fragment).to.be.null;
        expect(offer.productName).to.be.null;
        expect(offer.badge).to.be.null;
        expect(offer.terms_url).to.be.null;
    });

    it('handles a nullish fragment', async () => {
        expect((await flattenOffer(null)).fragment).to.be.null;
    });

    it('returns null for empty long-text fields, missing osi/terms, and skips malformed tags', async () => {
        const offer = await flattenOffer({
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
        expect(offer.terms_url).to.be.null;
    });

    it('gates the card promotion code by compatibility version or promotion project', async () => {
        const fields = {
            compatVersion: 0,
            promoCode: 'GLOBAL_PROMO',
            prices: {
                value: '<span is="inline-price" data-wcs-osi="single"></span>',
            },
        };
        const offer = {
            offerSelectorIds: ['single'],
            priceDetails: {
                formatString: "'$'#,##0.00",
                price: 1,
            },
            priceInfo: { price: '$1.00' },
        };

        const incompatible = await extractMerchCard({
            fields,
            wcs: {
                prod: {
                    'single-us-mult': [offer],
                },
            },
        });
        expect(incompatible.regularPrice).to.equal('$1.00');

        const promotionProject = await extractMerchCard({
            fields,
            promoProject: 'project',
            wcs: {
                prod: {
                    'single-us-mult-global_promo': [
                        {
                            ...offer,
                            priceDetails: {
                                ...offer.priceDetails,
                                price: 2,
                            },
                        },
                    ],
                },
            },
        });
        expect(promotionProject.regularPrice).to.equal('$2.00');
    });

    it('hydrates every inline-price span across fragment fields', async () => {
        const fragment = {
            fields: {
                compatVersion: 1,
                promoCode: 'GLOBAL_PROMO',
                prices: {
                    value: `
                        <span is="inline-price" data-wcs-osi="outer" disabled>
                            <span
                                is='inline-price'
                                data-promotion-code='INNER_PROMO'
                                data-template='price'
                                data-wcs-osi='inner'
                            ></span>
                        </span>
                        <span is=inline-price data-template=price></span>
                        <span
                            is="inline-price"
                            data-promotion-code="cancel-context"
                            data-wcs-osi="cancel"
                        ></span>
                        <span data-wcs-osi="ignored"></span>
                    `,
                },
                description: {
                    value: `
                        <span is="inline-price" data-wcs-osi="description"></span>
                        <a is="upt-link" data-href="/terms" data-analytics-id="terms">See terms</a>
                        <span class="renewal-text">Renews automatically</span>
                    `,
                },
            },
            wcs: {
                prod: {
                    'outer-us-mult-global_promo': [
                        {
                            offerSelectorIds: ['outer'],
                            priceDetails: {
                                formatString: "'$'#,##0.00",
                                price: 1,
                            },
                            priceInfo: { price: '$1.00' },
                        },
                    ],
                    'inner-us-mult-inner_promo': [
                        {
                            offerSelectorIds: ['inner'],
                            priceDetails: {
                                formatString: "'$'#,##0.00",
                                price: 2,
                            },
                            priceInfo: { price: '$2.00' },
                            promotion: {
                                promotionCode: 'INNER_PROMO',
                            },
                        },
                    ],
                    'description-us-mult-global_promo': [
                        {
                            offerSelectorIds: ['description'],
                            priceDetails: {
                                formatString: "'$'#,##0.00",
                                price: 3,
                            },
                            priceInfo: { price: '$3.00' },
                        },
                    ],
                    'cancel-us-mult': [
                        {
                            offerSelectorIds: ['cancel'],
                            priceDetails: {
                                formatString: "'$'#,##0.00",
                                price: 4,
                            },
                            priceInfo: { price: '$4.00' },
                        },
                    ],
                },
            },
        };

        const originalFetch = globalThis.fetch;
        let card;
        globalThis.fetch = () => {
            throw new Error('WCS fetch was not expected');
        };
        try {
            card = await extractMerchCard(fragment);
        } finally {
            globalThis.fetch = originalFetch;
        }
        expect(card.regularPrice).to.equal('$1.00');
        expect(card.seeTermsInfo).to.deep.equal({
            analyticsId: 'terms',
            href: '/terms',
            text: 'See terms',
        });
        expect(card.renewalText).to.equal('Renews automatically');
    });

    it('hydrates promotional and missing inline prices', async () => {
        const fragment = {
            fields: {
                prices: {
                    value: `
                        <span
                            is="inline-price"
                            data-display-old-price="false"
                            data-display-per-unit="true"
                            data-display-tax="true"
                            data-wcs-osi="promo"
                        ></span>
                        <span
                            is="inline-price"
                            data-display-per-unit="true"
                            data-wcs-osi="missing"
                        ></span>
                    `,
                },
            },
            wcs: {
                prod: {
                    'promo-us-mult': [
                        {
                            offerSelectorIds: ['promo'],
                            offerId: 'offer-promo',
                            priceDetails: {
                                formatString: "'$'#,##0.00",
                                perUnit: 'LICENSE',
                                price: 5,
                            },
                            priceInfo: {
                                price: '$5.00',
                                priceWithoutDiscountAndTax: '$10.00',
                                taxDisplay: 'TAX_EXCLUSIVE',
                                taxTerm: 'GST',
                            },
                            promotion: {
                                promotionCode: 'AUTO_PROMO',
                            },
                            term: 'WEEKLY',
                        },
                    ],
                    'missing-us-mult': [],
                },
            },
        };

        const card = await extractMerchCard(fragment);
        expect(card.regularPrice).to.equal('$5.00');
        expect(card.recurrenceText).to.be.undefined;
        expect(card.taxText).to.be.undefined;
        expect(card.unitText).to.be.undefined;
        expect(card.planTypeText).to.be.undefined;

        expect(
            (
                await extractMerchCard({
                    fields: {
                        prices: {
                            value: '<span is="inline-price"></span>',
                        },
                    },
                })
            ).recurrenceText,
        ).to.be.undefined;
    });
});
