import Store from '../store.js';
import { CARD_MODEL_PATH, TABLE_TYPE } from '../constants.js';
import { Fragment } from '../aem/fragment.js';
import { getFragmentName } from './translation-utils.js';
import { getService } from '../utils.js';

const OFFER_DATA_CONCURRENCY_LIMIT = 5;
const VARIATIONS_CONCURRENCY_LIMIT = 5;

/**
 * Yields control to the browser event loop
 * @returns {Promise<void>}
 */
async function yieldToMain() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

/**
 * Process an array of async tasks with concurrency limiting and periodic UI updates
 * @param {Array} items - Items to process
 * @param {Function} asyncFn - Async function to apply to each item
 * @param {Number} concurrencyLimit - Maximum number of concurrent operations
 * @param {Number} batchSize - Number of items to process before yielding to UI
 * @returns {Promise<Array>} Results in the same order as input items
 */
async function processConcurrently(items, asyncFn, concurrencyLimit, batchSize = 20) {
    const results = new Array(items.length);
    const executing = [];
    let processedCount = 0;

    for (let i = 0; i < items.length; i++) {
        const promise = Promise.resolve().then(() => asyncFn(items[i], i));
        results[i] = promise;

        if (concurrencyLimit <= items.length) {
            const e = promise.then(() => {
                executing.splice(executing.indexOf(e), 1);
                processedCount++;
            });
            executing.push(e);
            if (executing.length >= concurrencyLimit) {
                await Promise.race(executing);
            }

            if (processedCount % batchSize === 0) {
                await yieldToMain();
            }
        }
    }

    await Promise.all(executing);
    return Promise.all(results);
}

/**
 * Loads offer data for a fragment using its OSI field
 * @param {Object} fragment - Fragment object with fields
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @param {Number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Object|null>} Offer data or null if not found/failed
 */
async function loadOfferData(fragment, signal, timeoutMs = 10000) {
    const cache = Store.translationProjects.offerDataCache;
    const wcsOsi = fragment?.fields?.find(({ name }) => name === 'osi')?.values?.[0];
    if (!wcsOsi) return null;

    try {
        if (cache.has(wcsOsi)) {
            return cache.get(wcsOsi);
        }
        if (signal?.aborted) return null;

        const service = getService();
        const priceOptions = service.collectPriceOptions({ wcsOsi });
        const [offersPromise] = service.resolveOfferSelectors(priceOptions);
        if (!offersPromise) return null;
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
        });
        try {
            const [offer] = await Promise.race([offersPromise, timeoutPromise]);
            clearTimeout(timeoutId);
            if (signal?.aborted) return null;
            cache.set(wcsOsi, offer);
            return offer;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    } catch (err) {
        console.warn(`Failed to load offer data for fragment ${fragment.id}:`, err.message);
        if (!signal?.aborted) {
            cache.set(wcsOsi, null);
        }
        return null;
    }
}

/**
 * Loads grouped variations for a card fragment
 * @param {Object} card - Card object with path, references, fields
 * @param {Object} repository - MasRepository instance with aem.getFragmentByPath
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<Array<Object>>} Array of variation objects with studioPath and offerData
 */
