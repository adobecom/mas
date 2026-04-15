const MAS_ROOT = '/content/dam/mas';

const FRAGMENT_URL_PREFIX = 'https://odin.adobe.com/adobe/sites/fragments';

const FREYJA_ENV_IDS = {
    qa: 'e155390',
    stage: 'e59471',
    prod: 'e59433',
};

function freyjaUrl(env) {
    const id = FREYJA_ENV_IDS[env] ?? FREYJA_ENV_IDS.prod;
    return `https://preview-p22655-${id}.adobeaemcloud.com/adobe/contentFragments`;
}

const FREYJA_PREVIEW_URL = freyjaUrl('prod');

const ODIN_PREVIEW_URL = 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments';

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
    if (!locale) return `${rootURL(preview)}?path=${MAS_ROOT}/${surface}/${fragmentPath}`;
    return `${rootURL(preview)}?path=${MAS_ROOT}/${surface}/${locale}/${fragmentPath}`;
}

export {
    PATH_TOKENS,
    FRAGMENT_URL_PREFIX,
    FREYJA_PREVIEW_URL,
    ODIN_PREVIEW_URL,
    MAS_ROOT,
    odinUrl,
    odinId,
    odinReferences,
    freyjaUrl,
};
