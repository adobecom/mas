const { Core } = require('@adobe/aio-sdk');
const { getTargetPath } = require('../common.js');
const { extractLocale, publishResolved } = require('./publish-core.js');
const { resolvePaths } = require('./resolver.js');
const { rolloutLocales, waitForFragments } = require('./rollout.js');
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

const WORKER_STATUS = { PUBLISHED: 'Published', PARTIALLY_PUBLISHED: 'Partially published', FAILED: 'Failed' };

function selectRolloutItems({ details, sourcePaths, locales }) {
    if (!Array.isArray(locales) || locales.length === 0) return [];
    const selected = new Set(locales);

    const targetToSource = new Map();
    for (const source of sourcePaths) {
        for (const locale of locales) {
            const target = getTargetPath(source, locale);
            if (target) targetToSource.set(target, { source, locale });
        }
    }

    const bySource = new Map();
    for (const detail of details) {
        if (detail.status !== 'failed' || detail.reason !== 'not-found') continue;
        const locale = extractLocale(detail.path);
        if (!selected.has(locale)) continue;
        const origin = targetToSource.get(detail.path);
        if (!origin) continue;
        const list = bySource.get(origin.source) || [];
        list.push(origin.locale);
        bySource.set(origin.source, list);
    }

    return Array.from(bySource.entries()).map(([contentPath, targetLocales]) => ({ contentPath, targetLocales }));
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
    if (result.published === 0) return WORKER_STATUS.FAILED;
    if (result.failed === 0 && result.rolloutPending === 0) return WORKER_STATUS.PUBLISHED;
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
    const rollout = deps.rolloutLocales || rolloutLocales;
    const wait = deps.waitForFragments || waitForFragments;
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

    const resolved = resolve(paths, locales);
    const details = await publish(resolved, odinEndpoint, authToken, logger);

    const rolloutItems = selectRolloutItems({ details, sourcePaths: paths, locales });
    const rolledOut = [];
    let pending = [];

    if (rolloutItems.length > 0) {
        const ok = await rollout({ odinEndpoint, authToken, items: rolloutItems });
        if (ok) {
            const targetPaths = rolloutItems.flatMap((item) =>
                item.targetLocales.map((locale) => getTargetPath(item.contentPath, locale)).filter(Boolean),
            );
            const { ready, pending: stillPending } = await wait({ odinEndpoint, authToken, paths: targetPaths });
            pending = stillPending;
            if (ready.length > 0) {
                const readyDetails = await publish(ready, odinEndpoint, authToken, logger);
                for (const d of readyDetails) {
                    const idx = details.findIndex((x) => x.path === d.path);
                    if (idx >= 0) details[idx] = d;
                    if (d.status === 'published') {
                        rolledOut.push(d.path);
                    }
                }
            }
        } else {
            logger.error(JSON.stringify({ event: 'rollout-failed', items: rolloutItems.length }));
            for (const item of rolloutItems) {
                for (const locale of item.targetLocales) {
                    const targetPath = getTargetPath(item.contentPath, locale);
                    const d = details.find((x) => x.path === targetPath);
                    if (d) d.reason = 'rollout-failed';
                }
            }
        }
    }

    let snapshotEntries;
    if (hasPendingSnapshot(existingSnapshots)) {
        snapshotEntries = existingSnapshots;
        await updateProject(odinEndpoint, projectId, authToken, { status: PROJECT_STATUS.PUBLISHING, lastError: '' });
    } else {
        const snapshotPaths = Array.from(new Set([...paths, ...rolledOut]));
        const fresh = await snapshot({ paths: snapshotPaths, projectId, projectTitle: title, odinEndpoint, authToken });
        snapshotEntries = fresh;
        await updateProject(odinEndpoint, projectId, authToken, {
            status: PROJECT_STATUS.PUBLISHING,
            snapshots: addPendingMarker(fresh),
            lastError: '',
        });
    }

    const result = buildResult({ details, rolledOut, pending, startedAt, finishedAt: now().toISOString() });
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

module.exports = { selectRolloutItems, runWorker, terminalStatus, WORKER_STATUS, main };
