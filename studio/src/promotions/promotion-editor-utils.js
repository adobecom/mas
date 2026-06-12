import { isPznCountryTagId, tagRefToTagId } from '../common/utils/personalization-utils.js';
import { COLLECTION_MODEL_PATH, ROOT_PATH, TAG_PROMOTION_PREFIX } from '../constants.js';
import { ADOBE_PRODUCTS } from '../constants/adobe-products.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { getItemsSelectionStore } from '../common/items-selection-store.js';
import Store from '../store.js';
import { closeOfferSelectorTool } from '../rte/ost.js';
import { getService, isUUID, parseStudioDeepLinksFromText } from '../utils.js';

const PRODUCT_ICON_BASE_URL = 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg';

export const PROMOTION_FIELD_TYPE_MAP = {
    title: { type: 'text' },
    promoCode: { type: 'text' },
    offers: { type: 'text', multiple: true },
    startDate: { type: 'date-time' },
    endDate: { type: 'date-time' },
    tags: { type: 'tag', multiple: true },
    surfaces: { type: 'text', multiple: true },
    geos: { type: 'tag', multiple: true },
    fragments: { type: 'content-fragment', multiple: true },
};

/**
 * Normalize deep links, DAM paths and UUIDs for promotion item picker search.
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizePromotionSearchInput(raw) {
    if (raw == null || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const deepLinks = parseStudioDeepLinksFromText(trimmed);
    if (deepLinks.length && deepLinks[0].fragmentId) return deepLinks[0].fragmentId;
    if (isUUID(trimmed)) return trimmed;
    const marker = ROOT_PATH;
    const idx = trimmed.indexOf(marker);
    if (idx !== -1) {
        let path = trimmed.slice(idx);
        const cut = path.search(/[?#]/);
        if (cut !== -1) path = path.slice(0, cut);
        return path.replace(/\/+$/, '');
    }
    return trimmed;
}

/**
 * True when fragments + collections saved on the promotion differ from selected cards/collections in store.
 * @param {{ getFieldValues: (name: string) => unknown[], getField?: (name: string) => unknown }} promotionLike
 * @param {string[]|undefined} selectedCards
 * @param {string[]|undefined} selectedCollections
 */
export function isPromotionItemSelectionDirty(promotionLike, selectedCards, selectedCollections, hydrateUnreachablePaths) {
    if (!promotionLike) return false;
    const fragPaths = promotionLike.getFieldValues('fragments');
    const colPaths = promotionLike.getField('collections') ? promotionLike.getFieldValues('collections') : [];
    const savedSet = new Set([...fragPaths, ...colPaths].filter(Boolean));
    const currentSet = new Set([...(selectedCards || []), ...(selectedCollections || [])].filter(Boolean));
    const unreachable = new Set(hydrateUnreachablePaths || []);

    for (const p of currentSet) {
        if (!savedSet.has(p)) return true;
    }
    for (const p of savedSet) {
        if (currentSet.has(p)) continue;
        if (unreachable.has(p)) continue;
        return true;
    }
    return false;
}

/**
 * @param {unknown[]} [allValues]
 * @returns {{ promotion: string[], retained: string[] }}
 */
export function splitPromotionTagsFieldValues(allValues) {
    const list = Array.isArray(allValues) ? allValues.filter(Boolean) : [];
    const promotion = [];
    const retained = [];
    for (const t of list) {
        const id = normalizeTagId(t);
        if (id.startsWith(TAG_PROMOTION_PREFIX)) promotion.push(t);
        else retained.push(t);
    }
    return { promotion, retained };
}

export function serializePromotionSurfacesForAem(values) {
    if (!Array.isArray(values) || !values.length) return [];
    const tokens = values.flatMap((v) =>
        String(v)
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean),
    );
    return [...new Set(tokens.map((t) => t.toLowerCase()))];
}

/**
 * @param {unknown[]|undefined} values Raw `surfaces` field values from a promotion fragment
 * @returns {string[]} surfaces
 */
export function parsePromotionSurfacesFieldValues(values) {
    if (!Array.isArray(values) || !values.length) return [];
    const tokens = values.flatMap((v) =>
        String(v)
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean),
    );
    return [...new Set(tokens.map((t) => t.toLowerCase()))];
}

/**
 * @param {string[]} allPaths
 * @param {(path: string) => Promise<unknown>} getFragmentByPath
 * @param {string} [collectionModelPath]
 * @returns {Promise<{ cards: string[], cols: string[] }>}
 */
export async function classifyPromotionPathsForSelection(
    allPaths,
    getFragmentByPath,
    collectionModelPath = COLLECTION_MODEL_PATH,
) {
    if (!allPaths.length) {
        return { cards: [], cols: [] };
    }
    const results = await Promise.allSettled(allPaths.map((path) => getFragmentByPath(path)));
    const cards = [];
    const cols = [];
    results.forEach((result, i) => {
        const path = allPaths[i];
        if (result.status !== 'fulfilled') {
            cards.push(path);
            return;
        }
        const modelPath = result.value?.model?.path;
        if (!modelPath) {
            cards.push(path);
            return;
        }
        if (modelPath === collectionModelPath) cols.push(path);
        else cards.push(path);
    });
    return { cards, cols };
}

