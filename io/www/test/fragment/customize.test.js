import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';
import { MockState } from './mocks/MockState.js';
import { deepMerge, getCorrespondingLocale, transformer as customize } from '../../src/fragment/transformers/customize.js';
import FRAGMENT_RESPONSE_FR from './mocks/fragment-fr.json' with { type: 'json' };
import FRAGMENT_COLL_RESPONSE_US from './mocks/collection-customization.json' with { type: 'json' };

const FAKE_CONTEXT = {
    status: 200,
    state: new MockState(),
    surface: 'sandbox',
    parsedLocale: 'en_US',
    networkConfig: {
        retries: 1,
        retryDelay: 0,
    },
    loggedTransformer: 'customize',
    requestId: 'mas-customize-ut',
};

let fetchStub;

function mockFrenchFragment() {
    fetchStub
        .withArgs('https://odin.adobe.com/adobe/sites/fragments/some-fr-fr-fragment?references=all-hydrated')
        .returns(createResponse(200, FRAGMENT_RESPONSE_FR));
    fetchStub
        .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app')
        .returns(
            createResponse(200, {
                items: [
                    {
                        path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                        id: 'some-fr-fr-fragment',
                        some: 'corps',
                    },
                ],
            }),
        );
}

describe('customize subfunctions', function () {
    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('getCorrespondingLocale should return correct default locale', function () {
        expect(getCorrespondingLocale('sandbox', 'fr_CA', 'fr_CA'), 'should return fr_FR for fr_CA for sandbox').to.equal('fr_FR');
        expect(getCorrespondingLocale('sandbox', 'fr_FR', 'fr_FR'), 'should return fr_FR for fr_FR for sandbox').to.equal('fr_FR');
        expect(getCorrespondingLocale('sandbox', 'fr_CH', 'fr_CH'), 'should return fr_FR for fr_CH for sandbox').to.equal('fr_FR');
        expect(getCorrespondingLocale('sandbox', 'en_EG', 'en_EG'), 'should return en_US for en_EG for sandbox').to.equal('en_US');
        expect(getCorrespondingLocale('sandbox', 'en_US', 'en_US'), 'should return en_US for en_US for sandbox').to.equal('en_US');
        expect(getCorrespondingLocale('sandbox', 'en_CA', 'en_CA'), 'should return en_US for en_CA for sandbox').to.equal('en_US');
        expect(getCorrespondingLocale('sandbox', 'es_MX', 'es_MX'), 'should return es_ES for es_MX for sandbox').to.equal('es_ES');
        expect(getCorrespondingLocale('sandbox', 'es_ES', 'es_ES'), 'should return es_ES for es_ES for sandbox').to.equal('es_ES');
        expect(getCorrespondingLocale('sandbox', 'de_DE', 'de_DE'), 'should return de_DE for de_DE for sandbox').to.equal('de_DE');
        expect(getCorrespondingLocale('sandbox', 'it_IT', 'it_IT'), 'should return it_IT for it_IT for sandbox').to.equal('it_IT');
        expect(getCorrespondingLocale('sandbox', 'ja_JP', 'ja_JP'), 'should return ja_JP for ja_JP for sandbox').to.equal('ja_JP');
        expect(getCorrespondingLocale('sandbox', 'zh_CN', 'zh_CN'), 'should return zh_CN for zh_CN for sandbox').to.equal('zh_CN');
        expect(getCorrespondingLocale('sandbox', 'zh_TW', 'zh_TW'), 'should return zh_TW for zh_TW for sandbox').to.equal('zh_TW');

        // for acom AU and IN fall back to GB, pt_BR exists as a default language
        expect(getCorrespondingLocale('acom', 'en_GB', 'en_GB'), 'should return en_GB for en_GB for acom').to.equal('en_GB');
        expect(getCorrespondingLocale('acom', 'en_AU', 'en_AU'), 'should return en_GB for en_AU for acom').to.equal('en_GB');
        expect(getCorrespondingLocale('acom', 'en_IN', 'en_IN'), 'should return en_GB for en_IN for acom').to.equal('en_GB');
        expect(getCorrespondingLocale('acom', 'pt_PT', 'pt_PT'), 'should return pt_PT for pt_PT for acom').to.equal('pt_PT');
        expect(getCorrespondingLocale('acom', 'pt_BR', 'pt_BR'), 'should return pt_BR for pt_BR for acom').to.equal('pt_BR');

        // for ccd AU and IN fall back to US, pt_PT is a variation of pt_BR
        expect(getCorrespondingLocale('ccd', 'pt_PT', 'pt_BR'), 'should return pt_BR for pt_PT for ccd').to.equal('pt_BR');
        expect(getCorrespondingLocale('ccd', 'en_AU', 'en_AU'), 'should return en_US for en_AU for ccd').to.equal('en_US');
        expect(getCorrespondingLocale('ccd', 'en_IN', 'en_IN'), 'should return en_US for en_IN for ccd').to.equal('en_US');

        expect(getCorrespondingLocale(null, 'pt_BR', 'pt_PT'), 'should return parsedLocale if no surface').to.equal('pt_PT');
        expect(getCorrespondingLocale('commerce', null, 'pt_PT'), 'should return parsedLocale if no locale').to.equal('pt_PT');
    });
});

