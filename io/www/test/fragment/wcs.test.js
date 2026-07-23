import { expect } from 'chai';
import sinon from 'sinon';
import { MAS_ELEMENT_REGEXP, transformer as wcs } from '../../src/fragment/transformers/wcs.js';
import { createResponse } from './mocks/MockFetch.js';
import FRAGMENT from './mocks/fragment.json' with { type: 'json' };

const CONFIGURATION = () => [
    {
        wcsURL: 'https://www.adobe.com/web_commerce_artifact',
        env: 'prod',
        apiKey: 'wcms-commerce-ims-ro-user-milo',
    },
];

describe('MAS_ELEMENT_REGEXP', function () {
    it('should match a span with osi', function () {
        const span = '<span data-wcs-osi=\\"A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M\\" data-blah=\\"blah\\"></span>';
        const matches = span.matchAll(MAS_ELEMENT_REGEXP);
        expect(matches).to.not.be.null;
        expect([...matches][0].groups.osi).to.equal('A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M');
    });

    it('should match an a with promo code and osi', function () {
        const span =
            '<a data-promotion-code=\\"blah\\" data-foo=\\"bar\\" data-wcs-osi=\\"A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M\\">';
        const matches = span.matchAll(MAS_ELEMENT_REGEXP);
        expect(matches).to.not.be.null;
        const groups = [...matches][0].groups;
        expect(groups.osi).to.equal('A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M');
    });
});

describe('wcs typical cases', function () {
    let context = {};
    let fetchStub;

    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
        context = {
            api_key: 'testing_wcs',
            locale: 'en_US',
        };
        context.body = FRAGMENT;
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('should parse fragment and call related items  with en_US, putting them in a map with right env', async function () {
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M') &&
                        url.includes('country=US') &&
                        url.includes('locale=en_US') &&
                        url.includes('landscape=PUBLISHED') &&
                        url.includes('api_key=wcms-commerce-ims-ro-user-milo') &&
                        url.includes('language=MULT') &&
                        !url.includes('promotion_code'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ blah: 'blah' }] }));
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ') &&
                        url.includes('country=US') &&
                        url.includes('locale=en_US') &&
                        url.includes('landscape=PUBLISHED') &&
                        url.includes('promotion_code=NICOPROMO') &&
                        url.includes('api_key=wcms-commerce-ims-ro-user-milo') &&
                        url.includes('language=MULT'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ foo: 'bar' }] }));
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=anotherOsiForUpt') &&
                        url.includes('country=US') &&
                        url.includes('locale=en_US') &&
                        url.includes('landscape=PUBLISHED') &&
                        url.includes('promotion_code=UPT_PROMO-1') &&
                        url.includes('api_key=wcms-commerce-ims-ro-user-milo') &&
                        url.includes('language=MULT'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ upt: 'foo' }] }));
        context.wcsConfiguration = CONFIGURATION();
        context.body.fields.osi = 'anotherOsiForUpt';
        context.body.fields.promoCode = 'UPT_PROMO-1';
        context = await wcs.process(context);
        expect(context.body.wcs).to.deep.equal({
            prod: {
                'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M-us-mult': [
                    {
                        blah: 'blah',
                    },
                ],
                'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ-us-mult-nicopromo': [
                    {
                        foo: 'bar',
                    },
                ],
                'anotherOsiForUpt-us-mult-upt_promo-1': [
                    {
                        upt: 'foo',
                    },
                ],
            },
        });
    });

    it('should parse fragment and call related items  with en_GB, putting them in a map with right env', async function () {
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M') &&
                        url.includes('country=GB') &&
                        url.includes('locale=en_GB') &&
                        url.includes('landscape=PUBLISHED') &&
                        url.includes('api_key=wcms-commerce-ims-ro-user-milo') &&
                        !url.includes('promotion_code'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ blah: 'blah' }] }));
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ') &&
                        url.includes('country=GB') &&
                        url.includes('locale=en_GB') &&
                        url.includes('landscape=PUBLISHED') &&
                        url.includes('promotion_code=NICOPROMO') &&
                        url.includes('api_key=wcms-commerce-ims-ro-user-milo'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ foo: 'bar' }] }));
        context.wcsConfiguration = CONFIGURATION();
        delete context.body.fields.osi;
        delete context.body.fields.promoCode;
        context.locale = 'en_GB';
        context = await wcs.process(context);
        expect(context.body.wcs).to.deep.equal({
            prod: {
                'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M-gb': [
                    {
                        blah: 'blah',
                    },
                ],
                'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ-gb-nicopromo': [
                    {
                        foo: 'bar',
                    },
                ],
            },
        });
    });
});

