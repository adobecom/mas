const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { invokeAsyncAction, buildSiblingActionName } = require('../common.js');

const logger = Core.Logger('bulk-publish', { level: 'info' });
const WORKER_ACTION_NAME = 'bulk-publish-worker';

function getSnapshotPaths(entries) {
    try {
        return entries.map((e) => JSON.parse(e).path).filter(Boolean);
    } catch {
        return [];
    }
}

async function main(params) {
    if (!params.projectId) params = parseOwBody(params);
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);

        const missing = checkMissingRequestInputs(params, ['projectId'], ['Authorization']);
        if (missing) return errorResponse(400, missing, logger);

        const authToken = getBearerToken(params);
        const allowed = await isAllowed(authToken, params.allowedClientId);
        if (!allowed) return errorResponse(401, 'Authorization failed', logger);

        const workerActionName = buildSiblingActionName(params, WORKER_ACTION_NAME, {
            overrideParamName: 'bulkPublishWorkerActionName',
        });
        const workerResult = await invokeAsyncAction(
            workerActionName,
            { projectId: params.projectId, publishedBy: params.publishedBy || '', authToken },
            params,
        );

        logger.info(
            JSON.stringify({ event: 'dispatched', projectId: params.projectId, activationId: workerResult?.activationId }),
        );
        return { statusCode: 202, body: { accepted: true, activationId: workerResult?.activationId || null } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'dispatch-error', error: error.message || String(error) }));
        return errorResponse(500, 'Internal server error', logger);
    }
}

async function publishOneChunk({ locale, paths }, odinEndpoint, authToken, filterReferencesByStatus) {
    logger.info(JSON.stringify({ event: 'chunk-start', locale, size: paths.length }));
    const results = await publishChunk({ chunk: paths, odinEndpoint, authToken, logger, filterReferencesByStatus });
    const counts = results.reduce(
        (acc, r) => {
            if (r.status === STATUS.PUBLISHED) acc.published += 1;
            else if (r.status === STATUS.FAILED) acc.failed += 1;
            return acc;
        },
        { published: 0, failed: 0 },
    );
    logger.info(JSON.stringify({ event: 'chunk-result', locale, size: paths.length, ...counts }));
    return results;
}

function extractLocale(path) {
    if (typeof path !== 'string') return 'unknown';
    const match = path.match(LOCALE_REGEX);
    return match?.groups?.locale || 'unknown';
}

function groupAndChunk(paths, maxChunkSize) {
    const groups = new Map();
    for (const path of paths) {
        const locale = extractLocale(path);
        const list = groups.get(locale);
        if (list) list.push(path);
        else groups.set(locale, [path]);
    }
    const chunks = [];
    for (const [locale, list] of groups) {
        for (let i = 0; i < list.length; i += maxChunkSize) {
            chunks.push({ locale, paths: list.slice(i, i + maxChunkSize) });
        }
    }
    return chunks;
}

function buildSummary(details) {
    const summary = { total: details.length, published: 0, skipped: 0, failed: 0 };
    for (const detail of details) {
        if (detail.status === STATUS.PUBLISHED) summary.published += 1;
        else if (detail.status === STATUS.SKIPPED) summary.skipped += 1;
        else if (detail.status === STATUS.FAILED) summary.failed += 1;
    }
    return summary;
}

