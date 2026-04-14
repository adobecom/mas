const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

const { expect } = chai;

describe('Translation state helpers', () => {
    let mockState;
    let initStub;
    let stateHelpers;

    beforeEach(() => {
        mockState = {
            put: sinon.stub().resolves(),
            get: sinon.stub().resolves(null),
            delete: sinon.stub().resolves(),
        };
        initStub = sinon.stub().resolves(mockState);

        stateHelpers = proxyquire('../../src/translation/state.js', {
            '@adobe/aio-lib-state': {
                init: initStub,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should build stable state keys', () => {
        expect(stateHelpers.buildJobPayloadKey('job-123')).to.equal('translation-job.job-123.payload');
        expect(stateHelpers.buildProjectSummaryKey('project-456')).to.equal('translation-status.project.project-456.summary');
    });

    it('should store job payload with default ttl', async () => {
        const payload = {
            projectId: 'project-1',
            surface: 'acom',
        };

        await stateHelpers.putJobPayload('job-1', payload);

        expect(mockState.put).to.have.been.calledWith('translation-job.job-1.payload', JSON.stringify(payload), {
            ttl: stateHelpers.JOB_PAYLOAD_TTL,
        });
    });

    it('should use configured job payload ttl from action params when present', async () => {
        await stateHelpers.putJobPayload(
            'job-1',
            { projectId: 'project-1' },
            {
                params: {
                    translationJobPayloadTtl: '7200',
                },
            },
        );

        expect(mockState.put).to.have.been.calledWith(
            'translation-job.job-1.payload',
            JSON.stringify({ projectId: 'project-1' }),
            { ttl: 7200 },
        );
    });

    it('should fall back to default job payload ttl when action params are invalid', async () => {
        await stateHelpers.putJobPayload(
            'job-1',
            { projectId: 'project-1' },
            {
                params: {
                    translationJobPayloadTtl: 'invalid',
                },
            },
        );

        expect(mockState.put).to.have.been.calledWith(
            'translation-job.job-1.payload',
            JSON.stringify({ projectId: 'project-1' }),
            { ttl: stateHelpers.JOB_PAYLOAD_TTL },
        );
    });

    it('should read job payload from state', async () => {
        mockState.get.resolves({
            value: JSON.stringify({ projectId: 'project-1', requestedBy: 'user@example.com' }),
        });

        const result = await stateHelpers.getJobPayload('job-1');

        expect(mockState.get).to.have.been.calledWith('translation-job.job-1.payload');
        expect(result).to.deep.equal({ projectId: 'project-1', requestedBy: 'user@example.com' });
    });

    it('should return null when state value is missing', async () => {
        mockState.get.resolves(null);

        const result = await stateHelpers.getProjectSummary('project-1');

        expect(result).to.equal(null);
    });

    it('should delete job payload by key', async () => {
        await stateHelpers.deleteJobPayload('job-1');

        expect(mockState.delete).to.have.been.calledWith('translation-job.job-1.payload');
    });

    it('should store project summary with updatedAt when missing', async () => {
        const summary = {
            projectId: 'project-1',
            jobId: 'job-1',
            status: 'QUEUED',
            submissionDate: '2026-03-24T10:00:00Z',
            versioning: {
                startedAt: null,
                completedAt: null,
                durationMs: null,
                itemCount: 0,
                batchSize: 10,
            },
            activationId: null,
            lastError: null,
        };

        await stateHelpers.putProjectSummary('project-1', summary);

        const [, serializedSummary, options] = mockState.put.firstCall.args;
        const parsedSummary = JSON.parse(serializedSummary);
        expect(mockState.put.firstCall.args[0]).to.equal('translation-status.project.project-1.summary');
        expect(options).to.deep.equal({ ttl: stateHelpers.PROJECT_SUMMARY_TTL });
        expect(parsedSummary).to.deep.include({
            projectId: 'project-1',
            jobId: 'job-1',
            status: 'QUEUED',
            submissionDate: '2026-03-24T10:00:00Z',
            activationId: null,
            lastError: null,
        });
        expect(parsedSummary.versioning).to.deep.equal(summary.versioning);
        expect(parsedSummary.updatedAt).to.be.a('string');
    });

    it('should use configured project summary ttl from action params when present', async () => {
        await stateHelpers.putProjectSummary(
            'project-1',
            {
                projectId: 'project-1',
                status: 'QUEUED',
                versioning: {},
            },
            {
                params: {
                    translationProjectSummaryTtl: '86400',
                },
            },
        );

        const [, , options] = mockState.put.firstCall.args;
        expect(options).to.deep.equal({ ttl: 86400 });
    });

    it('should patch project summary with nested merge behavior', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                projectId: 'project-1',
                jobId: 'job-1',
                activationId: 'activation-1',
                status: 'RUNNING',
                submissionDate: '2026-03-24T10:00:00Z',
                versioning: {
                    startedAt: '2026-03-24T10:01:00Z',
                    completedAt: null,
                    durationMs: null,
                    itemCount: 0,
                    batchSize: 10,
                },
                updatedAt: '2026-03-24T10:01:00Z',
                lastError: null,
            }),
        });

        const result = await stateHelpers.patchProjectSummary('project-1', {
            status: 'ASYNC_PROCESSING',
            versioning: {
                completedAt: '2026-03-24T10:05:00Z',
                durationMs: 240000,
                itemCount: 15,
            },
        });

        expect(result).to.deep.include({
            projectId: 'project-1',
            jobId: 'job-1',
            activationId: 'activation-1',
            status: 'ASYNC_PROCESSING',
            submissionDate: '2026-03-24T10:00:00Z',
            lastError: null,
        });
        expect(result.versioning).to.deep.equal({
            startedAt: '2026-03-24T10:01:00Z',
            completedAt: '2026-03-24T10:05:00Z',
            durationMs: 240000,
            itemCount: 15,
            batchSize: 10,
        });

        const [, serializedSummary] = mockState.put.firstCall.args;
        const storedSummary = JSON.parse(serializedSummary);
        expect(storedSummary.status).to.equal('ASYNC_PROCESSING');
        expect(storedSummary.versioning).to.deep.equal(result.versioning);
        expect(storedSummary.updatedAt).to.be.a('string');
        expect(storedSummary.updatedAt).to.not.equal('2026-03-24T10:01:00Z');
    });

    it('should allow callers to override ttl and updatedAt', async () => {
        await stateHelpers.patchProjectSummary(
            'project-1',
            {
                status: 'FAILED',
            },
            {
                ttl: 123,
                updatedAt: '2026-03-24T10:10:00Z',
            },
        );

        const [, serializedSummary, options] = mockState.put.firstCall.args;
        expect(options).to.deep.equal({ ttl: 123 });
        expect(JSON.parse(serializedSummary).updatedAt).to.equal('2026-03-24T10:10:00Z');
    });
});
