import { readFileSync } from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';
import { extractMerchCard, flattenOffer } from '../../src/agent/flatten.js';

const ccPro = JSON.parse(readFileSync(new URL('./mocks/fragment-cc-pro.json', import.meta.url)));
const photoshopEg = JSON.parse(readFileSync(new URL('./mocks/fragment-photoshop-eg.json', import.meta.url)));

// WCS returns both segments on every offer; the card's tax and per-unit defaults read them.
const wcsOffer = (osi, price, { priceDetails, ...extra } = {}) => ({
    customerSegment: 'INDIVIDUAL',
    marketSegments: ['COM'],
    offerSelectorIds: [osi],
    priceDetails: { formatString: "'$'#,##0.00", price, ...priceDetails },
    ...extra,
});
const inlinePrice = (osi, attributes = '') => `<span is="inline-price" data-wcs-osi="${osi}" ${attributes}></span>`;
const blockWcs = () => sinon.stub(globalThis, 'fetch').rejects(new Error('Unexpected WCS request'));

describe('flattenOffer', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('WCS requests', () => {
        it('opts into a five-second WCS timeout without retrying timed-out requests', async () => {
            const controller = new AbortController();
            const timeout = new DOMException('WCS request timed out', 'TimeoutError');
            controller.abort(timeout);
            const timeoutStub = sinon.stub(AbortSignal, 'timeout').returns(controller.signal);
            const fetchStub = sinon.stub(globalThis, 'fetch').rejects(timeout);
            const onPriceError = sinon.spy();

            const offer = await flattenOffer(
                { fields: { cardTitle: 'Title', prices: inlinePrice('uncached') } },
                { onPriceError },
            );
            expect(onPriceError.calledOnce).to.be.true;
            expect(onPriceError.firstCall.args[0].message).to.equal('Network error: WCS request timed out');
            expect(onPriceError.firstCall.args[1]).to.equal('uncached');
            expect(offer).to.deep.include({ title: 'Title', regularPrice: undefined, priceErrors: ['uncached'] });
            expect(timeoutStub.calledOnceWithExactly(5000)).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[1].signal).to.equal(controller.signal);
        });

        it('requests WCS from the default service, whatever the fragment settings say', async () => {
            const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new Error('offline'));
            await flattenOffer(
                {
                    settings: { wcsURL: 'https://attacker.example/wcs', env: 'STAGE', landscape: 'DRAFT', wcsApiKey: 'other' },
                    fields: { prices: inlinePrice('uncached') },
                },
                { onPriceError: () => {} },
            );
            const url = new URL(fetchStub.firstCall.args[0]);
            expect(url.origin + url.pathname).to.equal('https://www.adobe.com/web_commerce_artifact');
            expect(url.searchParams.get('landscape')).to.equal('PUBLISHED');
            expect(url.searchParams.get('api_key')).to.equal('wcms-commerce-ims-ro-user-milo');
        });

        it('requests every uncached price before awaiting any of them', async () => {
            let release;
            const pending = new Promise((resolve) => {
                release = resolve;
            });
            const fetchStub = sinon.stub(globalThis, 'fetch').returns(pending);
            const flattening = flattenOffer(
                { fields: { prices: inlinePrice('first'), description: inlinePrice('second') } },
                { onPriceError: () => {} },
            );
            expect(fetchStub.callCount).to.equal(2);
            release(new Response('{}', { status: 500 }));
            expect((await flattening).priceErrors).to.deep.equal(['first', 'second']);
        });
    });

    describe('real Creative Cloud Pro fragment payload', () => {
        let offer;

        before(async () => {
            offer = await flattenOffer(ccPro);
        });

        it('identifies the fragment, product, and segments', () => {
            expect(offer).to.deep.include({
                fragment: '2c5cd672-1db8-409c-96ff-46b1a1dfb7dc',
                productName: 'Creative Cloud Pro',
                title: 'Creative Cloud Pro',
                customer_segment: 'individual',
            });
        });

        it('exposes the badge, CTAs, and the terms URL of its regular see-terms link', () => {
            expect(offer).to.deep.include({
                badge: 'Save 50%',
                ctas: [{ label: 'Buy now' }],
                terms_url: 'https://www.adobe.com/offer-terms/cc_full_special_offer.html',
            });
            expect(offer.seeTermsInfo).to.be.undefined;
            expect(offer).to.not.have.property('cta_label');
        });

        it('strips authored text and keeps absent fields undefined', () => {
            expect(offer.description).to.equal(
                'Save 50%. Get 20+ apps, including Photoshop, Illustrator, and Premiere, plus Adobe Firefly creative AI. Pay US$34.99/mo for the first 3 months and US$69.99/mo after that. New subscribers only. See terms. See all plans & pricing details',
            );
            for (const field of ['subtitle', 'promoText', 'shortDescription', 'callout']) {
                expect(offer).to.have.property(field, undefined);
            }
        });

        it('hydrates the main price and its legal text', () => {
            expect(offer).to.deep.include({
                promoPrice: 'US$34.99',
                regularPrice: 'US$69.99',
                planTypeText: 'Annual, billed monthly',
                recurrenceText: '/mo',
            });
            expect(offer.priceErrors).to.be.undefined;
        });

        it('does not advertise a settings addon price when the product price fails', async () => {
            const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new Error('offline'));
            const mainOsi = 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8';
            const wcs = {
                prod: Object.fromEntries(Object.entries(ccPro.wcs.prod).filter(([key]) => !key.startsWith(mainOsi))),
            };
            const withoutMainPrice = await flattenOffer({ ...ccPro, wcs }, { onPriceError: () => {} });
            expect(fetchStub.called).to.be.true;
            expect(withoutMainPrice.priceErrors).to.deep.equal([mainOsi]);
            for (const field of ['promoPrice', 'regularPrice', 'annualPrice', 'recurrenceText', 'taxText', 'unitText']) {
                expect(withoutMainPrice, field).to.have.property(field, undefined);
            }
        });
    });

    describe('empty input', () => {
        for (const fragment of [null, {}, { path: 'not-a-fragment-path' }]) {
            it(`returns null fields for ${JSON.stringify(fragment)}`, async () => {
                const offer = await flattenOffer(fragment, { locale: 'en_US' });
                expect(offer).to.deep.include({ fragment: null, productName: null, badge: null, terms_url: null, ctas: [] });
                expect(offer).to.not.have.any.keys('cta_label', 'customer_segment', 'market_segment', 'segment');
            });
        }

        it('returns null for empty long-text fields and a price without an OSI, and skips malformed tags', async () => {
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
            expect(offer).to.deep.include({
                fragment: 'frag-2',
                badge: null,
                ctas: [],
                terms_url: null,
                regularPrice: undefined,
                recurrenceText: undefined,
            });
            expect(offer).to.not.have.any.keys('customer_segment', 'market_segment');
        });
    });

    describe('pricing geography', () => {
        it('uses the returned Egypt cache without fragment settings or additional WCS requests', async () => {
            const fetchStub = blockWcs();
            expect(photoshopEg).to.not.have.property('settings');
            const offer = await flattenOffer(photoshopEg, { locale: 'en_US', country: 'eg' });
            expect(offer).to.deep.include({
                productName: 'Photoshop',
                regularPrice: 'LE 552.90',
                recurrenceText: '/mo',
            });
            expect(fetchStub.called).to.be.false;
        });

        for (const [label, context, cacheCountry] of [
            ['country derived from the requested locale', { locale: 'fr_FR' }, 'fr'],
            ['country restricted to the locale market', { locale: 'fr_FR', country: 'DE' }, 'fr'],
            ['territory commerce country', { locale: 'es_PR', country: 'PR' }, 'us'],
            ['territory country overriding a request cookie', { locale: 'es_PR', country: 'EG' }, 'us'],
        ]) {
            it(`uses the fragment pipeline's ${label} for pricing`, async () => {
                const fetchStub = blockWcs();
                const offer = await flattenOffer(
                    {
                        path: '/content/dam/mas/acom/en_US/regional-card',
                        fields: { prices: inlinePrice('regional') },
                        wcs: { prod: { [`regional-${cacheCountry}-mult`]: [wcsOffer('regional', 1)] } },
                    },
                    context,
                );
                expect(offer.regularPrice).to.equal('$1.00');
                expect(fetchStub.called).to.be.false;
            });
        }

        it('lets request geography override fragment-wide defaults while retaining per-price overrides', async () => {
            const fetchStub = blockWcs();
            const fragment = (prices) => ({
                path: '/content/dam/mas/acom/en_US/regional-card',
                settings: { country: 'US', language: 'de', locale: 'de_DE' },
                fields: { prices },
                wcs: {
                    prod: {
                        'regional-eg-mult': [wcsOffer('regional', 2)],
                        'regional-fr-mult': [wcsOffer('regional', 3)],
                    },
                },
            });
            const context = { locale: 'en_US', country: 'EG' };
            expect((await flattenOffer(fragment(inlinePrice('regional')), context)).regularPrice).to.equal('$2.00');
            const overridden = fragment(inlinePrice('regional', 'data-country="FR" data-language="fr"'));
            expect((await flattenOffer(overridden, context)).regularPrice).to.equal('$3.00');
            expect(fetchStub.called).to.be.false;
        });
    });

    describe('CTAs', () => {
        it('lists link and button labels in authored order, inside wrappers, skipping blanks', async () => {
            const offer = await flattenOffer({
                fields: {
                    ctas: {
                        value: `
                            <span class="cta-wrapper">
                                <a is="checkout-link">Free trial</a>
                                <a is="checkout-link"><strong>Buy now</strong></a>
                            </span>
                            <p>Choose an action</p>
                            <BUTTON><span>Upgrade</span></BUTTON>
                            <a>Compare plans &amp; pricing</a>
                            <a> </a>
                            <button><span></span></button>
                        `,
                    },
                },
            });
            expect(offer.ctas).to.deep.equal([
                { label: 'Free trial' },
                { label: 'Buy now' },
                { label: 'Upgrade' },
                { label: 'Compare plans & pricing' },
            ]);
            expect(offer).to.not.have.property('cta_label');
        });

        it('hydrates inline prices inside each CTA label', async () => {
            const offer = await flattenOffer({
                fields: { ctas: `<a>Buy now for ${inlinePrice('single')}</a>` },
                wcs: { prod: { 'single-us-mult': [wcsOffer('single', 1)] } },
            });
            expect(offer.ctas).to.deep.equal([{ label: 'Buy now for $1.00' }]);
        });
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
            expect(offer).to.deep.include({ customer_segment: customerSegment, market_segment: marketSegment });
            expect(offer).to.not.have.any.keys('segment', 'market_segments');
        });
    }

    describe('promotion codes', () => {
        for (const [label, compatVersion, promoProject, cacheKey] of [
            ['ignores the card promotion code before the compatibility version', 0, undefined, 'single-us-mult'],
            ['applies the card promotion code from the compatibility version', 1, undefined, 'single-us-mult-global_promo'],
            ['applies the card promotion code to a promotion project', 0, 'project', 'single-us-mult-global_promo'],
        ]) {
            it(label, async () => {
                const fetchStub = blockWcs();
                const card = await extractMerchCard(
                    {
                        promoProject,
                        fields: { compatVersion, promoCode: 'GLOBAL_PROMO', prices: { value: inlinePrice('single') } },
                        wcs: { prod: { [cacheKey]: [wcsOffer('single', 1)] } },
                    },
                    { onPriceError: () => {} },
                );
                expect(card.regularPrice).to.equal('$1.00');
                expect(fetchStub.called).to.be.false;
            });
        }

        it('hydrates nested and variously quoted spans with their own, the card, or no promotion code', async () => {
            const fetchStub = blockWcs();
            const card = await extractMerchCard({
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
                    description: { value: inlinePrice('description') },
                },
                wcs: {
                    prod: {
                        'outer-us-mult-global_promo': [wcsOffer('outer', 1)],
                        'inner-us-mult-inner_promo': [wcsOffer('inner', 2, { promotion: { promotionCode: 'INNER_PROMO' } })],
                        'description-us-mult-global_promo': [wcsOffer('description', 3)],
                        'cancel-us-mult': [wcsOffer('cancel', 4)],
                    },
                },
            });
            expect(card.regularPrice).to.equal('$1.00');
            expect(card.description).to.equal('$3.00');
            expect(card.priceErrors).to.be.undefined;
            expect(fetchStub.called).to.be.false;
        });
    });

    describe('terms link', () => {
        const studioLink = '<a class="upt-link secondary-link" href="#" data-analytics-id="see-terms">See terms</a>';
        const termsUrl = (query) => `https://www.adobe.com/offers/promo-terms.html?${query}`;
        let fetchStub;

        beforeEach(() => {
            fetchStub = blockWcs();
        });

        it("points a Studio-authored link at the promo terms page of the card's offer and promo code", async () => {
            const offer = await flattenOffer({
                fields: { osi: 'card', promoCode: 'PROMO_1', description: `<p>Terms apply. ${studioLink}</p>` },
                wcs: { prod: { 'card-us-mult-promo_1': [wcsOffer('card', 1, { offerId: 'OFFER-PROMO' })] } },
            });
            const href = termsUrl('locale=en_US&country=US&offer_id=OFFER-PROMO&promotion_code=PROMO_1');
            expect(offer.terms_url).to.equal(href);
            expect(offer.seeTermsInfo).to.deep.equal({ analyticsId: 'see-terms', href, text: 'See terms' });
        });

        it('uses the request locale and the content country of a territory', async () => {
            const offer = await flattenOffer(
                {
                    path: '/content/dam/mas/acom/es_PR/card',
                    fields: { osi: 'card', description: studioLink },
                    wcs: { prod: { 'card-us-mult': [wcsOffer('card', 1, { offerId: 'OFFER-US' })] } },
                },
                { locale: 'es_PR' },
            );
            expect(offer.terms_url).to.equal(termsUrl('locale=es_PR&country=PR&offer_id=OFFER-US'));
        });

        it("keeps an a[is=upt-link]'s own OSI and promo code", async () => {
            const offer = await flattenOffer({
                fields: {
                    osi: 'card',
                    promoCode: 'CARD_PROMO',
                    callout: '<a is="upt-link" data-wcs-osi="own" data-promotion-code="OWN">See terms</a>',
                },
                wcs: { prod: { 'own-us-mult-own': [wcsOffer('own', 1, { offerId: 'OFFER-OWN' })] } },
            });
            expect(offer.terms_url).to.equal(termsUrl('locale=en_US&country=US&offer_id=OFFER-OWN&promotion_code=OWN'));
        });

        it("falls back to the link's own promo code when the card has none", async () => {
            const offer = await flattenOffer({
                fields: { osi: 'card', description: studioLink.replace('href="#"', 'href="#" data-promotion-code="LINK"') },
                wcs: { prod: { 'card-us-mult-link': [wcsOffer('card', 1, { offerId: 'OFFER-LINK' })] } },
            });
            expect(offer.terms_url).to.equal(termsUrl('locale=en_US&country=US&offer_id=OFFER-LINK&promotion_code=LINK'));
        });

        it('has no URL without an OSI or when the offer cannot be resolved', async () => {
            const withoutOsi = await flattenOffer({ fields: { description: studioLink } });
            expect(withoutOsi.terms_url).to.be.null;
            expect(withoutOsi.seeTermsInfo).to.deep.equal({ analyticsId: 'see-terms', href: undefined, text: 'See terms' });

            const ownLink = '<a is="upt-link" data-analytics-id="terms">See terms</a>';
            const ownLinkWithoutOsi = await flattenOffer({ fields: { osi: 'card', description: ownLink } });
            expect(ownLinkWithoutOsi.seeTermsInfo).to.deep.equal({ analyticsId: 'terms', href: undefined, text: 'See terms' });
            expect(fetchStub.called).to.be.false;

            const onPriceError = sinon.spy();
            const unresolved = await flattenOffer({ fields: { osi: 'gone', description: studioLink } }, { onPriceError });
            expect(unresolved.terms_url).to.be.null;
            expect(unresolved.seeTermsInfo.href).to.be.undefined;
            expect(onPriceError.calledOnce).to.be.true;
            expect(onPriceError.firstCall.args[1]).to.equal('gone');
        });

        describe('regular see-terms link', () => {
            const offerTerms = 'https://www.adobe.com/offer-terms/x.html';
            const link = (attributes) => `<a class="primary-link" ${attributes}>See terms</a>`;

            for (const [label, description, termsUrl] of [
                [
                    'uses the https href of a link with the see-terms analytics id',
                    link(`href="${offerTerms}" data-analytics-id="see-terms"`),
                    offerTerms,
                ],
                ['ignores a link without the see-terms analytics id', link(`href="${offerTerms}"`), null],
                ['ignores an http href', link('href="http://www.adobe.com/x.html" data-analytics-id="see-terms"'), null],
                ['ignores a relative href', link('href="/offer-terms/x.html" data-analytics-id="see-terms"'), null],
                [
                    'skips see-terms links without an https href',
                    `${studioLink} ${link(`href="${offerTerms}" data-analytics-id="see-terms"`)}`,
                    offerTerms,
                ],
            ]) {
                it(label, async () => {
                    const offer = await flattenOffer({ fields: { description } });
                    expect(offer.terms_url).to.equal(termsUrl);
                });
            }

            it('is only a fallback for a promo terms link, which keeps its own seeTermsInfo', async () => {
                const regularLink = link(`href="${offerTerms}" data-analytics-id="see-terms"`);
                const resolved = await flattenOffer({
                    fields: { osi: 'card', description: `${regularLink} ${studioLink}` },
                    wcs: { prod: { 'card-us-mult': [wcsOffer('card', 1, { offerId: 'OFFER-1' })] } },
                });
                expect(resolved.terms_url).to.equal(termsUrl('locale=en_US&country=US&offer_id=OFFER-1'));

                const unresolved = await flattenOffer({ fields: { description: `${studioLink} ${regularLink}` } });
                expect(unresolved.terms_url).to.equal(offerTerms);
                expect(unresolved.seeTermsInfo).to.deep.equal({ analyticsId: 'see-terms', href: undefined, text: 'See terms' });
                expect(fetchStub.called).to.be.false;
            });
        });
    });

    describe('price selection', () => {
        it('selects one offer per OSI and sums comma-joined OSIs like the card', async () => {
            const card = await extractMerchCard({
                fields: {
                    prices: inlinePrice('multi', 'data-template="price"'),
                    description: inlinePrice('first,second', 'data-template="price"'),
                },
                wcs: {
                    prod: {
                        'multi-us-mult': [wcsOffer('multi', 9, { term: 'ANNUAL' }), wcsOffer('multi', 4)],
                        'first-us-mult': [wcsOffer('first', 1)],
                        'second-us-mult': [wcsOffer('second', 2)],
                    },
                },
            });
            expect(card.regularPrice).to.equal('$4.00');
            expect(card.description).to.equal('$3.00');
        });

        for (const [customerSegment, unitText] of [
            ['TEAM', 'per license'],
            ['INDIVIDUAL', undefined],
        ]) {
            it(`applies the card's per-unit default for ${customerSegment} offers`, async () => {
                const card = await extractMerchCard({
                    fields: { prices: inlinePrice('seat', 'data-template="price"') },
                    wcs: {
                        prod: {
                            'seat-us-mult': [wcsOffer('seat', 7, { customerSegment, priceDetails: { perUnit: 'LICENSE' } })],
                        },
                    },
                });
                expect(card.regularPrice).to.equal('$7.00');
                expect(card.unitText).to.equal(unitText);
            });
        }

        it('returns the annual amount, not its opening parenthesis, for an annual ABM price', async () => {
            const card = await extractMerchCard({
                fields: { prices: inlinePrice('abm', 'data-template="price" data-display-annual="true"') },
                wcs: {
                    prod: {
                        'abm-us-mult': [
                            wcsOffer('abm', 20, {
                                commitment: 'YEAR',
                                term: 'MONTHLY',
                                priceDetails: { formatString: "'US$'#,##0.00", annualized: { annualizedPrice: 240 } },
                            }),
                        ],
                    },
                },
            });
            expect(card).to.deep.include({ regularPrice: 'US$20.00', annualPrice: 'US$240.00', recurrenceText: '/mo' });
        });

        it('hydrates annual ABM promotional prices without a document or explicit instant', async () => {
            expect(globalThis).not.to.have.property('document');
            sinon.useFakeTimers({ now: new Date('2025-01-15T12:00:00.000Z'), toFake: ['Date'] });
            const fetchStub = blockWcs();
            const onPriceError = sinon.spy();
            const card = await extractMerchCard(
                {
                    fields: {
                        prices: inlinePrice(
                            'abm-promo',
                            'data-template="price" data-display-annual="true" data-promotion-code="PROMO"',
                        ),
                    },
                    wcs: {
                        prod: {
                            'abm-promo-us-mult-promo': [
                                wcsOffer('abm-promo', 20, {
                                    planType: 'ABM',
                                    commitment: 'YEAR',
                                    term: 'MONTHLY',
                                    promotion: {
                                        start: '2024-01-01T00:00:00.000Z',
                                        end: '2026-01-01T00:00:00.000Z',
                                        displaySummary: {
                                            amount: 50,
                                            duration: 'P3M',
                                            outcomeType: 'PERCENTAGE_DISCOUNT',
                                            minProductQuantity: 1,
                                        },
                                    },
                                    priceDetails: {
                                        priceWithoutDiscount: 40,
                                        annualized: { annualizedPrice: 240, annualizedPriceWithoutDiscount: 480 },
                                    },
                                }),
                            ],
                        },
                    },
                },
                { onPriceError },
            );
            expect(onPriceError.getCalls().map(({ args }) => args[0].message)).to.deep.equal([]);
            expect(card).to.deep.include({
                regularPrice: '$40.00',
                promoPrice: '$20.00',
                annualPrice: '$420.00',
                priceErrors: undefined,
            });
            expect(fetchStub.called).to.be.false;
        });

        it('hydrates promotional prices and reports missing ones', async () => {
            const onPriceError = sinon.spy();
            const card = await extractMerchCard(
                {
                    fields: {
                        prices: {
                            value: [
                                inlinePrice(
                                    'promo',
                                    'data-display-old-price="false" data-display-per-unit="true" data-display-tax="true"',
                                ),
                                inlinePrice('missing', 'data-display-per-unit="true"'),
                            ].join(''),
                        },
                    },
                    settings: { country: 'GB', language: 'en', locale: 'en_GB' },
                    wcs: {
                        prod: {
                            'promo-gb-en': [
                                wcsOffer('promo', 5, {
                                    offerId: 'offer-promo',
                                    term: 'WEEKLY',
                                    promotion: { promotionCode: 'AUTO_PROMO' },
                                    priceDetails: { perUnit: 'LICENSE', taxDisplay: 'TAX_EXCLUSIVE', taxTerm: 'GST' },
                                }),
                            ],
                            'missing-gb-en': [],
                        },
                    },
                },
                { onPriceError },
            );
            expect(card).to.deep.include({
                regularPrice: '$5.00',
                recurrenceText: undefined,
                taxText: 'excl. GST',
                unitText: 'per license',
                planTypeText: undefined,
                priceErrors: ['missing'],
            });
            expect(onPriceError.calledOnce).to.be.true;
            expect(onPriceError.firstCall.args[0].message).to.equal('Commerce offer not found');
            expect(onPriceError.firstCall.args[1]).to.equal('missing');
        });
    });

    describe('legal text', () => {
        const gbFragment = (prices) => ({
            fields: { prices },
            settings: { country: 'GB', language: 'en', locale: 'en_GB' },
            wcs: {
                prod: {
                    'gb-gb-en': [
                        wcsOffer('gb', 5, {
                            commitment: 'YEAR',
                            term: 'MONTHLY',
                            priceDetails: { formatString: "'£'#,##0.00", taxDisplay: 'TAX_INCLUSIVE_DETAILS', taxTerm: 'VAT' },
                        }),
                    ],
                },
            },
        });
        const mainPrice = inlinePrice('gb', 'data-template="price" data-display-tax="true"');

        it('derives from the main price when no legal element is authored', async () => {
            const card = await extractMerchCard(gbFragment(mainPrice));
            expect(card.regularPrice).to.equal('£5.00');
            expect(card.taxText).to.equal('incl. VAT');
        });

        it("follows an authored legal element's own display options and casing", async () => {
            const legal = inlinePrice(
                'gb',
                'data-template="legal" data-display-tax="false" data-display-plan-type="true" data-plan-type-case="lower"',
            );
            const card = await extractMerchCard(gbFragment(`${mainPrice}${legal}`));
            expect(card.regularPrice).to.equal('£5.00');
            expect(card.taxText).to.be.undefined;
            expect(card.planTypeText).to.equal('annual, billed monthly');
        });

        describe('unit label', () => {
            const teamFragment = (prices) => ({
                fields: { prices },
                wcs: {
                    prod: {
                        'team-us-mult': [
                            wcsOffer('team', 30, {
                                customerSegment: 'TEAM',
                                commitment: 'YEAR',
                                term: 'MONTHLY',
                                priceDetails: { formatString: "'US$'#,##0.00" },
                            }),
                        ],
                    },
                },
            });
            const teamPrice = inlinePrice('team', 'data-template="price"');
            const hiddenUnitLegal = (osi) => inlinePrice(osi, 'data-template="legal" data-display-per-unit="false"');

            it('defaults from the main price of a team offer', async () => {
                const card = await extractMerchCard(teamFragment(teamPrice));
                expect(card.unitText).to.equal('per license');
            });

            it('stays hidden when an authored legal element hides it', async () => {
                const card = await extractMerchCard(teamFragment(`${teamPrice}${hiddenUnitLegal('team')}`));
                expect(card.regularPrice).to.equal('US$30.00');
                expect(card.unitText).to.be.undefined;
            });

            it('falls back to the main price when the authored legal element fails', async () => {
                sinon.stub(globalThis, 'fetch').rejects(new Error('offline'));
                const card = await extractMerchCard(teamFragment(`${teamPrice}${hiddenUnitLegal('missing')}`), {
                    onPriceError: () => {},
                });
                expect(card.priceErrors).to.deep.equal(['missing']);
                expect(card.unitText).to.equal('per license');
                expect(card.taxText).to.be.undefined;
            });
        });
    });

    describe('plan-type-text token', () => {
        const token =
            '<span is="inline-price" data-template="legal" data-placeholder="plan-type-text" data-display-plan-type="true" data-display-per-unit="false" data-display-tax="false"></span>';
        // The WCS cache derives planType from commitment and term: YEAR+MONTHLY is ABM, YEAR+ANNUAL is PUF.
        const planOffer = (osi, term) => wcsOffer(osi, 5, { commitment: 'YEAR', term });

        it("renders with the card's promo price OSI and the casing of the copy before it", async () => {
            const card = await extractMerchCard({
                fields: {
                    prices: `${inlinePrice('other', 'data-template="price"')}${inlinePrice('plan', 'data-template="price" data-promotion-code="SAVE"')}`,
                    description: `<p>Billed yearly. ${token}</p><p>Pay <strong>monthly</strong>, ${token}</p>`,
                },
                wcs: {
                    prod: {
                        'other-us-mult': [planOffer('other', 'ANNUAL')],
                        'plan-us-mult-save': [planOffer('plan', 'MONTHLY')],
                        'plan-us-mult': [planOffer('plan', 'MONTHLY')],
                    },
                },
            });
            expect(card.description).to.include('Billed yearly. Annual, billed monthly');
            expect(card.description).to.include(', annual, billed monthly');
            expect(card.priceErrors).to.be.undefined;
        });

        it("falls back to the fragment's own OSI and is skipped without one", async () => {
            const withOsi = await extractMerchCard({
                fields: { osi: 'own', description: `<p>${token}</p>`, callout: `Billed ${token}` },
                wcs: { prod: { 'own-us-mult': [planOffer('own', 'MONTHLY')] } },
            });
            expect(withOsi.description).to.equal('Annual, billed monthly');
            expect(withOsi.callout).to.equal('Billed annual, billed monthly');

            const fetchStub = blockWcs();
            const withoutOsi = await extractMerchCard({ fields: { description: `<p>Plan: ${token}</p>` } });
            expect(withoutOsi.description).to.equal('Plan:');
            expect(withoutOsi.priceErrors).to.be.undefined;
            expect(fetchStub.called).to.be.false;
        });
    });

    describe('authored text', () => {
        it('decodes an encoded ampersand entity once', async () => {
            const offer = await flattenOffer({ fields: { badge: 'Say &amp;quot;hi&amp;quot; &amp; save &quot;now&quot;' } });
            expect(offer.badge).to.equal('Say &quot;hi&quot; & save "now"');
        });

        it('keeps authored text intact around a hydrated price', async () => {
            const card = await extractMerchCard({
                fields: {
                    callout: `
                        <p>
                            <span class="renewal-text">Renews at ${inlinePrice('renewal', 'data-template="price"')} after the promotion</span>
                            </span>
                            <span class="promo-duration-text">For 3 months</span>
                        </p>
                    `,
                },
                wcs: { prod: { 'renewal-us-mult': [wcsOffer('renewal', 6)] } },
            });
            expect(card).to.deep.include({
                renewalText: 'Renews at $6.00 after the promotion',
                promoDurationText: 'For 3 months',
                regularPrice: '$6.00',
            });
        });

        it('reads the rendered text of a price template without a price element', async () => {
            const card = await extractMerchCard({
                fields: { callout: `<p>Save ${inlinePrice('sale', 'data-template="discount"')}</p>` },
                wcs: { prod: { 'sale-us-mult': [wcsOffer('sale', 5, { priceDetails: { priceWithoutDiscount: 10 } })] } },
            });
            expect(card.callout).to.equal('Save 50%');
            expect(card.regularPrice).to.be.undefined;
        });
    });
});
