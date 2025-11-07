import { expect } from 'chai';
import sinon from 'sinon';
import { main } from '../src/health-check/index.js';
import { createResponse } from './fragment/mocks/MockFetch.js';

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
    ODIN_CDN_ENDPOINT: 'https://odincdn.adobe.com/testurl',
    ODIN_ORIGIN_ENDPOINT: 'https://odinorigin.adobe.com/testurl',
    WCS_CDN_ENDPOINT: 'https://wcscdn.adobe.com/testurl',
    WCS_ORIGIN_ENDPOINT: 'https://wcsorigin.adobe.com/testurl',
};

describe('health-check', () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('main should be defined', () => {
        expect(main).to.be.a('function');
    });

    it('return 200 & success status if odin & wcs are valid', async () => {
        fetchStub.withArgs('https://odincdn.adobe.com/testurl').returns(createResponse(200, ODIN_RESPONSE));
        fetchStub.withArgs('https://odinorigin.adobe.com/testurl').returns(createResponse(200, ODIN_RESPONSE));
        fetchStub.withArgs('https://wcscdn.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));
        fetchStub.withArgs('https://wcsorigin.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));

        const response = await main(PARAMS);
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
        fetchStub.withArgs('https://odincdn.adobe.com/testurl').returns(createResponse(200, ODIN_RESPONSE));
        fetchStub.withArgs('https://odinorigin.adobe.com/testurl').returns(createResponse(200, odininvalidJson));
        fetchStub.withArgs('https://wcscdn.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));
        fetchStub.withArgs('https://wcsorigin.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));

        const response = await main(PARAMS);
        expect(response).to.deep.equal({
            statusCode: 500,
            body: {
                status: 'error',
                odinCDN: 'ok',
                odinOrigin: {
                    url: 'https://odinorigin.adobe.com/testurl',
                    reason: 'Invalid JSON.',
                    status: 'fail',
                },
                wcsCDN: 'ok',
                wcsOrigin: 'ok',
            },
        });
    });

    it('return 500 & error if odin cdn is 404', async () => {
        fetchStub.withArgs('https://odincdn.adobe.com/testurl').returns(createResponse(404, {}, 'Not Found'));
        fetchStub.withArgs('https://odinorigin.adobe.com/testurl').returns(createResponse(200, ODIN_RESPONSE));
        fetchStub.withArgs('https://wcscdn.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));
        fetchStub.withArgs('https://wcsorigin.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));

        const response = await main(PARAMS);
        expect(response).to.deep.equal({
            statusCode: 500,
            body: {
                status: 'error',
                odinCDN: {
                    url: 'https://odincdn.adobe.com/testurl',
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
        fetchStub.withArgs('https://odincdn.adobe.com/testurl').returns(createResponse(200, ODIN_RESPONSE));
        fetchStub.withArgs('https://odinorigin.adobe.com/testurl').returns(createResponse(200, ODIN_RESPONSE));
        fetchStub.withArgs('https://wcscdn.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));
        fetchStub.withArgs('https://wcsorigin.adobe.com/testurl').returns(createResponse(503, {}, 'Service Unavailable'));

        const response = await main(PARAMS);
        expect(response).to.deep.equal({
            statusCode: 500,
            body: {
                status: 'error',
                odinCDN: 'ok',
                odinOrigin: 'ok',
                wcsCDN: 'ok',
                wcsOrigin: {
                    url: 'https://wcsorigin.adobe.com/testurl',
                    reason: '503 Service Unavailable',
                    status: 'fail',
                },
            },
        });
    });

    it('return 500 if any fetch error', async () => {
        fetchStub.withArgs('https://odincdn.adobe.com/testurl').rejects(new Error('fetch error'));
        fetchStub.withArgs('https://odinorigin.adobe.com/testurl').returns(createResponse(200, ODIN_RESPONSE));
        fetchStub.withArgs('https://wcscdn.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));
        fetchStub.withArgs('https://wcsorigin.adobe.com/testurl').returns(createResponse(200, WCS_RESPONSE));

        const response = await main(PARAMS);
        expect(response).to.deep.equal({
            statusCode: 500,
            body: {
                status: 'error',
                odinCDN: {
                    url: 'https://odincdn.adobe.com/testurl',
                    reason: 'fetch error',
                    status: 'fail',
                },
                odinOrigin: 'ok',
                wcsCDN: 'ok',
                wcsOrigin: 'ok',
            },
        });
    });
});
