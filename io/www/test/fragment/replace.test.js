import { expect } from 'chai';
import sinon from 'sinon';
import { transformer as replace, clearDictionaryCache } from '../../src/fragment/transformers/replace.js';
import DICTIONARY_RESPONSE from './mocks/dictionary.json' with { type: 'json' };
import DICTIONARY_RESPONSE_ACOM_FR_FR from './mocks/dictionary-acom-fr-fr.json' with { type: 'json' };
import DICTIONARY_RESPONSE_CCD_FR_FR from './mocks/dictionary-ccd-fr-fr.json' with { type: 'json' };
import DICTIONARY_RESPONSE_CCD_FR_LU from './mocks/dictionary-ccd-fr-lu.json' with { type: 'json' };
import { createResponse } from './mocks/MockFetch.js';

const DEFAULT_SURFACE = 'sandbox';
const DEFAULT_LOCALE = 'fr_FR';

const dictionaryIdFor = (surface = DEFAULT_SURFACE, locale = DEFAULT_LOCALE) => `${surface}_${locale}_dictionary`;

const dictionaryCfResponse = (surface = DEFAULT_SURFACE, locale = DEFAULT_LOCALE) => ({
    items: [
        {
            path: `/content/dam/mas/${surface}/${locale}/dictionary/index`,
            id: dictionaryIdFor(surface, locale),
        },
    ],
});

const odinResponse = (description, cta = '{{buy-now}}', surface = DEFAULT_SURFACE, locale = DEFAULT_LOCALE) => ({
    path: `/content/dam/mas/${surface}/${locale}/ccd-slice-wide-cc-all-app`,
    id: 'test',
    fields: {
        variant: 'ccd-slice',
        description,
        cta,
    },
});

let fetchStub;

const mockDictionaryBySurfaceLocale = (
    preview = false,
    surface = DEFAULT_SURFACE,
    locale = DEFAULT_LOCALE,
    dictionaryResponse = DICTIONARY_RESPONSE,
    stub = fetchStub,
) => {
    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';
    const dictionaryId = dictionaryIdFor(surface, locale);

    stub.withArgs(`${odinDomain}${odinUriRoot}?path=/content/dam/mas/${surface}/${locale}/dictionary/index`).returns(
        createResponse(200, dictionaryCfResponse(surface, locale)),
    );

    stub.withArgs(`${odinDomain}${odinUriRoot}/${dictionaryId}?references=all-hydrated`).returns(
        createResponse(200, dictionaryResponse),
    );
};

const mockDictionary = (preview = false, stub = fetchStub, cleanCache = true) => {
    if (cleanCache) {
        clearDictionaryCache();
    }
    mockDictionaryBySurfaceLocale(preview, DEFAULT_SURFACE, DEFAULT_LOCALE, DICTIONARY_RESPONSE, stub);
};

const getResponse = async (description, cta, surface = DEFAULT_SURFACE, locale = DEFAULT_LOCALE, cleanCache = true) => {
    mockDictionary(false, fetchStub, cleanCache);
    const context = { surface, locale, loggedTransformer: 'replace', requestId: 'mas-replace-ut' };
    context.promises = {};
    context.promises.replace = replace.init(context);
    await context.promises.replace;
    context.body = odinResponse(description, cta, surface, locale);
    return await replace.process(context);
};

const expectedResponse = (description) => ({
    status: 200,
    body: {
        path: `/content/dam/mas/${DEFAULT_SURFACE}/${DEFAULT_LOCALE}/ccd-slice-wide-cc-all-app`,
        id: 'test',
        fields: {
            variant: 'ccd-slice',
            description,
            cta: 'Buy now',
        },
    },
    loggedTransformer: 'replace',
    requestId: 'mas-replace-ut',
    fragmentsIds: {
        'dictionary-id': dictionaryIdFor(),
    },
    locale: DEFAULT_LOCALE,
    surface: DEFAULT_SURFACE,
});

