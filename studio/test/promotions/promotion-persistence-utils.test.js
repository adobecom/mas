import { expect } from '@esm-bundle/chai';
import { COLLECTION_MODEL_PATH } from '../../src/constants.js';
import {
    buildPromotionSurfacesCreateFieldPayload,
    expandPromotionSurfacesFieldForEditor,
    flattenPromotionSurfacesToCsv,
    partitionPromotionPathsByModel,
    promotionSurfacesUsesMultilineModel,
} from '../../src/promotions/promotion-persistence-utils.js';

describe('promotionSurfacesUsesMultilineModel', () => {
    it('is true for long-text', () => {
        expect(promotionSurfacesUsesMultilineModel({ type: 'long-text' })).to.be.true;
    });

    it('is true when multiple is true', () => {
        expect(promotionSurfacesUsesMultilineModel({ type: 'text', multiple: true })).to.be.true;
    });

    it('is false for single-line text field', () => {
        expect(promotionSurfacesUsesMultilineModel({ type: 'text', multiple: false })).to.be.false;
    });

    it('is false for null/undefined', () => {
        expect(promotionSurfacesUsesMultilineModel(null)).to.be.false;
        expect(promotionSurfacesUsesMultilineModel(undefined)).to.be.false;
    });
});

describe('flattenPromotionSurfacesToCsv', () => {
    it('joins unique surface ids', () => {
        expect(flattenPromotionSurfacesToCsv(['a', 'b', 'a'])).to.equal('a,b');
    });

    it('splits comma-separated strings and dedupes', () => {
        expect(flattenPromotionSurfacesToCsv(['a,c', 'b, a'])).to.equal('a,c,b');
    });

    it('returns empty string for empty input', () => {
        expect(flattenPromotionSurfacesToCsv([])).to.equal('');
        expect(flattenPromotionSurfacesToCsv(null)).to.equal('');
    });
});

describe('expandPromotionSurfacesFieldForEditor', () => {
    it('expands a single CSV value into multiple values', () => {
        const field = { type: 'text', multiple: false, values: ['x,y, z'] };
        expect(expandPromotionSurfacesFieldForEditor(field)).to.be.true;
        expect(field.values).to.deep.equal(['x', 'y', 'z']);
    });

    it('returns false when no comma', () => {
        const field = { type: 'text', values: ['single'] };
        expect(expandPromotionSurfacesFieldForEditor(field)).to.be.false;
        expect(field.values).to.deep.equal(['single']);
    });

    it('does not change long-text fields', () => {
        const field = { type: 'long-text', values: ['a,b'] };
        expect(expandPromotionSurfacesFieldForEditor(field)).to.be.false;
    });

    it('expands to empty array when CSV is only whitespace and commas', () => {
        const field = { type: 'text', multiple: false, values: [' , , '] };
        expect(expandPromotionSurfacesFieldForEditor(field)).to.be.true;
        expect(field.values).to.deep.equal([]);
    });
});

describe('buildPromotionSurfacesCreateFieldPayload', () => {
    it('returns text single payload for non-multiline surfaces', () => {
        const surfField = { type: 'text', multiple: false };
        const out = buildPromotionSurfacesCreateFieldPayload('surfaces', surfField, ['a', 'b']);
        expect(out).to.deep.equal({ name: 'surfaces', type: 'text', multiple: false, values: ['a,b'] });
    });

    it('returns null for wrong field name', () => {
        expect(buildPromotionSurfacesCreateFieldPayload('tags', { type: 'text' }, ['x'])).to.equal(null);
    });

    it('returns null when model is multiline', () => {
        expect(buildPromotionSurfacesCreateFieldPayload('surfaces', { type: 'long-text' }, ['x'])).to.equal(null);
    });
});

describe('partitionPromotionPathsByModel', () => {
    it('puts all paths in cardPaths when getFragmentByPath is missing', async () => {
        const { cardPaths, collectionPaths } = await partitionPromotionPathsByModel(['/a', '/b'], null, COLLECTION_MODEL_PATH);
        expect(cardPaths).to.deep.equal(['/a', '/b']);
        expect(collectionPaths).to.deep.equal([]);
    });

    it('partitions by model path in parallel', async () => {
        const getFragmentByPath = async (path) => {
            if (path === '/coll') return { model: { path: COLLECTION_MODEL_PATH } };
            return { model: { path: '/conf/mas/settings/dam/cfm/models/card' } };
        };
        const { cardPaths, collectionPaths } = await partitionPromotionPathsByModel(['/card', '/coll'], getFragmentByPath);
        expect(cardPaths).to.include('/card');
        expect(collectionPaths).to.deep.equal(['/coll']);
    });

    it('treats fetch errors as card paths', async () => {
        const getFragmentByPath = async () => {
            throw new Error('network');
        };
        const { cardPaths, collectionPaths } = await partitionPromotionPathsByModel(['/x'], getFragmentByPath);
        expect(cardPaths).to.deep.equal(['/x']);
        expect(collectionPaths).to.deep.equal([]);
    });
});
