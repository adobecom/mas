import { expect } from 'chai';
import sinon from 'sinon';
import { transformer as replace, clearDictionaryCache } from '../../src/fragment/transformers/replace.js';
import DICTIONARY_RESPONSE from './mocks/dictionary.json' with { type: 'json' };
import { createResponse } from './mocks/MockFetch.js';

// acom is the placeholder baseline surface (see locales.js getPlaceholdersBaselineSurface).
const BASELINE_SURFACE = 'acom';
const DEFAULT_SURFACE = 'sandbox';
const DEFAULT_LOCALE = 'fr_FR';

const dictionaryIdFor = (surface, locale) => `${surface}_${locale}_dictionary`;

const odinDomainFor = (preview) => `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;

const byPathUrl = (preview, surface, locale) =>
    `${odinDomainFor(preview)}/adobe/contentFragments/byPath?path=/content/dam/mas/${surface}/${locale}/dictionary/index`;

const directUrl = (preview, id) => `${odinDomainFor(preview)}/adobe/contentFragments/${id}?references=direct-hydrated`;

// Builds a single-level `direct-hydrated` response from a { key: value } map.
const dictFixture = (entries) => {
    const references = {};
    const ids = Object.keys(entries).map((key) => {
        const id = `entry-${key}`;
        references[id] = { type: 'content-fragment', value: { id, fields: { key, value: entries[key] } } };
        return id;
    });
    return { fields: { entries: ids }, references };
};

// Stubs a `direct-hydrated` dictionary layer for (surface, locale): the byPath id lookup + the
// hydrated fragment response.
const mockDirectDictionary = (preview, surface, locale, fixture, stub = fetchStub, id = dictionaryIdFor(surface, locale)) => {
    stub.withArgs(byPathUrl(preview, surface, locale)).returns(createResponse(200, { id }));
    stub.withArgs(directUrl(preview, id)).returns(createResponse(200, fixture));
    return id;
};

// Stubs a (surface, locale) index that resolves to no dictionary (byPath returns no id) — used for the
// acom default layer in tests that keep all content on the surface baseline.
const stubEmptyDictionary = (preview, surface, locale, stub = fetchStub) => {
    stub.withArgs(byPathUrl(preview, surface, locale)).returns(createResponse(200, {}));
};

// Shared helper reused by the pipeline tests: stubs the surface-baseline dictionary (sandbox) for the
// locales the pipeline exercises. The acom default layer falls through to the suite's default 404 stub.
const mockDictionary = (preview = false, stub = fetchStub, cleanCache = true) => {
    if (cleanCache) {
        clearDictionaryCache();
    }
    ['en_US', 'fr_FR', 'de_DE'].forEach((locale) =>
        mockDirectDictionary(preview, DEFAULT_SURFACE, locale, DICTIONARY_RESPONSE, stub),
    );
};

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

const getResponse = async (description, cta, surface = DEFAULT_SURFACE, locale = DEFAULT_LOCALE, cleanCache = true) => {
    if (cleanCache) {
        clearDictionaryCache();
    }
    // acom default layer resolves empty; the surface baseline carries the dictionary content.
    stubEmptyDictionary(false, BASELINE_SURFACE, locale, fetchStub);
    mockDirectDictionary(false, surface, locale, DICTIONARY_RESPONSE, fetchStub);
    const context = {
        surface,
        locale,
        regionLocale: locale,
        defaultLocale: locale,
        loggedTransformer: 'replace',
        requestId: 'mas-replace-ut',
        promises: {},
    };
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
        [`dictionary-id-${DEFAULT_SURFACE}-${DEFAULT_LOCALE}`]: dictionaryIdFor(DEFAULT_SURFACE, DEFAULT_LOCALE),
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

    it('replace init returns null when defaultLanguage init is non-200', async () => {
        const context = {
            surface: DEFAULT_SURFACE,
            locale: DEFAULT_LOCALE,
            loggedTransformer: 'replace',
            requestId: 'mas-replace-ut',
            promises: {
                defaultLanguage: Promise.resolve({ status: 404, message: 'Fragment not found' }),
            },
        };
        const result = await replace.init(context);
        expect(result).to.be.null;
        expect(fetchStub.called).to.be.false;
    });

    it('replace init merges defaultLanguage into context for getDictionary', async () => {
        clearDictionaryCache();
        stubEmptyDictionary(false, BASELINE_SURFACE, DEFAULT_LOCALE, fetchStub);
        mockDirectDictionary(false, DEFAULT_SURFACE, DEFAULT_LOCALE, DICTIONARY_RESPONSE, fetchStub);
        const context = {
            surface: DEFAULT_SURFACE,
            locale: DEFAULT_LOCALE,
            loggedTransformer: 'replace',
            requestId: 'mas-replace-ut',
            promises: {
                defaultLanguage: Promise.resolve({
                    status: 200,
                    locale: DEFAULT_LOCALE,
                    regionLocale: DEFAULT_LOCALE,
                    defaultLocale: DEFAULT_LOCALE,
                    parsedLocale: DEFAULT_LOCALE,
                    surface: DEFAULT_SURFACE,
                    fragmentPath: `/content/dam/mas/${DEFAULT_SURFACE}/${DEFAULT_LOCALE}/ccd-slice-wide-cc-all-app`,
                    body: {},
                }),
            },
        };
        context.promises.replace = replace.init(context);
        const dictionary = await context.promises.replace;
        expect(dictionary).to.be.an('object');
        expect(Object.keys(dictionary).length).to.be.greaterThan(0);
    });

    it('returns 200 & no placeholders', async () => {
        const response = await getResponse('foo', 'Buy now');
        const { fragmentsIds: _omit, ...expected } = expectedResponse('foo');
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

    describe('layering (acom default + surface baseline + region overlay)', () => {
        // sandbox/fr_BE → base language fr_FR: acom/fr_FR (default) + sandbox/fr_FR (baseline) + sandbox/fr_BE (region).
        const layeredContext = () => ({
            surface: 'sandbox',
            locale: 'fr_BE',
            regionLocale: 'fr_BE',
            defaultLocale: 'fr_FR',
            loggedTransformer: 'replace',
            requestId: 'mas-replace-ut',
            promises: {},
        });

        it('resolves each key from the highest-priority layer that defines it', async () => {
            clearDictionaryCache();
            mockDirectDictionary(
                false,
                BASELINE_SURFACE,
                'fr_FR',
                dictFixture({ a: 'acom-a', b: 'acom-b', c: 'acom-c' }),
                fetchStub,
            );
            mockDirectDictionary(false, 'sandbox', 'fr_FR', dictFixture({ b: 'surf-b', c: 'surf-c' }), fetchStub);
            mockDirectDictionary(false, 'sandbox', 'fr_BE', dictFixture({ c: 'region-c' }), fetchStub);
            const context = layeredContext();
            context.body = odinResponse('{{a}} {{b}} {{c}}', null, 'sandbox', 'fr_BE');
            const result = await replace.process(context);
            // a from acom default, b from surface baseline, c from region overlay.
            expect(result.body.fields.description).to.equal('acom-a surf-b region-c');
        });

        it('logs region entries duplicating the inherited baseline only when debugLogs is set', async () => {
            clearDictionaryCache();
            mockDirectDictionary(
                false,
                BASELINE_SURFACE,
                'fr_FR',
                dictFixture({ dup: 'same', other: 'acom-other' }),
                fetchStub,
            );
            stubEmptyDictionary(false, 'sandbox', 'fr_FR', fetchStub);
            mockDirectDictionary(false, 'sandbox', 'fr_BE', dictFixture({ dup: 'same' }), fetchStub);
            const logSpy = sinon.spy(console, 'log');
            try {
                const context = layeredContext();
                context.debugLogs = true;
                context.body = odinResponse('{{dup}}', null, 'sandbox', 'fr_BE');
                await replace.process(context);
                const logged = logSpy
                    .getCalls()
                    .some((c) => c.args[0]?.includes('duplicating baseline') && c.args[0]?.includes('dup'));
                expect(logged).to.be.true;
            } finally {
                logSpy.restore();
            }
        });

        it('tolerates a layer response without a references map', async () => {
            clearDictionaryCache();
            stubEmptyDictionary(false, BASELINE_SURFACE, 'fr_FR', fetchStub);
            mockDirectDictionary(false, 'sandbox', 'fr_FR', { fields: { entries: [] } }, fetchStub);
            mockDirectDictionary(false, 'sandbox', 'fr_BE', { fields: { entries: [] } }, fetchStub);
            const context = layeredContext();
            context.body = odinResponse('{{view-account}}', null, 'sandbox', 'fr_BE');
            const result = await replace.process(context);
            // every layer empty → nothing to replace, placeholder left intact.
            expect(result.body.fields.description).to.equal('{{view-account}}');
        });
    });

    describe('region reachability by country', () => {
        // On acom, IN/AU are regions of en_GB. For placeholders they must still be reachable by country
        // from an en_US request — overlaid onto the request's own base language.
        it('reaches en_IN from an en_US request and bases it on en_US', async () => {
            clearDictionaryCache();
            mockDirectDictionary(false, BASELINE_SURFACE, 'en_US', dictFixture({ 'view-account': 'View account' }), fetchStub);
            mockDirectDictionary(false, BASELINE_SURFACE, 'en_IN', dictFixture({ 'ip-duration': 'year' }), fetchStub);
            const context = {
                surface: 'acom',
                locale: 'en_US',
                country: 'IN',
                regionLocale: 'en_US',
                defaultLocale: 'en_US',
                loggedTransformer: 'replace',
                requestId: 'mas-replace-ut',
                promises: {},
            };
            context.body = odinResponse('{{view-account}} {{ip-duration}}', null, 'acom', 'en_US');
            const result = await replace.process(context);
            // en_US base + en_IN overlay; en_GB is never consulted.
            expect(result.body.fields.description).to.equal('View account year');
            expect(fetchStub.calledWith(byPathUrl(false, BASELINE_SURFACE, 'en_GB'))).to.be.false;
        });

        it('reaches en_IN from an en_GB request and bases it on en_GB', async () => {
            clearDictionaryCache();
            mockDirectDictionary(
                false,
                BASELINE_SURFACE,
                'en_GB',
                dictFixture({ 'view-account': 'View account (GB)' }),
                fetchStub,
            );
            mockDirectDictionary(false, BASELINE_SURFACE, 'en_IN', dictFixture({ 'ip-duration': 'year' }), fetchStub);
            const context = {
                surface: 'acom',
                locale: 'en_GB',
                country: 'IN',
                regionLocale: 'en_IN',
                defaultLocale: 'en_GB',
                loggedTransformer: 'replace',
                requestId: 'mas-replace-ut',
                promises: {},
            };
            context.body = odinResponse('{{view-account}} {{ip-duration}}', null, 'acom', 'en_GB');
            const result = await replace.process(context);
            // en_GB base + en_IN overlay; en_US is never consulted.
            expect(result.body.fields.description).to.equal('View account (GB) year');
            expect(fetchStub.calledWith(byPathUrl(false, BASELINE_SURFACE, 'en_US'))).to.be.false;
        });
    });

    describe('corner cases', () => {
        const FAKE_CONTEXT = {
            status: 200,
            surface: DEFAULT_SURFACE,
            locale: DEFAULT_LOCALE,
            regionLocale: DEFAULT_LOCALE,
            defaultLocale: DEFAULT_LOCALE,
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

        const surfaceByPath = byPathUrl(false, DEFAULT_SURFACE, DEFAULT_LOCALE);
        const surfaceContentUrl = directUrl(false, dictionaryIdFor(DEFAULT_SURFACE, DEFAULT_LOCALE));

        beforeEach(() => {
            // acom default layer resolves empty in these tests; the surface baseline is the one under test.
            stubEmptyDictionary(false, BASELINE_SURFACE, DEFAULT_LOCALE, fetchStub);
        });

        it('manages gracefully missing surface without fetching', async () => {
            const context = { ...FAKE_CONTEXT };
            delete context.surface;
            const result = await replace.process(context);
            expect(fetchStub.called).to.be.false;
            expect(result.status).to.equal(200);
        });

        it('manages gracefully fetch failure to find dictionary', async () => {
            fetchStub.withArgs(surfaceByPath).rejects(new Error('fetch error'));
            const context = await replace.process({ ...FAKE_CONTEXT });
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully non 2xx to find dictionary', async () => {
            fetchStub.withArgs(surfaceByPath).returns(createResponse(404, 'not found', 'Not Found'));
            const context = await replace.process({ ...FAKE_CONTEXT });
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully fetch no dictionary index', async () => {
            fetchStub.withArgs(surfaceByPath).returns(createResponse(200, { items: [] }));
            const context = await replace.process({ ...FAKE_CONTEXT });
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully 200 response with null body when fetching dictionary id', async () => {
            fetchStub.withArgs(surfaceByPath).returns(
                Promise.resolve({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { entries: () => [] },
                    json: async () => null,
                }),
            );
            const context = await replace.process({ ...FAKE_CONTEXT });
            expect(context).to.deep.include(EXPECTED);
        });

        it('manages gracefully failure to find entries', async () => {
            fetchStub
                .withArgs(surfaceByPath)
                .returns(createResponse(200, { id: dictionaryIdFor(DEFAULT_SURFACE, DEFAULT_LOCALE) }));
            fetchStub.withArgs(surfaceContentUrl).rejects(new Error('fetch error'));
            const context = await replace.process({ ...FAKE_CONTEXT });
            expect(context.body).to.deep.equal(EXPECTED.body);
        });
        it('manages gracefully non 2xx to find entries', async () => {
            fetchStub
                .withArgs(surfaceByPath)
                .returns(createResponse(200, { id: dictionaryIdFor(DEFAULT_SURFACE, DEFAULT_LOCALE) }));
            fetchStub.withArgs(surfaceContentUrl).returns(createResponse(500, 'server error', 'Internal Server Error'));
            const context = await replace.process({ ...FAKE_CONTEXT });
            expect(context.body).to.deep.equal(EXPECTED.body);
        });
    });

    describe('dictionary caching', () => {
        const baseContentCalls = () =>
            fetchStub
                .getCalls()
                .filter((c) =>
                    c.args[0]?.includes(`${dictionaryIdFor(DEFAULT_SURFACE, DEFAULT_LOCALE)}?references=direct-hydrated`),
                );

        it('uses cached surface dictionary on second request (no extra fetch)', async () => {
            const response1 = await getResponse(
                'please {{view-account}}',
                '{{buy-now}}',
                DEFAULT_SURFACE,
                DEFAULT_LOCALE,
                true,
            );
            expect(response1.body.fields.cta).to.equal('Buy now');
            const response2 = await getResponse(
                'please {{view-account}}',
                '{{buy-now}}',
                DEFAULT_SURFACE,
                DEFAULT_LOCALE,
                false,
            );
            expect(response2.body.fields.cta).to.equal('Buy now');
            expect(baseContentCalls()).to.have.length(1);
        });

        it('caches dictionary with 200 and reuses it within TTL', async () => {
            const response = await getResponse('{{view-account}}', '{{buy-now}}', DEFAULT_SURFACE, DEFAULT_LOCALE, true);
            expect(response.body.fields.description).to.equal('View account');
            expect(baseContentCalls()).to.have.length(1);
            const response2 = await getResponse('{{view-account}}', '{{buy-now}}', DEFAULT_SURFACE, DEFAULT_LOCALE, false);
            expect(response2.body.fields.description).to.equal('View account');
            expect(baseContentCalls()).to.have.length(1);
        });
    });
});

export { mockDictionary };
