import { expect } from 'chai';
import sinon from 'sinon';
import { main as action, resetCache } from '../../src/fragment/pipeline.js';
import { mockDictionary } from './replace.test.js';
import DICTIONARY_RESPONSE from './mocks/dictionary.json' with { type: 'json' };
import zlib from 'zlib';

import FRAGMENT_RESPONSE_EN from './mocks/fragment-en-default.json' with { type: 'json' };
import FRAGMENT_RESPONSE_FR from './mocks/fragment-fr.json' with { type: 'json' };
import DICTIONARY_FOR_COLLECTION_RESPONSE from './mocks/dictionaryForCollection.json' with { type: 'json' };
import COLLECTION_RESPONSE from './mocks/collection.json' with { type: 'json' };
import FRAGMENT_AH_DE_DE_CORRUPTED from './mocks/fragment-ah-de_DE-corrupted.json' with { type: 'json' };
import { MockState } from './mocks/MockState.js';
import { createResponse } from './mocks/MockFetch.js';

let fetchStub;

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
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
};

function setupFragmentMocks(fetchStub, { id, path, fields = {} }, preview = false) {
    // setup dictionary mocks
    mockDictionary(preview, fetchStub);

    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';
    // english fragment by id
    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}/some-en-us-fragment?references=all-hydrated`)
        .returns(createResponse(200, FRAGMENT_RESPONSE_EN));

    // french fragment by path
    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app`)
        .returns(createResponse(200, { items: [{ id: 'some-fr-fr-fragment' }] }));

    // candadian french fragment by path
    fetchStub.withArgs(`${odinDomain}${odinUriRoot}?path=/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app`).returns(
        createResponse(200, {
            items: [],
        }),
    );

    // french fragment by id
    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}/some-fr-fr-fragment?references=all-hydrated`)
        .returns(createResponse(200, FRAGMENT_RESPONSE_FR));
}

const EXPECTED_BODY = {
    id: 'some-fr-fr-fragment',
    path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
};
//EXPECTED BODY SHA256 hash
const EXPECTED_BODY_HASH = 'e40a8c822bb0e6fd5ef462ee327d1e9240aa74219ec67d8da63ca15aa7250de9';

const RANDOM_OLD_DATE = 'Thu, 27 Jul 1978 09:00:00 GMT';

const runOnFilledState = async (fetchStub, entry, headers) => {
    setupFragmentMocks(fetchStub, {
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
        fetchStub = sinon.stub(globalThis, 'fetch');
        mockDictionary(false, fetchStub);
        resetCache();
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('should return fully baked /content/dam/mas/sandbox/fr_FR/someFragment', async () => {
        setupFragmentMocks(fetchStub, {
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
            fetchStub,
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
            fetchStub,
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
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_CA/dictionary/index')
            .returns(createResponse(404, {}, 'Not Found'));
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

    it('should fix corrupted data-extra-options in adobe-home fragment', async () => {
        const fragmentId = '8ede258f-a996-43c4-8525-b52543925ab0';

        // Mock the fragment fetch
        fetchStub
            .withArgs(`https://odin.adobe.com/adobe/sites/fragments/${fragmentId}?references=all-hydrated`)
            .returns(createResponse(200, FRAGMENT_AH_DE_DE_CORRUPTED));

        // Mock dictionary for adobe-home de_DE (note the path structure matches adobe-home)
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/adobe-home/de_DE/dictionary/index')
            .returns(
                createResponse(200, {
                    items: [
                        {
                            id: 'de_DE_dictionary',
                        },
                    ],
                }),
            );

        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments/de_DE_dictionary?references=all-hydrated')
            .returns(createResponse(200, DICTIONARY_RESPONSE));

        const state = new MockState();
        const result = await getFragment({
            id: fragmentId,
            state: state,
            locale: 'de_DE',
            surface: 'adobe-home',
        });

        expect(result.statusCode).to.equal(200);
        expect(result.body.fields.ctas.value).to.include(
            'data-extra-options="{&quot;actionId&quot;:&quot;try&quot;,&quot;ctx&quot;:&quot;if&quot;}"',
        );
        expect(result.body.fields.ctas.value).to.include(
            'data-extra-options="{&quot;actionId&quot;:&quot;buy&quot;,&quot;ctx&quot;:&quot;if&quot;}"',
        );
        expect(result.body.fields.ctas.value).to.not.include('\\"actionId\\"');
    });
});

