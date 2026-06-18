const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed } = require('../../utils.js');
const { fetchOdin, getValues } = require('../common.js');

const logger = Core.Logger('find-replace-find', { level: 'info' });

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

async function* searchCandidates({ odinEndpoint, authToken, query, limit = 50 }) {
    let cursor;
    do {
        const params = { query: JSON.stringify(query), limit: String(limit) };
        if (cursor) params.cursor = cursor;
        const qs = new URLSearchParams(params).toString();
        const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/search?${qs}`, authToken);
        const { items = [], cursor: next } = await response.json();
        yield* items;
        cursor = next;
    } while (cursor);
}

async function runFind({
    odinEndpoint,
    authToken,
    surface,
    locale,
    tags,
    status,
    find,
    searchIn = 'everywhere',
    matchCase = false,
    limit,
}) {
    const query = buildSearchQuery({ surface, locale, tags, status, find });
    const items = [];
    for await (const fragment of searchCandidates({ odinEndpoint, authToken, query, limit })) {
        const matches = findMatches(fragment, searchIn, find, matchCase);
        if (matches.length) {
            items.push({
                id: fragment.id,
                path: fragment.path,
                locale: extractLocale(fragment.path),
                title: fragment.title,
                status: fragment.status,
                etag: fragment.etag,
                matches,
            });
        }
    }
    return { items, total: items.length };
}

async function main(params) {
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) {
            return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);
        }

        const missing = checkMissingRequestInputs(params, ['find', 'surface'], ['Authorization']);
        if (missing) return errorResponse(400, missing, logger);

        const authToken = getBearerToken(params);
        if (!(await isAllowed(authToken, params.allowedClientId))) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const { find, surface, searchIn = 'everywhere', matchCase = false, locale, status } = params;
        const tags = Array.isArray(params.tags) ? params.tags : [];

        const result = await runFind({
            odinEndpoint,
            authToken,
            surface,
            locale,
            tags,
            status,
            find,
            searchIn,
            matchCase,
        });
        return { statusCode: 200, body: result };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'find-replace-find-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

module.exports = {
    main,
    matchesText,
    extractLocale,
    SCOPE_FIELDS,
    findMatches,
    buildSearchQuery,
    searchCandidates,
    runFind,
};
exports.main = main;
