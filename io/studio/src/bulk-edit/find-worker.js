const { Core } = require('@adobe/aio-sdk');
const { buildSearchQuery, buildSearchPaths, searchPages, findMatches, extractLocale } = require('./search.js');
const { readJob, patchJob } = require('./state.js');

const logger = Core.Logger('bulk-edit-find-worker', { level: 'info' });
const RESULT_CAP = 1000;

function buildFindResult(fragment, matches) {
    return {
        ...fragment,
        locale: extractLocale(fragment.path),
        matches,
    };
}

async function runFindWorker(jobId, { odinEndpoint }) {
    if (!odinEndpoint) throw new Error('missing parameter(s) odinEndpoint');
    const job = await readJob(jobId);
    if (!job) throw new Error(`bulk-edit job ${jobId} not found`);

    const { params = {}, authToken } = job;
    const tags = Array.isArray(params.tags) ? params.tags : [];
    const paths = buildSearchPaths(params.surface, params.locale);

    const results = [];
    let truncated = false;
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
            if (truncated) break;
            const fresh = await readJob(jobId);
            if (fresh?.cancelled) {
                await patchJob(jobId, { status: 'CANCELLED', total: results.length });
                return { status: 'CANCELLED', total: results.length, truncated };
            }
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
    const { odinEndpoint } = params;
    try {
        const result = await runFindWorker(jobId, { odinEndpoint });
        return { statusCode: 200, body: { jobId, ...result } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'bulk-edit-find-worker-error', jobId, error: error.message }));
        return { statusCode: 500, body: { error: error.message } };
    }
}

module.exports = { main, runFindWorker, buildFindResult, RESULT_CAP };
exports.main = main;
