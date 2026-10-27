import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { TABLE_TYPE, COLLECTION_MODEL_PATH, CARD_MODEL_PATH } from '../../src/constants.js';
import {
    loadAllPlaceholders,
    loadAllFragments,
    loadSelectedPlaceholders,
    loadSelectedFragments,
    loadCardVariations,
    fetchUnresolvedVariations,
    fetchVariationByPath,
    setCardVariationsByPaths,
} from '../../src/common/utils/items-loader.js';

describe('translation-items-loader', () => {
    let sandbox;

    const mockGetDisplayName = () => 'mock-display-name';
    const resetStore = () => {
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.cardsByPaths.set(new Map());
        Store.translationProjects.displayCards.set([]);
        setCardVariationsByPaths(new Map(), Store.translationProjects);
        Store.translationProjects.allCollections.set([]);
        Store.translationProjects.collectionsByPaths.set(new Map());
        Store.translationProjects.displayCollections.set([]);
        Store.translationProjects.allPlaceholders.set([]);
        Store.translationProjects.placeholdersByPaths.set(new Map());
        Store.translationProjects.displayPlaceholders.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
        Store.translationProjects.offerDataCache.clear();
        Store.fragments.list.data.set([]);
        Store.placeholders.list.data.set([]);
        Store.search.set((prev) => ({ ...(prev || {}), path: 'acom' }));
    };

    const createMockCommerceService = () => {
        const service = document.createElement('mas-commerce-service');
        service.collectPriceOptions = sinon.stub().returns({});
        service.resolveOfferSelectors = sinon.stub().returns([Promise.resolve([{ offerId: 'test-offer-id' }])]);
        document.body.appendChild(service);
        return service;
    };

    const removeMockCommerceService = () => {
        const service = document.querySelector('mas-commerce-service');
        if (service) service.remove();
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setItemsSelectionStore(Store.translationProjects);
        resetStore();
        createMockCommerceService();
    });

    afterEach(() => {
        sandbox.restore();
        resetStore();
        removeMockCommerceService();
        setItemsSelectionStore(null);
    });

    describe('setCardVariationsByPaths', () => {
        it('should set groupedVariationsByParent and update groupedVariationsData with flattened map', () => {
            const variation1 = { path: '/card1/pzn/v1', title: 'Variation 1' };
            const variation2 = { path: '/card2/pzn/v2', title: 'Variation 2' };
            const groupedVariationsByParent = new Map([
                ['/card1', new Map([['/card1/pzn/v1', variation1]])],
                ['/card2', new Map([['/card2/pzn/v2', variation2]])],
            ]);

            setCardVariationsByPaths(groupedVariationsByParent, Store.translationProjects);

            expect(Store.translationProjects.groupedVariationsByParent.value).to.equal(groupedVariationsByParent);
            expect(Store.translationProjects.groupedVariationsData.value.get('/card1/pzn/v1')).to.equal(variation1);
            expect(Store.translationProjects.groupedVariationsData.value.get('/card2/pzn/v2')).to.equal(variation2);
        });

        it('should clear both stores when passed empty Map', () => {
            setCardVariationsByPaths(new Map(), Store.translationProjects);
            expect(Store.translationProjects.groupedVariationsByParent.value.size).to.equal(0);
            expect(Store.translationProjects.groupedVariationsData.value.size).to.equal(0);
        });
    });

    describe('personalization tags without fieldTags', () => {
        const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
        const variationPath = `${cardPath}/pzn/edu`;
        const tagSources = {
            pznTags: { fields: [{ name: 'pznTags', values: ['mas:pzn/edu'] }] },
            metadata: { fields: [], tags: [{ id: 'mas:pzn/edu' }] },
        };

        for (const [source, data] of Object.entries(tagSources)) {
            const repo = () => ({
                aem: { getFragmentByPath: sandbox.stub().resolves({ path: variationPath, fieldTags: [], ...data }) },
            });

            for (const name of [
                'promotions',
                'translationProjects',
                'compareChart',
                'collectionCards',
                'bulkPublishProjects',
            ]) {
                it(`fetchVariationByPath limits ${source} eligibility to Promotions in ${name}`, async () => {
                    const store = Store[name];
                    const groupedVariations = store.groupedVariationsByParent.get();
                    try {
                        await fetchVariationByPath(variationPath, repo(), {
                            getDisplayName: mockGetDisplayName,
                            store,
                        });
                        expect(store.groupedVariationsData.get().has(variationPath)).to.equal(name === 'promotions');
                    } finally {
                        setCardVariationsByPaths(groupedVariations, store);
                    }
                });

                it(`loadCardVariations limits ${source} eligibility to Promotions in ${name}`, async () => {
                    const store = Store[name];
                    const groupedVariations = store.groupedVariationsByParent.get();
                    try {
                        await loadCardVariations(cardPath, [variationPath], repo(), {
                            getDisplayName: mockGetDisplayName,
                            store,
                        });
                        expect(store.groupedVariationsData.get().has(variationPath)).to.equal(name === 'promotions');
                    } finally {
                        setCardVariationsByPaths(groupedVariations, store);
                    }
                });
            }
        }
    });

    describe('loadAllPlaceholders', () => {
        it('should return no-op subscription when allPlaceholders already has data', () => {
            Store.translationProjects.allPlaceholders.set([{ path: '/p1', key: 'k1', value: 'v1' }]);
            const result = loadAllPlaceholders(Store.translationProjects);
            expect(result).to.have.property('unsubscribe');
            expect(result.unsubscribe).to.be.a('function');
            expect(Store.translationProjects.allPlaceholders.get()).to.have.lengthOf(1);
        });

        it('should subscribe and populate store when placeholders list updates', () => {
            const result = loadAllPlaceholders(Store.translationProjects);
            expect(result.unsubscribe).to.be.a('function');

            const mockPlaceholder = {
                value: { path: '/path/p1', key: 'key1', value: 'value1' },
            };
            Store.placeholders.list.data.set([mockPlaceholder]);

            expect(Store.translationProjects.allPlaceholders.get()).to.have.lengthOf(1);
            expect(Store.translationProjects.allPlaceholders.get()[0].path).to.equal('/path/p1');
            expect(Store.translationProjects.displayPlaceholders.get()).to.have.lengthOf(1);

            result.unsubscribe();
        });

        it('should return subscription with working unsubscribe', () => {
            const result = loadAllPlaceholders(Store.translationProjects);
            expect(() => result.unsubscribe()).to.not.throw();
        });
    });

    describe('loadAllFragments', () => {
        for (const name of ['promotions', 'translationProjects', 'compareChart', 'collectionCards', 'bulkPublishProjects']) {
            it(`restarts cancelled WCS loading without a partial cache in ${name}`, async () => {
                const store = Store[name];
                const service = document.querySelector('mas-commerce-service');
                let resolveOffer;
                service.resolveOfferSelectors.returns([
                    new Promise((resolve) => {
                        resolveOffer = resolve;
                    }),
                ]);
                Store.fragments.list.data.set([
                    {
                        value: new Fragment({
                            path: '/content/dam/mas/sandbox/en_US/card',
                            model: { path: CARD_MODEL_PATH },
                            fields: [{ name: 'osi', values: ['parent-osi'] }],
                        }),
                    },
                ]);
                const state = { abortController: new AbortController() };
                let subscription = loadAllFragments(TABLE_TYPE.CARDS, null, state, {
                    getDisplayName: mockGetDisplayName,
                    store,
                });

                try {
                    await waitUntil(() => service.resolveOfferSelectors.called);
                    subscription.unsubscribe();
                    state.abortController.abort();
                    resolveOffer([{ offerId: 'cancelled-offer' }]);
                    await waitUntil(() => !state.isProcessingCards);
                    expect(store.allCards.get()).to.deep.equal([]);
                    service.resolveOfferSelectors.returns([Promise.resolve([{ offerId: 'reloaded-offer' }])]);
                    const nextState = { abortController: new AbortController() };
                    subscription = loadAllFragments(TABLE_TYPE.CARDS, null, nextState, {
                        getDisplayName: mockGetDisplayName,
                        store,
                    });
                    await waitUntil(() => !nextState.isProcessingCards);
                    expect(store.allCards.get()[0].offerData.offerId).to.equal('reloaded-offer');
                } finally {
                    resolveOffer([]);
                    await waitUntil(() => !state.isProcessingCards);
                    subscription.unsubscribe();
                    store.allCards.set([]);
                    store.cardsByPaths.set(new Map());
                    store.displayCards.set([]);
                    setCardVariationsByPaths(new Map(), store);
                    store.offerDataCache.clear();
                }
            });

            it(`limits selected-card path discovery without hydrated references to Promotions in ${name}`, async () => {
                const cardPath = '/content/dam/mas/sandbox/en_US/parent';
                const variationPath = `${cardPath}/pzn/edu`;
                const getFragmentByPath = sandbox.stub();
                getFragmentByPath.withArgs(cardPath).resolves({
                    path: cardPath,
                    fields: [{ name: 'variations', values: [variationPath] }],
                    references: [],
                });
                getFragmentByPath.withArgs(variationPath).resolves({
                    path: variationPath,
                    fields: [{ name: 'pznTags', values: ['mas:pzn/edu'] }],
                });
                const onItems = sandbox.spy();
                await loadSelectedFragments(
                    [cardPath],
                    TABLE_TYPE.CARDS,
                    { aem: { getFragmentByPath } },
                    {
                        onItems,
                        getDisplayName: mockGetDisplayName,
                        store: Store[name],
                    },
                );
                expect(onItems.calledOnce).to.be.true;
                expect(onItems.firstCall.args[0][0].groupedVariations.map(({ path }) => path)).to.deep.equal(
                    name === 'promotions' ? [variationPath] : [],
                );
                expect(getFragmentByPath.calledWith(variationPath)).to.equal(name === 'promotions');
            });
        }

        it('publishes an unchanged empty snapshot only once', async () => {
            const allCardsSet = sandbox.spy(Store.translationProjects.allCards, 'set');
            const state = {};
            const subscription = loadAllFragments(TABLE_TYPE.CARDS, null, state, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            try {
                await waitUntil(() => !state.isProcessingCards);
                expect(allCardsSet.calledOnce).to.be.true;
            } finally {
                subscription.unsubscribe();
            }
        });

        it('does not publish variation maps for batches without grouped variations', async () => {
            const parentSet = sandbox.spy(Store.translationProjects.groupedVariationsByParent, 'set');
            const dataSet = sandbox.spy(Store.translationProjects.groupedVariationsData, 'set');
            const state = {};
            const subscription = loadAllFragments(TABLE_TYPE.CARDS, null, state, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            try {
                await waitUntil(() => !state.isProcessingCards);
                Store.fragments.list.data.set([
                    { value: new Fragment({ path: '/card/without-variations', model: { path: CARD_MODEL_PATH } }) },
                ]);
                await waitUntil(() => !state.isProcessingCards);

                expect(parentSet.called).to.be.false;
                expect(dataSet.called).to.be.false;
            } finally {
                subscription.unsubscribe();
            }
        });

        it('publishes updated variation data even when its path stays the same', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/card1';
            const variationPath = `${cardPath}/pzn/v1`;
            const card = new Fragment({
                path: cardPath,
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variations', values: [variationPath] }],
                references: [{ path: variationPath }],
            });
            const getFragmentByPath = sandbox.stub().resolves({
                path: variationPath,
                title: 'Original',
                fieldTags: [{ id: 't1' }],
                fields: [],
            });
            const state = {};
            const subscription = loadAllFragments(TABLE_TYPE.CARDS, { aem: { getFragmentByPath } }, state, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            try {
                await waitUntil(() => !state.isProcessingCards);
                Store.fragments.list.data.set([{ value: card }]);
                await waitUntil(() => !state.isProcessingCards);
                const parentSet = sandbox.spy(Store.translationProjects.groupedVariationsByParent, 'set');
                const dataSet = sandbox.spy(Store.translationProjects.groupedVariationsData, 'set');
                getFragmentByPath.resolves({
                    path: variationPath,
                    title: 'Updated',
                    fieldTags: [{ id: 't1' }],
                    fields: [],
                });
                Store.translationProjects.allCards.set([]);

                Store.fragments.list.data.set([{ value: card }]);
                await waitUntil(() => !state.isProcessingCards);

                expect(parentSet.calledOnce).to.be.true;
                expect(dataSet.calledOnce).to.be.true;
                expect(Store.translationProjects.groupedVariationsData.get().get(variationPath).title).to.equal('Updated');
            } finally {
                subscription.unsubscribe();
            }
        });

        it('publishes Promotions EDU variations only after offer enrichment completes', async () => {
            const variationPath = '/content/dam/mas/sandbox/en_US/PA-2511/pzn/edu';
            const card = new Fragment({
                path: '/content/dam/mas/sandbox/en_US/robert',
                model: { path: CARD_MODEL_PATH },
                fields: [
                    { name: 'osi', values: ['parent-osi'] },
                    { name: 'variations', values: [variationPath] },
                ],
                references: [],
            });
            let resolveOffer;
            document.querySelector('mas-commerce-service').resolveOfferSelectors.returns([
                new Promise((resolve) => {
                    resolveOffer = resolve;
                }),
            ]);
            const state = {};
            const onReady = sandbox.spy();
            Store.fragments.list.firstPageLoaded.set(false);
            Store.fragments.list.data.set([{ value: card }]);
            const subscription = loadAllFragments(
                TABLE_TYPE.CARDS,
                {
                    aem: {
                        getFragmentByPath: sandbox.stub().resolves({
                            path: variationPath,
                            fields: [{ name: 'pznTags', values: ['mas:pzn/edu'] }],
                        }),
                    },
                },
                state,
                { getDisplayName: mockGetDisplayName, store: Store.promotions, onReady },
            );

            try {
                await waitUntil(() => document.querySelector('mas-commerce-service').resolveOfferSelectors.called);
                expect(onReady.called).to.be.false;
                expect(Store.promotions.allCards.get()).to.deep.equal([]);
                resolveOffer([{ offerId: 'parent-offer' }]);
                await waitUntil(() => onReady.called);
                const variations = Store.promotions.allCards.get()[0].groupedVariations;
                expect(variations.map(({ path }) => path)).to.deep.equal([variationPath]);
                expect(Store.promotions.allCards.get()[0].offerData.offerId).to.equal('parent-offer');
                expect(Store.promotions.groupedVariationsData.get().has(variationPath)).to.be.true;
            } finally {
                resolveOffer([{ offerId: 'parent-offer' }]);
                await waitUntil(() => !state.isProcessingCards);
                subscription.unsubscribe();
                Store.fragments.list.firstPageLoaded.set(true);
                Store.promotions.allCards.set([]);
                Store.promotions.cardsByPaths.set(new Map());
                Store.promotions.displayCards.set([]);
                setCardVariationsByPaths(new Map(), Store.promotions);
                Store.promotions.offerDataCache.clear();
            }
        });

        it('should return no-op subscription when allCards already has data', () => {
            Store.translationProjects.allCards.set([{ path: '/card1', title: 'Card 1' }]);
            const result = loadAllFragments(
                TABLE_TYPE.CARDS,
                null,
                {},
                { getDisplayName: mockGetDisplayName, store: Store.translationProjects },
            );
            expect(result.unsubscribe).to.be.a('function');
            expect(Store.translationProjects.allCards.get()).to.have.lengthOf(1);
        });

        it('should not subscribe for collections (loaded via repository.loadAllCollections)', async () => {
            const before = Store.translationProjects.allCollections.get();
            const result = loadAllFragments(TABLE_TYPE.COLLECTIONS, null, {}, { store: Store.translationProjects });
            const mockCollection = {
                value: {
                    path: '/content/dam/mas/acom/en_US/collections/test',
                    title: 'Test Collection',
                    model: { path: COLLECTION_MODEL_PATH },
                },
            };
            Store.fragments.list.data.set([mockCollection]);
            await new Promise((r) => setTimeout(r, 50));

            // Collections store is NOT touched by the shared fragment stream anymore.
            expect(Store.translationProjects.allCollections.get()).to.equal(before);

            result.unsubscribe();
        });

        it('should subscribe and process cards when fragments list updates', async () => {
            const state = {};
            const variationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/v1';
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves({
                        path: variationPath,
                        fieldTags: [{ id: 't1', name: 'T1' }],
                        fields: [],
                        tags: [],
                    }),
                },
            };

            const result = loadAllFragments(TABLE_TYPE.CARDS, repo, state, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            const mockCardData = {
                path: '/content/dam/mas/acom/en_US/cards/card1',
                title: 'Test Card',
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [
                    { name: 'name', values: ['card1'] },
                    { name: 'variations', values: [variationPath] },
                ],
                references: [{ path: variationPath }],
            };
            const mockCardStore = { value: new Fragment(mockCardData) };
            Store.fragments.list.data.set([mockCardStore]);
            await new Promise((r) => setTimeout(r, 150));

            expect(Store.translationProjects.allCards.get()).to.have.lengthOf(1);
            expect(Store.translationProjects.displayCards.get()).to.have.lengthOf(1);
            expect(Store.translationProjects.allCards.get()[0]).to.have.property('offerData');
            expect(Store.translationProjects.allCards.get()[0]).to.have.property('groupedVariations');

            result.unsubscribe();
        });

        it('should not re-fetch grouped variations for a card already enriched in a prior page', async () => {
            const state = {};
            const cardPath = '/content/dam/mas/acom/en_US/cards/card1';
            const variationPath = `${cardPath}/pzn/var1`;
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves({
                        path: variationPath,
                        fieldTags: [{ id: 't1', name: 'T1' }],
                        fields: [],
                        tags: [],
                    }),
                },
            };
            const mockCardFragment = new Fragment({
                path: cardPath,
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [{ name: 'variations', values: [variationPath] }],
                references: [{ path: variationPath }],
            });
            const result = loadAllFragments(TABLE_TYPE.CARDS, repo, state, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            Store.fragments.list.data.set([{ value: mockCardFragment }]);
            await waitUntil(() => !state.isProcessingCards);

            const callCountAfterFirst = repo.aem.getFragmentByPath.callCount;
            expect(callCountAfterFirst).to.be.greaterThan(0);
            const parentSet = sandbox.spy(Store.translationProjects.groupedVariationsByParent, 'set');
            const dataSet = sandbox.spy(Store.translationProjects.groupedVariationsData, 'set');
            const previousParents = Store.translationProjects.groupedVariationsByParent.get();
            const previousData = Store.translationProjects.groupedVariationsData.get();

            try {
                Store.fragments.list.data.set([{ value: mockCardFragment }]);
                await waitUntil(() => !state.isProcessingCards);

                expect(repo.aem.getFragmentByPath.callCount).to.equal(callCountAfterFirst);
                expect(parentSet.called).to.be.false;
                expect(dataSet.called).to.be.false;
                expect(Store.translationProjects.groupedVariationsByParent.get()).to.equal(previousParents);
                expect(Store.translationProjects.groupedVariationsData.get()).to.equal(previousData);
            } finally {
                result.unsubscribe();
            }
        });
    });

    describe('loadSelectedPlaceholders', () => {
        it('should call onItems with empty array when selectedPaths is empty', () => {
            const onItems = sinon.stub();
            const result = loadSelectedPlaceholders([], onItems);
            expect(onItems.calledWith([])).to.be.true;
            expect(result.unsubscribe).to.be.a('function');
        });

        it('should call onItems with empty array when selectedPaths is null', () => {
            const onItems = sinon.stub();
            loadSelectedPlaceholders(null, onItems);
            expect(onItems.calledWith([])).to.be.true;
        });

        it('should filter and call onItems with matching placeholders when data available', () => {
            const placeholder1 = { path: '/p1', key: 'k1', value: 'v1' };
            const placeholder2 = { path: '/p2', key: 'k2', value: 'v2' };
            Store.placeholders.list.data.set([{ value: placeholder1 }, { value: placeholder2 }]);

            const onItems = sinon.stub();
            const result = loadSelectedPlaceholders(['/p2', '/p99'], onItems);

            expect(onItems.called).to.be.true;
            const items = onItems.firstCall.args[0];
            expect(items).to.have.lengthOf(1);
            expect(items[0].path).to.equal('/p2');

            result.unsubscribe();
        });

        it('should not throw when onItems is undefined and selectedPaths is empty', () => {
            const result = loadSelectedPlaceholders([], undefined);
            expect(result.unsubscribe).to.be.a('function');
            expect(() => result.unsubscribe()).to.not.throw();
        });
    });

    describe('loadSelectedFragments', () => {
        it('should call onItems with empty array when repository is null', async () => {
            const onItems = sinon.stub();
            await loadSelectedFragments(['/path/1'], TABLE_TYPE.CARDS, null, {
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(onItems.calledWith([])).to.be.true;
        });

        it('should call onItems with empty array when getDisplayName is undefined', async () => {
            const onItems = sinon.stub();
            await loadSelectedFragments(['/path/1'], TABLE_TYPE.CARDS, null, {
                onItems,
                getDisplayName: undefined,
            });
            expect(onItems.calledWith([])).to.be.true;
        });

        it('should call onItems with empty array when selectedPaths is empty', async () => {
            const onItems = sinon.stub();
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await loadSelectedFragments([], TABLE_TYPE.CARDS, repo, {
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(onItems.calledWith([])).to.be.true;
        });

        it('should fetch fragments and call onItems for collections type', async () => {
            const mockFragment = {
                path: '/content/dam/mas/acom/en_US/collections/test',
                title: 'Test',
                model: { path: '/conf/mas/settings/dam/cfm/models/merch-card-collection' },
            };
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves(mockFragment),
                },
            };
            const onItems = sinon.stub();

            await loadSelectedFragments([mockFragment.path], TABLE_TYPE.COLLECTIONS, repo, {
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.calledWith(mockFragment.path)).to.be.true;
            expect(onItems.called).to.be.true;
            const items = onItems.firstCall.args[0];
            expect(items).to.have.lengthOf(1);
            expect(items[0].path).to.equal(mockFragment.path);
            expect(items[0].studioPath).to.exist;
        });

        it('should fetch cards, enrich with offerData and groupedVariations, and call onItems', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/test-card';
            const mockCard = {
                path: cardPath,
                title: 'Test Card',
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [
                    { name: 'name', values: ['test'] },
                    { name: 'variant', values: ['default'] },
                ],
                references: [],
            };
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves(mockCard),
                },
            };
            const onItems = sinon.stub();

            await loadSelectedFragments([cardPath], TABLE_TYPE.CARDS, repo, {
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.calledWith(cardPath)).to.be.true;
            expect(onItems.called).to.be.true;
            const items = onItems.firstCall.args[0];
            expect(items).to.have.lengthOf(1);
            expect(items[0].path).to.equal(cardPath);
            expect(items[0].studioPath).to.exist;
            expect(items[0]).to.have.property('offerData');
            expect(items[0]).to.have.property('groupedVariations');
            expect(items[0].groupedVariations).to.be.an('array');
        });

        it('should resolve offerData for a grouped variation row via parent OSI when variation has no osi', async () => {
            const parentPath = '/content/dam/mas/acom/en_US/cards/parent-card';
            const variationPath = `${parentPath}/pzn/var-a`;
            const mockParent = {
                path: parentPath,
                title: 'Parent',
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [{ name: 'osi', values: ['parent-osi'] }],
                references: [],
            };
            const mockVariation = {
                path: variationPath,
                title: 'Var A',
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [{ name: 'name', values: ['v'] }],
                fieldTags: [{ id: 't1', name: 'T1' }],
                references: [],
            };
            const resolveHydratedParentFragment = sinon.stub().resolves(mockParent);
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().callsFake((requestedPath) => {
                        if (requestedPath === variationPath) return Promise.resolve(mockVariation);
                        return Promise.resolve(null);
                    }),
                },
                resolveHydratedParentFragment,
            };
            const onItems = sinon.stub();

            await loadSelectedFragments([variationPath], TABLE_TYPE.CARDS, repo, {
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(onItems.called).to.be.true;
            const items = onItems.firstCall.args[0];
            expect(items).to.have.lengthOf(1);
            expect(items[0].path).to.equal(variationPath);
            expect(repo.aem.getFragmentByPath.calledWith(variationPath)).to.be.true;
            expect(resolveHydratedParentFragment.calledOnceWith(variationPath)).to.be.true;
            expect(items[0].offerData).to.deep.equal({ offerId: 'test-offer-id' });
        });

        it('should not call resolveHydratedParentFragment when grouped variation row has its own osi', async () => {
            const parentPath = '/content/dam/mas/acom/en_US/cards/parent-card';
            const variationPath = `${parentPath}/pzn/var-own-osi`;
            const mockVariation = {
                path: variationPath,
                title: 'Var',
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [
                    { name: 'osi', values: ['variation-osi'] },
                    { name: 'name', values: ['v'] },
                ],
                fieldTags: [{ id: 't1', name: 'T1' }],
                references: [],
            };
            const resolveHydratedParentFragment = sinon.stub().resolves(null);
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves(mockVariation),
                },
                resolveHydratedParentFragment,
            };
            const onItems = sinon.stub();

            await loadSelectedFragments([variationPath], TABLE_TYPE.CARDS, repo, {
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(resolveHydratedParentFragment.called).to.be.false;
            const items = onItems.firstCall.args[0];
            expect(items[0].offerData).to.deep.equal({ offerId: 'test-offer-id' });
        });

        it('should leave offerData null for grouped variation without osi when resolveHydratedParentFragment returns null', async () => {
            const parentPath = '/content/dam/mas/acom/en_US/cards/parent-card';
            const variationPath = `${parentPath}/pzn/var-no-parent`;
            const mockVariation = {
                path: variationPath,
                title: 'Var',
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [{ name: 'name', values: ['v'] }],
                fieldTags: [{ id: 't1', name: 'T1' }],
                references: [],
            };
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves(mockVariation),
                },
                resolveHydratedParentFragment: sinon.stub().resolves(null),
            };
            const onItems = sinon.stub();

            await loadSelectedFragments([variationPath], TABLE_TYPE.CARDS, repo, {
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            const items = onItems.firstCall.args[0];
            expect(items[0].offerData).to.be.null;
        });

        it('should call onItems with empty array on error and not throw', async () => {
            const onItems = sinon.stub();
            const repo = {
                aem: { getFragmentByPath: sinon.stub().rejects(new Error('Fetch failed')) },
            };

            await loadSelectedFragments(['/invalid/path'], TABLE_TYPE.CARDS, repo, {
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(onItems.calledWith([])).to.be.true;
        });

        it('should not call onItems when onItems is not provided', async () => {
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves({
                        path: '/content/dam/mas/acom/en_US/collections/test',
                        model: { path: COLLECTION_MODEL_PATH },
                    }),
                },
            };

            await loadSelectedFragments(['/path'], TABLE_TYPE.COLLECTIONS, repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(repo.aem.getFragmentByPath.called).to.be.true;
        });

        it('should not call onItems when signal is aborted for cards', async () => {
            const abortedController = new AbortController();
            abortedController.abort();

            const cardPath = '/content/dam/mas/acom/en_US/cards/test';
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves({
                        path: cardPath,
                        model: { path: CARD_MODEL_PATH },
                        tags: [],
                        fields: [],
                    }),
                },
            };
            const onItems = sinon.stub();

            await loadSelectedFragments([cardPath], TABLE_TYPE.CARDS, repo, {
                signal: abortedController.signal,
                onItems,
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(onItems.called).to.be.false;
        });
    });

    describe('loadCardVariations', () => {
        it('should return early when variationPaths is empty', async () => {
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await loadCardVariations('/card/path', [], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should return early when card already has variations in store', async () => {
            const existingMap = new Map();
            existingMap.set('/card/path', new Map());
            setCardVariationsByPaths(existingMap, Store.translationProjects);

            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await loadCardVariations('/card/path', ['/var/path'], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should return early when repository is null', async () => {
            await loadCardVariations('/card/path', ['/var/path'], null, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(Store.translationProjects.groupedVariationsByParent.value?.has('/card/path')).to.be.false;
        });

        it('should fetch variations and merge into store', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const mockVariation = {
                path: variationPath,
                fieldTags: [{ id: 'tag1', name: 'Tag1' }],
                fields: [],
            };

            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves(mockVariation),
                },
            };

            await loadCardVariations(cardPath, [variationPath], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.calledWith(variationPath)).to.be.true;
            const variationsByPaths = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath);
            expect(variationsByPaths).to.exist;
            expect(variationsByPaths).to.be.instanceOf(Map);
            const variation = variationsByPaths.get(variationPath);
            expect(variation).to.exist;
            expect(variation.path).to.equal(variationPath);
            expect(variation.studioPath).to.exist;
            expect(variation).to.have.property('offerData');
        });

        it('should filter out variations without fieldTags or personalization tags', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const invalidPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/invalid';
            const mockInvalid = {
                path: invalidPath,
                fieldTags: [],
                fields: [],
            };

            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().resolves(mockInvalid),
                },
            };

            await loadCardVariations(cardPath, [invalidPath], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            const variationsByPaths = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath);
            expect(variationsByPaths).to.exist;
            expect(variationsByPaths.size).to.equal(0);
        });

        it('should handle fetch errors without throwing and store empty variations map', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/error-card';
            const variationPath = '/content/dam/mas/acom/en_US/cards/error-card/pzn/var1';
            const repo = {
                aem: { getFragmentByPath: sinon.stub().rejects(new Error('Network error')) },
            };

            await loadCardVariations(cardPath, [variationPath], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.calledWith(variationPath)).to.be.true;
            const variationsMap = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath);
            expect(variationsMap).to.exist;
            expect(variationsMap.size).to.equal(0);
        });

        it('should merge with existing groupedVariationsByParent', async () => {
            const cardPath1 = '/card/1';
            const cardPath2 = '/card/2';
            const varPath2 = '/card/2/pzn/v1';
            const mockVar = {
                path: varPath2,
                fieldTags: [{ id: 't1', name: 'T1' }],
                fields: [],
            };

            const existingMap = new Map();
            const existingVarMap1 = new Map();
            existingVarMap1.set('/card/1/v1', { path: '/card/1/v1' });
            existingMap.set(cardPath1, existingVarMap1);
            setCardVariationsByPaths(existingMap, Store.translationProjects);

            const repo = {
                aem: { getFragmentByPath: sinon.stub().resolves(mockVar) },
            };

            await loadCardVariations(cardPath2, [varPath2], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            const result = Store.translationProjects.groupedVariationsByParent.value;
            expect(result.has(cardPath1)).to.be.true;
            expect(result.has(cardPath2)).to.be.true;
            expect(result.get(cardPath1).get('/card/1/v1')).to.exist;
            expect(result.get(cardPath2).get(varPath2)).to.exist;
        });

        it('should resolve offerData using parent card OSI when variation has empty osi values', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent-with-osi';
            const variationPath = `${cardPath}/pzn/locale-pl`;
            const mockVariation = {
                path: variationPath,
                fieldTags: [{ id: 'tag1', name: 'Tag1' }],
                fields: [{ name: 'osi', values: [] }],
            };
            const mockParent = {
                path: cardPath,
                fields: [{ name: 'osi', values: ['parent-wcs-osi'] }],
            };
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().callsFake((requestedPath) => {
                        if (requestedPath === variationPath) return Promise.resolve(mockVariation);
                        if (requestedPath === cardPath) return Promise.resolve(mockParent);
                        return Promise.resolve(null);
                    }),
                },
            };

            await loadCardVariations(cardPath, [variationPath], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.calledWith(cardPath)).to.be.true;
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(variationPath);
            expect(variation).to.exist;
            expect(variation.offerData).to.deep.equal({ offerId: 'test-offer-id' });
        });

        it('should fetch parent path once for OSI when multiple variations lack OSI', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/multi-parent';
            const variationPathA = `${cardPath}/pzn/a`;
            const variationPathB = `${cardPath}/pzn/b`;
            const mockVariation = (path) => ({
                path,
                fieldTags: [{ id: 'tag1', name: 'Tag1' }],
                fields: [],
            });
            const mockParent = {
                path: cardPath,
                fields: [{ name: 'osi', values: ['shared-parent-osi'] }],
            };
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().callsFake((requestedPath) => {
                        if (requestedPath === variationPathA) return Promise.resolve(mockVariation(variationPathA));
                        if (requestedPath === variationPathB) return Promise.resolve(mockVariation(variationPathB));
                        if (requestedPath === cardPath) return Promise.resolve(mockParent);
                        return Promise.resolve(null);
                    }),
                },
            };

            await loadCardVariations(cardPath, [variationPathA, variationPathB], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            const parentFetchCalls = repo.aem.getFragmentByPath.getCalls().filter((call) => call.args[0] === cardPath);
            expect(parentFetchCalls.length).to.equal(1);
        });

        it('should resolve offerData when variation has no osi field and parent provides OSI', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/no-osi-field';
            const variationPath = `${cardPath}/pzn/v1`;
            const mockVariation = {
                path: variationPath,
                fieldTags: [{ id: 'tag1', name: 'Tag1' }],
                fields: [{ name: 'variant', values: ['default'] }],
            };
            const mockParent = {
                path: cardPath,
                fields: [{ name: 'osi', values: ['parent-wcs-osi'] }],
            };
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().callsFake((requestedPath) => {
                        if (requestedPath === variationPath) return Promise.resolve(mockVariation);
                        if (requestedPath === cardPath) return Promise.resolve(mockParent);
                        return Promise.resolve(null);
                    }),
                },
            };

            await loadCardVariations(cardPath, [variationPath], repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(variationPath);
            expect(variation.offerData).to.deep.equal({ offerId: 'test-offer-id' });
        });
    });

    describe('fetchVariationByPath', () => {
        const variationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';

        it('should return false when repository is null', async () => {
            const result = await fetchVariationByPath(variationPath, null, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(result).to.be.false;
        });

        it('should return false when repository has no getFragmentByPath', async () => {
            const result = await fetchVariationByPath(
                variationPath,
                {},
                { getDisplayName: mockGetDisplayName, store: Store.translationProjects },
            );
            expect(result).to.be.false;
        });

        it('should return false when path is not a grouped variation path', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/card1';
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            const result = await fetchVariationByPath(cardPath, repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(result).to.be.false;
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should return false when path has no /pzn/ segment', async () => {
            const invalidPath = '/content/dam/mas/acom/en_US/cards/parent/invalid/var1';
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            const result = await fetchVariationByPath(invalidPath, repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(result).to.be.false;
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should return false when fetch throws', async () => {
            const repo = {
                aem: { getFragmentByPath: sinon.stub().rejects(new Error('Network error')) },
            };
            const result = await fetchVariationByPath(variationPath, repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(result).to.be.false;
        });

        it('should return true and add variation to store when fetch succeeds', async () => {
            const mockVariation = {
                path: variationPath,
                fieldTags: [{ id: 'tag1', name: 'Tag1' }],
                fields: [{ name: 'osi', values: ['wcs-osi-123'] }],
            };
            const repo = {
                aem: { getFragmentByPath: sinon.stub().resolves(mockVariation) },
            };

            const result = await fetchVariationByPath(variationPath, repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(result).to.be.true;
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(variationPath);
            expect(variation).to.exist;
            expect(variation.path).to.equal(variationPath);
            expect(variation).to.have.property('offerData');
            expect(variation).to.have.property('studioPath');
        });

        it('should resolve offerData using parent OSI when variation has empty osi values', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent-with-osi';
            const fullVariationPath = `${cardPath}/pzn/var-locale`;
            const mockVariation = {
                path: fullVariationPath,
                fieldTags: [{ id: 'tag1', name: 'Tag1' }],
                fields: [{ name: 'osi', values: [] }],
            };
            const mockParent = {
                path: cardPath,
                fields: [{ name: 'osi', values: ['parent-wcs-osi'] }],
            };
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().callsFake((requestedPath) => {
                        if (requestedPath === fullVariationPath) return Promise.resolve(mockVariation);
                        if (requestedPath === cardPath) return Promise.resolve(mockParent);
                        return Promise.resolve(null);
                    }),
                },
            };

            const result = await fetchVariationByPath(fullVariationPath, repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(result).to.be.true;
            expect(repo.aem.getFragmentByPath.calledWith(cardPath)).to.be.true;
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(fullVariationPath);
            expect(variation.offerData).to.deep.equal({ offerId: 'test-offer-id' });
        });

        it('should resolve offerData when variation omits osi field and parent has OSI', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent-no-osi-field';
            const fullVariationPath = `${cardPath}/pzn/locale-xx`;
            const mockVariation = {
                path: fullVariationPath,
                fieldTags: [{ id: 'tag1', name: 'Tag1' }],
                fields: [{ name: 'variant', values: ['default'] }],
            };
            const mockParent = {
                path: cardPath,
                fields: [{ name: 'osi', values: ['parent-wcs-osi'] }],
            };
            const repo = {
                aem: {
                    getFragmentByPath: sinon.stub().callsFake((requestedPath) => {
                        if (requestedPath === fullVariationPath) return Promise.resolve(mockVariation);
                        if (requestedPath === cardPath) return Promise.resolve(mockParent);
                        return Promise.resolve(null);
                    }),
                },
            };

            const result = await fetchVariationByPath(fullVariationPath, repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(result).to.be.true;
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(fullVariationPath);
            expect(variation.offerData).to.deep.equal({ offerId: 'test-offer-id' });
        });
    });

    describe('fetchUnresolvedVariations', () => {
        const variationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';

        it('should not fetch when selectedCards is empty', async () => {
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations([], new Map(), new Map(), repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should not fetch when selectedCards is null', async () => {
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations(null, new Map(), new Map(), repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should skip non-grouped-variation paths', async () => {
            const defaultCardPath = '/content/dam/mas/acom/en_US/cards/card1';
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations([defaultCardPath], new Map(), new Map(), repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should skip paths already in cardsByPaths', async () => {
            const cardsByPaths = new Map();
            cardsByPaths.set(variationPath, { path: variationPath });
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations([variationPath], cardsByPaths, new Map(), repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should skip paths already in groupedVariationsByParent', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variationsMap = new Map();
            variationsMap.set(variationPath, { path: variationPath });
            const groupedVariationsByParent = new Map();
            groupedVariationsByParent.set(cardPath, variationsMap);
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations([variationPath], new Map(), groupedVariationsByParent, repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should fetch unresolved paths and add to store', async () => {
            const mockVariation = {
                path: variationPath,
                fieldTags: [{ id: 'tag1', name: 'Tag1' }],
                fields: [],
            };
            const repo = {
                aem: { getFragmentByPath: sinon.stub().resolves(mockVariation) },
            };

            await fetchUnresolvedVariations([variationPath], new Map(), new Map(), repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.calledWith(variationPath)).to.be.true;
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variationsByPaths = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath);
            expect(variationsByPaths).to.exist;
            expect(variationsByPaths.get(variationPath)).to.exist;
        });

        it('should not add to store when fetch fails', async () => {
            const repo = {
                aem: { getFragmentByPath: sinon.stub().rejects(new Error('Network error')) },
            };

            await fetchUnresolvedVariations([variationPath], new Map(), new Map(), repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.calledWith(variationPath)).to.be.true;
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(variationPath);
            expect(variation).to.not.exist;
        });

        it('should not add to store when variation has no fieldTags or personalization tags', async () => {
            const mockInvalidVariation = {
                path: variationPath,
                fieldTags: [],
                fields: [],
            };
            const repo = {
                aem: { getFragmentByPath: sinon.stub().resolves(mockInvalidVariation) },
            };

            await fetchUnresolvedVariations([variationPath], new Map(), new Map(), repo, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });

            expect(repo.aem.getFragmentByPath.calledWith(variationPath)).to.be.true;
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(variationPath);
            expect(variation).to.not.exist;
        });
    });

    describe('loadAllFragments subscription persistence', () => {
        it('should subscribe to fragment store updates even when allCards already has data', async () => {
            const existingCard = {
                path: '/card/existing',
                model: { path: CARD_MODEL_PATH },
                studioPath: 'existing',
                tags: [],
                fields: [],
            };
            Store.translationProjects.allCards.set([existingCard]);

            const state = {};
            const { unsubscribe } = loadAllFragments(TABLE_TYPE.CARDS, null, state, { store: Store.translationProjects });

            const newCardData = {
                path: '/card/new',
                model: { path: CARD_MODEL_PATH },
                title: 'New Card',
                tags: [],
                fields: [],
                fieldTags: [],
            };
            Store.fragments.list.data.set([{ value: new Fragment(newCardData) }]);
            await new Promise((r) => setTimeout(r, 50));

            expect(Store.translationProjects.allCards.get().length).to.be.greaterThan(0);
            unsubscribe();
        });

        it('should not register duplicate subscriptions when called twice with the same state', () => {
            const state = {};
            const sub1 = loadAllFragments(TABLE_TYPE.CARDS, null, state, { store: Store.translationProjects });
            const sub2 = loadAllFragments(TABLE_TYPE.CARDS, null, state, { store: Store.translationProjects });

            expect(sub1.unsubscribe).to.be.a('function');
            expect(sub2.unsubscribe).to.be.a('function');

            sub1.unsubscribe();
            sub2.unsubscribe();
        });
    });

    describe('processCardsData re-entrancy', () => {
        it('should reset isProcessingCards to false after processing completes', async () => {
            const state = {};
            const card = {
                path: '/card/1',
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [],
            };

            const { unsubscribe } = loadAllFragments(TABLE_TYPE.CARDS, null, state, {
                getDisplayName: mockGetDisplayName,
                store: Store.translationProjects,
            });
            Store.fragments.list.data.set([{ value: new Fragment(card) }]);
            await new Promise((r) => setTimeout(r, 100));

            expect(state.isProcessingCards).to.be.false;
            unsubscribe();
        });
    });
});
