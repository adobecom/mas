import { expect } from 'chai';
import sinon from 'sinon';
import { fetch as internalFetch } from '../../src/fragment/utils/common.js';

describe('internalFetch', () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    describe('retry logic', () => {
        it('should retry on 503/504 errors', async () => {
            fetchStub
                .onFirstCall()
                .resolves(new Response('Error', { status: 503 }))
                .onSecondCall()
                .resolves(new Response(JSON.stringify({ id: '123' }), { status: 200 }));

            const context = {
                networkConfig: { retries: 3, fetchTimeout: 5000, retryDelay: 1 },
            };

            const result = await internalFetch('https://example.com/fragment/123', context, 'test');
            expect(result.status).to.equal(200);
            expect(fetchStub.callCount).to.equal(2);
        });

        it('should not retry on non-retryable errors', async () => {
            fetchStub.resolves(new Response('Not Found', { status: 404 }));

            const context = {
                networkConfig: { retries: 3, fetchTimeout: 5000 },
            };

            const result = await internalFetch('https://example.com/fragment/123', context, 'test');
            expect(result.status).to.equal(404);
            expect(fetchStub.callCount).to.equal(1);
        });
    });
});
