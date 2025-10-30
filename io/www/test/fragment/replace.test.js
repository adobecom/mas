import { expect } from 'chai';
import nock from 'nock';
import { transformer as replace } from '../../src/fragment/replace.js';
import DICTIONARY_RESPONSE from './mocks/dictionary.json' with { type: 'json' };
import DICTIONARY_RESPONSE_ACOM_FR_FR from './mocks/dictionary-acom-fr-fr.json' with { type: 'json' };
import DICTIONARY_RESPONSE_CCD_FR_FR from './mocks/dictionary-ccd-fr-fr.json' with { type: 'json' };
import DICTIONARY_RESPONSE_CCD_FR_LU from './mocks/dictionary-ccd-fr-lu.json' with { type: 'json' };

const dictionaryCfResponse = (surface = 'sandbox', locale = 'fr_FR') => {
    return {
        items: [
            {
                path: `/content/dam/mas/${surface}/${locale}/dictionary/index`,
                id: `${surface}_${locale}_dictionary`,
            },
        ],
    };
};

const odinResponse = (description, cta = '{{buy-now}}', surface = 'sandbox', locale = 'fr_FR') => ({
    path: `/content/dam/mas/${surface}/${locale}/ccd-slice-wide-cc-all-app`,
    id: 'test',
    fields: {
        variant: 'ccd-slice',
        description,
        cta,
    },
});

const mockDictionaryBySurfaceLocale = (
    preview = false,
    surface = 'sandbox',
    locale = 'fr_FR',
    dictionaryResponse = DICTIONARY_RESPONSE,
) => {
    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';
    nock(odinDomain)
        .get(odinUriRoot)
        .query({ path: `/content/dam/mas/${surface}/${locale}/dictionary/index` })
        .reply(200, dictionaryCfResponse(surface, locale));
    // Use the new URL format with ?references=all-hydrated
    nock(odinDomain)
        .get(`${odinUriRoot}/${surface}_${locale}_dictionary?references=all-hydrated`)
        .reply(200, dictionaryResponse);
};

const mockDictionary = (preview = false) => {
    mockDictionaryBySurfaceLocale(preview);
};

const getResponse = async (description, cta, surface = 'sandbox', locale = 'fr_FR') => {
    mockDictionary();
    return await replace.process({
        status: 200,
        loggedTransformer: 'replace',
        requestId: 'mas-replace-ut',
        surface,
        locale,
        body: odinResponse(description, cta, surface, locale),
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
    loggedTransformer: 'replace',
    requestId: 'mas-replace-ut',
    dictionaryId: 'sandbox_fr_FR_dictionary',
    locale: 'fr_FR',
    surface: 'sandbox',
});

describe('replace', () => {
    it('returns 200 & no placeholders', async () => {
        const response = await getResponse('foo', 'Buy now');
        const expected = expectedResponse('foo');
        delete expected.dictionaryId;
        expect(response).to.deep.include(expected);
    });
    it('returns 200 & replaced entries keys with text', async () => {
        const response = await getResponse('please {{view-account}} for {{cai-default}} region');
        expect(response).to.deep.include(
            expectedResponse('please View account for An AI tool was not used in creating this image region'),
        );
    });
    it('returns 200 & replace empty (but present) placeholders', async () => {
        const response = await getResponse('this is {{empty}}');
        expect(response).to.deep.include(expectedResponse('this is '));
    });
    it('returns 200 & manages nested placeholders', async () => {
        const response = await getResponse('look! {{nest}}');
        expect(response).to.deep.include(expectedResponse('look! little bird is in the nest'));
    });
    it('returns 200 & manages circular references', async () => {
        const response = await getResponse('look! {{yin}}');
        expect(response).to.deep.include(expectedResponse('look! yin and yin and yang'));
    });
    it('returns 200 & leaves non existing keys', async () => {
        const response = await getResponse('this is {{non-existing}}');
        expect(response).to.deep.include(expectedResponse('this is non-existing'));
    });
    it('returns 200 & manages rich text', async () => {
        const response = await getResponse('look! {{rich-text}}');
        expect(response).to.deep.include(expectedResponse('look! <p>i am <strong>rich</strong></p>'));
    });
    it('returns 200 & manages rich text with double quotes', async () => {
        const response = await getResponse('look! {{rich-text-with-quotes}}');
        expect(response).to.deep.include(expectedResponse('look! <p>i am "rich"</p>'));
    });
    describe('corner cases', () => {
        beforeEach(() => {
            nock.cleanAll();
        });

        afterEach(() => {
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
            const context = await replace.process(FAKE_CONTEXT);
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully non 2xx to find dictionary', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/sandbox/fr_FR/dictionary/index',
                })
                .reply(404, 'not found');
            const context = await replace.process(FAKE_CONTEXT);
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully fetch no dictionary index', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .reply(200, { items: [] });
            const context = await replace.process(FAKE_CONTEXT);
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully failure to find entries', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/sandbox/fr_FR/dictionary/index',
                })
                .reply(200, dictionaryCfResponse('sandbox', 'fr_FR'));
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments/sandbox_fr_FR_dictionary?references=all-hydrated')
                .replyWithError('fetch error');
            const context = await replace.process(FAKE_CONTEXT);
            const dictionaryId = 'sandbox_fr_FR_dictionary';
            expect(context).to.deep.include({ ...EXPECTED, dictionaryId });
        });
        it('manages gracefully non 2xx to find entries', async () => {
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/sandbox/fr_FR/dictionary/index',
                })
                .reply(200, dictionaryCfResponse('sandbox', 'fr_FR'));
            nock('https://odin.adobe.com')
                .get('/adobe/sites/fragments/sandbox_fr_FR_dictionary?references=all-hydrated')
                .reply(500, 'server error');
            const context = await replace.process(FAKE_CONTEXT);
            const dictionaryId = 'sandbox_fr_FR_dictionary';
            expect(context).to.deep.include({ ...EXPECTED, dictionaryId });
        });
    });

    describe('handles surface and locale fallbacks', () => {
        it('consumer falls back to acom surface default locale', async () => {
            mockDictionaryBySurfaceLocale(false, 'ccd', 'fr_LU', DICTIONARY_RESPONSE_ACOM_FR_FR);
            let response = await getResponse('foo: {{foo}} bar', null, 'ccd', 'fr_LU');
            expect(response.body.fields.description).to.equal('foo: afr bar');
        });
        it('consumer falls back to the default locale in the same surface', async () => {
            mockDictionaryBySurfaceLocale(false, 'ccd', 'fr_LU', DICTIONARY_RESPONSE_CCD_FR_FR);
            let response = await getResponse('foo: {{foo}} bar', null, 'ccd', 'fr_LU');
            expect(response.body.fields.description).to.equal('foo: cfr bar');
        });
        it('consumer uses locale override and ignores fallbacks', async () => {
            mockDictionaryBySurfaceLocale(false, 'ccd', 'fr_LU', DICTIONARY_RESPONSE_CCD_FR_LU);
            let response = await getResponse('foo: {{foo}} bar', null, 'ccd', 'fr_LU');
            expect(response.body.fields.description).to.equal('foo: lfr bar');
        });
    });
});

export { mockDictionary };