describe('customize collections', function () {
    it('should have a working deep Merge function', function () {
        const obj1 = {
            a: 1,
            b: {
                c: 2,
                d: 3,
            },
            e: [1, 2, 3],
            h: [7, 8],
        };
        const obj2 = {
            b: {
                c: 20,
                f: 4,
            },
            e: [4, 5],
            g: 6,
            h: [],
        };
        const expected = {
            a: 1,
            b: {
                c: 20,
                d: 3,
                f: 4,
            },
            e: [4, 5],
            g: 6,
            h: [7, 8],
        };
        const result = deepMerge(obj1, obj2);
        expect(result).to.deep.equal(expected);
    });

    it('should customize subcollections and sub fragments', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'another-collection',
            locale: 'en_KW',
            id: 'coll-en-us',
            body: FRAGMENT_COLL_RESPONSE_US,
        });

        expect(result.status).to.equal(200);

        expect(result.body.fields.collections[0], 'expecting main fragment collections field to be customized').to.equal(
            'subcoll-en-kw',
        );

        expect(
            result.body.referencesTree[0].identifier,
            'expecting main fragment reference tree field to be customized as well',
        ).to.equal('subcoll-en-kw');

        expect(
            result.body.references['subcoll-en-kw'].value.fields.cards,
            'expecting cards field in references to be customized',
        ).to.deep.equal(['some-card-en-us', 'some-other-card-en-kw']);

        expect(
            result.body.referencesTree[0].referencesTree[0].identifier,
            'expecting 1st card to not be customized in references tree',
        ).to.deep.equal('some-card-en-us');

        expect(
            result.body.referencesTree[0].referencesTree[1].identifier,
            'expecting 2nd card to be customized in references tree',
        ).to.deep.equal('some-other-card-en-kw');

        const cardKW = result.body.references['some-other-card-en-kw'].value;
        expect(cardKW.title).to.equal('Photography Promo KW');
        expect(cardKW.fields.cardTitle).to.equal('Photography  (1TB)');
        expect(cardKW.fields.backgroundImage).to.equal('https://www.adobe.com/my/image.jpg');
    });
});

async function process(context) {
    const initContext = { ...context };
    context.promises = {};
    context.promises.customize = customize.init(initContext);
    return await customize.process(context);
}

