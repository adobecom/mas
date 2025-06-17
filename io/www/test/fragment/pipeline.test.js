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
            ? JSON.parse(
                  zlib
                      .brotliDecompressSync(
                          Buffer.from(response.body, 'base64'),
                      )
                      .toString('utf-8'),
              )
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
    'Access-Control-Expose-Headers':
        'X-Request-Id,Etag,Last-Modified,server-timing',
    'Content-Encoding': 'br',
    'Content-Type': 'application/json',
};

function setupFragmentMocks({ id, path, fields = {} }, preview = false) {
    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview
        ? '/adobe/sites/cf/fragments'
        : '/adobe/sites/fragments';
    // english fragment by id
    nock(odinDomain)
        .get(`${odinUriRoot}/some-en-us-fragment?references=all-hydrated`)
        .reply(200, FRAGMENT_RESPONSE_EN);

    // french fragment by path
    nock(odinDomain)
        .get(
            `${odinUriRoot}?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app`,
        )
        .reply(200, {
            items: [
                {
                    id: 'some-fr-fr-fragment',
                },
            ],
        });
    // french fragment by id
    nock(odinDomain)
        .get(`${odinUriRoot}/some-fr-fr-fragment?references=all-hydrated`)
        .reply(200, FRAGMENT_RESPONSE_FR);

    // dictionary by id
    nock(odinDomain)
        .get(`${odinUriRoot}/dictionary?references=all-hydrated`)
        .reply(200, mockDictionary());
}

const EXPECTED_BODY = {
    id: 'some-fr-fr-fragment',
    path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
};
//EXPECTED BODY SHA256 hash
const EXPECTED_BODY_HASH =
    '85a1b526366f8ad5a31e61bcca892e68829369c53ddf19c24e6092e75d8ececc';

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

    it('should handle fetch exceptions', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test-fragment')
            .replyWithError('Network error');

        const result = await getFragment({
            id: 'test-fragment',
            state: new MockState(),
            locale: 'fr_FR',
        });

        expect(result).to.deep.equal({
            statusCode: 500,
            headers: EXPECTED_HEADERS,
            body: {
                message: 'nok',
            },
        });
    });

    it('should handle 404 response status', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test-fragment')
            .reply(404, {
                message: 'Fragment not found',
            });

        // Also mock the request with references=all-hydrated parameter
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test-fragment?references=all-hydrated')
            .reply(404, {
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
