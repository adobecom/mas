import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';
import { transformer as mask } from '../../src/fragment/transformers/mask.js';

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

    it('resolves to null when the mask fragment is not found', async function () {
        fetchStub.withArgs(byPathUrl('en_US', 'missing')).returns(createResponse(404, {}, 'Not Found'));
        const result = await mask.init(withLocale('en_US', 'en_US', { mask: 'missing' }));
        expect(result).to.equal(null);
    });

    it('resolves to null when the mask hydration fails', async function () {
        fetchStub.withArgs(byPathUrl('en_US', 'broken')).returns(createResponse(200, { id: 'mask-broken' }));
        fetchStub.withArgs(hydrateUrl('mask-broken')).returns(createResponse(503, {}, 'Service Unavailable'));
        const result = await mask.init(withLocale('en_US', 'en_US', { mask: 'broken' }));
        expect(result).to.equal(null);
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
