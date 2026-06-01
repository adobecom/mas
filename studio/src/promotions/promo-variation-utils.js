import { PATH_TOKENS, ROOT_PATH, TAG_PROMOTION_PREFIX } from '../constants.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';

const PROMOTIONS_PATH_PREFIX = 'promotions/';

/**
 * True when the DAM path is a promo variation under a surface/locale promotions folder.
 * @param {string} [path]
 * @returns {boolean}
 */
export function isPromoVariationPath(path) {
    if (!path) return false;
    const match = PATH_TOKENS.exec(path);
    if (!match?.groups?.fragmentPath) return false;
    return match.groups.fragmentPath.startsWith(PROMOTIONS_PATH_PREFIX);
}

/**
 * Strips the promotion tag prefix to get the promo folder name (may contain slashes).
 * @param {string} tagId
 * @returns {string|null}
 */
export function getPromoNameFromTag(tagId) {
    const id = normalizeTagId(tagId);
    if (!id.startsWith(TAG_PROMOTION_PREFIX)) return null;
    const name = id.slice(TAG_PROMOTION_PREFIX.length);
    return name.length > 0 ? name : null;
}

/**
 * Builds the DAM path for a promo variation from a default fragment path and promo name.
 * @param {string} defaultPath
 * @param {string} promoName
 * @returns {string|null}
 */
export function buildPromoVariationPath(defaultPath, promoName) {
    if (!defaultPath || !promoName) return null;
    const match = PATH_TOKENS.exec(defaultPath);
    if (!match?.groups) return null;
    const { surface, parsedLocale, fragmentPath } = match.groups;
    if (fragmentPath.startsWith(PROMOTIONS_PATH_PREFIX)) return null;
    return `${ROOT_PATH}/${surface}/${parsedLocale}/${PROMOTIONS_PATH_PREFIX}${promoName}/${fragmentPath}`;
}

/**
 * Builds the promo variation DAM path from a default fragment path and mas:promotion/ tag.
 * @param {string} defaultPath
 * @param {string} promoTagId
 * @returns {string|null}
 */
export function buildPromoVariationPathForTag(defaultPath, promoTagId) {
    const promoName = getPromoNameFromTag(promoTagId);
    if (!promoName) return null;
    return buildPromoVariationPath(defaultPath, promoName);
}

/**
 * Resolves the default fragment path from a promo variation path and promo name.
 * @param {string} promoPath
 * @param {string} promoName
 * @returns {string|null}
 */
export function resolveDefaultPathFromPromoVariation(promoPath, promoName) {
    if (!promoPath || !promoName) return null;
    const match = PATH_TOKENS.exec(promoPath);
    if (!match?.groups?.fragmentPath) return null;
    const { surface, parsedLocale, fragmentPath } = match.groups;
    const prefix = `${PROMOTIONS_PATH_PREFIX}${promoName}/`;
    if (!fragmentPath.startsWith(prefix)) return null;
    const relativePath = fragmentPath.slice(prefix.length);
    if (!relativePath) return null;
    return `${ROOT_PATH}/${surface}/${parsedLocale}/${relativePath}`;
}

/**
 * Returns the first mas:promotion/ tag id from a fragment's tags field or tags array.
 * @param {{ getFieldValues?: (name: string) => unknown[], tags?: Array<{ id?: string }|string> }} fragment
 * @returns {string|null}
 */
export function getPromotionTagFromFragment(fragment) {
    if (!fragment) return null;
    const tagValues = fragment.getFieldValues?.('tags') ?? fragment.tags ?? [];
    for (const tag of tagValues) {
        const id = normalizeTagId(typeof tag === 'string' ? tag : tag?.id);
        if (id.startsWith(TAG_PROMOTION_PREFIX)) return id;
    }
    return null;
}

/**
 * Extracts promo name from a promo variation path using its mas:promotion/ tag when available.
 * @param {string} promoPath
 * @param {string} [promoTagId]
 * @returns {string|null}
 */
export function getPromoNameFromPromoVariationPath(promoPath, promoTagId) {
    const fromTag = promoTagId ? getPromoNameFromTag(promoTagId) : null;
    if (fromTag) return fromTag;
    const match = PATH_TOKENS.exec(promoPath);
    if (!match?.groups?.fragmentPath?.startsWith(PROMOTIONS_PATH_PREFIX)) return null;
    const rest = match.groups.fragmentPath.slice(PROMOTIONS_PATH_PREFIX.length);
    const slashIdx = rest.indexOf('/');
    return slashIdx === -1 ? rest : rest.slice(0, slashIdx);
}

/**
 * True when a fragment is a promo variation by path or mas:promotion/ tag.
 * @param {{ path?: string, tags?: Array<{ id?: string }|string>, getFieldValues?: (name: string) => unknown[] }} fragment
 * @returns {boolean}
 */
export function fragmentIsPromoVariation(fragment) {
    if (!fragment) return false;
    if (isPromoVariationPath(fragment.path)) return true;
    const tagValues = fragment.getFieldValues?.('tags') ?? fragment.tags ?? [];
    for (const tag of tagValues) {
        const id = normalizeTagId(typeof tag === 'string' ? tag : tag?.id);
        if (id.startsWith(TAG_PROMOTION_PREFIX)) return true;
    }
    return false;
}