/**
 * First validation message for a promotion editor save/create, or null when valid.
 * @param {{ getFieldValue: (name: string) => unknown, getFieldValues: (name: string) => unknown[] }} fragment
 * @param {number} itemCount Selected cards + collections count
 * @returns {string|null}
 */
export function getPromotionRequiredFieldsValidation(fragment, itemCount) {
    if (!fragment.getFieldValue('title')) {
        return 'Please enter a Title.';
    }
    if (!fragment.getFieldValue('promoCode')) {
        return 'Please enter a Promo Code.';
    }
    if (!fragment.getFieldValue('startDate')) {
        return 'Please set a Start Date.';
    }
    if (!fragment.getFieldValue('endDate')) {
        return 'Please set an End Date.';
    }
    if (splitPromotionTagsFieldValues(fragment.getFieldValues('tags')).promotion.length === 0) {
        return 'Please add at least one Promotion tag.';
    }
    if (!fragment.getFieldValues('geos').length) {
        return 'Please add at least one Geo.';
    }
    if (!parsePromotionSurfacesFieldValues(fragment.getFieldValues('surfaces')).length) {
        return 'Please add at least one Surface.';
    }
    if (itemCount <= 0) {
        return 'Please add at least one fragment or collection.';
    }
    return null;
}

/**
 * Collects unique mas:product_code tag ids from cached promotion offers.
 * @param {Map<string, { tags?: Array<{ id?: string }> }>} offerDataCache
 * @param {string[]} selectedOfferIds
 * @returns {string[]}
 */
export function collectPromotionOfferProductTags(offerDataCache, selectedOfferIds) {
    const cache = offerDataCache instanceof Map ? offerDataCache : new Map();
    const ids = Array.isArray(selectedOfferIds) ? selectedOfferIds : [];
    return [
        ...new Set(
            ids.flatMap((id) => {
                const data = cache.get(id);
                return data?.tags?.filter((t) => t.id?.startsWith('mas:product_code/')).map((t) => t.id) ?? [];
            }),
        ),
    ];
}

/**
 * Applies selected-offer product tags to the active items-selection filters store (or Store.filters) for AEM fragment search.
 * @param {Map<string, { tags?: Array<{ id?: string }> }>} offerDataCache
 * @param {string[]} selectedOfferIds
 * @returns {string[]}
 */
export function applyPromotionOfferProductTagsToSearch(offerDataCache, selectedOfferIds) {
    const tags = collectPromotionOfferProductTags(offerDataCache, selectedOfferIds);
    const filtersStore = getItemsSelectionStore({ allowUnset: true })?.filters ?? Store.filters;
    filtersStore.set((prev) => ({
        ...prev,
        tags: tags.length ? tags.join(',') : undefined,
    }));
    return tags;
}

function extractPromotionItemProductCodeTagIds(tags) {
    if (!Array.isArray(tags)) return [];
    return tags.filter((tag) => tag?.id?.startsWith('mas:product_code/')).map((tag) => tag.id);
}

function resolvePromotionItemProductCodeTagIds(path, lookups) {
    const { cardsByPaths, collectionsByPaths, groupedVariationsByParent, groupedVariationsData } = lookups;
    const card = cardsByPaths?.get(path);
    if (card?.tags?.length) return extractPromotionItemProductCodeTagIds(card.tags);
    const collection = collectionsByPaths?.get(path);
    if (collection?.tags?.length) return extractPromotionItemProductCodeTagIds(collection.tags);
    const variation = groupedVariationsData?.get(path);
    if (variation?.tags?.length) return extractPromotionItemProductCodeTagIds(variation.tags);
    for (const variationsMap of groupedVariationsByParent?.values() || []) {
        const nested = variationsMap?.get(path);
        if (nested?.tags?.length) return extractPromotionItemProductCodeTagIds(nested.tags);
    }
    return [];
}

function promotionItemMatchesRemainingOfferProductTags(itemProductCodeTagIds, remainingOfferProductTags) {
    if (!remainingOfferProductTags.length || !itemProductCodeTagIds.length) return false;
    const remaining = new Set(remainingOfferProductTags);
    return itemProductCodeTagIds.some((id) => remaining.has(id));
}

/**
 * Drops selected cards/collections that no longer match any remaining offer product code.
 * When no offers remain, clears all selected items.
 * @param {object} params
 * @returns {{ selectedCards: string[], selectedCollections: string[] }}
 */
