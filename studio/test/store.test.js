import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store, { editFragment } from '../src/store.js';

describe('store', () => {
    let sandbox;
    let originalStoreData;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalStoreData = Store.fragments.list.data.get();
    });

    afterEach(() => {
        Store.fragments.list.data.value = originalStoreData;
        sandbox.restore();
    });

    const createMockStore = (id, references = []) => ({
        get: () => ({ id, references }),
    });

    const createMockEditorPanel = () => ({
        editFragment: sandbox.stub(),
    });

    describe('editFragment', () => {
        it('adds fragment to list when it is not in store', () => {
            const store = createMockStore('fragment-1');
            Store.fragments.list.data.value = [];
            const setStub = sandbox.stub(Store.fragments.list.data, 'set').callsFake((fn) => {
                const result = typeof fn === 'function' ? fn([]) : fn;
                Store.fragments.list.data.value = result;
            });
            const editorPanel = createMockEditorPanel();
            sandbox.stub(document, 'querySelector').returns(editorPanel);
            editFragment(store);
            expect(setStub.called).to.be.true;
            const storeFragments = Store.fragments.list.data.get();
            expect(storeFragments).to.have.lengthOf(1);
            expect(storeFragments[0]).to.equal(store);
            expect(editorPanel.editFragment.calledWith(store, 0)).to.be.true;
        });

        it('does not add store when it already exists in list', () => {
            const store = createMockStore('fragment-1');
            Store.fragments.list.data.value = [store];
            const editorPanel = createMockEditorPanel();
            sandbox.stub(document, 'querySelector').returns(editorPanel);
            editFragment(store);
            const storeFragments = Store.fragments.list.data.get();
            expect(storeFragments).to.have.lengthOf(1);
            expect(editorPanel.editFragment.calledWith(store, 0)).to.be.true;
        });

        it('does not add store when fragment is a variation of existing fragment', () => {
            const parentStore = createMockStore('parent-id', [{ id: 'variation-id' }]);
            const variationStore = createMockStore('variation-id');
            Store.fragments.list.data.value = [parentStore];
            const editorPanel = createMockEditorPanel();
            sandbox.stub(document, 'querySelector').returns(editorPanel);
            editFragment(variationStore);
            const storeFragments = Store.fragments.list.data.get();
            expect(storeFragments).to.have.lengthOf(1);
            expect(storeFragments[0]).to.equal(parentStore);
            expect(editorPanel.editFragment.calledWith(variationStore, 0)).to.be.true;
        });

        it('handles editor panel not available', () => {
            const store = createMockStore('fragment-1');
            Store.fragments.list.data.value = [];
            sandbox.stub(document, 'querySelector').returns(null);
            expect(() => editFragment(store)).to.not.throw();
        });

        it('adds new fragment when multiple fragments exist', () => {
            const store1 = createMockStore('fragment-1');
            const store2 = createMockStore('fragment-2');
            const store3 = createMockStore('fragment-3');
            Store.fragments.list.data.value = [store1, store2];
            const setStub = sandbox.stub(Store.fragments.list.data, 'set').callsFake((fn) => {
                const result = typeof fn === 'function' ? fn([store1, store2]) : fn;
                Store.fragments.list.data.value = result;
            });
            const editorPanel = createMockEditorPanel();
            sandbox.stub(document, 'querySelector').returns(editorPanel);
            editFragment(store3);
            expect(setStub.called).to.be.true;
            const storeFragments = Store.fragments.list.data.get();
            expect(storeFragments).to.have.lengthOf(3);
            expect(storeFragments[0]).to.equal(store3);
        });
    });
});
