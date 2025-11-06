import { expect } from 'chai';
import sinon from 'sinon';
import { transformer as replace } from '../../src/fragment/transformers/replace.js';
import DICTIONARY_RESPONSE from './mocks/dictionary.json' with { type: 'json' };
import { createResponse } from './mocks/MockFetch.js';

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

let fetchStub;

const mockDictionary = (preview, fetchStub) => {
    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';

    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}?path=/content/dam/mas/sandbox/fr_FR/dictionary/index`)
        .returns(createResponse(200, DICTIONARY_CF_RESPONSE));

    fetchStub
        .withArgs(`${odinDomain}${odinUriRoot}/fr_FR_dictionary?references=all-hydrated`)
        .returns(createResponse(200, DICTIONARY_RESPONSE));
};

const getResponse = async (description, cta) => {
    mockDictionary(false, fetchStub);
    const context = { surface: 'sandbox', locale: 'fr_FR', loggedTransformer: 'replace', requestId: 'mas-replace-ut' };
    context.promises = {};
    context.promises.replace = replace.init(context);
    await context.promises.replace;
    context.body = odinResponse(description, cta);
    return await replace.process(context);
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
    fragmentsIds: {
        'dictionary-id': 'fr_FR_dictionary',
    },
    locale: 'fr_FR',
    surface: 'sandbox',
});

describe('replace', () => {
    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
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
                .returns(createResponse(200, DICTIONARY_CF_RESPONSE));
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments/fr_FR_dictionary?references=all-hydrated')
                .rejects(new Error('fetch error'));
            const context = await replace.process(FAKE_CONTEXT);
            const dictionaryId = 'fr_FR_dictionary';
            expect(context).to.deep.include({ ...EXPECTED, fragmentsIds: { 'dictionary-id': dictionaryId } });
        });
        it('manages gracefully non 2xx to find entries', async () => {
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/dictionary/index')
                .returns(createResponse(200, DICTIONARY_CF_RESPONSE));
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/sites/fragments/fr_FR_dictionary?references=all-hydrated')
                .returns(createResponse(500, 'server error', 'Internal Server Error'));
            const context = await replace.process(FAKE_CONTEXT);
            const dictionaryId = 'fr_FR_dictionary';
            expect(context).to.deep.include({ ...EXPECTED, fragmentsIds: { 'dictionary-id': dictionaryId } });
        });
    });
});

export { mockDictionary };
