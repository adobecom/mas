import { Fragment } from '../../aem/fragment.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../constants.js';

export const OFFER_DATA_CONCURRENCY_LIMIT = 5;
export const VARIATIONS_CONCURRENCY_LIMIT = 5;
export const LARGE_BATCH_YIELD_THRESHOLD = 50;

/**
 * Yields control to the event loop.
 * @returns {Promise<void>}
 */
export async function yieldToMain() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

/**
 * Processes async tasks with a concurrency limit and periodic yielding.
 *
 * NOTE: `Promise.resolve().then(...)` schedules all tasks into the microtask queue
 * immediately. The concurrency throttle applies only to async work; any synchronous
 * work inside `asyncFn` runs in parallel.
 *
 * @param {Array} items
 * @param {Function} asyncFn
 * @param {number} concurrencyLimit
 * @param {number} batchSize
 * @returns {Promise<Array>}
 */
export async function processConcurrently(items, asyncFn, concurrencyLimit, batchSize = 20) {
    const results = new Array(items.length);
    const executing = [];
    let processedCount = 0;

    for (let i = 0; i < items.length; i++) {
        const promise = Promise.resolve().then(() => asyncFn(items[i], i));
        results[i] = promise;

        if (concurrencyLimit <= items.length) {
            const execution = promise.then(() => {
                executing.splice(executing.indexOf(execution), 1);
                processedCount += 1;
            });
            executing.push(execution);

            if (executing.length >= concurrencyLimit) {
                await Promise.race(executing);
            }

            if (processedCount > 0 && processedCount % batchSize === 0) {
                await yieldToMain();
            }
        }
    }

    await Promise.all(executing);
    return Promise.all(results);
}

/**
 * Returns a flat path -> item map.
 * @param {Array<Object>} items
 * @returns {Map<string, Object>}
 */
export function buildItemsByPath(items = []) {
    return new Map(items.map((item) => [item.path, item]));
}

/**
 * Selects items from a path map in the same order as selectedPaths.
 * @param {Array<string>} selectedPaths
 * @param {Map<string, Object>} itemsByPath
 * @returns {Array<Object>}
 */
export function selectItemsByPath(selectedPaths = [], itemsByPath = new Map()) {
    return selectedPaths.map((path) => itemsByPath.get(path)).filter(Boolean);
}

/**
 * Flattens grouped variations by parent into a path -> variation map.
 * @param {Map<string, Map<string, Object>>} groupedVariationsByParent
 * @returns {Map<string, Object>}
 */
export function flattenGroupedVariationsByParent(groupedVariationsByParent = new Map()) {
    const flattened = new Map();
    for (const variationsMap of groupedVariationsByParent.values()) {
        for (const [path, variation] of variationsMap) {
            flattened.set(path, variation);
        }
    }
    return flattened;
}

/**
 * Parses mixed fragment entries into cards and collections with optional display names.
 * @param {Array<{ value?: Object }>} allFragments
 * @param {Object} options
 * @param {Function} [options.getDisplayName]
 * @returns {{ allCards: Array<Object>, allCollections: Array<Object> }}
 */
export function parseFragmentsFromStore(allFragments = [], { getDisplayName } = {}) {
    return allFragments.reduce(
        (acc, fragmentStore) => {
            const fragment = fragmentStore?.value ?? fragmentStore;
            const mappedFragment = {
                ...fragment,
                ...(getDisplayName ? { studioPath: getDisplayName(fragment) } : {}),
            };

            if (fragment?.model?.path === CARD_MODEL_PATH) {
                acc.allCards.push(mappedFragment);
            } else if (fragment?.model?.path === COLLECTION_MODEL_PATH) {
                acc.allCollections.push(mappedFragment);
            }

            return acc;
        },
        { allCards: [], allCollections: [] },
    );
}

/**
 * Loads items by path and enriches them with an optional display name.
 * @param {Array<string>} selectedPaths
 * @param {Object} options
 * @param {Function} options.getByPath
 * @param {Function} [options.getDisplayName]
 * @returns {Promise<Array<Object>>}
 */
