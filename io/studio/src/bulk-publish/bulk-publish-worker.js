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
    hasPendingSnapshot,
    addPendingMarker,
    removePendingMarker,
} = require('./project.js');

function relabelNotLocalized(details) {
    for (const detail of details) {
        if (detail.status === 'failed' && detail.reason === 'not-found') detail.reason = 'not-localized';
    }
}

function terminalStatus(result) {
    if (result.total === 0) return PROJECT_STATUS.PUBLISHED;
    if (result.published === 0) return PROJECT_STATUS.FAILED;
    if (result.failed === 0) return PROJECT_STATUS.PUBLISHED;
    return PROJECT_STATUS.PARTIALLY_PUBLISHED;
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

    const { projectId, odinEndpoint, authToken, publishedBy = '', includeCards = false, includeVariations = false } = input;
    const startedAt = now().toISOString();

    const { fragment } = await readProject(odinEndpoint, projectId, authToken);
    const paths = projPaths(fragment);
    const locales = projLocales(fragment);
    const title = projTitle(fragment);
    const existingSnapshots = projSnapshots(fragment);

    if (paths.length === 0 && !hasPendingSnapshot(existingSnapshots)) {
        await updateProject(odinEndpoint, projectId, authToken, {
            status: PROJECT_STATUS.FAILED,
            lastError: 'No fragments found in project',
        });
        logger.error(JSON.stringify({ event: 'worker-no-paths', projectId }));
        return {
            total: 0,
            published: 0,
            failed: 0,
            startedAt,
            finishedAt: now().toISOString(),
            reasons: {},
            failures: [],
            failuresTruncated: false,
        };
    }

    let snapshotEntries;
    let expandedPaths = null;
    if (hasPendingSnapshot(existingSnapshots)) {
        snapshotEntries = existingSnapshots;
        expandedPaths = existingSnapshots.map((e) => JSON.parse(e).path);
        await updateProject(odinEndpoint, projectId, authToken, { status: PROJECT_STATUS.PUBLISHING, lastError: '' });
    } else {
        const fresh = await snapshot({
            paths,
            projectId,
            projectTitle: title,
            odinEndpoint,
            authToken,
            includeCards,
            includeVariations,
        });
        snapshotEntries = fresh.entries;
        expandedPaths = fresh.expandedPaths;
        await updateProject(odinEndpoint, projectId, authToken, {
            status: PROJECT_STATUS.PUBLISHING,
            snapshots: addPendingMarker(snapshotEntries),
            lastError: '',
        });
    }

    const publishPaths = (includeCards || includeVariations) && expandedPaths ? expandedPaths : paths;
    const resolved = resolve(publishPaths, locales);
    const details = await publish(resolved, odinEndpoint, authToken, logger);
    relabelNotLocalized(details);
    details.push(...(await publishIndexes(details, odinEndpoint, authToken, logger)));

    const result = buildResult({ details, startedAt, finishedAt: now().toISOString() });
    const status = terminalStatus(result);
    const finalSnapshots = removePendingMarker(snapshotEntries);

    try {
        await updateProject(odinEndpoint, projectId, authToken, {
            status,
            snapshots: finalSnapshots,
            publishedAt: result.finishedAt,
            publishedBy,
            lastResult: JSON.stringify(result),
            lastError: '',
        });
    } catch (error) {
        throw Object.assign(error, { publishSucceeded: true, result, finalSnapshots, publishedBy });
    }

    logger.info(
        JSON.stringify({ event: 'worker-complete', projectId, status, published: result.published, failed: result.failed }),
    );
    return result;
}

// A crash between the Publishing write and the terminal write would strand the project in Publishing
// forever, so recover it here. When publish itself succeeded and only the status write failed, the
// cards are live: report the real outcome rather than a Failed that would invite a needless revert.
async function recoverStuckProject(error, input, deps, logger) {
    const updateProject = deps.updateProjectFragment || updateProjectFragment;
    const { projectId, odinEndpoint, authToken } = input;
    const message = error.message || String(error);

    const fields = error.publishSucceeded
        ? {
              status: terminalStatus(error.result),
              snapshots: error.finalSnapshots,
              publishedAt: error.result.finishedAt,
              publishedBy: error.publishedBy,
              lastResult: JSON.stringify(error.result),
              lastError: `Publish succeeded but the status write failed: ${message}`,
          }
        : { status: PROJECT_STATUS.FAILED, lastError: message };

    try {
        await updateProject(odinEndpoint, projectId, authToken, fields);
    } catch (writeError) {
        logger.error(
            JSON.stringify({
                event: 'worker-recovery-failed',
                projectId,
                error: writeError.message || String(writeError),
            }),
        );
    }
}

async function main(params, deps = {}) {
    const logger = deps.logger || Core.Logger('bulk-publish-worker', { level: 'info' });
    const doRunWorker = deps.runWorker || runWorker;
    const input = {
        projectId: params.projectId,
        odinEndpoint: params.aemOdinEndpoint || params.odinEndpoint,
        authToken: params.authToken,
        publishedBy: params.publishedBy || '',
        includeCards: params.includeCards || false,
        includeVariations: params.includeVariations || false,
    };
    try {
        const result = await doRunWorker(input, deps);
        return { statusCode: 200, body: result };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'worker-error', error: error.message || String(error) }));
        await recoverStuckProject(error, input, deps, logger);
        return { statusCode: 500, body: { error: error.message } };
    }
}

module.exports = { runWorker, terminalStatus, main };