export function getPromotionItemsRemovedByOfferRemoval({
    offerSelectorId,
    selectedOffers,
    selectedCards,
    selectedCollections,
    offerDataCache,
    cardsByPaths,
    collectionsByPaths,
    groupedVariationsByParent,
    groupedVariationsData,
}) {
    const currentCards = selectedCards || [];
    const currentCollections = selectedCollections || [];
    const remainingOffers = (selectedOffers || []).filter((id) => id !== offerSelectorId);

    if (!remainingOffers.length) {
        return {
            removedCards: [...currentCards],
            removedCollections: [...currentCollections],
        };
    }

    const pruned = pruneOrphanedPromotionSelectionAfterOfferRemoval({
        selectedCards: currentCards,
        selectedCollections: currentCollections,
        remainingSelectedOfferIds: remainingOffers,
        offerDataCache,
        cardsByPaths,
        collectionsByPaths,
        groupedVariationsByParent,
        groupedVariationsData,
    });
    const prunedCardSet = new Set(pruned.selectedCards);
    const prunedCollectionSet = new Set(pruned.selectedCollections);
    return {
        removedCards: currentCards.filter((path) => !prunedCardSet.has(path)),
        removedCollections: currentCollections.filter((path) => !prunedCollectionSet.has(path)),
    };
}

export function buildRemoveOfferConfirmationMessage(fragmentCount, collectionCount = 0) {
    const parts = [];
    if (fragmentCount > 0) {
        parts.push(fragmentCount === 1 ? '1 fragment' : `${fragmentCount} fragments`);
    }
    if (collectionCount > 0) {
        parts.push(collectionCount === 1 ? '1 collection' : `${collectionCount} collections`);
    }
    const itemsLabel = parts.join(' and ');
    const total = fragmentCount + collectionCount;
    const verb = total === 1 ? 'was' : 'were';
    return `${itemsLabel} ${verb} selected with this offer and will be removed from the list. Are you sure you want to delete the offer?`;
}

export function pruneOrphanedPromotionSelectionAfterOfferRemoval({
    selectedCards,
    selectedCollections,
    remainingSelectedOfferIds,
    offerDataCache,
    cardsByPaths,
    collectionsByPaths,
    groupedVariationsByParent,
    groupedVariationsData,
}) {
    if (!remainingSelectedOfferIds?.length) {
        return { selectedCards: [], selectedCollections: [] };
    }

    const remainingOfferProductTags = collectPromotionOfferProductTags(offerDataCache, remainingSelectedOfferIds);
    if (remainingSelectedOfferIds.length && !remainingOfferProductTags.length) {
        return {
            selectedCards: [...(selectedCards || [])],
            selectedCollections: [...(selectedCollections || [])],
        };
    }
    const lookups = { cardsByPaths, collectionsByPaths, groupedVariationsByParent, groupedVariationsData };
    const keepPath = (path) => {
        const itemTags = resolvePromotionItemProductCodeTagIds(path, lookups);
        return promotionItemMatchesRemainingOfferProductTags(itemTags, remainingOfferProductTags);
    };

    return {
        selectedCards: (selectedCards || []).filter(keepPath),
        selectedCollections: (selectedCollections || []).filter(keepPath),
    };
}

function formatPromotionOfferTagTitle(value) {
    if (value == null || value === '') return '';
    return String(value).toUpperCase();
}

/**
 * Builds mas tag entries for promotion offer table columns from an OST offer payload.
 * @param {object} offer
 * @param {string} [productArrangementCode]
 * @returns {Array<{ id: string, title: string }>}
 */
export function buildPromotionOfferTags(offer, productArrangementCode) {
    const tags = [];
    const addTag = (category, value, displayValue) => {
        if (value == null || value === '') return;
        const normalized = String(value).toLowerCase();
        tags.push({
            id: `mas:${category}/${normalized}`,
            title: displayValue ?? formatPromotionOfferTagTitle(value),
        });
    };

    const arrangement = offer?.productArrangement ?? offer?.product_arrangement;
    const productCode = offer?.product_code ?? offer?.productCode ?? arrangement?.productCode ?? arrangement?.product_code;
    const productName =
        offer?.product_name ?? offer?.productName ?? arrangement?.productFamily ?? arrangement?.product_family ?? productCode;
    addTag('product_code', productCode, productName);
    addTag('product_arrangement', productArrangementCode, productArrangementCode);
    addTag('offer_type', offer?.offer_type ?? offer?.offerType);
    addTag('plan_type', offer?.planType ?? offer?.plan_type);
    addTag('customer_segment', offer?.customer_segment ?? offer?.customerSegment);
    const marketSegment = Array.isArray(offer?.market_segments)
        ? offer.market_segments[0]
        : (offer?.market_segments ?? offer?.market_segment ?? offer?.marketSegments?.[0] ?? offer?.marketSegment);
    addTag('market_segment', marketSegment);

    return tags;
}

/**
 * Resolves a mnemonic icon URL from an OST offer payload.
 * @param {object} offer
 * @returns {string|undefined}
 */
