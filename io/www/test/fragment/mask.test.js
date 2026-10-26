import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';
import { clearMaskCache, transformer as mask } from '../../src/fragment/transformers/mask.js';

const BASE = {
    status: 200,
    surface: 'sandbox',
    networkConfig: { retries: 1, retryDelay: 0, fetchTimeout: 2000 },
    requestId: 'mask-ut',
    loggedTransformer: 'mask',
};

const MASK_BODY = {
    id: 'mask-id',
    path: '/content/dam/mas/sandbox/en_US/masks/promo',
    fields: { badge: 'MASKED BADGE' },
    references: { 'should-be-skimmed': { type: 'content-fragment', value: {} } },
    referencesTree: [{ fieldName: 'cards', identifier: 'x' }],
};

const byPathUrl = (locale, name) =>
    `https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/${locale}/masks/${name}`;
const hydrateUrl = (id) => `https://odin.adobe.com/adobe/contentFragments/${id}`;

function withLocale(regionLocale, defaultLocale, extra = {}) {
    return {
        ...BASE,
        promises: { defaultLanguage: Promise.resolve({ defaultLocale, regionLocale }) },
        ...extra,
    };
}

let fetchStub;

describe('mask transformer init', function () {
    beforeEach(function () {
        clearMaskCache();
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(function () {
        fetchStub.restore();
    });

    function mockMaskFound(locale, name) {
        fetchStub.withArgs(byPathUrl(locale, name)).returns(createResponse(200, { id: 'mask-id' }));
        fetchStub.withArgs(hydrateUrl('mask-id')).returns(createResponse(200, MASK_BODY));
    }

    it('resolves the mask at the regional locale and strips its references', async function () {
        mockMaskFound('en_US', 'promo');
        const result = await mask.init(withLocale('en_US', 'en_US', { mask: 'promo' }));
        expect(result.fields.badge).to.equal('MASKED BADGE');
        expect(result.references).to.be.undefined;
        expect(result.referencesTree).to.be.undefined;
    });

    it('falls back to the default locale when the regional mask is missing', async function () {
        fetchStub.withArgs(byPathUrl('fr_CA', 'zorro')).returns(createResponse(404, {}, 'Not Found'));
        fetchStub.withArgs(byPathUrl('fr_FR', 'zorro')).returns(createResponse(200, { id: 'mask-id' }));
        fetchStub.withArgs(hydrateUrl('mask-id')).returns(createResponse(200, MASK_BODY));
        const result = await mask.init(withLocale('fr_CA', 'fr_FR', { mask: 'zorro' }));
        expect(result.fields.badge).to.equal('MASKED BADGE');
    });

    it('reuses a regional 404 across pipeline runs while resolving the default mask', async function () {
        const regionalUrl = byPathUrl('en_IN', 'cached-photo');
        fetchStub.withArgs(regionalUrl).returns(createResponse(404, {}, 'Not Found'));
        mockMaskFound('en_GB', 'cached-photo');
        for (const run of [1, 2]) {
            const result = await mask.init(withLocale('en_IN', 'en_GB', { mask: 'cached-photo', requestId: `run-${run}` }));
            expect(result.fields.badge).to.equal('MASKED BADGE');
        }
        expect(fetchStub.withArgs(regionalUrl).callCount).to.equal(1);
    });

    it('discovers a newly authored mask after the missing-mask TTL expires', async function () {
        const clock = sinon.useFakeTimers({ toFake: ['Date'] });
        try {
            fetchStub.withArgs(byPathUrl('en_US', 'new-photo')).returns(createResponse(404, {}, 'Not Found'));
            await mask.init(withLocale('en_US', 'en_US', { mask: 'new-photo' }));
            clock.setSystemTime(Date.now() + 5 * 60 * 1000 + 1);
            mockMaskFound('en_US', 'new-photo');
            const result = await mask.init(withLocale('en_US', 'en_US', { mask: 'new-photo' }));
            expect(result.fields.badge).to.equal('MASKED BADGE');
        } finally {
            clock.restore();
        }
    });

    it('shares a missing-mask lookup between concurrent pipeline runs', async function () {
        fetchStub.resolves({ status: 404, message: 'Not Found', headers: new Headers() });
        await Promise.all([1, 2, 3].map(() => mask.init(withLocale('en_US', 'en_US', { mask: 'missing' }))));
        expect(fetchStub.callCount).to.equal(1);
    });

    it('isolates missing masks by surface, locale, and mask name', async function () {
        fetchStub.resolves({ status: 404, message: 'Not Found', headers: new Headers() });
        for (const options of [
            { surface: 'sandbox', locale: 'en_US', mask: 'photo' },
            { surface: 'sandbox', locale: 'en_US', mask: 'video' },
            { surface: 'sandbox', locale: 'en_GB', mask: 'photo' },
            { surface: 'acom-cc', locale: 'en_US', mask: 'photo' },
        ]) {
            await mask.init(withLocale(options.locale, options.locale, options));
        }
        expect(fetchStub.callCount).to.equal(4);
    });

    for (const status of [401, 403, 503, 504]) {
        it(`does not cache HTTP ${status} as a missing mask`, async function () {
            fetchStub.callsFake(() => createResponse(status, { detail: 'unavailable' }));
            await mask.init(withLocale('en_US', 'en_US', { mask: 'photo' }));
            mockMaskFound('en_US', 'photo');
            const result = await mask.init(withLocale('en_US', 'en_US', { mask: 'photo' }));
            expect(result.fields.badge).to.equal('MASKED BADGE');
        });
    }

    it('does not cache mask hydration failures as an absent byPath lookup', async function () {
        mockMaskFound('en_US', 'photo');
        fetchStub.withArgs(hydrateUrl('mask-id')).returns(createResponse(404, {}, 'Not Found'));
        await mask.init(withLocale('en_US', 'en_US', { mask: 'photo' }));
        fetchStub.withArgs(hydrateUrl('mask-id')).returns(createResponse(200, MASK_BODY));
        const result = await mask.init(withLocale('en_US', 'en_US', { mask: 'photo' }));
        expect(result.fields.badge).to.equal('MASKED BADGE');
    });

    it('discovers a newly authored mask after clearing cached misses', async function () {
        fetchStub.withArgs(byPathUrl('en_US', 'photo')).returns(createResponse(404, {}, 'Not Found'));
        await mask.init(withLocale('en_US', 'en_US', { mask: 'photo' }));
        clearMaskCache();
        mockMaskFound('en_US', 'photo');
        expect((await mask.init(withLocale('en_US', 'en_US', { mask: 'photo' }))).fields.badge).to.equal('MASKED BADGE');
    });

    describe('preview persistence', function () {
        let originalStorage;
        const preview = { url: 'https://odinpreview.corp.adobe.com/adobe/contentFragments' };
        const previewContext = (options = {}) => withLocale('en_US', 'en_US', { mask: 'photo', preview, ...options });

        beforeEach(function () {
            originalStorage = globalThis.localStorage;
            const storage = {};
            Object.defineProperties(storage, {
                getItem: { value: (key) => storage[key] ?? null },
                setItem: {
                    value: (key, value) => {
                        storage[key] = value;
                    },
                },
                removeItem: {
                    value: (key) => {
                        delete storage[key];
                    },
                },
            });
            globalThis.localStorage = storage;
            fetchStub.resolves({ status: 404, message: 'Not Found', headers: new Headers() });
        });

        afterEach(function () {
            globalThis.localStorage = originalStorage;
        });

        it('reuses a persisted 404 in a fresh mask module instance', async function () {
            await mask.init(previewContext());
            const fresh = await import('../../src/fragment/transformers/mask.js?preview-cache-test');
            await fresh.transformer.init(previewContext());
            expect(fetchStub.callCount).to.equal(1);
        });

        it('isolates preview endpoints and published lookups', async function () {
            await mask.init(previewContext());
            await mask.init(previewContext({ preview: { url: 'https://other.example.com/contentFragments' } }));
            await mask.init(withLocale('en_US', 'en_US', { mask: 'photo' }));
            expect(fetchStub.callCount).to.equal(3);
        });

        it('rechecks a preview miss after one minute', async function () {
            const clock = sinon.useFakeTimers({ toFake: ['Date'] });
            try {
                await mask.init(previewContext());
                clock.setSystemTime(Date.now() + 60001);
                await mask.init(previewContext());
                expect(fetchStub.callCount).to.equal(2);
            } finally {
                clock.restore();
            }
        });

        it('clears persisted mask misses without removing unrelated keys', async function () {
            await mask.init(previewContext());
            localStorage.setItem('unrelated-key', 'keep');
            clearMaskCache(true);
            await mask.init(previewContext());
            expect(fetchStub.callCount).to.equal(2);
            expect(localStorage.getItem('unrelated-key')).to.equal('keep');
        });
    });

    it('reports a missing mask with its surface and locale', async function () {
        fetchStub.withArgs(byPathUrl('en_US', 'missing')).returns(createResponse(404, {}, 'Not Found'));
        const result = await mask.init(withLocale('en_US', 'en_US', { mask: 'missing' }));
        expect(result.error).to.include({ code: 'mask-not-found', status: 404, mask: 'missing', surface: 'sandbox' });
        expect(result.error.message).to.include('sandbox/en_US').and.include('translate');
    });

    it('reports hydration failure without recommending translation', async function () {
        fetchStub.withArgs(byPathUrl('en_US', 'broken')).returns(createResponse(200, { id: 'mask-broken' }));
        fetchStub.withArgs(hydrateUrl('mask-broken')).returns(createResponse(503, {}, 'Service Unavailable'));
        const result = await mask.init(withLocale('en_US', 'en_US', { mask: 'broken' }));
        expect(result.error).to.include({ code: 'mask-fetch-failed', status: 503 });
        expect(result.error.message).not.to.include('translate');
        expect(result.error.failures).to.deep.equal([{ locale: 'en_US', status: 503, operation: 'hydrate' }]);
    });

    it('does not classify a regional service failure followed by default 404 as missing content', async function () {
        fetchStub.withArgs(byPathUrl('en_IN', 'photo')).returns(createResponse(503, {}, 'Service Unavailable'));
        fetchStub.withArgs(byPathUrl('en_GB', 'photo')).returns(createResponse(404, {}, 'Not Found'));
        const result = await mask.init(withLocale('en_IN', 'en_GB', { mask: 'photo' }));
        expect(result.error).to.include({ code: 'mask-fetch-failed', status: 503 });
        expect(result.error.message).not.to.include('translate');
    });

    it('returns a preview error naming the missing mask and translation locale', async function () {
        fetchStub.resolves({ status: 404, message: 'Not Found', headers: new Headers() });
        const resolution = await mask.init(withLocale('en_IN', 'en_GB', { mask: 'photo' }));
        const result = await mask.process({ ...BASE, preview: true, promises: { mask: Promise.resolve(resolution) } });
        expect(result.status).to.equal(404);
        expect(result.message).to.include('photo').and.include('sandbox/en_GB').and.include('translate');
        expect(result.maskError.failures).to.deep.equal([
            { locale: 'en_IN', status: 404, operation: 'lookup' },
            { locale: 'en_GB', status: 404, operation: 'lookup' },
        ]);
    });

    it('keeps production rendering and reports final failures even when misses are cached', async function () {
        fetchStub.resolves({ status: 404, message: 'Not Found', headers: new Headers() });
        const errorStub = sinon.stub(console, 'error');
        const body = { id: 'collection-id', fields: { title: 'collection' } };
        try {
            for (const run of [1, 2]) {
                const resolution = await mask.init(withLocale('en_US', 'en_US', { mask: 'photo' }));
                const result = await mask.process({
                    ...BASE,
                    body,
                    requestId: `run-${run}`,
                    promises: { mask: Promise.resolve(resolution) },
                });
                expect(result.status).to.equal(200);
                expect(result.body).to.equal(body);
                expect(result.maskError.code).to.equal('mask-not-found');
            }
            expect(fetchStub.callCount).to.equal(1);
            expect(errorStub.callCount).to.equal(2);
            expect(errorStub.firstCall.args[0]).to.include('mask-resolution-failed').and.include('run-1');
            expect(errorStub.secondCall.args[0]).to.include('mask-resolution-failed').and.include('run-2');
        } finally {
            errorStub.restore();
        }
    });

    it('resolves to null when the mask name contains invalid characters, without fetching', async function () {
        const result = await mask.init(withLocale('en_US', 'en_US', { mask: '../evil' }));
        expect(result).to.equal(null);
        expect(fetchStub.called).to.be.false;
    });
});

describe('mask transformer process', function () {
    const RESOLVED_MASK = { id: 'mask-id', fields: { badge: 'MASKED BADGE' } };

    it('is a no-op (no fetch) when neither a mask param nor a promotion mask tag is present', async function () {
        const context = { ...BASE };
        const result = await mask.process(context);
        expect(result.maskFragment).to.be.undefined;
    });

    it('sets maskFragment on context when mask promise resolved', async function () {
        const ctx = { ...BASE, promises: { mask: Promise.resolve(RESOLVED_MASK) } };
        const result = await mask.process(ctx);
        expect(result.maskFragment.fields.badge).to.equal('MASKED BADGE');
    });

    it('adds variables to context.dictionary when mask has variables', async function () {
        const maskWithVars = { id: 'mask-id', fields: { variables: ['k1:v1', 'k2:v2'] } };
        const ctx = {
            ...BASE,
            dictionary: { existing: 'val' },
            promises: { mask: Promise.resolve(maskWithVars) },
        };
        const result = await mask.process(ctx);
        expect(result.maskFragment).to.deep.equal(maskWithVars);
        expect(result.dictionary.k1).to.equal('v1');
        expect(result.dictionary.k2).to.equal('v2');
        expect(result.dictionary.existing).to.equal('val');
    });

    it('preserves colons in variable values when splitting on the first colon only', async function () {
        const maskWithVars = { id: 'mask-id', fields: { variables: ['url:https://example.com/path'] } };
        const ctx = { ...BASE, promises: { mask: Promise.resolve(maskWithVars) } };
        const result = await mask.process(ctx);
        expect(result.dictionary.url).to.equal('https://example.com/path');
    });

    it('silently skips variable entries that have no colon delimiter', async function () {
        const maskWithVars = { id: 'mask-id', fields: { variables: ['malformed', 'k:v'] } };
        const ctx = { ...BASE, promises: { mask: Promise.resolve(maskWithVars) } };
        const result = await mask.process(ctx);
        expect(result.dictionary.malformed).to.be.undefined;
        expect(result.dictionary.k).to.equal('v');
    });

    it('returns context unchanged when mask promise resolves to null', async function () {
        const ctx = { ...BASE, promises: { mask: Promise.resolve(null) } };
        const result = await mask.process(ctx);
        expect(result.maskFragment).to.be.undefined;
    });
});
