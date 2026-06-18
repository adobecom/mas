const { fetchOdin, getValues } = require('../common.js');

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
    fragmentTitle: { top: ['title'] },
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
    for (const prop of ['title', 'description']) {
        if (matchesText(fragment[prop], find, matchCase)) {
            matches.push({ field: prop, value: fragment[prop] });
        }
    }
    return matches;
}

function findMatches(fragment, searchIn, find, matchCase) {
    if (searchIn === 'everywhere') return matchEverywhere(fragment, find, matchCase);

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

const DEFAULT_SORT = [{ on: 'created', order: 'ASC' }];

function buildSearchQuery({ surface, locale, tags = [], status, find }) {
    const path = locale ? `/content/dam/mas/${surface}/${locale}` : `/content/dam/mas/${surface}`;
    const filter = { path };
    if (find) filter.fullText = { text: find, queryMode: 'EDGES' };
    if (tags.length) filter.tags = tags;
    if (status) filter.status = [status];
    return { sort: DEFAULT_SORT, filter };
}

async function* searchPages({ odinEndpoint, authToken, query, limit = 50 }) {
    let cursor;
    do {
        const params = { query: JSON.stringify(query), limit: String(limit) };
        if (cursor) params.cursor = cursor;
        const qs = new URLSearchParams(params).toString();
        const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/search?${qs}`, authToken);
        const { items = [], cursor: next } = await response.json();
        yield items;
        cursor = next;
    } while (cursor);
}

module.exports = {
    matchesText,
    extractLocale,
    SCOPE_FIELDS,
    findMatches,
    buildSearchQuery,
    searchPages,
};
