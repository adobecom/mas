const { expect } = require('chai');
const nock = require('nock');
const { MockState } = require('./mocks/MockState.js');
const translate = require('../../src/fragment/translate.js').translate;
const FRAGMENT_RESPONSE_FR = require('./mocks/fragment-fr.json');

const FAKE_CONTEXT = {
    status: 200,
    transformer: 'translate',
    requestId: 'mas-translate-ut',
    state: new MockState(),
};

describe('translate typical cases', function () {
    afterEach(function () {
        nock.cleanAll();
    });

    it('should return fr fragment (us fragment, fr locale)', async function () {
        // french fragment by id
        nock('https://odin.adobe.com')
            .get(`/adobe/sites/fragments/some-fr-fr-fragment?references=all-hydrated`)
            .reply(200, FRAGMENT_RESPONSE_FR);
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({
                path: '/content/dam/mas/sandbox/fr_FR/some-en-us-fragment',
            })
            .reply(200, {
                items: [
                    {
                        path: '/content/dam/mas/sandbox/fr_FR/some-fr-fr-fragment',
                        id: 'some-fr-fr-fragment',
                        some: 'corps',
                    },
                ],
            });

        const result = await translate({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            locale: 'fr_FR',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return fr fragment (fr fragment, no locale)', async function () {
        const result = await translate({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/fr_FR/some-fr-fr-fragment',
                some: 'corps',
            },
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.equal({
            path: '/content/dam/mas/sandbox/fr_FR/some-fr-fr-fragment',
            some: 'corps',
        });
    });
});

describe('translate corner cases', function () {
    it('no path should return 400', async function () {
        const result = await translate({
            ...FAKE_CONTEXT,
            body: {},
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 400,
            message: 'source path is either not here or invalid',
        });
    });

    it('bad path should return 400', async function () {
        expect(
            await translate({
                status: 200,
                body: { path: 'something/rather/wrong' },
                locale: 'fr_FR',
            }),
        ).to.deep.equal({
            status: 400,
            message: 'source path is either not here or invalid',
        });
        expect(
            await translate({
                status: 200,
                body: { path: 'content/dam/mas/a/b/' },
                locale: 'fr_FR',
            }),
        ).to.deep.equal({
            status: 400,
            message: 'source path is either not here or invalid',
        });
    });

    it('missing path components should return 400', async function () {
        const result = await translate({
            ...FAKE_CONTEXT,
            status: 200,
            body: { path: '/content/dam/mas/sandbox/someFragment' }, // Missing locale
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 400,
            message: 'source path is either not here or invalid',
        });
    });

    it('should return 500 when translation fetch failed', async function () {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/sandbox/fr_FR/someFragment' })
            .reply(404, {
                message: 'Not found',
            });

        const result = await translate({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/someFragment' },
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 500,
            message: 'translation search failed',
        });
    });

    it('should return 500 when translation fetch by id failed', async function () {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/sandbox/fr_FR/someFragment' })
            .reply(200, {
                items: [
                    {
                        path: '/content/dam/mas/sandbox/fr_FR/someFragment',
                        id: 'some-fr-fr-fragment-server-error',
                    },
                ],
            });

        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/some-fr-fr-fragment-server-error' })
            .reply(500, {
                message: 'Error',
            });

        const result = await translate({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/someFragment' },
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 500,
            message: 'translation search failed',
        });
    });

    it('should return 404 when translation has no items', async function () {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/sandbox/fr_FR/someFragment' })
            .reply(200, {
                items: [],
            });

        const result = await translate({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/someFragment' },
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 404,
            message: 'no translation found',
        });
    });

    it('same locale should return same body', async function () {
        const result = await translate({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/fr_FR/someFragment',
                some: 'body',
            },
            locale: 'fr_FR',
        });
        expect(result.body).to.deep.equal({
            path: '/content/dam/mas/sandbox/fr_FR/someFragment',
            some: 'body',
        });
    });
});
