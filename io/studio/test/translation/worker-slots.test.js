const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

const { expect } = chai;

describe('Translation worker slots', () => {
    let mockState;
    let initStub;
    let workerSlots;

    function stateOf(slots) {
        return { value: JSON.stringify({ slots }) };
    }

    beforeEach(() => {
        mockState = {
            put: sinon.stub().resolves(),
            get: sinon.stub().resolves(null),
            delete: sinon.stub().resolves(),
        };
        initStub = sinon.stub().resolves(mockState);

        workerSlots = proxyquire('../../src/translation/worker-slots.js', {
            '@adobe/aio-lib-state': {
                init: initStub,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should acquire a slot when the state is empty', async () => {
        mockState.get.resolves(null);

        const result = await workerSlots.acquireWorkerSlot(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                capacity: 2,
                leaseDurationMs: 60000,
                now: () => new Date('2026-03-24T10:00:00Z'),
            },
        );

        expect(result.acquired).to.equal(true);
        expect(result.attempt).to.equal(1);
        expect(result.slot).to.deep.equal({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
            acquiredAt: '2026-03-24T10:00:00.000Z',
            renewedAt: '2026-03-24T10:00:00.000Z',
            leaseUntil: '2026-03-24T10:01:00.000Z',
        });
        expect(mockState.put).to.have.been.calledWith(
            workerSlots.WORKER_SLOTS_KEY,
            JSON.stringify({ slots: [result.slot] }),
            { ttl: 60 },
        );
    });

    it('should acquire a second slot when capacity is 2 and one slot is taken', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'job-1',
                    projectId: 'project-1',
                    activationId: 'activation-1',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
            ]),
        );

        const result = await workerSlots.acquireWorkerSlot(
            {
                jobId: 'job-2',
                projectId: 'project-2',
                activationId: 'activation-2',
            },
            {
                capacity: 2,
                leaseDurationMs: 60000,
                now: () => new Date('2026-03-24T10:00:30Z'),
            },
        );

        expect(result.acquired).to.equal(true);
        expect(mockState.put.firstCall.args[1]).to.equal(
            JSON.stringify({
                slots: [
                    {
                        jobId: 'job-1',
                        projectId: 'project-1',
                        activationId: 'activation-1',
                        acquiredAt: '2026-03-24T10:00:00.000Z',
                        renewedAt: '2026-03-24T10:00:00.000Z',
                        leaseUntil: '2026-03-24T10:01:30.000Z',
                    },
                    result.slot,
                ],
            }),
        );
    });

    it('should refuse to acquire when capacity is reached', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'job-1',
                    projectId: 'project-1',
                    activationId: 'activation-1',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
                {
                    jobId: 'job-2',
                    projectId: 'project-2',
                    activationId: 'activation-2',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
            ]),
        );

        const result = await workerSlots.acquireWorkerSlot(
            {
                jobId: 'job-3',
                projectId: 'project-3',
                activationId: 'activation-3',
            },
            {
                capacity: 2,
                leaseDurationMs: 60000,
                now: () => new Date('2026-03-24T10:00:30Z'),
            },
        );

        expect(result.acquired).to.equal(false);
        expect(result.reason).to.equal('no_slots_available');
        expect(mockState.put).to.not.have.been.called;
    });

    it('should reclaim expired slots when computing availability', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'stale-1',
                    projectId: 'project-stale',
                    activationId: 'activation-stale',
                    acquiredAt: '2026-03-24T09:00:00.000Z',
                    renewedAt: '2026-03-24T09:00:00.000Z',
                    leaseUntil: '2026-03-24T09:01:00.000Z',
                },
            ]),
        );

        const result = await workerSlots.acquireWorkerSlot(
            {
                jobId: 'job-2',
                projectId: 'project-2',
                activationId: 'activation-2',
            },
            {
                capacity: 1,
                leaseDurationMs: 60000,
                now: () => new Date('2026-03-24T10:00:00Z'),
            },
        );

        expect(result.acquired).to.equal(true);
        expect(mockState.put.firstCall.args[1]).to.equal(
            JSON.stringify({
                slots: [result.slot],
            }),
        );
    });

    it('should treat a re-acquire by the same owner as a renewal', async () => {
        const existing = {
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
            acquiredAt: '2026-03-24T10:00:00.000Z',
            renewedAt: '2026-03-24T10:00:00.000Z',
            leaseUntil: '2026-03-24T10:01:30.000Z',
        };
        mockState.get.resolves(stateOf([existing]));

        const result = await workerSlots.acquireWorkerSlot(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                capacity: 2,
                leaseDurationMs: 60000,
                now: () => new Date('2026-03-24T10:00:30Z'),
            },
        );

        expect(result.acquired).to.equal(true);
        expect(result.alreadyOwned).to.equal(true);
        expect(result.slot.acquiredAt).to.equal('2026-03-24T10:00:00.000Z');
        expect(result.slot.renewedAt).to.equal('2026-03-24T10:00:30.000Z');
        expect(result.slot.leaseUntil).to.equal('2026-03-24T10:01:30.000Z');
    });

    it('should renew an existing slot without changing acquiredAt', async () => {
        const existing = {
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
            acquiredAt: '2026-03-24T10:00:00.000Z',
            renewedAt: '2026-03-24T10:00:00.000Z',
            leaseUntil: '2026-03-24T10:01:30.000Z',
        };
        mockState.get.resolves(stateOf([existing]));

        const result = await workerSlots.renewWorkerSlot(
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
        expect(result.slot.acquiredAt).to.equal('2026-03-24T10:00:00.000Z');
        expect(result.slot.renewedAt).to.equal('2026-03-24T10:01:00.000Z');
        expect(result.slot.leaseUntil).to.equal('2026-03-24T10:02:00.000Z');
    });

    it('should refuse to renew when the slot is missing', async () => {
        mockState.get.resolves(stateOf([]));

        const result = await workerSlots.renewWorkerSlot({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result.renewed).to.equal(false);
        expect(result.reason).to.equal('missing');
    });

    it('should refuse to renew an expired slot', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'job-1',
                    projectId: 'project-1',
                    activationId: 'activation-1',
                    acquiredAt: '2026-03-24T09:00:00.000Z',
                    renewedAt: '2026-03-24T09:00:00.000Z',
                    leaseUntil: '2026-03-24T09:01:00.000Z',
                },
            ]),
        );

        const result = await workerSlots.renewWorkerSlot(
            {
                jobId: 'job-1',
                projectId: 'project-1',
                activationId: 'activation-1',
            },
            {
                now: () => new Date('2026-03-24T10:00:00Z'),
            },
        );

        expect(result.renewed).to.equal(false);
        expect(result.reason).to.equal('expired');
    });

    it('should release a slot owned by the caller', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'job-1',
                    projectId: 'project-1',
                    activationId: 'activation-1',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
                {
                    jobId: 'job-2',
                    projectId: 'project-2',
                    activationId: 'activation-2',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
            ]),
        );

        const result = await workerSlots.releaseWorkerSlot({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result.released).to.equal(true);
        expect(mockState.put.firstCall.args[1]).to.equal(
            JSON.stringify({
                slots: [
                    {
                        jobId: 'job-2',
                        projectId: 'project-2',
                        activationId: 'activation-2',
                        acquiredAt: '2026-03-24T10:00:00.000Z',
                        renewedAt: '2026-03-24T10:00:00.000Z',
                        leaseUntil: '2026-03-24T10:01:30.000Z',
                    },
                ],
            }),
        );
    });

    it('should delete the slots key entirely when releasing the last slot', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'job-1',
                    projectId: 'project-1',
                    activationId: 'activation-1',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
            ]),
        );

        const result = await workerSlots.releaseWorkerSlot({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result.released).to.equal(true);
        expect(mockState.delete).to.have.been.calledWith(workerSlots.WORKER_SLOTS_KEY);
        expect(mockState.put).to.not.have.been.called;
    });

    it('should refuse to release a slot not owned by the caller', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'job-2',
                    projectId: 'project-2',
                    activationId: 'activation-2',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
            ]),
        );

        const result = await workerSlots.releaseWorkerSlot({
            jobId: 'job-1',
            projectId: 'project-1',
            activationId: 'activation-1',
        });

        expect(result.released).to.equal(false);
        expect(result.reason).to.equal('missing');
        expect(mockState.delete).to.not.have.been.called;
        expect(mockState.put).to.not.have.been.called;
    });

    it('getActiveSlots should prune expired entries', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'job-stale',
                    projectId: 'project-stale',
                    activationId: 'activation-stale',
                    acquiredAt: '2026-03-24T09:00:00.000Z',
                    renewedAt: '2026-03-24T09:00:00.000Z',
                    leaseUntil: '2026-03-24T09:01:00.000Z',
                },
                {
                    jobId: 'job-live',
                    projectId: 'project-live',
                    activationId: 'activation-live',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
            ]),
        );

        const slots = await workerSlots.getActiveSlots({
            now: () => new Date('2026-03-24T10:00:30Z'),
        });

        expect(slots).to.have.lengthOf(1);
        expect(slots[0].jobId).to.equal('job-live');
    });

    it('isSlotExpired should return true when leaseUntil is missing', () => {
        expect(workerSlots.isSlotExpired({})).to.equal(true);
        expect(workerSlots.isSlotExpired(null)).to.equal(true);
    });

    it('isSlotExpired should compare against now', () => {
        expect(
            workerSlots.isSlotExpired(
                { leaseUntil: '2026-03-24T10:01:00.000Z' },
                { now: () => new Date('2026-03-24T10:00:30Z') },
            ),
        ).to.equal(false);
        expect(
            workerSlots.isSlotExpired(
                { leaseUntil: '2026-03-24T10:01:00.000Z' },
                { now: () => new Date('2026-03-24T10:02:00Z') },
            ),
        ).to.equal(true);
    });

    it('should retry with backoff before failing when retries are configured', async () => {
        mockState.get.resolves(
            stateOf([
                {
                    jobId: 'busy',
                    projectId: 'p',
                    activationId: 'a',
                    acquiredAt: '2026-03-24T10:00:00.000Z',
                    renewedAt: '2026-03-24T10:00:00.000Z',
                    leaseUntil: '2026-03-24T10:01:30.000Z',
                },
            ]),
        );
        const sleep = sinon.stub().resolves();

        const result = await workerSlots.acquireWorkerSlot(
            { jobId: 'job-other', projectId: 'other', activationId: 'act-other' },
            {
                capacity: 1,
                maxAttempts: 3,
                initialRetryDelayMs: 100,
                maxRetryDelayMs: 1000,
                jitterRatio: 0,
                sleep,
                now: () => new Date('2026-03-24T10:00:30Z'),
            },
        );

        expect(result.acquired).to.equal(false);
        expect(result.reason).to.equal('no_slots_available');
        expect(sleep).to.have.been.calledTwice;
        expect(sleep.firstCall.args[0]).to.equal(100);
        expect(sleep.secondCall.args[0]).to.equal(200);
    });
});
