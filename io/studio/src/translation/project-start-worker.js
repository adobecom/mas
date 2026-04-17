const { Core } = require('@adobe/aio-sdk');
const { buildSiblingActionName, invokeAsyncAction } = require('../common.js');
const { getJobPayload, deleteJobPayload, patchProjectSummary } = require('./state.js');
const { enqueueJob, removeJob } = require('./queue.js');
const { acquireVersioningLock, renewVersioningLock, releaseVersioningLock } = require('./versioning-lock.js');
const {
    prepareProjectStart,
    runVersioningStage,
    runPostVersioningStage,
    getVersioningItemCount,
    createProjectStartError,
    isProjectStartError,
    updateProjectStatus,
} = require('./project-start-service.js');

const logger = Core.Logger('translation-worker', { level: 'info' });
const RUNNING_STATUS = 'RUNNING';
const ASYNC_PROCESSING_STATUS = 'ASYNC_PROCESSING';
const QUEUED_STATUS = 'QUEUED';
const FAILED_STATUS = 'FAILED';
const DISPATCHER_ACTION_NAME = 'translation-project-dispatcher';
const DEFAULT_LOCK_RENEW_INTERVAL_MS = 30 * 1000;

async function main(params) {
    let lockOwner;
    let lockHeld = false;
    let heartbeat;
    let shouldTriggerDispatcher = false;
    let shouldDeleteJobPayload = false;
    let payload;

    try {
        if (!params.jobId) {
            return {
                statusCode: 400,
                body: {
                    error: 'Missing required parameter jobId',
                },
            };
        }

        payload = await getJobPayload(params.jobId);
        if (!payload?.projectId) {
            return {
                statusCode: 404,
                body: {
                    error: `Missing job payload for ${params.jobId}`,
                },
            };
        }
        shouldDeleteJobPayload = true;

        await patchWorkerStartedSummary(payload.projectId, params);
        await removeJobFromQueueOrWarn(params.jobId);
        const workerParams = createWorkerParams(params, payload);
        const context = await prepareProjectStart(workerParams);
        const versioningItemCount = getVersioningItemCount(context.translationData);
        lockOwner = createLockOwner(params, payload);
        const lockResult = await acquireVersioningLock(lockOwner);
        if (!lockResult.acquired) {
            shouldDeleteJobPayload = false;
            await requeueJobForVersioningRetry(params.jobId, payload.projectId, params);
            return {
                statusCode: 202,
                body: {
                    message: 'Versioning lock is already held, job requeued',
                    jobId: params.jobId,
                    projectId: payload.projectId,
                    queued: true,
                },
            };
        }
        lockHeld = true;
        shouldTriggerDispatcher = true;

        const versioningStartedAt = new Date().toISOString();
        await patchRunningSummary(payload.projectId, {
            params,
            updatedAt: versioningStartedAt,
            versioningStartedAt,
            versioningItemCount,
            batchSize: context.batchSize,
        });
        const { etag: runningStatusEtag } =
            (await syncProjectFragmentStatus(payload.projectId, RUNNING_STATUS, workerParams.authToken, workerParams)) ?? {};

        heartbeat = startVersioningLockHeartbeat(lockOwner);
        const versioningResult = await runVersioningStage(context, {
            onBatchCompleted: async ({ completedItemCount, failedItemCount }) => {
                await patchVersioningProgress(payload.projectId, {
                    params,
                    completedItemCount,
                    failedItemCount,
                    batchSize: context.batchSize,
                });
            },
        });
        const heartbeatError = await stopHeartbeat(heartbeat);
        heartbeat = null;

        const versioningCompletedAt = new Date().toISOString();
        await patchVersioningCompletion(payload.projectId, {
            params,
            updatedAt: versioningCompletedAt,
            versioningStartedAt,
            versioningCompletedAt,
            versioningItemCount: versioningResult.itemCount,
            completedItemCount: versioningResult.completedItemCount,
            failedItemCount: versioningResult.failedItemCount,
            batchSize: context.batchSize,
        });

        if (heartbeatError) {
            throw heartbeatError;
        }

        if (!versioningResult.success) {
            throw createProjectStartError(500, 'Failed to version target fragments', {
                preserveStatus: true,
            });
        }

        await releaseVersioningLockOrWarn(lockOwner, params.jobId);
        lockHeld = false;
        await triggerDispatcher(params);
        shouldTriggerDispatcher = false;

        const dispatchResult = await runPostVersioningStage(context);
        await patchAsyncProcessingSummary(payload.projectId, params);
        await syncProjectFragmentStatus(
            payload.projectId,
            ASYNC_PROCESSING_STATUS,
            workerParams.authToken,
            workerParams,
            runningStatusEtag,
        );

        return {
            statusCode: 200,
            body: dispatchResult,
        };
    } catch (error) {
        logger.error('Error running translation project-start worker', error);
        if (payload?.projectId) {
            if (error?.preserveStatus) {
                await patchProjectSummary(
                    payload.projectId,
                    {
                        lastError: getErrorMessage(error),
                    },
                    { params },
                );
            } else {
                await markProjectFailed(payload.projectId, getErrorMessage(error), params);
                if (payload.authToken) {
                    await syncProjectFragmentStatus(
                        payload.projectId,
                        FAILED_STATUS,
                        payload.authToken,
                        createWorkerParams(params, payload),
                    );
                }
            }
        }
        return toWorkerErrorResponse(error);
    } finally {
        const heartbeatError = await stopHeartbeat(heartbeat);
        if (heartbeatError) {
            logger.warn(`Versioning lock heartbeat failed for job ${params.jobId}: ${heartbeatError.message}`);
        }
        if (lockHeld && lockOwner) {
            await releaseVersioningLockOrWarn(lockOwner, params.jobId);
        }
        if (shouldTriggerDispatcher) {
            await triggerDispatcher(params);
        }
        if (shouldDeleteJobPayload && params.jobId) {
            await deleteJobPayloadOrWarn(params.jobId);
        }
    }
}

