const { expect } = require('chai');
const nock = require('nock');
const action = require('../../src/fragment/pipeline.js');
const mockDictionary = require('./replace.test.js').mockDictionary;
const COLLECTION_RESPONSE = require('./mocks/collection.json');
const { MockState } = require('./mocks/MockState.js');

function setupFragmentMocks({ id, path, fields = {} }) {
    // Mock the initial fragment fetch
    nock('https://odin.adobe.com')
        .get(`/adobe/sites/fragments/${id}`)
        .reply(200, {
            path: `/content/dam/mas/drafts/en_US/${path}`,
            some: 'body',
        });

    const frenchObject = () => ({
        id: 'test',
        path: `/content/dam/mas/drafts/fr_FR/${path}`,
        fields: {
            description: 'test description',
            ...fields,
        },
    });
    // Mock the fragment lookup
    nock('https://odin.adobe.com')
        .get('/adobe/sites/fragments')
        .query({
            path: `/content/dam/mas/drafts/fr_FR/${path}`,
        })
        .reply(200, { items: [frenchObject()] });
    // Mock same fragment lookup, but with id
    nock('https://odin.adobe.com')
        .get('/adobe/sites/fragments/test')
        .reply(200, frenchObject());
}

const EXPECTED_BODY = {
    id: 'test',
    path: '/content/dam/mas/drafts/fr_FR/someFragment',
    fields: {
        description: 'corps',
        cta: 'Buy now',
    },
};
//EXPECTED BODY SHA256 hash
const EXPECTED_BODY_HASH =
    '9f420496ba3f9deb54f8c9d230fefbc6a8d22d24cb4bf3441a50764ea4473e5d';

const RANDOM_OLD_DATE = 'Thu, 27 Jul 1978 09:00:00 GMT';

const runOnFilledState = async (entry, headers) => {
    setupFragmentMocks({
        id: 'some-us-en-fragment',
        path: 'someFragment',
        fields: {
            description: 'corps',
            cta: '{{buy-now}}',
        },
    });
    const state = new MockState();
    state.put('req-some-us-en-fragment-fr_FR', entry);
    return await action.main({
        id: 'some-us-en-fragment',
        state: state,
        locale: 'fr_FR',
        __ow_headers: headers,
    });
};

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
        const state = new MockState();
        const result = await action.main({
            id: 'some-us-en-fragment',
            state: state,
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.equal(EXPECTED_BODY);
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers).to.have.property('ETag');
        expect(result.headers['ETag']).to.equal(EXPECTED_BODY_HASH);
        expect(Object.keys(state.store).length).to.equal(1);
        console.log(JSON.stringify(state.store));
        expect(state.store).to.have.property('req-some-us-en-fragment-fr_FR');
        const json = JSON.parse(state.store['req-some-us-en-fragment-fr_FR']);
        delete json.lastModified; // removing the date to avoid flakiness
        expect(json).to.deep.equal({
            dictionaryId: 'fr_FR_dictionary',
            translatedId: 'test',
            hash: EXPECTED_BODY_HASH,
        });
    });

    it('should detect already treated /content/dam/mas/drafts/fr_FR/someFragment if not changed', async () => {
        const result = await runOnFilledState(
            JSON.stringify({
                dictionaryId: 'fr_FR_dictionary',
                translatedId: 'test',
                lastModified: RANDOM_OLD_DATE,
                hash: EXPECTED_BODY_HASH,
            }),
            {
                'if-modified-since': 'Tue, 21 Nov 2050 08:00:00 GMT',
            },
        );
        expect(result.body).to.be.undefined;
        expect(result.statusCode).to.equal(304);
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers['Last-Modified']).to.equal(RANDOM_OLD_DATE);
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
            state: new MockState(),
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(200);
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
        const result = await action.main({
            state: new MockState(),
        });
        expect(result).to.deep.equal({
            message: 'requested parameters are not present',
            statusCode: 400,
        });
    });

    it('should handle fetch exceptions', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test-fragment')
            .replyWithError('Network error');

        const result = await action.main({
            id: 'test-fragment',
            state: new MockState(),
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            statusCode: 500,
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
            state: new MockState(),
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            statusCode: 404,
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
            state: new MockState(),
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            statusCode: 500,
            message: 'unable to fetch references',
        });
    });

    it('should manage ignore old if-modified', async () => {
        const result = await runOnFilledState(
            JSON.stringify({
                dictionaryId: 'fr_FR_dictionary',
                translatedId: 'test',
                lastModified: 'Tue, 21 Nov 2024 08:00:00 GMT',
                hash: EXPECTED_BODY_HASH,
            }),
            {
                'if-modified-since': RANDOM_OLD_DATE,
            },
        );
        expect(result.body).to.deep.equal(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });

    it('should manage same etag with no lastmodified', async () => {
        const result = await runOnFilledState(
            JSON.stringify({
                dictionaryId: 'fr_FR_dictionary',
                translatedId: 'test',
                hash: EXPECTED_BODY_HASH,
            }),
            {
                'if-modified-since': RANDOM_OLD_DATE,
            },
        );
        expect(result.body).to.deep.equal(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });

    it('should manage bad cache entry', async () => {
        const result = await runOnFilledState('undefined', {});
        expect(result.body).to.deep.equal(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });

    it('should manage null cache entry', async () => {
        const result = await runOnFilledState('null', {});
        expect(result.body).to.deep.equal(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });
});