async function loadGroupedVariations(card, repository, signal) {
    if (!repository?.aem?.getFragmentByPath) return [];
    const fragment = new Fragment(card);
    const groupedRefs = fragment.listGroupedVariations();
    if (!groupedRefs?.length) return [];

    const variations = await processConcurrently(
        groupedRefs,
        async (ref) => {
            if (signal?.aborted) return null;
            try {
                return await repository.aem.getFragmentByPath(ref.path);
            } catch (err) {
                console.warn(`Failed to fetch grouped variation at ${ref.path}:`, err.message);
                return null;
            }
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );

    const validVariations = variations.filter(
        (variation) => variation && Array.isArray(variation.fieldTags) && variation.fieldTags.length > 0,
    );

    const offerDataResults = await processConcurrently(
        validVariations,
        (variation) => loadOfferData(variation, signal),
        VARIATIONS_CONCURRENCY_LIMIT,
    );

    return validVariations.map((variation, i) => ({
        ...variation,
        studioPath: getFragmentName(new Fragment(variation)),
        offerData: offerDataResults[i] ?? null,
    }));
}

/**
 * Fetches a single variation by path and merges it into groupedVariationsByParent
 * @param {string} variationPath - Full path to the variation fragment
 * @param {Object} repository - MasRepository instance with aem.getFragmentByPath
 * @returns {Promise<boolean>} True if fetch and merge succeeded
 */
export async function fetchVariationByPath(variationPath, repository) {
    if (!repository?.aem?.getFragmentByPath || !Fragment.isGroupedVariationPath(variationPath)) return false;
    const pznIdx = variationPath.indexOf('/pzn/');
    if (pznIdx === -1) return false;
    const parentCardPath = variationPath.substring(0, pznIdx);

    try {
        const variation = await repository.aem.getFragmentByPath(variationPath);
        if (!variation || !Array.isArray(variation.fieldTags) || variation.fieldTags.length === 0) return false;

        const offerData = await loadOfferData(variation);
        const enriched = {
            ...variation,
            studioPath: getFragmentName(new Fragment(variation)),
            offerData,
        };

        const existing = Store.translationProjects.groupedVariationsByParent.value || new Map();
        const innerMap = new Map(existing.get(parentCardPath) || []);
        innerMap.set(variationPath, enriched);
        const merged = new Map(existing);
        merged.set(parentCardPath, innerMap);
        setCardVariationsByPaths(merged);
        return true;
    } catch (err) {
        console.warn(`Failed to fetch variation at ${variationPath}:`, err.message);
        return false;
    }
}

/**
 * Updates groupedVariationsByParent and keeps groupedVariationsData (flattened map) in sync.
 * Call this instead of Store.translationProjects.groupedVariationsByParent.set() to avoid rebuilding the flattened map on every render.
 * @param {Map} groupedVariationsByParentValue - Map of cardPath -> Map of variationPath -> variation
 */
export function setCardVariationsByPaths(groupedVariationsByParentValue) {
    Store.translationProjects.groupedVariationsByParent.set(groupedVariationsByParentValue);
    const flattened = new Map();
    for (const variationsMap of groupedVariationsByParentValue.values()) {
        for (const [path, variation] of variationsMap) {
            flattened.set(path, variation);
        }
    }
    Store.translationProjects.groupedVariationsData.set(flattened);
}

/**
 * Extracts card fragments from the shared fragment store, decorating each with studioPath.
 * Collections come from repository.loadAllCollections() — not this stream.
 * @param {Array} allFragments - Array of fragment store objects
 * @returns {Array} Array of card objects
 */
function parseCardsFromStore(allFragments) {
    return (allFragments || [])
        .filter((fragment) => fragment.value.model.path === CARD_MODEL_PATH)
        .map((fragment) => ({
            ...fragment.value,
            studioPath: getFragmentName(fragment.value),
        }));
}

/**
 * Processes and enriches cards with offer data and grouped variations, writes to store.
 * Re-entrant: if a call arrives while one is already in flight, the new payload is
 * stashed in state.pendingCards and processed when the current call settles. This
 * preserves the latest snapshot rather than dropping it on the floor.
 * @param {Array<Object>} allCards - Array of card objects
 * @param {Object} repository - MasRepository instance
 * @param {Object} state - Mutable state { isProcessingCards, pendingCards, abortController }
 */
async function processCardsData(allCards, repository, state) {
    if (state.isProcessingCards) {
        state.pendingCards = allCards;
        return;
    }
    state.isProcessingCards = true;
    const signal = state.abortController?.signal;

    try {
        const existingCards = Store.translationProjects.allCards.get() || [];
        const existingOfferDataByPath = new Map(
            existingCards.filter((card) => card.offerData !== undefined).map((card) => [card.path, card.offerData]),
        );
        const existingGroupedVariationsByPath = new Map(
            existingCards
                .filter((card) => card.groupedVariations !== undefined)
                .map((card) => [card.path, card.groupedVariations]),
        );

        const cardsNeedingOfferData = allCards.filter((card) => !existingOfferDataByPath.has(card.path));
        if (cardsNeedingOfferData.length > 0) {
            const offerDataResults = await processConcurrently(
                cardsNeedingOfferData,
                (card) => loadOfferData(card, signal),
                OFFER_DATA_CONCURRENCY_LIMIT,
            );
            if (signal?.aborted) return;
            await yieldToMain();
            cardsNeedingOfferData.forEach((card, i) => {
                existingOfferDataByPath.set(card.path, offerDataResults[i]);
            });
        }

        const cardsNeedingGroupedVariations = allCards.filter((card) => !existingGroupedVariationsByPath.has(card.path));
        if (cardsNeedingGroupedVariations.length > 0 && repository) {
            const groupedVariationsResults = await processConcurrently(
                cardsNeedingGroupedVariations,
                (card) => loadGroupedVariations(card, repository, signal),
                OFFER_DATA_CONCURRENCY_LIMIT,
            );
            if (signal?.aborted) return;
            await yieldToMain();
            cardsNeedingGroupedVariations.forEach((card, i) => {
                existingGroupedVariationsByPath.set(card.path, groupedVariationsResults[i] ?? []);
            });
        }

        if (signal?.aborted) return;

        const enrichedCards = allCards.map((card) => ({
            ...card,
            offerData: existingOfferDataByPath.get(card.path) ?? null,
            groupedVariations: existingGroupedVariationsByPath.get(card.path) ?? [],
        }));

        if (enrichedCards.length > 50) {
            await yieldToMain();
        }
        if (signal?.aborted) return;

        const cardsByPaths = new Map(enrichedCards.map((card) => [card.path, card]));
        const prefetchedVariations = new Map(
            enrichedCards
                .filter((card) => card.groupedVariations?.length)
                .map((card) => [card.path, new Map(card.groupedVariations.map((v) => [v.path, v]))]),
        );
        if (prefetchedVariations.size > 0) {
            const existing = Store.translationProjects.groupedVariationsByParent.value || new Map();
            const merged = new Map(existing);
            for (const [cardPath, varMap] of prefetchedVariations) {
                merged.set(cardPath, varMap);
            }
            setCardVariationsByPaths(merged);
        }
        Store.translationProjects.displayCards.set(enrichedCards);
        Store.translationProjects.allCards.set(enrichedCards);
        Store.translationProjects.cardsByPaths.set(cardsByPaths);
    } finally {
        state.isProcessingCards = false;
        if (state.pendingCards && !signal?.aborted) {
            const next = state.pendingCards;
            state.pendingCards = null;
            await processCardsData(next, repository, state);
        }
    }
}

/**
 * Loads all placeholders. Subscribes to placeholders list and populates store.
 * @returns {{ unsubscribe: () => void }}
 */
export function loadAllPlaceholders() {
    if (Store.translationProjects.allPlaceholders.get()?.length) {
        return { unsubscribe: () => {} };
    }
    const callback = () => {
        const placeholderValues = Store.placeholders.list.data.get().map((placeholder) => placeholder.value);
        const placeholdersByPaths = new Map(placeholderValues.map((p) => [p.path, p]));
        Store.translationProjects.displayPlaceholders.set(placeholderValues);
        Store.translationProjects.allPlaceholders.set(placeholderValues);
        Store.translationProjects.placeholdersByPaths.set(placeholdersByPaths);
    };
    Store.placeholders.list.data.subscribe(callback);
    return { unsubscribe: () => Store.placeholders.list.data.unsubscribe(callback) };
}

/**
 * Loads all fragments (cards or collections). Subscribes to fragments list and populates store.
 * @param {string} type - TABLE_TYPE.CARDS or TABLE_TYPE.COLLECTIONS
 * @param {Object} repository - MasRepository instance
 * @param {Object} state - Mutable state for process cancellation
 * @returns {{ unsubscribe: () => void }}
 */
export function loadAllFragments(type, repository, state = {}) {
    // Collections load via repository.loadAllCollections() with a dedicated model-filtered
    // query; partitioning the shared card stream misses collections that sit deep in the
    // cursor on large surfaces (acom, nala) where cards dominate the first pages.
    if (type === TABLE_TYPE.COLLECTIONS) {
        return { unsubscribe: () => {} };
    }
    if (state.subscribed) {
        return { unsubscribe: () => {} };
    }
    state.subscribed = true;
    const callback = async () => {
        const allCards = parseCardsFromStore(Store.fragments.list.data.get() || []);
        await processCardsData(allCards, repository, state);
    };
    Store.fragments.list.data.subscribe(callback);
    return {
        unsubscribe: () => {
            Store.fragments.list.data.unsubscribe(callback);
            state.subscribed = false;
        },
    };
}

/**
 * Loads selected placeholders for view-only mode. Subscribes to placeholders list.
 * @param {Array<string>} selectedPaths - Paths of selected placeholders
 * @param {(items: Array) => void} onItems - Callback with filtered items
 * @returns {{ unsubscribe: () => void }}
 */
export function loadSelectedPlaceholders(selectedPaths, onItems) {
    if (!selectedPaths?.length) {
        if (onItems) onItems([]);
        return { unsubscribe: () => {} };
    }
    const callback = () => {
        const placeholderValues = Store.placeholders.list.data.get().map(({ value }) => value);
        const placeholdersByPaths = new Map(placeholderValues.map((p) => [p.path, p]));
        const selected = selectedPaths.map((path) => placeholdersByPaths.get(path)).filter(Boolean);
        onItems(selected);
    };
    Store.placeholders.list.data.subscribe(callback);
    return { unsubscribe: () => Store.placeholders.list.data.unsubscribe(callback) };
}

/**
 * Loads selected fragments for view-only mode. Fetches by path and enriches.
 * @param {Array<string>} selectedPaths - Paths of selected fragments
 * @param {string} type - TABLE_TYPE.CARDS or TABLE_TYPE.COLLECTIONS
 * @param {Object} repository - MasRepository instance
 * @param {Object} options - { signal: AbortSignal, onItems: (items) => void }
 * @returns {Promise<void>}
 */
export async function loadSelectedFragments(selectedPaths, type, repository, options = {}) {
    const { signal, onItems } = options;
    if (!repository || !selectedPaths?.length) {
        if (onItems) onItems([]);
        return;
    }

    try {
        const fragments = await processConcurrently(
            selectedPaths,
            async (path) => {
                try {
                    const fragmentData = await repository.aem.getFragmentByPath(path);
                    const fragment = new Fragment(fragmentData);
                    return {
                        ...fragmentData,
                        studioPath: getFragmentName(fragment),
                    };
                } catch (err) {
                    console.warn(`Failed to fetch fragment at ${path}:`, err.message);
                    return null;
                }
            },
            OFFER_DATA_CONCURRENCY_LIMIT,
        );

        const validFragments = fragments.filter(Boolean);

        if (type === TABLE_TYPE.CARDS) {
            const enriched = await enrichCardsForViewOnly(validFragments, repository, signal);
            if (!signal?.aborted && onItems) onItems(enriched);
        } else if (onItems) {
            onItems(validFragments);
        }
    } catch (err) {
        console.error('Failed to load selected fragments:', err);
        if (onItems) onItems([]);
    }
}

/**
 * Enriches cards with offer data and grouped variations (for view-only)
 * @param {Array<Object>} cards - Card objects
 * @param {Object} repository - MasRepository instance
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise<Array<Object>>} Enriched cards
 */
async function enrichCardsForViewOnly(cards, repository, signal) {
    const offerDataResults = await processConcurrently(
        cards,
        (card) => loadOfferData(card, signal),
        OFFER_DATA_CONCURRENCY_LIMIT,
    );
    if (signal?.aborted) return [];

    const groupedVariationsResults = repository
        ? await processConcurrently(
              cards,
              (card) => loadGroupedVariations(card, repository, signal),
              OFFER_DATA_CONCURRENCY_LIMIT,
          )
        : cards.map(() => []);

    if (signal?.aborted) return [];

    return cards.map((card, i) => ({
        ...card,
        offerData: offerDataResults[i] ?? null,
        groupedVariations: groupedVariationsResults[i] ?? [],
    }));
}

/**
 * Fetches unresolved grouped variation paths for selected cards.
 * Skips paths already in cardsByPaths or groupedVariationsByParent; uses unresolvedPathsFetched to avoid re-fetching.
 * @param {Array<string>} selectedCards - Paths of selected cards (may include variation paths)
 * @param {Map} cardsByPaths - Map of path -> card from Store
 * @param {Map} groupedVariationsByParent - Map of cardPath -> Map of variationPath -> variation
 * @param {Object} repository - MasRepository instance
 * @returns {Promise<void>}
 */
export async function fetchUnresolvedVariations(selectedCards, cardsByPaths, groupedVariationsByParent, repository) {
    const unresolvedPathsFetched = new Set();
    const unresolved = (selectedCards || []).filter((path) => {
        if (!Fragment.isGroupedVariationPath(path)) return false;
        if (cardsByPaths?.get(path)) return false;
        for (const [, variationsMap] of groupedVariationsByParent || []) {
            if (variationsMap.has(path)) return false;
        }
        return true;
    });

    for (const path of unresolved) {
        unresolvedPathsFetched.add(path);
        const fetchedSuccessfully = await fetchVariationByPath(path, repository);
        if (!fetchedSuccessfully) unresolvedPathsFetched.delete(path);
    }
}

/**
 * Loads grouped variations for a card and merges them into groupedVariationsByParent.
 * Skips if variationPaths is empty or data already exists for the card.
 * @param {string} cardPath - Path of the parent card
 * @param {Array<string>} variationPaths - Paths of variation fragments to fetch
 * @param {Object} repository - MasRepository instance
 * @returns {Promise<void>}
 */
export async function loadCardVariations(cardPath, variationPaths, repository) {
    const hadPath = Store.translationProjects.groupedVariationsByParent.value?.has(cardPath);
    if (!variationPaths?.length || hadPath || !repository) return;

    try {
        const variations = await processConcurrently(
            variationPaths,
            async (path) => {
                try {
                    return await repository.aem.getFragmentByPath(path);
                } catch (err) {
                    console.warn(`Failed to fetch variation at ${path}:`, err.message);
                    return null;
                }
            },
            VARIATIONS_CONCURRENCY_LIMIT,
        );

        const validVariations = variations.filter(
            (variation) => variation && Array.isArray(variation.fieldTags) && variation.fieldTags.length > 0,
        );

        const offerDataResults = await processConcurrently(
            validVariations,
            (variation) => loadOfferData(variation),
            VARIATIONS_CONCURRENCY_LIMIT,
        );

        const variationsByPaths = new Map(
            validVariations.map((variation, index) => [
                variation.path,
                {
                    ...variation,
                    studioPath: getFragmentName(new Fragment(variation)),
                    offerData: offerDataResults[index] ?? null,
                },
            ]),
        );

        const existing = Store.translationProjects.groupedVariationsByParent.value || new Map();
        const merged = new Map(existing);
        merged.set(cardPath, variationsByPaths);
        setCardVariationsByPaths(merged);
    } catch (error) {
        console.error('Failed to fetch variations for the fragment at path:', cardPath, error);
    }
}
