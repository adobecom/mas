const crypto = require('crypto');
const { Core } = require('@adobe/aio-sdk');
const { init: filesInit } = require('@adobe/aio-lib-files');
const { errorResponse, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { invokeAsyncAction, buildSiblingActionName } = require('../common.js');
const {
    readJob,
    writeJob,
    patchJob,
    readUserCsv,
    writeUserCsv,
    deleteUserCsv,
    readReport,
    readResults,
    readDryRun,
    touchJobCache,
    JOB_CACHE_TTL,
} = require('./state.js');
const { normalizeLocales, invalidSearchScopes, VALID_SEARCH_SCOPES } = require('./search.js');
const { buildWorkPlan, resolveReplaceRows } = require('./replace.js');
const {
    parseJobIdParam,
    filterResultsByUserCsv,
    buildResultRowKeys,
    buildCsvRowsFromFindResults,
    toCsv,
    rowKey,
    fromCsv,
    parseCsvUploadBody,
    isCsvUpload,
} = require('./csv.js');

const logger = Core.Logger('bulk-edit', { level: 'info' });

const WORKER_ACTIONS = { find: 'bulk-edit-find-worker', replace: 'bulk-edit-replace-worker' };
const REQUIRED_INPUTS = { find: ['find', 'replace', 'surface'], replace: ['findJobId'] };
const TERMINAL_STATUSES = new Set(['DONE', 'CANCELLED']);
const EXPORT_ROOT = 'private/bulk-edit';
const PRESIGN_TTL_SECONDS = 24 * 60 * 60;

function buildFindReport(results) {
    const byLocale = {};
    for (const result of results) {
        const locale = result.locale || 'unknown';
        byLocale[locale] = (byLocale[locale] || 0) + 1;
    }
    return { total: results.length, byLocale };
}

function buildExportPaths(jobId) {
    const base = `${EXPORT_ROOT}/${jobId}`;
    return {
        json: `${base}.json`,
        csv: `${base}.csv`,
        fullJson: `${base}-full.json`,
    };
}

function buildCsvFromItems(items, userRows) {
    const rows = buildCsvRowsFromFindResults(items, userRows);
    return toCsv(rows);
}

async function writeJobExports(jobId, payload) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const { items, report, type, filteredByUpload, dryRun, userRows } = payload;
    const exportedAt = new Date().toISOString();
    const document = {
        jobId,
        type,
        exportedAt,
        filteredByUpload: !!filteredByUpload,
        dryRun: !!dryRun,
        items: items || [],
        report: report || null,
    };
    await files.write(paths.json, JSON.stringify(document), { contentType: 'application/json' });
    if (type !== 'replace') {
        await files.write(paths.csv, buildCsvFromItems(items, userRows), { contentType: 'text/csv' });
    }
    return { exportedAt, paths };
}

async function readExportDocument(jobId, pathKey) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const filePath = paths[pathKey];
    const buffer = await files.read(filePath);
    const text = Buffer.isBuffer(buffer) ? buffer.toString('utf8') : String(buffer);
    return JSON.parse(text);
}

async function readExportItems(jobId) {
    const document = await readExportDocument(jobId, 'json');
    return document.items || [];
}

async function readExportFullItems(jobId) {
    try {
        const document = await readExportDocument(jobId, 'fullJson');
        return document.items || [];
    } catch {
        return [];
    }
}

async function writeFullExport(jobId, type, items) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    await files.write(paths.fullJson, JSON.stringify({ jobId, type, items: items || [] }), { contentType: 'application/json' });
}

async function writeFindFullExport(jobId, items) {
    await writeFullExport(jobId, 'find', items);
}

async function deleteJobExports(jobId) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    await Promise.all(
        [files.delete(paths.json), files.delete(paths.csv), files.delete(paths.fullJson)].map((p) => p.catch(() => {})),
    );
}

async function exportFileExists(jobId, format) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const filePath = format === 'csv' ? paths.csv : paths.json;
    try {
        const buffer = await files.read(filePath);
        const text = Buffer.isBuffer(buffer) ? buffer.toString('utf8') : String(buffer ?? '');
        return text.length > 0;
    } catch {
        return false;
    }
}

async function exportPresignUrl(jobId, format) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const filePath = format === 'csv' ? paths.csv : paths.json;
    return files.generatePresignURL(filePath, {
        expiryInSeconds: PRESIGN_TTL_SECONDS,
        permissions: 'r',
    });
}

async function exportRedirectResponse(jobId, format) {
    const downloadUrl = await exportPresignUrl(jobId, format);
    return {
        statusCode: 302,
        headers: {
            Location: downloadUrl,
        },
    };
}

