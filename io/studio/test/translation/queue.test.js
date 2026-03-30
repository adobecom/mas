const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

const { expect } = chai;

describe('Translation queue helpers', () => {
    let mockState;
    let initStub;
    let queueHelpers;

    beforeEach(() => {
        mockState = {
            put: sinon.stub().resolves(),
            get: sinon.stub().resolves(null),
            delete: sinon.stub().resolves(),
        };
        initStub = sinon.stub().resolves(mockState);

        queueHelpers = proxyquire('../../src/translation/queue.js', {
            '@adobe/aio-lib-state': {
                init: initStub,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should enqueue jobs in FIFO order and avoid duplicates', async () => {
        mockState.get.onCall(0).resolves(null);
        mockState.get.onCall(1).resolves({
            value: JSON.stringify(['job-1']),
        });
        mockState.get.onCall(2).resolves({
            value: JSON.stringify(['job-1', 'job-2']),
        });

        await queueHelpers.enqueueJob('job-1');
        await queueHelpers.enqueueJob('job-2');
        const result = await queueHelpers.enqueueJob('job-2');

        expect(result).to.deep.equal(['job-1', 'job-2']);
        expect(mockState.put).to.have.been.calledTwice;
        expect(mockState.put.firstCall).to.have.been.calledWith(
            queueHelpers.QUEUE_KEY,
            JSON.stringify(['job-1']),
            { ttl: queueHelpers.QUEUE_TTL },
        );
        expect(mockState.put.secondCall).to.have.been.calledWith(
            queueHelpers.QUEUE_KEY,
            JSON.stringify(['job-1', 'job-2']),
            { ttl: queueHelpers.QUEUE_TTL },
        );
    });

    it('should peek and dequeue the next job in FIFO order', async () => {
        mockState.get.onFirstCall().resolves({
            value: JSON.stringify(['job-1', 'job-2']),
        });
        mockState.get.onSecondCall().resolves({
            value: JSON.stringify(['job-1', 'job-2']),
        });

        const nextJob = await queueHelpers.peekNextJob();
        const dequeuedJob = await queueHelpers.dequeueNextJob();

        expect(nextJob).to.equal('job-1');
        expect(dequeuedJob).to.equal('job-1');
        expect(mockState.put).to.have.been.calledWith(
            queueHelpers.QUEUE_KEY,
            JSON.stringify(['job-2']),
            { ttl: queueHelpers.QUEUE_TTL },
        );
    });

    it('should report queue length', async () => {
        mockState.get.resolves({
            value: JSON.stringify(['job-1', 'job-2', 'job-3']),
        });

        const length = await queueHelpers.getQueueLength();

        expect(length).to.equal(3);
    });

    it('should acquire and release the queue lock for the same owner', async () => {
        mockState.get.onFirstCall().resolves(null);
        mockState.get.onSecondCall().resolves({
            value: JSON.stringify({
                ownerId: 'dispatcher-1',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:00:30.000Z',
            }),
        });

        const acquired = await queueHelpers.acquireQueueLock('dispatcher-1', {
            now: () => new Date('2026-03-24T10:00:00Z'),
            leaseDurationMs: 30000,
        });
        const released = await queueHelpers.releaseQueueLock('dispatcher-1');

        expect(acquired.acquired).to.equal(true);
        expect(acquired.lock).to.deep.equal({
            ownerId: 'dispatcher-1',
            acquiredAt: '2026-03-24T10:00:00.000Z',
            leaseUntil: '2026-03-24T10:00:30.000Z',
        });
        expect(mockState.put).to.have.been.calledWith(
            queueHelpers.QUEUE_LOCK_KEY,
            JSON.stringify(acquired.lock),
            { ttl: 30 },
        );
        expect(released).to.deep.equal({
            released: true,
        });
        expect(mockState.delete).to.have.been.calledWith(queueHelpers.QUEUE_LOCK_KEY);
    });

    it('should reacquire the queue lock when it is already owned by the same dispatcher', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                ownerId: 'dispatcher-1',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:00:30.000Z',
            }),
        });

        const result = await queueHelpers.acquireQueueLock('dispatcher-1', {
            now: () => new Date('2026-03-24T10:00:10Z'),
            leaseDurationMs: 30000,
        });

        expect(result).to.deep.equal({
            acquired: true,
            lock: {
                ownerId: 'dispatcher-1',
                acquiredAt: '2026-03-24T10:00:10.000Z',
                leaseUntil: '2026-03-24T10:00:40.000Z',
            },
            alreadyOwned: true,
        });
    });

    it('should reject queue lock acquisition when another dispatcher holds an active lock', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                ownerId: 'dispatcher-2',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:00:30.000Z',
            }),
        });

        const result = await queueHelpers.acquireQueueLock('dispatcher-1', {
            now: () => new Date('2026-03-24T10:00:10Z'),
        });

        expect(result).to.deep.equal({
            acquired: false,
            lock: {
                ownerId: 'dispatcher-2',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:00:30.000Z',
            },
            reason: 'locked',
        });
    });

    it('should release an expired queue lock for a new owner and handle missing queue lock releases', async () => {
        mockState.get.onFirstCall().resolves({
            value: JSON.stringify({
                ownerId: 'dispatcher-old',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:00:10.000Z',
            }),
        });
        mockState.get.onSecondCall().resolves(null);
        mockState.get.onThirdCall().resolves({
            value: JSON.stringify({
                ownerId: 'dispatcher-2',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:00:30.000Z',
            }),
        });

        const acquired = await queueHelpers.acquireQueueLock('dispatcher-1', {
            now: () => new Date('2026-03-24T10:00:20Z'),
            leaseDurationMs: 30000,
        });
        const missingRelease = await queueHelpers.releaseQueueLock('dispatcher-1');
        const otherOwnerRelease = await queueHelpers.releaseQueueLock('dispatcher-1');

        expect(acquired.acquired).to.equal(true);
        expect(acquired.lock.ownerId).to.equal('dispatcher-1');
        expect(missingRelease).to.deep.equal({
            released: false,
            reason: 'missing',
        });
        expect(otherOwnerRelease).to.deep.equal({
            released: false,
            reason: 'not_owner',
            lock: {
                ownerId: 'dispatcher-2',
                acquiredAt: '2026-03-24T10:00:00.000Z',
                leaseUntil: '2026-03-24T10:00:30.000Z',
            },
        });
    });
});
