const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');
const common = require('../../src/common.js');

chai.use(sinonChai);

const { expect } = chai;
const { dispatchNextQueuedJob } = require('../../src/translation/project-start-dispatcher.js');

describe('Translation project-start dispatcher', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('should return a success response from main when dispatch succeeds', async () => {
        const buildSiblingActionName = sinon.stub().returns('/ns/MerchAtScaleStudio/translation-project-start-worker');
        const invokeAsyncAction = sinon.stub().resolves({ activationId: 'activation-1' });
        const acquireQueueLock = sinon.stub().resolves({ acquired: true });
        const releaseQueueLock = sinon.stub().resolves({ released: true });
        const peekNextJob = sinon.stub().resolves('job-1');
        const getVersioningLock = sinon.stub().resolves(null);
        const getJobPayload = sinon.stub().resolves({
            jobId: 'job-1',
            projectId: 'project-1',
        });
        const patchProjectSummary = sinon.stub().resolves();

        const dispatcher = proxyquire('../../src/translation/project-start-dispatcher.js', {
            './queue.js': {
                acquireQueueLock,
                releaseQueueLock,
                peekNextJob,
            },
            './versioning-lock.js': {
                getVersioningLock,
                isLockExpired: sinon.stub().returns(false),
            },
            './state.js': {
                getJobPayload,
                patchProjectSummary,
            },
            '../common.js': {
                ...common,
                buildSiblingActionName,
                invokeAsyncAction,
            },
        });

        const result = await dispatcher.main({
            __ow_action_name: '/ns/MerchAtScaleStudio/translation-project-dispatcher',
            __ow_api_key: 'api-key',
            __ow_api_host: 'runtime.example.com',
            __ow_namespace: 'ns',
        });

        expect(buildSiblingActionName).to.have.been.calledOnceWith(
            {
                __ow_action_name: '/ns/MerchAtScaleStudio/translation-project-dispatcher',
                __ow_api_key: 'api-key',
                __ow_api_host: 'runtime.example.com',
                __ow_namespace: 'ns',
            },
            'translation-project-start-worker',
            {
                overrideParamName: 'translationProjectStartWorkerActionName',
            },
        );
        expect(invokeAsyncAction).to.have.been.calledOnceWith(
            '/ns/MerchAtScaleStudio/translation-project-start-worker',
            { jobId: 'job-1' },
            {
                __ow_action_name: '/ns/MerchAtScaleStudio/translation-project-dispatcher',
                __ow_api_key: 'api-key',
                __ow_api_host: 'runtime.example.com',
                __ow_namespace: 'ns',
            },
        );
        expect(result).to.deep.equal({
            statusCode: 200,
            body: {
                dispatched: true,
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
        });
    });

    it('should return a 500 response from main when dispatch fails', async () => {
        const logger = {
            error: sinon.stub(),
        };
        const dispatcher = proxyquire('../../src/translation/project-start-dispatcher.js', {
            './queue.js': {
                acquireQueueLock: sinon.stub().rejects(new Error('lock failed')),
                releaseQueueLock: sinon.stub(),
                peekNextJob: sinon.stub(),
            },
            './versioning-lock.js': {
                getVersioningLock: sinon.stub(),
                isLockExpired: sinon.stub(),
            },
            './state.js': {
                getJobPayload: sinon.stub(),
                patchProjectSummary: sinon.stub(),
            },
            '../common.js': {
                ...common,
                buildSiblingActionName: sinon.stub().returns('/ns/MerchAtScaleStudio/translation-project-start-worker'),
                invokeAsyncAction: sinon.stub(),
            },
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(logger),
                },
            },
        });

        const result = await dispatcher.main({
            __ow_action_name: '/ns/MerchAtScaleStudio/translation-project-dispatcher',
        });

        expect(logger.error).to.have.been.calledOnce;
        expect(result).to.deep.equal({
            statusCode: 500,
            body: {
                error: 'lock failed',
            },
        });
    });

    it('should no-op when queue lock is already held', async () => {
        const result = await dispatchNextQueuedJob(
            {},
            {
                acquireQueueLock: sinon.stub().resolves({
                    acquired: false,
                    reason: 'locked',
                }),
                invokeWorker: sinon.stub(),
            },
        );

        expect(result).to.deep.equal({
            dispatched: false,
            reason: 'queue_locked',
        });
    });

    it('should no-op when the queue is empty', async () => {
        const releaseQueueLock = sinon.stub().resolves({ released: true });

        const result = await dispatchNextQueuedJob(
            {},
            {
                acquireQueueLock: sinon.stub().resolves({ acquired: true }),
                releaseQueueLock,
                peekNextJob: sinon.stub().resolves(null),
                invokeWorker: sinon.stub(),
            },
        );

        expect(result).to.deep.equal({
            dispatched: false,
            reason: 'empty_queue',
        });
        expect(releaseQueueLock).to.have.been.calledOnce;
    });

    it('should leave the job queued when versioning is busy', async () => {
        const invokeWorker = sinon.stub();
        const releaseQueueLock = sinon.stub().resolves({ released: true });

        const result = await dispatchNextQueuedJob(
            {},
            {
                now: () => new Date('2026-03-24T10:00:00Z'),
                acquireQueueLock: sinon.stub().resolves({ acquired: true }),
                releaseQueueLock,
                peekNextJob: sinon.stub().resolves('job-1'),
                getVersioningLock: sinon.stub().resolves({
                    projectId: 'project-busy',
                    leaseUntil: '2026-03-24T10:01:00.000Z',
                }),
                isLockExpired: sinon.stub().returns(false),
                invokeWorker,
            },
        );

        expect(result).to.deep.equal({
            dispatched: false,
            reason: 'versioning_busy',
            jobId: 'job-1',
            versioningLock: {
                projectId: 'project-busy',
                leaseUntil: '2026-03-24T10:01:00.000Z',
            },
        });
        expect(invokeWorker).to.not.have.been.called;
        expect(releaseQueueLock).to.have.been.calledOnce;
    });

    it('should dispatch the next queued job when versioning is free', async () => {
        const patchProjectSummary = sinon.stub().resolves();
        const invokeWorker = sinon.stub().resolves({
            activationId: 'activation-1',
        });
        const releaseQueueLock = sinon.stub().resolves({ released: true });

        const result = await dispatchNextQueuedJob(
            {},
            {
                now: () => new Date('2026-03-24T10:00:00Z'),
                acquireQueueLock: sinon.stub().resolves({ acquired: true }),
                releaseQueueLock,
                peekNextJob: sinon.stub().resolves('job-1'),
                getVersioningLock: sinon.stub().resolves(null),
                getJobPayload: sinon.stub().resolves({
                    jobId: 'job-1',
                    projectId: 'project-1',
                }),
                patchProjectSummary,
                invokeWorker,
            },
        );

        expect(invokeWorker).to.have.been.calledOnceWith('job-1', {});
        expect(patchProjectSummary.firstCall).to.have.been.calledWith('project-1', {
            queue: {
                state: 'STARTING',
                startedAt: '2026-03-24T10:00:00.000Z',
            },
            worker: {
                dispatchedAt: '2026-03-24T10:00:00.000Z',
            },
        });
        expect(patchProjectSummary.secondCall).to.have.been.calledWith('project-1', {
            queue: {
                state: 'STARTING',
                startedAt: '2026-03-24T10:00:00.000Z',
            },
            worker: {
                activationId: 'activation-1',
                dispatchedAt: '2026-03-24T10:00:00.000Z',
            },
        });
        expect(result).to.deep.equal({
            dispatched: true,
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });
        expect(releaseQueueLock).to.have.been.calledOnce;
    });

    it('should leave queue cleanup to the worker if the worker invocation fails', async () => {
        const releaseQueueLock = sinon.stub().resolves({ released: true });
        let error;

        try {
            await dispatchNextQueuedJob(
                {},
                {
                    now: () => new Date('2026-03-24T10:00:00Z'),
                    acquireQueueLock: sinon.stub().resolves({ acquired: true }),
                    releaseQueueLock,
                    peekNextJob: sinon.stub().resolves('job-1'),
                    getVersioningLock: sinon.stub().resolves(null),
                    getJobPayload: sinon.stub().resolves({
                        jobId: 'job-1',
                        projectId: 'project-1',
                    }),
                    patchProjectSummary: sinon.stub().resolves(),
                    invokeWorker: sinon.stub().rejects(new Error('invoke failed')),
                },
            );
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an('error');
        expect(error.message).to.equal('invoke failed');
        expect(releaseQueueLock).to.have.been.calledOnce;
    });
});
