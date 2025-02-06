const { expect } = require('chai');
const nock = require('nock');
const replace = require('../../src/fragment/replace.js').replace;
const DICTIONARY_RESPONSE = require('./mocks/dictionary.json');
const DICTIONARY_CF_RESPONSE = {
    items: [
        {
            path: '/content/dam/mas/drafts/fr_FR/dictionary/index',
            id: 'fr_FR_dictionary',
        },
    ],
};

const odinResponse = (description, cta = '{{buy-now}}') => ({
    path: '/content/dam/mas/nala/ccd/slice-cc-allapps31211',
    id: 'test',
    fields: {
        variant: 'ccd-slice',
        description,
        cta,
    },
});

const mockDictionary = () => {
    nock('https://odin.adobe.com')
        .get('/adobe/sites/fragments')
        .query({ path: '/content/dam/mas/drafts/fr_FR/dictionary/index' })
        .reply(200, DICTIONARY_CF_RESPONSE);
    nock('https://odin.adobe.com')
        .get(
            '/adobe/sites/fragments/fr_FR_dictionary/variations/master/references',
        )
        .reply(200, DICTIONARY_RESPONSE);
};

const getResponse = async (description, cta) => {
    mockDictionary();
    return await replace({
        status: 200,
        surface: 'drafts',
        locale: 'fr_FR',
        body: odinResponse(description, cta),
    });
};

const expectedResponse = (description) => ({
    status: 200,
    body: {
        path: '/content/dam/mas/nala/ccd/slice-cc-allapps31211',
        id: 'test',
        fields: {
            variant: 'ccd-slice',
            description,
            cta: 'Buy now',
        },
    },
    locale: 'fr_FR',
    surface: 'drafts',
});

describe('replace', () => {
    it('returns 200 & no placeholders', async () => {
        const response = await getResponse('foo');
        expect(response).to.deep.equal(expectedResponse('foo'));
    });
    it('returns 200 & replaced entries keys with text', async () => {
        const response = await getResponse(
            'please {{view-account}} for {{cai-default}} region',
        );
        expect(response).to.deep.equal(
            expectedResponse(
                'please View account for An AI tool was not used in creating this image region',
            ),
        );
    });
    it('returns 200 & replace empty (but present) placeholders', async () => {
        const response = await getResponse('this is {{empty}}');
        expect(response).to.deep.equal(expectedResponse('this is '));
    });
    it('returns 200 & manages nested placeholders', async () => {
        const response = await getResponse('look! {{nest}}');
        expect(response).to.deep.equal(
            expectedResponse('look! little bird is in the nest'),
        );
    });
    it('returns 200 & manages circular references', async () => {
        const response = await getResponse('look! {{yin}}');
        expect(response).to.deep.equal(
            expectedResponse('look! yin and yin and yang'),
        );
    });
    it('returns 200 & leaves non existing keys', async () => {
        const response = await getResponse('this is {{non-existing}}');
        expect(response).to.deep.equal(
            expectedResponse('this is non-existing'),
        );
    });
    it('returns 200 & manages rich text', async () => {
        const response = await getResponse('look! {{rich-text}}');
        expect(response).to.deep.equal(
            expectedResponse('look! <p>i am <strong>rich</strong></p>'),
        );
    });
});

exports.mockDictionary = mockDictionary;
