import { expect } from '@esm-bundle/chai';
import {
    classifyPromotionPathsForSelection,
    isPromotionItemSelectionDirty,
    isPromotionRequiredFieldsValid,
    normalizePromotionSearchInput,
    parsePromotionSurfacesFieldValues,
    serializePromotionSurfacesForAem,
} from '../../src/promotions/promotion-editor-utils.js';
import { COLLECTION_MODEL_PATH } from '../../src/constants.js';

const resolved = '/content/dam/mas/promotions/test-items/resolved-card-fragment';
const fetchFailed = '/content/dam/mas/promotions/test-items/fetch-failed-card-fragment';

function makePromotionLike({ fragments = [], collections } = {}) {
    return {
        getField: (name) => (name === 'collections' ? collections !== undefined : null),
        getFieldValues: (name) => {
            if (name === 'fragments') return fragments;
            if (name === 'collections') return collections ?? [];
            return [];
        },
    };
}

describe('promotion-editor-utils', () => {
    describe('isPromotionItemSelectionDirty', () => {
        it('returns false when promotion is missing', () => {
            expect(isPromotionItemSelectionDirty(null, ['/a'], [])).to.be.false;
        });

        it('returns false when merged paths match selection', () => {
            const p = makePromotionLike({ fragments: ['/b', '/a'], collections: [] });
            expect(isPromotionItemSelectionDirty(p, ['/a'], ['/b'])).to.be.false;
        });

        it('returns true when selection adds a path', () => {
            const p = makePromotionLike({ fragments: ['/a'] });
            expect(isPromotionItemSelectionDirty(p, ['/a', '/x'], [])).to.be.true;
        });

        it('uses empty collections when getField returns falsy', () => {
            const p = {
                getField: () => null,
                getFieldValues: (name) => (name === 'fragments' ? ['/a'] : []),
            };
            expect(isPromotionItemSelectionDirty(p, ['/a'], ['/b'])).to.be.true;
        });

        it('returns false when saved paths missing from selection are hydrate-unreachable', () => {
            const p = makePromotionLike({ fragments: [resolved, fetchFailed] });
            expect(isPromotionItemSelectionDirty(p, [resolved], [], [fetchFailed])).to.be.false;
        });

        it('returns true when saved paths missing from selection are not hydrate-unreachable', () => {
            const p = makePromotionLike({ fragments: [resolved, fetchFailed] });
            expect(isPromotionItemSelectionDirty(p, [resolved], [], [])).to.be.true;
        });
    });

    describe('serializePromotionSurfacesForAem', () => {
        it('returns empty array for non-array or empty input', () => {
            expect(serializePromotionSurfacesForAem()).to.deep.equal([]);
            expect(serializePromotionSurfacesForAem(null)).to.deep.equal([]);
            expect(serializePromotionSurfacesForAem([])).to.deep.equal([]);
        });

        it('normalizes comma and newline separated tokens into separate AEM values', () => {
            expect(serializePromotionSurfacesForAem([' a , b\n c , a '])).to.deep.equal(['a', 'b', 'c']);
        });
    });

    describe('parsePromotionSurfacesFieldValues', () => {
        it('returns empty array for non-array or empty input', () => {
            expect(parsePromotionSurfacesFieldValues()).to.deep.equal([]);
            expect(parsePromotionSurfacesFieldValues(null)).to.deep.equal([]);
            expect(parsePromotionSurfacesFieldValues([])).to.deep.equal([]);
        });

        it('returns unique lowercase surface keys', () => {
            expect(parsePromotionSurfacesFieldValues(['NALA, sandbox', 'nala'])).to.deep.equal(['nala', 'sandbox']);
        });
    });

    describe('classifyPromotionPathsForSelection', () => {
        it('returns empty buckets for empty paths', async () => {
            const out = await classifyPromotionPathsForSelection([], () => Promise.resolve({}));
            expect(out).to.deep.equal({ cards: [], cols: [], unreachable: [] });
        });

        it('classifies collection model as collections and others as cards', async () => {
            const getFragmentByPath = (path) => {
                if (path === '/col') return Promise.resolve({ model: { path: COLLECTION_MODEL_PATH } });
                return Promise.resolve({ model: { path: '/other' } });
            };
            const out = await classifyPromotionPathsForSelection(['/card', '/col'], getFragmentByPath);
            expect(out.cards).to.deep.equal(['/card']);
            expect(out.cols).to.deep.equal(['/col']);
            expect(out.unreachable).to.deep.equal([]);
        });

        it('lists rejected fetches as unreachable instead of card paths', async () => {
            const out = await classifyPromotionPathsForSelection([fetchFailed], () => Promise.reject(new Error('x')));
            expect(out.cards).to.deep.equal([]);
            expect(out.cols).to.deep.equal([]);
            expect(out.unreachable).to.deep.equal([fetchFailed]);
        });

        it('lists fulfilled fragments without model path as unreachable', async () => {
            const out = await classifyPromotionPathsForSelection(['/no-model'], () => Promise.resolve(null));
            expect(out.cards).to.deep.equal([]);
            expect(out.cols).to.deep.equal([]);
            expect(out.unreachable).to.deep.equal(['/no-model']);
        });

        it('respects custom collection model path', async () => {
            const custom = '/custom/collection';
            const getFragmentByPath = () => Promise.resolve({ model: { path: custom } });
            const out = await classifyPromotionPathsForSelection(['/p'], getFragmentByPath, custom);
            expect(out.cols).to.deep.equal(['/p']);
            expect(out.cards).to.deep.equal([]);
            expect(out.unreachable).to.deep.equal([]);
        });
    });

    describe('normalizePromotionSearchInput', () => {
        it('returns empty for non-string or blank', () => {
            expect(normalizePromotionSearchInput()).to.equal('');
            expect(normalizePromotionSearchInput(null)).to.equal('');
            expect(normalizePromotionSearchInput('  \n')).to.equal('');
        });

        it('returns bare UUID unchanged', () => {
            const id = '00000000-1111-2222-3333-444444444444';
            expect(normalizePromotionSearchInput(`  ${id}  `)).to.equal(id);
        });

        it('extracts fragment id from a Studio merch-card deep link', () => {
            const id = '00000000-1111-2222-3333-444444444444';
            const line = `https://mas.adobe.com/studio.html#content-type=merch-card&query=${id}`;
            expect(normalizePromotionSearchInput(line)).to.equal(id);
        });

        it('strips query/hash from pasted full DAM path', () => {
            const path = '/content/dam/mas/surface/en_US/foo';
            expect(normalizePromotionSearchInput(`${path}?x=1`)).to.equal(path);
            expect(normalizePromotionSearchInput(`https://example.com${path}#edit`)).to.equal(path);
        });
    });

    describe('isPromotionRequiredFieldsValid', () => {
        const baseFragment = () => ({
            getFieldValue: (name) => {
                const map = {
                    title: 'T',
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                };
                return map[name];
            },
            getFieldValues: (name) => (name === 'geos' ? ['us'] : []),
        });

        it('returns false when a required field is empty', () => {
            const f = {
                ...baseFragment(),
                getFieldValue: (name) => (name === 'title' ? '' : baseFragment().getFieldValue(name)),
            };
            expect(isPromotionRequiredFieldsValid(f, 1)).to.be.false;
        });

        it('returns false when geos is empty', () => {
            const f = {
                ...baseFragment(),
                getFieldValues: () => [],
            };
            expect(isPromotionRequiredFieldsValid(f, 1)).to.be.false;
        });

        it('returns false when item count is zero', () => {
            expect(isPromotionRequiredFieldsValid(baseFragment(), 0)).to.be.false;
        });

        it('returns true when required fields, geos, and items are present', () => {
            expect(isPromotionRequiredFieldsValid(baseFragment(), 2)).to.be.true;
        });
    });
});
