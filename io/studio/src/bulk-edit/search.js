const { fetchOdin, getValues, CARD_MODEL_ID, COLLECTION_MODEL_ID } = require('../common.js');

const BULK_EDIT_USER_AGENT = 'mas-bulk-edit';

const BULK_EDIT_MODEL_IDS = [CARD_MODEL_ID, COLLECTION_MODEL_ID];

function matchesText(value, find, matchCase) {
    if (value == null) return false;
    const haystack = String(value);
    if (matchCase) return haystack.includes(find);
    return haystack.toLowerCase().includes(find.toLowerCase());
}

const PATH_LOCALE = /\/content\/dam\/mas\/[\w-]+\/(?<locale>[\w-]+)\//;

function extractLocale(path = '') {
    return path.match(PATH_LOCALE)?.groups?.locale ?? null;
}

const SCOPE_FIELDS = {
    prices: { fields: ['prices'] },
    ctas: { fields: ['ctas'] },
    calloutText: { fields: ['callout'] },
    productDescription: { fields: ['cardTitle', 'description', 'features', 'compareChart', 'shortDescription'] },
    promoText: { fields: ['promoText', 'promoCode'] },
    subtitle: { fields: ['subtitle'] },
    fragmentDescription: { properties: ['description'] },
    fragmentTitle: { properties: ['title'] },
    tags: { tags: true },
};

const VALID_SEARCH_SCOPES = [...Object.keys(SCOPE_FIELDS), '*'];

function invalidSearchScopes(searchIn) {
    if (searchIn == null || searchIn === '') return [];
    const list = Array.isArray(searchIn) ? searchIn : [searchIn];
    return list.filter(Boolean).filter((scope) => !VALID_SEARCH_SCOPES.includes(scope));
}

function tagToString(tag) {
    if (typeof tag === 'string') return tag;
    return tag?.id || tag?.title || '';
}

function matchTags(fragment, find, matchCase) {
    const values = getValues(fragment, 'tags')?.values ?? fragment.tags ?? [];
    return values
        .map(tagToString)
        .filter((t) => matchesText(t, find, matchCase))
        .map((t) => ({ field: 'tags', value: t }));
}

function matchEverywhere(fragment, find, matchCase) {
    const matches = [];
    for (const scope of Object.keys(SCOPE_FIELDS)) {
        matches.push(...findMatchesInScope(fragment, scope, find, matchCase));
    }
    return matches;
}

function findMatchesInScope(fragment, searchIn, find, matchCase) {
    const scope = SCOPE_FIELDS[searchIn];
    if (!scope) return [];
    if (scope.tags) return matchTags(fragment, find, matchCase);

    const matches = [];
    for (const name of scope.fields || []) {
        const values = getValues(fragment, name)?.values ?? [];
        for (const value of values) {
            if (matchesText(value, find, matchCase)) {
                matches.push({ field: name, value });
                break;
            }
        }
    }
    for (const name of scope.properties || []) {
        if (matchesText(fragment[name], find, matchCase)) {
            matches.push({ field: searchIn, value: fragment[name] });
        }
    }
    return matches;
}

function normalizeSearchIn(searchIn) {
    if (searchIn == null || searchIn === '' || searchIn === '*') return ['*'];
    const list = Array.isArray(searchIn) ? searchIn : [searchIn];
    const scopes = list.filter(Boolean);
    if (!scopes.length || scopes.includes('*')) return ['*'];
    return scopes;
}

function findMatches(fragment, searchIn, find, matchCase) {
    const scopes = normalizeSearchIn(searchIn);
    if (scopes.includes('*')) return matchEverywhere(fragment, find, matchCase);

    const matches = [];
    for (const scope of scopes) {
        matches.push(...findMatchesInScope(fragment, scope, find, matchCase));
    }
    return matches;
}

function normalizeLocales(locale) {
    if (locale == null || locale === '' || locale === '*') return null;
    const list = Array.isArray(locale) ? locale : [locale];
    const locales = [...new Set(list.filter(Boolean))].sort();
    if (!locales.length || locales.includes('*')) return null;
    return locales;
}

function buildSearchPaths(surface, locale) {
    const locales = normalizeLocales(locale);
    if (!locales) return [`/content/dam/mas/${surface}`];
    return locales.map((loc) => `/content/dam/mas/${surface}/${loc}`);
}

const DEFAULT_SORT = [{ on: 'created', order: 'ASC' }];

function buildSearchQuery({ path, tags = [], status, find }) {
    const filter = { path, modelIds: BULK_EDIT_MODEL_IDS };
    if (find) filter.fullText = { text: find, queryMode: 'EDGES' };
    if (tags.length) filter.tags = tags;
    if (status?.length) filter.status = Array.isArray(status) ? status : [status];
    return { sort: DEFAULT_SORT, filter };
}

async function* searchPages({ odinEndpoint, authToken, query, limit = 50 }) {
    let cursor;
    do {
        const params = { query: JSON.stringify(query), limit: String(limit) };
        if (cursor) params.cursor = cursor;
        const qs = new URLSearchParams(params).toString();
        const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/search?${qs}`, authToken, {
            userAgent: BULK_EDIT_USER_AGENT,
        });
        const { items = [], cursor: next } = await response.json();
        yield items;
        cursor = next;
    } while (cursor);
}

module.exports = {
    CARD_MODEL_ID,
    COLLECTION_MODEL_ID,
    BULK_EDIT_MODEL_IDS,
    BULK_EDIT_USER_AGENT,
    matchesText,
    extractLocale,
    SCOPE_FIELDS,
    VALID_SEARCH_SCOPES,
    invalidSearchScopes,
    normalizeSearchIn,
    normalizeLocales,
    findMatchesInScope,
    findMatches,
    buildSearchPaths,
    buildSearchQuery,
    searchPages,
};
