import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import {
    buildPromoVariationParentRefreshCallback,
    createPromoVariation,
    getPromotionProjectPathsReferencing,
    getPromotionProjectsForProbe,
    getPublishedAttachedPromoVariations,
    getUnpublishedAttachedPromoVariations,
    mergePromoReferencesIntoFragmentData,
    probePromoVariationsForFragment,
    removeDeletedFragmentFromPromotionProjects,
    resolveDefaultFragmentForPromoVariation,
} from '../../src/promotions/promotions-repository.js';
import { PROMOTION_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../src/constants.js';
import { makeSearchStub as makeSharedSearchStub } from '../helpers/aem-tag-fetch.js';

describe('promotions-repository', () => {
    let sandbox;

    const makeSearchStub = (itemsByFolder = {}) => makeSharedSearchStub(sandbox, itemsByFolder);

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
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const search = makeSearchStub({ [promoFolder]: [{ id: 'promo-var', path: promoPath }] });
            const aem = {
                sites: {
                    cf: {
                        fragments: { search },
                    },
                },
            };

            const result = await mergePromoReferencesIntoFragmentData(aem, { path: defaultPath, references: [] }, () =>
                Promise.resolve(),
            );

            expect(result.references).to.have.lengthOf(1);
            expect(result.references[0].path).to.equal(promoPath);
            expect(result.promoVariationProbeNotNeeded).to.be.true;
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
                            search: makeSearchStub(),
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
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const search = makeSearchStub();
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(parentFragment),
                            search,
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

            expect(search.calledWith({ path: promoFolder }, 50)).to.be.true;
        });

        it('creates a geo-specific variation even when a legacy sibling (no pznTags) already exists', async () => {
            const variation2Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const search = makeSearchStub({ [promoFolder]: [{ id: 'existing-var', path: targetPath, fields: [] }] });
            const createdFragment = { id: 'new-promo-var-2', path: variation2Path };
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(parentFragment),
                            search,
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
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const promoPath = `${promoFolder}/my-card`;
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'DRAFT', title: 'Promo Card' }],
            });
            const aem = {
                sites: {
                    cf: {
                        fragments: { search },
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
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const promoPath = `${promoFolder}/my-card`;
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'PUBLISHED', title: 'Promo Card' }],
            });
            const aem = {
                sites: {
                    cf: {
                        fragments: { search },
                    },
                },
            };

            const result = await getPublishedAttachedPromoVariations(aem, promotionFragment);

            expect(result).to.have.lengthOf(1);
            expect(result[0].path).to.equal(promoPath);
        });
    });

    describe('probePromoVariationsForFragment', () => {
        it('delegates to the promotion-variations model layer and returns its result', async () => {
            const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoTag = 'mas:promotion/black-friday';
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const variationPath = `${promoFolder}/my-card`;
            const search = makeSearchStub({ [promoFolder]: [{ id: 'var-1', path: variationPath, fields: [] }] });
            const aem = { sites: { cf: { fragments: { search } } } };

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
        it('marks promoVariationProbeNotNeeded but leaves other fields untouched when it cannot be probed', async () => {
            const fragmentData = { path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card', references: [] };
            const result = await mergePromoReferencesIntoFragmentData({}, fragmentData, () => Promise.resolve());
            expect(result).to.not.equal(fragmentData);
            expect(result.promoVariationProbeNotNeeded).to.be.true;
            expect(result.references).to.deep.equal(fragmentData.references);
            expect(result.path).to.equal(fragmentData.path);
        });
    });

    describe('getPromotionProjectPathsReferencing', () => {
        it('returns candidate project paths referencing the fragment', async () => {
            const fragmentPath = '/content/dam/mas/sandbox/en_US/my-card/pzn/my-grouped-variation';
            const projectPath = '/content/dam/mas/sandbox/promotions/summer-sale';
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getReferencedBy: sandbox.stub().resolves({ parentReferences: [{ path: projectPath }] }),
                        },
                    },
                },
            };

            const paths = await getPromotionProjectPathsReferencing(aem, fragmentPath);

            expect(paths).to.deep.equal([projectPath]);
        });

        it('returns an empty array and logs when the lookup throws', async () => {
            const fragmentPath = '/content/dam/mas/sandbox/en_US/my-card/pzn/my-grouped-variation';
            const aem = {
                sites: { cf: { fragments: { getReferencedBy: sandbox.stub().rejects(new Error('lookup failed')) } } },
            };
            const errorSpy = sandbox.stub(console, 'error');

            const paths = await getPromotionProjectPathsReferencing(aem, fragmentPath);

            expect(paths).to.deep.equal([]);
            expect(errorSpy.calledWith(`Failed to look up references for ${fragmentPath}:`, sinon.match.instanceOf(Error))).to
                .be.true;
        });
    });

    describe('removeDeletedFragmentFromPromotionProjects', () => {
        it('removes a deleted fragment path from any promotion project that still lists it, without refetching the etag', async () => {
            const deletedPath = '/content/dam/mas/sandbox/en_US/my-card/pzn/my-grouped-variation';
            const otherPath = '/content/dam/mas/sandbox/en_US/other-card';
            const projectPath = '/content/dam/mas/sandbox/promotions/summer-sale';
            const latestProject = {
                id: 'promo-1',
                fields: [{ name: 'fragments', type: 'content-fragment', multiple: true, values: [deletedPath, otherPath] }],
            };
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().resolves({ id: 'promo-1', model: { path: PROMOTION_MODEL_PATH } }),
                            getWithEtag: sandbox.stub().resolves(latestProject),
                            save: sandbox.stub().resolves(),
                        },
                    },
                },
            };

            await removeDeletedFragmentFromPromotionProjects(aem, deletedPath, [projectPath]);

            expect(aem.sites.cf.fragments.getByPath.calledWith(projectPath)).to.be.true;
            expect(aem.sites.cf.fragments.getWithEtag.calledWith('promo-1')).to.be.true;
            const [savedProject, saveOptions] = aem.sites.cf.fragments.save.firstCall.args;
            expect(savedProject.getFieldValues('fragments')).to.deep.equal([otherPath]);
            expect(saveOptions).to.deep.equal({ refetchEtag: false });
        });

        it('skips references that are not promotion projects', async () => {
            const deletedPath = '/content/dam/mas/sandbox/en_US/my-card/pzn/my-grouped-variation';
            const collectionPath = '/content/dam/mas/sandbox/en_US/some-collection';
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().resolves({ id: 'coll-1', model: { path: COLLECTION_MODEL_PATH } }),
                            getWithEtag: sandbox.stub(),
                            save: sandbox.stub(),
                        },
                    },
                },
            };

            await removeDeletedFragmentFromPromotionProjects(aem, deletedPath, [collectionPath]);

            expect(aem.sites.cf.fragments.getWithEtag.called).to.be.false;
            expect(aem.sites.cf.fragments.save.called).to.be.false;
        });

        it('does not save when the promotion project no longer references the deleted path', async () => {
            const deletedPath = '/content/dam/mas/sandbox/en_US/my-card/pzn/my-grouped-variation';
            const otherPath = '/content/dam/mas/sandbox/en_US/other-card';
            const projectPath = '/content/dam/mas/sandbox/promotions/summer-sale';
            const latestProject = {
                id: 'promo-1',
                fields: [{ name: 'fragments', type: 'content-fragment', multiple: true, values: [otherPath] }],
            };
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().resolves({ id: 'promo-1', model: { path: PROMOTION_MODEL_PATH } }),
                            getWithEtag: sandbox.stub().resolves(latestProject),
                            save: sandbox.stub(),
                        },
                    },
                },
            };

            await removeDeletedFragmentFromPromotionProjects(aem, deletedPath, [projectPath]);

            expect(aem.sites.cf.fragments.save.called).to.be.false;
        });

        it('does nothing when there are no candidate paths', async () => {
            const aem = { sites: { cf: { fragments: { getByPath: sandbox.stub() } } } };

            await removeDeletedFragmentFromPromotionProjects(aem, '/content/dam/mas/sandbox/en_US/my-card', []);

            expect(aem.sites.cf.fragments.getByPath.called).to.be.false;
        });

        it('logs and continues with remaining candidates when updating one promotion project fails', async () => {
            const deletedPath = '/content/dam/mas/sandbox/en_US/my-card/pzn/my-grouped-variation';
            const failingProjectPath = '/content/dam/mas/sandbox/promotions/broken';
            const workingProjectPath = '/content/dam/mas/sandbox/promotions/summer-sale';
            const workingProject = {
                id: 'promo-2',
                fields: [{ name: 'fragments', type: 'content-fragment', multiple: true, values: [deletedPath] }],
            };
            const getByPath = sandbox.stub();
            getByPath.withArgs(failingProjectPath).rejects(new Error('project lookup failed'));
            getByPath.withArgs(workingProjectPath).resolves({ id: 'promo-2', model: { path: PROMOTION_MODEL_PATH } });
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getByPath,
                            getWithEtag: sandbox.stub().resolves(workingProject),
                            save: sandbox.stub().resolves(),
                        },
                    },
                },
            };
            const errorSpy = sandbox.stub(console, 'error');

            await removeDeletedFragmentFromPromotionProjects(aem, deletedPath, [failingProjectPath, workingProjectPath]);

            expect(
                errorSpy.calledWith(
                    `Failed to remove ${deletedPath} from promotion project ${failingProjectPath}:`,
                    sinon.match.instanceOf(Error),
                ),
            ).to.be.true;
            const savedProject = aem.sites.cf.fragments.save.firstCall.args[0];
            expect(savedProject.getFieldValues('fragments')).to.deep.equal([]);
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
