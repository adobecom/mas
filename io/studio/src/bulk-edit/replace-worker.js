const { Core } = require('@adobe/aio-sdk');
const { getFragmentWithEtag, putToOdin, invokeAsyncAction, buildSiblingActionName } = require('../common.js');
const { applyReplacementsToFragment, buildWorkPlan, resolveReplaceRows } = require('./replace.js');
const { resolveFindSourceItems } = require('./find-results.js');
const {
    readJob,
    patchJob,
    readUserCsv,
    writeDryRun,
    writeReport,
    writeResults,
    JOB_CACHE_TTL,
    JOB_RUNNING_TTL,
} = require('./state.js');
const { writeJobExports, writeFullExport } = require('./export.js');

const logger = Core.Logger('bulk-edit-replace-worker', { level: 'info' });

const WORKER_ACTION = 'bulk-edit-replace-worker';
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_SOFT_BUDGET_MS = 25 * 60 * 1000;

function countCounters(results) {
    const counts = { processed: results.length, succeeded: 0, skipped: 0, failed: 0, conflicts: 0 };
    for (const result of results) {
        if (result.status === 'REPLACED' || result.status === 'WOULD_REPLACE') counts.succeeded += 1;
        else if (result.status === 'SKIPPED') counts.skipped += 1;
        else if (result.status === 'FAILED') counts.failed += 1;
        else if (result.status === 'CONFLICT') counts.conflicts += 1;
    }
    return counts;
}

function buildReport(results, { dryRun, totalRows, startedAt }) {
    const counts = countCounters(results);
    const byLocale = {};
    const byField = {};
    for (const result of results) {
        byLocale[result.locale] = (byLocale[result.locale] || 0) + 1;
        for (const match of result.matches || []) {
            byField[match.field] = (byField[match.field] || 0) + 1;
        }
    }
    const finishedAt = new Date().toISOString();
    return {
        dryRun: !!dryRun,
        totalFragments: results.length,
        totalRows,
        ...counts,
        startedAt,
        finishedAt,
        durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
        byLocale,
        byField,
    };
}

function isConflict(error) {
    return /status 412/.test(error.message || '');
}

function buildResult(item, status, error) {
    return {
        id: item.id,
        path: item.path,
        locale: item.locale,
        status,
        matches: item.rows.map((row) => ({ field: row.field, value: row.find })),
        ...(error ? { error } : {}),
    };
}

function buildDryRunResult(item, fragment, applied) {
    return {
        id: item.id,
        path: item.path,
        locale: item.locale,
        etag: fragment.etag,
        status: 'WOULD_REPLACE',
        title: applied.title,
        description: applied.description,
        fields: applied.fields,
        matches: item.rows.map((row) => ({ field: row.field, value: row.find })),
    };
}

async function putOrThrow(odinEndpoint, id, authToken, applied, etag) {
    const res = await putToOdin(odinEndpoint, id, authToken, {
        title: applied.title,
        description: applied.description,
        fields: applied.fields,
        etag,
    });
    if (!res.success) throw new Error(res.error || `PUT failed for ${id}`);
}

async function processFragment(item, { odinEndpoint, authToken, matchCase, dryRun, searchFind }) {
    try {
        const { fragment, etag } = await getFragmentWithEtag(odinEndpoint, item.id, authToken);
        const applied = applyReplacementsToFragment(fragment, item.rows, { matchCase, searchFind });
        if (!applied.changed) return buildResult(item, 'SKIPPED');
        if (dryRun) return buildDryRunResult(item, fragment, applied);

        try {
            await putOrThrow(odinEndpoint, item.id, authToken, applied, etag);
            return buildResult(item, 'REPLACED');
        } catch (error) {
            if (!isConflict(error)) throw error;
            const fresh = await getFragmentWithEtag(odinEndpoint, item.id, authToken);
            const reapplied = applyReplacementsToFragment(fresh.fragment, item.rows, { matchCase, searchFind });
            if (!reapplied.changed) return buildResult(item, 'SKIPPED');
            try {
                await putOrThrow(odinEndpoint, item.id, authToken, reapplied, fresh.etag);
                return buildResult(item, 'REPLACED');
            } catch (retryError) {
                if (isConflict(retryError)) return buildResult(item, 'CONFLICT');
                throw retryError;
            }
        }
    } catch (error) {
        logger.error(JSON.stringify({ event: 'bulk-edit-replace-fragment-error', fragmentId: item.id, error: error.message }));
        return buildResult(item, 'FAILED', error.message);
    }
}

