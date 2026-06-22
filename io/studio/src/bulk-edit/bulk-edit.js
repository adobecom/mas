const crypto = require('crypto');
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { invokeAsyncAction, buildSiblingActionName } = require('../common.js');
const { readJob, writeJob, patchJob, readUserCsv, writeUserCsv, deleteUserCsv, readReport } = require('./state.js');
const { normalizeLocales } = require('./search.js');
const { buildWorkPlan } = require('./replace.js');
const { buildFindReport } = require('./find-worker.js');
const {
    exportDownloadResponse,
    deleteJobExports,
    readExportItems,
    readExportFullItems,
    writeJobExports,
} = require('./export.js');
const {
    parseJobIdParam,
    filterResultsByUserCsv,
    buildResultRowKeys,
    rowKey,
    fromCsv,
    parseCsvUploadBody,
    isCsvUpload,
} = require('./csv.js');

const logger = Core.Logger('bulk-edit', { level: 'info' });

const WORKER_ACTIONS = { find: 'bulk-edit-find-worker', replace: 'bulk-edit-replace-worker' };
const REQUIRED_INPUTS = { find: ['find', 'surface'], replace: ['findJobId'] };
const TERMINAL_STATUSES = new Set(['DONE', 'CANCELLED']);
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 50;

function parsePageParams(params) {
    const offset = Math.max(0, Number.parseInt(params.offset, 10) || 0);
    let limit = Number.parseInt(params.limit, 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = DEFAULT_PAGE_LIMIT;
    if (limit > MAX_PAGE_LIMIT) limit = MAX_PAGE_LIMIT;
    return { offset, limit };
}

function normalizeSearchInKey(searchIn) {
    if (searchIn == null || searchIn === '' || searchIn === '*') return '*';
    const list = Array.isArray(searchIn) ? searchIn : [searchIn];
    const scopes = [...new Set(list.filter(Boolean))].sort();
    if (!scopes.length || scopes.includes('*')) return '*';
    return scopes.length === 1 ? scopes[0] : scopes;
}

function normalizeLocalesKey(locale) {
    const locales = normalizeLocales(locale);
    if (!locales) return null;
    return locales.length === 1 ? locales[0] : locales;
}

function buildSearchKey(params) {
    return {
        type: params.type,
        find: params.find,
        surface: params.surface,
        searchIn: normalizeSearchInKey(params.searchIn),
        matchCase: !!params.matchCase,
        status: params.status || null,
        locale: normalizeLocalesKey(params.locale),
        tags: Array.isArray(params.tags) ? params.tags : [],
    };
}

function canonicalSearchKey(params) {
    const key = buildSearchKey(params);
    key.tags = [...key.tags].sort();
    return JSON.stringify(key);
}

function computeJobId(params) {
    return crypto.createHash('sha256').update(canonicalSearchKey(params)).digest('hex');
}

function computeReplaceJobId(findJobId, { dryRun, userCsv }) {
    const find12 = String(findJobId).slice(0, 12);
    const mode = dryRun ? 'dry' : 'live';
    const csv8 = crypto.createHash('sha256').update(JSON.stringify(userCsv.rows)).digest('hex').slice(0, 8);
    return `replace.${find12}.${mode}.${csv8}`;
}

async function cancelJob(jobId) {
    const job = await readJob(jobId);
    if (job && job.status === 'RUNNING') {
        await patchJob(jobId, { cancelled: true });
    }
}

function isForceRefresh(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

async function handlePost(params) {
    const authToken = getBearerToken(params);
    if (!(await isAllowed(authToken, params.allowedClientId))) {
        return errorResponse(401, 'Authorization failed', logger);
    }

    const required = REQUIRED_INPUTS[params.type];
    if (!required) return errorResponse(400, `unsupported type '${params.type}'`, logger);

    const missing = required.filter((key) => params[key] === undefined || params[key] === '');
    if (missing.length) return errorResponse(400, `missing parameter(s) '${missing}'`, logger);

    if (params.type === 'replace') return handleReplacePost(params, authToken);

    const searchKey = buildSearchKey(params);
    const jobId = computeJobId(searchKey);

    if (params.supersedes && params.supersedes !== jobId) {
        await cancelJob(params.supersedes);
    }

    const forceRefresh = isForceRefresh(params.forceRefresh);
    const existing = await readJob(jobId);

    if (!forceRefresh && existing && !existing.cancelled && (existing.status === 'RUNNING' || existing.status === 'DONE')) {
        return { statusCode: 202, body: { jobId, reused: true } };
    }

    if (!params.odinEndpoint) {
        return errorResponse(400, 'missing parameter(s) odinEndpoint', logger);
    }

    if (forceRefresh) {
        await deleteUserCsv(jobId);
        await deleteJobExports(jobId);
    }

    // runId supersedes any worker still running under this jobId: a forced refresh writes a fresh
    // runId, and the previous worker stops (without clobbering state) when it sees the mismatch.
    const runId = crypto.randomUUID();
    await writeJob(jobId, {
        type: params.type,
        params: searchKey,
        runId,
        status: 'RUNNING',
        results: [],
        total: 0,
        requestedAt: new Date().toISOString(),
    });

    const workerAction = buildSiblingActionName(params, WORKER_ACTIONS[params.type]);
    await invokeAsyncAction(workerAction, { jobId, authToken, runId }, params);

    return { statusCode: 202, body: { jobId, reused: false } };
}

const TERMINAL_REPLACE_STATUSES = new Set(['DONE']);

async function handleReplacePost(params, authToken) {
    if (!params.odinEndpoint) return errorResponse(400, 'missing parameter(s) odinEndpoint', logger);

    const findJob = await readJob(params.findJobId);
    if (!findJob) return errorResponse(404, `bulk-edit job ${params.findJobId} not found`, logger);
    if (findJob.status !== 'DONE') {
        return errorResponse(400, `find job ${params.findJobId} is not ready (status: ${findJob.status})`, logger);
    }

    const userCsv = await readUserCsv(params.findJobId);
    if (!userCsv?.rows?.length) {
        return errorResponse(400, `no replace values uploaded for job ${params.findJobId}`, logger);
    }

    const dryRun = isForceRefresh(params.dryRun);
    const jobId = computeReplaceJobId(params.findJobId, { dryRun, userCsv });

    const existing = await readJob(jobId);
    if (existing && !existing.cancelled && (existing.status === 'RUNNING' || TERMINAL_REPLACE_STATUSES.has(existing.status))) {
        return { statusCode: 202, body: { jobId, reused: true, dryRun } };
    }

    const now = new Date().toISOString();
    const runId = crypto.randomUUID();
    await writeJob(jobId, {
        type: 'replace',
        findJobId: params.findJobId,
        dryRun,
        matchCase: !!findJob.params?.matchCase,
        runId,
        status: 'RUNNING',
        results: [],
        cursor: 0,
        total: buildWorkPlan(userCsv.rows).length,
        processed: 0,
        succeeded: 0,
        skipped: 0,
        failed: 0,
        conflicts: 0,
        startedAt: now,
        requestedAt: now,
    });

    const workerAction = buildSiblingActionName(params, WORKER_ACTIONS.replace);
    await invokeAsyncAction(workerAction, { jobId, authToken, runId }, params);

    return { statusCode: 202, body: { jobId, reused: false, dryRun } };
}

function isJobTerminalForDownload(job) {
    if (job.type === 'replace') return job.status === 'DONE';
    return TERMINAL_STATUSES.has(job.status);
}

function buildProgressResponse(jobId, job, extras = {}) {
    const done = job.type === 'replace' ? TERMINAL_REPLACE_STATUSES.has(job.status) : TERMINAL_STATUSES.has(job.status);
    const body = {
        jobId,
        type: job.type || 'find',
        status: job.status,
        done,
        total: job.total ?? 0,
        ...extras,
    };
    if (job.type === 'replace') {
        body.dryRun = !!job.dryRun;
        body.processed = job.processed;
        body.succeeded = job.succeeded;
        body.skipped = job.skipped;
        body.failed = job.failed;
        body.conflicts = job.conflicts;
    }
    if (job.exportReady) body.exportReady = true;
    if (job.error) body.error = job.error;
    return { statusCode: 200, body };
}

async function resolveJobResultItems(jobId, job) {
    if (job.results?.length) return job.results;
    if (job.exportReady) return readExportItems(jobId);
    return [];
}

async function handleDownloadGet(jobId, job, wantsCsv) {
    if (!isJobTerminalForDownload(job)) {
        return errorResponse(400, `bulk-edit job ${jobId} is not ready for export (status: ${job.status})`, logger);
    }
    if (!job.exportReady) {
        return errorResponse(404, `bulk-edit export for job ${jobId} is not available`, logger);
    }
    return exportDownloadResponse(jobId, wantsCsv ? 'csv' : 'json');
}

async function resolveFindSourceItems(jobId, job) {
    const fullItems = await readExportFullItems(jobId);
    if (fullItems.length) return fullItems;
    return resolveJobResultItems(jobId, job);
}

async function refreshFindExports(jobId) {
    const allItems = await readExportFullItems(jobId);
    const sourceItems = allItems.length ? allItems : await readExportItems(jobId);
    const userCsv = await readUserCsv(jobId);
    const userRows = userCsv?.rows;
    const items = userRows?.length ? filterResultsByUserCsv(sourceItems, userRows) : sourceItems;
    const report = buildFindReport(items);
    const { exportedAt } = await writeJobExports(jobId, {
        items,
        report,
        type: 'find',
        filteredByUpload: !!userRows?.length,
        dryRun: false,
        userRows,
    });
    await patchJob(jobId, { total: items.length, exportedAt, exportReady: true });
    return { report, filteredByUpload: !!userRows?.length };
}

async function handleCsvUpload(params) {
    const authToken = getBearerToken(params);
    if (!(await isAllowed(authToken, params.allowedClientId))) {
        return errorResponse(401, 'Authorization failed', logger);
    }

    const { jobId } = params;
    if (!jobId) return errorResponse(400, "missing parameter(s) 'jobId'", logger);

    const csvText = parseCsvUploadBody(params).trim();
    if (!csvText) return errorResponse(400, 'missing CSV body', logger);

    const job = await readJob(jobId);
    if (!job) return errorResponse(404, `bulk-edit job ${jobId} not found`, logger);
    if (!TERMINAL_STATUSES.has(job.status)) {
        return errorResponse(400, `bulk-edit job ${jobId} is not ready for upload (status: ${job.status})`, logger);
    }

    let rows;
    try {
        rows = fromCsv(csvText);
    } catch (error) {
        return errorResponse(400, error.message || 'invalid CSV', logger);
    }

    const allowedKeys = buildResultRowKeys(await resolveFindSourceItems(jobId, job));
    for (const row of rows) {
        if (!allowedKeys.has(rowKey(row))) {
            return errorResponse(400, `CSV row not found in job results: ${rowKey(row)}`, logger);
        }
    }

    await writeUserCsv(jobId, {
        jobId,
        uploadedAt: new Date().toISOString(),
        rows,
    });

    const { report, filteredByUpload } = await refreshFindExports(jobId);

    return {
        statusCode: 202,
        body: {
            jobId,
            rowsAccepted: rows.length,
            filteredByUpload,
            total: report.total,
            report,
            exportReady: true,
        },
    };
}

async function handleCsvDelete(params) {
    const authToken = getBearerToken(params);
    if (!(await isAllowed(authToken, params.allowedClientId))) {
        return errorResponse(401, 'Authorization failed', logger);
    }

    const { jobId } = params;
    if (!jobId) return errorResponse(400, "missing parameter(s) 'jobId'", logger);

    const job = await readJob(jobId);
    if (!job) return errorResponse(404, `bulk-edit job ${jobId} not found`, logger);
    if (!TERMINAL_STATUSES.has(job.status)) {
        return errorResponse(400, `bulk-edit job ${jobId} is not ready (status: ${job.status})`, logger);
    }

    const userCsv = await readUserCsv(jobId);
    if (!userCsv?.rows?.length) {
        return errorResponse(404, `no uploaded CSV for job ${jobId}`, logger);
    }

    await deleteUserCsv(jobId);
    const { report, filteredByUpload } = await refreshFindExports(jobId);

    return {
        statusCode: 200,
        body: {
            jobId,
            filteredByUpload,
            total: report.total,
            report,
            exportReady: true,
        },
    };
}

async function handleReplaceGet(params, job, jobId, wantsCsv, wantsJson) {
    if (wantsCsv || wantsJson) return handleDownloadGet(jobId, job, wantsCsv);
    const report = job.status === 'DONE' ? await readReport(jobId) : null;
    return buildProgressResponse(jobId, job, { report });
}

async function handleGet(params) {
    const authToken = getBearerToken(params);
    if (!(await isAllowed(authToken, params.allowedClientId))) {
        return errorResponse(401, 'Authorization failed', logger);
    }

    const rawJobId = params.jobId;
    if (!rawJobId) return errorResponse(400, "missing parameter(s) 'jobId'", logger);

    const { jobId, wantsCsv, wantsJson } = parseJobIdParam(rawJobId);
    if (!jobId) return errorResponse(400, "missing parameter(s) 'jobId'", logger);

    const job = await readJob(jobId);
    if (!job) return errorResponse(404, `bulk-edit job ${jobId} not found`, logger);

    if (job.status === 'FAILED') {
        return { error: { statusCode: 500, body: { status: 'FAILED', error: job.error, total: job.total } } };
    }

    if (job.type === 'replace') return handleReplaceGet(params, job, jobId, wantsCsv, wantsJson);

    if (wantsCsv || wantsJson) return handleDownloadGet(jobId, job, wantsCsv);

    const userCsv = await readUserCsv(jobId);
    const report = await readReport(jobId);
    return buildProgressResponse(jobId, job, {
        filteredByUpload: !!userCsv?.rows?.length,
        report,
    });
}

function jobModeMismatchError(job, mode, jobId) {
    const jobType = job.type || 'find';
    if (mode === 'find' && jobType === 'replace') {
        return errorResponse(400, `job ${jobId} is a replace job — use bulk-edit-replace`, logger);
    }
    if (mode === 'replace' && jobType !== 'replace') {
        return errorResponse(400, `job ${jobId} is a find job — use bulk-edit-find`, logger);
    }
    return null;
}

async function handleGetForMode(params, mode) {
    const rawJobId = params.jobId;
    if (!rawJobId) return errorResponse(400, "missing parameter(s) 'jobId'", logger);

    const { jobId } = parseJobIdParam(rawJobId);
    if (!jobId) return errorResponse(400, "missing parameter(s) 'jobId'", logger);

    const job = await readJob(jobId);
    if (!job) return errorResponse(404, `bulk-edit job ${jobId} not found`, logger);

    const mismatch = jobModeMismatchError(job, mode, jobId);
    if (mismatch) return mismatch;

    return handleGet(params);
}

function resolveActionSegment(params) {
    const actionName = params.__ow_action_name || process.env.__OW_ACTION_NAME || '';
    return String(actionName).split('/').filter(Boolean).pop() || String(actionName);
}

function resolveBulkEditMode(params) {
    if (params.bulkEditMode === 'replace') return 'replace';
    if (params.bulkEditMode === 'find') return 'find';
    const segment = resolveActionSegment(params);
    if (segment === 'bulk-edit-replace') return 'replace';
    if (segment === 'bulk-edit-find') return 'find';
    return null;
}

function createModeMain(mode) {
    return async function modeMain(params) {
        try {
            const method = (params.__ow_method || '').toLowerCase();
            if (method === 'post') {
                if (isCsvUpload(params)) {
                    if (mode === 'replace') {
                        return errorResponse(405, 'CSV upload is not supported on bulk-edit-replace', logger);
                    }
                    return handleCsvUpload({ ...params, allowedClientId: params.allowedClientId });
                }
                const body = parseOwBody(params);
                body.allowedClientId = params.allowedClientId;
                body.odinEndpoint = params.odinEndpoint;
                body.__ow_headers = params.__ow_headers;
                if (mode === 'find') {
                    body.type = 'find';
                    return await handlePost(body);
                }
                body.type = 'replace';
                return await handleReplacePost(body, getBearerToken(params));
            }
            if (method === 'get') {
                const authToken = getBearerToken(params);
                if (!(await isAllowed(authToken, params.allowedClientId))) {
                    return errorResponse(401, 'Authorization failed', logger);
                }
                return await handleGetForMode(params, mode);
            }
            if (method === 'delete') {
                if (mode !== 'find') {
                    return errorResponse(405, 'CSV delete is not supported on bulk-edit-replace', logger);
                }
                const authToken = getBearerToken(params);
                if (!(await isAllowed(authToken, params.allowedClientId))) {
                    return errorResponse(401, 'Authorization failed', logger);
                }
                return await handleCsvDelete({ ...params, allowedClientId: params.allowedClientId });
            }
            return errorResponse(405, `method '${method}' not allowed`, logger);
        } catch (error) {
            logger.error(JSON.stringify({ event: 'bulk-edit-error', mode, error: error.message }));
            return errorResponse(500, error.message || 'Internal server error', logger);
        }
    };
}

async function main(params) {
    const mode = resolveBulkEditMode(params);
    if (!mode) {
        return errorResponse(400, 'bulk-edit action could not be determined from request', logger);
    }
    return createModeMain(mode)(params);
}

module.exports = {
    main,
    resolveBulkEditMode,
    createModeMain,
    jobModeMismatchError,
    handleGetForMode,
    handlePost,
    handleReplacePost,
    handleGet,
    handleReplaceGet,
    handleCsvUpload,
    handleCsvDelete,
    refreshFindExports,
    resolveFindSourceItems,
    buildProgressResponse,
    resolveJobResultItems,
    isJobTerminalForDownload,
    canonicalSearchKey,
    computeJobId,
    computeReplaceJobId,
    normalizeSearchInKey,
    normalizeLocalesKey,
    isForceRefresh,
    parsePageParams,
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
    WORKER_ACTIONS,
};
exports.main = main;
