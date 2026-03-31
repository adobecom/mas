const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

const { expect } = chai;

describe('Translation versioning lock', () => {
    let mockState;
    let initStub;
    let versioningLock;

    beforeEach(() => {
        mockState = {
            put: sinon.stub().resolves(),
            get: sinon.stub().resolves(null),
            delete: sinon.stub().resolves(),
        };
        initStub = sinon.stub().resolves(mockState);

        versioningLock = proxyquire('../../src/translation/versioning-lock.js', {
            '@adobe/aio-lib-state': {
                init: initStub,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should acquire the lock when it is missing', async () => {
        mockState.get.resolves(null);

        const result = await versioningLock.acquireVersioningLock(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                leaseDurationMs: 60000,
                now: () => new Date('2026-03-24T10:00:00Z'),
            },
        );

        expect(result.acquired).to.equal(true);
        expect(result.attempt).to.equal(1);
        expect(result.lock).to.deep.equal({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
            acquiredAt: '2026-03-24T10:00:00.000Z',
            renewedAt: '2026-03-24T10:00:00.000Z',
            leaseUntil: '2026-03-24T10:01:00.000Z',
        });
        expect(mockState.put).to.have.been.calledWith(versioningLock.VERSIONING_LOCK_KEY, JSON.stringify(result.lock), {
            ttl: 60,
        });
    });

    it('should read the current versioning lock from state', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:01:00.000Z',
            }),
        });

        const result = await versioningLock.getVersioningLock();

        expect(result).to.deep.equal({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
            acquiredAt: '2026-03-24T10:00:00.000Z',
            renewedAt: '2026-03-24T10:00:00.000Z',
            leaseUntil: '2026-03-24T10:01:00.000Z',
        });
    });

    it('should not acquire an active lock owned by another worker', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-2',
                projectId: 'project-2',
                activationId: 'activation-2',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:01:30.000Z',
            }),
        });

        const result = await versioningLock.acquireVersioningLock(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                now: () => new Date('2026-03-24T10:00:30Z'),
                maxAttempts: 1,
            },
        );

        expect(result).to.deep.include({
            acquired: false,
            attempt: 1,
            reason: 'locked',
        });
        expect(result.lock.projectId).to.equal('project-2');
        expect(mockState.put).to.not.have.been.called;
    });

    it('should reacquire and renew the lock when the same owner already holds it', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:10.000Z',
                leaseUntil: '2026-03-24T10:01:30.000Z',
            }),
        });

        const result = await versioningLock.acquireVersioningLock(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                leaseDurationMs: 90000,
                now: () => new Date('2026-03-24T10:00:30Z'),
            },
        );

        expect(result).to.deep.include({
            acquired: true,
            attempt: 1,
            alreadyOwned: true,
        });
        expect(result.lock.acquiredAt).to.equal('2026-03-24T10:00:00.000Z');
        expect(result.lock.renewedAt).to.equal('2026-03-24T10:00:30.000Z');
        expect(result.lock.leaseUntil).to.equal('2026-03-24T10:02:00.000Z');
    });

    it('should take over an expired lock', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-old',
                projectId: 'project-old',
                activationId: 'activation-old',
                acquiredAt: '2026-03-24T09:58:00.000Z',
                renewedAt: '2026-03-24T09:58:30.000Z',
                leaseUntil: '2026-03-24T09:59:30.000Z',
            }),
        });

        const result = await versioningLock.acquireVersioningLock(
            {
                jobId: 'job-new',
                projectId: 'project-new',
                activationId: 'activation-new',
            },
            {
                leaseDurationMs: 60000,
                now: () => new Date('2026-03-24T10:00:00Z'),
            },
        );

        expect(result.acquired).to.equal(true);
        expect(result.lock.jobId).to.equal('job-new');
        expect(result.lock.projectId).to.equal('project-new');
    });

    it('should retry with backoff and eventually acquire the lock', async () => {
        const sleep = sinon.stub().resolves();
        mockState.get.onFirstCall().resolves({
            value: JSON.stringify({
                jobId: 'job-old',
                projectId: 'project-old',
                activationId: 'activation-old',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:01:00.000Z',
            }),
        });
        mockState.get.onSecondCall().resolves({
            value: JSON.stringify({
                jobId: 'job-old',
                projectId: 'project-old',
                activationId: 'activation-old',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:00:10.000Z',
            }),
        });

        const nowStub = sinon.stub();
        nowStub.onCall(0).returns(new Date('2026-03-24T10:00:30Z'));
        nowStub.onCall(1).returns(new Date('2026-03-24T10:00:30Z'));
        nowStub.onCall(2).returns(new Date('2026-03-24T10:00:30Z'));
        nowStub.onCall(3).returns(new Date('2026-03-24T10:00:30Z'));
        nowStub.onCall(4).returns(new Date('2026-03-24T10:00:30Z'));
        nowStub.onCall(5).returns(new Date('2026-03-24T10:00:30Z'));
        nowStub.onCall(6).returns(new Date('2026-03-24T10:00:30Z'));
        nowStub.onCall(7).returns(new Date('2026-03-24T10:00:30Z'));
        nowStub.onCall(8).returns(new Date('2026-03-24T10:01:30Z'));
        nowStub.onCall(9).returns(new Date('2026-03-24T10:01:30Z'));

        const result = await versioningLock.acquireVersioningLock(
            {
                jobId: 'job-new',
                projectId: 'project-new',
                activationId: 'activation-new',
            },
            {
                maxAttempts: 2,
                initialRetryDelayMs: 250,
                maxRetryDelayMs: 250,
                jitterRatio: 0,
                now: nowStub,
                sleep,
            },
        );

        expect(sleep).to.have.been.calledOnceWith(250);
        expect(result.acquired).to.equal(true);
        expect(result.attempt).to.equal(2);
        expect(result.lock.leaseUntil).to.equal('2026-03-24T10:02:00.000Z');
    });

    it('should renew the lock only for the current owner while lease is active', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:30.000Z',
                leaseUntil: '2026-03-24T10:01:30.000Z',
            }),
        });

        const result = await versioningLock.renewVersioningLock(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                leaseDurationMs: 60000,
                now: () => new Date('2026-03-24T10:01:00Z'),
            },
        );

        expect(result.renewed).to.equal(true);
        expect(result.lock.acquiredAt).to.equal('2026-03-24T10:00:00.000Z');
        expect(result.lock.renewedAt).to.equal('2026-03-24T10:01:00.000Z');
        expect(result.lock.leaseUntil).to.equal('2026-03-24T10:02:00.000Z');
    });

    it('should fail to renew when ownership does not match', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-2',
                projectId: 'project-2',
                activationId: 'activation-2',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:30.000Z',
                leaseUntil: '2026-03-24T10:01:30.000Z',
            }),
        });

        const result = await versioningLock.renewVersioningLock({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result).to.deep.include({
            renewed: false,
            reason: 'not_owner',
        });
        expect(mockState.put).to.not.have.been.called;
    });

    it('should fail to renew an expired lock even for the same owner', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:30.000Z',
                leaseUntil: '2026-03-24T10:01:00.000Z',
            }),
        });

        const result = await versioningLock.renewVersioningLock(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                now: () => new Date('2026-03-24T10:02:00Z'),
            },
        );

        expect(result).to.deep.include({
            renewed: false,
            reason: 'expired',
        });
        expect(mockState.put).to.not.have.been.called;
    });

    it('should release the lock only for the current owner', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:30.000Z',
                leaseUntil: '2026-03-24T10:01:30.000Z',
            }),
        });

        const result = await versioningLock.releaseVersioningLock({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result).to.deep.equal({
            released: true,
        });
        expect(mockState.delete).to.have.been.calledWith(versioningLock.VERSIONING_LOCK_KEY);
    });

    it('should not release the lock for another owner', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                jobId: 'job-2',
                projectId: 'project-2',
                activationId: 'activation-2',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                renewedAt: '2026-03-24T10:00:30.000Z',
                leaseUntil: '2026-03-24T10:01:30.000Z',
            }),
        });

        const result = await versioningLock.releaseVersioningLock({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result).to.deep.include({
            released: false,
            reason: 'not_owner',
        });
        expect(mockState.delete).to.not.have.been.called;
    });

    it('should return unknown when acquireVersioningLock is configured with zero attempts', async () => {
        const result = await versioningLock.acquireVersioningLock(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                maxAttempts: 0,
            },
        );

        expect(result).to.deep.equal({
            acquired: false,
            lock: null,
            attempt: 0,
            reason: 'unknown',
        });
    });

    it('should fail to renew when the versioning lock is missing', async () => {
        mockState.get.resolves(null);

        const result = await versioningLock.renewVersioningLock({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result).to.deep.equal({
            renewed: false,
            reason: 'missing',
        });
    });

    it('should fail to release when the versioning lock is missing', async () => {
        mockState.get.resolves(null);

        const result = await versioningLock.releaseVersioningLock({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result).to.deep.equal({
            released: false,
            reason: 'missing',
        });
    });
});
