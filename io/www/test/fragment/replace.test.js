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

// Stubs a (surface, locale) index that has NO authored dictionary — byPath returns 404, exactly as
// Odin does for an absent layer (e.g. the region overlay ccd/en_AU). A 404 on a region overlay is a
// stable absence and is cached (empty layer, not re-fetched); a 404 on a base layer is treated as
// transient and is NOT cached (see buildDictionaryLayer) — both resolve to `{}` for the merge.
const stubEmptyDictionary = (preview, surface, locale, stub = fetchStub) => {
    stub.withArgs(byPathUrl(preview, surface, locale)).returns(createResponse(404, null, 'not found'));
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

    describe('system placeholders (plan-type-text)', () => {
        const buildContext = () => ({
            surface: DEFAULT_SURFACE,
            locale: DEFAULT_LOCALE,
            regionLocale: DEFAULT_LOCALE,
            defaultLocale: DEFAULT_LOCALE,
            loggedTransformer: 'replace',
            requestId: 'mas-replace-ut',
            promises: {},
        });

        const initContext = async (dictionaryFixture = DICTIONARY_RESPONSE) => {
            clearDictionaryCache();
            stubEmptyDictionary(false, BASELINE_SURFACE, DEFAULT_LOCALE, fetchStub);
            mockDirectDictionary(false, DEFAULT_SURFACE, DEFAULT_LOCALE, dictionaryFixture, fetchStub);
            const context = buildContext();
            context.promises.replace = replace.init(context);
            await context.promises.replace;
            return context;
        };

        it('resolves {{plan-type-text}} to the legal inline-price marker', async () => {
            const context = await initContext();
            context.body = odinResponse('legal: {{plan-type-text}}');
            const response = await replace.process(context);
            const { description } = response.body.fields;
            expect(description).to.contain('is="inline-price"');
            expect(description).to.contain('data-template="legal"');
            expect(description).to.contain('data-placeholder="plan-type-text"');
        });

        it('resolves the system placeholder regardless of fragment model', async () => {
            const context = await initContext();
            context.body = { ...odinResponse('legal: {{plan-type-text}}'), model: { id: 'some-other-model' } };
            const response = await replace.process(context);
            expect(response.body.fields.description).to.contain('data-placeholder="plan-type-text"');
        });

        it('system placeholder wins over an Odin dictionary entry of the same key', async () => {
            const dict = structuredClone(DICTIONARY_RESPONSE);
            dict.references[Object.keys(dict.references)[0]].value.fields = {
                key: 'plan-type-text',
                value: 'SHOULD_NOT_WIN',
            };
            const context = await initContext(dict);
            context.body = odinResponse('x {{plan-type-text}}');
            const response = await replace.process(context);
            expect(response.body.fields.description).to.contain('data-placeholder="plan-type-text"');
            expect(response.body.fields.description).to.not.contain('SHOULD_NOT_WIN');
        });
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

        it('overlays a non-acom surface baseline onto the acom base (no region)', async () => {
            // ccd/en_US request: acom/en_US global baseline + ccd/en_US surface baseline; region is skipped
            // (regionLocale === baseLocale). The surface baseline wins where both define a key.
            clearDictionaryCache();
            mockDirectDictionary(false, BASELINE_SURFACE, 'en_US', dictFixture({ a: 'acom-a', b: 'acom-b' }), fetchStub);
            mockDirectDictionary(false, 'ccd', 'en_US', dictFixture({ b: 'ccd-b', c: 'ccd-c' }), fetchStub);
            const context = {
                surface: 'ccd',
                locale: 'en_US',
                regionLocale: 'en_US',
                defaultLocale: 'en_US',
                loggedTransformer: 'replace',
                requestId: 'mas-replace-ut',
                promises: {},
            };
            context.body = odinResponse('{{a}} {{b}} {{c}}', null, 'ccd', 'en_US');
            const result = await replace.process(context);
            // a from acom base, b from ccd surface baseline (overriding acom), c from ccd surface baseline.
            expect(result.body.fields.description).to.equal('acom-a ccd-b ccd-c');
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

    // Regression for the absent-region herd surfaced by the dictionary-herd load test: a 404 (no
    // dictionary authored for a region overlay, e.g. ccd/en_AU) must be cached, not re-fetched on
    // every request. Transient failures must NOT be cached, so they retry.
    describe('caching absence of a dictionary layer', () => {
        const layeredContext = () => ({
            surface: 'sandbox',
            locale: 'fr_BE',
            regionLocale: 'fr_BE',
            defaultLocale: 'fr_FR',
            loggedTransformer: 'replace',
            requestId: 'mas-replace-ut',
            promises: {},
        });
        const runOnce = async () => {
            const context = layeredContext();
            context.body = odinResponse('{{a}} {{b}}', null, 'sandbox', 'fr_BE');
            return replace.process(context);
        };
        const regionByPath = () => fetchStub.withArgs(byPathUrl(false, 'sandbox', 'fr_BE'));

        it('caches an absent region layer (404): byPath fetched once across repeated requests', async () => {
            clearDictionaryCache();
            mockDirectDictionary(false, BASELINE_SURFACE, 'fr_FR', dictFixture({ a: 'acom-a' }), fetchStub);
            mockDirectDictionary(false, 'sandbox', 'fr_FR', dictFixture({ b: 'surf-b' }), fetchStub);
            stubEmptyDictionary(false, 'sandbox', 'fr_BE', fetchStub); // region overlay absent → 404
            const first = await runOnce();
            const second = await runOnce();
            // base + surface resolve; absent region contributes nothing (falls back to base language).
            expect(first.body.fields.description).to.equal('acom-a surf-b');
            expect(second.body.fields.description).to.equal('acom-a surf-b');
            // The 404 is cached: the absent-region byPath is hit ONCE, not once per request.
            expect(regionByPath().callCount).to.equal(1);
        });

        it('does not cache a transient failure (503): byPath retried on the next request', async () => {
            clearDictionaryCache();
            mockDirectDictionary(false, BASELINE_SURFACE, 'fr_FR', dictFixture({ a: 'acom-a' }), fetchStub);
            mockDirectDictionary(false, 'sandbox', 'fr_FR', dictFixture({ b: 'surf-b' }), fetchStub);
            regionByPath().returns(createResponse(503, null, 'service unavailable'));
            await runOnce();
            const afterFirst = regionByPath().callCount;
            await runOnce();
            // 503 is transient → not cached → the second request re-attempts the region byPath
            // (unlike the 404 case, which is cached and never re-fetched).
            expect(regionByPath().callCount).to.be.greaterThan(afterFirst);
        });

        it('does NOT cache a 404 on the shared base layer: byPath retried so it self-heals', async () => {
            // Unlike a region overlay, the acom/<base> layer is expected to exist. A 404 there is a
            // transient mid-publish/softpurge race, not a stable absence — caching {} would render raw
            // {{tokens}} fleet-wide until TTL. So a base 404 is not cached and retries next request.
            clearDictionaryCache();
            const baseByPath = () => fetchStub.withArgs(byPathUrl(false, BASELINE_SURFACE, 'fr_FR'));
            baseByPath().returns(createResponse(404, null, 'not found'));
            mockDirectDictionary(false, 'sandbox', 'fr_FR', dictFixture({ b: 'surf-b' }), fetchStub);
            stubEmptyDictionary(false, 'sandbox', 'fr_BE', fetchStub); // region overlay absent
            const first = await runOnce();
            const afterFirst = baseByPath().callCount;
            const second = await runOnce();
            // base contributes nothing while it 404s (unknown key → bare key), surface baseline resolves.
            expect(first.body.fields.description).to.equal('a surf-b');
            expect(second.body.fields.description).to.equal('a surf-b');
            // base 404 is transient → re-fetched on the next request (not cached).
            expect(baseByPath().callCount).to.be.greaterThan(afterFirst);
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