export function resolvePromotionOfferMnemonicIconUrl(offer) {
    if (offer?.icon) return offer.icon;
    if (offer?.productIcon) return offer.productIcon;

    const code = String(offer?.product_code ?? '').toLowerCase();
    if (!code) return undefined;

    const byId = ADOBE_PRODUCTS.find((product) => product.id === code || product.id.replace(/-/g, '') === code);
    if (byId) return `${PRODUCT_ICON_BASE_URL}/${byId.id}.svg`;

    const compactCode = code.replace(/[^a-z0-9]/g, '');
    const byName = ADOBE_PRODUCTS.find((product) => product.name.toLowerCase().replace(/[^a-z0-9]/g, '') === compactCode);
    if (byName) return `${PRODUCT_ICON_BASE_URL}/${byName.id}.svg`;

    return undefined;
}

export function normalizePromotionOfferData(offer, offerSelectorId, productArrangementCode) {
    const base = offer && typeof offer === 'object' ? { ...offer } : {};
    const offerId = base.offerId ?? base.offer_id ?? offerSelectorId;
    const arrangementCode = productArrangementCode ?? base.product_arrangement_code ?? base.productArrangementCode;
    delete base.offer_id;
    return {
        ...base,
        offerId,
        product_arrangement_code: arrangementCode,
    };
}

/**
 * Builds a cached promotion offer row with getTagTitle for the offers table.
 * @param {string} offerSelectorId
 * @param {object} offer
 * @param {string} [productArrangementCode]
 * @returns {object}
 */
export function buildPromotionOfferCacheEntry(offerSelectorId, offer, productArrangementCode) {
    const offerData = normalizePromotionOfferData(offer, offerSelectorId, productArrangementCode);
    const tags = buildPromotionOfferTags(offer, offerData.product_arrangement_code);
    const mnemonicIcon = resolvePromotionOfferMnemonicIconUrl(offer);
    const fields = mnemonicIcon ? [{ name: 'mnemonicIcon', values: [mnemonicIcon] }] : [];
    return {
        path: offerSelectorId,
        id: offerSelectorId,
        offerData,
        tags,
        fields,
        getTagTitle(tagKey) {
            const match = this.tags.filter((tag) => tag.id.includes(tagKey));
            return match[0]?.title;
        },
        getFieldValue(name) {
            return this.fields.find((field) => field.name === name)?.values?.[0];
        },
    };
}

function extractCountryFromLocale(locale) {
    if (!locale) return null;
    const parts = String(locale).split('_');
    if (parts.length === 1) return parts[0].toUpperCase();
    const countryPart = parts.find((p) => /[A-Z]/.test(p));
    return (countryPart ?? parts[parts.length - 1]).toUpperCase();
}

async function resolvePromotionWcsOffer(offerSelectorId, country) {
    if (!offerSelectorId) return null;
    const service = getService();
    if (!service?.collectPriceOptions || !service?.resolveOfferSelectors) return null;
    const overrides = { wcsOsi: offerSelectorId };
    const countryCode = extractCountryFromLocale(country);
    if (countryCode) {
        overrides.country = countryCode;
        overrides.language = countryCode === 'GB' ? 'EN' : 'MULT';
    }
    const priceOptions = service.collectPriceOptions(overrides);
    const [offersPromise] = service.resolveOfferSelectors(priceOptions);
    if (!offersPromise) return null;
    const [offer] = (await offersPromise) || [];
    return offer ?? null;
}

/**
 * Resolves an offer selector id via commerce and builds a promotion offer cache row.
 * @param {string} offerSelectorId
 * @param {string} [country]
 * @returns {Promise<object|null>}
 */
export async function resolvePromotionOfferCacheEntry(offerSelectorId, country) {
    if (!offerSelectorId) return null;
    let resolvedOffer = null;
    try {
        resolvedOffer = await resolvePromotionWcsOffer(offerSelectorId, country);
    } catch {
        resolvedOffer = null;
    }
    const arrangementCode = resolvedOffer?.product_arrangement_code ?? resolvedOffer?.productArrangementCode;
    return buildPromotionOfferCacheEntry(offerSelectorId, resolvedOffer, arrangementCode);
}

/**
 * @param {string[]} offerSelectorIds
 * @param {Map<string, object>} offerDataCache
 */
export async function hydratePromotionOfferCacheFromSelectorIds(offerSelectorIds, offerDataCache) {
    const cache = offerDataCache instanceof Map ? offerDataCache : new Map();
    const ids = (offerSelectorIds || []).filter(Boolean);
    await Promise.all(
        ids.map(async (id) => {
            const existing = cache.get(id);
            if (promotionOfferCacheEntryHasDisplayName(existing)) return;
            cache.set(id, await resolvePromotionOfferCacheEntry(id));
        }),
    );
}

async function resolvePromotionOfferProductArrangementCode(offerSelectorId, offer) {
    if (offer?.productArrangementCode) return offer.productArrangementCode;
    if (offer?.product_arrangement_code) return offer.product_arrangement_code;
    if (!offerSelectorId) return undefined;
    try {
        const resolvedOffer = await resolvePromotionWcsOffer(offerSelectorId);
        return resolvedOffer?.productArrangementCode ?? resolvedOffer?.product_arrangement_code;
    } catch {
        return undefined;
    }
}