async function finalizeReplaceExport(jobId, results, status, report, { dryRun, totalRows }) {
    await writeResults(jobId, results);
    const { exportedAt } = await writeJobExports(jobId, {
        items: results,
        report,
        type: 'replace',
        filteredByUpload: false,
        dryRun,
        userRows: null,
    });
    if (dryRun) {
        const modifiedFragments = results.filter((result) => result.status === 'WOULD_REPLACE');
        if (modifiedFragments.length) {
            await writeFullExport(jobId, 'replace', modifiedFragments);
        }
    }
    await patchJob(
        jobId,
        {
            status,
            total: totalRows,
            exportReady: true,
            exportedAt,
            results: [],
            ...countCounters(results),
        },
        JOB_CACHE_TTL,
    );
}

async function resolveStop(jobId, runId) {
    const fresh = await readJob(jobId);
    if (!fresh || fresh.runId !== runId) return 'SUPERSEDED';
    if (fresh.cancelled) return 'CANCELLED';
    return null;
}

async function runReplaceWorker(jobId, { odinEndpoint, authToken, runId, params = {} }) {
    if (!odinEndpoint) throw new Error('missing parameter(s) odinEndpoint');
    const job = await readJob(jobId);
    if (!job) throw new Error(`bulk-edit job ${jobId} not found`);

    const dryRun = !!job.dryRun;
    const matchCase = !!job.matchCase;
    const startedAt = job.startedAt || new Date().toISOString();
    const userCsv = await readUserCsv(job.findJobId);
    const findJob = await readJob(job.findJobId);
    const findItems = await resolveFindSourceItems(job.findJobId, findJob || {});
    const userRows = resolveReplaceRows(findItems, userCsv?.rows);
    const searchFind = findJob?.params?.find;
    const items = buildWorkPlan(userRows, job.replace, searchFind);

    const batchSize = Number.parseInt(params.batchSize, 10) || DEFAULT_BATCH_SIZE;
    const parsedBudget = Number.parseInt(params.softBudgetMs, 10);
    const softBudgetMs = Number.isFinite(parsedBudget) ? parsedBudget : DEFAULT_SOFT_BUDGET_MS;
    const runStart = Date.now();

    let results = job.results || [];
    let cursor = job.cursor || 0;
    logger.info(JSON.stringify({ event: 'bulk-edit-replace-worker-start', jobId, total: items.length, dryRun, cursor }));

    try {
        for (let i = cursor; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map((item) => processFragment(item, { odinEndpoint, authToken, matchCase, dryRun, searchFind })),
            );
            results = [...results, ...batchResults];
            cursor = i + batch.length;

            const stop = await resolveStop(jobId, runId);
            if (stop) {
                if (stop === 'CANCELLED') {
                    const report = buildReport(results, { dryRun, totalRows: userRows.length, startedAt });
                    await writeReport(jobId, report);
                    await finalizeReplaceExport(jobId, results, 'CANCELLED', report, { dryRun, totalRows: userRows.length });
                }
                return { status: stop, ...countCounters(results) };
            }

            if (dryRun) {
                await writeDryRun(jobId, results, JOB_RUNNING_TTL);
            }

            await patchJob(
                jobId,
                {
                    cursor,
                    total: items.length,
                    ...countCounters(results),
                    ...(dryRun ? {} : { results }),
                },
                JOB_RUNNING_TTL,
            );
            logger.info(
                JSON.stringify({
                    event: 'bulk-edit-replace-progress',
                    jobId,
                    cursor,
                    total: items.length,
                    ...countCounters(results),
                }),
            );

            if (Date.now() - runStart >= softBudgetMs && cursor < items.length) {
                const action = buildSiblingActionName(params, WORKER_ACTION);

                await invokeAsyncAction(action, { jobId, authToken, runId }, params);
                logger.info(JSON.stringify({ event: 'bulk-edit-replace-continued', jobId, cursor }));
                return { status: 'RUNNING', continued: true, ...countCounters(results) };
            }
        }

        const report = buildReport(results, { dryRun, totalRows: userRows.length, startedAt });
        await writeReport(jobId, report);
        await finalizeReplaceExport(jobId, results, 'DONE', report, { dryRun, totalRows: userRows.length });
        logger.info(JSON.stringify({ event: 'bulk-edit-replace-worker-done', jobId, ...countCounters(results) }));
        return { status: 'DONE', ...countCounters(results) };
    } catch (error) {
        if ((await resolveStop(jobId, runId)) === null) {
            await patchJob(jobId, { status: 'FAILED', error: error.message, cursor, ...countCounters(results) });
        }
        throw error;
    }
}

async function main(params) {
    const { jobId, odinEndpoint, authToken, runId } = params;
    try {
        const result = await runReplaceWorker(jobId, { odinEndpoint, authToken, runId, params });
        return { statusCode: 200, body: { jobId, ...result } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'bulk-edit-replace-worker-error', jobId, error: error.message }));
        return { statusCode: 500, body: { error: error.message } };
    }
}

module.exports = {
    main,
    runReplaceWorker,
    buildWorkPlan,
    countCounters,
    buildReport,
    processFragment,
    buildDryRunResult,
    finalizeReplaceExport,
};
exports.main = main;
