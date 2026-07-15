import { expect } from 'chai';
import sinon from 'sinon';
import { main as action, resetCache } from '../../src/fragment/pipeline.js';
import { clearSettingsCache } from '../../src/fragment/transformers/settings.js';
import { mockDictionary } from './replace.test.js';
import SETTINGS_RESPONSE from './mocks/settings-sandbox.json' with { type: 'json' };
import zlib from 'zlib';

import FRAGMENT_RESPONSE_EN from './mocks/fragment-en-default.json' with { type: 'json' };
import FRAGMENT_RESPONSE_FR from './mocks/fragment-fr.json' with { type: 'json' };
import DICTIONARY_FOR_COLLECTION_RESPONSE from './mocks/dictionaryForCollection.json' with { type: 'json' };
import COLLECTION_RESPONSE from './mocks/collection.json' with { type: 'json' };
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
    return decompress(await action({ api_key: 'wcms-commerce-ims-ro-user-milo', ...params }));
}

const EXPECTED_HEADERS = {
    'Access-Control-Expose-Headers': 'X-Request-Id,Etag,Last-Modified,server-timing',
    'Content-Encoding': 'br',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
};

const SETTINGS_INDEX_URL_SANDBOX =
    'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/settings/index';
const SETTINGS_INDEX_URL_PREVIEW =
    'https://odinpreview.corp.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/settings/index';
const SETTINGS_CONTENT_URL = (settingsId) =>
    `https://odin.adobe.com/adobe/contentFragments/${settingsId}?references=all-hydrated`;
const SETTINGS_CONTENT_URL_PREVIEW = (settingsId) =>
    `https://odinpreview.corp.adobe.com/adobe/contentFragments/${settingsId}?references=all-hydrated`;

function mockSettings(fetchStub, preview = false, settingsId = 'settings-id') {
    const indexUrl = preview ? SETTINGS_INDEX_URL_PREVIEW : SETTINGS_INDEX_URL_SANDBOX;
    const contentUrl = preview ? SETTINGS_CONTENT_URL_PREVIEW(settingsId) : SETTINGS_CONTENT_URL(settingsId);
    fetchStub.withArgs(indexUrl).returns(createResponse(200, { id: settingsId }));
    fetchStub.withArgs(contentUrl).returns(createResponse(200, SETTINGS_RESPONSE));
}

