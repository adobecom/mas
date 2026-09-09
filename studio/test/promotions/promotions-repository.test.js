import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import {
    assertPromoVariationGeoTagsValid,
    buildPromoVariationParentRefreshCallback,
    createPromoVariation,
    duplicatePromotionProject,
    getProjectGeosForTag,
    getPromotionProjectsForProbe,
    getPublishedAttachedPromoVariations,
    getUnpublishedAttachedPromoVariations,
    mergePromoReferencesIntoFragmentData,
    probePromoVariationsForFragment,
    resolveDefaultFragmentForPromoVariation,
} from '../../src/promotions/promotions-repository.js';
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

    describe('getProjectGeosForTag', () => {
        const makeProject = (tag, geos) => ({
            get: () => ({
                getFieldValues: (name) => {
                    if (name === 'tags') return [tag];
                    if (name === 'geos') return geos;
                    return [];
                },
            }),
        });

        it('returns the geos of the project matching the promotion tag', async () => {
            Store.promotions.list.data.set([
                makeProject('mas:promotion/spring-sale', ['mas:pzn/country/de']),
                makeProject('mas:promotion/black-friday', ['mas:pzn/country/ar', 'mas:pzn/country/fr']),
            ]);
            Store.promotions.list.data.setMeta('listFetched', true);

            const geos = await getProjectGeosForTag('mas:promotion/black-friday', () => Promise.resolve());

            expect(geos).to.deep.equal(['mas:pzn/country/ar', 'mas:pzn/country/fr']);
        });

        it('returns an empty list when no project carries the promotion tag', async () => {
            Store.promotions.list.data.set([makeProject('mas:promotion/spring-sale', ['mas:pzn/country/de'])]);
            Store.promotions.list.data.setMeta('listFetched', true);

            const geos = await getProjectGeosForTag('mas:promotion/black-friday', () => Promise.resolve());

            expect(geos).to.deep.equal([]);
        });

        it('loads promotions when the list was never fetched', async () => {
            Store.promotions.list.data.set([]);
            Store.promotions.list.data.removeMeta('listFetched');
            const loadPromotions = sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set([makeProject('mas:promotion/black-friday', ['mas:pzn/country/fr'])]);
                Store.promotions.list.data.setMeta('listFetched', true);
            });

            const geos = await getProjectGeosForTag('mas:promotion/black-friday', loadPromotions);

            expect(loadPromotions.calledOnce).to.be.true;
            expect(geos).to.deep.equal(['mas:pzn/country/fr']);
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
                        getFieldValues: (name) => (name === 'fragments' ? [defaultPath] : undefined),
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

    describe('assertPromoVariationGeoTagsValid', () => {
        const promoTag = 'mas:promotion/black-friday';
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const variationPath = `${promoFolder}/my-card`;
        const variationFragment = { id: 'var-1', path: variationPath, tags: [{ id: promoTag }] };

        it('does nothing when the fragment has no promotion tag', async () => {
            const aem = { sites: { cf: { fragments: {} } } };
            await assertPromoVariationGeoTagsValid(aem, { id: 'plain', path: defaultPath, tags: [] }, ['mas:pzn/country/de']);
        });

        it('throws when the requested geo tags overlap an existing sibling variation', async () => {
            Store.promotions.list.data.set([
                {
                    get: () => ({
                        getFieldValues: (name) => (name === 'tags' ? [promoTag] : []),
                    }),
                },
            ]);
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'sibling-1',
                        path: `${promoFolder}/my-card-2`,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                    },
                ],
            });
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(variationFragment),
                            getByPath: sandbox.stub().withArgs(defaultPath).resolves({ id: 'parent-1', path: defaultPath }),
                            search,
                        },
                    },
                },
            };

            try {
                await assertPromoVariationGeoTagsValid(aem, variationFragment, ['mas:pzn/country/ar'], () => Promise.resolve());
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('mas:pzn/country/ar');
            }
        });

        it('throws when a requested geo tag is not part of the promotion project', async () => {
            Store.promotions.list.data.set([
                {
                    get: () => ({
                        getFieldValues: (name) => {
                            if (name === 'tags') return [promoTag];
                            if (name === 'geos') return ['mas:pzn/country/fr'];
                            return [];
                        },
                    }),
                },
            ]);
            const search = makeSearchStub({ [promoFolder]: [] });
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(variationFragment),
                            getByPath: sandbox.stub().withArgs(defaultPath).resolves({ id: 'parent-1', path: defaultPath }),
                            search,
                        },
                    },
                },
            };

            try {
                await assertPromoVariationGeoTagsValid(aem, variationFragment, ['mas:pzn/country/de'], () => Promise.resolve());
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('mas:pzn/country/de');
            }
        });

        it('does not throw when the requested geo tags have no conflicts', async () => {
            Store.promotions.list.data.set([
                {
                    get: () => ({
                        getFieldValues: (name) => {
                            if (name === 'tags') return [promoTag];
                            if (name === 'geos') return ['mas:pzn/country/ar', 'mas:pzn/country/fr'];
                            return [];
                        },
                    }),
                },
            ]);
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'sibling-1',
                        path: `${promoFolder}/my-card-2`,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                    },
                ],
            });
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(variationFragment),
                            getByPath: sandbox.stub().withArgs(defaultPath).resolves({ id: 'parent-1', path: defaultPath }),
                            search,
                        },
                    },
                },
            };

            await assertPromoVariationGeoTagsValid(aem, variationFragment, ['mas:pzn/country/fr'], () => Promise.resolve());
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
                            search: makeSearchStub(),
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
        it('does nothing when the id is not a top-level entry and not a grouped variation', async () => {
            sandbox.stub(Store.fragments.list.data, 'get').returns([]);
            const getById = sandbox.stub().resolves({ id: 'missing-id', path: '/content/dam/mas/sandbox/en_US/my-card' });
            const aem = { sites: { cf: { fragments: { getById } } } };
            const refreshFragment = sandbox.stub().resolves();
            const callback = buildPromoVariationParentRefreshCallback(aem, 'missing-id', refreshFragment);

            await callback({ id: 'created', path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card' });

            expect(refreshFragment.called).to.be.false;
        });

        it('does nothing after refresh when the parent store has no data', async () => {
            const parentStore = { get: sandbox.stub(), refreshFrom: sandbox.stub() };
            parentStore.get.onFirstCall().returns({ id: 'parent-1' });
            parentStore.get.onSecondCall().returns(null);
            sandbox.stub(Store.fragments.list.data, 'get').returns([parentStore]);
            const aem = { sites: { cf: { fragments: { getById: sandbox.stub() } } } };
            const refreshFragment = sandbox.stub().resolves();
            const callback = buildPromoVariationParentRefreshCallback(aem, 'parent-1', refreshFragment);

            await callback({ id: 'created', path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card' });

            expect(refreshFragment.calledOnce).to.be.true;
            expect(parentStore.refreshFrom.called).to.be.false;
        });

        it('remaps a grouped-variation id to its top-level card before refreshing', async () => {
            const parentStore = { get: sandbox.stub().returns({ id: 'card-1', references: [] }), refreshFrom: sandbox.stub() };
            sandbox.stub(Store.fragments.list.data, 'get').returns([parentStore]);
            const groupedPath = '/content/dam/mas/sandbox/en_US/my-card/pzn/my-card-edu';
            const cardPath = '/content/dam/mas/sandbox/en_US/my-card';
            const getById = sandbox.stub();
            getById.withArgs('grouped-1').resolves({ id: 'grouped-1', path: groupedPath });
            getById.withArgs('card-1').resolves({ id: 'card-1', path: cardPath });
            const getByPath = sandbox
                .stub()
                .withArgs(cardPath)
                .resolves({ id: 'card-1', path: cardPath, fields: [{ name: 'variations', values: [groupedPath] }] });
            const getReferencedBy = sandbox
                .stub()
                .withArgs(groupedPath)
                .resolves({ parentReferences: [{ path: cardPath }] });
            const aem = { sites: { cf: { fragments: { getById, getByPath, getReferencedBy } } } };
            const refreshFragment = sandbox.stub().resolves();
            const callback = buildPromoVariationParentRefreshCallback(aem, 'grouped-1', refreshFragment);

            await callback({ id: 'created', path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card-edu' });

            expect(refreshFragment.calledOnceWith(parentStore)).to.be.true;
            expect(parentStore.refreshFrom.calledOnce).to.be.true;
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

    describe('duplicatePromotionProject', () => {
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const promoVariationPath = `${promoFolder}/my-card`;

        function makeSourcePromotion() {
            return {
                fields: [
                    { name: 'title', type: 'text', values: ['Black Friday'] },
                    { name: 'tags', type: 'tag', multiple: true, values: ['mas:promotion/black-friday'] },
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: [defaultPath] },
                ],
                tags: [{ id: 'mas:promotion/black-friday' }],
                getFieldValues: (name) =>
                    name === 'fragments' ? [defaultPath] : name === 'tags' ? ['mas:promotion/black-friday'] : [],
            };
        }

        it('creates the duplicated project fragment via repository.createFragment', async () => {
            const newPromotion = { id: 'new-promo-1' };
            const repository = {
                createFragment: sandbox.stub().resolves(newPromotion),
                getPromotionsPath: () => '/content/dam/mas/promotions',
                aem: {
                    sites: { cf: { fragments: { search: makeSearchStub() } } },
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
            };

            const result = await duplicatePromotionProject(repository, makeSourcePromotion(), { title: 'Black Friday copy' });

            expect(result).to.deep.equal(newPromotion);
            expect(repository.createFragment.calledOnce).to.be.true;
            const [payload, addToStoreList] = repository.createFragment.firstCall.args;
            expect(payload.parentPath).to.equal('/content/dam/mas/promotions');
            expect(payload.fields.find((f) => f.name === 'title').values).to.deep.equal(['Black Friday copy']);
            expect(payload.fields.find((f) => f.name === 'tags').values).to.deep.equal(['mas:promotion/black-friday-copy']);
            expect(addToStoreList).to.be.false;
        });

        it('creates the new promotion tag in AEM before creating the fragment', async () => {
            const repository = {
                createFragment: sandbox.stub().resolves({ id: 'new-promo-1' }),
                getPromotionsPath: () => '/content/dam/mas/promotions',
                aem: {
                    sites: { cf: { fragments: { search: makeSearchStub() } } },
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
            };

            await duplicatePromotionProject(repository, makeSourcePromotion(), { title: 'Black Friday copy' });

            expect(repository.aem.tags.create.calledOnce).to.be.true;
            const [tagPath, slug] = repository.aem.tags.create.firstCall.args;
            expect(slug).to.equal('black-friday-copy');
            expect(tagPath).to.include('black-friday-copy');
            expect(repository.aem.tags.create.calledBefore(repository.createFragment)).to.be.true;
        });

        it('deletes the newly created tag when fragment creation fails', async () => {
            const repository = {
                createFragment: sandbox.stub().rejects(new Error('boom')),
                getPromotionsPath: () => '/content/dam/mas/promotions',
                aem: {
                    sites: { cf: { fragments: { search: makeSearchStub() } } },
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
            };

            let thrown = null;
            try {
                await duplicatePromotionProject(repository, makeSourcePromotion(), { title: 'Black Friday copy' });
            } catch (error) {
                thrown = error;
            }

            expect(thrown?.message).to.equal('boom');
            expect(repository.aem.tags.delete.calledOnce).to.be.true;
            expect(repository.aem.tags.delete.firstCall.args[0]).to.include('black-friday-copy');
        });

        it('deletes the newly created tag and does not clone variations when createFragment resolves undefined', async () => {
            const search = makeSearchStub({ [promoFolder]: [{ id: 'existing-var', path: promoVariationPath, fields: [] }] });
            const repository = {
                createFragment: sandbox.stub().resolves(undefined),
                getPromotionsPath: () => '/content/dam/mas/promotions',
                aem: {
                    sites: { cf: { fragments: { search } } },
                    createFragmentCopy: sandbox.stub(),
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
            };

            let thrown = null;
            try {
                await duplicatePromotionProject(repository, makeSourcePromotion(), {
                    title: 'Black Friday copy',
                    duplicateVariations: true,
                });
            } catch (error) {
                thrown = error;
            }

            expect(thrown).to.not.be.null;
            expect(repository.aem.tags.delete.calledOnce).to.be.true;
            expect(search.called).to.be.false;
            expect(repository.aem.createFragmentCopy.called).to.be.false;
        });

        it('does not probe or clone promo variations when duplicateVariations is false', async () => {
            const search = makeSearchStub({ [promoFolder]: [{ id: 'existing-var', path: promoVariationPath, fields: [] }] });
            const repository = {
                createFragment: sandbox.stub().resolves({ id: 'new-promo-1' }),
                getPromotionsPath: () => '/content/dam/mas/promotions',
                aem: {
                    sites: { cf: { fragments: { search }, createFragmentCopy: sandbox.stub() } },
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
            };

            await duplicatePromotionProject(repository, makeSourcePromotion(), {
                title: 'Black Friday copy',
                duplicateVariations: false,
            });

            expect(search.called).to.be.false;
        });

        it('clones each attached promo variation under the new promotion tag when duplicateVariations is true', async () => {
            const search = makeSearchStub({ [promoFolder]: [{ id: 'existing-var', path: promoVariationPath, fields: [] }] });
            const createdVariation = { id: 'new-promo-var-1', path: promoVariationPath };
            const getById = sandbox.stub();
            getById
                .withArgs('existing-var')
                .resolves({ id: 'existing-var', path: promoVariationPath, tags: [{ id: 'mas:promotion/black-friday' }] });
            getById.withArgs('default-frag-1').resolves({ id: 'default-frag-1', path: defaultPath, tags: [] });
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            search,
                            getByPath: sandbox
                                .stub()
                                .withArgs(defaultPath)
                                .resolves({ id: 'default-frag-1', path: defaultPath, fields: [] }),
                            getById,
                            ensureFolderExists: sandbox.stub().resolves(),
                            pollCreatedFragment: sandbox.stub().resolves(createdVariation),
                        },
                    },
                },
                getCsrfToken: sandbox.stub().resolves('csrf-token'),
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var-1' }),
                wait: sandbox.stub().resolves(),
                saveTags: sandbox.stub().resolves(),
                tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
            };
            const repository = {
                createFragment: sandbox.stub().resolves({ id: 'new-promo-1' }),
                getPromotionsPath: () => '/content/dam/mas/promotions',
                aem,
            };

            await duplicatePromotionProject(repository, makeSourcePromotion(), {
                title: 'Black Friday copy',
                duplicateVariations: true,
            });

            expect(aem.createFragmentCopy.calledOnce).to.be.true;
            const newTags = aem.saveTags.firstCall.args[0].newTags;
            expect(newTags).to.include('mas:promotion/black-friday-copy');
            expect(newTags).to.not.include('mas:promotion/black-friday');
        });

        it('clones a promo variation sourced from a PZN variation using that PZN fragment as source, not the default', async () => {
            const groupedPromoFolder = `${promoFolder}/my-card/pzn`;
            const groupedPromoPath = `${groupedPromoFolder}/edu`;
            const groupedSourcePath = '/content/dam/mas/sandbox/en_US/my-card/pzn/edu';
            const search = makeSearchStub({
                [promoFolder]: [],
                [groupedPromoFolder]: [{ id: 'grouped-promo-var-id', path: groupedPromoPath, status: 'DRAFT', fields: [] }],
            });
            const getById = sandbox.stub();
            getById
                .withArgs('grouped-promo-var-id')
                .resolves({ id: 'grouped-promo-var-id', path: groupedPromoPath, tags: [{ id: 'mas:promotion/black-friday' }] });
            getById.withArgs('grouped-source-id').resolves({ id: 'grouped-source-id', path: groupedSourcePath, tags: [] });
            getById.withArgs('default-frag-1').resolves({ id: 'default-frag-1', path: defaultPath, tags: [] });
            const getByPath = sandbox.stub();
            getByPath.withArgs(groupedSourcePath).resolves({ id: 'grouped-source-id', path: groupedSourcePath, fields: [] });
            getByPath.withArgs(defaultPath).resolves({ id: 'default-frag-1', path: defaultPath, fields: [] });
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            search,
                            getById,
                            getByPath,
                            getReferencedBy: sandbox.stub().resolves({ parentReferences: [] }),
                            ensureFolderExists: sandbox.stub().resolves(),
                            pollCreatedFragment: sandbox
                                .stub()
                                .resolves({ id: 'new-grouped-promo-var', path: groupedPromoPath }),
                        },
                    },
                },
                getCsrfToken: sandbox.stub().resolves('csrf-token'),
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-grouped-promo-var' }),
                wait: sandbox.stub().resolves(),
                saveTags: sandbox.stub().resolves(),
                tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
            };
            const repository = {
                createFragment: sandbox.stub().resolves({ id: 'new-promo-1' }),
                getPromotionsPath: () => '/content/dam/mas/promotions',
                aem,
            };

            await duplicatePromotionProject(repository, makeSourcePromotion(), {
                title: 'Black Friday copy',
                duplicateVariations: true,
            });

            expect(getById.calledWith('grouped-source-id')).to.be.true;
            expect(getById.calledWith('default-frag-1')).to.be.false;
        });

        it('avoids a suffixed-index collision with another attached fragment when cloning a variation', async () => {
            const collidingPath = `${defaultPath}-2`;
            const newPromoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday-copy';
            const sourcePromotion = {
                fields: [
                    { name: 'title', values: ['Black Friday'] },
                    { name: 'tags', values: ['mas:promotion/black-friday'] },
                    { name: 'fragments', values: [defaultPath, collidingPath] },
                ],
                tags: [{ id: 'mas:promotion/black-friday' }],
                getFieldValues: (name) =>
                    name === 'fragments' ? [defaultPath, collidingPath] : name === 'tags' ? ['mas:promotion/black-friday'] : [],
            };
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'existing-var',
                        path: promoVariationPath,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/fr'] }],
                    },
                ],
                [newPromoFolder]: [
                    {
                        id: 'pre-existing-clone',
                        path: `${newPromoFolder}/my-card`,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/de'] }],
                    },
                ],
            });
            const getById = sandbox.stub();
            getById
                .withArgs('existing-var')
                .resolves({ id: 'existing-var', path: promoVariationPath, tags: [{ id: 'mas:promotion/black-friday' }] });
            getById.withArgs('default-frag-1').resolves({ id: 'default-frag-1', path: defaultPath, tags: [] });
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            search,
                            getByPath: sandbox
                                .stub()
                                .withArgs(defaultPath)
                                .resolves({ id: 'default-frag-1', path: defaultPath, fields: [] }),
                            getById,
                            ensureFolderExists: sandbox.stub().resolves(),
                            pollCreatedFragment: sandbox.stub().resolves({ id: 'new-promo-var', path: 'irrelevant' }),
                        },
                    },
                },
                getCsrfToken: sandbox.stub().resolves('csrf-token'),
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var' }),
                wait: sandbox.stub().resolves(),
                saveTags: sandbox.stub().resolves(),
                tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
            };
            const repository = {
                createFragment: sandbox.stub().resolves({ id: 'new-promo-1' }),
                getPromotionsPath: () => '/content/dam/mas/promotions',
                aem,
            };

            await duplicatePromotionProject(repository, sourcePromotion, {
                title: 'Black Friday copy',
                duplicateVariations: true,
            });

            const fragmentName = aem.createFragmentCopy.firstCall.args[2];
            expect(fragmentName).to.equal('my-card-3');
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
