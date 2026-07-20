import { expect } from '@open-wc/testing';
import {
    extractSelectionId,
    findFragmentDataById,
    findFragmentStoreById,
    resolveFragmentsFromSelection,
} from '../../src/common/utils/fragment-selection-utils.js';

const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

function makeStore(fragment) {
    return {
        get: () => fragment,
    };
}

describe('fragment-selection-utils', () => {
    it('extractSelectionId returns string ids and fragment store ids', () => {
        expect(extractSelectionId('variation-1')).to.equal('variation-1');
        expect(extractSelectionId(makeStore({ id: 'parent-1' }))).to.equal('parent-1');
        expect(extractSelectionId({ id: 'plain-1' })).to.equal('plain-1');
    });

    it('findFragmentDataById resolves top-level fragments from list stores', () => {
        const parent = { id: 'parent-1', model: { path: CARD_MODEL_PATH } };
        const found = findFragmentDataById('parent-1', [makeStore(parent)]);
        expect(found).to.equal(parent);
    });

    it('findFragmentDataById resolves variation ids from parent references', () => {
        const variation = { id: 'variation-1', model: { path: CARD_MODEL_PATH }, path: '/cards/pzn/var' };
        const parent = {
            id: 'parent-1',
            references: [variation],
        };
        const found = findFragmentDataById('variation-1', [makeStore(parent)]);
        expect(found).to.equal(variation);
    });

    it('findFragmentStoreById returns parent store for variation ids', () => {
        const parent = {
            id: 'parent-1',
            references: [{ id: 'variation-1', path: '/cards/pzn/var' }],
        };
        const parentStore = makeStore(parent);
        expect(findFragmentStoreById('variation-1', [parentStore])).to.equal(parentStore);
    });

    it('resolveFragmentsFromSelection resolves mixed parent and variation selection', () => {
        const variation = { id: 'variation-1', model: { path: CARD_MODEL_PATH } };
        const parent = { id: 'parent-1', model: { path: CARD_MODEL_PATH }, references: [variation] };
        const listStores = [makeStore(parent)];

        const resolved = resolveFragmentsFromSelection(['parent-1', 'variation-1'], listStores);

        expect(resolved).to.deep.equal([parent, variation]);
    });
});
