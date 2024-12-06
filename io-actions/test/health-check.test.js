/* ***********************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright 2024 Adobe
 * All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 ************************************************************************* */

jest.mock('node-fetch');
const fetch = require('node-fetch');
const action = require('./../src/health-check/index.js');
const ODIN_RESPONSE = {
    ok: true,
    json: () =>
        Promise.resolve({
            path: '/content/dam/mas/nala/ccd/slice-cc-allapps31211',
            id: '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
            fields: { variant: 'ccd-slice' },
        }),
};
const WCS_RESPONSE = {
    ok: true,
    json: () =>
        Promise.resolve({
            resolvedOffers: [
                {
                    offerSelectorIds: [
                        'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                    ],
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
        }),
};

const PARAMS = {
    ODIN_CDN_ENDPOINT: 'https://odincdn/testurl',
    ODIN_ORIGIN_ENDPOINT: 'https://odinorigin/testurl',
    WCS_CDN_ENDPOINT: 'https://wcscdn/testurl',
    WCS_ORIGIN_ENDPOINT: 'https://wcsorigin/testurl',
};

describe('health-check', () => {
    test('main should be defined', () => {
        expect(action.main).toBeInstanceOf(Function);
    });

    test('return 200 & success status if odin & wcs are valid', async () => {
        fetch.mockResolvedValueOnce(ODIN_RESPONSE);
        fetch.mockResolvedValueOnce(ODIN_RESPONSE);
        fetch.mockResolvedValueOnce(WCS_RESPONSE);
        fetch.mockResolvedValueOnce(WCS_RESPONSE);
        const response = await action.main(PARAMS);
        expect(response).toEqual({
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

    test('return 500 & error if odin json is not valid (no fields object)', async () => {
        const odininvalidJson = {
            ok: true,
            json: () =>
                Promise.resolve({
                    path: '/content/dam/mas/nala/ccd/slice-cc-allapps31211',
                    id: '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
                }),
        };
        fetch.mockResolvedValueOnce(ODIN_RESPONSE);
        fetch.mockResolvedValueOnce(odininvalidJson);
        fetch.mockResolvedValueOnce(WCS_RESPONSE);
        fetch.mockResolvedValueOnce(WCS_RESPONSE);
        const response = await action.main(PARAMS);
        expect(response).toEqual({
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

    test('return 500 & error if odin cdn is 404', async () => {
        const odinErrorResponse = {
            ok: false,
            status: 404,
            statusText: 'Not found',
            json: () => Promise.resolve({}),
        };
        fetch.mockResolvedValueOnce(odinErrorResponse);
        fetch.mockResolvedValueOnce(ODIN_RESPONSE);
        fetch.mockResolvedValueOnce(WCS_RESPONSE);
        fetch.mockResolvedValueOnce(WCS_RESPONSE);
        const response = await action.main(PARAMS);
        expect(response).toEqual({
            statusCode: 500,
            body: {
                status: 'error',
                odinCDN: {
                    url: 'https://odincdn/testurl',
                    reason: '404 Not found',
                    status: 'fail',
                },
                odinOrigin: 'ok',
                wcsCDN: 'ok',
                wcsOrigin: 'ok',
            },
        });
    });

    test('return 500 & error if WCS is 503', async () => {
        const wcsErrorResponse = {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            json: () => Promise.resolve({}),
        };
        fetch.mockResolvedValueOnce(ODIN_RESPONSE);
        fetch.mockResolvedValueOnce(ODIN_RESPONSE);
        fetch.mockResolvedValueOnce(WCS_RESPONSE);
        fetch.mockResolvedValueOnce(wcsErrorResponse);
        const response = await action.main(PARAMS);
        expect(response).toEqual({
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
