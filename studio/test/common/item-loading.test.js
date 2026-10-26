import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { Fragment } from '../../src/aem/fragment.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../src/constants.js';
import {
    buildItemsByPath,
    enrichCards,
    fetchVariationDataByPath,
    flattenGroupedVariationsByParent,
    hasGroupedVariationTags,
    loadCardVariationsByPath,
    loadGroupedVariations,
    loadItemsByPath,
    parseFragmentsFromStore,
    parsePlaceholdersFromStore,
    processConcurrently,
    selectItemsByPath,
} from '../../src/common/utils/item-loading.js';

describe('common/utils/item-loading', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('buildItemsByPath creates a path-indexed map', () => {
        const items = [
            { path: '/a', title: 'A' },
            { path: '/b', title: 'B' },
        ];

        const map = buildItemsByPath(items);

        expect(map.get('/a')).to.equal(items[0]);
        expect(map.get('/b')).to.equal(items[1]);
    });

    it('selectItemsByPath preserves selected path order and filters missing items', () => {
        const first = { path: '/a', title: 'A' };
        const second = { path: '/b', title: 'B' };
        const map = new Map([
            ['/a', first],
            ['/b', second],
        ]);

        const selected = selectItemsByPath(['/b', '/missing', '/a'], map);

        expect(selected).to.deep.equal([second, first]);
    });

    it('flattenGroupedVariationsByParent flattens nested maps', () => {
        const variation = { path: '/card/pzn/v1', title: 'Variation' };
        const flattened = flattenGroupedVariationsByParent(new Map([['/card', new Map([['/card/pzn/v1', variation]])]]));

        expect(flattened.get('/card/pzn/v1')).to.equal(variation);
    });

    it('processConcurrently preserves result order while respecting the concurrency limit', async () => {
        let activeCount = 0;
        let maxActiveCount = 0;

        const results = await processConcurrently(
            [1, 2, 3, 4],
            async (item) => {
                activeCount += 1;
                maxActiveCount = Math.max(maxActiveCount, activeCount);
                await new Promise((resolve) => setTimeout(resolve, 5));
                activeCount -= 1;
                return item * 2;
            },
            2,
            2,
        );

        expect(results).to.deep.equal([2, 4, 6, 8]);
        expect(maxActiveCount).to.equal(2);
    });

    it('parseFragmentsFromStore splits cards and collections and applies display name', () => {
        const getDisplayName = sandbox.stub().returns('Display Name');
        const allFragments = [
            {
                value: {
                    path: '/card',
                    title: 'Card',
                    model: { path: CARD_MODEL_PATH },
                },
            },
            {
                value: {
                    path: '/collection',
                    title: 'Collection',
                    model: { path: COLLECTION_MODEL_PATH },
                },
            },
        ];

        const { allCards, allCollections } = parseFragmentsFromStore(allFragments, { getDisplayName });

        expect(allCards).to.have.lengthOf(1);
        expect(allCards[0].studioPath).to.equal('Display Name');
        expect(allCollections).to.have.lengthOf(1);
        expect(allCollections[0].studioPath).to.equal('Display Name');
    });

    it('loadItemsByPath fetches items and decorates them with a display name', async () => {
        const getDisplayName = sandbox.stub().returns('Display Name');
        const fragmentData = {
            path: '/content/dam/mas/acom/en_US/cards/card1',
            title: 'Card 1',
            model: { path: CARD_MODEL_PATH },
            fields: [],
        };
        const getByPath = sandbox.stub().resolves(fragmentData);

        const items = await loadItemsByPath([fragmentData.path], { getByPath, getDisplayName });

        expect(items).to.have.lengthOf(1);
        expect(items[0].studioPath).to.equal('Display Name');
        expect(getByPath.calledOnceWith(fragmentData.path)).to.be.true;
    });

    it('loadItemsByPath skips paths that fail to load and keeps the successful items', async () => {
        const getByPath = sandbox.stub();
        getByPath.onFirstCall().resolves({
            path: '/content/dam/mas/acom/en_US/cards/card1',
            title: 'Card 1',
            model: { path: CARD_MODEL_PATH },
            fields: [],
        });
        getByPath.onSecondCall().rejects(new Error('not found'));

        const items = await loadItemsByPath(
            ['/content/dam/mas/acom/en_US/cards/card1', '/content/dam/mas/acom/en_US/cards/missing'],
            { getByPath },
        );

        expect(items).to.have.lengthOf(1);
        expect(items[0].path).to.equal('/content/dam/mas/acom/en_US/cards/card1');
    });

    it('loadGroupedVariations returns enriched grouped variations for valid refs only', async () => {
        const getDisplayName = sandbox.stub().returns('Variation Name');
        const getOfferData = sandbox.stub().resolves({ offerId: 'test-offer-id' });
        const validVariationPath = '/content/dam/mas/acom/en_US/cards/card1/pzn/v1';
        const invalidVariationPath = '/content/dam/mas/acom/en_US/cards/card1/pzn/v2';
        const card = new Fragment({
            path: '/content/dam/mas/acom/en_US/cards/card1',
            title: 'Card 1',
            model: { path: CARD_MODEL_PATH },
            fields: [{ name: 'variations', values: [validVariationPath, invalidVariationPath] }],
            references: [{ path: validVariationPath }, { path: invalidVariationPath }],
        });
        const getByPath = sandbox.stub();

        getByPath.withArgs(validVariationPath).resolves({
            path: validVariationPath,
            fieldTags: [{ id: 'tag-1' }],
            fields: [{ name: 'osi', values: ['osi-123'] }],
        });
        getByPath.withArgs(invalidVariationPath).resolves({
            path: invalidVariationPath,
            fieldTags: [],
            fields: [{ name: 'osi', values: ['osi-456'] }],
        });

        const variations = await loadGroupedVariations(card, { getByPath, getOfferData, getDisplayName });

        expect(variations).to.have.lengthOf(1);
        expect(variations[0].path).to.equal(validVariationPath);
        expect(variations[0].studioPath).to.equal('Variation Name');
        expect(variations[0].offerData).to.deep.equal({ offerId: 'test-offer-id' });
    });

    it('loadGroupedVariations passes parent OSI as fallbackWcsOsi when variation has no osi', async () => {
        const getDisplayName = sandbox.stub().returns('Variation Name');
        const getOfferData = sandbox.stub().resolves({ offerId: 'parent-offer-id' });
        const variationPath = '/content/dam/mas/acom/en_US/cards/card1/pzn/v1';
        const card = new Fragment({
            path: '/content/dam/mas/acom/en_US/cards/card1',
            title: 'Card 1',
            model: { path: CARD_MODEL_PATH },
            fields: [
                { name: 'osi', values: ['parent-osi'] },
                { name: 'variations', values: [variationPath] },
            ],
            references: [{ path: variationPath }],
        });
        const getByPath = sandbox.stub().resolves({
            path: variationPath,
            fieldTags: [{ id: 'tag-1' }],
            fields: [],
        });

        const variations = await loadGroupedVariations(card, { getByPath, getOfferData, getDisplayName });

        expect(variations).to.have.lengthOf(1);
        expect(getOfferData.calledOnce).to.be.true;
        expect(getOfferData.firstCall.args[1]).to.include({ fallbackWcsOsi: 'parent-osi' });
        expect(variations[0].offerData).to.deep.equal({ offerId: 'parent-offer-id' });
    });

    it('loads grouped variation paths without hydrated references, excluding other locale families', async () => {
        const variationPath = '/content/dam/mas/sandbox/en_US/PA-2511/pzn/edu';
        const card = new Fragment({
            path: '/content/dam/mas/sandbox/en_US/robert',
            fields: [
                {
                    name: 'variations',
                    values: [variationPath, '/content/dam/mas/sandbox/fr_FR/PA-2511/pzn/edu'],
                },
            ],
            references: [],
        });
        const getByPath = sandbox.stub().resolves({
            path: variationPath,
            fields: [{ name: 'pznTags', values: ['mas:pzn/edu'] }],
        });

        const variations = await loadGroupedVariations(card, { getByPath, includePersonalizationVariations: true });

        expect(variations.map(({ path }) => path)).to.deep.equal([variationPath]);
        expect(getByPath.calledOnceWith(variationPath)).to.be.true;
    });

    it('does not include deleted grouped variation paths as search matches', async () => {
        const variationPath = '/content/dam/mas/sandbox/en_US/PA-2511/pzn/edu';
        const card = {
            path: '/content/dam/mas/sandbox/en_US/robert',
            fields: [{ name: 'variations', values: [variationPath] }],
            references: [],
        };
        const warning = sandbox.stub(console, 'warn');

        const variations = await loadGroupedVariations(card, {
            getByPath: sandbox.stub().rejects(new Error('Fragment not found')),
            includePersonalizationVariations: true,
        });

        expect(variations).to.deep.equal([]);
        expect(warning.calledOnce).to.be.true;
    });

    describe('personalization tags without fieldTags', () => {
        const cardPath = '/content/dam/mas/acom/en_US/cards/parent';
        const variationPath = `${cardPath}/pzn/edu`;
        const card = {
            path: cardPath,
            fields: [{ name: 'variations', values: [variationPath] }],
            references: [{ path: variationPath }],
        };
        const tagSources = {
            pznTags: { fields: [{ name: 'pznTags', values: ['/content/cq:tags/mas/pzn/edu'] }] },
            tagsField: { fields: [{ name: 'tags', values: ['mas:pzn/edu'] }] },
            metadata: { fields: [], tags: [{ id: 'mas:pzn/edu' }] },
        };

        it('rejects missing variations and variations without qualifying tags', () => {
            for (const variation of [
                null,
                undefined,
                { fields: [], fieldTags: [] },
                { fields: [{ name: 'pznTags', values: ['mas:pzn/country/us'] }] },
                { tags: [{ id: 'mas:product_code/phsp' }] },
            ]) {
                expect(hasGroupedVariationTags(variation)).to.be.false;
            }
        });

        it('preserves legacy fieldTags-based variation eligibility', () => {
            expect(hasGroupedVariationTags({ fieldTags: [{ id: 'legacy-tag' }] })).to.be.true;
        });

        it('does not discover unhydrated variation paths without opting in', async () => {
            const getByPath = sandbox.stub();
            const variations = await loadGroupedVariations({ ...card, references: [] }, { getByPath });
            expect(variations).to.deep.equal([]);
            expect(getByPath.called).to.be.false;
        });

        for (const [source, data] of Object.entries(tagSources)) {
            const variation = { path: variationPath, fieldTags: [], ...data };

            for (const includePersonalizationVariations of [false, true]) {
                it(`loadGroupedVariations opts ${includePersonalizationVariations ? 'in to' : 'out of'} ${source} tags`, async () => {
                    const getByPath = sandbox.stub().resolves(variation);
                    const result = await loadGroupedVariations(card, { getByPath, includePersonalizationVariations });
                    expect(result.map(({ path }) => path)).to.deep.equal(
                        includePersonalizationVariations ? [variationPath] : [],
                    );
                });
            }

            it(`fetchVariationDataByPath preserves its legacy eligibility for ${source} tags`, async () => {
                const getByPath = sandbox.stub().resolves(variation);
                const result = await fetchVariationDataByPath(variationPath, { getByPath });
                expect(result).to.be.null;
            });

            it(`loadCardVariationsByPath preserves its legacy eligibility for ${source} tags`, async () => {
                const getByPath = sandbox.stub().resolves(variation);
                const result = await loadCardVariationsByPath([variationPath], { getByPath });
                expect(result.size).to.equal(0);
            });
        }
    });

    it('fetchVariationDataByPath resolves and enriches grouped variations', async () => {
        const getDisplayName = sandbox.stub().returns('Variation Name');
        const getOfferData = sandbox.stub().resolves({ offerId: 'test-offer-id' });
        const variationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/v1';
        const getByPath = sandbox.stub().resolves({
            path: variationPath,
            fieldTags: [{ id: 'tag-1' }],
            fields: [{ name: 'osi', values: ['osi-123'] }],
        });

        const result = await fetchVariationDataByPath(variationPath, { getByPath, getOfferData, getDisplayName });

        expect(result.parentCardPath).to.equal('/content/dam/mas/acom/en_US/cards/parent');
        expect(result.variation.path).to.equal(variationPath);
        expect(result.variation.studioPath).to.equal('Variation Name');
        expect(result.variation.offerData).to.deep.equal({ offerId: 'test-offer-id' });
    });

    it('fetchVariationDataByPath returns null for a non-grouped variation path', async () => {
        const getByPath = sandbox.stub();

        const result = await fetchVariationDataByPath('/content/dam/mas/acom/en_US/cards/card1', { getByPath });

        expect(result).to.equal(null);
        expect(getByPath.called).to.be.false;
    });

    it('loadCardVariationsByPath returns a keyed map of enriched variations', async () => {
        const getDisplayName = sandbox.stub().returns('Variation Name');
        const getOfferData = sandbox.stub().resolves({ offerId: 'test-offer-id' });
        const variationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/v1';
        const getByPath = sandbox.stub().resolves({
            path: variationPath,
            fieldTags: [{ id: 'tag-1' }],
            fields: [{ name: 'osi', values: ['osi-123'] }],
        });

        const variationsByPath = await loadCardVariationsByPath([variationPath], {
            getByPath,
            getOfferData,
            getDisplayName,
        });

        expect(variationsByPath.get(variationPath).studioPath).to.equal('Variation Name');
        expect(variationsByPath.get(variationPath).offerData).to.deep.equal({ offerId: 'test-offer-id' });
    });

    it('loadCardVariationsByPath filters out invalid variations', async () => {
        const validVariationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/v1';
        const invalidVariationPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/v2';
        const getByPath = sandbox.stub();

        getByPath.withArgs(validVariationPath).resolves({
            path: validVariationPath,
            fieldTags: [{ id: 'tag-1' }],
            fields: [{ name: 'osi', values: ['osi-123'] }],
        });
        getByPath.withArgs(invalidVariationPath).resolves({
            path: invalidVariationPath,
            fieldTags: [],
            fields: [{ name: 'osi', values: ['osi-456'] }],
        });

        const variationsByPath = await loadCardVariationsByPath([validVariationPath, invalidVariationPath], { getByPath });

        expect(variationsByPath.size).to.equal(1);
        expect(variationsByPath.has(validVariationPath)).to.be.true;
        expect(variationsByPath.has(invalidVariationPath)).to.be.false;
    });

    it('enrichCards adds offer data and grouped variations while reusing existing data', async () => {
        const groupedVariationPath = '/content/dam/mas/acom/en_US/cards/card1/pzn/v1';
        const cardData = new Fragment({
            path: '/content/dam/mas/acom/en_US/cards/card1',
            title: 'Card 1',
            model: { path: CARD_MODEL_PATH },
            tags: [],
            fields: [
                { name: 'osi', values: ['osi-123'] },
                { name: 'variations', values: [groupedVariationPath] },
            ],
            references: [{ path: groupedVariationPath }],
        });
        const getByPath = sandbox.stub().resolves({
            path: groupedVariationPath,
            fieldTags: [{ id: 'tag-1' }],
            fields: [{ name: 'osi', values: ['osi-variation'] }],
        });
        const getOfferData = sandbox.stub().resolves({ offerId: 'variation-offer' });

        const cards = await enrichCards([cardData], {
            getByPath,
            getOfferData,
            getDisplayName: () => 'Display Name',
            existingOfferDataByPath: new Map([[cardData.path, { offerId: 'cached-offer' }]]),
        });

        expect(cards).to.have.lengthOf(1);
        expect(cards[0].offerData).to.deep.equal({ offerId: 'cached-offer' });
        expect(cards[0].groupedVariations).to.have.lengthOf(1);
        expect(cards[0].groupedVariations[0].path).to.equal(groupedVariationPath);
    });

    for (const includePersonalizationVariations of [false, true]) {
        it(`enrichCards limits grouped variation requests to ${includePersonalizationVariations ? 5 : 25} concurrently`, async () => {
            const cards = Array.from({ length: 5 }, (_, index) => {
                const path = `/content/dam/mas/acom/en_US/cards/card${index}`;
                const paths = Array.from({ length: 5 }, (_, variation) => `${path}/pzn/v${variation}`);
                return {
                    path,
                    fields: [{ name: 'variations', values: paths }],
                    references: paths.map((variationPath) => ({ path: variationPath })),
                };
            });
            let activeCount = 0;
            let maxActiveCount = 0;
            const getByPath = sandbox.stub().callsFake(async (path) => {
                activeCount += 1;
                maxActiveCount = Math.max(maxActiveCount, activeCount);
                await Promise.resolve();
                activeCount -= 1;
                return { path, fieldTags: [{ id: 'tag-1' }], fields: [] };
            });

            const enriched = await enrichCards(cards, { getByPath, includePersonalizationVariations });

            expect(maxActiveCount).to.equal(includePersonalizationVariations ? 5 : 25);
            expect(getByPath.callCount).to.equal(25);
            expect(enriched.map((card) => card.groupedVariations.map(({ path }) => path))).to.deep.equal(
                cards.map((card) => card.fields[0].values),
            );
        });
    }

    it('waits for offer data before returning enriched personalization variations', async () => {
        const variationPath = '/content/dam/mas/sandbox/en_US/PA-2511/pzn/edu';
        const card = {
            path: '/content/dam/mas/sandbox/en_US/robert',
            fields: [
                { name: 'osi', values: ['parent-osi'] },
                { name: 'variations', values: [variationPath] },
            ],
        };
        let resolveOffer;
        const offerPromise = new Promise((resolve) => {
            resolveOffer = resolve;
        });
        const getOfferData = sandbox.stub().returns(offerPromise);
        const getByPath = sandbox.stub().resolves({
            path: variationPath,
            fields: [{ name: 'pznTags', values: ['mas:pzn/edu'] }],
        });
        const pending = enrichCards([card], {
            getByPath,
            getOfferData,
            includePersonalizationVariations: true,
        });

        try {
            await waitUntil(() => getOfferData.called);
            expect(getByPath.called, 'Grouped metadata should wait for parent enrichment').to.be.false;
        } finally {
            resolveOffer({ offerId: 'parent-offer' });
            const cards = await pending;
            expect(cards[0].offerData.offerId).to.equal('parent-offer');
            expect(cards[0].groupedVariations[0].offerData.offerId).to.equal('parent-offer');
        }
        expect(getOfferData.secondCall.args[1].fallbackWcsOsi).to.equal('parent-osi');
    });

    it('does not return partial cards from an aborted grouped variation load', async () => {
        const controller = new AbortController();
        const variationPath = '/content/dam/mas/sandbox/en_US/PA-2511/pzn/edu';
        const card = {
            path: '/content/dam/mas/sandbox/en_US/robert',
            fields: [{ name: 'variations', values: [variationPath] }],
        };

        const result = await enrichCards([card], {
            getByPath: async () => {
                controller.abort();
                return { path: variationPath, fields: [{ name: 'pznTags', values: ['mas:pzn/edu'] }] };
            },
            signal: controller.signal,
            includePersonalizationVariations: true,
        });

        expect(result).to.deep.equal([]);
    });

    it('enrichCards returns an empty array when the signal is already aborted after loading offer data', async () => {
        const abortController = new AbortController();
        abortController.abort();
        const cardData = new Fragment({
            path: '/content/dam/mas/acom/en_US/cards/card1',
            title: 'Card 1',
            model: { path: CARD_MODEL_PATH },
            tags: [],
            fields: [{ name: 'osi', values: ['osi-123'] }],
        });
        const getOfferData = sandbox.stub().resolves({ offerId: 'offer-1' });

        const cards = await enrichCards([cardData], {
            getByPath: sandbox.stub(),
            getOfferData,
            signal: abortController.signal,
        });

        expect(cards).to.deep.equal([]);
    });
    it('parsePlaceholdersFromStore extracts placeholders and applies display name', () => {
        const getDisplayName = sinon.stub().returns('placeholder: buy-now');
        const stores = [
            {
                get: () => ({
                    key: 'buy-now',
                    value: 'Buy now',
                    path: '/content/dam/mas/acom/en_US/placeholders/buy-now',
                    status: 'Published',
                }),
            },
            {
                get: () => ({
                    key: 'save-now',
                    value: 'Save now',
                    path: '/content/dam/mas/acom/en_US/placeholders/save-now',
                    status: 'Draft',
                }),
            },
        ];

        const result = parsePlaceholdersFromStore(stores, { getDisplayName });

        expect(result).to.have.lengthOf(2);
        expect(result[0].key).to.equal('buy-now');
        expect(result[0].studioPath).to.equal('placeholder: buy-now');
        expect(result[1].key).to.equal('save-now');
    });

    it('parsePlaceholdersFromStore filters out entries without a key', () => {
        const stores = [
            { get: () => ({ key: 'valid', value: 'Yes' }) },
            { get: () => ({ value: 'No key here' }) },
            { get: () => null },
        ];

        const result = parsePlaceholdersFromStore(stores);

        expect(result).to.have.lengthOf(1);
        expect(result[0].key).to.equal('valid');
    });
});
