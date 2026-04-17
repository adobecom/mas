const { Core } = require('@adobe/aio-sdk');
const { buildSiblingActionName, invokeAsyncAction } = require('../common.js');
const { acquireQueueLock, releaseQueueLock, peekNextJob } = require('./queue.js');
const { getVersioningLock, isLockExpired } = require('./versioning-lock.js');
const { getJobPayload, patchProjectSummary } = require('./state.js');

const logger = Core.Logger('translation-dispatcher', { level: 'info' });
const WORKER_ACTION_NAME = 'translation-project-start-worker';

async function main(params) {
    try {
        const workerActionName = buildSiblingActionName(params, WORKER_ACTION_NAME, {
            overrideParamName: 'translationProjectStartWorkerActionName',
        });
        const result = await dispatchNextQueuedJob(params, {
            invokeWorker: async (jobId) => {
                return invokeAsyncAction(workerActionName, { jobId }, params);
            },
        });

        return {
            statusCode: 200,
            body: result,
        };
    } catch (error) {
        logger.error('Error dispatching queued translation job', error);
        return {
            statusCode: 500,
            body: {
                error: error.message,
            },
        };
    }
}

async function dispatchNextQueuedJob(params = {}, deps = {}) {
    const queueOwnerId = deps.queueOwnerId || params.dispatcherId || `dispatcher-${Date.now()}`;
    const now = deps.now || (() => new Date());
    const acquireLock = deps.acquireQueueLock || acquireQueueLock;
    const releaseLock = deps.releaseQueueLock || releaseQueueLock;
    const peekJob = deps.peekNextJob || peekNextJob;
    const getLock = deps.getVersioningLock || getVersioningLock;
    const isExpired = deps.isLockExpired || isLockExpired;
    const getPayload = deps.getJobPayload || getJobPayload;
    const patchSummary = deps.patchProjectSummary || patchProjectSummary;
    const invokeWorker = deps.invokeWorker;

    if (typeof invokeWorker !== 'function') {
        throw new Error('Dispatcher worker invoker is not configured');
    }

    const queueLock = await acquireLock(queueOwnerId, deps.lockOptions);
    if (!queueLock.acquired) {
        logger.info('Queue lock is already held, skipping dispatcher run');
        return {
            dispatched: false,
            reason: 'queue_locked',
        };
    }

    try {
        const nextJobId = await peekJob();
        if (!nextJobId) {
            return {
                dispatched: false,
                reason: 'empty_queue',
            };
        }

        const versioningLock = await getLock();
        if (versioningLock && !isExpired(versioningLock, { now })) {
            logger.info(`Versioning is busy for project ${versioningLock.projectId}, leaving job ${nextJobId} queued`);
            return {
                dispatched: false,
                reason: 'versioning_busy',
                jobId: nextJobId,
                versioningLock,
            };
        }

        const payload = await getPayload(nextJobId);
        if (!payload?.projectId) {
            return {
                dispatched: false,
                reason: 'missing_payload',
                jobId: nextJobId,
            };
        }

        const startedAt = now().toISOString();
        await patchSummary(payload.projectId, {
            queue: {
                state: 'STARTING',
                startedAt,
            },
            worker: {
                dispatchedAt: startedAt,
            },
        });

        const workerResult = await invokeWorker(nextJobId, params);

        await patchSummary(payload.projectId, {
            queue: {
                state: 'STARTING',
                startedAt,
            },
            worker: {
                activationId: workerResult?.activationId || null,
                dispatchedAt: startedAt,
            },
        });

        return {
            dispatched: true,
            jobId: nextJobId,
            projectId: payload.projectId,
            activationId: workerResult?.activationId || null,
        };
    } finally {
        await releaseLock(queueOwnerId);
    }
}

module.exports = {
    main,
    dispatchNextQueuedJob,
    WORKER_ACTION_NAME,
};