describe('collection placeholders', () => {
    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('should work', async () => {
        const state = new MockState();
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/sites/fragments/07f9729e-dc1f-4634-829d-7aa469bb0d33?references=all-hydrated',
            )
            .returns(createResponse(200, COLLECTION_RESPONSE));
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/sites/fragments/412fda08-7b73-4a01-a04f-1953e183bad2?references=all-hydrated',
            )
            .returns(createResponse(200, DICTIONARY_FOR_COLLECTION_RESPONSE));
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
        fetchStub = sinon.stub(globalThis, 'fetch');
        mockDictionary(false, fetchStub);
        resetCache();
    });

    afterEach(() => {
        fetchStub.restore();
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

    it('bad path should return 400', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments/some-fr-fr-fragment?references=all-hydrated')
            .returns(createResponse(200, { path: '/content/bad-path' }));
        const state = new MockState();
        await state.put(
            'req-some-en-us-fragment-fr_FR',
            JSON.stringify({
                fragmentsIds: {
                    'dictionary-id': 'fr_FR_dictionary',
                    'default-locale-id': 'some-fr-fr-fragment',
                },
                lastModified: 'Tue, 21 Nov 2024 08:00:00 GMT',
                hash: EXPECTED_BODY_HASH,
            }),
        );
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            headers: EXPECTED_HEADERS,
            body: {
                message: 'source path is either not here or invalid',
            },
            statusCode: 400,
        });
    });

    it('should handle fetch timeouts', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments/test-fragment?references=all-hydrated')
            .returns(new Promise((resolve) => setTimeout(() => resolve(createResponse(200, {})), 50)));

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
        fetchStub.withArgs(sinon.match(/adobe\/sites\/fragments\/test-fragment/)).rejects(new Error('Network error'));
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
        // Mock dictionary with a delay to ensure timeout fires
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
            .returns(
                new Promise((resolve) =>
                    setTimeout(() => resolve(createResponse(200, { items: [{ id: 'fr_FR_dictionary' }] })), 50),
                ),
            );

        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments/fr_FR_dictionary?references=all-hydrated')
            .returns(createResponse(200, DICTIONARY_RESPONSE));

        const odinDomain = 'https://odin.adobe.com';
        const odinUriRoot = '/adobe/sites/fragments';

        // Setup other fragment mocks
        fetchStub
            .withArgs(`${odinDomain}${odinUriRoot}/some-en-us-fragment?references=all-hydrated`)
            .returns(createResponse(200, FRAGMENT_RESPONSE_EN));

        fetchStub
            .withArgs(`${odinDomain}${odinUriRoot}?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app`)
            .returns(createResponse(200, { items: [{ id: 'some-fr-fr-fragment' }] }));

        fetchStub
            .withArgs(`${odinDomain}${odinUriRoot}/some-fr-fr-fragment?references=all-hydrated`)
            .returns(createResponse(200, FRAGMENT_RESPONSE_FR));

        const state = new MockState();
        state.put('configuration', '{"networkConfig":{"mainTimeout":10,"retries": 1}}');
        const result = await action({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(504);
        expect(result.message).to.equal('Fragment pipeline timed out');
    });

    it('should handle 404 response status', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments/test-fragment?references=all-hydrated')
            .returns(createResponse(404, null, 'Not Found'));

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
            fetchStub,
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
            fetchStub,
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
        const result = await runOnFilledState(fetchStub, 'undefined', {});
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });

    it('should manage null cache entry', async () => {
        const result = await runOnFilledState(fetchStub, 'null', {});
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.statusCode).to.equal(200);
    });
});