/**
 * Adds an offer from OST Use to the promotions offers selection and cache.
 * @param {string} offerSelectorId
 * @param {object} offer
 * @param {{ value: string[], set: (value: string[]) => void }} selectedOffersStore
 * @param {Map<string, object>} offerDataCache
 * @param {string} [productArrangementCode]
 * @returns {boolean}
 */
export function addPromotionOfferFromOst(offerSelectorId, offer, selectedOffersStore, offerDataCache, productArrangementCode) {
    if (!offerSelectorId) return false;
    if (selectedOffersStore.value.includes(offerSelectorId)) return false;
    selectedOffersStore.set([...selectedOffersStore.value, offerSelectorId]);
    offerDataCache.set(offerSelectorId, buildPromotionOfferCacheEntry(offerSelectorId, offer, productArrangementCode));
    return true;
}

/**
 * Handles OST Use for promotions offers selection.
 * @param {CustomEvent} event
 * @returns {Promise<boolean>}
 */
export async function handlePromotionOstOfferSelect({ detail: { offerSelectorId, offer } = {} } = {}) {
    const productArrangementCode = await resolvePromotionOfferProductArrangementCode(offerSelectorId, offer);
    const store = getItemsSelectionStore();
    const added = addPromotionOfferFromOst(
        offerSelectorId,
        offer,
        store.selectedOffers,
        Store.promotions.offerDataCache,
        productArrangementCode,
    );
    closeOfferSelectorTool();
    return added;
}

const PROMOTION_OFFER_SUBSTITUTION_PREFIX = 'substitute';
const PROMOTION_OFFER_CACHE_PREFIX = 'offer-cache';

const PROMOTION_OFFER_CACHE_SNAPSHOT_KEYS = [
    'product_code',
    'product_name',
    'offer_type',
    'plan_type',
    'customer_segment',
    'market_segment',
    'product_arrangement_code',
    'icon',
    'offer_id',
];

export function isPromotionOfferSubstitutionEntry(entry) {
    return typeof entry === 'string' && entry.startsWith(`${PROMOTION_OFFER_SUBSTITUTION_PREFIX}:`);
}

export function isPromotionOfferCacheEntry(entry) {
    return typeof entry === 'string' && entry.startsWith(`${PROMOTION_OFFER_CACHE_PREFIX}:`);
}

function sanitizePromotionOfferCacheSnapshot(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const snapshot = {};
    for (const key of PROMOTION_OFFER_CACHE_SNAPSHOT_KEYS) {
        const value = raw[key];
        if (value == null || value === '') continue;
        snapshot[key] = String(value);
    }
    return Object.keys(snapshot).length ? snapshot : null;
}

/**
 * @param {object|null|undefined} cacheEntry
 * @returns {Record<string, string>|null}
 */
export function serializePromotionOfferCacheSnapshot(cacheEntry) {
    if (!cacheEntry) return null;
    const offer = cacheEntry.offerData || {};
    const productCodeTag = cacheEntry.tags?.find(({ id }) => id?.startsWith('mas:product_code/'));
    const productCodeFromTag = productCodeTag?.title || productCodeTag?.id?.split('/').pop();
    const snapshot = sanitizePromotionOfferCacheSnapshot({
        product_code: offer.product_code ?? productCodeFromTag,
        product_name: productCodeTag?.title,
        offer_type: offer.offer_type,
        plan_type: offer.planType ?? offer.plan_type,
        customer_segment: offer.customer_segment,
        market_segment: Array.isArray(offer.market_segments)
            ? offer.market_segments[0]
            : (offer.market_segments ?? offer.market_segment),
        product_arrangement_code: offer.product_arrangement_code ?? offer.productArrangementCode,
        icon: cacheEntry.getFieldValue?.('mnemonicIcon') ?? offer.icon ?? offer.productIcon,
        offer_id: offer.offerId ?? offer.offer_id ?? cacheEntry.path ?? cacheEntry.id,
    });
    return snapshot;
}

/**
 * @param {string} offerSelectorId
 * @param {Record<string, string>} snapshot
 * @returns {string}
 */
export function serializePromotionOfferCacheLine(offerSelectorId, snapshot) {
    const safeSnapshot = sanitizePromotionOfferCacheSnapshot(snapshot);
    if (!offerSelectorId || !safeSnapshot) return '';
    const payload = encodeURIComponent(JSON.stringify({ id: offerSelectorId, ...safeSnapshot }));
    return `${PROMOTION_OFFER_CACHE_PREFIX}::${payload}`;
}

/**
 * @param {unknown[]} values
 * @returns {Map<string, Record<string, string>>}
 */
