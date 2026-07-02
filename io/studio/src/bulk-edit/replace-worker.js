const { Core } = require('@adobe/aio-sdk');
const {
    getFragmentWithEtag,
    patchToOdin,
    invokeAsyncAction,
    buildSiblingActionName,
    isOdinRateLimitError,
} = require('../common.js');
const { applyCsvValuesToFragment, buildWorkPlan, resolveReplaceRows, normalizeEtag } = require('./replace.js');
const { resolveFindSourceItems, writeJobExports, writeFullExport } = require('./bulk-edit.js');
const { BULK_EDIT_USER_AGENT } = require('./search.js');
const {
    readJob,
    patchJob,
    readUserCsv,
    readDryRun,
    writeDryRun,
    writeReport,
    writeResults,
    JOB_CACHE_TTL,
    JOB_RUNNING_TTL,
} = require('./state.js');

const logger = Core.Logger('bulk-edit-replace-worker', { level: 'info' });

const WORKER_ACTION = 'bulk-edit-replace-worker';
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_SOFT_BUDGET_MS = 25 * 60 * 1000;
const ODIN_429_COOLDOWN_MS = 60000;
const ODIN_429_JITTER_MS = 5000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Odin enforces a static ~60s cooldown once it starts 429ing a client. A per-fragment retry loop
// with its own backoff always lands inside that window and just burns attempts; worse, a batch of
// concurrent fragments all discover the 429 independently and all retry in lockstep. This gate is
// shared across one worker invocation's fragments so the first 429 makes everyone else wait out
// the real cooldown instead of re-tripping it.
function createRateLimitGate() {
    return { cooldownUntil: 0 };
}

async function awaitRateLimitGate(gate) {
    const wait = gate.cooldownUntil - Date.now();
    if (wait > 0) await sleep(wait);
}

function tripRateLimitGate(gate) {
    const cooldown = Date.now() + ODIN_429_COOLDOWN_MS + Math.floor(Math.random() * ODIN_429_JITTER_MS);
    gate.cooldownUntil = Math.max(gate.cooldownUntil, cooldown);
}

async function runGated(gate, fn) {
    await awaitRateLimitGate(gate);
    try {
        return await fn();
    } catch (error) {
        if (isOdinRateLimitError(error)) {
            tripRateLimitGate(gate);
            logger.warn(
                JSON.stringify({
                    event: 'bulk-edit-replace-429-cooldown',
                    cooldownUntil: new Date(gate.cooldownUntil).toISOString(),
                    error: error.message,
                }),
            );
        }
        throw error;
    }
}

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

function buildResult(item, status, extras = {}) {
    return {
        id: item.id,
        path: item.path,
        locale: item.locale,
        status,
        matches: item.rows.map((row) => ({ field: row.field, value: row.find })),
        ...extras,
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

function etagMismatchResult(item, csvEtag, serverEtag) {
    return buildResult(item, 'SKIPPED', {
        reason: 'etag_mismatch',
        csvEtag,
        serverEtag,
    });
}

async function patchOrThrow(odinEndpoint, id, authToken, patchBody, etag, gate = createRateLimitGate()) {
    await runGated(gate, async () => {
        const res = await patchToOdin(odinEndpoint, id, authToken, patchBody, etag, BULK_EDIT_USER_AGENT);
        if (!res.success) throw new Error(res.error || `PATCH failed for ${id}`);
    });
}

async function processFragment(item, { odinEndpoint, authToken, matchCase, dryRun, gate = createRateLimitGate() }) {
    try {
        const { fragment, etag: serverEtag } = await runGated(gate, () =>
            getFragmentWithEtag(odinEndpoint, item.id, authToken, BULK_EDIT_USER_AGENT),
        );
        const csvEtag = item.etag;
        if (normalizeEtag(serverEtag) !== normalizeEtag(csvEtag)) {
            return etagMismatchResult(item, csvEtag, serverEtag);
        }

        const applied = applyCsvValuesToFragment(fragment, item.rows, { matchCase });
        if (!applied.changed) return buildResult(item, 'SKIPPED', { reason: 'unchanged' });
        if (dryRun) return buildDryRunResult(item, fragment, applied);

        try {
            await patchOrThrow(odinEndpoint, item.id, authToken, applied.patches, csvEtag, gate);
            return buildResult(item, 'REPLACED');
        } catch (error) {
            if (isConflict(error)) return etagMismatchResult(item, csvEtag, serverEtag);
            throw error;
        }
    } catch (error) {
        logger.error(JSON.stringify({ event: 'bulk-edit-replace-fragment-error', fragmentId: item.id, error: error.message }));
        return buildResult(item, 'FAILED', { error: error.message });
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
    const findParams = findJob?.params || {};
    const userRows = resolveReplaceRows(findItems, userCsv?.rows, findParams);
    const items = buildWorkPlan(userRows);

    const batchSize = Number.parseInt(params.batchSize, 10) || DEFAULT_BATCH_SIZE;
    const parsedBudget = Number.parseInt(params.softBudgetMs, 10);
    const softBudgetMs = Number.isFinite(parsedBudget) ? parsedBudget : DEFAULT_SOFT_BUDGET_MS;
    const parsedRps = Number.parseInt(params.rpsLimit, 10);
    const rpsLimit = Number.isFinite(parsedRps) && parsedRps > 0 ? parsedRps : null;
    const minBatchMs = rpsLimit ? (batchSize / rpsLimit) * 1000 : 0;
    const runStart = Date.now();

    let cursor = job.cursor || 0;
    // Dry-run batches are persisted to the dry-run store, not job.results (patchJob omits results
    // for dry-runs), so a continued run must restore prior batches from there or it drops them.
    let results = job.results || [];
    if (dryRun && cursor > 0) {
        results = (await readDryRun(jobId)) || results;
    }
    const gate = createRateLimitGate();
    logger.info(JSON.stringify({ event: 'bulk-edit-replace-worker-start', jobId, total: items.length, dryRun, cursor }));

    try {
        for (let i = cursor; i < items.length; i += batchSize) {
            const batchStart = Date.now();
            const batch = items.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map((item) => processFragment(item, { odinEndpoint, authToken, matchCase, dryRun, gate })),
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

            // Proactively cap sustained PATCH rate so a steadily rate-limited Odin can't stall the
            // run for minutes via reactive 429 backoff alone; mirrors processBatchWithConcurrency.
            if (minBatchMs > 0) {
                const wait = minBatchMs - (Date.now() - batchStart);
                if (wait > 0) await sleep(wait);
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
    etagMismatchResult,
    finalizeReplaceExport,
    patchOrThrow,
    createRateLimitGate,
    tripRateLimitGate,
};
exports.main = main;
