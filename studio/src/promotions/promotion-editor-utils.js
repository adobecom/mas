import { COLLECTION_MODEL_PATH } from '../constants.js';

/**
 * True when fragments + collections saved on the promotion differ from selected cards/collections in store.
 * @param {{ getFieldValues: (name: string) => unknown[], getField?: (name: string) => unknown }} promotionLike
 * @param {string[]|undefined} selectedCards
 * @param {string[]|undefined} selectedCollections
 */
export function isPromotionItemSelectionDirty(promotionLike, selectedCards, selectedCollections) {
    if (!promotionLike) return false;
    const fragPaths = promotionLike.getFieldValues('fragments');
    const colPaths = promotionLike.getField('collections') ? promotionLike.getFieldValues('collections') : [];
    const savedMerged = [...new Set([...fragPaths, ...colPaths])].sort().join('\0');
    const currentMerged = [...new Set([...(selectedCards || []), ...(selectedCollections || [])])].sort().join('\0');
    return savedMerged !== currentMerged;
}

const REQUIRED_PROMOTION_FIELDS = ['title', 'startDate', 'endDate'];

export function serializePromotionSurfacesForAem(values) {
    if (!Array.isArray(values) || !values.length) return [];
    const tokens = values.flatMap((v) =>
        String(v)
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean),
    );
    const uniq = [...new Set(tokens)];
    return uniq.length ? [uniq.join(',')] : [];
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
        if (result.status === 'fulfilled') {
            const modelPath = result.value?.model?.path;
            if (modelPath === collectionModelPath) cols.push(path);
            else cards.push(path);
        } else {
            cards.push(path);
        }
    });
    return { cards, cols };
}

export function isPromotionRequiredFieldsValid(fragment, itemCount) {
    if (!REQUIRED_PROMOTION_FIELDS.every((field) => fragment.getFieldValue(field))) {
        return false;
    }
    const geos = fragment.getFieldValues('geos');
    if (!geos.length) {
        return false;
    }
    return itemCount > 0;
}
