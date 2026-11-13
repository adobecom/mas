const { fetchFragmentByPath, getValue, processBatchWithConcurrency } = require('../common.js');
const { getProjectPaths, getProjectLocales } = require('./project.js');
const { resolvePaths } = require('./resolver.js');
const { extractLocale, indexPathOf, DICTIONARY_SEGMENT, INDEX_SUFFIX } = require('./publish-core.js');

const REPORT_STATUS = { LIVE: 'live', NOT_LIVE: 'not-live', FAILED: 'failed' };
const ROW_TYPE = { ITEM: 'item', PLACEHOLDER: 'placeholder', DICTIONARY_INDEX: 'dictionary-index' };

const REPORT_CONCURRENCY = 5;
const REPORT_RPS_LIMIT = 5;
const MAX_REPORT_PATHS = 200;

const INDEX_ENTRIES_FIELD = 'entries';
const INDEX_READ_TIMEOUT_MS = 10000;
const DIRECT_HYDRATED = 'direct-hydrated';

const LIVE_AEM_STATUSES = new Set(['PUBLISHED', 'MODIFIED']);
const NOT_LIVE_AEM_STATUSES = new Set(['DRAFT', 'NEW', 'UNPUBLISHED']);

const CHECK = { OK: 'ok', NOT_FOUND: 'not-found', ERROR: 'error' };

async function checkFragment(path, { odinEndpoint, authToken }) {
    const { fragment, status } = await fetchFragmentByPath(odinEndpoint, path, authToken);
    if (fragment) return { state: CHECK.OK, fragment };
    if (status === 404) return { state: CHECK.NOT_FOUND };
    return { state: CHECK.ERROR, message: `AEM responded ${status}` };
}

/**
 * Reads the published `references=direct-hydrated` view of a dictionary index.
 * @param {{ id: string }} indexFragment author fragment of the index
 * @param {string} odinEndpoint target AEM author endpoint
 * @returns {Promise<string[]|null>} UUIDs of live entries, or null when the view cannot be read
 */
async function readPublishedIndexEntries(indexFragment, odinEndpoint) {
    const origin = new URL(odinEndpoint);
    origin.hostname = origin.hostname.replace(/^author-/, 'publish-');
    try {
        const response = await fetch(
            `${origin.origin}/adobe/contentFragments/${indexFragment.id}?references=${DIRECT_HYDRATED}`,
            { signal: AbortSignal.timeout(INDEX_READ_TIMEOUT_MS) },
        );
        if (!response.ok) return null;
        const body = await response.json();
        return body.fields?.[INDEX_ENTRIES_FIELD] || [];
    } catch {
        return null;
    }
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

function judgeIndex(check, placeholderIds, liveEntries) {
    const verdict = statusFromAem(check);
    if (verdict.status !== REPORT_STATUS.LIVE) {
        return check.state === CHECK.NOT_FOUND ? { ...verdict, reason: 'index-missing' } : verdict;
    }
    if (!liveEntries) return { status: REPORT_STATUS.FAILED, reason: 'published-index-unreadable' };
    const live = new Set(liveEntries);
    const missing = placeholderIds.filter((id) => !live.has(id));
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
 * @param {object} input.project project content fragment, already read by the caller
 * @param {string} input.odinEndpoint AEM author endpoint
 * @param {string} input.authToken bearer token
 * @param {object} [input.deps] injectable collaborators (tests)
 * @returns {Promise<object>} report with summary, missingIndexes, rows and errors
 */
async function generateReport({ projectId, project, odinEndpoint, authToken, deps = {} }) {
    const check = deps.checkFragment || ((path) => checkFragment(path, { odinEndpoint, authToken }));
    const readEntries = deps.readPublishedIndexEntries || ((fragment) => readPublishedIndexEntries(fragment, odinEndpoint));
    const runBatches = deps.processBatchWithConcurrency || processBatchWithConcurrency;

    const projectPublishedAt = getValue(project, 'publishedAt')?.value || '';
    const reported = parseReportedResult(project);

    const itemPaths = resolvePaths(getProjectPaths(project), getProjectLocales(project));
    const placeholdersByIndex = groupPlaceholdersByIndex(itemPaths);
    const paths = [...new Set([...itemPaths, ...placeholdersByIndex.keys()])].sort();
    if (paths.length > MAX_REPORT_PATHS) {
        throw Object.assign(
            new Error(`Report is limited to ${MAX_REPORT_PATHS} fragments; this project has ${paths.length}.`),
            { statusCode: 413 },
        );
    }

    const checks = await runBatches(paths, REPORT_CONCURRENCY, check, REPORT_RPS_LIMIT);
    const checkByPath = new Map(paths.map((path, i) => [path, checks[i]]));
    const indexPaths = paths.filter(
        (path) =>
            rowType(path) === ROW_TYPE.DICTIONARY_INDEX && statusFromAem(checkByPath.get(path)).status === REPORT_STATUS.LIVE,
    );
    const entries = await runBatches(
        indexPaths,
        REPORT_CONCURRENCY,
        (path) => readEntries(checkByPath.get(path).fragment),
        REPORT_RPS_LIMIT,
    );
    const entriesByIndex = new Map(indexPaths.map((path, i) => [path, entries[i]]));

    const missingIndexes = [];
    const errors = [];
    const rows = [];
    for (const path of paths) {
        const result = checkByPath.get(path);
        const type = rowType(path);
        let verdict;
        if (type === ROW_TYPE.DICTIONARY_INDEX) {
            const placeholderIds = (placeholdersByIndex.get(path) || []).map(
                (placeholder) => checkByPath.get(placeholder)?.fragment?.id,
            );
            verdict = judgeIndex(result, placeholderIds, entriesByIndex.get(path));
            if (verdict.reason === 'index-missing') missingIndexes.push(path);
        } else if (type === ROW_TYPE.PLACEHOLDER && checkByPath.get(indexPathOf(path))?.state === CHECK.NOT_FOUND) {
            verdict = { status: REPORT_STATUS.FAILED, reason: 'placeholder-index-missing' };
        } else {
            verdict = statusFromAem(result);
        }
        if (result.state === CHECK.ERROR) errors.push({ path, message: result.message });

        const fragment = result.fragment;
        const modifiedAt = fragment?.modified?.at || '';
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

module.exports = { generateReport, REPORT_STATUS, MAX_REPORT_PATHS };
