const { expect } = require('chai');
const nock = require('nock');
const action = require('../../src/fragment/pipeline.js');
const mockDictionary = require('./replace.test.js').mockDictionary;
const COLLECTION_RESPONSE = require('./mocks/collection.json');

function setupFragmentMocks({ id, path, fields = {} }) {
    // Mock the initial fragment fetch
    nock('https://odin.adobe.com')
        .get(`/adobe/sites/fragments/${id}`)
        .reply(200, {
            path: `/content/dam/mas/drafts/en_US/${path}`,
            some: 'body',
        });

    // Mock the fragment lookup
    nock('https://odin.adobe.com')
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
            .get('/adobe/sites/fragments/test/variations/master/references')
            .query({ references: 'all-hydrated' })
            .reply(200, COLLECTION_RESPONSE);
        const result = await action.main({
            id: 'some-us-en-fragment',
            locale: 'fr_FR',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.have.property('fields');
        expect(result.body.fields).to.have.property('cards');
        expect(result.body.fields).to.have.property('categories');
        expect(result.body.fields.cards).to.be.an('object');
        expect(result.body.fields.categories).to.be.an('array');
        expect(result.body.fields.categories[0]).to.deep.equal({
            label: 'All',
            cards: [
                '7c87d1c4-d7fd-4370-b318-4cb2ebb4dd13',
                'aec092ef-d5b5-4271-8b6f-4bbd535fcc56',
            ],
        });
        expect(
            result.body.fields.cards['7c87d1c4-d7fd-4370-b318-4cb2ebb4dd13']
                ?.fields?.description?.value,
        ).to.be.a('string');
        expect(
            result.body.fields.cards['7c87d1c4-d7fd-4370-b318-4cb2ebb4dd13']
                .fields.description.value,
        ).to.equal(
            "<p><strong>i'm aon, with a price his is nicolas' card View account</strong></p>",
        );
    });
});

describe('pipeline corner cases', () => {
    beforeEach(() => {
        nock.cleanAll();
        mockDictionary();
    });

    it('main should be defined', () => {
        expect(action.main).to.be.a('function');
    });

    it('no arguments should return 400', async () => {
        const result = await action.main({});
        expect(result).to.deep.equal({
            message: 'requested parameters are not present',
            status: 400,
        });
    });

    it('should handle fetch exceptions', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test-fragment')
            .replyWithError('Network error');

        const result = await action.main({
            id: 'test-fragment',
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            status: 500,
            message: 'nok',
        });
    });

    it('should handle 404 response status', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test-fragment')
            .reply(404, {
                message: 'Fragment not found',
            });

        const result = await action.main({
            id: 'test-fragment',
            locale: 'fr_FR',
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

        // Mock the references fetch to fail
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test/variations/master/references')
            .query({ references: 'all-hydrated' })
            .replyWithError('Failed to fetch references');

        const result = await action.main({
            id: 'test-collection',
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            status: 500,
            message: 'unable to fetch references',
        });
    });
});