describe('configuration caching', () => {
    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
        resetCache();
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('should cache configuration and reuse it on subsequent requests', async () => {
        setupFragmentMocks(fetchStub, {
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
        // Return a time that's guaranteed to be > 5 minutes after any test start time
        // Tests typically start around 0-2000ms, so 305000 ensures > 5min difference
        performanceStub.returns(5 * 60 * 1000 + 5000);

        setupFragmentMocks(fetchStub, {
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

    it('should use stale cache when configuration refresh times out', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });

        const state = new MockState();
        await state.put('configuration', JSON.stringify({ debugLogs: true }));

        const originalGet = state.get.bind(state);
        const stateGetStub = sinon.stub(state, 'get');
        stateGetStub.callsFake(async (key) => {
            if (key === 'configuration') {
                await new Promise((resolve) => setTimeout(resolve, 250));
            }
            return originalGet(key);
        });

        const result1 = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });
        expect(result1.statusCode).to.equal(200);
        let configCalls = stateGetStub.getCalls().filter((call) => call.args[0] === 'configuration');
        expect(configCalls).to.have.length(1);

        const performanceStub = sinon.stub(performance, 'now');
        performanceStub.returns(5 * 60 * 1000 + 1000);

        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });

        const result2 = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });

        expect(result2.statusCode).to.equal(200);
        configCalls = stateGetStub.getCalls().filter((call) => call.args[0] === 'configuration');
        expect(configCalls).to.have.length(2);

        performanceStub.restore();
        stateGetStub.restore();
    });

    it('should respect configTimeout from networkConfig', async () => {
        const performanceStub = sinon.stub(performance, 'now');
        performanceStub.returns(0);
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });

        const state = new MockState();
        await state.put('configuration', '{"networkConfig":{"configTimeout": 50}}');

        const originalGet = state.get.bind(state);
        const stateGetStub = sinon.stub(state, 'get');
        stateGetStub.callsFake(async (key) => {
            if (key === 'configuration') {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return originalGet(key);
        });

        const result1 = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });
        expect(result1.statusCode).to.equal(200);
        let configCalls = stateGetStub.getCalls().filter((call) => call.args[0] === 'configuration');
        expect(configCalls).to.have.length(1);

        performanceStub.returns(5 * 60 * 1000 + 5000);

        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });

        const result2 = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });

        expect(result2.statusCode).to.equal(200);
        configCalls = stateGetStub.getCalls().filter((call) => call.args[0] === 'configuration');
        expect(configCalls).to.have.length(2);

        performanceStub.restore();
        stateGetStub.restore();
    });
});

describe('caching headers', () => {
    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
        resetCache();
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('should include Cache-Control header in successful responses', async () => {
        setupFragmentMocks(fetchStub, {
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
        expect(result.headers).to.have.property('Cache-Control');
        expect(result.headers['Cache-Control']).to.equal('public, max-age=300, stale-while-revalidate=86400');
    });

    it('should include Cache-Control header in 304 responses', async () => {
        const result = await runOnFilledState(
            fetchStub,
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

        expect(result.statusCode).to.equal(304);
        expect(result.headers).to.have.property('Cache-Control');
        expect(result.headers['Cache-Control']).to.equal('public, max-age=300, stale-while-revalidate=86400');
    });

    it('should include Cache-Control header in error responses', async () => {
        fetchStub.restore();
        fetchStub
            .withArgs('https://odin.adobe.com/some-en-us-fragment?references=all-hydrated')
            .returns(createResponse(404, { message: 'Fragment not found' }));

        const result = await getFragment({
            id: 'test-fragment',
            state: new MockState(),
            locale: 'fr_FR',
        });

        expect(result.statusCode).to.equal(404);
        expect(result.headers).to.have.property('Cache-Control');
        expect(result.headers['Cache-Control']).to.equal('public, max-age=300, stale-while-revalidate=86400');
    });

    it('should include Cache-Control header in timeout responses', async () => {
        fetchStub.restore();
        resetCache();
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments/test-fragment?references=all-hydrated')
            .returns(createResponse(200, {}));

        const state = new MockState();
        state.put('configuration', '{"networkConfig":{"fetchTimeout":20,"retries":1,"retryDelay":1}}');

        const result = await getFragment({
            id: 'test-fragment',
            state,
            locale: 'fr_FR',
        });

        expect(result.statusCode).to.equal(504);
        expect(result.headers).to.have.property('Cache-Control');
        expect(result.headers['Cache-Control']).to.equal('public, max-age=300, stale-while-revalidate=86400');
    });
});
