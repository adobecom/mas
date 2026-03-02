import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
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
} from '../../src/translation/translation-items-loader.js';

describe('translation-items-loader', () => {
    let sandbox;

    const resetStore = () => {
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.cardsByPaths.set(new Map());
        Store.translationProjects.displayCards.set([]);
        setCardVariationsByPaths(new Map());
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
        resetStore();
        createMockCommerceService();
    });

    afterEach(() => {
        sandbox.restore();
        resetStore();
        removeMockCommerceService();
    });

    describe('setCardVariationsByPaths', () => {
        it('should set groupedVariationsByParent and update groupedVariationsData with flattened map', () => {
            const variation1 = { path: '/card1/pzn/v1', title: 'Variation 1' };
            const variation2 = { path: '/card2/pzn/v2', title: 'Variation 2' };
            const groupedVariationsByParent = new Map([
                ['/card1', new Map([['/card1/pzn/v1', variation1]])],
                ['/card2', new Map([['/card2/pzn/v2', variation2]])],
            ]);

            setCardVariationsByPaths(groupedVariationsByParent);

            expect(Store.translationProjects.groupedVariationsByParent.value).to.equal(groupedVariationsByParent);
            expect(Store.translationProjects.groupedVariationsData.value.get('/card1/pzn/v1')).to.equal(variation1);
            expect(Store.translationProjects.groupedVariationsData.value.get('/card2/pzn/v2')).to.equal(variation2);
        });

        it('should clear both stores when passed empty Map', () => {
            setCardVariationsByPaths(new Map());
            expect(Store.translationProjects.groupedVariationsByParent.value.size).to.equal(0);
            expect(Store.translationProjects.groupedVariationsData.value.size).to.equal(0);
        });
    });

    describe('loadAllPlaceholders', () => {
        it('should return no-op subscription when allPlaceholders already has data', () => {
            Store.translationProjects.allPlaceholders.set([{ path: '/p1', key: 'k1', value: 'v1' }]);
            const result = loadAllPlaceholders();
            expect(result).to.have.property('unsubscribe');
            expect(result.unsubscribe).to.be.a('function');
            expect(Store.translationProjects.allPlaceholders.get()).to.have.lengthOf(1);
        });

        it('should subscribe and populate store when placeholders list updates', () => {
            const result = loadAllPlaceholders();
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
            const result = loadAllPlaceholders();
            expect(() => result.unsubscribe()).to.not.throw();
        });
    });

    describe('loadAllFragments', () => {
        it('should return no-op subscription when allCards already has data', () => {
            Store.translationProjects.allCards.set([{ path: '/card1', title: 'Card 1' }]);
            const result = loadAllFragments(TABLE_TYPE.CARDS, null, {});
            expect(result.unsubscribe).to.be.a('function');
            expect(Store.translationProjects.allCards.get()).to.have.lengthOf(1);
        });

        it('should return no-op subscription when allCollections already has data', () => {
            Store.translationProjects.allCollections.set([{ path: '/col1', title: 'Col 1' }]);
            const result = loadAllFragments(TABLE_TYPE.COLLECTIONS, null, {});
            expect(result.unsubscribe).to.be.a('function');
            expect(Store.translationProjects.allCollections.get()).to.have.lengthOf(1);
        });

        it('should subscribe and process collections when fragments list updates', async () => {
            const result = loadAllFragments(TABLE_TYPE.COLLECTIONS, null, {});

            const mockCollection = {
                value: {
                    path: '/content/dam/mas/acom/en_US/collections/test',
                    title: 'Test Collection',
                    model: { path: COLLECTION_MODEL_PATH },
                },
            };
            Store.fragments.list.data.set([mockCollection]);
            await new Promise((r) => setTimeout(r, 50));

            expect(Store.translationProjects.allCollections.get()).to.have.lengthOf(1);
            expect(Store.translationProjects.displayCollections.get()).to.have.lengthOf(1);

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

            const result = loadAllFragments(TABLE_TYPE.CARDS, repo, state);

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

        it('should use existing card data when already in store', async () => {
            const existingCard = {
                path: '/content/dam/mas/acom/en_US/cards/existing',
                title: 'Existing',
                offerData: { offerId: 'cached' },
                groupedVariations: [],
            };
            Store.translationProjects.allCards.set([existingCard]);

            const state = {};
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            const result = loadAllFragments(TABLE_TYPE.CARDS, repo, state);

            const mockCardStore = {
                value: new Fragment({
                    path: '/content/dam/mas/acom/en_US/cards/existing',
                    title: 'Existing',
                    model: { path: CARD_MODEL_PATH },
                    tags: [],
                    fields: [],
                }),
            };
            Store.fragments.list.data.set([mockCardStore]);
            await new Promise((r) => setTimeout(r, 100));

            const cards = Store.translationProjects.allCards.get();
            expect(cards).to.have.lengthOf(1);
            expect(cards[0].offerData).to.deep.equal({ offerId: 'cached' });
            expect(repo.aem.getFragmentByPath.called).to.be.false;

            result.unsubscribe();
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
            await loadSelectedFragments(['/path/1'], TABLE_TYPE.CARDS, null, { onItems });
            expect(onItems.calledWith([])).to.be.true;
        });

        it('should call onItems with empty array when selectedPaths is empty', async () => {
            const onItems = sinon.stub();
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await loadSelectedFragments([], TABLE_TYPE.CARDS, repo, { onItems });
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

            await loadSelectedFragments([mockFragment.path], TABLE_TYPE.COLLECTIONS, repo, { onItems });

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

            await loadSelectedFragments([cardPath], TABLE_TYPE.CARDS, repo, { onItems });

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

        it('should call onItems with empty array on error and not throw', async () => {
            const onItems = sinon.stub();
            const repo = {
                aem: { getFragmentByPath: sinon.stub().rejects(new Error('Fetch failed')) },
            };

            await loadSelectedFragments(['/invalid/path'], TABLE_TYPE.CARDS, repo, { onItems });

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

            await loadSelectedFragments(['/path'], TABLE_TYPE.COLLECTIONS, repo, {});
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
            });

            expect(onItems.called).to.be.false;
        });
    });

    describe('loadCardVariations', () => {
        it('should return early when variationPaths is empty', async () => {
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await loadCardVariations('/card/path', [], repo);
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should return early when card already has variations in store', async () => {
            const existingMap = new Map();
            existingMap.set('/card/path', new Map());
            setCardVariationsByPaths(existingMap);

            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await loadCardVariations('/card/path', ['/var/path'], repo);

            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should return early when repository is null', async () => {
            await loadCardVariations('/card/path', ['/var/path'], null);
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

            await loadCardVariations(cardPath, [variationPath], repo);

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

        it('should filter out variations without fieldTags', async () => {
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

            await loadCardVariations(cardPath, [invalidPath], repo);

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

            await loadCardVariations(cardPath, [variationPath], repo);

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
            setCardVariationsByPaths(existingMap);

            const repo = {
                aem: { getFragmentByPath: sinon.stub().resolves(mockVar) },
            };

            await loadCardVariations(cardPath2, [varPath2], repo);

            const result = Store.translationProjects.groupedVariationsByParent.value;
            expect(result.has(cardPath1)).to.be.true;
            expect(result.has(cardPath2)).to.be.true;
            expect(result.get(cardPath1).get('/card/1/v1')).to.exist;
            expect(result.get(cardPath2).get(varPath2)).to.exist;
        });
    });

    describe('fetchVariationByPath', () => {
        const variationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';

        it('should return false when repository is null', async () => {
            const result = await fetchVariationByPath(variationPath, null);
            expect(result).to.be.false;
        });

        it('should return false when repository has no getFragmentByPath', async () => {
            const result = await fetchVariationByPath(variationPath, {});
            expect(result).to.be.false;
        });

        it('should return false when path is not a grouped variation path', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/card1';
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            const result = await fetchVariationByPath(cardPath, repo);
            expect(result).to.be.false;
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should return false when path has no /pzn/ segment', async () => {
            const invalidPath = '/content/dam/mas/acom/en_US/cards/parent/invalid/var1';
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            const result = await fetchVariationByPath(invalidPath, repo);
            expect(result).to.be.false;
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should return false when fetch throws', async () => {
            const repo = {
                aem: { getFragmentByPath: sinon.stub().rejects(new Error('Network error')) },
            };
            const result = await fetchVariationByPath(variationPath, repo);
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

            const result = await fetchVariationByPath(variationPath, repo);

            expect(result).to.be.true;
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(variationPath);
            expect(variation).to.exist;
            expect(variation.path).to.equal(variationPath);
            expect(variation).to.have.property('offerData');
            expect(variation).to.have.property('studioPath');
        });
    });

    describe('fetchUnresolvedVariations', () => {
        const variationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';

        it('should not fetch when selectedCards is empty', async () => {
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations([], new Map(), new Map(), repo);
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should not fetch when selectedCards is null', async () => {
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations(null, new Map(), new Map(), repo);
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should skip non-grouped-variation paths', async () => {
            const defaultCardPath = '/content/dam/mas/acom/en_US/cards/card1';
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations([defaultCardPath], new Map(), new Map(), repo);
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should skip paths already in cardsByPaths', async () => {
            const cardsByPaths = new Map();
            cardsByPaths.set(variationPath, { path: variationPath });
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations([variationPath], cardsByPaths, new Map(), repo);
            expect(repo.aem.getFragmentByPath.called).to.be.false;
        });

        it('should skip paths already in groupedVariationsByParent', async () => {
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variationsMap = new Map();
            variationsMap.set(variationPath, { path: variationPath });
            const groupedVariationsByParent = new Map();
            groupedVariationsByParent.set(cardPath, variationsMap);
            const repo = { aem: { getFragmentByPath: sinon.stub() } };
            await fetchUnresolvedVariations([variationPath], new Map(), groupedVariationsByParent, repo);
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

            await fetchUnresolvedVariations([variationPath], new Map(), new Map(), repo);

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

            await fetchUnresolvedVariations([variationPath], new Map(), new Map(), repo);

            expect(repo.aem.getFragmentByPath.calledWith(variationPath)).to.be.true;
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(variationPath);
            expect(variation).to.not.exist;
        });

        it('should not add to store when variation has no fieldTags', async () => {
            const mockInvalidVariation = {
                path: variationPath,
                fieldTags: [],
                fields: [],
            };
            const repo = {
                aem: { getFragmentByPath: sinon.stub().resolves(mockInvalidVariation) },
            };

            await fetchUnresolvedVariations([variationPath], new Map(), new Map(), repo);

            expect(repo.aem.getFragmentByPath.calledWith(variationPath)).to.be.true;
            const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
            const variation = Store.translationProjects.groupedVariationsByParent.value?.get(cardPath)?.get(variationPath);
            expect(variation).to.not.exist;
        });
    });
});
