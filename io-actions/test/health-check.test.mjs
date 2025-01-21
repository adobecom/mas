import chai from 'chai';
import nock from 'nock';
import action from '../src/health-check/index.js';

const expect = chai.expect;

const ODIN_RESPONSE = {
    path: '/content/dam/mas/nala/ccd/slice-cc-allapps31211',
    id: '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
    fields: { variant: 'ccd-slice' },
};
const WCS_RESPONSE = {
    resolvedOffers: [
        {
            offerSelectorIds: ['A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M'],
            offerId: '30404A88D89A328584307175B8B27616',
            startDate: '2015-11-17T20:52:25.000Z',
            priceDetails: {
                price: 22.99,
                priceWithoutTax: 22.99,
                usePrecision: true,
                formatString: "'US$'#,##0.00",
                taxDisplay: 'TAX_EXCLUSIVE',
                taxTerm: 'TAX',
            },
            analytics:
                '{"offerId":"30404A88D89A328584307175B8B27616","label":"phsp_direct_individual","price":"22.99","amountWithoutTax":"22.99","commitmentType":"YEAR","billingFrequency":"MONTHLY","currencyCode":"USD"}',
            productArrangementCode: 'phsp_direct_individual',
            productArrangement: {
                productFamily: 'PHOTOSHOP',
                productCode: 'PHSP',
            },
            buyingProgram: 'RETAIL',
            commitment: 'YEAR',
            term: 'MONTHLY',
            customerSegment: 'INDIVIDUAL',
            marketSegments: ['COM'],
            salesChannel: 'DIRECT',
            offerType: 'BASE',
            pricePoint: 'REGULAR',
            language: 'MULT',
            merchant: 'ADOBE',
        },
    ],
};

const PARAMS = {
    ODIN_CDN_ENDPOINT: 'https://odincdn/testurl',
    ODIN_ORIGIN_ENDPOINT: 'https://odinorigin/testurl',
    WCS_CDN_ENDPOINT: 'https://wcscdn/testurl',
    WCS_ORIGIN_ENDPOINT: 'https://wcsorigin/testurl',
};

describe('health-check', () => {
    it('main should be defined', () => {
        expect(action.main).to.be.a('function');
    });

    it('return 200 & success status if odin & wcs are valid', async () => {
        nock('https://odincdn').get('/testurl').reply(200, ODIN_RESPONSE);
        nock('https://odinorigin').get('/testurl').reply(200, ODIN_RESPONSE);
        nock('https://wcscdn').get('/testurl').reply(200, WCS_RESPONSE);
        nock('https://wcsorigin').get('/testurl').reply(200, WCS_RESPONSE);

        const response = await action.main(PARAMS);
        expect(response).to.deep.equal({
            statusCode: 200,
            body: {
                status: 'success',
                odinCDN: 'ok',
                odinOrigin: 'ok',
                wcsCDN: 'ok',
                wcsOrigin: 'ok',
            },
        });
    });

    it('return 500 & error if odin json is not valid (no fields object)', async () => {
        const odininvalidJson = {
            path: '/content/dam/mas/nala/ccd/slice-cc-allapps31211',
            id: '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
        };
        nock('https://odincdn').get('/testurl').reply(200, ODIN_RESPONSE);
        nock('https://odinorigin').get('/testurl').reply(200, odininvalidJson);
        nock('https://wcscdn').get('/testurl').reply(200, WCS_RESPONSE);
        nock('https://wcsorigin').get('/testurl').reply(200, WCS_RESPONSE);

        const response = await action.main(PARAMS);
        expect(response).to.deep.equal({
            statusCode: 500,
            body: {
                status: 'error',
                odinCDN: 'ok',
                odinOrigin: {
                    url: 'https://odinorigin/testurl',
                    reason: 'Invalid JSON.',
                    status: 'fail',
                },
                wcsCDN: 'ok',
                wcsOrigin: 'ok',
            },
        });
    });

    it('return 500 & error if odin cdn is 404', async () => {
        nock('https://odincdn').get('/testurl').reply(404, {});
        nock('https://odinorigin').get('/testurl').reply(200, ODIN_RESPONSE);
        nock('https://wcscdn').get('/testurl').reply(200, WCS_RESPONSE);
        nock('https://wcsorigin').get('/testurl').reply(200, WCS_RESPONSE);

        const response = await action.main(PARAMS);
        expect(response).to.deep.equal({
            statusCode: 500,
            body: {
                status: 'error',
                odinCDN: {
                    url: 'https://odincdn/testurl',
                    reason: '404 Not Found',
                    status: 'fail',
                },
                odinOrigin: 'ok',
                wcsCDN: 'ok',
                wcsOrigin: 'ok',
            },
        });
    });

    it('return 500 & error if WCS is 503', async () => {
        nock('https://odincdn').get('/testurl').reply(200, ODIN_RESPONSE);
        nock('https://odinorigin').get('/testurl').reply(200, ODIN_RESPONSE);
        nock('https://wcscdn').get('/testurl').reply(200, WCS_RESPONSE);
        nock('https://wcsorigin').get('/testurl').reply(503, {});

        const response = await action.main(PARAMS);
        expect(response).to.deep.equal({
            statusCode: 500,
            body: {
                status: 'error',
                odinCDN: 'ok',
                odinOrigin: 'ok',
                wcsCDN: 'ok',
                wcsOrigin: {
                    url: 'https://wcsorigin/testurl',
                    reason: '503 Service Unavailable',
                    status: 'fail',
                },
            },
        });
    });
});
