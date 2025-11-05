import { expect } from 'chai';
import sinon from 'sinon';
import { MAS_ELEMENT_REGEXP, transformer as wcs } from '../../src/fragment/transformers/wcs.js';
import { createResponse } from './mocks/MockFetch.js';
import FRAGMENT from './mocks/fragment.json' with { type: 'json' };

const CONFIGURATION = (keys = ['foo', 'testing_wcs', 'bar']) => [
    {
        api_keys: keys,
        wcsURL: 'https://www.adobe.com/web_commerce_artifact',
        env: 'prod',
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
            .withArgs(sinon.match((url) => url.includes('web_commerce_artifact') && url.includes('offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M') && url.includes('country=US') && url.includes('locale=en_US') && url.includes('landscape=PUBLISHED') && url.includes('api_key=testing_wcs') && url.includes('language=MULT') && !url.includes('promotion_code')))
            .returns(createResponse(200, { resolvedOffers: [{ blah: 'blah' }] }));
        fetchStub
            .withArgs(sinon.match((url) => url.includes('web_commerce_artifact') && url.includes('offer_selector_ids=Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ') && url.includes('country=US') && url.includes('locale=en_US') && url.includes('landscape=PUBLISHED') && url.includes('promotion_code=NICOPROMO') && url.includes('api_key=testing_wcs') && url.includes('language=MULT')))
            .returns(createResponse(200, { resolvedOffers: [{ foo: 'bar' }] }));
        fetchStub
            .withArgs(sinon.match((url) => url.includes('web_commerce_artifact') && url.includes('offer_selector_ids=anotherOsiForUpt') && url.includes('country=US') && url.includes('locale=en_US') && url.includes('landscape=PUBLISHED') && url.includes('promotion_code=UPT_PROMO-1') && url.includes('api_key=testing_wcs') && url.includes('language=MULT')))
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
            .withArgs(sinon.match((url) => url.includes('web_commerce_artifact') && url.includes('offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M') && url.includes('country=GB') && url.includes('locale=en_GB') && url.includes('landscape=PUBLISHED') && url.includes('api_key=testing_wcs') && !url.includes('promotion_code')))
            .returns(createResponse(200, { resolvedOffers: [{ blah: 'blah' }] }));
        fetchStub
            .withArgs(sinon.match((url) => url.includes('web_commerce_artifact') && url.includes('offer_selector_ids=Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ') && url.includes('country=GB') && url.includes('locale=en_GB') && url.includes('landscape=PUBLISHED') && url.includes('promotion_code=NICOPROMO') && url.includes('api_key=testing_wcs')))
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

    it('should not do much if bad configuration is is found', async function () {
        context.wcsConfiguration = 'unexpected string';
        context = wcs.process(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should not do much if no wcs placeholder is found', async function () {
        context.body = { content: '<p>no wcs placeholder here</p>' };
        context.wcsConfiguration = CONFIGURATION();
        context = wcs.process(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should not do much if no api key is found', async function () {
        context.wcsConfiguration = CONFIGURATION(['some-other-key']);
        context = wcs.process(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should parse fragment and call related items, putting working ones in a map with right env', async function () {
        fetchStub
            .withArgs(sinon.match((url) => url.includes('web_commerce_artifact') && url.includes('offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M') && url.includes('country=US') && url.includes('locale=en_US') && url.includes('landscape=PUBLISHED') && url.includes('api_key=testing_wcs') && url.includes('language=MULT') && !url.includes('promotion_code')))
            .returns(createResponse(429, {}, 'Too Many Requests'));
        fetchStub
            .withArgs(sinon.match((url) => url.includes('web_commerce_artifact') && url.includes('offer_selector_ids=Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ') && url.includes('country=US') && url.includes('locale=en_US') && url.includes('landscape=PUBLISHED') && url.includes('promotion_code=NICOPROMO') && url.includes('api_key=testing_wcs') && url.includes('language=MULT')))
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
