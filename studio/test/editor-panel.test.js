import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/editor-panel.js';
import EditorPanel from '../src/editor-panel.js';
import Store from '../src/store.js';

describe('EditorPanel', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('deleteFragment', () => {
        let el;
        let savedInEdit;

        beforeEach(() => {
            savedInEdit = Store.fragments.inEdit.value;
            el = new EditorPanel();
        });

        afterEach(() => {
            Store.fragments.inEdit.value = savedInEdit;
        });

        it("excludes a directly-opened PZN grouped variation's own field variations, keeping only its promo variations", async () => {
            const fragment = {
                id: 'grouped-variation-id',
                path: '/content/dam/mas/sandbox/en_US/my-card/pzn/edu',
                getVariations: sandbox.stub().returns(['/content/dam/mas/sandbox/en_US/my-card/pzn/edu/nested-variation']),
            };
            Store.fragments.inEdit.value = { get: () => fragment };
            sandbox.stub(el.editorContextStore, 'isVariation').returns(true);
            const getPromoVariationPaths = sandbox
                .stub()
                .resolves(['/content/dam/mas/sandbox/en_US/promotions/summer-sale/pzn/edu']);
            sandbox.stub(el, 'repository').get(() => ({ getPromoVariationPaths }));

            await el.deleteFragment();

            expect(fragment.getVariations.called).to.be.false;
            expect(getPromoVariationPaths.calledOnceWith(fragment)).to.be.true;
            expect(el.variationsToDelete).to.deep.equal(['/content/dam/mas/sandbox/en_US/promotions/summer-sale/pzn/edu']);
            expect(el.showDeleteDialog).to.be.true;
        });

        it('includes its own field variations when the opened fragment is the default (not a variation)', async () => {
            const fragment = {
                id: 'default-id',
                path: '/content/dam/mas/sandbox/en_US/my-card',
                getVariations: sandbox.stub().returns(['/content/dam/mas/sandbox/en_US/my-card/pzn/edu']),
            };
            Store.fragments.inEdit.value = { get: () => fragment };
            sandbox.stub(el.editorContextStore, 'isVariation').returns(false);
            const getPromoVariationPaths = sandbox.stub().resolves([]);
            sandbox.stub(el, 'repository').get(() => ({ getPromoVariationPaths }));

            await el.deleteFragment();

            expect(fragment.getVariations.calledOnce).to.be.true;
            expect(el.variationsToDelete).to.deep.equal(['/content/dam/mas/sandbox/en_US/my-card/pzn/edu']);
        });
    });
});
