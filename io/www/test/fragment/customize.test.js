import { expect } from 'chai';
import nock from 'nock';
import { MockState } from './mocks/MockState.js';
import {
    getCorrespondingLocale,
    getRegionalVariations,
    transformer as customize,
} from '../../src/fragment/transformers/customize.js';
import FRAGMENT_RESPONSE_FR from './mocks/fragment-fr.json' with { type: 'json' };
import FRAGMENT_RESPONSE_EN from './mocks/fragment-en-default.json' with { type: 'json' };
import { context } from 'esbuild';

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

function nockFrenchFragment() {
    nock('https://odin.adobe.com')
        .get(`/adobe/sites/fragments/some-fr-fr-fragment?references=all-hydrated`)
        .reply(200, FRAGMENT_RESPONSE_FR)
        .persist();
    nock('https://odin.adobe.com')
        .get('/adobe/sites/fragments')
        .query({ path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app' })
        .reply(200, {
            items: [
                {
                    path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                    id: 'some-fr-fr-fragment',
                    some: 'corps',
                },
            ],
        })
        .persist();
}

describe('customize subfunctions', function () {
    afterEach(function () {
        nock.cleanAll();
    });

    it('getCorrespondingLocale should return correct default locale', function () {
        expect(getCorrespondingLocale('fr_CA')).to.equal('fr_FR');
        expect(getCorrespondingLocale('fr_FR')).to.equal('fr_FR');
        expect(getCorrespondingLocale('fr_CH')).to.equal('fr_FR');
        expect(getCorrespondingLocale('en_AU')).to.equal('en_US');
        expect(getCorrespondingLocale('en_US')).to.equal('en_US');
        expect(getCorrespondingLocale('en_CA')).to.equal('en_US');
        expect(getCorrespondingLocale('es_MX')).to.equal('es_ES');
        expect(getCorrespondingLocale('es_ES')).to.equal('es_ES');
        expect(getCorrespondingLocale('de_DE')).to.equal('de_DE');
        expect(getCorrespondingLocale('it_IT')).to.equal('it_IT');
        expect(getCorrespondingLocale('ja_JP')).to.equal('ja_JP');
        expect(getCorrespondingLocale('zh_CN')).to.equal('zh_CN');
        expect(getCorrespondingLocale('zh_TW')).to.equal('zh_TW');
    });

    it('getRegionalVariations should return both default and local variation if any', async function () {
        nockFrenchFragment();
        const caRegionalVariations = await getRegionalVariations({
            ...FAKE_CONTEXT,
            locale: 'fr_CA',
            fragmentPath: 'ccd-slice-wide-cc-all-app',
        });
        expect(caRegionalVariations.variations.map((v) => v.path)).to.deep.equal([
            '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            '/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app',
        ]);
        expect(caRegionalVariations.variations[0].fields.description).to.be.not.empty;
        expect(caRegionalVariations.variations[1].fields.description).to.be.not.empty;
        const chRegionalVariations = await getRegionalVariations({
            ...FAKE_CONTEXT,
            locale: 'fr_CH',
            fragmentPath: 'ccd-slice-wide-cc-all-app',
        });
        expect(chRegionalVariations.variations.map((v) => v.path)).to.deep.equal([
            '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            '/content/dam/mas/sandbox/fr_CH/ccd-slice-wide-cc-all-app',
        ]);
        const beRegionalVariations = await getRegionalVariations({
            ...FAKE_CONTEXT,
            locale: 'fr_BE',
            fragmentPath: 'ccd-slice-wide-cc-all-app',
        });
        expect(beRegionalVariations.variations.map((v) => v.path)).to.deep.equal([
            '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        ]);
        const inRegionalVariations = await getRegionalVariations({
            ...FAKE_CONTEXT,
            body: FRAGMENT_RESPONSE_EN,
            locale: 'en_IN',
            fragmentPath: 'ccd-slice-wide-cc-all-app',
        });
        expect(inRegionalVariations.variations.map((v) => v.path)).to.deep.equal([
            '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
            '/content/dam/mas/sandbox/en_IN/ccd-slice-wide-cc-all-app',
        ]);
    });

    it('getRegionalVariations should return empty array in case a default language is not found', async function () {
        const xxRegionalVariations = await getRegionalVariations({
            ...FAKE_CONTEXT,
            locale: 'xx_XX',
            fragmentPath: 'ccd-slice-wide-cc-all-app',
        });
        expect(xxRegionalVariations.status).to.equal(404);
    });

    it('getRegionalVariations should return null in case some error happens', async function () {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app' })
            .reply(404);
        const caRegionalVariations = await getRegionalVariations({
            ...FAKE_CONTEXT,
            locale: 'fr_CA',
            fragmentPath: 'ccd-slice-wide-cc-all-app',
        });
        expect(caRegionalVariations.status).to.equal(503);
    });
});

async function process(context) {
    const initContext = { ...context };
    context.promises = {};
    context.promises.customize = customize.init(initContext);
    return await customize.process(context);
}

describe('customize typical cases', function () {
    afterEach(function () {
        nock.cleanAll();
    });

    it('should return fr fragment (us fragment, fr locale)', async function () {
        // french fragment by id
        nockFrenchFragment();

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

    it('should return fr fragment (us fragment, fr_BE locale)', async function () {
        // french fragment by id
        nock('https://odin.adobe.com')
            .get(`/adobe/sites/fragments/some-fr-fr-fragment?references=all-hydrated`)
            .reply(200, FRAGMENT_RESPONSE_FR);
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app')
            .reply(200, {
                items: [
                    {
                        path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                        id: 'some-fr-fr-fragment',
                        some: 'corps',
                    },
                ],
            });
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

    it('should return en_US fragment (us fragment, en_AU locale)', async function () {
        const usFragment = structuredClone(FRAGMENT_RESPONSE_FR);
        usFragment.path = '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app';
        // french fragment by id
        nock('https://odin.adobe.com')
            .get(`/adobe/sites/fragments/some-en-us-fragment?references=all-hydrated`)
            .reply(200, usFragment);
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/en_US/some-en-us-fragment')
            .reply(200, {
                items: [
                    {
                        path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
                        id: 'some-en-us-fragment',
                        some: 'body',
                    },
                ],
            });

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'en_AU',
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
        expect(result.body).to.deep.equal({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            some: 'corps',
        });
    });
});

describe('customize corner cases', function () {
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
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/someFragment')
            .reply(404, {
                message: 'Not found',
            });

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
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app')
            .reply(200, {
                items: [
                    {
                        path: '/content/dam/mas/sandbox/fr_FR/someFragment',
                        id: 'some-fr-fr-fragment-server-error',
                    },
                ],
            });

        nock('https://odin.adobe.com').get('/adobe/sites/fragments?path=/some-fr-fr-fragment-server-error').reply(500, {
            message: 'Error',
        });

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
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app' })
            .reply(200, {
                items: [],
            });

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
        expect(result.body).to.deep.equal({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            some: 'body',
        });
    });
});

describe('corresponding local corner case', function () {
    it('locale with no default should be returned', async function () {
        const locale = getCorrespondingLocale('zh_TW');
        expect(locale).to.equal('zh_TW');
    });
});
