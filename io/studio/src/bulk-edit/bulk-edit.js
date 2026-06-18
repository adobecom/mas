const crypto = require('crypto');
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { invokeAsyncAction, buildSiblingActionName } = require('../common.js');
const { readJob, writeJob } = require('./state.js');

const logger = Core.Logger('bulk-edit', { level: 'info' });

const WORKER_ACTIONS = { find: 'bulk-edit-find-worker' };
const REQUIRED_INPUTS = { find: ['find', 'surface'] };

function canonicalSearchKey(params) {
    const tags = Array.isArray(params.tags) ? [...params.tags].sort() : [];
    return JSON.stringify({
        type: params.type,
        find: params.find,
        surface: params.surface,
        searchIn: params.searchIn || '*',
        matchCase: !!params.matchCase,
        status: params.status || null,
        locale: params.locale || null,
        tags,
    });
}

function computeJobId(params) {
    return crypto.createHash('sha256').update(canonicalSearchKey(params)).digest('hex');
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

    const searchKey = {
        type: params.type,
        find: params.find,
        surface: params.surface,
        searchIn: params.searchIn || '*',
        matchCase: !!params.matchCase,
        status: params.status || null,
        locale: params.locale || null,
        tags: Array.isArray(params.tags) ? params.tags : [],
    };
    const jobId = computeJobId(searchKey);

    const existing = await readJob(jobId);
    if (existing && (existing.status === 'RUNNING' || existing.status === 'DONE')) {
        return { statusCode: 202, body: { jobId, reused: true } };
    }

    await writeJob(jobId, {
        type: params.type,
        params: searchKey,
        authToken,
        status: 'RUNNING',
        results: [],
        total: 0,
        requestedAt: new Date().toISOString(),
    });

    const workerAction = buildSiblingActionName(params, WORKER_ACTIONS[params.type]);
    await invokeAsyncAction(workerAction, { jobId }, params);

    return { statusCode: 202, body: { jobId, reused: false } };
}

async function handleGet(params) {
    const authToken = getBearerToken(params);
    if (!(await isAllowed(authToken, params.allowedClientId))) {
        return errorResponse(401, 'Authorization failed', logger);
    }

    const { jobId } = params;
    if (!jobId) return errorResponse(400, "missing parameter(s) 'jobId'", logger);

    const job = await readJob(jobId);
    if (!job) return errorResponse(404, `bulk-edit job ${jobId} not found`, logger);

    if (job.status === 'FAILED') {
        return { error: { statusCode: 500, body: { status: 'FAILED', error: job.error, total: job.total } } };
    }

    const offset = Number.parseInt(params.offset, 10) || 0;
    return {
        statusCode: 200,
        body: {
            status: job.status,
            total: job.total,
            truncated: !!job.truncated,
            done: job.status === 'DONE',
            items: (job.results || []).slice(offset),
        },
    };
}

async function main(params) {
    try {
        const method = (params.__ow_method || '').toLowerCase();
        if (method === 'post') {
            const body = parseOwBody(params);
            body.allowedClientId = params.allowedClientId;
            return await handlePost(body);
        }
        if (method === 'get') return await handleGet(params);
        return errorResponse(405, `method '${method}' not allowed`, logger);
    } catch (error) {
        logger.error(JSON.stringify({ event: 'bulk-edit-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

module.exports = { main, handlePost, handleGet, canonicalSearchKey, computeJobId, WORKER_ACTIONS };
exports.main = main;