describe('wcs corner cases', function () {
    let context = {};
    let fetchStub;

    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
        context = {
            api_key: 'testing_wcs',
            locale: 'en_US',
        };
        context.body = FRAGMENT;
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('should not do much if no wcs configuration is found', async function () {
        context = wcs.process(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should not do much if no wcs placeholder is found', async function () {
        context.body = { content: '<p>no wcs placeholder here</p>' };
        context.wcsConfiguration = CONFIGURATION();
        context = wcs.process(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should parse fragment and call related items, putting working ones in a map with right env', async function () {
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M') &&
                        url.includes('country=US') &&
                        url.includes('locale=en_US') &&
                        url.includes('landscape=PUBLISHED') &&
                        url.includes('api_key=wcms-commerce-ims-ro-user-milo') &&
                        url.includes('language=MULT') &&
                        !url.includes('promotion_code'),
                ),
            )
            .returns(createResponse(429, {}, 'Too Many Requests'));
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ') &&
                        url.includes('country=US') &&
                        url.includes('locale=en_US') &&
                        url.includes('landscape=PUBLISHED') &&
                        url.includes('promotion_code=NICOPROMO') &&
                        url.includes('api_key=wcms-commerce-ims-ro-user-milo') &&
                        url.includes('language=MULT'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ foo: 'bar' }] }));
        context.wcsConfiguration = CONFIGURATION();
        context = await wcs.process(context);
        expect(context.body.wcs).to.deep.equal({
            prod: {
                'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ-us-mult-nicopromo': [
                    {
                        foo: 'bar',
                    },
                ],
            },
        });
    });
});

