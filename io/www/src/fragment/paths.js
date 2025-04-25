const MAS_ROOT = '/content/dam/mas';

const FRAGMENT_URL_PREFIX = 'https://odin.adobe.com/adobe/sites/fragments';

const FRAGMENT_URL_PREFIX_PREVIEW =
    'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments';

const PATH_TOKENS =
    /\/content\/dam\/mas\/(?<surface>[\w-_]+)\/(?<parsedLocale>[\w-_]+)\/(?<fragmentPath>.+)/;

function rootURL(preview) {
    return `${!preview ? FRAGMENT_URL_PREFIX : FRAGMENT_URL_PREFIX_PREVIEW}`;
}

/**
 * builds a full fetchable path to the fragment
 * @param {*} id id of the fragment,
 * @param {*} preview whether to use preview or not
 * @returns full fetchable path to the fragment
 */
function odinId(id, preview = false) {
    return `${rootURL(preview)}/${id}`;
}

/**
 * builds a full fetchable path to the fragment references
 * @param {*} id id of the fragment,
 * @param {boolean} allHydrated whether to fetch all references or not
 * @param {boolean} preview whether to use preview or not
 * @returns full fetchable path to the fragment references
 */
function odinReferences(id, allHydrated = false, preview = false) {
    return `${odinId(id, preview)}${allHydrated ? '?references=all-hydrated' : ''}`;
}

/**
 * builds a full fetchable path to the fragment
 * @param {*} surface surface of the fragment,
 * @param {*} locale locale of the fragment,
 * @param {*} fragmentPath subpath of the fragment from the locale root
 * @param {boolean} preview whether to use preview or not
 * @returns full fetchable path to the fragment
 */
function odinPath(surface, locale, fragmentPath, preview = false) {
    return `${rootURL(preview)}?path=${MAS_ROOT}/${surface}/${locale}/${fragmentPath}`;
}

module.exports = {
    PATH_TOKENS,
    FRAGMENT_URL_PREFIX,
    MAS_ROOT,
    odinPath,
    odinId,
    odinReferences,
};
