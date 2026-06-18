const { Core } = require('@adobe/aio-sdk');
const { buildSearchQuery, searchPages, findMatches, extractLocale } = require('./search.js');
const { readJob, patchJob } = require('./state.js');

const logger = Core.Logger('bulk-edit-find-worker', { level: 'info' });
const RESULT_CAP = 1000;

async function runFindWorker(jobId, { odinEndpoint }) {
    const job = await readJob(jobId);
    if (!job) throw new Error(`bulk-edit job ${jobId} not found`);

    const { params = {}, authToken } = job;
    const query = buildSearchQuery({
        surface: params.surface,
        locale: params.locale,
        tags: Array.isArray(params.tags) ? params.tags : [],
        status: params.status,
        find: params.find,
    });

    const results = [];
    let truncated = false;
    try {
        for await (const items of searchPages({ odinEndpoint, authToken, query })) {
            for (const fragment of items) {
                const matches = findMatches(fragment, params.searchIn || '*', params.find, !!params.matchCase);
                if (matches.length) {
                    results.push({
                        id: fragment.id,
                        path: fragment.path,
                        locale: extractLocale(fragment.path),
                        title: fragment.title,
                        status: fragment.status,
                        etag: fragment.etag,
                        matches,
                    });
                }
                if (results.length >= RESULT_CAP) {
                    truncated = true;
                    break;
                }
            }
            await patchJob(jobId, { results: [...results], total: results.length });
            const fresh = await readJob(jobId);
            if (fresh?.cancelled) {
                await patchJob(jobId, { status: 'CANCELLED', total: results.length });
                return { status: 'CANCELLED', total: results.length, truncated };
            }
            if (truncated) break;
        }
        await patchJob(jobId, { status: 'DONE', results, total: results.length, truncated });
        return { status: 'DONE', total: results.length, truncated };
    } catch (error) {
        await patchJob(jobId, { status: 'FAILED', error: error.message, total: results.length });
        throw error;
    }
}

async function main(params) {
    const { jobId } = params;
    const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
    try {
        const result = await runFindWorker(jobId, { odinEndpoint });
        return { statusCode: 200, body: { jobId, ...result } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'bulk-edit-find-worker-error', jobId, error: error.message }));
        return { statusCode: 500, body: { error: error.message } };
    }
}

module.exports = { main, runFindWorker, RESULT_CAP };
exports.main = main;