async function resolveFindSourceItems(jobId, job) {
    const stateResults = await readResults(jobId);
    if (stateResults?.length) return stateResults;
    const fullItems = await readExportFullItems(jobId);
    if (fullItems.length) return fullItems;
    if (job?.results?.length) return job.results;
    if (job?.exportReady) {
        try {
            return await readExportItems(jobId);
        } catch {
            return [];
        }
    }
    return [];
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
        replace: params.replace,
        surface: params.surface,
        searchIn: normalizeSearchInKey(params.searchIn),
        matchCase: !!params.matchCase,
        status: params.status || null,
        locale: normalizeLocalesKey(params.locale),
        tags: Array.isArray(params.tags) ? params.tags : [],
    };
}

function canonicalSearchKey(searchKey) {
    return JSON.stringify({ ...searchKey, tags: [...searchKey.tags].sort() });
}

function hashSearchKey(searchKey) {
    return crypto.createHash('sha256').update(canonicalSearchKey(searchKey)).digest('hex');
}

function computeJobId(params) {
    return hashSearchKey(buildSearchKey(params));
}

function computeReplaceJobId(findJobId, { dryRun, actionableRows, findRunId }) {
    const find12 = String(findJobId).slice(0, 12);
    const mode = dryRun ? 'dry' : 'live';
    const payload = {
        rows: (actionableRows || []).map((row) => ({
            fragment_id: row.fragment_id,
            field: row.field,
            find: row.find,
            etag: row.etag,
        })),
        findRunId: findRunId ?? '',
    };
    const csv8 = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 8);
    return `replace.${find12}.${mode}.${csv8}`;
}

