const { Core } = require('@adobe/aio-sdk');
const { buildSearchQuery, buildSearchPaths, searchPages, findMatches, extractLocale } = require('./search.js');
const { readJob, patchJob } = require('./state.js');

const logger = Core.Logger('bulk-edit-find-worker', { level: 'info' });

function buildFindResult(fragment, matches) {
    return {
        ...fragment,
        locale: extractLocale(fragment.path),
        matches,
    };
}

async function resolveStop(jobId, runId) {
    const fresh = await readJob(jobId);
    if (!fresh || fresh.runId !== runId) return 'SUPERSEDED';
    if (fresh.cancelled) return 'CANCELLED';
    return null;
}

async function finalizeStop(jobId, stop, results) {
    if (stop === 'CANCELLED') {
        await patchJob(jobId, { status: 'CANCELLED', total: results.length });
    }
    return { status: stop, total: results.length };
}

async function runFindWorker(jobId, { odinEndpoint, authToken, runId }) {
    if (!odinEndpoint) throw new Error('missing parameter(s) odinEndpoint');
    const job = await readJob(jobId);
    if (!job) throw new Error(`bulk-edit job ${jobId} not found`);

    const { params = {} } = job;
    const tags = Array.isArray(params.tags) ? params.tags : [];
    const paths = buildSearchPaths(params.surface, params.locale);

    const results = [];
    try {
        for (const path of paths) {
            const query = buildSearchQuery({
                path,
                tags,
                status: params.status,
                find: params.find,
            });
            for await (const items of searchPages({ odinEndpoint, authToken, query })) {
                for (const fragment of items) {
                    const matches = findMatches(fragment, params.searchIn || '*', params.find, !!params.matchCase);
                    if (matches.length) {
                        results.push(buildFindResult(fragment, matches));
                    }
                }
                const stop = await resolveStop(jobId, runId);
                if (stop) return finalizeStop(jobId, stop, results);
                await patchJob(jobId, { results: [...results], total: results.length });
            }
            const stop = await resolveStop(jobId, runId);
            if (stop) return finalizeStop(jobId, stop, results);
        }
        await patchJob(jobId, { status: 'DONE', results, total: results.length });
        return { status: 'DONE', total: results.length };
    } catch (error) {
        if ((await resolveStop(jobId, runId)) === null) {
            await patchJob(jobId, { status: 'FAILED', error: error.message, total: results.length });
        }
        throw error;
    }
}

async function main(params) {
    const { jobId, odinEndpoint, authToken, runId } = params;
    try {
        const result = await runFindWorker(jobId, { odinEndpoint, authToken, runId });
        return { statusCode: 200, body: { jobId, ...result } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'bulk-edit-find-worker-error', jobId, error: error.message }));
        return { statusCode: 500, body: { error: error.message } };
    }
}

module.exports = { main, runFindWorker, buildFindResult };
exports.main = main;
