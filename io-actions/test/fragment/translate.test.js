const { expect } = require('chai');
const nock = require('nock');
const translate = require('../../src/fragment/translate.js').translate;

const FAKE_CONTEXT = {
    status: 200,
    transformer: 'translate',
    requestId: 'mas-translate-ut',
};

describe('translate typical cases', () => {
    afterEach(() => {
        nock.cleanAll();
    });
    it('should return fr fragment (us fragment, fr locale)', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/drafts/fr_FR/someFragment' })
            .reply(200, {
                items: [
                    {
                        path: '/content/dam/mas/drafts/fr_FR/someFragment',
                        some: 'corps',
                    },
                ],
            });

        const result = await translate({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/drafts/en_US/someFragment' },
            locale: 'fr_FR',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.equal({
            path: '/content/dam/mas/drafts/fr_FR/someFragment',
            some: 'corps',
        });
    });
    it('should return fr fragment (fr fragment, no locale)', async () => {
        const result = await translate({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/drafts/fr_FR/someFragment',
                some: 'corps',
            },
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.equal({
            path: '/content/dam/mas/drafts/fr_FR/someFragment',
            some: 'corps',
        });
    });
});

describe('translate corner cases', () => {
    it('no path should return 400', async () => {
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

    it('bad path should return 400', async () => {
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

    it('missing path components should return 400', async () => {
        const result = await translate({
            ...FAKE_CONTEXT,
            status: 200,
            body: { path: '/content/dam/mas/drafts/someFragment' }, // Missing locale
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 400,
            message: 'source path is either not here or invalid',
        });
    });

    it('should return 404 when translation fetch fails', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/drafts/fr_FR/someFragment' })
            .reply(404, {
                message: 'Not found',
            });

        const result = await translate({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/drafts/en_US/someFragment' },
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 404,
            message: 'no translation found',
        });
    });

    it('should return 404 when translation has no items', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/drafts/fr_FR/someFragment' })
            .reply(200, {
                items: [],
            });

        const result = await translate({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/drafts/en_US/someFragment' },
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 404,
            message: 'no translation found',
        });
    });

    it('same locale should return same body', async () => {
        const result = await translate({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/drafts/fr_FR/someFragment',
                some: 'body',
            },
            locale: 'fr_FR',
        });
        expect(result.body).to.deep.equal({
            path: '/content/dam/mas/drafts/fr_FR/someFragment',
            some: 'body',
        });
    });
});
