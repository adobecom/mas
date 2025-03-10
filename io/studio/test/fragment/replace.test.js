const { expect } = require('chai');
const nock = require('nock');
const replace = require('../../src/fragment/replace.js').replace;
const FRAGMENT_AUTHOR_URL_PREFIX =
    'https://author-p22655-e59433.adobeaemcloud.com/adobe/sites/cf/fragments';
const MOCK_TOKEN = 'mocked-token';
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
    nock(FRAGMENT_AUTHOR_URL_PREFIX)
        .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
        .get('/adobe/sites/fragments')
        .query({ path: '/content/dam/mas/drafts/fr_FR/dictionary/index' })
        .reply(200, DICTIONARY_CF_RESPONSE);
    nock(FRAGMENT_AUTHOR_URL_PREFIX)
        .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
        .get(
            '/search?query=%7B"filter":%7B"path":"/content/dam/mas/drafts/fr_FR/dictionary"%7D%7D&limit=50',
        )
        .reply(200, DICTIONARY_RESPONSE);
};

const getResponse = async (description, cta) => {
    mockDictionary();
    return await replace({
        status: 200,
        transformer: 'replace',
        requestId: 'mas-replace-ut',
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
    transformer: 'replace',
    requestId: 'mas-replace-ut',
    locale: 'fr_FR',
    surface: 'drafts',
});

describe('replace', () => {
    it('returns 200 & no placeholders', async () => {
        const response = await getResponse('foo', 'Buy now');
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
    describe('corner cases', () => {
        beforeEach(() => {
            nock.cleanAll();
        });

        const FAKE_CONTEXT = {
            status: 200,
            surface: 'drafts',
            locale: 'fr_FR',
            body: odinResponse('{{description}}', 'Buy now'),
        };
        const EXPECTED = {
            body: {
                fields: {
                    cta: 'Buy now',
                    description: '{{description}}',
                    variant: 'ccd-slice',
                },
                id: 'test',
                path: '/content/dam/mas/nala/ccd/slice-cc-allapps31211',
            },
            locale: 'fr_FR',
            status: 200,
            surface: 'drafts',
        };

        it('manages gracefully fetch failure to find dictionary', async () => {
            nock(FRAGMENT_AUTHOR_URL_PREFIX)
                .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/drafts/fr_FR/dictionary/index',
                })
                .replyWithError('fetch error');
            const context = await replace(FAKE_CONTEXT);
            expect(context).to.deep.equal(EXPECTED);
        });

        it('manages gracefully non 2xx to find dictionary', async () => {
            nock(FRAGMENT_AUTHOR_URL_PREFIX)
                .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/drafts/fr_FR/dictionary/index',
                })
                .reply(404, 'not found');
            const context = await replace(FAKE_CONTEXT);
            expect(context).to.deep.equal(EXPECTED);
        });

        it('manages gracefully fetch no dictionary index', async () => {
            nock(FRAGMENT_AUTHOR_URL_PREFIX)
                .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/drafts/fr_FR/dictionary/index',
                })
                .reply(200, { items: [] });
            const context = await replace(FAKE_CONTEXT);
            expect(context).to.deep.equal(EXPECTED);
        });

        it('manages gracefully failure to find entries', async () => {
            nock(FRAGMENT_AUTHOR_URL_PREFIX)
                .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/drafts/fr_FR/dictionary/index',
                })
                .reply(200, DICTIONARY_CF_RESPONSE);
            nock(FRAGMENT_AUTHOR_URL_PREFIX)
                .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
                .get(
                    '/adobe/sites/fragments/fr_FR_dictionary/variations/master/references',
                )
                .replyWithError('fetch error');
            const context = await replace(FAKE_CONTEXT);
            expect(context).to.deep.equal(EXPECTED);
        });
        it('manages gracefully non 2xx to find entries', async () => {
            nock(FRAGMENT_AUTHOR_URL_PREFIX)
                .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
                .get('/adobe/sites/fragments')
                .query({
                    path: '/content/dam/mas/drafts/fr_FR/dictionary/index',
                })
                .reply(200, DICTIONARY_CF_RESPONSE);
            nock(FRAGMENT_AUTHOR_URL_PREFIX)
                .matchHeader('Authorization', `Bearer ${MOCK_TOKEN}`)
                .get(
                    '/adobe/sites/fragments/fr_FR_dictionary/variations/master/references',
                )
                .reply(500, 'server error');
            const context = await replace(FAKE_CONTEXT);
            expect(context).to.deep.equal(EXPECTED);
        });
    });
});

exports.mockDictionary = mockDictionary;
