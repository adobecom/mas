import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';
import { MockState } from './mocks/MockState.js';
import { deepMerge, transformer as customize } from '../../src/fragment/transformers/customize.js';
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

    it('should merge personalization (PZN) variation when pznTags match regionLocale', async function () {
        const pznVariationId = 'pzn-var-en-kw';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: { value: 'default badge', mimeType: 'text/html' },
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/pzn/sandbox/promo',
                        id: pznVariationId,
                        title: 'PZN Promo',
                        fields: [
                            { name: 'pznTags', values: ['en_KW'] },
                            { name: 'badge', values: ['Kuwait PZN badge'] },
                        ],
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_KW',
            parsedLocale: 'en_US',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields).to.be.an('array');
        const badgeField = result.body.fields.find((f) => f.name === 'badge');
        expect(badgeField).to.exist;
        expect(badgeField.values).to.include('Kuwait PZN badge');
    });

    it('should not merge personalization variation when no pznTags match regionLocale', async function () {
        const pznVariationId = 'pzn-var-other';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: { value: 'default badge', mimeType: 'text/html' },
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/pzn/sandbox/promo',
                        id: pznVariationId,
                        title: 'PZN Promo',
                        fields: [
                            { name: 'pznTags', values: ['en_AE', 'fr_FR'] },
                            { name: 'badge', values: ['Other badge'] },
                        ],
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_KW',
            parsedLocale: 'en_US',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.deep.include({ value: 'default badge', mimeType: 'text/html' });
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

    it('should return swiss fragment with override (us fragment, fr locale, ch country)', async function () {
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

    it('should return french fragment if country is not supported (us fragment, fr locale, zz country)', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_ZZ',
            country: 'ZZ',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return 400 if language is not supported', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'zz_CH',
            country: 'CH',
        });
        expect(result.status).to.equal(400);
        expect(result.message).to.equal("Default locale not found for requested locale 'zz_CH'");
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
