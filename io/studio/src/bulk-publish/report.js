const { fetchOdin, getValue, processBatchWithConcurrency } = require('../common.js');
const { readProjectFragment, getProjectPaths, getProjectLocales } = require('./project.js');
const { resolvePaths } = require('./resolver.js');
const { extractLocale } = require('./publish-core.js');

const REPORT_STATUS = { LIVE: 'live', NOT_LIVE: 'not-live', FAILED: 'failed' };
const ROW_TYPE = { ITEM: 'item', PLACEHOLDER: 'placeholder', DICTIONARY_INDEX: 'dictionary-index' };

const REPORT_CONCURRENCY = 5;
const REPORT_RPS_LIMIT = 5;

const DICTIONARY_SEGMENT = '/dictionary/';
const INDEX_SUFFIX = `${DICTIONARY_SEGMENT}index`;

// Same field and view io/www reads to build the live dictionary (replace.js: fields.entries of the
// `references=direct-hydrated` response, each reference being { value: { path, fields } }).
const INDEX_ENTRIES_FIELD = 'entries';
const PUBLISHED_FRAGMENT_URL = 'https://odin.adobe.com/adobe/contentFragments';
const DIRECT_HYDRATED = 'direct-hydrated';

const LIVE_AEM_STATUSES = new Set(['PUBLISHED', 'MODIFIED']);
const NOT_LIVE_AEM_STATUSES = new Set(['DRAFT', 'NEW', 'UNPUBLISHED']);

const CHECK = { OK: 'ok', NOT_FOUND: 'not-found', ERROR: 'error' };

