import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/editor-panel.js';
import EditorPanel from '../src/editor-panel.js';
import Store from '../src/store.js';
import { Fragment } from '../src/aem/fragment.js';

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
                listPromoVariations: sandbox
                    .stub()
                    .returns([{ path: '/content/dam/mas/sandbox/en_US/promotions/summer-sale/pzn/edu' }]),
            };
            Store.fragments.inEdit.value = { get: () => fragment };
            sandbox.stub(el.editorContextStore, 'isVariation').returns(true);

            await el.deleteFragment();

            expect(fragment.getVariations.called).to.be.false;
            expect(fragment.listPromoVariations.calledOnce).to.be.true;
            expect(el.variationsToDelete).to.deep.equal(['/content/dam/mas/sandbox/en_US/promotions/summer-sale/pzn/edu']);
            expect(el.showDeleteDialog).to.be.true;
        });

        it('includes its own field variations when the opened fragment is the default (not a variation)', async () => {
            const fragment = {
                id: 'default-id',
                path: '/content/dam/mas/sandbox/en_US/my-card',
                getVariations: sandbox.stub().returns(['/content/dam/mas/sandbox/en_US/my-card/pzn/edu']),
                listPromoVariations: sandbox.stub().returns([]),
            };
            Store.fragments.inEdit.value = { get: () => fragment };
            sandbox.stub(el.editorContextStore, 'isVariation').returns(false);

            await el.deleteFragment();

            expect(fragment.getVariations.calledOnce).to.be.true;
            expect(el.variationsToDelete).to.deep.equal(['/content/dam/mas/sandbox/en_US/my-card/pzn/edu']);
        });

        it('awaits a still-pending promo refresh from editFragment before staging variations', async () => {
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/summer-sale/my-card';
            const fragment = new Fragment({
                id: 'live-load-id',
                path: '/content/dam/mas/sandbox/en_US/my-card',
                model: { path: 'some-other-model' },
                fields: [{ name: 'variations', values: [promoPath] }],
                references: [{ path: promoPath }],
            });
            const store = { get: () => fragment };

            const savedPromotionsList = Store.promotions.list.data.value;
            const hadListFetchedMeta = Store.promotions.list.data.hasMeta('listFetched');
            Store.promotions.list.data.value = [];
            Store.promotions.list.data.removeMeta('listFetched');

            let resolveLoadPromotions;
            const mockRepo = {
                refreshFragment: sandbox.stub().resolves(),
                aem: {},
                loadPromotions: sandbox.stub().returns(
                    new Promise((resolve) => {
                        resolveLoadPromotions = resolve;
                    }),
                ),
            };
            sandbox.stub(el, 'repository').get(() => mockRepo);
            sandbox.stub(el.reactiveController, 'updateStores');
            sandbox.stub(el.editorContextStore, 'loadFragmentContext').resolves();
            sandbox.stub(el.editorContextStore, 'isVariation').returns(false);

            await el.editFragment(store);

            let deleteResolved = false;
            const deletePromise = el.deleteFragment().then(() => {
                deleteResolved = true;
            });

            await Promise.resolve();
            expect(deleteResolved).to.be.false;
            expect(el.variationsToDelete).to.deep.equal([]);

            resolveLoadPromotions();
            await deletePromise;

            expect(deleteResolved).to.be.true;
            expect(el.variationsToDelete).to.include(promoPath);

            Store.promotions.list.data.value = savedPromotionsList;
            if (hadListFetchedMeta) Store.promotions.list.data.setMeta('listFetched', true);
        });
    });
});