describe('customize typical cases', function () {
    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('should return fr fragment (us fragment, fr locale)', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return canadian fragment with override (us fragment, fr locale, ca country)', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
            country: 'CA',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app',
        });
        expect(result.body.fields.badge.value).to.equal('canadian card');
        expect(result.body.fields.description.value).to.equal('<p>french default description</p>');
        //icons should have been overridden
        expect(result.body.fields.mnemonicIcon.length).to.equal(2);
    });

    it('should surface error when default locale fragment fetch fails', async function () {
        const fragmentPath = 'ccd-slice-wide-cc-all-app';
        const defaultLocaleId = 'some-fr-fr-fragment';
        fetchStub
            .withArgs(`https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/${fragmentPath}`)
            .returns(
                createResponse(200, {
                    items: [
                        {
                            path: `/content/dam/mas/sandbox/fr_FR/${fragmentPath}`,
                            id: defaultLocaleId,
                        },
                    ],
                }),
            );
        fetchStub
            .withArgs(`https://odin.adobe.com/adobe/sites/fragments/${defaultLocaleId}?references=all-hydrated`)
            .returns(createResponse(503, { detail: 'fetch error' }, 'Service Unavailable'));

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath,
            locale: 'fr_CA',
        });

        expect(result.status).to.equal(503);
        expect(result.message).to.equal('fetch error');
    });

    it('should return canadian fragment with override (us fragment, fr locale, ch country)', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
            country: 'CH',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_CH/ccd-slice-wide-cc-all-app',
        });
        expect(result.body.fields.badge.value).to.equal('swiss card');
        expect(result.body.fields.description.value).to.equal('<p>swiss description</p>');
        //icons should have been inherited
        expect(result.body.fields.mnemonicIcon.length).to.equal(1);
    });

    it('should return fr fragment (us fragment, fr_BE locale)', async function () {
        // french fragment by id
        mockFrenchFragment();
        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            locale: 'fr_BE',
            fragmentPath: 'ccd-slice-wide-cc-all-app',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return en_US fragment (us fragment, en_KW locale)', async function () {
        const usFragment = structuredClone(FRAGMENT_RESPONSE_FR);
        usFragment.path = '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app';
        usFragment.fields.variations = [''];
        // french fragment by id
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments/some-en-us-fragment?references=all-hydrated')
            .returns(createResponse(200, usFragment));
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/en_US/some-en-us-fragment')
            .returns(
                createResponse(200, {
                    items: [
                        {
                            path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
                            id: 'some-en-us-fragment',
                            some: 'body',
                        },
                    ],
                }),
            );

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'en_KW',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return fr fragment (fr fragment, no locale)', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            body: {
                path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                some: 'corps',
            },
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            some: 'corps',
        });
    });
});

describe('customize corner cases', function () {
    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('no path should return 400', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            body: {},
            surface: 'sandbox',
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            message: 'Missing surface or fragmentPath',
            status: 400,
        });
    });

    it('no fragmentPath should return 400', async function () {
        expect(
            await process({
                status: 200,
                fragmentPath: 'bar',
                locale: 'fr_FR',
            }),
        ).to.deep.equal({
            message: 'Missing surface or fragmentPath',
            status: 400,
        });
    });

    it('should return 503 when default locale fetch failed', async function () {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/someFragment')
            .returns(
                createResponse(
                    404,
                    {
                        message: 'Not found',
                    },
                    'Not Found',
                ),
            );

        const result = await process({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/someFragment' },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 503,
            message: 'fetch error',
        });
    });

    it('should return 500 when default locale fetch by id failed', async function () {
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            )
            .returns(
                createResponse(200, {
                    items: [
                        {
                            path: '/content/dam/mas/sandbox/fr_FR/someFragment',
                            id: 'some-fr-fr-fragment-server-error',
                        },
                    ],
                }),
            );

        fetchStub.withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/some-fr-fr-fragment-server-error').returns(
            createResponse(
                500,
                {
                    message: 'Error',
                },
                'Internal Server Error',
            ),
        );

        const result = await process({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/someFragment' },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 503,
            message: 'fetch error',
        });
    });

    it('should return 404 when default locale has no items', async function () {
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            )
            .returns(
                createResponse(200, {
                    items: [],
                }),
            );

        const result = await process({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app' },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 404,
            message: 'Fragment not found',
        });
    });

    it('same locale should return same body', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                some: 'body',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            parsedLocale: 'fr_FR',
            surface: 'sandbox',
            locale: 'fr_FR',
        });
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            some: 'body',
        });
    });
});

describe('corresponding local corner case', function () {
    it('locale with no default should be returned as is', async function () {
        const locale = getCorrespondingLocale('sandbox', 'bb_BB', 'bb_BB');
        expect(locale).to.equal('bb_BB');
    });
});