export function parsePromotionOfferCacheLines(values) {
    const cacheById = new Map();
    if (!Array.isArray(values)) return cacheById;
    for (const entry of values) {
        if (!isPromotionOfferCacheEntry(entry)) continue;
        const payloadPrefix = `${PROMOTION_OFFER_CACHE_PREFIX}::`;
        if (!entry.startsWith(payloadPrefix)) continue;
        const payload = entry.slice(payloadPrefix.length);
        try {
            const parsed = JSON.parse(decodeURIComponent(payload));
            const offerSelectorId = parsed?.id;
            const rest = { ...(parsed || {}) };
            delete rest.id;
            const snapshot = sanitizePromotionOfferCacheSnapshot(rest);
            if (offerSelectorId && snapshot) cacheById.set(String(offerSelectorId), snapshot);
        } catch {
            /* ignore malformed cache lines */
        }
    }
    return cacheById;
}

/**
 * @param {string} offerSelectorId
 * @param {Record<string, string>|null|undefined} snapshot
 * @returns {object}
 */
export function buildPromotionOfferCacheEntryFromSnapshot(offerSelectorId, snapshot) {
    const safeSnapshot = sanitizePromotionOfferCacheSnapshot(snapshot);
    if (!safeSnapshot) return buildPromotionOfferCacheEntry(offerSelectorId, null, null);
    const offer = {
        product_code: safeSnapshot.product_code ?? safeSnapshot.product_name,
        offer_type: safeSnapshot.offer_type,
        plan_type: safeSnapshot.plan_type,
        planType: safeSnapshot.plan_type,
        customer_segment: safeSnapshot.customer_segment,
        market_segments: safeSnapshot.market_segment,
        market_segment: safeSnapshot.market_segment,
        offer_id: safeSnapshot.offer_id ?? offerSelectorId,
        icon: safeSnapshot.icon,
    };
    return buildPromotionOfferCacheEntry(offerSelectorId, offer, safeSnapshot.product_arrangement_code);
}

export function promotionOfferCacheEntryHasDisplayName(cacheEntry) {
    if (!cacheEntry) return false;
    const tag = cacheEntry.tags?.find(({ id }) => id?.startsWith('mas:product_code/'));
    return Boolean(tag?.title && tag.title !== tag.id?.split('/').pop());
}

export function parsePromotionOffersField(values) {
    const promoExceptions = new Map();
    const offerSubstitutions = new Map();
    if (!Array.isArray(values)) return { promoExceptions, offerSubstitutions };
    for (const entry of values) {
        if (!entry) continue;
        if (isPromotionOfferCacheEntry(entry)) continue;
        if (isPromotionOfferSubstitutionEntry(entry)) {
            const parts = entry.split(':');
            if (parts.length < 4) continue;
            const [, baseOfferId, substituteSelectorId, country] = parts;
            if (baseOfferId && substituteSelectorId && country) {
                offerSubstitutions.set(`${baseOfferId}|${country}`, substituteSelectorId);
            }
            continue;
        }
        const parts = entry.split(':');
        if (parts.length < 3) continue;
        const [offerId, promoCode, country] = parts;
        if (!offerId || !promoCode || !country) continue;
        promoExceptions.set(`${offerId}|${country}`, promoCode);
    }
    return { promoExceptions, offerSubstitutions };
}

export function parsePromoCodeExceptions(values) {
    return parsePromotionOffersField(values).promoExceptions;
}

export function parseOfferSubstitutions(values) {
    return parsePromotionOffersField(values).offerSubstitutions;
}

export function serializePromoCodeExceptions(map) {
    if (!map?.size) return [];
    return [...map.entries()].map(([key, code]) => {
        const [offerId, country] = key.split('|');
        return `${offerId}:${code}:${country}`;
    });
}

export function serializeOfferSubstitutions(map) {
    if (!map?.size) return [];
    return [...map.entries()].map(([key, substituteSelectorId]) => {
        const [baseOfferId, country] = key.split('|');
        return `${PROMOTION_OFFER_SUBSTITUTION_PREFIX}:${baseOfferId}:${substituteSelectorId}:${country}`;
    });
}

export function parseSelectedOfferIdsFromOffersField(values) {
    if (!Array.isArray(values)) return [];
    return values
        .filter((entry) => entry && !String(entry).includes(':'))
        .map((entry) => String(entry).trim())
        .filter(Boolean);
}

export function serializePromotionOffersField(promoExceptions, offerSubstitutions, selectedOfferIds, cacheLines = []) {
    const selectedLines = Array.isArray(selectedOfferIds) ? selectedOfferIds.filter(Boolean) : [];
    const serializedCacheLines = (cacheLines || []).filter(Boolean);
    return [
        ...selectedLines,
        ...serializedCacheLines,
        ...serializePromoCodeExceptions(promoExceptions),
        ...serializeOfferSubstitutions(offerSubstitutions),
    ];
}

/**
 * @param {{ getFieldValues: (name: string) => unknown[], getField?: (name: string) => unknown }} promotionLike
 * @param {string[]|undefined} selectedOfferIds
 */
