const MAS_ROOT = '/content/dam/mas';

const FRAGMENT_URL_PREFIX = 'https://odin.adobe.com/adobe/contentFragments';

const PATH_TOKENS = /\/content\/dam\/mas\/(?<surface>[\w-_]+)\/(?<parsedLocale>[\w-_]+)\/(?<fragmentPath>.+)/;

function rootURL(preview) {
    return `${!preview?.url ? FRAGMENT_URL_PREFIX : preview.url}`;
}

/**
 * builds a full fetchable url to the fragment
 * @param {*} id id of the fragment,
 * @param {*} preview preview object if to be used
 * @returns full fetchable path to the fragment
 */
function odinId(id, preview) {
    return `${rootURL(preview)}/${id}`;
}

/**
 * builds a full fetchable url to the fragment references
 * @param {*} id id of the fragment,
 * @param {boolean} allHydrated whether to fetch all references or not
 * @param {boolean} preview preview object if to be used
 * @returns full fetchable path to the fragment references
 */
function odinReferences(id, allHydrated = false, preview) {
    return `${odinId(id, preview)}${allHydrated ? '?references=all-hydrated' : ''}`;
}

/**
 * builds a full fetchable url to the fragment
 * @param {*} surface surface of the fragment,
 * @param {*} options options
 * @param {*} options.locale locale of the fragment, if any
 * @param {*} otpions.fragmentPath subpath of the fragment from the locale root
 * @param {boolean} options.preview preview object if to be used
 * @returns full fetchable path to the fragment
 */
function odinUrl(surface, { locale, fragmentPath, preview }) {
    const root = fragmentPath ? `${rootURL(preview)}/byPath` : rootURL(preview);
    if (!locale) return `${root}?path=${MAS_ROOT}/${surface}/${fragmentPath}`;
    return `${root}?path=${MAS_ROOT}/${surface}/${locale}/${fragmentPath}`;
}

export { PATH_TOKENS, FRAGMENT_URL_PREFIX, MAS_ROOT, odinUrl, odinId, odinReferences };
