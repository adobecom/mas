const { expect } = require('chai');
const nock = require('nock');
const { main } = require('../src/dictionary/dictionary');
const sinon = require('sinon');
const { Ims } = require('@adobe/aio-lib-ims');

const FRAGMENT_AUTHOR_URL_PREFIX =
    'https://author-p22655-e59433.adobeaemcloud.com/adobe/sites/cf/fragments'; // Mock URL
const MOCK_TOKEN = 'mocked-token';

describe('main function', function () {
    beforeEach(() => {
        sinon.stub(Ims.prototype, 'validateToken').resolves({ valid: true });
        nock.cleanAll();
    });
    afterEach(() => {
        sinon.restore();
    });

    it('should return 401 if no token is provided', async function () {
        const result = await main({ __ow_headers: {}, id: 'test-fragment' });
        expect(result).to.deep.equal({
            statusCode: 401,
            body: 'Unauthorized: Bearer token is missing or invalid',
        });
    });

    it("should return 400 if 'id' is missing", async function () {
        const result = await main({
            __ow_headers: { authorization: `Bearer ${MOCK_TOKEN}` },
        });
        expect(result).to.deep.equal({
            statusCode: 400,
            body: 'Missing required parameter: id',
        });
    });

    it.only('should return 200 with dictionary data', async function () {
        const mockFragmentId = 'test-fragment';
        const mockLocale = 'en-US';
        const mockSurface = 'some-surface';
        const mockDictionaryID = 'dictionary-123';

        nock(FRAGMENT_AUTHOR_URL_PREFIX)
            .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
            .get(`/${mockFragmentId}`)
            .reply(200, {
                path: `/content/dam/mas/${mockSurface}/${mockLocale}/some-fragment`,
            });

        nock(FRAGMENT_AUTHOR_URL_PREFIX)
            .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
            .get('')
            .query({
                path: `/content/dam/mas/${mockSurface}/${mockLocale}/dictionary/index`,
            })
            .reply(200, {
                items: [{ id: mockDictionaryID }],
            });

        nock(FRAGMENT_AUTHOR_URL_PREFIX)
            .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
            .get('/search')
            .query(true)
            .reply(200, {
                items: [
                    {
                        fields: [
                            { name: 'key', values: ['view-account'] },
                            { name: 'value', values: ['View account'] },
                        ],
                    },
                ],
            });

        console.log('Is nock pending:', nock.pendingMocks());

        const result = await main({
            __ow_headers: { authorization: `Bearer ${MOCK_TOKEN}` },
            id: mockFragmentId,
            locale: mockLocale,
        });

        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.equal({ 'view-account': 'View Account' });
    });

    it('should return 404 if dictionary ID is not found', async function () {
        const mockFragmentId = 'test-fragment';
        const mockLocale = 'en-US';
        const mockSurface = 'some-surface';

        nock(FRAGMENT_AUTHOR_URL_PREFIX)
            .get(`/${mockFragmentId}`)
            .reply(200, {
                path: `/content/dam/mas/${mockSurface}/${mockLocale}/some-fragment`,
            });

        // Mock dictionary ID request (returning no dictionary ID)
        nock(FRAGMENT_AUTHOR_URL_PREFIX)
            .get('')
            .query({
                path: `/content/dam/mas/${mockSurface}/${mockLocale}/dictionary/index`,
            })
            .reply(200, { items: [] });

        const result = await main({
            __ow_headers: { authorization: `Bearer ${MOCK_TOKEN}` },
            id: mockFragmentId,
            locale: mockLocale,
        });

        expect(result.statusCode).to.equal(404);
        expect(result.body).to.equal(
            'Dictionary not found or failed to retrieve entries',
        );
    });
});
