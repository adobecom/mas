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
    let putTaskIndex;
    let removeJob;
    let acquireWorkerSlot;
    let renewWorkerSlot;
    let releaseWorkerSlot;
    let prepareProjectStart;
    let runSyncAndLocStage;
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
        putTaskIndex = sinon.stub().resolves();
        removeJob = sinon.stub().resolves();
        acquireWorkerSlot = sinon.stub();
        renewWorkerSlot = sinon.stub().resolves({ renewed: true });
        releaseWorkerSlot = sinon.stub().resolves({ released: true });
        prepareProjectStart = sinon.stub();
        runSyncAndLocStage = sinon.stub();
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
                putTaskIndex,
            },
            './queue.js': {
                removeJob,
            },
            './worker-slots.js': {
                acquireWorkerSlot,
                renewWorkerSlot,
                releaseWorkerSlot,
                DEFAULT_CAPACITY: 2,
            },
            './project-start-service.js': {
                prepareProjectStart,
                runSyncAndLocStage,
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

    it('should acquire a slot, run sync+loc, release the slot, and trigger the dispatcher on success', async () => {
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
            batchSize: 5,
            responseMessage: 'ok',
        });
        acquireWorkerSlot.resolves({ acquired: true });
        updateProjectStatus.onFirstCall().resolves({ etag: '"running-etag"' });
        updateProjectStatus.onSecondCall().resolves({ success: true });
        runSyncAndLocStage.resolves({ message: 'ok' });

        const result = await worker.main({
            jobId: 'job-1',
            __ow_activation_id: 'activation-1',
            allowedClientId: 'mas-studio',
            odinEndpoint: 'https://odin.example.com',
            workerConcurrency: 2,
        });

        expect(acquireWorkerSlot).to.have.been.calledOnceWith(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            { capacity: 2 },
        );
        expect(removeJob).to.have.been.calledOnceWith('job-1');
        expect(prepareProjectStart).to.have.been.calledOnce;
        expect(runSyncAndLocStage).to.have.been.calledOnce;
        expect(updateProjectStatus.firstCall).to.have.been.calledWith(
            'project-1',
            'RUNNING',
            'token-1',
            sinon.match({
                odinEndpoint: 'https://odin.example.com',
                projectId: 'project-1',
                authToken: 'token-1',
            }),
            null,
        );
        expect(updateProjectStatus.secondCall).to.have.been.calledWith(
            'project-1',
            'ASYNC_PROCESSING',
            'token-1',
            sinon.match({
                odinEndpoint: 'https://odin.example.com',
                projectId: 'project-1',
                authToken: 'token-1',
            }),
            '"running-etag"',
        );
        expect(releaseWorkerSlot).to.have.been.calledOnceWith({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });
        expect(invokeAsyncAction).to.have.been.calledOnceWith(
            '/ns/MerchAtScaleStudio/translation-project-dispatcher',
            {},
            sinon.match.any,
        );
        expect(deleteJobPayload).to.have.been.calledOnceWith('job-1');
        expect(result).to.deep.equal({
            statusCode: 200,
            body: { message: 'ok' },
        });
    });

    it('should index the GLaaS task and bootstrap locale progress for a translation project', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
            surface: 'acom',
            translationFlow: 'transcreation',
        });
        prepareProjectStart.resolves({
            projectType: 'translation',
            translationData: {
                title: 'my-project',
                itemsToTranslate: ['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/en_US/b'],
                itemsToSync: [],
                locales: ['fr_FR', 'de_DE'],
            },
            batchSize: 5,
            responseMessage: 'ok',
        });
        acquireWorkerSlot.resolves({ acquired: true });
        runSyncAndLocStage.resolves({ message: 'ok' });

        await worker.main({
            jobId: 'job-1',
            __ow_activation_id: 'activation-1',
            odinEndpoint: 'https://odin.example.com',
        });

        expect(putTaskIndex).to.have.been.calledOnceWith(
            'my-project',
            'project-1',
            { projectId: 'project-1', title: 'my-project', submittedAt: sinon.match.string },
            { params: sinon.match.any },
        );
        expect(patchProjectSummary).to.have.been.calledWith(
            'project-1',
            {
                locales: {
                    targetLocales: ['fr_FR', 'de_DE'],
                    progress: {
                        fr_FR: {
                            status: 'PENDING',
                            completedAt: null,
                            fragments: {
                                '/content/dam/mas/acom/en_US/a': { status: 'PENDING', updatedAt: null },
                                '/content/dam/mas/acom/en_US/b': { status: 'PENDING', updatedAt: null },
                            },
                            completed: 0,
                            total: 2,
                        },
                        de_DE: {
                            status: 'PENDING',
                            completedAt: null,
                            fragments: {
                                '/content/dam/mas/acom/en_US/a': { status: 'PENDING', updatedAt: null },
                                '/content/dam/mas/acom/en_US/b': { status: 'PENDING', updatedAt: null },
                            },
                            completed: 0,
                            total: 2,
                        },
                    },
                    completed: 0,
                    total: 2,
                },
            },
            { params: sinon.match.any, updatedAt: sinon.match.string },
        );
    });

    it('should not index or bootstrap locale progress for a rollout-only project', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        prepareProjectStart.resolves({
            projectType: 'rollout',
            translationData: {
                title: 'my-rollout',
                itemsToTranslate: ['/content/dam/mas/acom/en_US/a'],
                itemsToSync: [],
                locales: ['fr_FR'],
            },
            batchSize: 5,
            responseMessage: 'ok',
        });
        acquireWorkerSlot.resolves({ acquired: true });
        runSyncAndLocStage.resolves({ message: 'ok' });

        await worker.main({ jobId: 'job-1' });

        expect(putTaskIndex).to.not.have.been.called;
        expect(patchProjectSummary).to.not.have.been.calledWith('project-1', sinon.match.has('locales'), sinon.match.any);
    });

    it('should seed locale tracking only after ASYNC_PROCESSING is patched and synced', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        prepareProjectStart.resolves({
            projectType: 'translation',
            translationData: {
                title: 'my-project',
                itemsToTranslate: ['/content/dam/mas/acom/en_US/a'],
                itemsToSync: [],
                locales: ['fr_FR'],
            },
            batchSize: 5,
            responseMessage: 'ok',
        });
        acquireWorkerSlot.resolves({ acquired: true });
        runSyncAndLocStage.resolves({ message: 'ok' });

        await worker.main({ jobId: 'job-1', odinEndpoint: 'https://odin.example.com' });

        const asyncProcessingCallIndex = patchProjectSummary
            .getCalls()
            .findIndex((call) => call.args[1]?.status === 'ASYNC_PROCESSING');
        const localesCallIndex = patchProjectSummary.getCalls().findIndex((call) => call.args[1]?.locales);

        expect(asyncProcessingCallIndex).to.be.at.least(0);
        expect(localesCallIndex).to.be.at.least(0);
        expect(localesCallIndex).to.be.greaterThan(asyncProcessingCallIndex);
    });

    it('should not mark the project FAILED when seeding locale tracking throws after a successful handoff', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        prepareProjectStart.resolves({
            projectType: 'translation',
            translationData: {
                title: 'my-project',
                itemsToTranslate: ['/content/dam/mas/acom/en_US/a'],
                itemsToSync: [],
                locales: ['fr_FR'],
            },
            batchSize: 5,
            responseMessage: 'ok',
        });
        acquireWorkerSlot.resolves({ acquired: true });
        runSyncAndLocStage.resolves({ message: 'ok' });
        putTaskIndex.rejects(new Error('state unavailable'));

        const result = await worker.main({ jobId: 'job-1' });

        expect(patchProjectSummary).to.not.have.been.calledWith(
            'project-1',
            sinon.match({ status: 'FAILED' }),
            sinon.match.any,
        );
        expect(mockLogger.warn).to.have.been.calledWith(
            'Failed to seed locale tracking for project project-1: state unavailable',
        );
        expect(result).to.deep.equal({
            statusCode: 200,
            body: { message: 'ok' },
        });
    });

    it('should leave the job queued when no worker slot is available', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        acquireWorkerSlot.resolves({
            acquired: false,
            reason: 'no_slots_available',
        });

        const result = await worker.main({
            jobId: 'job-1',
            workerConcurrency: 2,
        });

        expect(prepareProjectStart).to.not.have.been.called;
        expect(runSyncAndLocStage).to.not.have.been.called;
        expect(releaseWorkerSlot).to.not.have.been.called;
        expect(updateProjectStatus).to.not.have.been.called;
        expect(deleteJobPayload).to.not.have.been.called;
        expect(removeJob).to.not.have.been.called;
        expect(patchProjectSummary.lastCall).to.have.been.calledWith(
            'project-1',
            {
                status: 'QUEUED',
                queue: {
                    state: 'QUEUED',
                    startedAt: null,
                },
                lastError: null,
            },
            { params: sinon.match.any },
        );
        expect(result).to.deep.equal({
            statusCode: 202,
            body: {
                message: 'No worker slot available, job left queued',
                jobId: 'job-1',
                projectId: 'project-1',
                queued: true,
            },
        });
    });

    it('should mark FAILED, release slot, trigger dispatcher, and clean up when prepareProjectStart fails', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        acquireWorkerSlot.resolves({ acquired: true });
        prepareProjectStart.rejects(new Error('prepare failed'));

        const result = await worker.main({
            jobId: 'job-1',
            odinEndpoint: 'https://odin.example.com',
        });

        expect(releaseWorkerSlot).to.have.been.calledOnce;
        expect(invokeAsyncAction).to.have.been.calledOnce;
        expect(patchProjectSummary.lastCall).to.have.been.calledWith(
            'project-1',
            {
                status: 'FAILED',
                lastError: 'prepare failed',
            },
            { params: sinon.match.any },
        );
        expect(updateProjectStatus).to.have.been.calledOnceWith('project-1', 'FAILED', 'token-1', sinon.match.any);
        expect(deleteJobPayload).to.have.been.calledOnceWith('job-1');
        expect(result).to.deep.equal({
            statusCode: 500,
            body: { error: 'prepare failed' },
        });
    });

    it('should preserve status and record lastError when an error carries preserveStatus', async () => {
        getJobPayload.resolves({
            projectId: 'project-1',
            authToken: 'token-1',
        });
        acquireWorkerSlot.resolves({ acquired: true });
        prepareProjectStart.resolves({
            translationData: { itemsToTranslate: [], itemsToSync: [], locales: [] },
            batchSize: 5,
            responseMessage: 'ok',
        });
        isProjectStartError.callsFake((error) => Number.isInteger(error?.statusCode));
        const preservedError = Object.assign(new Error('Failed to sync: 1 request(s) failed'), {
            statusCode: 500,
            preserveStatus: true,
        });
        runSyncAndLocStage.rejects(preservedError);

        const result = await worker.main({ jobId: 'job-1' });

        expect(patchProjectSummary.lastCall).to.have.been.calledWith(
            'project-1',
            { lastError: 'Failed to sync: 1 request(s) failed' },
            { params: sinon.match.any },
        );
        expect(updateProjectStatus).to.not.have.been.called;
        expect(deleteJobPayload).to.have.been.calledOnceWith('job-1');
        expect(result).to.deep.equal({
            statusCode: 500,
            body: { error: 'Failed to sync: 1 request(s) failed' },
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

    it('should warn when releasing the worker slot fails', async () => {
        releaseWorkerSlot.resolves({
            released: false,
            reason: 'missing',
        });

        await worker.releaseWorkerSlotOrWarn(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            'job-1',
        );

        expect(mockLogger.warn).to.have.been.calledOnceWith('Failed to release worker slot for job job-1: missing');
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

    it('should build an empty-progress skeleton per target locale', () => {
        const result = worker.buildInitialLocaleProgress(['fr_FR'], ['/content/dam/mas/acom/en_US/a']);

        expect(result).to.deep.equal({
            targetLocales: ['fr_FR'],
            progress: {
                fr_FR: {
                    status: 'PENDING',
                    completedAt: null,
                    fragments: {
                        '/content/dam/mas/acom/en_US/a': { status: 'PENDING', updatedAt: null },
                    },
                    completed: 0,
                    total: 1,
                },
            },
            completed: 0,
            total: 1,
        });
    });

    it('should skip indexing and progress bootstrap when translationData has no title', async () => {
        await worker.seedLocaleTracking(
            'project-1',
            { itemsToTranslate: [], locales: ['fr_FR'] },
            '2026-01-01T00:00:00.000Z',
            {},
        );

        expect(putTaskIndex).to.not.have.been.called;
        expect(patchProjectSummary).to.not.have.been.called;
    });

    it('should skip indexing and progress bootstrap when translationData has no locales', async () => {
        await worker.seedLocaleTracking(
            'project-1',
            { title: 'my-project', itemsToTranslate: [], locales: [] },
            '2026-01-01T00:00:00.000Z',
            {},
        );

        expect(putTaskIndex).to.not.have.been.called;
        expect(patchProjectSummary).to.not.have.been.called;
    });

    it('should track placeholder and grouped-variation paths the same as any other fragment', async () => {
        await worker.seedLocaleTracking(
            'project-1',
            {
                title: 'my-project',
                itemsToTranslate: [
                    '/content/dam/mas/acom/en_US/a',
                    '/content/dam/mas/acom/en_US/dictionary/placeholder1',
                    '/content/dam/mas/acom/en_US/pzn/variation1',
                ],
                locales: ['fr_FR'],
            },
            '2026-01-01T00:00:00.000Z',
            {},
        );

        expect(patchProjectSummary).to.have.been.calledOnceWith(
            'project-1',
            {
                locales: {
                    targetLocales: ['fr_FR'],
                    progress: {
                        fr_FR: {
                            status: 'PENDING',
                            completedAt: null,
                            fragments: {
                                '/content/dam/mas/acom/en_US/a': { status: 'PENDING', updatedAt: null },
                                '/content/dam/mas/acom/en_US/dictionary/placeholder1': { status: 'PENDING', updatedAt: null },
                                '/content/dam/mas/acom/en_US/pzn/variation1': { status: 'PENDING', updatedAt: null },
                            },
                            completed: 0,
                            total: 3,
                        },
                    },
                    completed: 0,
                    total: 1,
                },
            },
            { params: {}, updatedAt: '2026-01-01T00:00:00.000Z' },
        );
    });

    it('should log a warning and not throw when seeding locale tracking fails', async () => {
        putTaskIndex.rejects(new Error('state unavailable'));

        await worker.seedLocaleTrackingOrWarn(
            'project-1',
            { title: 'my-project', itemsToTranslate: ['/content/dam/mas/acom/en_US/a'], locales: ['fr_FR'] },
            '2026-01-01T00:00:00.000Z',
            {},
        );

        expect(mockLogger.warn).to.have.been.calledOnceWith(
            'Failed to seed locale tracking for project project-1: state unavailable',
        );
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
            body: { message: 'generic body message' },
        });

        expect(structured).to.deep.equal({
            statusCode: 409,
            body: { error: 'structured failure' },
        });
        expect(generic).to.deep.equal({
            statusCode: 500,
            body: { error: 'generic body message' },
        });
    });

    it('should stop the heartbeat with a renewal error when the slot can no longer be renewed', async () => {
        const clock = sinon.useFakeTimers();
        renewWorkerSlot.resolves({
            renewed: false,
            reason: 'expired',
        });

        const heartbeat = worker.startWorkerSlotHeartbeat(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                intervalMs: 10,
                renewWorkerSlot,
            },
        );

        await clock.tickAsync(10);
        const error = await heartbeat.stop();

        expect(error).to.be.an('error');
        expect(error.message).to.equal('Failed to renew worker slot: expired');
        clock.restore();
    });
});