function setupFragmentMocks(fetchStub, { id, path, fields = {} }, preview = false) {
    // setup dictionary mocks
    mockDictionary(preview, fetchStub);
    // setup settings mocks so pipeline context gets settings
    mockSettings(fetchStub, preview);

    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/contentFragments' : '/adobe/contentFragments';
    // english fragment by id
    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}/some-en-us-fragment?references=all-hydrated`)
        .returns(createResponse(200, FRAGMENT_RESPONSE_EN));

    // french fragment by path
    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}/byPath?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app`)
        .returns(createResponse(200, { id: 'some-fr-fr-fragment' }));

    // candadian french fragment by path — not found (empty body)
    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}/byPath?path=/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app`)
        .returns(createResponse(200, {}));

    // french fragment by id
    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}/some-fr-fr-fragment?references=all-hydrated`)
        .returns(createResponse(200, FRAGMENT_RESPONSE_FR));

    // promotions folder — no active promotions by default
    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}/?path=/content/dam/mas/promotions`)
        .returns(createResponse(200, { items: [] }));

    // WCS prefill — hardcoded prod config is always merged in; return empty offers
    fetchStub
        .withArgs(sinon.match((url) => typeof url === 'string' && url.includes('web_commerce_artifact')))
        .returns(createResponse(200, { resolvedOffers: [] }));
}

const EXPECTED_BODY = {
    id: 'some-fr-fr-fragment',
    path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
};
// EXPECTED BODY SHA256 hash (includes settings/priceLiterals from mocked settings)
const EXPECTED_BODY_HASH = '53e93f636fc6ff1d38b8508a2e5e4568914bca44d2f308deb7cf47f5d1024165';

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

describe('collection placeholders', () => {
    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch').callsFake((url) => {
            console.warn('[test] unmatched fetch stub:', url);
            return createResponse(404, { detail: 'Not Found' }, 'Not Found');
        });
        clearSettingsCache();
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('should work', async () => {
        mockSettings(fetchStub);
        const state = new MockState();
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/07f9729e-dc1f-4634-829d-7aa469bb0d33?references=all-hydrated',
            )
            .returns(createResponse(200, COLLECTION_RESPONSE));
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/412fda08-7b73-4a01-a04f-1953e183bad2?references=all-hydrated',
            )
            .returns(createResponse(200, DICTIONARY_FOR_COLLECTION_RESPONSE));
        state.put(
            'req-07f9729e-dc1f-4634-829d-7aa469bb0d33-en_US',
            '{"hash":"c4b6f3c040708c47444316d4e103268c8f2fb91c35dc4609ecccc29803f2aec0","lastModified":"Mon, 09 Jun 2025 07:43:58 GMT","fragmentsIds":{"settings-id":"settings-id","dictionary-id":"412fda08-7b73-4a01-a04f-1953e183bad2"}}',
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
        fetchStub = sinon.stub(globalThis, 'fetch').callsFake((url) => {
            console.warn('[test] unmatched fetch stub:', url);
            return createResponse(404, { detail: 'Not Found' }, 'Not Found');
        });
        mockDictionary(false, fetchStub);
        resetCache();
        clearSettingsCache();
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('should handle main timeout', async () => {
        const odinDomain = 'https://odin.adobe.com';
        const odinUriRoot = '/adobe/contentFragments';
        //simulate slow response
        fetchStub
            .withArgs(`${odinDomain}${odinUriRoot}/some-en-us-fragment?references=all-hydrated`)
            .returns(new Promise((resolve) => setTimeout(() => resolve(createResponse(200, FRAGMENT_RESPONSE_EN)), 50)));

        fetchStub
            .withArgs(`${odinDomain}${odinUriRoot}?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app`)
            .returns(createResponse(200, { id: 'some-fr-fr-fragment' }));

        fetchStub
            .withArgs(`${odinDomain}${odinUriRoot}/some-fr-fr-fragment?references=all-hydrated`)
            .returns(createResponse(200, FRAGMENT_RESPONSE_FR));

        const state = new MockState();
        await state.put('configuration', `{"networkConfig":{"mainTimeout":10,"retries": 1}}`);

        const result = await action({
            api_key: 'wcms-commerce-ims-ro-user-milo',
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(504);
        expect(result.message).to.equal('Fragment pipeline timed out');
    });

    it('action should be defined', () => {
        expect(action).to.be.a('function');
    });

    it('should reject preview mode with 400', async () => {
        const result = await action({
            id: 'some-en-us-fragment',
            locale: 'en_US',
            preview: true,
            state: new MockState(),
        });
        expect(result.statusCode).to.equal(400);
        expect(result.message).to.equal('Preview mode is not supported in this pipeline');
        expect(fetchStub.called).to.be.false;
    });

    it('should 400 when api_key param is missing', async () => {
        const result = await action({
            id: 'some-en-us-fragment',
            locale: 'en_US',
            state: new MockState(),
        });
        expect(result.statusCode).to.equal(400);
        expect(result.message).to.equal('missing api_key');
        expect(fetchStub.called).to.be.false;
    });

    it('should 401 when api_key is not in the accepted list', async () => {
        const result = await getFragment({
            id: 'some-en-us-fragment',
            locale: 'en_US',
            api_key: 'not-a-real-client',
            state: new MockState(),
        });
        expect(result.statusCode).to.equal(401);
        expect(result.message).to.equal('unauthorized api_key');
        expect(fetchStub.called).to.be.false;
    });

    it('should 200 when api_key matches a hardcoded CreativeCloud version regex', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: new MockState(),
            locale: 'fr_FR',
            api_key: 'CreativeCloud_v42_99',
        });
        expect(result.statusCode).to.equal(200);
    });

    it('should accept a state-supplied literal api_key', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const state = new MockState();
        await state.put('configuration', JSON.stringify({ apiKeys: ['my-test-key'] }));
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
            api_key: 'my-test-key',
        });
        expect(result.statusCode).to.equal(200);
    });

    it('should accept a state-supplied slash-wrapped regex pattern', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const state = new MockState();
        await state.put('configuration', JSON.stringify({ apiKeys: ['/^my_v\\d+$/'] }));
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
            api_key: 'my_v3',
        });
        expect(result.statusCode).to.equal(200);
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

    it('unknown locale should return 400 without hitting Odin', async () => {
        const result = await getFragment({
            id: 'some-fragment',
            locale: 'zz_ZZ',
            state: new MockState(),
        });
        expect(result.statusCode).to.equal(400);
        expect(result.body.message).to.match(/unknown locale/i);
        expect(fetchStub.called).to.be.false;
    });

    it('bad path should return 400', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/some-fr-fr-fragment?references=all-hydrated')
            .returns(createResponse(200, { path: '/content/bad-path' }));
        const state = new MockState();
        await state.put(
            'req-some-en-us-fragment-fr_FR',
            JSON.stringify({
                fragmentsIds: {
                    'dictionary-id': 'sandbox_fr_FR_dictionary',
                    'default-locale-id': 'some-fr-fr-fragment',
                    'settings-id': 'settings-id',
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
            .withArgs('https://odin.adobe.com/adobe/contentFragments/test-fragment?references=all-hydrated')
            .returns(new Promise((resolve) => setTimeout(() => resolve(createResponse(200, {})), 50)));

        const state = new MockState();
        await state.put('configuration', '{"networkConfig":{"fetchTimeout":20,"retries":1,"retryDelay":1}}');
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
        fetchStub.withArgs(sinon.match(/adobe\/contentFragments\/test-fragment/)).rejects(new Error('Network error'));
        const state = new MockState();
        await state.put('configuration', '{"networkConfig":{"retries": 2, "retryDelay": 1}}');
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

    it('should handle 404 response status', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/test-fragment?references=all-hydrated')
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
                    'dictionary-id': 'sandbox_fr_FR_dictionary',
                    'default-locale-id': 'some-fr-fr-fragment',
                    'settings-id': 'settings-id',
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
                fragmentsIds: {
                    'dictionary-id': 'sandbox_fr_FR_dictionary',
                    'default-locale-id': 'some-fr-fr-fragment',
                    'settings-id': 'settings-id',
                },
                hash: EXPECTED_BODY_HASH,
            }),
            {
                'if-modified-since': RANDOM_OLD_DATE,
            },
        );
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.include(EXPECTED_BODY);
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

describe('caching headers', () => {
    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch').callsFake((url) => {
            console.warn('[test] unmatched fetch stub:', url);
            return createResponse(404, { detail: 'Not Found' }, 'Not Found');
        });
        resetCache();
        clearSettingsCache();
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
                fragmentsIds: {
                    'dictionary-id': 'sandbox_fr_FR_dictionary',
                    'default-locale-id': 'some-fr-fr-fragment',
                    'settings-id': 'settings-id',
                },
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
        mockSettings(fetchStub);
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/test-fragment?references=all-hydrated')
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
            .withArgs('https://odin.adobe.com/adobe/contentFragments/test-fragment?references=all-hydrated')
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

export { getFragment, setupFragmentMocks, mockSettings, runOnFilledState, EXPECTED_BODY, EXPECTED_BODY_HASH, RANDOM_OLD_DATE };
