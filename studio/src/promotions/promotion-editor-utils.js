import { COLLECTION_MODEL_PATH, ROOT_PATH, TAG_PROMOTION_PREFIX } from '../constants.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { isUUID, parseStudioDeepLinksFromText } from '../utils.js';

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
 * Paths in `hydrateUnreachablePaths` were omitted from selection after a failed fetch during hydrate.
 * @param {{ getFieldValues: (name: string) => unknown[], getField?: (name: string) => unknown }} promotionLike
 * @param {string[]|undefined} selectedCards
 * @param {string[]|undefined} selectedCollections
 * @param {string[]|undefined} [hydrateUnreachablePaths]
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
 * @returns {Promise<{ cards: string[], cols: string[], unreachable: string[] }>}
 */
export async function classifyPromotionPathsForSelection(
    allPaths,
    getFragmentByPath,
    collectionModelPath = COLLECTION_MODEL_PATH,
) {
    if (!allPaths.length) {
        return { cards: [], cols: [], unreachable: [] };
    }
    const results = await Promise.allSettled(allPaths.map((path) => getFragmentByPath(path)));
    const cards = [];
    const cols = [];
    const unreachable = [];
    results.forEach((result, i) => {
        const path = allPaths[i];
        if (result.status !== 'fulfilled') {
            unreachable.push(path);
            return;
        }
        const modelPath = result.value?.model?.path;
        if (!modelPath) {
            unreachable.push(path);
            return;
        }
        if (modelPath === collectionModelPath) cols.push(path);
        else cards.push(path);
    });
    return { cards, cols, unreachable };
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