function createWorkerParams(params, payload) {
    const authToken = payload.authToken;
    return {
        ...params,
        ...payload,
        skipSubmissionDateUpdate: true,
        __ow_headers: authToken
            ? {
                  authorization: `Bearer ${authToken}`,
              }
            : params.__ow_headers,
    };
}

function createLockOwner(params, payload) {
    return {
        jobId: params.jobId,
        projectId: payload.projectId,
        activationId: params.__ow_activation_id || null,
    };
}

function buildDispatcherActionName(params = {}) {
    return buildSiblingActionName(params, DISPATCHER_ACTION_NAME, {
        overrideParamName: 'translationProjectStartDispatcherActionName',
    });
}

async function triggerDispatcher(params = {}) {
    const dispatcherActionName = buildDispatcherActionName(params);
    try {
        return await invokeAsyncAction(dispatcherActionName, {}, params);
    } catch (error) {
        logger.warn(`Failed to trigger dispatcher action ${dispatcherActionName}: ${error.message}`);
        return null;
    }
}

function startVersioningLockHeartbeat(owner, options = {}) {
    const intervalMs = options.intervalMs ?? DEFAULT_LOCK_RENEW_INTERVAL_MS;
    const renewLock = options.renewVersioningLock || renewVersioningLock;
    let timer = null;
    let stopped = false;
    let renewalError = null;

    const scheduleNext = () => {
        if (stopped || renewalError) {
            return;
        }
        timer = setTimeout(async () => {
            if (stopped) {
                return;
            }
            try {
                const result = await renewLock(owner, options.lockOptions);
                if (!result.renewed) {
                    renewalError = new Error(`Failed to renew versioning lock: ${result.reason}`);
                    return;
                }
                scheduleNext();
            } catch (error) {
                renewalError = error;
            }
        }, intervalMs);
        if (typeof timer.unref === 'function') {
            timer.unref();
        }
    };

    scheduleNext();

    return {
        stop: async () => {
            stopped = true;
            if (timer) {
                clearTimeout(timer);
            }
            return renewalError;
        },
    };
}

async function stopHeartbeat(heartbeat) {
    if (!heartbeat?.stop) {
        return null;
    }
    return heartbeat.stop();
}

async function markProjectFailed(projectId, response, params = {}) {
    return patchProjectSummary(
        projectId,
        {
            status: FAILED_STATUS,
            lastError: response,
        },
        { params },
    );
}

async function syncProjectFragmentStatus(projectId, status, authToken, params = {}, etag = null) {
    if (!authToken || !params?.odinEndpoint) {
        return null;
    }

    try {
        return await updateProjectStatus(projectId, status, authToken, params, etag);
    } catch (error) {
        logger.warn(`Failed to mirror project status ${status} for ${projectId}: ${error.message}`);
        return null;
    }
}

