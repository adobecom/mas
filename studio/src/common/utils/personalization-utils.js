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

/** CF field names whose values are tag ids merged with fragment metadata `tags` for PZN checks. Not tagFilters — sidenav-only. */
const PERSONALIZATION_FIELD_NAMES = ['pznTags', 'tags'];

/**
 * Non-country `mas:pzn/…` tag ids (metadata `tags` plus CF `pznTags` and `tags`). Same basis as fragmentHasPersonalizationTag; used for PZN checkbox OR-matching in mas-content.
 *
 * @param {{ tags?: ({ id?: string, path?: string } | string)[], fields?: { name?: string, values?: string[] }[], getFieldValues?: (name: string) => string[] } | null | undefined} fragment
 * @returns {Set<string>}
 */
export function getFragmentNonCountryPznTagIds(fragment) {
    const ids = new Set();
    if (!fragment) return ids;
    const add = (ref) => {
        const id = tagRefToTagId(ref);
        if (id && isNonCountryPznTagId(id)) ids.add(id);
    };
    for (const t of fragment.tags || []) add(t);
    for (const fieldName of PERSONALIZATION_FIELD_NAMES) {
        let fieldTagRefs;
        if (typeof fragment.getFieldValues === 'function') {
            const fieldValues = fragment.getFieldValues(fieldName);
            fieldTagRefs = Array.isArray(fieldValues) ? fieldValues : [];
        } else {
            const field = (fragment.fields || []).find((f) => f?.name === fieldName);
            fieldTagRefs = Array.isArray(field?.values) ? field.values : [];
        }
        for (const ref of fieldTagRefs) add(ref);
    }
    return ids;
}

/**
 * True when the fragment has any mas:pzn tag outside the country subtree (mas:pzn/country/…).
 * Drives **hide vs show** for the Studio personalization toggle (hide when toggle is off, for non-country PZN).
 * Country PZN alone does not count; **country + non-country** still counts (country tags do not cancel non-country PZN).
 * Checks AEM fragment metadata `tags` and CF fields `pznTags` and `tags` (not tagFilters).
 *
 * @param {{ tags?: ({ id?: string, path?: string } | string)[], fields?: { name?: string, values?: string[] }[], getFieldValues?: (name: string) => string[] } | null | undefined} fragment
 */
export function fragmentHasPersonalizationTag(fragment) {
    return getFragmentNonCountryPznTagIds(fragment).size > 0;
}
