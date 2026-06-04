import { COLLECTION_MODEL_PATH, PATH_TOKENS, PROMOTIONS_PATH_PREFIX, ROOT_PATH, TAG_PROMOTION_PREFIX } from '../constants.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';

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
 * True when a default fragment path can have probed promo variation copies (MAS DAM card paths only).
 * @param {{ path?: string, model?: { path?: string } }} fragmentData
 * @returns {boolean}
 */
export function canProbePromoVariationsForFragment(fragmentData) {
    if (!fragmentData?.path || isPromoVariationPath(fragmentData.path)) return false;
    if (fragmentData.model?.path === COLLECTION_MODEL_PATH) return false;
    return !!PATH_TOKENS.exec(fragmentData.path);
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
    if (!name.length || !isSafePromoFolderName(name)) return null;
    return name;
}

/**
 * Rejects path traversal or absolute segments in promo folder names (from mas:promotion/ tags).
 * @param {string} promoName
 * @returns {boolean}
 */
export function isSafePromoFolderName(promoName) {
    if (!promoName || promoName.startsWith('/') || promoName.includes('\\')) return false;
    const segments = promoName.split('/');
    return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

/**
 * @param {string} promotionTagId
 * @param {Array<Object>} [promotionProjects]
 * @returns {string|null}
 */
export function findPromotionProjectIdByTag(promotionTagId, promotionProjects = []) {
    const normalized = normalizeTagId(promotionTagId);
    if (!normalized) return null;
    for (const project of promotionProjects) {
        if (getPromotionTagFromFragment(project) === normalized) return project.id ?? null;
    }
    return null;
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
 * Extracts promo folder name from a promo variation DAM path (first segment under promotions/).
 * When a mas:promotion/ tag is available, callers should use getPromoNameFromTag instead.
 * @param {string} promoPath
 * @returns {string|null}
 */
export function getPromoNameFromPromoVariationPath(promoPath) {
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

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isFragmentNotFoundError(error) {
    const status = error?.status ?? error?.response?.status;
    if (status === 404) return true;
    const message = error?.message?.toLowerCase() ?? '';
    return message.includes('404') || message.includes('not found');
}

/**
 * @param {{ getByPath: (path: string) => Promise<unknown> }} fragmentsApi
 * @param {string} path
 * @returns {Promise<object|null>}
 */
export async function getFragmentByPathOrNull(fragmentsApi, path) {
    try {
        return (await fragmentsApi.getByPath(path)) ?? null;
    } catch (error) {
        if (isFragmentNotFoundError(error)) return null;
        throw error;
    }
}
