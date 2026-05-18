import { COLLECTION_MODEL_PATH } from '../constants.js';

/**
 * @param {{ type?: string, multiple?: boolean }|null|undefined} field
 * @returns {boolean}
 */
export function promotionSurfacesUsesMultilineModel(field) {
    return field?.type === 'long-text' || field?.multiple === true;
}

/**
 * @param {unknown[]} [values]
 * @returns {string}
 */
export function flattenPromotionSurfacesToCsv(values) {
    const raw = Array.isArray(values) ? values : [];
    const parts = [];
    for (const v of raw) {
        if (v == null) continue;
        if (typeof v === 'string') {
            parts.push(
                ...v
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            );
        }
    }
    return [...new Set(parts)].join(',');
}

/**
 * Expands a single CSV string in `field.values` into multiple entries for editor UI (tags / multi-select).
 * @param {{ values?: string[] }|null|undefined} field
 * @returns {boolean} true if `field.values` was updated
 */
export function expandPromotionSurfacesFieldForEditor(field) {
    if (!field?.values?.length || promotionSurfacesUsesMultilineModel(field)) return false;
    const [first] = field.values;
    if (typeof first !== 'string' || !first.includes(',')) return false;
    const split = first
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    field.values = split.length ? split : [];
    return true;
}

/**
 * @param {string} fieldName
 * @param {{ type?: string, multiple?: boolean }|null|undefined} surfField
 * @param {unknown[]} rawValues
 * @returns {{ name: string, type: string, multiple: boolean, values: string[] }|null}
 */
export function buildPromotionSurfacesCreateFieldPayload(fieldName, surfField, rawValues) {
    if (fieldName !== 'surfaces') return null;
    if (promotionSurfacesUsesMultilineModel(surfField)) return null;
    const csv = flattenPromotionSurfacesToCsv(rawValues);
    return { name: fieldName, type: 'text', multiple: false, values: [csv || ''] };
}

/**
 * Splits fragment reference paths into cards vs collections using AEM model path.
 * @param {string[]} paths
 * @param {(path: string) => Promise<{ model?: { path?: string } }|null|undefined>} getFragmentByPath
 * @param {string} [collectionModelPath]
 * @returns {Promise<{ cardPaths: string[], collectionPaths: string[] }>}
 */
export async function partitionPromotionPathsByModel(paths, getFragmentByPath, collectionModelPath = COLLECTION_MODEL_PATH) {
    if (!getFragmentByPath || !paths?.length) {
        return { cardPaths: [...(paths || [])], collectionPaths: [] };
    }
    const settled = await Promise.all(
        paths.map(async (path) => {
            try {
                const data = await getFragmentByPath(path);
                const isCollection = data?.model?.path === collectionModelPath;
                return { path, isCollection };
            } catch {
                return { path, isCollection: false };
            }
        }),
    );
    const cardPaths = [];
    const collectionPaths = [];
    for (const { path, isCollection } of settled) {
        if (isCollection) collectionPaths.push(path);
        else cardPaths.push(path);
    }
    return { cardPaths, collectionPaths };
}
