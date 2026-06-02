const { Core } = require('@adobe/aio-sdk');
const { buildSiblingActionName, invokeAsyncAction } = require('../common.js');
const { getJobPayload, deleteJobPayload, patchProjectSummary } = require('./state.js');
const { removeJob } = require('./queue.js');
const { acquireWorkerSlot, renewWorkerSlot, releaseWorkerSlot, DEFAULT_CAPACITY } = require('./worker-slots.js');
const {
    prepareProjectStart,
    runSyncAndLocStage,
    isProjectStartError,
    updateProjectStatus,
} = require('./project-start-service.js');

const logger = Core.Logger('translation-worker', { level: 'info' });
const RUNNING_STATUS = 'RUNNING';
const ASYNC_PROCESSING_STATUS = 'ASYNC_PROCESSING';
const QUEUED_STATUS = 'QUEUED';
const FAILED_STATUS = 'FAILED';
const DISPATCHER_ACTION_NAME = 'translation-project-dispatcher';
const DEFAULT_SLOT_RENEW_INTERVAL_MS = 30 * 1000;

async function main(params) {
    let slotOwner;
    let slotHeld = false;
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
        const workerParams = createWorkerParams(params, payload);
        slotOwner = createSlotOwner(params, payload);
        const capacity = Number(params.workerConcurrency) || DEFAULT_CAPACITY;
        const slotResult = await acquireWorkerSlot(slotOwner, { capacity });
        if (!slotResult.acquired) {
            shouldDeleteJobPayload = false;
            await markProjectQueued(payload.projectId, params);
            return {
                statusCode: 202,
                body: {
                    message: 'No worker slot available, job left queued',
                    jobId: params.jobId,
                    projectId: payload.projectId,
                    queued: true,
                },
            };
        }
        slotHeld = true;
        shouldTriggerDispatcher = true;
        await removeJobFromQueueOrWarn(params.jobId);

        heartbeat = startWorkerSlotHeartbeat(slotOwner);

        const context = await prepareProjectStart(workerParams);

        const startedAt = new Date().toISOString();
        await patchRunningSummary(payload.projectId, { params, updatedAt: startedAt });
        const { etag: runningStatusEtag } =
            (await syncProjectFragmentStatus(payload.projectId, RUNNING_STATUS, workerParams.authToken, workerParams)) ?? {};

        const dispatchResult = await runSyncAndLocStage(context);

        const heartbeatError = await stopHeartbeat(heartbeat);
        heartbeat = null;
        if (heartbeatError) {
            throw heartbeatError;
        }

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
            logger.warn(`Worker slot heartbeat failed for job ${params.jobId}: ${heartbeatError.message}`);
        }
        if (slotHeld && slotOwner) {
            await releaseWorkerSlotOrWarn(slotOwner, params.jobId);
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

function createSlotOwner(params, payload) {
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

function startWorkerSlotHeartbeat(owner, options = {}) {
    const intervalMs = options.intervalMs ?? DEFAULT_SLOT_RENEW_INTERVAL_MS;
    const renewSlot = options.renewWorkerSlot || renewWorkerSlot;
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
                const result = await renewSlot(owner, options.slotOptions);
                if (!result.renewed) {
                    renewalError = new Error(`Failed to renew worker slot: ${result.reason}`);
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

async function patchRunningSummary(projectId, { params, updatedAt }) {
    return patchProjectSummary(
        projectId,
        {
            status: RUNNING_STATUS,
            worker: {
                startedAt: updatedAt,
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

async function markProjectQueued(projectId, params = {}) {
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

async function releaseWorkerSlotOrWarn(slotOwner, jobId) {
    const released = await releaseWorkerSlot(slotOwner);
    if (!released.released) {
        logger.warn(`Failed to release worker slot for job ${jobId}: ${released.reason}`);
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
    createSlotOwner,
    buildDispatcherActionName,
    triggerDispatcher,
    startWorkerSlotHeartbeat,
    markProjectFailed,
    toWorkerErrorResponse,
    getErrorMessage,
    syncProjectFragmentStatus,
    patchWorkerStartedSummary,
    patchRunningSummary,
    patchAsyncProcessingSummary,
    markProjectQueued,
    releaseWorkerSlotOrWarn,
    deleteJobPayloadOrWarn,
    removeJobFromQueueOrWarn,
    DISPATCHER_ACTION_NAME,
    QUEUED_STATUS,
    RUNNING_STATUS,
    ASYNC_PROCESSING_STATUS,
    FAILED_STATUS,
    DEFAULT_SLOT_RENEW_INTERVAL_MS,
};
