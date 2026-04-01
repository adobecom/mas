import { PZN_COUNTRY_TAG_PATH_PREFIX, PZN_FOLDER } from '../../constants.js';

/**
 * @param {string} [cqPath] - AEM tag path e.g. /content/cq:tags/mas/pzn/country/fr_FR
 */
export function isPznCountryTagPath(cqPath) {
    if (!cqPath) return false;
    return cqPath === PZN_COUNTRY_TAG_PATH_PREFIX || cqPath.startsWith(`${PZN_COUNTRY_TAG_PATH_PREFIX}/`);
}

/**
 * @param {string} [tagId] - AEM tag id e.g. mas:pzn/country/fr_FR
 */
export function isPznCountryTagId(tagId) {
    if (!tagId) return false;
    const prefix = `mas:${PZN_FOLDER}/country`;
    return tagId === prefix || tagId.startsWith(`${prefix}/`);
}

/** AEM tag id prefix for the pzn namespace (excluding country — see isPznCountryTagId). */
export const PZN_TAG_ID_PREFIX = `mas:${PZN_FOLDER}/`;

/** Strip /content/cq:tags/mas/ prefix and build mas:… tag id. */
function cqTagPathToTagId(cqPath) {
    if (!cqPath || typeof cqPath !== 'string') return undefined;
    const rel = cqPath.replace(/^\/content\/cq:tags\/mas\/?/, '').replace(/^\//, '');
    return rel ? `mas:${rel}` : undefined;
}

/**
 * Resolve tag id from AEM tag object ({ id }) or CQ path ({ path }), or a raw mas:… / path string.
 * @param {{ id?: string, path?: string } | string | null | undefined} ref
 */
export function tagRefToTagId(ref) {
    if (ref == null) return undefined;
    if (typeof ref === 'string') {
        if (ref.startsWith('/content/cq:tags/mas/')) return cqTagPathToTagId(ref);
        return ref;
    }
    if (typeof ref.id === 'string' && ref.id) return ref.id;
    if (typeof ref.path === 'string' && ref.path) return cqTagPathToTagId(ref.path);
    return undefined;
}

/**
 * @param {string} [tagId]
 */
function isNonCountryPznTagId(tagId) {
    if (!tagId || typeof tagId !== 'string') return false;
    if (!tagId.startsWith(PZN_TAG_ID_PREFIX)) return false;
    return !isPznCountryTagId(tagId);
}

/** CF fields that may hold mas:… tag id strings (cards: pznTags; collections: tagFilters; generic: tags). */
const PERSONALIZATION_TAG_FIELD_NAMES = ['pznTags', 'tags', 'tagFilters'];

/**
 * @param {unknown} value - mas:… id or /content/cq:tags/mas/… path
 */
function fieldValueHasNonCountryPzn(value) {
    if (typeof value !== 'string' || !value) return false;
    const id = tagRefToTagId(value);
    return typeof id === 'string' && isNonCountryPznTagId(id);
}

/**
 * @param {{ fields?: { name?: string, values?: string[] }[], getFieldValues?: (name: string) => string[] } | null | undefined} fragment
 */
function fragmentFieldsHaveNonCountryPzn(fragment) {
    const valuesHavePzn = (values) => Array.isArray(values) && values.some((v) => fieldValueHasNonCountryPzn(v));

    if (typeof fragment.getFieldValues === 'function') {
        return PERSONALIZATION_TAG_FIELD_NAMES.some((name) => valuesHavePzn(fragment.getFieldValues(name)));
    }

    for (const field of fragment.fields || []) {
        if (field?.name && PERSONALIZATION_TAG_FIELD_NAMES.includes(field.name) && valuesHavePzn(field.values)) {
            return true;
        }
    }
    return false;
}

/**
 * True when the fragment has any mas:pzn tag outside the country subtree (mas:pzn/country/…).
 * Drives **hide vs show** for the Studio personalization toggle (hide when toggle is off, for non-country PZN).
 * Country PZN alone does not count; **country + non-country** still counts (country tags do not cancel non-country PZN).
 * Uses AEM fragment `tags` (id or path) plus CF fields (`pznTags`, `tags`, `tagFilters`).
 *
 * @param {{ tags?: ({ id?: string, path?: string } | string)[], fields?: { name?: string, values?: string[] }[], getFieldValues?: (name: string) => string[] } | null | undefined} fragment
 */
export function fragmentHasPersonalizationTag(fragment) {
    if (!fragment) return false;
    if (fragment.tags?.some((t) => isNonCountryPznTagId(tagRefToTagId(t)))) return true;
    if (fragmentFieldsHaveNonCountryPzn(fragment)) return true;
    return false;
}