function toWorkerErrorResponse(error) {
    if (isProjectStartError(error)) {
        return {
            statusCode: error.statusCode,
            body: {
                error: error.message,
            },
        };
    }
    return {
        statusCode: 500,
        body: {
            error: getErrorMessage(error),
        },
    };
}

function getErrorMessage(response) {
    if (response?.error?.body?.error) {
        return response.error.body.error;
    }
    if (response?.body?.error) {
        return response.body.error;
    }
    if (response?.body?.message) {
        return response.body.message;
    }
    if (response?.message) {
        return response.message;
    }
    return 'Unknown error';
}

async function patchRunningSummary(projectId, { params, updatedAt, versioningStartedAt, versioningItemCount, batchSize }) {
    return patchProjectSummary(
        projectId,
        {
            status: RUNNING_STATUS,
            worker: {
                startedAt: updatedAt,
            },
            versioning: {
                startedAt: versioningStartedAt,
                itemCount: versioningItemCount,
                completedItemCount: 0,
                failedItemCount: 0,
                batchSize,
            },
            lastError: null,
        },
        { params, updatedAt },
    );
}

async function patchWorkerStartedSummary(projectId, params = {}) {
    return patchProjectSummary(
        projectId,
        {
            worker: {
                startedAt: new Date().toISOString(),
            },
        },
        { params },
    );
}

async function patchVersioningCompletion(
    projectId,
    {
        params,
        updatedAt,
        versioningStartedAt,
        versioningCompletedAt,
        versioningItemCount,
        completedItemCount,
        failedItemCount,
        batchSize,
    },
) {
    return patchProjectSummary(
        projectId,
        {
            status: RUNNING_STATUS,
            versioning: {
                completedAt: versioningCompletedAt,
                durationMs: new Date(versioningCompletedAt).getTime() - new Date(versioningStartedAt).getTime(),
                itemCount: versioningItemCount,
                completedItemCount,
                failedItemCount,
                batchSize,
            },
        },
        { params, updatedAt },
    );
}

async function patchVersioningProgress(projectId, { params, completedItemCount, failedItemCount, batchSize }) {
    return patchProjectSummary(
        projectId,
        {
            status: RUNNING_STATUS,
            versioning: {
                completedItemCount,
                failedItemCount,
                batchSize,
            },
        },
        { params },
    );
}

async function patchAsyncProcessingSummary(projectId, params = {}) {
    return patchProjectSummary(
        projectId,
        {
            status: ASYNC_PROCESSING_STATUS,
            lastError: null,
        },
        { params },
    );
}

async function requeueJobForVersioningRetry(jobId, projectId, params = {}) {
    await enqueueJob(jobId);
    return patchProjectSummary(
        projectId,
        {
            status: QUEUED_STATUS,
            queue: {
                state: QUEUED_STATUS,
                startedAt: null,
            },
            lastError: null,
        },
        { params },
    );
}

async function releaseVersioningLockOrWarn(lockOwner, jobId) {
    const released = await releaseVersioningLock(lockOwner);
    if (!released.released) {
        logger.warn(`Failed to release versioning lock for job ${jobId}: ${released.reason}`);
    }
}

async function deleteJobPayloadOrWarn(jobId) {
    try {
        await deleteJobPayload(jobId);
    } catch (error) {
        logger.warn(`Failed to delete job payload for ${jobId}: ${error.message}`);
    }
}

async function removeJobFromQueueOrWarn(jobId) {
    try {
        await removeJob(jobId);
    } catch (error) {
        logger.warn(`Failed to remove job ${jobId} from queue: ${error.message}`);
    }
}

module.exports = {
    main,
    createWorkerParams,
    createLockOwner,
    buildDispatcherActionName,
    triggerDispatcher,
    startVersioningLockHeartbeat,
    markProjectFailed,
    toWorkerErrorResponse,
    getErrorMessage,
    syncProjectFragmentStatus,
    patchWorkerStartedSummary,
    patchRunningSummary,
    patchVersioningProgress,
    patchVersioningCompletion,
    patchAsyncProcessingSummary,
    requeueJobForVersioningRetry,
    releaseVersioningLockOrWarn,
    deleteJobPayloadOrWarn,
    removeJobFromQueueOrWarn,
    DISPATCHER_ACTION_NAME,
    QUEUED_STATUS,
    RUNNING_STATUS,
    ASYNC_PROCESSING_STATUS,
    FAILED_STATUS,
    DEFAULT_LOCK_RENEW_INTERVAL_MS,
};
