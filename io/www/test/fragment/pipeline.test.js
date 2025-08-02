const { expect } = require('chai');
const nock = require('nock');
const action = require('../../src/fragment/pipeline.js');
const mockDictionary = require('./replace.test.js').mockDictionary;
const zlib = require('zlib');

const FRAGMENT_RESPONSE_EN = require('./mocks/fragment.json');
const FRAGMENT_RESPONSE_FR = require('./mocks/fragment-fr.json');

const { MockState } = require('./mocks/MockState.js');

function decompress(response) {
    const body =
        response.body?.length > 0
            ? JSON.parse(zlib.brotliDecompressSync(Buffer.from(response.body, 'base64')).toString('utf-8'))
            : undefined;
    return {
        ...response,
        body,
    };
}

async function getFragment(params) {
    return decompress(await action.main(params));
}

const EXPECTED_HEADERS = {
    'Access-Control-Expose-Headers': 'X-Request-Id,Etag,Last-Modified,server-timing',
    'Content-Encoding': 'br',
    'Content-Type': 'application/json',
};

function setupFragmentMocks({ id, path, fields = {} }, preview = false) {
    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';
    // english fragment by id
    nock(odinDomain).get(`${odinUriRoot}/some-en-us-fragment?references=all-hydrated`).reply(200, FRAGMENT_RESPONSE_EN);

    // french fragment by path
    nock(odinDomain)
        .get(`${odinUriRoot}?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app`)
        .reply(200, {
            items: [
                {
                    id: 'some-fr-fr-fragment',
                },
            ],
        });
    // candadian french fragment by path
    nock(odinDomain).get(`${odinUriRoot}?path=/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app`).reply(200, {
        items: [],
    });
    // french fragment by id
    nock(odinDomain).get(`${odinUriRoot}/some-fr-fr-fragment?references=all-hydrated`).reply(200, FRAGMENT_RESPONSE_FR);

    // dictionary by id
    nock(odinDomain).get(`${odinUriRoot}/dictionary?references=all-hydrated`).reply(200, mockDictionary());
}

const EXPECTED_BODY = {
    id: 'some-fr-fr-fragment',
    path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
};
//EXPECTED BODY SHA256 hash
const EXPECTED_BODY_HASH = '54155ef064f4d37a6797c394f1a6352833d94ce02d1d829c813f84c4b8783f09';

const RANDOM_OLD_DATE = 'Thu, 27 Jul 1978 09:00:00 GMT';

const runOnFilledState = async (entry, headers) => {
    setupFragmentMocks({
        id: 'some-en-us-fragment',
        path: 'someFragment',
        fields: {
            description: 'corps',
            cta: '{{buy-now}}',
        },
    });
    const state = new MockState();
    await state.put('req-some-en-us-fragment-fr_FR', entry);
    await state.put('debugFragmentLogs', true);
    return await getFragment({
        id: 'some-en-us-fragment',
        state,
        locale: 'fr_FR',
        __ow_headers: headers,
    });
};

