import { expect } from '@esm-bundle/chai';
import { getItemsSelectionStore, setItemsSelectionStore } from '../../src/common/items-selection-store.js';

describe('items-selection-store', () => {
    afterEach(() => {
        setItemsSelectionStore(null);
    });

    it('getItemsSelectionStore throws when no slice is bound', () => {
        setItemsSelectionStore(null);
        expect(() => getItemsSelectionStore()).to.throw('Items selection store not set');
    });

    it('getItemsSelectionStore with allowUnset returns null when no slice is bound', () => {
        setItemsSelectionStore(null);
        expect(getItemsSelectionStore({ allowUnset: true })).to.be.null;
    });

    it('getItemsSelectionStore returns the bound slice', () => {
        const slice = { foo: 1 };
        setItemsSelectionStore(slice);
        expect(getItemsSelectionStore()).to.equal(slice);
    });
});
