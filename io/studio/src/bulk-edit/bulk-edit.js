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
    touchJobCache,
    JOB_CACHE_TTL,
} = require('./state.js');
const { normalizeLocales } = require('./search.js');
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

const WORKER_ACTIONS = { find: 'bulk-edit-find-worker' };
const REQUIRED_INPUTS = { find: ['find', 'replace', 'surface'] };
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
    if (missing.length) return errorResponse(400, `missing parameter(s) '${missing.join(', ')}'`, logger);

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

function isTerminalJob(job) {
    return TERMINAL_STATUSES.has(job.status);
}

async function buildProgressResponse(jobId, job, extras = {}) {
    const body = {
        jobId,
        type: 'find',
        status: job.status,
        done: isTerminalJob(job),
        total: job.total ?? 0,
        ...extras,
    };
    if (job.exportReady) {
        body.exportReady = true;
        const exports = await resolveExportUrls(jobId, job);
        if (exports) body.exports = exports;
    }
    if (job.error) body.error = job.error;
    return { statusCode: 200, body };
}

async function resolveExportUrls(jobId, job) {
    if (!job.exportReady || !isTerminalJob(job)) return null;
    if (!(await exportFileExists(jobId, 'json'))) {
        if (!(await refreshFindExports(jobId, job))) return null;
    }
    if (!(await exportFileExists(jobId, 'csv'))) {
        if (!(await refreshFindExports(jobId, job))) return null;
    }
    return {
        json: await exportPresignUrl(jobId, 'json'),
        csv: await exportPresignUrl(jobId, 'csv'),
    };
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

    const userCsv = await readUserCsv(jobId);
    const report = await readReport(jobId);
    return buildProgressResponse(jobId, job, {
        filteredByUpload: !!userCsv?.rows?.length,
        report,
    });
}

async function main(params) {
    try {
        const method = (params.__ow_method || '').toLowerCase();
        if (method === 'post') {
            if (isCsvUpload(params)) {
                return handleCsvUpload({ ...params, allowedClientId: params.allowedClientId });
            }
            const request = parseOwBody(params);
            request.allowedClientId = params.allowedClientId;
            request.odinEndpoint = params.odinEndpoint;
            request.__ow_headers = params.__ow_headers;
            request.type = 'find';
            return await handlePost(request);
        }
        if (method === 'get') return await handleGet(params);
        if (method === 'delete') {
            const authToken = getBearerToken(params);
            if (!(await isAllowed(authToken, params.allowedClientId))) {
                return errorResponse(401, 'Authorization failed', logger);
            }
            return await handleCsvDelete({ ...params, allowedClientId: params.allowedClientId });
        }
        return errorResponse(405, `method '${method}' not allowed`, logger);
    } catch (error) {
        logger.error(JSON.stringify({ event: 'bulk-edit-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

module.exports = {
    main,
    handlePost,
    handleGet,
    handleCsvUpload,
    handleCsvDelete,
    refreshFindExports,
    resolveFindSourceItems,
    resolveExportUrls,
    isTerminalJob,
    buildProgressResponse,
    buildFindReport,
    canonicalSearchKey,
    computeJobId,
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