export async function loadItemsByPath(selectedPaths, { getByPath, getDisplayName } = {}) {
    if (!selectedPaths?.length || !getByPath) {
        return [];
    }

    const fragments = await processConcurrently(
        selectedPaths,
        async (path) => {
            try {
                const fragmentData = await getByPath(path);
                return {
                    ...fragmentData,
                    ...(getDisplayName ? { studioPath: getDisplayName(new Fragment(fragmentData)) } : {}),
                };
            } catch (error) {
                console.warn(`Failed to fetch fragment at ${path}:`, error.message);
                return null;
            }
        },
        OFFER_DATA_CONCURRENCY_LIMIT,
    );

    return fragments.filter(Boolean);
}

/**
 * Loads grouped variations for a card fragment.
 * @param {Object} card
 * @param {Object} options
 * @param {Function} options.getByPath
 * @param {Function} [options.getOfferData]
 * @param {AbortSignal} [options.signal]
 * @param {Map} [options.offerDataCache]
 * @param {Function} [options.getDisplayName]
 * @returns {Promise<Array<Object>>}
 */
export async function loadGroupedVariations(
    card,
    { getByPath, getOfferData, signal, offerDataCache = new Map(), getDisplayName } = {},
) {
    if (!getByPath) return [];

    const fragment = new Fragment(card);
    const groupedRefs = fragment.listGroupedVariations();
    if (!groupedRefs?.length) return [];

    const variations = await processConcurrently(
        groupedRefs,
        async (ref) => {
            if (signal?.aborted) return null;

            try {
                return await getByPath(ref.path);
            } catch (error) {
                console.warn(`Failed to fetch grouped variation at ${ref.path}:`, error.message);
                return null;
            }
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );

    const validVariations = variations.filter(
        (variation) => variation && Array.isArray(variation.fieldTags) && variation.fieldTags.length > 0,
    );

    const offerDataResults = getOfferData
        ? await processConcurrently(
              validVariations,
              (variation) => getOfferData(variation, { cache: offerDataCache, signal }),
              VARIATIONS_CONCURRENCY_LIMIT,
          )
        : validVariations.map(() => null);

    return validVariations.map((variation, index) => ({
        ...variation,
        ...(getDisplayName ? { studioPath: getDisplayName(new Fragment(variation)) } : {}),
        offerData: offerDataResults[index] ?? null,
    }));
}

/**
 * Enriches cards with offer data and grouped variations.
 * @param {Array<Object>} cards
 * @param {Object} options
 * @param {Function} [options.getByPath]
 * @param {Function} [options.getOfferData]
 * @param {AbortSignal} [options.signal]
 * @param {Map} [options.offerDataCache]
 * @param {Function} [options.getDisplayName]
 * @param {Map<string, Object>} [options.existingOfferDataByPath]
 * @param {Map<string, Array<Object>>} [options.existingGroupedVariationsByPath]
 * @returns {Promise<Array<Object>>}
 */
export async function enrichCards(
    cards,
    {
        getByPath,
        getOfferData,
        signal,
        offerDataCache = new Map(),
        getDisplayName,
        existingOfferDataByPath = new Map(),
        existingGroupedVariationsByPath = new Map(),
    } = {},
) {
    const offerDataByPath = new Map(existingOfferDataByPath);
    const groupedVariationsByPath = new Map(existingGroupedVariationsByPath);

    const cardsNeedingOfferData = getOfferData ? cards.filter((card) => !offerDataByPath.has(card.path)) : [];

    if (cardsNeedingOfferData.length > 0) {
        const offerDataResults = await processConcurrently(
            cardsNeedingOfferData,
            (card) => getOfferData(card, { cache: offerDataCache, signal }),
            OFFER_DATA_CONCURRENCY_LIMIT,
        );

        if (signal?.aborted) return [];
        await yieldToMain();

        cardsNeedingOfferData.forEach((card, index) => {
            offerDataByPath.set(card.path, offerDataResults[index]);
        });
    }

    const cardsNeedingGroupedVariations = getByPath ? cards.filter((card) => !groupedVariationsByPath.has(card.path)) : [];

    if (cardsNeedingGroupedVariations.length > 0) {
        const groupedVariationsResults = await processConcurrently(
            cardsNeedingGroupedVariations,
            (card) =>
                loadGroupedVariations(card, {
                    getByPath,
                    getOfferData,
                    signal,
                    offerDataCache,
                    getDisplayName,
                }),
            OFFER_DATA_CONCURRENCY_LIMIT,
        );

        if (signal?.aborted) return [];
        await yieldToMain();

        cardsNeedingGroupedVariations.forEach((card, index) => {
            groupedVariationsByPath.set(card.path, groupedVariationsResults[index] ?? []);
        });
    }

    const enrichedCards = cards.map((card) => ({
        ...card,
        offerData: offerDataByPath.get(card.path) ?? null,
        groupedVariations: groupedVariationsByPath.get(card.path) ?? [],
    }));

    if (enrichedCards.length > LARGE_BATCH_YIELD_THRESHOLD) {
        await yieldToMain();
    }

    if (signal?.aborted) return [];
    return enrichedCards;
}

/**
 * Fetches and enriches a grouped variation by path.
 * @param {string} variationPath
 * @param {Object} options
 * @param {Function} options.getByPath
 * @param {Function} [options.getOfferData]
 * @param {Map} [options.offerDataCache]
 * @param {Function} [options.getDisplayName]
 * @returns {Promise<{ parentCardPath: string, variation: Object }|null>}
 */
export async function fetchVariationDataByPath(
    variationPath,
    { getByPath, getOfferData, offerDataCache = new Map(), getDisplayName } = {},
) {
    if (!getByPath || !Fragment.isGroupedVariationPath(variationPath)) return null;

    const pznIdx = variationPath.indexOf('/pzn/');
    if (pznIdx === -1) return null;
    const parentCardPath = variationPath.substring(0, pznIdx);

    try {
        const variation = await getByPath(variationPath);
        if (!variation || !Array.isArray(variation.fieldTags) || variation.fieldTags.length === 0) return null;

        const offerData = getOfferData ? await getOfferData(variation, { cache: offerDataCache }) : null;

        return {
            parentCardPath,
            variation: {
                ...variation,
                ...(getDisplayName ? { studioPath: getDisplayName(new Fragment(variation)) } : {}),
                offerData,
            },
        };
    } catch (error) {
        console.warn(`Failed to fetch variation at ${variationPath}:`, error.message);
        return null;
    }
}

/**
 * Loads grouped variations for a card and returns them keyed by path.
 * @param {Array<string>} variationPaths
 * @param {Object} options
 * @param {Function} options.getByPath
 * @param {Function} [options.getOfferData]
 * @param {Map} [options.offerDataCache]
 * @param {Function} [options.getDisplayName]
 * @returns {Promise<Map<string, Object>>}
 */
export async function loadCardVariationsByPath(
    variationPaths,
    { getByPath, getOfferData, offerDataCache = new Map(), getDisplayName } = {},
) {
    if (!variationPaths?.length || !getByPath) return new Map();

    const variations = await processConcurrently(
        variationPaths,
        async (path) => {
            try {
                return await getByPath(path);
            } catch (error) {
                console.warn(`Failed to fetch variation at ${path}:`, error.message);
                return null;
            }
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );

    const validVariations = variations.filter(
        (variation) => variation && Array.isArray(variation.fieldTags) && variation.fieldTags.length > 0,
    );

    const offerDataResults = getOfferData
        ? await processConcurrently(
              validVariations,
              (variation) => getOfferData(variation, { cache: offerDataCache }),
              VARIATIONS_CONCURRENCY_LIMIT,
          )
        : validVariations.map(() => null);

    return new Map(
        validVariations.map((variation, index) => [
            variation.path,
            {
                ...variation,
                ...(getDisplayName ? { studioPath: getDisplayName(new Fragment(variation)) } : {}),
                offerData: offerDataResults[index] ?? null,
            },
        ]),
    );
}

/**
 * Parses placeholder stores into a flat array of placeholders
 * @param {Array<{ value?: Object, get?: Function }>} placeholderStores
 * @param {Object} options
 * @param {Function} [options.getDisplayName]
 * @returns {Array<Object>}
 */
export function parsePlaceholdersFromStore(placeholderStores = [], { getDisplayName } = {}) {
    return placeholderStores
        .map((store) => {
            const placeholder = store?.get?.() ?? store?.value ?? store;
            if (!placeholder?.key) return null;
            return {
                ...placeholder,
                ...(getDisplayName ? { studioPath: getDisplayName(placeholder) } : {}),
            };
        })
        .filter(Boolean);
}
