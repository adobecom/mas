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

/**
 * True when the fragment has any mas:pzn tag outside the country subtree (mas:pzn/country/…).
 * @param {{ tags?: { id?: string }[] } | null | undefined} fragment
 */
export function fragmentHasPersonalizationTag(fragment) {
    return (
        fragment?.tags?.some((t) => {
            const id = t.id;
            if (!id?.startsWith(PZN_TAG_ID_PREFIX)) return false;
            if (isPznCountryTagId(id)) return false;
            return true;
        }) ?? false
    );
}