describe('replace', () => {
    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
        clearDictionaryCache();
    });

    it('returns 200 & no placeholders', async () => {
        const response = await getResponse('foo', 'Buy now');
        const expected = expectedResponse('foo');
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
        const FAKE_CONTEXT = {
            status: 200,
            surface: DEFAULT_SURFACE,
            locale: DEFAULT_LOCALE,
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
                path: `/content/dam/mas/${DEFAULT_SURFACE}/${DEFAULT_LOCALE}/ccd-slice-wide-cc-all-app`,
            },
        };

        it('manages gracefully fetch failure to find dictionary', async () => {
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .rejects(new Error('fetch error'));
            const context = await replace.process(FAKE_CONTEXT);
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully non 2xx to find dictionary', async () => {
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .returns(createResponse(404, 'not found', 'Not Found'));
            const context = await replace.process(FAKE_CONTEXT);
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully fetch no dictionary index', async () => {
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .returns(createResponse(200, { items: [] }));
            const context = await replace.process(FAKE_CONTEXT);
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully failure to find entries', async () => {
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .returns(createResponse(200, dictionaryCfResponse()));
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments/sandbox_fr_FR_dictionary?references=all-hydrated')
                .rejects(new Error('fetch error'));
            const context = await replace.process(FAKE_CONTEXT);
            const dictionaryId = dictionaryIdFor();
            expect(context).to.deep.include({ ...EXPECTED, fragmentsIds: { 'dictionary-id': dictionaryId } });
        });
        it('manages gracefully non 2xx to find entries', async () => {
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .returns(createResponse(200, dictionaryCfResponse()));
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments/sandbox_fr_FR_dictionary?references=all-hydrated')
                .returns(createResponse(500, 'server error', 'Internal Server Error'));
            const context = await replace.process(FAKE_CONTEXT);
            const dictionaryId = dictionaryIdFor();
            expect(context).to.deep.include({ ...EXPECTED, fragmentsIds: { 'dictionary-id': dictionaryId } });
        });
    });

    describe('dictionary caching', () => {
        const dictionaryContentUrl =
            'https://odin.adobe.com/adobe/sites/fragments/sandbox_fr_FR_dictionary?references=all-hydrated';

        const contentFetchCalls = () => fetchStub.getCalls().filter((c) => c.args[0]?.includes('references=all-hydrated'));

        it('uses cached dictionary on second request (no extra fetch)', async () => {
            const response1 = await getResponse('please {{view-account}}', '{{buy-now}}', DEFAULT_SURFACE, DEFAULT_LOCALE, true);
            expect(response1.body.fields.cta).to.equal('Buy now');
            const response2 = await getResponse('please {{view-account}}', '{{buy-now}}', DEFAULT_SURFACE, DEFAULT_LOCALE, false);
            expect(response2.body.fields.cta).to.equal('Buy now');
            expect(contentFetchCalls()).to.have.length(1);
        });

        it('caches dictionary with 200 and reuses it within TTL', async () => {
            const response = await getResponse('{{view-account}}', '{{buy-now}}', DEFAULT_SURFACE, DEFAULT_LOCALE, true);
            expect(response.body.fields.description).to.equal('View account');
            expect(contentFetchCalls()).to.have.length(1);
            const response2 = await getResponse('{{view-account}}', '{{buy-now}}', DEFAULT_SURFACE, DEFAULT_LOCALE, false);
            expect(response2.body.fields.description).to.equal('View account');
            expect(contentFetchCalls()).to.have.length(1);
        });
    });

    describe('handles surface and locale fallbacks', () => {
        it('consumer falls back to acom surface default locale', async () => {
            mockDictionaryBySurfaceLocale(false, 'ccd', 'fr_LU', DICTIONARY_RESPONSE_ACOM_FR_FR, fetchStub);
            const response = await getResponse('foo: {{foo}} bar', null, 'ccd', 'fr_LU');
            expect(response.body.fields.description).to.equal('foo: afr bar');
        });
        it('consumer falls back to the default locale in the same surface', async () => {
            mockDictionaryBySurfaceLocale(false, 'ccd', 'fr_LU', DICTIONARY_RESPONSE_CCD_FR_FR, fetchStub);
            const response = await getResponse('foo: {{foo}} bar', null, 'ccd', 'fr_LU');
            expect(response.body.fields.description).to.equal('foo: cfr bar');
        });
        it('consumer uses locale override and ignores fallbacks', async () => {
            mockDictionaryBySurfaceLocale(false, 'ccd', 'fr_LU', DICTIONARY_RESPONSE_CCD_FR_LU, fetchStub);
            const response = await getResponse('foo: {{foo}} bar', null, 'ccd', 'fr_LU');
            expect(response.body.fields.description).to.equal('foo: lfr bar');
        });
    });
});

export { mockDictionary };
