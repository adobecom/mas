const { expect } = require('chai');
const { enqueue, resetQueue } = require('../../src/bulk-publish/queue.js');

describe('bulk-publish/queue.js', () => {
    beforeEach(() => {
        resetQueue();
    });

    it('runs tasks serially even when enqueued concurrently', async () => {
        const order = [];
        const makeTask = (id, delay) => async () => {
            order.push(`start-${id}`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            order.push(`end-${id}`);
            return id;
        };

        const r1 = enqueue(makeTask(1, 20));
        const r2 = enqueue(makeTask(2, 5));
        const r3 = enqueue(makeTask(3, 1));

        const results = await Promise.all([r1, r2, r3]);

        expect(results).to.deep.equal([1, 2, 3]);
        expect(order).to.deep.equal(['start-1', 'end-1', 'start-2', 'end-2', 'start-3', 'end-3']);
    });

    it('continues running subsequent tasks after a failure', async () => {
        const r1 = enqueue(async () => {
            throw new Error('boom');
        });
        const r2 = enqueue(async () => 'ok');

        let caught = null;
        try {
            await r1;
        } catch (err) {
            caught = err.message;
        }

        expect(caught).to.equal('boom');
        expect(await r2).to.equal('ok');
    });
});