describe('pipeline full use case', () => {
    beforeEach(() => {
        nock.cleanAll();
        mockDictionary();
    });

    it('should return fully baked /content/dam/mas/sandbox/fr_FR/someFragment', async () => {
        setupFragmentMocks({
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers).to.have.property('ETag');
        expect(result.headers['ETag']).to.equal(EXPECTED_BODY_HASH);
        expect(Object.keys(state.store).length).to.equal(1);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_FR');
        const json = JSON.parse(state.store['req-some-en-us-fragment-fr_FR']);
        delete json.lastModified; // removing the date to avoid flakiness
        expect(json).to.deep.include({
            dictionaryId: 'fr_FR_dictionary',
            translatedId: 'some-fr-fr-fragment',
            hash: EXPECTED_BODY_HASH,
        });
    });

    it('should return fully baked /content/dam/mas/sandbox/fr_FR/someFragment from preview too', async () => {
        mockDictionary(true);
        setupFragmentMocks(
            {
                id: 'some-en-us-fragment',
                path: 'someFragment',
            },
            true,
        );
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            preview: {
                url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
            },
            state: state,
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers).to.have.property('ETag');
        expect(result.headers['ETag']).to.equal(EXPECTED_BODY_HASH);
        expect(Object.keys(state.store).length).to.equal(1);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_FR');
        const json = JSON.parse(state.store['req-some-en-us-fragment-fr_FR']);
        delete json.lastModified; // removing the date to avoid flakiness
        expect(json).to.deep.include({
            dictionaryId: 'fr_FR_dictionary',
            translatedId: 'some-fr-fr-fragment',
            hash: EXPECTED_BODY_HASH,
        });
    });

    it('should detect already treated /content/dam/mas/sandbox/fr_FR/someFragment if not changed', async () => {
        const result = await runOnFilledState(
            JSON.stringify({
                dictionaryId: 'fr_FR_dictionary',
                translatedId: 'some-fr-fr-fragment',
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

    it('should return fully baked /content/dam/mas/sandbox/fr_FR/someFragment from fr_CA locale request', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_CA/dictionary/index')
            .reply(404, {});
        setupFragmentMocks({
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_CA',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers).to.have.property('ETag');
        expect(Object.keys(state.store).length).to.equal(1);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_CA');
        const json = JSON.parse(state.store['req-some-en-us-fragment-fr_CA']);
        //we should not have translatedId as there is no guarantee it stays that way
        expect(json.dictionaryId).to.not.equal('fr_FR_dictionary');
        expect(json).to.not.have.property('translatedId');
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
        const result = await getFragment({
            state: new MockState(),
        });
        expect(result).to.deep.equal({
            headers: EXPECTED_HEADERS,
            body: {
                message: 'requested parameters are not present',
            },
            statusCode: 400,
        });
    });

    it('should handle fetch timeouts', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test-fragment?references=all-hydrated')
            .delay(50)
            .reply(200, {});

        const state = new MockState();
        state.put('network-config', '{"fetchTimeout":20,"retries":1,"retryDelay":1}');
        const result = await getFragment({
            id: 'test-fragment',
            state,
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            statusCode: 504,
            headers: EXPECTED_HEADERS,
            body: {
                message: 'fetch timeout',
            },
        });
    });

    it('should handle fetch exceptions', async () => {
        nock('https://odin.adobe.com').get('/adobe/sites/fragments/test-fragment').replyWithError('Network error');
        const state = new MockState();
        state.put('network-config', '{"retries": 2, "retryDelay": 1}');

        const result = await getFragment({
            id: 'test-fragment',
            state,
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            statusCode: 503,
            headers: EXPECTED_HEADERS,
            body: {
                message: 'fetch error',
            },
        });
    });

    it('should handle main timeout', async () => {
        setupFragmentMocks({
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const state = new MockState();
        state.put('network-config', '{"mainTimeout":3,"retries": 1}');
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(504);
        expect(result.message).to.equal('Request timed out');
    });

    it('should handle 404 response status', async () => {
        nock('https://odin.adobe.com').get('/adobe/sites/fragments/test-fragment').reply(404, {
            message: 'Fragment not found',
        });

        // Also mock the request with references=all-hydrated parameter
        nock('https://odin.adobe.com').get('/adobe/sites/fragments/test-fragment?references=all-hydrated').reply(404, {
            message: 'Fragment not found',
        });

        const result = await getFragment({
            id: 'test-fragment',
            state: new MockState(),
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            statusCode: 404,
            headers: EXPECTED_HEADERS,
            body: {
                message: 'nok',
            },
        });
    });

    it('should manage ignore old if-modified', async () => {
        const result = await runOnFilledState(
            JSON.stringify({
                dictionaryId: 'fr_FR_dictionary',
                translatedId: 'some-fr-fr-fragment',
                lastModified: 'Tue, 21 Nov 2024 08:00:00 GMT',
                hash: EXPECTED_BODY_HASH,
            }),
            {
                'if-modified-since': RANDOM_OLD_DATE,
            },
        );
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });

    it('should manage same etag with no lastmodified', async () => {
        const result = await runOnFilledState(
            JSON.stringify({
                dictionaryId: 'fr_FR_dictionary',
                translatedId: 'some-fr-fr-fragment',
                hash: EXPECTED_BODY_HASH,
            }),
            {
                'if-modified-since': RANDOM_OLD_DATE,
            },
        );
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });

    it('should manage bad cache entry', async () => {
        const result = await runOnFilledState('undefined', {});
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });

    it('should manage null cache entry', async () => {
        const result = await runOnFilledState('null', {});
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });
});

describe('collection placeholders', () => {
    it('should work', async () => {
        nock.cleanAll();
        const DICTIONARY_RESPONSE = require('./mocks/dictionaryForCollection.json');
        const COLLECTION_RESPONSE = require('./mocks/collection.json');
        const state = new MockState();
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/07f9729e-dc1f-4634-829d-7aa469bb0d33')
            .query({ references: 'all-hydrated' })
            .reply(200, COLLECTION_RESPONSE);
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/412fda08-7b73-4a01-a04f-1953e183bad2')
            .query({ references: 'all-hydrated' })
            .reply(200, DICTIONARY_RESPONSE);
        state.put(
            'req-07f9729e-dc1f-4634-829d-7aa469bb0d33-en_US',
            '{"hash":"c4b6f3c040708c47444316d4e103268c8f2fb91c35dc4609ecccc29803f2aec0","lastModified":"Mon, 09 Jun 2025 07:43:58 GMT","dictionaryId":"412fda08-7b73-4a01-a04f-1953e183bad2"}',
        );
        const result = await getFragment({
            id: '07f9729e-dc1f-4634-829d-7aa469bb0d33',
            state,
            locale: 'en_US',
        });
        expect(result.body.placeholders.searchResultsMobileText).to.equal(
            '<p><span data-placeholder="resultCount"></span>&nbsp;results in&nbsp;<strong><span data-placeholder="searchTerm"></span></strong></p>',
        );
    });
});
