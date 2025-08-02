const { expect } = require('chai');
const nock = require('nock');
const replace = require('../../src/fragment/replace.js').replace;
const DICTIONARY_RESPONSE = require('./mocks/dictionary.json');
const DICTIONARY_CF_RESPONSE = {
    items: [
        {
            path: '/content/dam/mas/sandbox/fr_FR/dictionary/index',
            id: 'fr_FR_dictionary',
        },
    ],
};

const odinResponse = (description, cta = '{{buy-now}}') => ({
    path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
    id: 'test',
    fields: {
        variant: 'ccd-slice',
        description,
        cta,
    },
});

const mockDictionary = (preview = false) => {
    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';
    nock(odinDomain)
        .get(odinUriRoot)
        .query({ path: '/content/dam/mas/sandbox/fr_FR/dictionary/index' })
        .reply(200, DICTIONARY_CF_RESPONSE);
    // Use the new URL format with ?references=all-hydrated
    nock(odinDomain).get(`${odinUriRoot}/fr_FR_dictionary?references=all-hydrated`).reply(200, DICTIONARY_RESPONSE);
};

const getResponse = async (description, cta) => {
    mockDictionary();
    return await replace({
        status: 200,
        transformer: 'replace',
        requestId: 'mas-replace-ut',
        surface: 'sandbox',
        locale: 'fr_FR',
        body: odinResponse(description, cta),
    });
};

const expectedResponse = (description) => ({
    status: 200,
    body: {
        path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        id: 'test',
        fields: {
            variant: 'ccd-slice',
            description,
            cta: 'Buy now',
        },
    },
    transformer: 'replace',
    requestId: 'mas-replace-ut',
    dictionaryId: 'fr_FR_dictionary',
    locale: 'fr_FR',
    surface: 'sandbox',
});

describe('replace', () => {
    it('returns 200 & no placeholders', async () => {
        const response = await getResponse('foo', 'Buy now');
        const expected = expectedResponse('foo');
        delete expected.dictionaryId;
        expect(response).to.deep.equal(expected);
    });
    it('returns 200 & replaced entries keys with text', async () => {
        const response = await getResponse('please {{view-account}} for {{cai-default}} region');
        expect(response).to.deep.equal(
            expectedResponse('please View account for An AI tool was not used in creating this image region'),
        );
    });
    it('returns 200 & replace empty (but present) placeholders', async () => {
        const response = await getResponse('this is {{empty}}');
        expect(response).to.deep.equal(expectedResponse('this is '));
    });
    it('returns 200 & manages nested placeholders', async () => {
        const response = await getResponse('look! {{nest}}');
        expect(response).to.deep.equal(expectedResponse('look! little bird is in the nest'));
    });
    it('returns 200 & manages circular references', async () => {
        const response = await getResponse('look! {{yin}}');
        expect(response).to.deep.equal(expectedResponse('look! yin and yin and yang'));
    });
    it('returns 200 & leaves non existing keys', async () => {
        const response = await getResponse('this is {{non-existing}}');
        expect(response).to.deep.equal(expectedResponse('this is non-existing'));
    });
    it('returns 200 & manages rich text', async () => {
        const response = await getResponse('look! {{rich-text}}');
        expect(response).to.deep.equal(expectedResponse('look! <p>i am <strong>rich</strong></p>'));
    });
    it('returns 200 & manages rich text with double quotes', async () => {
        const response = await getResponse('look! {{rich-text-with-quotes}}');
        expect(response).to.deep.equal(expectedResponse('look! <p>i am "rich"</p>'));
    });
    describe('corner cases', () => {
        beforeEach(() => {
            nock.cleanAll();
        });

        const FAKE_CONTEXT = {
            status: 200,
            surface: 'sandbox',
            locale: 'fr_FR',
            networkConfig: {
                retries: 2,
                retryDelay: 1,
            },
            body: odinResponse('{{description}}', 'Buy now'),
        };
        const EXPECTED = {
            ...FAKE_CONTEXT,
            body: {
                fields: {
                    cta: 'Buy now',
                    description: '{{description}}',
                    variant: 'ccd-slice',
                },
                id: 'test',
                path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            },
        };

        it('manages gracefully fetch failure to find dictionary', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .replyWithError('fetch error');
            const context = await replace(FAKE_CONTEXT);
            expect(context).to.deep.equal(EXPECTED);
        });

        it('manages gracefully non 2xx to find dictionary', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/sandbox/fr_FR/dictionary/index',
                })
                .reply(404, 'not found');
            const context = await replace(FAKE_CONTEXT);
            expect(context).to.deep.equal(EXPECTED);
        });

        it('manages gracefully fetch no dictionary index', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .reply(200, { items: [] });
            const context = await replace(FAKE_CONTEXT);
            expect(context).to.deep.equal(EXPECTED);
        });

        it('manages gracefully failure to find entries', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/sandbox/fr_FR/dictionary/index',
                })
                .reply(200, DICTIONARY_CF_RESPONSE);
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments/fr_FR_dictionary?references=all-hydrated')
                .replyWithError('fetch error');
            const context = await replace(FAKE_CONTEXT);
            const dictionaryId = 'fr_FR_dictionary';
            expect(context).to.deep.equal({ ...EXPECTED, dictionaryId });
        });
        it('manages gracefully non 2xx to find entries', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/sandbox/fr_FR/dictionary/index',
                })
                .reply(200, DICTIONARY_CF_RESPONSE);
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments/fr_FR_dictionary?references=all-hydrated')
                .reply(500, 'server error');
            const context = await replace(FAKE_CONTEXT);
            const dictionaryId = 'fr_FR_dictionary';
            expect(context).to.deep.include({ ...EXPECTED, dictionaryId });
        });
    });
});

exports.mockDictionary = mockDictionary;
