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
 * Derives an Odin fragment id from its DAM path. Odin ids are the base64url encoding of the path
 * (e.g. `/conf/mas/settings/dam/cfm/models/card` → `L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ`),
 * so GraphQL `_path` values can be resolved by id without returning the id in the payload.
 * @param {string} path DAM path of the fragment
 * @returns {string} base64url fragment id (no padding), consumable by {@link odinId}/{@link odinReferences}
 */
function odinIdFromPath(path) {
    return btoa(path).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * builds a full fetchable url
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

/** Odin GraphQL persisted-query root, relative to the fragments API origin. */
const PERSISTED_QUERIES_PATH = '/graphql/execute.json/mas';

/**
 * Builds the URL of the `mas/promo-by-surface` persisted query for a given surface.
 * Reuses the same origin as the fragments API (`rootURL`), so it targets
 * odin.adobe.com for published requests and the preview origin for preview ones.
 * The surface is passed as a matrix parameter (`;surface=<surface>`), matching the
 * persisted-query invocation format:
 *   https://odin.adobe.com/graphql/execute.json/mas/promo-by-surface;surface=acom
 * @param {string} surface surface identifier (e.g. 'acom')
 * @param {*} preview preview object if to be used
 * @returns full fetchable URL to the persisted query
 */
function promoBySurfaceUrl(surface, preview) {
    const { origin } = new URL(rootURL(preview));
    return `${origin}${PERSISTED_QUERIES_PATH}/promo-by-surface;surface=${surface}`;
}

export { PATH_TOKENS, FRAGMENT_URL_PREFIX, MAS_ROOT, odinUrl, odinId, odinIdFromPath, odinReferences, promoBySurfaceUrl };
