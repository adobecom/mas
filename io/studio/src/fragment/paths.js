const MAS_ROOT = '/content/dam/mas';

const FRAGMENT_URL_PREFIX = 'https://odin.adobe.com/adobe/sites/fragments';

const FRAGMENT_AUTHOR_URL_PREFIX =
    'https://author-p22655-e59433.adobeaemcloud.com/adobe/sites/cf/fragments';

const PATH_TOKENS =
    /\/content\/dam\/mas\/(?<surface>[\w_-]+)\/(?<parsedLocale>[\w_-]+)\/(?<fragmentPath>.*)/;

/**
 * builds a full fetchable path to the fragment
 * @param {*} id id of the fragment,
 * @returns full fetchable path to the fragment
 */
function odinId(id) {
    return `${FRAGMENT_URL_PREFIX}/${id}`;
}

function odinIdStudio(id) {
    return `${FRAGMENT_AUTHOR_URL_PREFIX}/${id}`;
}

/**
 * builds a full fetchable path to the fragment references
 * @param {*} id id of the fragment,
 * @returns full fetchable path to the fragment references
 */
function odinReferences(id, allHydrated = false) {
    return `${odinId(id)}/variations/master/references${allHydrated ? '?references=all-hydrated' : ''}`;
}

function odinAuthorReferences(surface, locale) {
    return `${FRAGMENT_AUTHOR_URL_PREFIX}/search?query=%7B"filter":%7B"path":"/content/dam/mas/${surface}/${locale}/dictionary"%7D%7D&limit=50`;
}

/**
 * builds a full fetchable path to the fragment
 * @param {*} surface surface of the fragment,
 * @param {*} locale locale of the fragment,
 * @param {*} fragmentPath subpath of the fragment from the locale root
 * @returns full fetchable path to the fragment
 */
function odinPath(surface, locale, fragmentPath) {
    return `${FRAGMENT_URL_PREFIX}?path=${MAS_ROOT}/${surface}/${locale}/${fragmentPath}`;
}

function odinPathAuthor(surface, locale, fragmentPath) {
    return `${FRAGMENT_AUTHOR_URL_PREFIX}?path=${MAS_ROOT}/${surface}/${locale}/${fragmentPath}`;
}

module.exports = {
    PATH_TOKENS,
    FRAGMENT_URL_PREFIX,
    FRAGMENT_AUTHOR_URL_PREFIX,
    MAS_ROOT,
    odinPathAuthor,
    odinPath,
    odinIdStudio,
    odinReferences,
    odinAuthorReferences,
};
