import { expect } from 'chai';
import { StudioOperations } from '../../src/lib/studio-operations.js';

const STUDIO_BASE_URL = 'https://mas.adobe.com/studio.html';

function buildFragment({ id, title, osi, variant = 'plans' }) {
    return {
        id,
        path: `/content/dam/mas/sandbox/en_US/${id}`,
        title: title || `Card ${id}`,
        status: 'PUBLISHED',
        fields: [
            { name: 'variant', values: [variant] },
            { name: 'title', values: [title || `Card ${id}`] },
            { name: 'osi', values: osi ? [osi] : [] },
        ],
        model: { id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ' },
    };
}

function makeOps({ getFragment, searchFragments } = {}) {
    const aemClient = {
        getFragment: getFragment || (async () => null),
        searchFragments: searchFragments || (async () => []),
        getFragmentByPath: async () => ({ items: [] }),
    };
    const urlBuilder = {
        createFolderLink: (surface) => `${STUDIO_BASE_URL}#path=/content/dam/mas/${surface}`,
    };
    return new StudioOperations(aemClient, urlBuilder);
}

describe('StudioOperations.searchById', () => {
    it('returns MISSING_LOOKUP_KEY when neither id nor osi is provided', async () => {
        const ops = makeOps();
        const result = await ops.searchById({});
        expect(result.success).to.equal(false);
        expect(result.error).to.equal('MISSING_LOOKUP_KEY');
        expect(result.results).to.deep.equal([]);
    });

    it('returns a single card on id-hit', async () => {
        const fragment = buildFragment({ id: 'aaaa-1111', title: 'Photoshop' });
        const ops = makeOps({ getFragment: async () => fragment });
        const result = await ops.searchById({ id: 'aaaa-1111' });
        expect(result.success).to.equal(true);
        expect(result.count).to.equal(1);
        expect(result.results[0].id).to.equal('aaaa-1111');
    });

    it('returns empty results (NOT throw) on id-miss', async () => {
        const ops = makeOps({
            getFragment: async () => {
                throw new Error('Failed to get fragment: 404');
            },
        });
        const result = await ops.searchById({ id: 'missing-id' });
        expect(result.success).to.equal(true);
        expect(result.count).to.equal(0);
        expect(result.message).to.contain('No card found');
    });

    it('returns empty results when getFragment returns invalid payload', async () => {
        const ops = makeOps({ getFragment: async () => ({ id: 'x', fields: undefined }) });
        const result = await ops.searchById({ id: 'x' });
        expect(result.success).to.equal(true);
        expect(result.count).to.equal(0);
    });

    it('filters search results by osi field exact match', async () => {
        const matching = buildFragment({ id: 'aaa', osi: 'OSI_TARGET' });
        const nonMatching = buildFragment({ id: 'bbb', osi: 'OSI_OTHER' });
        const ops = makeOps({
            searchFragments: async () => [matching, nonMatching],
        });
        const result = await ops.searchById({ osi: 'OSI_TARGET', surface: 'sandbox' });
        expect(result.success).to.equal(true);
        expect(result.count).to.equal(1);
        expect(result.results[0].id).to.equal('aaa');
    });

    it('returns no studioLinks when surface is omitted', async () => {
        const ops = makeOps({ searchFragments: async () => [] });
        const result = await ops.searchById({ osi: 'OSI_X' });
        expect(result.studioLinks).to.equal(undefined);
    });

    it('includes studioLinks.viewFolder when surface is provided', async () => {
        const ops = makeOps({ searchFragments: async () => [] });
        const result = await ops.searchById({ osi: 'OSI_X', surface: 'acom' });
        expect(result.studioLinks?.viewFolder).to.contain('acom');
    });
});

describe('StudioOperations.searchCards — surface validation', () => {
    it('returns structured SURFACE_REQUIRED instead of throwing', async () => {
        const ops = makeOps();
        const result = await ops.searchCards({ query: 'photoshop' });
        expect(result.success).to.equal(false);
        expect(result.error).to.equal('SURFACE_REQUIRED');
        expect(result.results).to.deep.equal([]);
    });

    it('does not require surface when osi is provided', async () => {
        const ops = makeOps({
            searchFragments: async () => [buildFragment({ id: 'aaa', osi: 'TARGET' })],
            getFragment: async () => buildFragment({ id: 'aaa', osi: 'TARGET' }),
        });
        const result = await ops.searchCards({ osi: 'TARGET' });
        expect(result.success).to.equal(true);
    });
});

describe('StudioOperations.searchCards — variant filter', () => {
    function buildFragmentWithVariant(id, variant) {
        return {
            id,
            path: `/content/dam/mas/acom/en_US/${id}`,
            title: `Card ${id}`,
            status: 'PUBLISHED',
            fields: [
                { name: 'variant', values: [variant] },
                { name: 'title', values: [`Card ${id}`] },
            ],
            model: { id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ' },
        };
    }

    it('returns only cards whose variant field matches the variant param', async () => {
        const plans = buildFragmentWithVariant('plans-1', 'plans');
        const fries = buildFragmentWithVariant('fries-1', 'fries');
        const ops = makeOps({
            searchFragments: async () => ({ items: [plans, fries], cursor: null }),
        });
        const result = await ops.searchCards({ surface: 'acom', query: 'card', variant: 'plans', limit: 10 });
        expect(result.success).to.equal(true);
        expect(result.count).to.equal(1);
        expect(result.results[0].id).to.equal('plans-1');
        expect(result.results[0].variant).to.equal('plans');
    });

    it('matches plans-students distinct from plans', async () => {
        const plans = buildFragmentWithVariant('plans-1', 'plans');
        const plansStudents = buildFragmentWithVariant('plans-students-1', 'plans-students');
        const ops = makeOps({
            searchFragments: async () => ({ items: [plans, plansStudents], cursor: null }),
        });
        const result = await ops.searchCards({
            surface: 'acom',
            query: 'card',
            variant: 'plans-students',
            limit: 10,
        });
        expect(result.count).to.equal(1);
        expect(result.results[0].id).to.equal('plans-students-1');
    });

    it('returns empty when no card matches the variant', async () => {
        const plans = buildFragmentWithVariant('plans-1', 'plans');
        const ops = makeOps({
            searchFragments: async () => ({ items: [plans], cursor: null }),
        });
        const result = await ops.searchCards({ surface: 'acom', query: 'card', variant: 'fries', limit: 10 });
        expect(result.count).to.equal(0);
        expect(result.results).to.deep.equal([]);
    });

    it('excludes fragments missing the variant field when filtering by variant', async () => {
        const noVariant = {
            id: 'no-variant',
            path: '/content/dam/mas/acom/en_US/no-variant',
            title: 'No Variant',
            status: 'PUBLISHED',
            // No 'variant' field at all — simulates the AEM-search-sparse-response case
            fields: [{ name: 'title', values: ['No Variant'] }],
            model: { id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ' },
        };
        const plans = buildFragmentWithVariant('plans-1', 'plans');
        const ops = makeOps({
            searchFragments: async () => ({ items: [noVariant, plans], cursor: null }),
        });
        const result = await ops.searchCards({ surface: 'acom', query: 'card', variant: 'plans', limit: 10 });
        expect(result.count).to.equal(1);
        expect(result.results[0].id).to.equal('plans-1');
    });

    it('formatCard surfaces the variant field at top level (no unknown leak when variant is set)', async () => {
        const plans = buildFragmentWithVariant('plans-1', 'plans');
        const ops = makeOps({
            searchFragments: async () => ({ items: [plans], cursor: null }),
        });
        const result = await ops.searchCards({ surface: 'acom', query: 'card', variant: 'plans', limit: 10 });
        expect(result.results[0].variant).to.equal('plans');
        expect(result.results[0].variant).to.not.equal('unknown');
    });

    it('tag-only fast path also filters by variant via the canonical extractor', async () => {
        const plans = buildFragmentWithVariant('plans-1', 'plans');
        const fries = buildFragmentWithVariant('fries-1', 'fries');
        const ops = makeOps({
            searchFragments: async () => ({ items: [plans, fries], cursor: null }),
        });
        const result = await ops.searchCards({
            surface: 'acom',
            tags: ['mas:offer_type/base'],
            variant: 'plans',
            limit: 10,
        });
        expect(result.success).to.equal(true);
        expect(result.count).to.equal(1);
        expect(result.results[0].id).to.equal('plans-1');
    });
});
