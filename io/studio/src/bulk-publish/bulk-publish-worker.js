const { Core } = require('@adobe/aio-sdk');
const { publishResolved, publishDictionaryIndexes } = require('./publish-core.js');
const { resolvePaths } = require('./resolver.js');
const { buildResult } = require('./summary.js');
const { createSnapshot } = require('./snapshot.js');
const {
    PROJECT_STATUS,
    readProjectFragment,
    updateProjectFragment,
    getProjectPaths,
    getProjectLocales,
    getProjectTitle,
    getProjectSnapshots,
} = require('./project.js');

// Contract: these strings must match BULK_PUBLISH_STATUS in studio/src/constants.js (UI side).
const WORKER_STATUS = { PUBLISHED: 'Published', PARTIALLY_PUBLISHED: 'Partially published', FAILED: 'Failed' };

function relabelNotLocalized(details) {
    for (const detail of details) {
        if (detail.status === 'failed' && detail.reason === 'not-found') detail.reason = 'not-localized';
    }
}

function hasPendingSnapshot(entries) {
    if (!entries.length) return false;
    try {
        return entries.some((e) => JSON.parse(e).publishComplete === false);
    } catch {
        return false;
    }
}

function addPendingMarker(entries) {
    return entries.map((e) => JSON.stringify({ ...JSON.parse(e), publishComplete: false }));
}

function removePendingMarker(entries) {
    return entries.map((e) => {
        const { publishComplete, ...rest } = JSON.parse(e);
        return JSON.stringify(rest);
    });
}

function terminalStatus(result) {
    if (result.total === 0) return WORKER_STATUS.PUBLISHED;
    if (result.published === 0) return WORKER_STATUS.FAILED;
    if (result.failed === 0) return WORKER_STATUS.PUBLISHED;
    return WORKER_STATUS.PARTIALLY_PUBLISHED;
}

async function runWorker(input, deps = {}) {
    const logger = deps.logger || Core.Logger('bulk-publish-worker', { level: 'info' });
    const readProject = deps.readProjectFragment || readProjectFragment;
    const projPaths = deps.getProjectPaths || getProjectPaths;
    const projLocales = deps.getProjectLocales || getProjectLocales;
    const projTitle = deps.getProjectTitle || getProjectTitle;
    const projSnapshots = deps.getProjectSnapshots || getProjectSnapshots;
    const publish = deps.publishResolved || publishResolved;
    const publishIndexes = deps.publishDictionaryIndexes || publishDictionaryIndexes;
    const snapshot = deps.createSnapshot || createSnapshot;
    const updateProject = deps.updateProjectFragment || updateProjectFragment;
    const resolve = deps.resolvePaths || resolvePaths;
    const now = deps.now || (() => new Date());

    const { projectId, odinEndpoint, authToken, publishedBy = '' } = input;
    const startedAt = now().toISOString();

    const { fragment } = await readProject(odinEndpoint, projectId, authToken);
    const paths = projPaths(fragment);
    const locales = projLocales(fragment);
    const title = projTitle(fragment);
    const existingSnapshots = projSnapshots(fragment);

    let snapshotEntries;
    if (hasPendingSnapshot(existingSnapshots)) {
        snapshotEntries = existingSnapshots;
        await updateProject(odinEndpoint, projectId, authToken, { status: PROJECT_STATUS.PUBLISHING, lastError: '' });
    } else {
        const fresh = await snapshot({ paths, projectId, projectTitle: title, odinEndpoint, authToken });
        snapshotEntries = fresh;
        await updateProject(odinEndpoint, projectId, authToken, {
            status: PROJECT_STATUS.PUBLISHING,
            snapshots: addPendingMarker(fresh),
            lastError: '',
        });
    }

    const resolved = resolve(paths, locales);
    const details = await publish(resolved, odinEndpoint, authToken, logger);
    relabelNotLocalized(details);
    details.push(...(await publishIndexes(details, odinEndpoint, authToken, logger)));

    const result = buildResult({ details, startedAt, finishedAt: now().toISOString() });
    const status = terminalStatus(result);
    const finalSnapshots = removePendingMarker(snapshotEntries);

    await updateProject(odinEndpoint, projectId, authToken, {
        status,
        snapshots: finalSnapshots,
        publishedAt: result.finishedAt,
        publishedBy,
        lastResult: JSON.stringify(result),
        lastError: '',
    });

    logger.info(
        JSON.stringify({ event: 'worker-complete', projectId, status, published: result.published, failed: result.failed }),
    );
    return result;
}

async function main(params) {
    const logger = Core.Logger('bulk-publish-worker', { level: 'info' });
    try {
        const result = await runWorker({
            projectId: params.projectId,
            odinEndpoint: params.aemOdinEndpoint || params.odinEndpoint,
            authToken: params.authToken,
            publishedBy: params.publishedBy || '',
        });
        return { statusCode: 200, body: result };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'worker-error', error: error.message || String(error) }));
        return { statusCode: 500, body: { error: error.message } };
    }
}

module.exports = { runWorker, terminalStatus, WORKER_STATUS, main };
