import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import {
    buildPromoVariationParentRefreshCallback,
    createPromoVariation,
    deleteAttachedPromoVariations,
    getPromotionProjectsForProbe,
    getPublishedAttachedPromoVariations,
    getUnpublishedAttachedPromoVariations,
    mergePromoReferencesIntoFragmentData,
    probePromoVariationsForFragment,
    resolveDefaultFragmentForPromoVariation,
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
            const getByPath = sandbox.stub().resolves(null);
            getByPath.withArgs(promoPath).resolves({ id: 'promo-var', path: promoPath });
            const aem = {
                sites: {
                    cf: {
                        fragments: { getByPath },
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

            const result = await createPromoVariation(aem, parentFragment.id, promoTag, [], refreshFragment, () =>
                Promise.resolve(),
            );

            expect(result).to.deep.equal(createdFragment);
            expect(refreshFragment.calledOnceWith(parentStore)).to.be.true;
            expect(parentStore.refreshFrom.calledOnce).to.be.true;
        });

        it('passes the attached fragment paths of the matching promo project to the model layer', async () => {
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
            Store.promotions.list.data.set([
                {
                    get: () => ({
                        tags: [{ id: 'mas:promotion/black-friday' }],
                        getFieldValues: (name) => (name === 'fragments' ? ['/content/dam/mas/sandbox/en_US/my-card-2'] : []),
                    }),
                },
            ]);

            await createPromoVariation(aem, parentFragment.id, promoTag, ['mas:pzn/country/ar']);

            expect(aem.sites.cf.fragments.getByPath.calledWith(targetPath)).to.be.true;
        });

        it('creates a geo-specific variation even when a legacy sibling (no pznTags) already exists', async () => {
            const variation2Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const getByPath = sandbox.stub();
            getByPath.withArgs(targetPath).resolves({ id: 'existing-var', path: targetPath, fields: [] });
            getByPath.resolves(null);
            const createdFragment = { id: 'new-promo-var-2', path: variation2Path };
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(parentFragment),
                            getByPath,
                            ensureFolderExists: sandbox.stub().resolves(),
                            pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                        },
                    },
                },
                getCsrfToken: sandbox.stub().resolves('csrf-token'),
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var-2' }),
                wait: sandbox.stub().resolves(),
                saveTags: sandbox.stub().resolves(),
            };
            Store.promotions.list.data.set([
                {
                    get: () => ({
                        getFieldValues: (name) => {
                            if (name === 'tags') return ['mas:promotion/black-friday'];
                            if (name === 'geos') return ['mas:pzn/country/fr'];
                            return [];
                        },
                    }),
                },
            ]);

            const result = await createPromoVariation(aem, parentFragment.id, promoTag, ['mas:pzn/country/fr']);

            expect(result).to.deep.equal(createdFragment);
        });
    });

    describe('resolveDefaultFragmentForPromoVariation', () => {
        it('resolves the default fragment for a promo variation path', async () => {
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
            const parentData = { id: 'default-id', path: parentPath, references: [] };
            Store.promotions.list.data.set([
                {
                    get: () => ({
                        tags: [{ id: 'mas:promotion/black-friday' }],
                        getFieldValues: (name) => (name === 'fragments' ? [parentPath] : []),
                    }),
                },
            ]);
            Store.promotions.list.loading.set(false);
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves({
                                id: 'promo-var',
                                path: promoPath,
                                tags: [{ id: 'mas:promotion/black-friday' }],
                            }),
                            getByPath: sandbox.stub().withArgs(parentPath).resolves(parentData),
                        },
                    },
                },
            };

            const result = await resolveDefaultFragmentForPromoVariation(aem, promoPath, 'promo-var', () => Promise.resolve());

            expect(result.path).to.equal(parentPath);
        });
    });

    describe('getUnpublishedAttachedPromoVariations', () => {
        it('delegates to the promotion-variations model layer and returns its result', async () => {
            const promotionFragment = {
                getFieldValues: (name) => (name === 'fragments' ? ['/content/dam/mas/sandbox/en_US/my-card'] : undefined),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const getByPath = sandbox.stub().resolves(null);
            getByPath
                .withArgs(promoPath)
                .resolves({ id: 'promo-var-id', path: promoPath, status: 'DRAFT', title: 'Promo Card' });
            const aem = {
                sites: {
                    cf: {
                        fragments: { getByPath },
                    },
                },
            };

            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);

            expect(result).to.have.lengthOf(1);
            expect(result[0].path).to.equal(promoPath);
        });
    });

    describe('getPublishedAttachedPromoVariations', () => {
        it('delegates to the promotion-variations model layer and returns its result', async () => {
            const promotionFragment = {
                getFieldValues: (name) => (name === 'fragments' ? ['/content/dam/mas/sandbox/en_US/my-card'] : undefined),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const getByPath = sandbox.stub().resolves(null);
            getByPath
                .withArgs(promoPath)
                .resolves({ id: 'promo-var-id', path: promoPath, status: 'PUBLISHED', title: 'Promo Card' });
            const aem = {
                sites: {
                    cf: {
                        fragments: { getByPath },
                    },
                },
            };

            const result = await getPublishedAttachedPromoVariations(aem, promotionFragment);

            expect(result).to.have.lengthOf(1);
            expect(result[0].path).to.equal(promoPath);
        });
    });

    describe('deleteAttachedPromoVariations', () => {
        it('delegates to the promotion-variations model layer', async () => {
            const promotionFragment = {
                getFieldValues: (name) => (name === 'fragments' ? ['/content/dam/mas/sandbox/en_US/my-card'] : undefined),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const getByPath = sandbox.stub().resolves(null);
            getByPath.withArgs(promoPath).resolves({ id: 'promo-var-id', path: promoPath, status: 'DRAFT' });
            const forceDelete = sandbox.stub().resolves();
            const aem = {
                sites: {
                    cf: {
                        fragments: { getByPath, forceDelete },
                    },
                },
            };

            await deleteAttachedPromoVariations(aem, promotionFragment);

            expect(forceDelete.calledOnceWith({ path: promoPath })).to.be.true;
        });
    });

    describe('probePromoVariationsForFragment', () => {
        it('delegates to the promotion-variations model layer and returns its result', async () => {
            const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoTag = 'mas:promotion/black-friday';
            const variationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const getByPath = sandbox.stub();
            getByPath.withArgs(variationPath).resolves({ id: 'var-1', path: variationPath, fields: [] });
            getByPath.resolves(null);
            const aem = { sites: { cf: { fragments: { getByPath } } } };

            const result = await probePromoVariationsForFragment(aem, defaultPath, promoTag);

            expect(result).to.have.lengthOf(1);
            expect(result[0].path).to.equal(variationPath);
        });
    });

    describe('buildPromoVariationParentRefreshCallback', () => {
        it('does nothing when the parent store is not found in Store.fragments.list.data', async () => {
            sandbox.stub(Store.fragments.list.data, 'get').returns([]);
            const refreshFragment = sandbox.stub().resolves();
            const callback = buildPromoVariationParentRefreshCallback('missing-id', refreshFragment);

            await callback({ id: 'created', path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card' });

            expect(refreshFragment.called).to.be.false;
        });

        it('does nothing after refresh when the parent store has no data', async () => {
            const parentStore = { get: sandbox.stub(), refreshFrom: sandbox.stub() };
            parentStore.get.onFirstCall().returns({ id: 'parent-1' });
            parentStore.get.onSecondCall().returns(null);
            sandbox.stub(Store.fragments.list.data, 'get').returns([parentStore]);
            const refreshFragment = sandbox.stub().resolves();
            const callback = buildPromoVariationParentRefreshCallback('parent-1', refreshFragment);

            await callback({ id: 'created', path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card' });

            expect(refreshFragment.calledOnce).to.be.true;
            expect(parentStore.refreshFrom.called).to.be.false;
        });
    });

    describe('mergePromoReferencesIntoFragmentData', () => {
        it('returns fragmentData unchanged when it cannot be probed for promo variations', async () => {
            const fragmentData = { path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card', references: [] };
            const result = await mergePromoReferencesIntoFragmentData({}, fragmentData, () => Promise.resolve());
            expect(result).to.equal(fragmentData);
        });
    });

    describe('resolveDefaultFragmentForPromoVariation edge cases', () => {
        it('returns null when no promoVariationId is provided so the model layer cannot resolve a promo name', async () => {
            Store.promotions.list.data.set([]);
            Store.promotions.list.data.setMeta('listFetched', true);
            const aem = { sites: { cf: { fragments: { getById: sandbox.stub().resolves(null) } } } };

            const result = await resolveDefaultFragmentForPromoVariation(
                aem,
                '/content/dam/mas/sandbox/en_US/promotions/sale/my-card',
                undefined,
                () => Promise.resolve(),
            );

            expect(result).to.be.null;
        });
    });
});
