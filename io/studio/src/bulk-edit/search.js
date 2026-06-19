const { fetchOdin, getValues } = require('../common.js');

const CARD_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ';
const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';
const DICTIONARY_ENTRY_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25uYXJ5';

const BULK_EDIT_MODEL_IDS = [CARD_MODEL_ID, COLLECTION_MODEL_ID, DICTIONARY_ENTRY_MODEL_ID];

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
    price: { fields: ['prices'] },
    buttonText: { fields: ['ctas'] },
    calloutText: { fields: ['callout'] },
    productDescription: { fields: ['description'] },
    productText: { fields: ['promoText', 'shortDescription'] },
    subtitle: { fields: ['subtitle'] },
    fragmentDescription: { top: ['description'] },
    tags: { tags: true },
};

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
    for (const field of fragment.fields || []) {
        for (const value of field.values || []) {
            if (matchesText(value, find, matchCase)) {
                matches.push({ field: field.name, value });
                break;
            }
        }
    }
    for (const prop of ['description']) {
        if (matchesText(fragment[prop], find, matchCase)) {
            matches.push({ field: prop, value: fragment[prop] });
        }
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
            if (matchesText(value, find, matchCase)) matches.push({ field: searchIn, value });
        }
    }
    for (const prop of scope.top || []) {
        if (matchesText(fragment[prop], find, matchCase)) {
            matches.push({ field: searchIn, value: fragment[prop] });
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
const DEFAULT_MAX_RETRIES = 3;

function isRetryableFetchError(error) {
    const message = error.message || String(error);
    const statusMatch = message.match(/status (\d{3})/);
    const httpStatus = statusMatch ? Number(statusMatch[1]) : 0;
    return httpStatus === 0 || httpStatus === 429 || httpStatus >= 500;
}

async function fetchSearchPageWithRetry(odinEndpoint, qs, authToken, maxRetries = DEFAULT_MAX_RETRIES) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/search?${qs}`, authToken);
        } catch (error) {
            lastError = error;
            if (!isRetryableFetchError(error) || attempt === maxRetries) throw error;
            const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

function buildSearchQuery({ path, tags = [], status, find }) {
    const filter = { path, modelIds: BULK_EDIT_MODEL_IDS };
    if (find) filter.fullText = { text: find, queryMode: 'EDGES' };
    if (tags.length) filter.tags = tags;
    if (status) filter.status = [status];
    return { sort: DEFAULT_SORT, filter };
}

async function* searchPages({ odinEndpoint, authToken, query, limit = 50, maxRetries = DEFAULT_MAX_RETRIES }) {
    let cursor;
    do {
        const params = { query: JSON.stringify(query), limit: String(limit) };
        if (cursor) params.cursor = cursor;
        const qs = new URLSearchParams(params).toString();
        const response = await fetchSearchPageWithRetry(odinEndpoint, qs, authToken, maxRetries);
        const { items = [], cursor: next } = await response.json();
        yield items;
        cursor = next;
    } while (cursor);
}

module.exports = {
    CARD_MODEL_ID,
    COLLECTION_MODEL_ID,
    DICTIONARY_ENTRY_MODEL_ID,
    BULK_EDIT_MODEL_IDS,
    matchesText,
    extractLocale,
    SCOPE_FIELDS,
    normalizeSearchIn,
    normalizeLocales,
    findMatchesInScope,
    findMatches,
    buildSearchPaths,
    buildSearchQuery,
    searchPages,
};
