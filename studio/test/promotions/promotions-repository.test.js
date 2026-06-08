import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import {
    createPromoVariation,
    getPromotionProjectsForProbe,
    mergePromoReferencesIntoFragmentData,
} from '../../src/promotions/promotions-repository.js';

describe('promotions-repository', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        Store.promotions.list.data.set([]);
        Store.promotions.list.data.removeMeta('listFetched');
        Store.promotions.list.loading.set(true);
    });

    describe('getPromotionProjectsForProbe', () => {
        it('loads promotions when list was never fetched', async () => {
            Store.promotions.list.data.set([]);
            Store.promotions.list.data.removeMeta('listFetched');
            const loadPromotions = sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set([
                    {
                        get: () => ({
                            id: 'promo-1',
                            tags: [{ id: 'mas:promotion/black-friday' }],
                        }),
                    },
                ]);
                Store.promotions.list.data.setMeta('listFetched', true);
            });

            const projects = await getPromotionProjectsForProbe(loadPromotions);

            expect(loadPromotions.calledOnce).to.be.true;
            expect(projects).to.have.lengthOf(1);
        });

        it('does not load when promotions list was already fetched empty', async () => {
            Store.promotions.list.data.set([]);
            Store.promotions.list.data.setMeta('listFetched', true);
            const loadPromotions = sandbox.stub().resolves();

            const projects = await getPromotionProjectsForProbe(loadPromotions);

            expect(loadPromotions.called).to.be.false;
            expect(projects).to.deep.equal([]);
        });
    });

    describe('mergePromoReferencesIntoFragmentData', () => {
        it('probes promo variations using loaded promotion projects', async () => {
            const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            Store.promotions.list.data.set([
                {
                    get: () => ({
                        tags: [{ id: 'mas:promotion/black-friday' }],
                    }),
                },
            ]);
            Store.promotions.list.loading.set(false);
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().withArgs(promoPath).resolves({ id: 'promo-var', path: promoPath }),
                        },
                    },
                },
            };

            const result = await mergePromoReferencesIntoFragmentData(aem, { path: defaultPath, references: [] }, () =>
                Promise.resolve(),
            );

            expect(result.references).to.have.lengthOf(1);
            expect(result.references[0].path).to.equal(promoPath);
        });
    });

    describe('createPromoVariation', () => {
        const parentFragment = {
            id: 'parent-promo-1',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            tags: [{ id: 'mas:product_code/cc' }],
        };
        const promoTag = 'mas:promotion/black-friday';
        const targetPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';

        it('refreshes parent store after creation when refreshFragment is provided', async () => {
            const createdFragment = { id: 'new-promo-var-id', path: targetPath };
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(parentFragment),
                            getByPath: sandbox.stub().resolves(null),
                            ensureFolderExists: sandbox.stub().resolves(),
                            pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                        },
                    },
                },
                getCsrfToken: sandbox.stub().resolves('csrf-token'),
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var-id' }),
                wait: sandbox.stub().resolves(),
                saveTags: sandbox.stub().resolves(),
            };
            const refreshFragment = sandbox.stub().resolves();
            const parentStore = {
                get: () => ({ id: parentFragment.id, references: [] }),
                refreshFrom: sandbox.stub(),
            };
            sandbox.stub(Store.fragments.list.data, 'get').returns([parentStore]);

            const result = await createPromoVariation(aem, parentFragment.id, promoTag, refreshFragment);

            expect(result).to.deep.equal(createdFragment);
            expect(refreshFragment.calledOnceWith(parentStore)).to.be.true;
            expect(parentStore.refreshFrom.calledOnce).to.be.true;
        });
    });
});