async function runWithProject(params, odinEndpoint, authToken) {
    const { projectId, publishedBy = '', includeVariations = false, includeCards = false } = params;
    const filterReferencesByStatus = []; // snapshot controls traversal scope; cascade must not overshoot
    logger.info(JSON.stringify({ event: 'project-publish-start', projectId }));

    let fragment;
    try {
        const result = await readProjectFragment(odinEndpoint, projectId, authToken);
        fragment = result.fragment;
    } catch (err) {
        logger.error(JSON.stringify({ event: 'project-read-error', projectId, error: err.message }));
        return errorResponse(500, `Failed to read project fragment: ${err.message}`, logger);
    }

    const paths = getProjectPaths(fragment);
    const locales = getProjectLocales(fragment);
    const title = getProjectTitle(fragment);

    if (!paths.length) {
        return errorResponse(400, 'Project has no fragments', logger);
    }

    const existingEntries = getProjectSnapshots(fragment);
    let snapshotEntries;

    if (hasPendingSnapshot(existingEntries) && getSnapshotPaths(existingEntries).length > 0) {
        logger.info(JSON.stringify({ event: 'reuse-pending-snapshot', projectId }));
        snapshotEntries = existingEntries;
        try {
            await updateProjectFragment(odinEndpoint, projectId, authToken, {
                status: PROJECT_STATUS.PUBLISHING,
                lastError: '',
            });
        } catch (err) {
            return errorResponse(500, `Failed to update project status: ${err.message}`, logger);
        }
    } else {
        let freshEntries;
        try {
            freshEntries = await createSnapshot({
                paths,
                projectId,
                projectTitle: title,
                odinEndpoint,
                authToken,
                includeCards,
                includeVariations,
            });
        } catch (err) {
            logger.error(JSON.stringify({ event: 'snapshot-error', projectId, error: err.message }));
            await updateProjectFragment(odinEndpoint, projectId, authToken, {
                status: PROJECT_STATUS.DRAFT,
                lastError: err.message,
            }).catch(() => {});
            return { statusCode: 200, body: { status: PROJECT_STATUS.DRAFT, lastError: err.message } };
        }
        try {
            await updateProjectFragment(odinEndpoint, projectId, authToken, {
                status: PROJECT_STATUS.PUBLISHING,
                snapshots: addPendingMarker(freshEntries),
                lastError: '',
            });
        } catch (err) {
            return errorResponse(500, `Failed to update project status: ${err.message}`, logger);
        }
        snapshotEntries = freshEntries;
    }

    const allSnapshotPaths = getSnapshotPaths(snapshotEntries);
    const snapshotPathList = allSnapshotPaths.filter((p) => p.startsWith(PATH_PREFIX));
    const skipped = allSnapshotPaths.length - snapshotPathList.length;
    if (skipped > 0) {
        const skippedPaths = allSnapshotPaths.filter((p) => !p.startsWith(PATH_PREFIX));
        logger.warn(`Skipping ${skipped} snapshot path(s) not under ${PATH_PREFIX}: ${skippedPaths.join(', ')}`);
    }
    const resolved = snapshotPathList.length > 0 ? snapshotPathList : resolvePaths(paths, locales);
    if (resolved.length === 0) {
        await updateProjectFragment(odinEndpoint, projectId, authToken, {
            status: PROJECT_STATUS.DRAFT,
            lastError: 'No valid paths after locale resolution',
        }).catch(() => {});
        return { statusCode: 200, body: { status: PROJECT_STATUS.DRAFT, lastError: 'No valid paths after locale resolution' } };
    }
    if (resolved.length > MAX_RESOLVED) {
        return errorResponse(400, `Resolved ${resolved.length} paths exceeds maximum of ${MAX_RESOLVED}`, logger);
    }

    const chunks = groupAndChunk(resolved, MAX_CHUNK_SIZE);
    const details = [];
    for (const chunk of chunks) {
        const results = await publishOneChunk(chunk, odinEndpoint, authToken, filterReferencesByStatus);
        details.push(...results);
    }

    const summary = buildSummary(details);
    const failures = details.filter((d) => d.status === STATUS.FAILED);
    const finalStatus = failures.length === 0 ? PROJECT_STATUS.PUBLISHED : PROJECT_STATUS.DRAFT;
    const lastError = failures.map((f) => `${f.path}: ${f.reason}`).join('\n');
    const publishedAt = new Date().toISOString();
    const finalSnapshots = removePendingMarker(snapshotEntries);

    try {
        await updateProjectFragment(odinEndpoint, projectId, authToken, {
            status: finalStatus,
            snapshots: finalSnapshots,
            publishedAt,
            publishedBy,
            lastError,
        });
    } catch (err) {
        logger.error(JSON.stringify({ event: 'project-final-patch-error', projectId, error: err.message }));
        return errorResponse(
            500,
            'Content was published but project state could not be saved. Please retry — if the issue persists, contact support.',
            logger,
        );
    }

    logger.info(JSON.stringify({ event: 'project-publish-complete', projectId, finalStatus }));
    return {
        statusCode: 200,
        body: { status: finalStatus, lastError, snapshots: finalSnapshots, publishedAt, publishedBy, summary, details },
    };
}


exports.main = main;
