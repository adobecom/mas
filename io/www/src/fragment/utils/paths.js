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

// Reference hydration modes accepted by `odinReferences`, mapped to the Odin `?references=` query value.
// `ALL` recurses the whole reference graph; `DIRECT` hydrates only direct references (one level, parent shallow).
const REFERENCES = { ALL: 'all-hydrated', DIRECT: 'direct-hydrated' };

/**
 * builds a full fetchable url
 * @param {*} id id of the fragment,
 * @param {*} preview preview object if to be used
 * @param {typeof REFERENCES[keyof typeof REFERENCES]|undefined} references reference hydration mode
 *   (`REFERENCES.ALL`/`REFERENCES.DIRECT`); omitted skips hydration.
 * @returns full fetchable path to the fragment references
 */
function odinReferences(id, preview, references) {
    return `${odinId(id, preview)}${references ? `?references=${references}` : ''}`;
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

export { PATH_TOKENS, FRAGMENT_URL_PREFIX, MAS_ROOT, REFERENCES, odinUrl, odinId, odinReferences };
