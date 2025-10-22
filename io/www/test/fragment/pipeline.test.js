import { expect } from 'chai';
import nock from 'nock';
import { main as action, resetCache } from '../../src/fragment/pipeline.js';
import { mockDictionary } from './replace.test.js';
import zlib from 'zlib';
import sinon from 'sinon';

import FRAGMENT_RESPONSE_EN from './mocks/fragment-en-default.json' with { type: 'json' };
import FRAGMENT_RESPONSE_FR from './mocks/fragment-fr.json' with { type: 'json' };
import DICTIONARY_FOR_COLLECTION_RESPONSE from './mocks/dictionaryForCollection.json' with { type: 'json' };
import COLLECTION_RESPONSE from './mocks/collection.json' with { type: 'json' };
import { MockState } from './mocks/MockState.js';

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
    return decompress(await action(params));
}

const EXPECTED_HEADERS = {
    'Access-Control-Expose-Headers': 'X-Request-Id,Etag,Last-Modified,server-timing',
    'Content-Encoding': 'br',
    'Content-Type': 'application/json',
};

function setupFragmentMocks({ id, path, fields = {} }, preview = false) {
    // setup dictionary mocks
    mockDictionary(preview);

    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';
    // english fragment by id
    nock(odinDomain)
        .get(`${odinUriRoot}/some-en-us-fragment`)
        .query({ references: 'all-hydrated' })
        .reply(200, FRAGMENT_RESPONSE_EN)
        .persist();

    // french fragment by path
    nock(odinDomain)
        .get(`${odinUriRoot}`)
        .query({ path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app' })
        .reply(200, { items: [{ id: 'some-fr-fr-fragment' }] })
        .persist();
    // candadian french fragment by path
    nock(odinDomain)
        .get(`${odinUriRoot}`)
        .query({ path: '/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app' })
        .reply(200, {
            items: [],
        })
        .persist();
    // french fragment by id
    nock(odinDomain)
        .get(`${odinUriRoot}/some-fr-fr-fragment`)
        .query({ references: 'all-hydrated' })
        .reply(200, FRAGMENT_RESPONSE_FR)
        .persist();
}

const EXPECTED_BODY = {
    id: 'some-fr-fr-fragment',
    path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
};
//EXPECTED BODY SHA256 hash
const EXPECTED_BODY_HASH = '798aa27d44ff060fe2261cb1a873863ce8a9d6a989df13e9a0f6ec359b1c89e4';

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
    await state.put('configuration', JSON.stringify({ debugLogs: true }));
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
            fragmentsIds: {
                'dictionary-id': 'fr_FR_dictionary',
                'default-locale-id': 'some-fr-fr-fragment',
            },
            hash: EXPECTED_BODY_HASH,
        });
    });

    it('should return fully baked /content/dam/mas/sandbox/fr_FR/someFragment from preview too', async () => {
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
            fragmentsIds: {
                'dictionary-id': 'fr_FR_dictionary',
                'default-locale-id': 'some-fr-fr-fragment',
            },
            hash: EXPECTED_BODY_HASH,
        });
    });

    it('should detect already treated /content/dam/mas/sandbox/fr_FR/someFragment if not changed', async () => {
        const result = await runOnFilledState(
            JSON.stringify({
                fragmentsIds: {
                    'dictionary-id': 'fr_FR_dictionary',
                    'default-locale-id': 'some-fr-fr-fragment',
                },
                fragmentPath: 'someFragment',
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
        setupFragmentMocks({
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_CA/dictionary/index')
            .reply(404, {});
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_CA',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app',
            id: 'd99c359d-5349-43cc-95f4-8e388c299855',
        });
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers).to.have.property('ETag');
        expect(Object.keys(state.store).length).to.equal(1);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_CA');
        const json = JSON.parse(state.store['req-some-en-us-fragment-fr_CA']);
        expect(json.fragmentsIds['dictionary-id']).to.not.equal('fr_FR_dictionary');
        expect(json.fragmentsIds['default-locale-id']).to.equal('some-fr-fr-fragment');
    });

    it('should replace settings placeholders', async () => {
        const state = new MockState();
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/07f9729e-dc1f-4634-829d-7aa469bb0d33')
            .query({ references: 'all-hydrated' })
            .reply(200, COLLECTION_RESPONSE);
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/412fda08-7b73-4a01-a04f-1953e183bad2')
            .query({ references: 'all-hydrated' })
            .reply(200, DICTIONARY_FOR_COLLECTION_RESPONSE);
        state.put(
            'req-07f9729e-dc1f-4634-829d-7aa469bb0d33-en_US',
            '{"hash":"c4b6f3c040708c47444316d4e103268c8f2fb91c35dc4609ecccc29803f2aec0","lastModified":"Mon, 09 Jun 2025 07:43:58 GMT","fragmentsIds":{"dictionary-id":"412fda08-7b73-4a01-a04f-1953e183bad2"}}',
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

describe('pipeline corner cases', () => {
    beforeEach(() => {
        nock.cleanAll();
        mockDictionary();
        resetCache();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('action should be defined', () => {
        expect(action).to.be.a('function');
    });

    it('no arguments should return 400', async () => {
        const result = await getFragment({
            state: new MockState(),
        });
        expect(result).to.deep.equal({
            headers: EXPECTED_HEADERS,
            body: {
                message: 'requested parameters id & locale are not present',
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
        state.put('configuration', '{"networkConfig":{"fetchTimeout":20,"retries":1,"retryDelay":1}}');
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
        state.put('configuration', '{"networkConfig":{"retries": 2, "retryDelay": 1}}');
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
        state.put('configuration', '{"networkConfig":{"mainTimeout":3,"retries": 1}}');
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(504);
        expect(result.message).to.equal('Fragment pipeline timed out');
    });

    it('should handle 404 response status', async () => {
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
                fragmentsIds: {
                    'dictionary-id': 'fr_FR_dictionary',
                    'default-locale-id': 'some-fr-fr-fragment',
                },
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

describe('configuration caching', () => {
    beforeEach(() => {
        nock.cleanAll();
        resetCache();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should cache configuration and reuse it on subsequent requests', async () => {
        setupFragmentMocks({
            id: 'some-en-us-fragment',
            path: 'someFragment',
            fields: {
                description: 'corps',
                cta: '{{buy-now}}',
            },
        });

        const state = new MockState();
        await state.put('configuration', JSON.stringify({ debugLogs: true }));
        const stateGetSpy = sinon.spy(state, 'get');

        const result1 = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });
        expect(result1.statusCode).to.equal(200);

        setupFragmentMocks({
            id: 'some-en-us-fragment',
            path: 'someFragment',
            fields: {
                description: 'corps',
                cta: '{{buy-now}}',
            },
        });

        const result2 = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });
        expect(result2.statusCode).to.equal(200);
        expect(result1.body).to.deep.equal(result2.body);

        let configCalls = stateGetSpy.getCalls().filter((call) => call.args[0] === 'configuration');
        expect(configCalls).to.have.length(1);

        const performanceStub = sinon.stub(performance, 'now');
        performanceStub.returns(5 * 60 * 1000 + 1000);

        setupFragmentMocks({
            id: 'some-en-us-fragment',
            path: 'someFragment',
            fields: {
                description: 'corps',
                cta: '{{buy-now}}',
            },
        });

        const result3 = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });
        expect(result3.statusCode).to.equal(200);

        configCalls = stateGetSpy.getCalls().filter((call) => call.args[0] === 'configuration');
        expect(configCalls).to.have.length(2);

        performanceStub.restore();
        stateGetSpy.restore();
    });
});
