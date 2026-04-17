const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');
const common = require('../../src/common.js');

chai.use(sinonChai);

const { expect } = chai;

describe('Translation project-start worker', function () {
    this.timeout(5000);
    let mockLogger;
    let getJobPayload;
    let deleteJobPayload;
    let patchProjectSummary;
    let enqueueJob;
    let removeJob;
    let acquireVersioningLock;
    let renewVersioningLock;
    let releaseVersioningLock;
    let prepareProjectStart;
    let runVersioningStage;
    let runPostVersioningStage;
    let getVersioningItemCount;
    let createProjectStartError;
    let isProjectStartError;
    let updateProjectStatus;
    let buildSiblingActionName;
    let invokeAsyncAction;
    let worker;

    beforeEach(() => {
        mockLogger = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };
        getJobPayload = sinon.stub();
        deleteJobPayload = sinon.stub().resolves();
        patchProjectSummary = sinon.stub().resolves();
        enqueueJob = sinon.stub().resolves();
        removeJob = sinon.stub().resolves();
        acquireVersioningLock = sinon.stub();
        renewVersioningLock = sinon.stub().resolves({ renewed: true });
        releaseVersioningLock = sinon.stub().resolves({ released: true });
        prepareProjectStart = sinon.stub();
        runVersioningStage = sinon.stub();
        runPostVersioningStage = sinon.stub();
        getVersioningItemCount = sinon.stub();
        createProjectStartError = (statusCode, message, options = {}) =>
            Object.assign(new Error(message), { statusCode }, options);
        isProjectStartError = sinon.stub().returns(false);
        updateProjectStatus = sinon.stub().resolves({ success: true });
        buildSiblingActionName = sinon.stub().returns('/ns/MerchAtScaleStudio/translation-project-dispatcher');
        invokeAsyncAction = sinon.stub().resolves({ activationId: 'dispatcher-activation-1' });

        worker = proxyquire('../../src/translation/project-start-worker.js', {
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(mockLogger),
                },
            },
            './state.js': {
                getJobPayload,
                deleteJobPayload,
                patchProjectSummary,
            },
            './queue.js': {
                enqueueJob,
                removeJob,
            },
            './versioning-lock.js': {
                acquireVersioningLock,
                renewVersioningLock,
                releaseVersioningLock,
            },
            './project-start-service.js': {
                prepareProjectStart,
                runVersioningStage,
                runPostVersioningStage,
                getVersioningItemCount,
                createProjectStartError,
                isProjectStartError,
                updateProjectStatus,
            },
            '../common.js': {
                ...common,
                buildSiblingActionName,
                invokeAsyncAction,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return 400 when jobId is missing', async () => {
        const result = await worker.main({});

        expect(result).to.deep.equal({
            statusCode: 400,
            body: {
                error: 'Missing required parameter jobId',
            },
        });
    });

    it('should return 404 when the job payload does not exist', async () => {
        getJobPayload.resolves(null);

        const result = await worker.main({
            jobId: 'job-1',
        });

        expect(result).to.deep.equal({
            statusCode: 404,
            body: {
                error: 'Missing job payload for job-1',
            },
        });
    });

    it('should run the worker stages, release the lock, and trigger the dispatcher', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
            surface: 'acom',
            translationFlow: 'transcreation',
        });
        prepareProjectStart.resolves({
            translationData: {
                itemsToTranslate: ['/content/dam/mas/acom/en_US/fragment1'],
                itemsToSync: [],
                locales: ['de_DE'],
            },
            batchSize: 7,
            responseMessage: 'ok',
        });
        getVersioningItemCount.returns(5);
        acquireVersioningLock.resolves({
            acquired: true,
        });
        runVersioningStage.callsFake(async (context, options = {}) => {
            if (options.onBatchCompleted) {
                await options.onBatchCompleted({
                    completedItemCount: 3,
                    failedItemCount: 0,
                });
                await options.onBatchCompleted({
                    completedItemCount: 5,
                    failedItemCount: 0,
                });
            }
            return {
                success: true,
                itemCount: 5,
                completedItemCount: 5,
                failedItemCount: 0,
            };
        });
        runPostVersioningStage.resolves({
            message: 'ok',
        });

        const result = await worker.main({
            jobId: 'job-1',
            __ow_activation_id: 'activation-1',
            allowedClientId: 'mas-studio',
            odinEndpoint: 'https://odin.example.com',
            batchSize: 7,
        });

        expect(acquireVersioningLock).to.have.been.calledOnceWith({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });
        expect(prepareProjectStart).to.have.been.calledOnce;
        expect(removeJob).to.have.been.calledOnceWith('job-1');
        expect(prepareProjectStart.firstCall.args[0]).to.deep.equal({
            jobId: 'job-1',
            __ow_activation_id: 'activation-1',
            allowedClientId: 'mas-studio',
            odinEndpoint: 'https://odin.example.com',
            projectId: 'project-1',
            authToken: 'token-1',
            surface: 'acom',
            batchSize: 7,
            translationFlow: 'transcreation',
            skipSubmissionDateUpdate: true,
            __ow_headers: {
                authorization: 'Bearer token-1',
            },
        });
        expect(runVersioningStage).to.have.been.calledOnce;
        expect(runPostVersioningStage).to.have.been.calledOnce;
        expect(updateProjectStatus.firstCall).to.have.been.calledWith(
            'project-1',
            'RUNNING',
            'token-1',
            sinon.match({
                jobId: 'job-1',
                odinEndpoint: 'https://odin.example.com',
                projectId: 'project-1',
                authToken: 'token-1',
            }),
        );
        expect(releaseVersioningLock).to.have.been.calledOnceWith({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });
        expect(buildSiblingActionName).to.have.been.calledOnceWith(
            {
                jobId: 'job-1',
                __ow_activation_id: 'activation-1',
                allowedClientId: 'mas-studio',
                odinEndpoint: 'https://odin.example.com',
                batchSize: 7,
            },
            'translation-project-dispatcher',
            {
                overrideParamName: 'translationProjectStartDispatcherActionName',
            },
        );
        expect(invokeAsyncAction).to.have.been.calledOnceWith(
            '/ns/MerchAtScaleStudio/translation-project-dispatcher',
            {},
            {
                jobId: 'job-1',
                __ow_activation_id: 'activation-1',
                allowedClientId: 'mas-studio',
                odinEndpoint: 'https://odin.example.com',
                batchSize: 7,
            },
        );
        expect(patchProjectSummary.firstCall).to.have.been.calledWith(
            'project-1',
            sinon.match({
                worker: sinon.match({
                    startedAt: sinon.match.string,
                }),
            }),
        );
        expect(patchProjectSummary.secondCall).to.have.been.calledWith(
            'project-1',
            sinon.match({
                status: 'RUNNING',
                worker: sinon.match({
                    startedAt: sinon.match.string,
                }),
                versioning: sinon.match({
                    itemCount: 5,
                    completedItemCount: 0,
                    failedItemCount: 0,
                    batchSize: 7,
                }),
            }),
        );
        expect(patchProjectSummary.getCall(2)).to.have.been.calledWith(
            'project-1',
            sinon.match({
                status: 'RUNNING',
                versioning: sinon.match({
                    completedItemCount: 3,
                    failedItemCount: 0,
                    batchSize: 7,
                }),
            }),
        );
        expect(patchProjectSummary.getCall(3)).to.have.been.calledWith(
            'project-1',
            sinon.match({
                status: 'RUNNING',
                versioning: sinon.match({
                    completedItemCount: 5,
                    failedItemCount: 0,
                    batchSize: 7,
                }),
            }),
        );
        expect(patchProjectSummary.getCall(4)).to.have.been.calledWith(
            'project-1',
            sinon.match({
                status: 'RUNNING',
                versioning: sinon.match({
                    itemCount: 5,
                    completedItemCount: 5,
                    failedItemCount: 0,
                    batchSize: 7,
                }),
            }),
        );
        expect(patchProjectSummary.getCall(5)).to.have.been.calledWith(
            'project-1',
            sinon.match({
                status: 'ASYNC_PROCESSING',
                lastError: null,
            }),
        );
        expect(updateProjectStatus.secondCall).to.have.been.calledWith(
            'project-1',
            'ASYNC_PROCESSING',
            'token-1',
            sinon.match({
                jobId: 'job-1',
                odinEndpoint: 'https://odin.example.com',
                projectId: 'project-1',
                authToken: 'token-1',
            }),
        );
        expect(deleteJobPayload).to.have.been.calledOnceWith('job-1');
        expect(result).to.deep.equal({
            statusCode: 200,
            body: {
                message: 'ok',
            },
        });
    });

    it('should requeue the job when the versioning lock is held by another worker', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        prepareProjectStart.resolves({
            translationData: {
                itemsToTranslate: [],
                itemsToSync: [],
                locales: [],
            },
            batchSize: 10,
        });
        getVersioningItemCount.returns(0);
        acquireVersioningLock.resolves({
            acquired: false,
            reason: 'locked',
        });

        const result = await worker.main({
            jobId: 'job-1',
        });

        expect(runVersioningStage).to.not.have.been.called;
        expect(releaseVersioningLock).to.not.have.been.called;
        expect(updateProjectStatus).to.not.have.been.called;
        expect(deleteJobPayload).to.not.have.been.called;
        expect(removeJob).to.have.been.calledOnceWith('job-1');
        expect(enqueueJob).to.have.been.calledOnceWith('job-1');
        expect(patchProjectSummary.firstCall).to.have.been.calledWith(
            'project-1',
            sinon.match({
                worker: sinon.match({
                    startedAt: sinon.match.string,
                }),
            }),
            {
                params: {
                    jobId: 'job-1',
                },
            },
        );
        expect(patchProjectSummary.secondCall).to.have.been.calledWith(
            'project-1',
            {
                status: 'QUEUED',
                queue: {
                    state: 'QUEUED',
                    startedAt: null,
                },
                lastError: null,
            },
            {
                params: {
                    jobId: 'job-1',
                },
            },
        );
        expect(result).to.deep.equal({
            statusCode: 202,
            body: {
                message: 'Versioning lock is already held, job requeued',
                jobId: 'job-1',
                projectId: 'project-1',
                queued: true,
            },
        });
    });

    it('should preserve RUNNING status and record progress when versioning has failed items', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        prepareProjectStart.resolves({
            translationData: {
                itemsToTranslate: [],
                itemsToSync: [],
                locales: [],
            },
            batchSize: 10,
        });
        getVersioningItemCount.returns(0);
        acquireVersioningLock.resolves({
            acquired: true,
        });
        isProjectStartError.callsFake((error) => Number.isInteger(error?.statusCode));
        runVersioningStage.callsFake(async (context, options = {}) => {
            if (options.onBatchCompleted) {
                await options.onBatchCompleted({
                    completedItemCount: 8,
                    failedItemCount: 2,
                });
            }
            return {
                success: false,
                itemCount: 10,
                completedItemCount: 8,
                failedItemCount: 2,
            };
        });

        const result = await worker.main({
            jobId: 'job-1',
        });

        expect(removeJob).to.have.been.calledOnceWith('job-1');
        expect(releaseVersioningLock).to.have.been.calledOnce;
        expect(runPostVersioningStage).to.not.have.been.called;
        expect(patchProjectSummary).to.have.been.calledWith(
            'project-1',
            sinon.match({
                versioning: sinon.match({
                    completedItemCount: 8,
                    failedItemCount: 2,
                }),
            }),
        );
        expect(patchProjectSummary.lastCall).to.have.been.calledWith(
            'project-1',
            sinon.match({
                lastError: 'Failed to version target fragments',
            }),
            {
                params: {
                    jobId: 'job-1',
                },
            },
        );
        expect(updateProjectStatus).to.not.have.been.called;
        expect(deleteJobPayload).to.have.been.calledOnceWith('job-1');
        expect(result).to.deep.equal({
            statusCode: 500,
            body: {
                error: 'Failed to version target fragments',
            },
        });
    });

    it('should continue cleanup and return a generic error when prepareProjectStart fails after the worker starts', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        prepareProjectStart.rejects(new Error('prepare failed'));

        const result = await worker.main({
            jobId: 'job-1',
        });

        expect(removeJob).to.have.been.calledOnceWith('job-1');
        expect(patchProjectSummary.firstCall).to.have.been.calledWith(
            'project-1',
            sinon.match({
                worker: sinon.match({
                    startedAt: sinon.match.string,
                }),
            }),
        );
        expect(patchProjectSummary.secondCall).to.have.been.calledWith(
            'project-1',
            {
                status: 'FAILED',
                lastError: 'prepare failed',
            },
            {
                params: {
                    jobId: 'job-1',
                },
            },
        );
        expect(updateProjectStatus).to.not.have.been.called;
        expect(deleteJobPayload).to.have.been.calledOnceWith('job-1');
        expect(result).to.deep.equal({
            statusCode: 500,
            body: {
                error: 'prepare failed',
            },
        });
    });

    it('should warn and return null when triggering the dispatcher fails', async () => {
        invokeAsyncAction.rejects(new Error('dispatch invoke failed'));

        const result = await worker.triggerDispatcher({
            __ow_action_name: '/ns/MerchAtScaleStudio/translation-project-start-worker',
        });

        expect(result).to.equal(null);
        expect(mockLogger.warn).to.have.been.calledOnce;
    });

    it('should warn when releasing the versioning lock fails', async () => {
        releaseVersioningLock.resolves({
            released: false,
            reason: 'not_owner',
        });

        await worker.releaseVersioningLockOrWarn(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            'job-1',
        );

        expect(mockLogger.warn).to.have.been.calledOnceWith('Failed to release versioning lock for job job-1: not_owner');
    });

    it('should warn when deleting the job payload fails', async () => {
        deleteJobPayload.rejects(new Error('delete failed'));

        await worker.deleteJobPayloadOrWarn('job-1');

        expect(mockLogger.warn).to.have.been.calledOnceWith('Failed to delete job payload for job-1: delete failed');
    });

    it('should warn when removing the job from the queue fails', async () => {
        removeJob.rejects(new Error('remove failed'));

        await worker.removeJobFromQueueOrWarn('job-1');

        expect(mockLogger.warn).to.have.been.calledOnceWith('Failed to remove job job-1 from queue: remove failed');
    });

    it('should expose fallback error messages for worker helper responses', () => {
        expect(worker.getErrorMessage({ body: { message: 'body message' } })).to.equal('body message');
        expect(worker.getErrorMessage({ message: 'plain message' })).to.equal('plain message');
        expect(worker.getErrorMessage({})).to.equal('Unknown error');
    });

    it('should return project-start and generic error responses from helper', () => {
        isProjectStartError.onFirstCall().returns(true);
        isProjectStartError.onSecondCall().returns(false);

        const structured = worker.toWorkerErrorResponse({
            statusCode: 409,
            message: 'structured failure',
        });
        const generic = worker.toWorkerErrorResponse({
            body: {
                message: 'generic body message',
            },
        });

        expect(structured).to.deep.equal({
            statusCode: 409,
            body: {
                error: 'structured failure',
            },
        });
        expect(generic).to.deep.equal({
            statusCode: 500,
            body: {
                error: 'generic body message',
            },
        });
    });

    it('should stop the heartbeat with a renewal error when the lock can no longer be renewed', async () => {
        const clock = sinon.useFakeTimers();
        renewVersioningLock.resolves({
            renewed: false,
            reason: 'expired',
        });

        const heartbeat = worker.startVersioningLockHeartbeat(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                intervalMs: 10,
                renewVersioningLock,
            },
        );

        await clock.tickAsync(10);
        const error = await heartbeat.stop();

        expect(error).to.be.an('error');
        expect(error.message).to.equal('Failed to renew versioning lock: expired');
        clock.restore();
    });
});
