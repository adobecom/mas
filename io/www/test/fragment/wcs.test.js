import { expect } from 'chai';
import sinon from 'sinon';
import {
    MAS_ELEMENT_REGEXP,
    transformer as wcs,
    substituteOsi,
    scanMasElements,
    applyPromoScope,
} from '../../src/fragment/transformers/wcs.js';
import { createResponse } from './mocks/MockFetch.js';
import FRAGMENT from './mocks/fragment.json' with { type: 'json' };

const CONFIGURATION = () => [
    {
        wcsURL: 'https://www.adobe.com/web_commerce_artifact',
        env: 'prod',
    },
];

describe('MAS_ELEMENT_REGEXP', function () {
    it('should match a span with osi', function () {
        const span = '<span data-wcs-osi="A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M" data-blah="blah"></span>';
        const matches = span.matchAll(MAS_ELEMENT_REGEXP);
        expect(matches).to.not.be.null;
        expect([...matches][0].groups.osi).to.equal('A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M');
    });

    it('should match an a with promo code and osi', function () {
        const span = '<a data-promotion-code="blah" data-foo="bar" data-wcs-osi="A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M">';
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
                        url.includes('api_key=testing_wcs') &&
                        url.includes('language=MULT') &&
                        url.includes('promotion_code=UPT_PROMO-1'),
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
                        url.includes('api_key=testing_wcs') &&
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
                        url.includes('api_key=testing_wcs') &&
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
                'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M-us-mult-upt_promo-1': [
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
        delete context.body.fields.osi;
        delete context.body.fields.promoCode;
    });

    it('falls back to the top-level fragment promoCode for a bare markup OSI with no matching reference', async function () {
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M') &&
                        url.includes('promotion_code=CTX_PROMO'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ blah: 'blah' }] }));
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ') &&
                        url.includes('promotion_code=NICOPROMO'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ foo: 'bar' }] }));
        context.wcsConfiguration = CONFIGURATION();
        context.body.fields.promoCode = 'CTX_PROMO';
        context = await wcs.process(context);
        expect(context.body.wcs.prod).to.have.property('A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M-us-mult-ctx_promo');
        expect(context.body.wcs.prod).to.not.have.property('A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M-us-mult');
        expect(context.body.wcs.prod).to.have.property('Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ-us-mult-nicopromo');
        delete context.body.fields.promoCode;
    });

    it('reference-map promo code takes precedence over the top-level fragment promoCode', async function () {
        context.body.references.card1 = {
            value: {
                fields: { osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M', promoCode: 'REF_PROMO' },
            },
        };
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M') &&
                        url.includes('promotion_code=REF_PROMO'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ blah: 'blah' }] }));
        fetchStub
            .withArgs(
                sinon.match(
                    (url) =>
                        url.includes('web_commerce_artifact') &&
                        url.includes('offer_selector_ids=Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ') &&
                        url.includes('promotion_code=NICOPROMO'),
                ),
            )
            .returns(createResponse(200, { resolvedOffers: [{ foo: 'bar' }] }));
        context.wcsConfiguration = CONFIGURATION();
        context.body.fields.promoCode = 'CTX_PROMO';
        context = await wcs.process(context);
        expect(context.body.wcs.prod).to.have.property('A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M-us-mult-ref_promo');
        expect(context.body.wcs.prod).to.not.have.property('A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M-us-mult-ctx_promo');
        delete context.body.fields.promoCode;
        delete context.body.references.card1;
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
                        url.includes('api_key=testing_wcs') &&
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
                        url.includes('api_key=testing_wcs'),
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
                        url.includes('api_key=testing_wcs') &&
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
                        url.includes('api_key=testing_wcs') &&
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

    // Fragments customize scoped to an active promo project carry an entry in context.promoScopeById.
    const scope = (substituteMap, promoMap = {}) => ({ promoMap, substituteMap });

    it('substitutes an OSI referenced in rich text when the fragment is in a promo project', async function () {
        context.body = {
            id: 'frag-1',
            fields: { prices: '<span data-wcs-osi="BASE-OSI"></span>' },
        };
        context.promoScopeById = { 'frag-1': scope({ 'BASE-OSI': 'SUB-OSI' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('BASE-OSI-us-mult');
    });

    it('substitutes the fragment fields.osi when the fragment is in a promo project', async function () {
        context.body = {
            id: 'frag-1',
            fields: { osi: 'BASE-OSI', prices: '<span data-wcs-osi="BASE-OSI"></span>' },
        };
        context.promoScopeById = { 'frag-1': scope({ 'BASE-OSI': 'SUB-OSI' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.fields.osi).to.equal('SUB-OSI');
        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('BASE-OSI-us-mult');
    });

    it('leaves OSI unchanged when the fragment has no promo scope', async function () {
        context.body = {
            id: 'frag-1',
            fields: { osi: 'ORIG-OSI', prices: '<span data-wcs-osi="ORIG-OSI"></span>' },
        };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=ORIG-OSI')))
            .returns(createResponse(200, stubbedOffer('original')));

        context = await wcs.process(context);

        expect(context.body.fields.osi).to.equal('ORIG-OSI');
        expect(context.body.wcs.prod).to.have.property('ORIG-OSI-us-mult');
    });

    it('leaves an out-of-scope fragment untouched even when it shares an OSI a project substitutes', async function () {
        // MWPW-201862: the substitution belongs to a project the collection root is in, but card2 is not.
        context.body = {
            id: 'root',
            fields: { osi: 'BASE-OSI', prices: '<span data-wcs-osi="BASE-OSI"></span>' },
            references: {
                card2: {
                    value: {
                        id: 'card2',
                        fields: { osi: 'BASE-OSI', prices: '<span data-wcs-osi="BASE-OSI"></span>' },
                    },
                },
            },
        };
        context.promoScopeById = { root: scope({ 'BASE-OSI': 'SUB-OSI' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=BASE-OSI')))
            .returns(createResponse(200, stubbedOffer('base')));

        context = await wcs.process(context);

        expect(context.body.fields.osi).to.equal('SUB-OSI');
        expect(context.body.references.card2.value.fields.osi).to.equal('BASE-OSI');
        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult');
        expect(context.body.wcs.prod).to.have.property('BASE-OSI-us-mult');
    });

    it('leaves OSI unchanged when the substituteMap has no matching entry', async function () {
        context.body = {
            id: 'frag-1',
            fields: { osi: 'ORIG-OSI', prices: '<span data-wcs-osi="ORIG-OSI"></span>' },
        };
        context.promoScopeById = { 'frag-1': scope({ 'OTHER-OSI': 'SUB-OSI' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=ORIG-OSI')))
            .returns(createResponse(200, stubbedOffer('original')));

        context = await wcs.process(context);

        expect(context.body.fields.osi).to.equal('ORIG-OSI');
        expect(context.body.wcs.prod).to.have.property('ORIG-OSI-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('OTHER-OSI-us-mult');
    });

    it('rewrites rich text markup with the substituted OSI', async function () {
        context.body = {
            id: 'frag-1',
            fields: { prices: '<span data-wcs-osi="BASE-OSI"></span>' },
        };
        context.promoScopeById = { 'frag-1': scope({ 'BASE-OSI': 'SUB-OSI' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.fields.prices).to.include('data-wcs-osi="SUB-OSI"');
        expect(context.body.fields.prices).to.not.include('data-wcs-osi="BASE-OSI"');
    });

    it('substitutes a text/html field value shaped { mimeType, value }', async function () {
        context.body = {
            id: 'frag-1',
            fields: { description: { mimeType: 'text/html', value: '<span data-wcs-osi="BASE-OSI"></span>' } },
        };
        context.promoScopeById = { 'frag-1': scope({ 'BASE-OSI': 'SUB-OSI' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.fields.description.value).to.include('data-wcs-osi="SUB-OSI"');
        expect(context.body.fields.description.mimeType).to.equal('text/html');
    });

    it('rewrites rich text markup even when no wcsConfiguration is available', async function () {
        context.body = {
            id: 'frag-1',
            fields: { prices: '<span data-wcs-osi="BASE-OSI"></span>' },
        };
        context.promoScopeById = { 'frag-1': scope({ 'BASE-OSI': 'SUB-OSI' }) };
        delete context.wcsConfiguration;

        context = await wcs.process(context);

        expect(context.body.fields.prices).to.include('data-wcs-osi="SUB-OSI"');
        expect(context.body.fields.prices).to.not.include('data-wcs-osi="BASE-OSI"');
        expect(context.body.wcs).to.be.undefined;
    });

    it('substitutes an OSI injected into rich text by the replace transformer (post-replace ordering)', async function () {
        // MWPW-201862: this OSI is not the fragment's own osi and would be invisible to logic that
        // ran in customize (before `replace`). Because promo code + substitution run in wcs, it is
        // both promo-matched and substituted. Simulated by placing the OSI directly in the field.
        context.body = {
            id: 'frag-1',
            fields: {
                osi: 'OWN-OSI',
                description: '<p>from placeholder <span data-wcs-osi="INJECTED-OSI"></span></p>',
            },
        };
        context.promoScopeById = {
            'frag-1': scope({ 'INJECTED-OSI': 'SUB-INJECTED' }, { 'INJECTED-OSI': 'BTS26' }),
        };
        fetchStub
            .withArgs(
                sinon.match((url) => url.includes('offer_selector_ids=SUB-INJECTED') && url.includes('promotion_code=BTS26')),
            )
            .returns(createResponse(200, stubbedOffer('promo')));

        context = await wcs.process(context);

        expect(context.body.fields.promoCode).to.equal('BTS26');
        expect(context.body.fields.description).to.include('data-wcs-osi="SUB-INJECTED"');
        expect(context.body.wcs.prod).to.have.property('SUB-INJECTED-us-mult-bts26');
    });

    it('fills the cache with the promo code from a referenced card (keyed by its substituted osi)', async function () {
        context.body = {
            id: 'root',
            fields: { prices: '<span data-wcs-osi="BASE-OSI"></span>' },
            references: {
                card1: {
                    value: {
                        id: 'card1',
                        fields: { osi: 'BASE-OSI', promoCode: 'PROMO1' },
                    },
                },
            },
        };
        context.promoScopeById = {
            root: scope({ 'BASE-OSI': 'SUB-OSI' }),
            card1: scope({ 'BASE-OSI': 'SUB-OSI' }),
        };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI') && url.includes('promotion_code=PROMO1')))
            .returns(createResponse(200, stubbedOffer('promo')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult-promo1');
        expect(context.body.wcs.prod).to.not.have.property('SUB-OSI-us-mult');
    });

    it('fills the cache with the promo code when the referenced card osi is an array', async function () {
        context.body = {
            id: 'root',
            fields: { prices: '<span data-wcs-osi="BASE-OSI"></span>' },
            references: {
                card1: {
                    value: {
                        id: 'card1',
                        fields: { osi: ['BASE-OSI'], promoCode: 'PROMO1' },
                    },
                },
            },
        };
        context.promoScopeById = {
            root: scope({ 'BASE-OSI': 'SUB-OSI' }),
            card1: scope({ 'BASE-OSI': 'SUB-OSI' }),
        };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-OSI') && url.includes('promotion_code=PROMO1')))
            .returns(createResponse(200, stubbedOffer('promo')));

        context = await wcs.process(context);

        expect(context.body.wcs.prod).to.have.property('SUB-OSI-us-mult-promo1');
    });

    it('only applies the promo code to the card that has one when osis differ', async function () {
        context.body = {
            fields: { prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-B"></span>' },
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
            fields: { prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-A"></span>' },
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
            fields: { prices: '<span data-wcs-osi="BASE-OSI"></span>' },
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

    it('rewrites multiple data-wcs-osi placeholders in rich text', async function () {
        context.body = {
            id: 'frag-1',
            fields: { prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-B"></span>' },
        };
        context.promoScopeById = { 'frag-1': scope({ 'OSI-A': 'SUBSTITUTED-OSI-A', 'OSI-B': 'B' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUBSTITUTED-OSI-A')))
            .returns(createResponse(200, stubbedOffer('sub-a')));
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=B')))
            .returns(createResponse(200, stubbedOffer('sub-b')));

        context = await wcs.process(context);

        expect(context.body.fields.prices).to.include('data-wcs-osi="SUBSTITUTED-OSI-A"');
        expect(context.body.fields.prices).to.include('data-wcs-osi="B"');
        expect(context.body.fields.prices).to.not.include('data-wcs-osi="OSI-A"');
        expect(context.body.fields.prices).to.not.include('data-wcs-osi="OSI-B"');
        expect(context.body.wcs.prod).to.have.property('SUBSTITUTED-OSI-A-us-mult');
        expect(context.body.wcs.prod).to.have.property('B-us-mult');
    });

    it('substitutes each part of a comma-joined multi-OSI discount placeholder (MWPW-201714)', async function () {
        context.body = {
            id: 'frag-1',
            fields: { prices: '<span data-template="discount" data-wcs-osi="OSI-A,OSI-B"></span>' },
        };
        context.promoScopeById = { 'frag-1': scope({ 'OSI-A': 'SUB-A', 'OSI-B': 'SUB-B' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-A%2CSUB-B')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.fields.prices).to.include('data-wcs-osi="SUB-A,SUB-B"');
        expect(context.body.fields.prices).to.not.include('data-wcs-osi="OSI-A,OSI-B"');
        expect(context.body.wcs.prod).to.have.property('SUB-A,SUB-B-us-mult');
    });

    it('substitutes only the matching part of a comma-joined multi-OSI placeholder (MWPW-201714)', async function () {
        context.body = {
            id: 'frag-1',
            fields: { prices: '<span data-template="discount" data-wcs-osi="OSI-A,OSI-B"></span>' },
        };
        context.promoScopeById = { 'frag-1': scope({ 'OSI-A': 'SUB-A' }) };
        fetchStub
            .withArgs(sinon.match((url) => url.includes('offer_selector_ids=SUB-A%2COSI-B')))
            .returns(createResponse(200, stubbedOffer('substituted')));

        context = await wcs.process(context);

        expect(context.body.fields.prices).to.include('data-wcs-osi="SUB-A,OSI-B"');
        expect(context.body.wcs.prod).to.have.property('SUB-A,OSI-B-us-mult');
    });
});

describe('wcs OSI helpers', function () {
    const run = (promoScopeById, body) => {
        const context = { promoScopeById, body };
        return { context, elements: applyPromoScope(context) };
    };

    it('substituteOsi returns the input unchanged when no substituteMap', function () {
        expect(substituteOsi('OSI-A', undefined)).to.equal('OSI-A');
    });

    it('substituteOsi maps each comma-separated part independently', function () {
        expect(substituteOsi('OSI-A,OSI-B', { 'OSI-A': 'SUB-A' })).to.equal('SUB-A,OSI-B');
    });

    it('scanMasElements collects osi + inline promo code and skips the osi field and non-markup fields', function () {
        const fields = {
            osi: 'OWN',
            prices: '<span data-wcs-osi="A"></span>',
            ctas: '<a data-promotion-code="CODE" data-wcs-osi="B,C"></a>',
            title: 'no markup here',
        };
        const elements = scanMasElements(fields, undefined);
        expect(elements).to.deep.equal([
            { osi: 'A', rawOsi: 'A', promotionCode: undefined },
            { osi: 'B,C', rawOsi: 'B,C', promotionCode: 'CODE' },
        ]);
        // no substituteMap => fields left untouched
        expect(fields.prices).to.equal('<span data-wcs-osi="A"></span>');
    });

    it('scanMasElements rewrites substituted OSIs in string and { value } fields', function () {
        const fields = {
            prices: '<span data-wcs-osi="A"></span>',
            description: { mimeType: 'text/html', value: '<span data-wcs-osi="B,C"></span>' },
        };
        // debugLogs context exercises the "Substituting OSI ..." debug log path.
        const elements = scanMasElements(fields, { A: 'SUB-A', B: 'SUB-B' }, { debugLogs: true });
        expect(elements.map((element) => element.osi)).to.deep.equal(['SUB-A', 'SUB-B,C']);
        expect(fields.prices).to.equal('<span data-wcs-osi="SUB-A"></span>');
        expect(fields.description.value).to.equal('<span data-wcs-osi="SUB-B,C"></span>');
        expect(fields.description.mimeType).to.equal('text/html');
    });

    it('scanMasElements returns [] for a fragment without fields', function () {
        expect(scanMasElements(undefined, undefined)).to.deep.equal([]);
    });

    it('applyPromoScope prefers the fragment own osi promo code over rich text OSIs', function () {
        const { context } = run(
            { f: { promoMap: { OWN: 'OWN-CODE', RICH: 'RICH-CODE' }, substituteMap: {} } },
            { id: 'f', fields: { osi: 'OWN', description: '<span data-wcs-osi="RICH"></span>' } },
        );
        expect(context.body.fields.promoCode).to.equal('OWN-CODE');
    });

    it('applyPromoScope does not set a promo code (even wildcard) when the fragment has no osi', function () {
        const { context } = run(
            { f: { promoMap: { '*': 'WILDCARD' }, substituteMap: {} } },
            { id: 'f', fields: { title: 'text only' } },
        );
        expect(context.body.fields.promoCode).to.be.undefined;
    });

    it('applyPromoScope falls back to the wildcard promo code when no explicit osi matches', function () {
        const { context } = run(
            { f: { promoMap: { '*': 'WILDCARD' }, substituteMap: {} } },
            { id: 'f', fields: { osi: 'SOME-OSI' } },
        );
        expect(context.body.fields.promoCode).to.equal('WILDCARD');
    });

    // Locks in the intended behavior expansion: a fragment with no own osi still receives the
    // project's wildcard promo code when it references an OSI only in rich text (headless case).
    it('applyPromoScope applies the wildcard promo code to a fragment whose only osi is in rich text', function () {
        const { context } = run(
            { f: { promoMap: { '*': 'WILDCARD' }, substituteMap: {} } },
            { id: 'f', fields: { prices: '<span data-wcs-osi="RICH-OSI"></span>' } },
        );
        expect(context.body.fields.promoCode).to.equal('WILDCARD');
    });

    it('applyPromoScope matches a substituted osi against the promo map and substitutes fields.osi', function () {
        const { context } = run(
            { f: { promoMap: { SUB: 'SUB-CODE' }, substituteMap: { BASE: 'SUB' } } },
            { id: 'f', fields: { osi: 'BASE' } },
        );
        expect(context.body.fields.promoCode).to.equal('SUB-CODE');
        expect(context.body.fields.osi).to.equal('SUB');
    });

    it('applyPromoScope substitutes an array fields.osi element-wise', function () {
        const { context } = run(
            { f: { promoMap: {}, substituteMap: { 'OSI-B': 'SUB-B' } } },
            { id: 'f', fields: { osi: ['OSI-A', 'OSI-B'] } },
        );
        expect(context.body.fields.osi).to.deep.equal(['OSI-A', 'SUB-B']);
    });

    it('applyPromoScope leaves out-of-scope fragments and id-less/null references untouched', function () {
        const { context, elements } = run(
            { 'in-scope': { promoMap: {}, substituteMap: { A: 'SUB-A' } } },
            {
                id: 'in-scope',
                fields: { prices: '<span data-wcs-osi="A"></span>' },
                references: {
                    other: { value: { id: 'out-of-scope', fields: { prices: '<span data-wcs-osi="A"></span>' } } },
                    // reference value without an id, and a null reference — both must be skipped safely.
                    noId: { value: { fields: { prices: '<span data-wcs-osi="A"></span>' } } },
                    nullRef: null,
                },
            },
        );
        expect(context.body.fields.prices).to.include('data-wcs-osi="SUB-A"');
        expect(context.body.references.other.value.fields.prices).to.include('data-wcs-osi="A"');
        expect(context.body.references.noId.value.fields.prices).to.include('data-wcs-osi="A"');
        // returns every element across the tree: root (substituted) + the two untouched references
        expect(elements.map((element) => element.osi).sort()).to.deep.equal(['A', 'A', 'SUB-A']);
    });

    it('applyPromoScope handles a scoped fragment that has no fields', function () {
        const { context, elements } = run({ f: { promoMap: { '*': 'W' }, substituteMap: {} } }, { id: 'f' });
        expect(context.body.fields).to.be.undefined;
        expect(elements).to.deep.equal([]);
    });

    it('applyPromoScope is a no-op without promoScopeById or body', function () {
        expect(applyPromoScope({ body: { id: 'f', fields: { osi: 'A' } } })).to.deep.equal([]);
        expect(applyPromoScope({ promoScopeById: {} })).to.deep.equal([]);
    });
});

describe('wcs collection promos', function () {
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

    it('caches each card with its own promo when two cards have different promos', async function () {
        context.body = {
            fields: { prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-B"></span>' },
            references: {
                card1: { value: { fields: { osi: 'OSI-A', promoCode: 'PROMO_A' } } },
                card2: { value: { fields: { osi: 'OSI-B', promoCode: 'PROMO_B' } } },
            },
        };
        context = await wcs.process(context);
        expect(context.body.wcs.prod).to.have.property('OSI-A-us-mult-promo_a');
        expect(context.body.wcs.prod).to.have.property('OSI-B-us-mult-promo_b');
        expect(context.body.wcs.prod).to.not.have.property('OSI-A-us-mult-promo_b');
        expect(context.body.wcs.prod).to.not.have.property('OSI-B-us-mult-promo_a');
    });

    it('caches the plain offer for a no-promo card sharing a collection with a promoted card', async function () {
        context.body = {
            fields: { prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-B"></span>' },
            references: {
                card1: { value: { fields: { osi: 'OSI-A', promoCode: 'PROMO_A' } } },
                card2: { value: { fields: { osi: 'OSI-B' } } },
            },
        };
        context = await wcs.process(context);
        expect(context.body.wcs.prod).to.have.property('OSI-A-us-mult-promo_a');
        expect(context.body.wcs.prod).to.have.property('OSI-B-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('OSI-B-us-mult-promo_a');
    });

    it('never applies a collection card promo to a different cards bare osi', async function () {
        context.body = {
            fields: { prices: '<span data-wcs-osi="OSI-A"></span><span data-wcs-osi="OSI-BARE"></span>' },
            references: {
                card1: { value: { fields: { osi: 'OSI-A', promoCode: 'PROMO_A' } } },
            },
        };
        context = await wcs.process(context);
        expect(context.body.wcs.prod).to.have.property('OSI-A-us-mult-promo_a');
        expect(context.body.wcs.prod).to.have.property('OSI-BARE-us-mult');
        expect(context.body.wcs.prod).to.not.have.property('OSI-BARE-us-mult-promo_a');
    });
});
