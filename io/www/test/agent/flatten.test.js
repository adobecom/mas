import { readFileSync } from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';
import { extractMerchCard, flattenOffer } from '../../src/agent/flatten.js';

const ccPro = JSON.parse(readFileSync(new URL('./mocks/fragment-cc-pro.json', import.meta.url)));
const photoshopEg = JSON.parse(readFileSync(new URL('./mocks/fragment-photoshop-eg.json', import.meta.url)));
// WCS returns both on every offer; the card's tax and per-unit defaults read them.
const offerSegments = { customerSegment: 'INDIVIDUAL', marketSegments: ['COM'] };

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
        const onPriceError = sinon.spy();

        const offer = await flattenOffer(
            {
                fields: {
                    cardTitle: 'Title',
                    prices: '<span is="inline-price" data-wcs-osi="uncached"></span>',
                },
            },
            { onPriceError },
        );
        expect(onPriceError.calledOnce).to.be.true;
        expect(onPriceError.firstCall.args[0].message).to.equal('Network error: WCS request timed out');
        expect(onPriceError.firstCall.args[1]).to.equal('uncached');
        expect(offer.title).to.equal('Title');
        expect(offer.regularPrice).to.be.undefined;
        expect(timeoutStub.calledOnceWithExactly(5000)).to.be.true;
        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[1].signal).to.equal(controller.signal);
    });

    it('requests WCS from the default service, whatever the fragment settings say', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new Error('offline'));
        await flattenOffer(
            {
                settings: { wcsURL: 'https://attacker.example/wcs', env: 'STAGE', landscape: 'DRAFT', wcsApiKey: 'other' },
                fields: { prices: '<span is="inline-price" data-wcs-osi="uncached"></span>' },
            },
            { onPriceError: () => {} },
        );
        const url = new URL(fetchStub.firstCall.args[0]);
        expect(url.origin + url.pathname).to.equal('https://www.adobe.com/web_commerce_artifact');
        expect(url.searchParams.get('landscape')).to.equal('PUBLISHED');
        expect(url.searchParams.get('api_key')).to.equal('wcms-commerce-ims-ro-user-milo');
    });

    it('hydrates prices concurrently', async () => {
        let release;
        const pending = new Promise((resolve) => {
            release = resolve;
        });
        const fetchStub = sinon.stub(globalThis, 'fetch').returns(pending);
        const flattening = flattenOffer(
            {
                fields: {
                    prices: '<span is="inline-price" data-wcs-osi="first"></span>',
                    description: '<span is="inline-price" data-wcs-osi="second"></span>',
                },
            },
            { onPriceError: () => {} },
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(fetchStub.callCount).to.equal(2);
        release(new Response('{}', { status: 500 }));
        await flattening;
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
                                    ...offerSegments,
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
                        {
                            ...offerSegments,
                            offerSelectorIds: ['regional'],
                            priceDetails: { formatString: "'$'#,##0.00", price: 2 },
                        },
                    ],
                    'regional-fr-mult': [
                        {
                            ...offerSegments,
                            offerSelectorIds: ['regional'],
                            priceDetails: { formatString: "'$'#,##0.00", price: 3 },
                        },
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
                            ...offerSegments,
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
            ...offerSegments,
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
                            ...offerSegments,
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
                            ...offerSegments,
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
                            ...offerSegments,
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
                            ...offerSegments,
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
            href: undefined,
            text: 'See terms',
        });
        expect(card.renewalText).to.equal('Renews automatically');
    });

    for (const [href, expected] of [
        ['https://www.adobe.com/offer-terms/x.html', 'https://www.adobe.com/offer-terms/x.html'],
        ['javascript:alert(1)//offer-terms', null],
        ['http://www.adobe.com/offer-terms/x.html', null],
        ['/offer-terms/x.html', null],
    ]) {
        it(`returns only absolute https terms links: ${href}`, async () => {
            const offer = await flattenOffer({
                fields: {
                    description: `<a href="${href}">Terms</a>`,
                    callout: `<a is="upt-link" href="${href}">See terms</a>`,
                },
            });
            expect(offer.terms_url).to.equal(expected);
            expect(offer.seeTermsInfo.href).to.equal(expected ?? undefined);
        });
    }

    it('decodes an encoded ampersand entity once', async () => {
        const offer = await flattenOffer({ fields: { badge: 'Say &amp;quot;hi&amp;quot; &amp; save &quot;now&quot;' } });
        expect(offer.badge).to.equal('Say &quot;hi&quot; & save "now"');
    });

    it('selects one offer per OSI and sums comma-joined OSIs like the card', async () => {
        const offer = (osi, price, extra = {}) => ({
            ...offerSegments,
            offerSelectorIds: [osi],
            priceDetails: { formatString: "'$'#,##0.00", price },
            ...extra,
        });
        const card = await extractMerchCard({
            fields: {
                prices: '<span is="inline-price" data-template="price" data-wcs-osi="multi"></span>',
                description: '<span is="inline-price" data-template="price" data-wcs-osi="first,second"></span>',
            },
            wcs: {
                prod: {
                    'multi-us-mult': [offer('multi', 9, { term: 'ANNUAL' }), offer('multi', 4)],
                    'first-us-mult': [offer('first', 1)],
                    'second-us-mult': [offer('second', 2)],
                },
            },
        });
        expect(card.regularPrice).to.equal('$4.00');
        expect(card.description).to.equal('$3.00');
    });

    it('reads the rendered text of a price template without a price element', async () => {
        const card = await extractMerchCard({
            fields: {
                callout: '<p>Save <span is="inline-price" data-template="discount" data-wcs-osi="sale"></span></p>',
            },
            wcs: {
                prod: {
                    'sale-us-mult': [
                        {
                            ...offerSegments,
                            offerSelectorIds: ['sale'],
                            priceDetails: { formatString: "'$'#,##0.00", price: 5, priceWithoutDiscount: 10 },
                        },
                    ],
                },
            },
        });
        expect(card.callout).to.equal('Save 50%');
        expect(card.regularPrice).to.be.undefined;
    });

    for (const [customerSegment, unitText] of [
        ['TEAM', 'per license'],
        ['INDIVIDUAL', undefined],
    ]) {
        it(`applies the card's per-unit default for ${customerSegment} offers`, async () => {
            const card = await extractMerchCard({
                fields: { prices: '<span is="inline-price" data-template="price" data-wcs-osi="seat"></span>' },
                wcs: {
                    prod: {
                        'seat-us-mult': [
                            {
                                ...offerSegments,
                                customerSegment,
                                offerSelectorIds: ['seat'],
                                priceDetails: { formatString: "'$'#,##0.00", price: 7, perUnit: 'LICENSE' },
                            },
                        ],
                    },
                },
            });
            expect(card.regularPrice).to.equal('$7.00');
            expect(card.unitText).to.equal(unitText);
        });
    }

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
                            ...offerSegments,
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

        const onPriceError = sinon.spy();
        const card = await extractMerchCard(fragment, { onPriceError });
        expect(card.regularPrice).to.equal('$5.00');
        expect(card.recurrenceText).to.be.undefined;
        expect(card.taxText).to.equal('excl. GST');
        expect(card.unitText).to.equal('per license');
        expect(card.planTypeText).to.be.undefined;
        expect(onPriceError.calledOnce).to.be.true;
        expect(onPriceError.firstCall.args[0].message).to.equal('Commerce offer not found');
        expect(onPriceError.firstCall.args[1]).to.equal('missing');

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
