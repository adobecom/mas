import { expect } from '@esm-bundle/chai';
import {
    classifyPromotionPathsForSelection,
    isPromotionItemSelectionDirty,
    isPromotionRequiredFieldsValid,
    serializePromotionSurfacesForAem,
} from '../../src/promotions/promotion-editor-utils.js';
import { COLLECTION_MODEL_PATH } from '../../src/constants.js';

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
    });

    describe('serializePromotionSurfacesForAem', () => {
        it('returns empty array for non-array or empty input', () => {
            expect(serializePromotionSurfacesForAem()).to.deep.equal([]);
            expect(serializePromotionSurfacesForAem(null)).to.deep.equal([]);
            expect(serializePromotionSurfacesForAem([])).to.deep.equal([]);
        });

        it('merges comma and newline separated tokens into one AEM value', () => {
            expect(serializePromotionSurfacesForAem([' a , b\n c , a '])).to.deep.equal(['a,b,c']);
        });
    });

    describe('classifyPromotionPathsForSelection', () => {
        it('returns empty buckets for empty paths', async () => {
            const out = await classifyPromotionPathsForSelection([], () => Promise.resolve({}));
            expect(out).to.deep.equal({ cards: [], cols: [] });
        });

        it('classifies collection model as collections and others as cards', async () => {
            const getFragmentByPath = (path) => {
                if (path === '/col') return Promise.resolve({ model: { path: COLLECTION_MODEL_PATH } });
                return Promise.resolve({ model: { path: '/other' } });
            };
            const out = await classifyPromotionPathsForSelection(['/card', '/col'], getFragmentByPath);
            expect(out.cards).to.deep.equal(['/card']);
            expect(out.cols).to.deep.equal(['/col']);
        });

        it('treats rejected fetches as card paths', async () => {
            const out = await classifyPromotionPathsForSelection(['/bad'], () => Promise.reject(new Error('x')));
            expect(out.cards).to.deep.equal(['/bad']);
            expect(out.cols).to.deep.equal([]);
        });

        it('respects custom collection model path', async () => {
            const custom = '/custom/collection';
            const getFragmentByPath = () => Promise.resolve({ model: { path: custom } });
            const out = await classifyPromotionPathsForSelection(['/p'], getFragmentByPath, custom);
            expect(out.cols).to.deep.equal(['/p']);
            expect(out.cards).to.deep.equal([]);
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