export function isPromotionOffersSelectionDirty(promotionLike, selectedOfferIds) {
    if (!promotionLike) return false;
    const offerValues = promotionLike.getField('offers') ? promotionLike.getFieldValues('offers') : [];
    const savedSet = new Set(parseSelectedOfferIdsFromOffersField(offerValues));
    const currentSet = new Set((selectedOfferIds || []).filter(Boolean));
    if (savedSet.size !== currentSet.size) return true;
    for (const id of currentSet) {
        if (!savedSet.has(id)) return true;
    }
    return false;
}

export function upsertPromotionOffersField(fragment, values) {
    if (!fragment?.fields) return false;
    const offerValues = Array.isArray(values) ? values : [];
    const field = fragment.getField('offers');
    if (field) {
        const same = field.values?.length === offerValues.length && field.values.every((v, i) => v === offerValues[i]);
        const metaOk = field.type === 'text' && field.multiple === true;
        Object.assign(field, { type: 'text', multiple: true, values: offerValues });
        return !same || !metaOk;
    }
    if (!offerValues.length) return false;
    fragment.fields.push({ name: 'offers', type: 'text', multiple: true, values: offerValues });
    return true;
}

/**
 * @param {{ fields: Array<{ name: string, type?: string, multiple?: boolean, values?: unknown[] }>, getField: (name: string) => unknown }} fragment
 * @param {string[]} paths
 * @returns {boolean}
 */
export function upsertPromotionFragmentsField(fragment, paths) {
    if (!fragment?.fields) return false;
    const values = [...(paths || [])].filter(Boolean);
    const field = fragment.getField('fragments');
    if (field) {
        const same = field.values?.length === values.length && field.values.every((v, i) => v === values[i]);
        const metaOk = field.type === 'content-fragment' && field.multiple === true;
        Object.assign(field, { type: 'content-fragment', multiple: true, values });
        return !same || !metaOk;
    }
    if (!values.length) return false;
    fragment.fields.push({ name: 'fragments', type: 'content-fragment', multiple: true, values });
    return true;
}

/**
 * @param {{ fields: Array<{ name: string, type?: string, multiple?: boolean, values?: unknown[] }>, getField: (name: string) => unknown, hasChanges?: boolean }} fragment
 * @param {{ selectedCards?: string[], selectedCollections?: string[], selectedOfferIds?: string[] }} selection
 * @returns {boolean}
 */
export function applyPromotionItemSelectionToFragment(
    fragment,
    { selectedCards = [], selectedCollections = [], selectedOfferIds = [], offerDataCache = null } = {},
) {
    if (!fragment?.fields) return false;
    let changed = false;

    const mergedPaths = [...(selectedCards || []), ...(selectedCollections || [])].filter(Boolean);
    if (upsertPromotionFragmentsField(fragment, mergedPaths)) changed = true;

    const colField = fragment.getField('collections');
    if (colField?.values?.length) {
        colField.values = [];
        changed = true;
    }

    const offerValues = buildPromotionOffersFieldValues(fragment, selectedOfferIds, offerDataCache);
    if (upsertPromotionOffersField(fragment, offerValues)) changed = true;

    if (changed) fragment.hasChanges = true;
    return changed;
}

/**
 * @param {{ getFieldValues: (name: string) => unknown[], getField?: (name: string) => unknown }} promotionLike
 * @param {string[]|undefined} selectedOfferIds
 * @param {Map<string, object>|null|undefined} [offerDataCache]
 * @returns {string[]}
 */
export function buildPromotionOffersFieldValues(promotionLike, selectedOfferIds, offerDataCache = null, overrides = {}) {
    const offerValues = promotionLike?.getField('offers') ? promotionLike.getFieldValues('offers') : [];
    const parsed = parsePromotionOffersField(offerValues);
    const promoExceptions = overrides.promoExceptions ?? parsed.promoExceptions;
    const offerSubstitutions = overrides.offerSubstitutions ?? parsed.offerSubstitutions;
    const persistedCache = parsePromotionOfferCacheLines(offerValues);
    const cacheLines = (selectedOfferIds || [])
        .filter(Boolean)
        .map((id) => {
            const snapshot = serializePromotionOfferCacheSnapshot(offerDataCache?.get?.(id)) ?? persistedCache.get(id) ?? null;
            return snapshot ? serializePromotionOfferCacheLine(id, snapshot) : '';
        })
        .filter(Boolean);
    return serializePromotionOffersField(promoExceptions, offerSubstitutions, selectedOfferIds, cacheLines);
}

export function getEffectiveSubstituteOffer(offerSubstitutions, baseOfferId, country) {
    return offerSubstitutions?.get(`${baseOfferId}|${country}`) ?? null;
}

