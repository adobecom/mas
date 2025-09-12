const { expect } = require('chai');
const nock = require('nock');
const { MAS_ELEMENT_REGEXP, wcs } = require('../../src/fragment/wcs.js');

const { MockState } = require('./mocks/MockState.js');
const FRAGMENT = require('./mocks/fragment.json');
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
    beforeEach(function () {
        context = {
            api_key: 'testing_wcs',
            locale: 'en_US',
        };
        context.body = FRAGMENT;
    });

    afterEach(function () {
        nock.cleanAll();
    });

    it('should parse fragment and call related items  with en_US, putting them in a map with right env', async function () {
        // french fragment by id
        nock('https://www.adobe.com')
            .get('/web_commerce_artifact')
            .query({
                offer_selector_ids: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                country: 'US',
                locale: 'en_US',
                landscape: 'PUBLISHED',
                api_key: 'testing_wcs',
                language: 'MULT',
            })
            .reply(200, { resolvedOffers: [{ blah: 'blah' }] });
        nock('https://www.adobe.com')
            .get('/web_commerce_artifact')
            .query({
                offer_selector_ids: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                country: 'US',
                locale: 'en_US',
                landscape: 'PUBLISHED',
                promotion_code: 'NICOPROMO',
                api_key: 'testing_wcs',
                language: 'MULT',
            })
            .reply(200, { resolvedOffers: [{ foo: 'bar' }] });
        nock('https://www.adobe.com')
            .get('/web_commerce_artifact')
            .query({
                offer_selector_ids: 'anotherOsiForUpt',
                country: 'US',
                locale: 'en_US',
                landscape: 'PUBLISHED',
                promotion_code: 'UPT_PROMO-1',
                api_key: 'testing_wcs',
                language: 'MULT',
            })
            .reply(200, { resolvedOffers: [{ upt: 'foo' }] });
        context.wcsConfiguration = CONFIGURATION();
        context.body.fields.osi = 'anotherOsiForUpt';
        context.body.fields.promoCode = 'UPT_PROMO-1';
        context = await wcs(context);
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
        // french fragment by id
        nock('https://www.adobe.com')
            .get('/web_commerce_artifact')
            .query({
                offer_selector_ids: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                country: 'GB',
                locale: 'en_GB',
                landscape: 'PUBLISHED',
                api_key: 'testing_wcs',
            })
            .reply(200, { resolvedOffers: [{ blah: 'blah' }] });
        nock('https://www.adobe.com')
            .get('/web_commerce_artifact')
            .query({
                offer_selector_ids: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                country: 'GB',
                locale: 'en_GB',
                landscape: 'PUBLISHED',
                promotion_code: 'NICOPROMO',
                api_key: 'testing_wcs',
            })
            .reply(200, { resolvedOffers: [{ foo: 'bar' }] });
        context.wcsConfiguration = CONFIGURATION();
        delete context.body.fields.osi;
        delete context.body.fields.promoCode;
        context.locale = 'en_GB';
        context = await wcs(context);
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
    beforeEach(function () {
        context = {
            api_key: 'testing_wcs',
            locale: 'en_US',
        };
        context.body = FRAGMENT;
    });

    afterEach(function () {
        nock.cleanAll();
    });

    it('should not do much if no wcs configuration is found', async function () {
        context = wcs(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should not do much if bad configuration is is found', async function () {
        context.wcsConfiguration = 'unexpected string';
        context = wcs(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should not do much if no wcs placeholder is found', async function () {
        context.body = { content: '<p>no wcs placeholder here</p>' };
        context.wcsConfiguration = CONFIGURATION();
        context = wcs(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should not do much if no api key is found', async function () {
        context.wcsConfiguration = CONFIGURATION(['some-other-key']);
        context = wcs(context);
        expect(context.body?.wcs).to.be.undefined;
    });

    it('should parse fragment and call related items, putting working ones in a map with right env', async function () {
        // french fragment by id
        nock('https://www.adobe.com')
            .get('/web_commerce_artifact')
            .query({
                offer_selector_ids: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                country: 'US',
                locale: 'en_US',
                landscape: 'PUBLISHED',
                api_key: 'testing_wcs',
                language: 'MULT',
            })
            .reply(429);
        nock('https://www.adobe.com')
            .get('/web_commerce_artifact')
            .query({
                offer_selector_ids: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                country: 'US',
                locale: 'en_US',
                landscape: 'PUBLISHED',
                promotion_code: 'NICOPROMO',
                api_key: 'testing_wcs',
                language: 'MULT',
            })
            .reply(200, { resolvedOffers: [{ foo: 'bar' }] });
        context.wcsConfiguration = CONFIGURATION();
        context = await wcs(context);
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
