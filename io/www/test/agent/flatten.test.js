import { readFileSync } from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';
import { extractMerchCard, flattenOffer } from '../../src/agent/flatten.js';

const ccPro = JSON.parse(readFileSync(new URL('./mocks/fragment-cc-pro.json', import.meta.url)));
const photoshopEg = JSON.parse(readFileSync(new URL('./mocks/fragment-photoshop-eg.json', import.meta.url)));

describe('flattenOffer', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('opts into a five-second WCS timeout without retrying timed-out requests', async () => {
        const controller = new AbortController();
        const timeout = new DOMException('WCS request timed out', 'TimeoutError');
        controller.abort(timeout);
        const timeoutStub = sinon.stub(AbortSignal, 'timeout').returns(controller.signal);
        const fetchStub = sinon.stub(globalThis, 'fetch').rejects(timeout);

        try {
            await flattenOffer({
                fields: {
                    prices: '<span is="inline-price" data-wcs-osi="uncached"></span>',
                },
            });
            expect.fail('Expected WCS hydration to fail');
        } catch (error) {
            expect(error.message).to.equal('Network error: WCS request timed out');
            expect(timeoutStub.calledOnceWithExactly(5000)).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[1].signal).to.equal(controller.signal);
        }
    });

    it('flattens a real Creative Cloud Pro fragment payload', async () => {
        const offer = await flattenOffer(ccPro);
        expect(offer).to.deep.include({
            fragment: '2c5cd672-1db8-409c-96ff-46b1a1dfb7dc',
            productName: 'Creative Cloud Pro',
            badge: 'Save 50%',
            ctas: [{ label: 'Buy now' }],
            terms_url: 'https://www.adobe.com/offer-terms/cc_full_special_offer.html',
            customer_segment: 'individual',
            title: 'Creative Cloud Pro',
            subtitle: undefined,
            promoText: undefined,
            shortDescription: undefined,
            description:
                'Save 50%. Get 20+ apps, including Photoshop, Illustrator, and Premiere, plus Adobe Firefly creative AI. Pay US$34.99/mo for the first 3 months and US$69.99/mo after that. New subscribers only. See terms. See all plans & pricing details',
            callout: undefined,
            promoPrice: 'US$34.99',
            regularPrice: 'US$69.99',
        });
        expect(offer.planTypeText).to.equal('Annual, billed monthly');
        expect(offer.recurrenceText).to.equal('/mo');
        expect(offer.description).to.be.a('string').and.not.empty;
        expect(offer).to.have.property('shortDescription');
        expect(offer).to.not.have.property('cta_label');
    });

    it('uses the returned Egypt cache without fragment settings or additional WCS requests', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new DOMException('Unexpected WCS request', 'TimeoutError'));
        expect(photoshopEg).to.not.have.property('settings');
        const offer = await flattenOffer(photoshopEg, { locale: 'en_US', country: 'EG' });
        expect(offer).to.deep.include({
            productName: 'Photoshop',
            regularPrice: 'LE 552.90',
            recurrenceText: '/mo',
        });
        expect(fetchStub.called).to.be.false;
    });

    it('passes pricing geography through direct merch-card extraction', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new DOMException('Unexpected WCS request', 'TimeoutError'));
        const card = await extractMerchCard(photoshopEg, { locale: 'en_US', country: 'eg' });
        expect(card.regularPrice).to.equal('LE 552.90');
        expect(fetchStub.called).to.be.false;
    });

    for (const [label, context, cacheCountry] of [
        ['country derived from the requested locale', { locale: 'fr_FR' }, 'FR'],
        ['country restricted to the locale market', { locale: 'fr_FR', country: 'DE' }, 'FR'],
        ['territory commerce country', { locale: 'es_PR', country: 'PR' }, 'US'],
        ['territory country overriding a request cookie', { locale: 'es_PR', country: 'EG' }, 'US'],
    ]) {
        it(`uses the fragment pipeline's ${label} for pricing`, async () => {
            const fetchStub = sinon
                .stub(globalThis, 'fetch')
                .rejects(new DOMException('Unexpected WCS request', 'TimeoutError'));
            const offer = await flattenOffer(
                {
                    path: '/content/dam/mas/acom/en_US/regional-card',
                    fields: { prices: '<span is="inline-price" data-wcs-osi="regional"></span>' },
                    wcs: {
                        prod: {
                            [`regional-${cacheCountry.toLowerCase()}-mult`]: [
                                {
                                    offerSelectorIds: ['regional'],
                                    priceDetails: { formatString: "'$'#,##0.00", price: 1 },
                                },
                            ],
                        },
                    },
                },
                context,
            );
            expect(offer.regularPrice).to.equal('$1.00');
            expect(fetchStub.called).to.be.false;
        });
    }

    it('lets request geography override fragment-wide defaults while retaining per-price overrides', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new DOMException('Unexpected WCS request', 'TimeoutError'));
        const fragment = {
            path: '/content/dam/mas/acom/en_US/regional-card',
            settings: { country: 'US', language: 'de', locale: 'de_DE' },
            fields: {
                prices: '<span is="inline-price" data-wcs-osi="regional"></span>',
            },
            wcs: {
                prod: {
                    'regional-eg-mult': [
                        { offerSelectorIds: ['regional'], priceDetails: { formatString: "'$'#,##0.00", price: 2 } },
                    ],
                    'regional-fr-mult': [
                        { offerSelectorIds: ['regional'], priceDetails: { formatString: "'$'#,##0.00", price: 3 } },
                    ],
                },
            },
        };
        const context = { locale: 'en_US', country: 'EG' };
        expect((await flattenOffer(fragment, context)).regularPrice).to.equal('$2.00');
        const overridden = await flattenOffer(
            {
                ...fragment,
                fields: {
                    prices: '<span is="inline-price" data-wcs-osi="regional" data-country="FR" data-language="fr"></span>',
                },
            },
            context,
        );
        expect(overridden.regularPrice).to.equal('$3.00');
        expect(fetchStub.called).to.be.false;
    });

    it('accepts optional request geography when fragment data or its source path is absent', async () => {
        const context = { locale: 'en_US' };
        expect((await flattenOffer(null, context)).fragment).to.be.null;
        expect((await flattenOffer({ path: 'not-a-fragment-path' }, context)).ctas).to.deep.equal([]);
    });

    it('returns separate Premiere CTA labels inside wrapper spans', async () => {
        const offer = await flattenOffer({
            fields: {
                cardTitle: 'Adobe Premiere',
                ctas: {
                    value: `
                        <span class="cta-wrapper">
                            <a is="checkout-link">Free trial</a>
                            <a is="checkout-link"><strong>Buy now</strong></a>
                        </span>
                    `,
                },
            },
        });
        expect(offer.ctas).to.deep.equal([{ label: 'Free trial' }, { label: 'Buy now' }]);
        expect(offer).to.not.have.property('cta_label');
    });

    it('preserves all link and button labels in authored order and skips blank CTAs', async () => {
        const offer = await flattenOffer({
            fields: {
                ctas: `
                    <p>Choose an action</p>
                    <a>Free trial</a>
                    <BUTTON><span>Buy now</span></BUTTON>
                    <a>Compare plans &amp; pricing</a>
                    <a> </a>
                    <button><span></span></button>
                `,
            },
        });
        expect(offer.ctas).to.deep.equal([{ label: 'Free trial' }, { label: 'Buy now' }, { label: 'Compare plans & pricing' }]);
    });

    it('hydrates inline prices inside each CTA label', async () => {
        const offer = await flattenOffer({
            fields: {
                ctas: '<a>Buy now for <span is="inline-price" data-wcs-osi="single"></span></a>',
            },
            wcs: {
                prod: {
                    'single-us-mult': [
                        {
                            offerSelectorIds: ['single'],
                            priceDetails: {
                                formatString: "'$'#,##0.00",
                                price: 1,
                            },
                            priceInfo: { price: '$1.00' },
                        },
                    ],
                },
            },
        });
        expect(offer.ctas).to.deep.equal([{ label: 'Buy now for $1.00' }]);
    });

    for (const [customerSegment, marketSegment] of [
        ['individual', 'com'],
        ['team', 'com'],
        ['individual', 'edu'],
    ]) {
        it(`exposes standard ${customerSegment}/${marketSegment} classification from fragment tags`, async () => {
            const offer = await flattenOffer({
                fields: {
                    tags: [
                        `mas:customer_segment/${customerSegment}`,
                        `mas:market_segments/${marketSegment}`,
                        'mas:segment/nonstandard',
                    ],
                },
            });
            expect(offer).to.deep.include({
                customer_segment: customerSegment,
                market_segment: marketSegment,
            });
            expect(offer).to.not.have.any.keys('segment', 'market_segments');
        });
    }

    it('returns null fields for an empty fragment', async () => {
        const offer = await flattenOffer({});
        expect(offer.fragment).to.be.null;
        expect(offer.productName).to.be.null;
        expect(offer.badge).to.be.null;
        expect(offer.terms_url).to.be.null;
        expect(offer.ctas).to.deep.equal([]);
        expect(offer).to.not.have.property('cta_label');
        expect(offer).to.not.have.any.keys('customer_segment', 'market_segment', 'segment');
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
        expect(offer.ctas).to.deep.equal([]);
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
            settings: {
                country: 'GB',
                language: 'en',
                locale: 'en_GB',
            },
            wcs: {
                prod: {
                    'promo-gb-en': [
                        {
                            offerSelectorIds: ['promo'],
                            offerId: 'offer-promo',
                            priceDetails: {
                                formatString: "'$'#,##0.00",
                                perUnit: 'LICENSE',
                                price: 5,
                                taxDisplay: 'TAX_EXCLUSIVE',
                                taxTerm: 'GST',
                            },
                            promotion: {
                                promotionCode: 'AUTO_PROMO',
                            },
                            term: 'WEEKLY',
                        },
                    ],
                    'missing-gb-en': [],
                },
            },
        };

        const card = await extractMerchCard(fragment);
        expect(card.regularPrice).to.equal('$5.00');
        expect(card.recurrenceText).to.be.undefined;
        expect(card.taxText).to.equal('excl. GST');
        expect(card.unitText).to.equal('per license');
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
