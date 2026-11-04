import { expect } from '@open-wc/testing';
import { itemTypeFromPath, itemTypeFromFragment, buildItemsMetadata } from '../../src/bulk-publish/bulk-publish-utils.js';
import { COLLECTION_MODEL_PATH } from '../../src/constants.js';

describe('itemTypeFromPath()', () => {
    it('classifies dictionary paths as placeholder', () => {
        expect(itemTypeFromPath('/content/dam/mas/acom/en_US/dictionary/ph1')).to.equal('placeholder');
    });

    it('classifies other paths as fragment', () => {
        expect(itemTypeFromPath('/content/dam/mas/acom/en_US/cards/card1')).to.equal('fragment');
    });

    it('classifies missing path as fragment', () => {
        expect(itemTypeFromPath(undefined)).to.equal('fragment');
    });
});

describe('itemTypeFromFragment()', () => {
    it('classifies collection model fragments as collection', () => {
        const fragment = { path: '/content/dam/mas/acom/en_US/col1', model: { path: COLLECTION_MODEL_PATH } };
        expect(itemTypeFromFragment(fragment)).to.equal('collection');
    });

    it('classifies dictionnary model fragments as placeholder', () => {
        const fragment = {
            path: '/content/dam/mas/acom/en_US/dictionary/ph1',
            model: { path: '/conf/mas/settings/dam/cfm/models/dictionnary' },
        };
        expect(itemTypeFromFragment(fragment)).to.equal('placeholder');
    });

    it('falls back to path classification when model is absent', () => {
        expect(itemTypeFromFragment({ path: '/content/dam/mas/acom/en_US/dictionary/ph1' })).to.equal('placeholder');
        expect(itemTypeFromFragment({ path: '/content/dam/mas/acom/en_US/card1' })).to.equal('fragment');
    });
});

describe('buildItemsMetadata()', () => {
    it('serializes valid items with their types and drops invalid ones', () => {
        const items = [
            { url: 'a', path: '/content/dam/mas/acom/en_US/card1', status: 'valid', type: 'fragment' },
            { url: 'b', path: '/content/dam/mas/acom/en_US/col1', status: 'valid', type: 'collection' },
            { url: 'c', path: '/content/dam/mas/acom/en_US/dictionary/ph1', status: 'valid' },
            { url: 'd', path: '/bad', status: 'error' },
            { url: 'e', status: 'valid' },
        ];
        expect(JSON.parse(buildItemsMetadata(items))).to.deep.equal([
            { path: '/content/dam/mas/acom/en_US/card1', type: 'fragment', status: 'valid' },
            { path: '/content/dam/mas/acom/en_US/col1', type: 'collection', status: 'valid' },
            { path: '/content/dam/mas/acom/en_US/dictionary/ph1', type: 'placeholder', status: 'valid' },
        ]);
    });

    it('returns an empty JSON array for no valid items', () => {
        expect(buildItemsMetadata([])).to.equal('[]');
    });
});