function actionableReplaceRows(rows) {
    return (rows || []).filter((row) => {
        const replace = row.replace ?? '';
        return replace && replace !== row.find;
    });
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

    const badScopes = invalidSearchScopes(params.searchIn);
    if (badScopes.length) {
        return errorResponse(
            400,
            `invalid searchIn scope(s) '${badScopes.join(', ')}' — valid: ${VALID_SEARCH_SCOPES.join(', ')}`,
            logger,
        );
    }

    const searchKey = buildSearchKey(params);
    const jobId = hashSearchKey(searchKey);

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

async function handleReplacePost(params, authToken) {
    if (!(await isAllowed(authToken, params.allowedClientId))) {
        return errorResponse(401, 'Authorization failed', logger);
    }
    if (!params.odinEndpoint) return errorResponse(400, 'missing parameter(s) odinEndpoint', logger);

    const required = REQUIRED_INPUTS.replace;
    const missing = required.filter((key) => params[key] === undefined || params[key] === '');
    if (missing.length) return errorResponse(400, `missing parameter(s) '${missing.join(', ')}'`, logger);

    const findJob = await readJob(params.findJobId);
    if (!findJob) return errorResponse(404, `bulk-edit job ${params.findJobId} not found`, logger);
    if (findJob.status !== 'DONE') {
        return errorResponse(400, `find job ${params.findJobId} is not ready (status: ${findJob.status})`, logger);
    }

    const userCsv = await readUserCsv(params.findJobId);
    const findItems = await resolveFindSourceItems(params.findJobId, findJob);
    if (!findItems.length) {
        return errorResponse(400, `find job ${params.findJobId} has no results`, logger);
    }

    const findParams = findJob.params || {};
    const replaceRows = resolveReplaceRows(findItems, userCsv?.rows, findParams);
    const workPlan = buildWorkPlan(replaceRows);
    if (!workPlan.length) {
        return errorResponse(400, 'no rows with replace values would change fragments', logger);
    }

    const dryRun = isForceRefresh(params.dryRun);
    const jobId = computeReplaceJobId(params.findJobId, {
        dryRun,
        actionableRows: actionableReplaceRows(replaceRows),
        findRunId: findJob.runId,
    });

    const existing = await readJob(jobId);
    if (existing && !existing.cancelled && (existing.status === 'RUNNING' || existing.status === 'DONE')) {
        return { statusCode: 202, body: { jobId, reused: true, dryRun } };
    }

    const now = new Date().toISOString();
    const runId = crypto.randomUUID();
    await writeJob(jobId, {
        type: 'replace',
        findJobId: params.findJobId,
        findRunId: findJob.runId,
        dryRun,
        matchCase: !!findJob.params?.matchCase,
        runId,
        status: 'RUNNING',
        results: [],
        cursor: 0,
        total: workPlan.length,
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
    return TERMINAL_STATUSES.has(job.status);
}

async function buildProgressResponse(jobId, job, extras = {}) {
    const done = TERMINAL_STATUSES.has(job.status);
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
    if (job.exportReady) {
        body.exportReady = true;
        const exports = await resolveExportUrls(jobId, job);
        if (exports) body.exports = exports;
    }
    if (job.error) body.error = job.error;
    return { statusCode: 200, body };
}

function isTerminalJob(job) {
    return TERMINAL_STATUSES.has(job.status);
}

async function resolveExportUrls(jobId, job) {
    if (!job.exportReady || !isJobTerminalForDownload(job)) return null;
    const refresh = job.type === 'replace' ? () => refreshReplaceExports(jobId, job) : () => refreshFindExports(jobId, job);
    if (!(await exportFileExists(jobId, 'json'))) {
        if (!(await refresh())) return null;
    }
    if (job.type !== 'replace' && !(await exportFileExists(jobId, 'csv'))) {
        if (!(await refresh())) return null;
    }
    const exports = { json: await exportPresignUrl(jobId, 'json') };
    if (job.type !== 'replace') {
        exports.csv = await exportPresignUrl(jobId, 'csv');
    }
    return exports;
}

async function resolveReplaceSourceItems(jobId, job) {
    const stateResults = await readResults(jobId);
    if (stateResults?.length) return stateResults;
    const dryRun = await readDryRun(jobId);
    if (dryRun?.length) return dryRun;
    if (job?.results?.length) return job.results;
    if (job?.exportReady) {
        try {
            return await readExportItems(jobId);
        } catch {
            return [];
        }
    }
    return [];
}

async function refreshFindExports(jobId, job) {
    const resolvedJob = job || (await readJob(jobId));
    const sourceItems = await resolveFindSourceItems(jobId, resolvedJob || {});
    if (!sourceItems.length) return null;
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
    await patchJob(jobId, { total: items.length, exportedAt, exportReady: true }, JOB_CACHE_TTL);
    return { report, filteredByUpload: !!userRows?.length };
}

async function refreshReplaceExports(jobId, job) {
    const resolvedJob = job || (await readJob(jobId));
    const items = await resolveReplaceSourceItems(jobId, resolvedJob || {});
    if (!items.length) return null;
    let report = await readReport(jobId);
    if (!report) {
        const { buildReport } = require('./replace-worker.js');
        report = buildReport(items, {
            dryRun: !!resolvedJob?.dryRun,
            totalRows: items.length,
            startedAt: resolvedJob?.startedAt || new Date().toISOString(),
        });
    }
    const { exportedAt } = await writeJobExports(jobId, {
        items,
        report,
        type: 'replace',
        filteredByUpload: false,
        dryRun: !!resolvedJob?.dryRun,
        userRows: null,
    });
    if (resolvedJob?.dryRun) {
        const modifiedFragments = items.filter((result) => result.status === 'WOULD_REPLACE');
        if (modifiedFragments.length) {
            await writeFullExport(jobId, 'replace', modifiedFragments);
        }
    }
    await patchJob(jobId, { exportedAt, exportReady: true }, JOB_CACHE_TTL);
    return { report };
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

    const { report, filteredByUpload } = await refreshFindExports(jobId, job);

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
    const { report, filteredByUpload } = await refreshFindExports(jobId, job);

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

async function handleReplaceGet(job, jobId) {
    const report = TERMINAL_STATUSES.has(job.status) ? await readReport(jobId) : null;
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
    if (wantsCsv || wantsJson) {
        return errorResponse(400, 'jobId suffix .json or .csv is not supported — export URLs are in the poll response', logger);
    }

    const job = await readJob(jobId);
    if (!job) return errorResponse(404, `bulk-edit job ${jobId} not found`, logger);

    if (job.status === 'FAILED') {
        return { error: { statusCode: 500, body: { status: 'FAILED', error: job.error, total: job.total } } };
    }

    if (isTerminalJob(job)) {
        await touchJobCache(jobId, job);
    }

    if (job.type === 'replace') return handleReplaceGet(job, jobId);

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
    refreshReplaceExports,
    resolveFindSourceItems,
    resolveExportUrls,
    resolveReplaceSourceItems,
    isTerminalJob,
    buildProgressResponse,
    isJobTerminalForDownload,
    buildFindReport,
    canonicalSearchKey,
    computeJobId,
    computeReplaceJobId,
    actionableReplaceRows,
    normalizeSearchInKey,
    normalizeLocalesKey,
    isForceRefresh,
    WORKER_ACTIONS,
    EXPORT_ROOT,
    PRESIGN_TTL_SECONDS,
    buildExportPaths,
    buildCsvFromItems,
    writeFullExport,
    writeFindFullExport,
    readExportFullItems,
    readExportDocument,
    writeJobExports,
    readExportItems,
    deleteJobExports,
    exportFileExists,
    exportPresignUrl,
    exportRedirectResponse,
};