export function groupOfferSubstitutionsForOffer(offerSubstitutions, offerKeys, countries, resolveOfferLabel) {
    if (!offerSubstitutions?.size || !Array.isArray(countries) || !countries.length) return [];
    const keys = Array.isArray(offerKeys) ? offerKeys.filter(Boolean) : [];
    const groups = new Map();

    for (const country of countries) {
        let substituteSelectorId = null;
        for (const key of keys) {
            const candidate = offerSubstitutions.get(`${key}|${country}`);
            if (candidate) {
                substituteSelectorId = candidate;
                break;
            }
        }
        if (!substituteSelectorId) continue;
        const label = resolveOfferLabel?.(substituteSelectorId) ?? substituteSelectorId;
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(country);
    }

    return [...groups.entries()]
        .map(([offerLabel, countryList]) => ({
            offerLabel,
            countries: countryList,
            countriesLabel: countryList.join(', '),
        }))
        .sort((a, b) => a.offerLabel.localeCompare(b.offerLabel));
}

export function getEffectivePromoCode(exceptions, offerId, country, defaultPromoCode) {
    return exceptions?.get(`${offerId}|${country}`) ?? defaultPromoCode;
}

function getEffectivePromoCodeForOfferKeys(exceptions, offerKeys, country, defaultPromoCode) {
    const keys = Array.isArray(offerKeys) ? offerKeys.filter(Boolean) : [];
    for (const key of keys) {
        const code = exceptions?.get(`${key}|${country}`);
        if (code) return code;
    }
    return defaultPromoCode;
}

export function groupCountriesByPromoCodeForOffer(exceptions, offerKeys, countries, defaultPromoCode) {
    if (!Array.isArray(countries) || !countries.length) return [];
    const groups = new Map();

    for (const country of countries) {
        const code = getEffectivePromoCodeForOfferKeys(exceptions, offerKeys, country, defaultPromoCode);
        if (!code) continue;
        if (!groups.has(code)) groups.set(code, []);
        groups.get(code).push(country);
    }

    return [...groups.entries()]
        .map(([promoCode, countryList]) => ({
            promoCode,
            countries: countryList,
            countriesLabel: countryList.join(', '),
        }))
        .sort((a, b) => a.promoCode.localeCompare(b.promoCode));
}

function getDistinctPromoCodesForOffer(exceptions, offerId, countries, defaultPromoCode) {
    if (!offerId) return [];
    const codes = new Set();
    const locales = Array.isArray(countries) && countries.length ? countries : [''];
    for (const country of locales) {
        const code = getEffectivePromoCode(exceptions, offerId, country, defaultPromoCode);
        if (code) codes.add(code);
    }
    return [...codes];
}

export function countDistinctPromoCodesForOffer(exceptions, offerId, countries, defaultPromoCode) {
    const codes = getDistinctPromoCodesForOffer(exceptions, offerId, countries, defaultPromoCode);
    return codes.length;
}

export function groupCountriesByPromoCode(exceptions, offerIds, countries, defaultPromoCode) {
    if (!Array.isArray(countries) || !countries.length) return [];
    const groups = new Map();
    const offers = Array.isArray(offerIds) && offerIds.length ? offerIds : [null];

    for (const country of countries) {
        const codes = new Set(
            offers
                .map((offerId) =>
                    offerId ? getEffectivePromoCode(exceptions, offerId, country, defaultPromoCode) : defaultPromoCode,
                )
                .filter(Boolean),
        );
        const code = codes.size ? [...codes][0] : defaultPromoCode;
        if (!code) continue;
        if (!groups.has(code)) groups.set(code, []);
        groups.get(code).push(country);
    }

    return [...groups.entries()]
        .map(([promoCode, countryList]) => ({
            promoCode,
            countries: countryList,
            countriesLabel: countryList.join(', '),
        }))
        .sort((a, b) => a.promoCode.localeCompare(b.promoCode));
}

const GEO_LOCALE_PREFIXES = ['mas:locale/', '/content/cq:tags/mas/locale/'];
const GEO_PZN_PREFIXES = ['mas:pzn/', '/content/cq:tags/mas/pzn/'];
const GEO_DISPLAY_PREFIXES = [...GEO_LOCALE_PREFIXES, ...GEO_PZN_PREFIXES];
const COUNTRY_SEGMENT_PREFIX = 'country/';

function formatGeoDisplayLabel(raw) {
    if (!raw) return '';
    let label = raw;
    for (const prefix of GEO_DISPLAY_PREFIXES) {
        if (label.startsWith(prefix)) {
            label = label.slice(prefix.length);
            break;
        }
    }
    if (label.startsWith(COUNTRY_SEGMENT_PREFIX)) {
        label = label.slice(COUNTRY_SEGMENT_PREFIX.length);
    }
    if (label.includes('/')) {
        const parts = label.split('/').filter(Boolean);
        label = parts[parts.length - 1] || label;
    }
    return label;
}

export function parseCountriesFromGeos(geoValues) {
    if (!Array.isArray(geoValues) || !geoValues.length) return [];
    const seen = new Set();
    const result = [];
    for (const raw of geoValues) {
        if (!raw) continue;
        const tagId = tagRefToTagId(raw);
        if (tagId?.startsWith('mas:pzn/') && !isPznCountryTagId(tagId)) continue;
        const label = formatGeoDisplayLabel(raw);
        if (!label || seen.has(label)) continue;
        seen.add(label);
        result.push(label);
    }
    return result;
}