describe('wcs OSI substitution', function () {
    let context = {};
    let fetchStub;

    const stubbedOffer = (name) => ({ resolvedOffers: [{ name }] });

    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
        fetchStub.resolves(createResponse(200, stubbedOffer('default')));
        context = {
            api_key: 'testing_wcs',
            locale: 'en_US',
            wcsConfiguration: CONFIGURATION(),
        };
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('substitutes OSI from data-wcs-osi HTML content when substituteMap is provided', async function () {
        context.body = {
            prices: '<span data-wcs-osi="BASE-OSI"></span>',
            fields: {},
        };
        context.substituteMap = { 'BASE-OSI': 'SUB-OSI' };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('BASE-OSI-us-mult');
    });

    it('substitutes OSI from fields.osi when substituteMap is provided', async function () {
        context.body = {
            prices: '<span data-wcs-osi="BASE-OSI"></span>',
            fields: { osi: 'BASE-OSI' },
        };
        context.substituteMap = { 'BASE-OSI': 'SUB-OSI' };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('BASE-OSI-us-mult');
    });

    it('leaves OSI unchanged when no substituteMap is present', async function () {
        context.body = {
            prices: '<span data-wcs-osi="ORIG-OSI"></span>',
            fields: { osi: 'ORIG-OSI' },
        };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=ORIG-OSI')))
            .returns(createResponse(200, stubbedOffer('original')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('ORIG-OSI-us-mult');
    });

    it('leaves OSI unchanged when substituteMap has no matching entry', async function () {
        context.body = {
            prices: '<span data-wcs-osi="ORIG-OSI"></span>',
            fields: { osi: 'ORIG-OSI' },
        };
        context.substituteMap = { 'OTHER-OSI': 'SUB-OSI' };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=ORIG-OSI')))
            .returns(createResponse(200, stubbedOffer('original')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('ORIG-OSI-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('OTHER-OSI-us-mult');
    });

    it('rewrites body HTML with substituted OSI', async function () {
        context.body = {
            prices: '<span data-wcs-osi="BASE-OSI"></span>',
            fields: {},
        };
        context.substituteMap = { 'BASE-OSI': 'SUB-OSI' };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.prices).to.include('data-wcs-osi="SUB-OSI"');
        expect(context.body.prices).to.not.include('data-wcs-osi="BASE-OSI"');
    });

    it('rewrites body fields.osi with substituted OSI', async function () {
        context.body = {
            prices: '<span data-wcs-osi="HTML-OSI"></span>',
            fields: { osi: 'FIELD-OSI' },
        };
        context.substituteMap = { 'FIELD-OSI': 'SUB-FIELD-OSI' };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-FIELD-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.fields.osi).to.equal('SUB-FIELD-OSI');
    });

    it('rewrites body HTML even when no wcsConfiguration is available', async function () {
        context.body = {
            prices: '<span data-wcs-osi="BASE-OSI"></span>',
            fields: {},
        };
        context.substituteMap = { 'BASE-OSI': 'SUB-OSI' };
        delete context.wcsConfiguration;

        context = await wcs.process(context);

        expect(context.body.prices).to.include('data-wcs-osi="SUB-OSI"');
        expect(context.body.prices).to.not.include('data-wcs-osi="BASE-OSI"');
        expect(context.body.wcs).to.be.undefined;
    });

    it('leaves body unchanged and logs error if rewritten bodyString is invalid JSON', async function () {
        const originalPrices = '<span data-wcs-osi="OSI-A"></span>';
        context.body = { prices: originalPrices, fields: {} };
        context.substituteMap = { 'OSI-A': 'INVALID"OSI' };

        context = await wcs.process(context);

        expect(context.body.prices).to.equal(originalPrices);
    });

    it('fills the cache with the promo code from a referenced card (keyed by its base osi)', async function () {
        context.body = {
            prices: '<span data-wcs-osi="BASE-OSI"></span>',
            fields: {},
            references: {
                card1: {
                    value: {
                        fields: { osi: 'BASE-OSI', promoCode: 'PROMO1' },
                    },
                },
            },
        };
        context.substituteMap = { 'BASE-OSI': 'SUB-OSI' };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI') && url.includes('promotion_code=PROMO1')))
            .returns(createResponse(200, stubbedOffer('promo')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult-promo1');
        expect(context.body.wcs.prod).to.not.have.property('SUB-OSI-us-mult');
    });

    it('fills the cache with the promo code when the referenced card osi is an array', async function () {
        context.body = {
            prices: '<span data-wcs-osi="BASE-OSI"></span>',
            fields: {},
            references: {
                card1: {
                    value: {
                        fields: { osi: ['BASE-OSI'], promoCode: 'PROMO1' },
                    },
                },
            },
        };
        context.substituteMap = { 'BASE-OSI': 'SUB-OSI' };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI') && url.includes('promotion_code=PROMO1')))
            .returns(createResponse(200, stubbedOffer('promo')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult-promo1');
    });

    it('only applies the promo code to the card that has one when osis differ', async function () {
        context.body = {
            prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-B"></span>',
            fields: {},
            references: {
                card1: { value: { fields: { osi: 'OSI-A', promoCode: 'PROMO1' } } },
                card2: { value: { fields: { osi: 'OSI-B' } } },
            },
        };

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('OSI-A-us-mult-promo1');
        expect(context.body.wcs.prod).to.have.property('OSI-B-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('OSI-A-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('OSI-B-us-mult-promo1');
    });

    it('caches both promo and plain offers when two cards share an osi but only one has a promo', async function () {
        context.body = {
            prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-A"></span>',
            fields: {},
            references: {
                card1: { value: { fields: { osi: 'OSI-A', promoCode: 'PROMO1' } } },
                card2: { value: { fields: { osi: 'OSI-A' } } },
            },
        };

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('OSI-A-us-mult-promo1');
        expect(context.body.wcs.prod).to.have.property('OSI-A-us-mult');
    });

    it('does not add a promo code when the referenced card has none', async function () {
        context.body = {
            prices: '<span data-wcs-osi="BASE-OSI"></span>',
            fields: {},
            references: {
                card1: {
                    value: {
                        fields: { osi: 'BASE-OSI' },
                    },
                },
            },
        };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=BASE-OSI') && !url.includes('promotion_code')))
            .returns(createResponse(200, stubbedOffer('no-promo')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('BASE-OSI-us-mult');
    });

    it('rewrites body HTML with multiple data-wcs-osi placeholders', async function () {
        context.body = {
            prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-B"></span>',
            fields: {},
        };
        context.substituteMap = { 'OSI-A': 'SUBSTITUTED-OSI-A', 'OSI-B': 'B' };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUBSTITUTED-OSI-A')))
            .returns(createResponse(200, stubbedOffer('sub-a')));
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=B')))
            .returns(createResponse(200, stubbedOffer('sub-b')));

        context = await wcs.process(context);

        expect(context.body.prices).to.include('data-wcs-osi="SUBSTITUTED-OSI-A"');
        expect(context.body.prices).to.include('data-wcs-osi="B"');
        expect(context.body.prices).to.not.include('data-wcs-osi="OSI-A"');
        expect(context.body.prices).to.not.include('data-wcs-osi="OSI-B"');
        expect(context.body.wcs.prod).to.have.property('SUBSTITUTED-OSI-A-us-mult');
        expect(context.body.wcs.prod).to.have.property('B-us-mult');
    });
});