async function checkFragment(path, { odinEndpoint, authToken }) {
    try {
        const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments?path=${path}`, authToken, {
            ignoreErrors: [404],
            max429Retries: 1,
        });
        if (response.status === 404) return { state: CHECK.NOT_FOUND };
        const fragment = (await response.json()).items?.[0];
        return fragment ? { state: CHECK.OK, fragment } : { state: CHECK.NOT_FOUND };
    } catch (error) {
        return { state: CHECK.ERROR, message: error.message };
    }
}

/**
 * Reads the published `references=direct-hydrated` view of a dictionary index.
 * @param {{ id: string }} indexFragment author fragment of the index
 * @returns {Promise<string[]|null>} paths of the entries that are live, or null when the view cannot be read
 */
async function readPublishedIndexEntries(indexFragment) {
    const response = await fetch(`${PUBLISHED_FRAGMENT_URL}/${indexFragment.id}?references=${DIRECT_HYDRATED}`);
    if (!response.ok) return null;
    const body = await response.json();
    const references = body.references || {};
    const entryIds = body.fields?.[INDEX_ENTRIES_FIELD] || [];
    return entryIds.map((id) => references[id]?.value?.path).filter(Boolean);
}

function indexPathOf(path) {
    const segmentIndex = path.indexOf(DICTIONARY_SEGMENT);
    if (segmentIndex === -1) return null;
    return path.slice(0, segmentIndex) + INDEX_SUFFIX;
}

function rowType(path) {
    if (path.endsWith(INDEX_SUFFIX)) return ROW_TYPE.DICTIONARY_INDEX;
    return path.includes(DICTIONARY_SEGMENT) ? ROW_TYPE.PLACEHOLDER : ROW_TYPE.ITEM;
}

function groupPlaceholdersByIndex(paths) {
    const byIndex = new Map();
    for (const path of paths) {
        if (rowType(path) !== ROW_TYPE.PLACEHOLDER) continue;
        const indexPath = indexPathOf(path);
        if (!byIndex.has(indexPath)) byIndex.set(indexPath, []);
        byIndex.get(indexPath).push(path);
    }
    return byIndex;
}

function statusFromAem(check) {
    if (check.state === CHECK.NOT_FOUND) return { status: REPORT_STATUS.FAILED, reason: 'not-found' };
    if (check.state === CHECK.ERROR) return { status: REPORT_STATUS.FAILED, reason: 'check-failed' };
    const aemStatus = check.fragment.status;
    if (LIVE_AEM_STATUSES.has(aemStatus)) return { status: REPORT_STATUS.LIVE, reason: '' };
    if (NOT_LIVE_AEM_STATUSES.has(aemStatus)) return { status: REPORT_STATUS.NOT_LIVE, reason: 'never-published' };
    return { status: REPORT_STATUS.FAILED, reason: 'unknown-status' };
}

async function judgeIndex(check, placeholderPaths, readEntries) {
    const verdict = statusFromAem(check);
    if (verdict.status !== REPORT_STATUS.LIVE) {
        return check.state === CHECK.NOT_FOUND ? { ...verdict, reason: 'index-missing' } : verdict;
    }
    const liveEntries = await readEntries(check.fragment);
    if (!liveEntries) return { status: REPORT_STATUS.FAILED, reason: 'published-index-unreadable' };
    const live = new Set(liveEntries);
    const missing = placeholderPaths.filter((path) => !live.has(path));
    if (missing.length) return { status: REPORT_STATUS.FAILED, reason: 'index-lacks-placeholders' };
    return verdict;
}

function isLaterThan(date, reference) {
    return Boolean(date && reference) && new Date(date).getTime() > new Date(reference).getTime();
}

function parseReportedResult(project) {
    try {
        return JSON.parse(getValue(project, 'lastResult')?.value || '{}');
    } catch {
        return {};
    }
}

/**
 * Builds a point-in-time report of the live state of every item of a bulk publish project.
 * Each row is verified with a fresh read in AEM; the publish workflow answer (lastResult) is never
 * used to decide a status. Read-only: nothing is written to AEM.
 * @param {object} input
 * @param {string} input.projectId project content fragment id
 * @param {string} input.odinEndpoint AEM author endpoint
 * @param {string} input.authToken bearer token
 * @param {object} [input.deps] injectable collaborators (tests)
 * @returns {Promise<object>} report with summary, missingIndexes, rows and errors
 */
async function generateReport({ projectId, odinEndpoint, authToken, deps = {} }) {
    const readProject = deps.readProjectFragment || readProjectFragment;
    const check = deps.checkFragment || ((path) => checkFragment(path, { odinEndpoint, authToken }));
    const readEntries = deps.readPublishedIndexEntries || readPublishedIndexEntries;

    const { fragment: project } = await readProject(odinEndpoint, projectId, authToken);
    const projectPublishedAt = getValue(project, 'publishedAt')?.value || '';
    const reported = parseReportedResult(project);

    const itemPaths = resolvePaths(getProjectPaths(project), getProjectLocales(project));
    const placeholdersByIndex = groupPlaceholdersByIndex(itemPaths);
    const paths = [...new Set([...itemPaths, ...placeholdersByIndex.keys()])].sort();

    const checks = await processBatchWithConcurrency(paths, REPORT_CONCURRENCY, check, REPORT_RPS_LIMIT);
    const checkByPath = new Map(paths.map((path, i) => [path, checks[i]]));

    const missingIndexes = [];
    const errors = [];
    const rows = [];
    for (const path of paths) {
        const result = checkByPath.get(path);
        const type = rowType(path);
        let verdict;
        if (type === ROW_TYPE.DICTIONARY_INDEX) {
            verdict = await judgeIndex(result, placeholdersByIndex.get(path) || [], readEntries);
            if (verdict.reason === 'index-missing') missingIndexes.push(path);
        } else if (type === ROW_TYPE.PLACEHOLDER && checkByPath.get(indexPathOf(path))?.state === CHECK.NOT_FOUND) {
            verdict = { status: REPORT_STATUS.FAILED, reason: 'placeholder-index-missing' };
        } else {
            verdict = statusFromAem(result);
        }
        if (result.state === CHECK.ERROR) errors.push({ path, message: result.message });

        const fragment = result.fragment;
        const modifiedAt = fragment?.modified?.at || '';
        // Author fragment JSON exposes the last activation as `published.at`.
        const publishedAt = fragment?.published?.at || '';
        rows.push({
            path,
            id: fragment?.id || '',
            type,
            locale: extractLocale(path),
            status: verdict.status,
            reason: verdict.reason,
            aemStatus: fragment?.status || '',
            modifiedAt,
            publishedAt,
            projectPublishedAt,
            modifiedAfterPublish: isLaterThan(modifiedAt, publishedAt || projectPublishedAt),
        });
    }

    const count = (status) => rows.filter((row) => row.status === status).length;
    return {
        projectId,
        generatedAt: new Date().toISOString(),
        projectPublishedAt,
        summary: {
            total: rows.length,
            live: count(REPORT_STATUS.LIVE),
            failed: count(REPORT_STATUS.FAILED),
            notLive: count(REPORT_STATUS.NOT_LIVE),
            reportedPublished: reported.published ?? null,
            reportedTotal: reported.total ?? null,
        },
        missingIndexes,
        rows,
        errors,
    };
}

module.exports = { generateReport, REPORT_STATUS };
