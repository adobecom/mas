const { expect } = require('chai');
const nock = require('nock');
const action = require('../../src/fragment/pipeline.js');
const mockDictionary = require('./replace.test.js').mockDictionary;
const COLLECTION_RESPONSE = require('./mocks/collection.json');

const FRAGMENT_AUTHOR_URL_PREFIX =
    'https://author-p22655-e59433.adobeaemcloud.com/adobe/sites/cf/fragments'; // Mock URL
const MOCK_TOKEN = 'mocked-token';

function setupFragmentMocks({ id, path, fields = {} }) {
    nock(FRAGMENT_AUTHOR_URL_PREFIX)
        .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
        .get(`/adobe/sites/fragments/${id}`)
        .reply(200, {
            path: `/content/dam/mas/drafts/en_US/${path}`,
            some: 'body',
        });

    nock(FRAGMENT_AUTHOR_URL_PREFIX)
        .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
        .get('/adobe/sites/fragments')
        .query({
            path: `/content/dam/mas/drafts/fr_FR/${path}`,
        })
        .reply(200, {
            items: [
                {
                    id: 'test',
                    path: `/content/dam/mas/drafts/fr_FR/${path}`,
                    fields: {
                        description: 'test description',
                        ...fields,
                    },
                },
            ],
        });
}

describe('pipeline full use case', () => {
    beforeEach(() => {
        nock.cleanAll();
        mockDictionary();
    });

    it('should return fully baked /content/dam/mas/drafts/fr_FR/someFragment', async () => {
        setupFragmentMocks({
            id: 'some-us-en-fragment',
            path: 'someFragment',
            fields: {
                description: 'corps',
                cta: '{{buy-now}}',
            },
        });

        const result = await action.main({
            id: 'some-us-en-fragment',
            locale: 'fr_FR',
            __ow_headers: { authorization: `Bearer ${MOCK_TOKEN}` }, // Pass the token in test input
        });

        expect(result).to.deep.equal({
            status: 200,
            body: {
                id: 'test',
                path: '/content/dam/mas/drafts/fr_FR/someFragment',
                fields: {
                    description: 'corps',
                    cta: 'Buy now',
                },
            },
        });
    });

    it('should return fully baked /content/dam/mas/drafts/fr_FR/collections/plans-individual', async () => {
        setupFragmentMocks({
            id: 'some-us-en-fragment',
            path: 'collections/someFragment',
            fields: {
                description: 'corps',
                cta: '{{buy-now}}',
                categories: ['a', 'b', 'c'],
            },
        });

        nock('https://odin.adobe.com')
            .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
            .get('/adobe/sites/fragments/test/variations/master/references')
            .query({ references: 'all-hydrated' })
            .reply(200, COLLECTION_RESPONSE);

        const result = await action.main({
            id: 'some-us-en-fragment',
            locale: 'fr_FR',
            __ow_headers: { authorization: `Bearer ${MOCK_TOKEN}` },
        });

        expect(result.status).to.equal(200);
        expect(result.body).to.have.property('fields');
        expect(result.body.fields).to.have.property('cards');
        expect(result.body.fields).to.have.property('categories');
        expect(result.body.fields.cards).to.be.an('object');
        expect(result.body.fields.categories).to.be.an('array');
    });
});

// Apply token for corner case tests as well
describe('pipeline corner cases', () => {
    beforeEach(() => {
        nock.cleanAll();
        mockDictionary();
    });

    it('no arguments should return 400', async () => {
        const result = await action.main({});
        expect(result).to.deep.equal({
            message: 'requested parameters are not present',
            status: 400,
        });
    });

    it('should handle fetch exceptions', async () => {
        nock(FRAGMENT_AUTHOR_URL_PREFIX)
            .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
            .get('/adobe/sites/fragments/test-fragment')
            .replyWithError('Network error');

        const result = await action.main({
            id: 'test-fragment',
            locale: 'fr_FR',
            __ow_headers: { authorization: `Bearer ${MOCK_TOKEN}` },
        });

        expect(result).to.deep.equal({
            status: 500,
            message: 'nok',
        });
    });

    it('should handle 404 response status', async () => {
        nock(FRAGMENT_AUTHOR_URL_PREFIX)
            .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
            .get('/adobe/sites/fragments/test-fragment')
            .reply(404, {
                message: 'Fragment not found',
            });

        const result = await action.main({
            id: 'test-fragment',
            locale: 'fr_FR',
            __ow_headers: { authorization: `Bearer ${MOCK_TOKEN}` },
        });

        expect(result).to.deep.equal({
            status: 404,
            message: 'nok',
        });
    });

    it('should handle collection references fetch error', async () => {
        setupFragmentMocks({
            id: 'test-collection',
            path: 'collections/test-collection',
            fields: {
                categories: ['a', 'b', 'c'],
            },
        });

        nock(FRAGMENT_AUTHOR_URL_PREFIX)
            .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
            .get('/adobe/sites/fragments/test/variations/master/references')
            .query({ references: 'all-hydrated' })
            .replyWithError('Failed to fetch references');

        const result = await action.main({
            id: 'test-collection',
            locale: 'fr_FR',
            __ow_headers: { authorization: `Bearer ${MOCK_TOKEN}` },
        });

        expect(result).to.deep.equal({
            status: 500,
            message: 'unable to fetch references',
        });
    });
});
