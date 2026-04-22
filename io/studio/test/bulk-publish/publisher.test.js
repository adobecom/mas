const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/publisher.js', () => {
    let publisher;
    let fetchOdinStub;
    let logger;

    const odinEndpoint = 'https://odin.example';
    const authToken = 'token';
    const chunk = ['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/en_US/b', '/content/dam/mas/acom/en_US/c'];

    beforeEach(() => {
        fetchOdinStub = sinon.stub();
        logger = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };

        publisher = proxyquire('../../src/bulk-publish/publisher.js', {
            '../common.js': { fetchOdin: fetchOdinStub },
        });
    });

    afterEach(() => sinon.restore());

    function odinResponse(items, workflowInstanceId = 'wf-1') {
        return {
            json: async () => ({ workflowInstanceId, items }),
        };
    }

    it('publishes a multi-path chunk in a single POST with no etag', async () => {
        fetchOdinStub.resolves(odinResponse(chunk.map((path) => ({ id: `id-${path}`, path, status: 'SUCCESS_TRIGGERED' }))));

        const results = await publisher.publishChunk({ chunk, odinEndpoint, authToken, logger });

        expect(results).to.have.length(3);
        expect(results.every((r) => r.status === 'published' && r.retries === 0)).to.be.true;
        expect(results[0].workflowInstanceId).to.equal('wf-1');
        expect(fetchOdinStub).to.have.been.calledOnce;
        const [, uri, , opts] = fetchOdinStub.firstCall.args;
        expect(uri).to.equal('/adobe/sites/cf/fragments/publish');
        expect(opts.method).to.equal('POST');
        expect(opts.etag).to.be.undefined;
        const body = JSON.parse(opts.body);
        expect(body.paths).to.deep.equal(chunk);
        expect(body.workflowModelId).to.equal('/var/workflow/models/scheduled_activation_with_references');
        expect(body.filterReferencesByStatus).to.deep.equal(['DRAFT', 'UNPUBLISHED']);
    });

    it('translates partial success — 2 published + 1 not-found', async () => {
        fetchOdinStub.resolves(
            odinResponse([
                { id: 'id-a', path: chunk[0], status: 'SUCCESS_TRIGGERED' },
                { id: 'id-b', path: chunk[1], status: 'SUCCESS_TRIGGERED' },
                { id: 'id-c', path: chunk[2], status: 'ERROR_NOT_FOUND' },
            ]),
        );

        const results = await publisher.publishChunk({ chunk, odinEndpoint, authToken, logger });

        expect(results[0]).to.include({ status: 'published' });
        expect(results[1]).to.include({ status: 'published' });
        expect(results[2]).to.include({ status: 'failed', reason: 'not-found' });
    });

    it('marks paths missing from response items[] as failed/no-response-item', async () => {
        fetchOdinStub.resolves(odinResponse([{ id: 'id-a', path: chunk[0], status: 'SUCCESS_TRIGGERED' }]));

        const results = await publisher.publishChunk({ chunk, odinEndpoint, authToken, logger });

        expect(results[0]).to.include({ status: 'published' });
        expect(results[1]).to.include({ status: 'failed', reason: 'no-response-item' });
        expect(results[2]).to.include({ status: 'failed', reason: 'no-response-item' });
    });

    it('maps unknown workflow status to failed/unknown-status', async () => {
        fetchOdinStub.resolves(odinResponse([{ id: 'id-a', path: chunk[0], status: 'NEW_UNDOCUMENTED_STATUS' }]));

        const results = await publisher.publishChunk({
            chunk: [chunk[0]],
            odinEndpoint,
            authToken,
            logger,
        });

        expect(results[0]).to.include({ status: 'failed', reason: 'unknown-status' });
    });

    it('retries on 429 and succeeds on second attempt', async () => {
        fetchOdinStub.onFirstCall().rejects(new Error('POST failed with status 429: Too Many Requests'));
        fetchOdinStub
            .onSecondCall()
            .resolves(odinResponse(chunk.map((path) => ({ id: `id-${path}`, path, status: 'SUCCESS_TRIGGERED' }))));

        const clock = sinon.useFakeTimers();
        const promise = publisher.publishChunk({ chunk, odinEndpoint, authToken, logger, maxRetries: 3 });
        await clock.tickAsync(2000);
        const results = await promise;
        clock.restore();

        expect(results).to.have.length(3);
        expect(results.every((r) => r.status === 'published' && r.retries === 1)).to.be.true;
        expect(fetchOdinStub).to.have.been.calledTwice;
    });

    it('does not retry on non-retryable 401 and fails all paths after one attempt', async () => {
        fetchOdinStub.rejects(new Error('POST failed with status 401: Unauthorized'));

        const results = await publisher.publishChunk({ chunk, odinEndpoint, authToken, logger, maxRetries: 3 });

        expect(results).to.have.length(3);
        expect(results.every((r) => r.status === 'failed')).to.be.true;
        expect(fetchOdinStub).to.have.been.calledOnce;
    });

    it('returns one failed result per path when Odin throws persistently', async () => {
        fetchOdinStub.rejects(new Error('POST failed with status 500: Internal Server Error'));

        const clock = sinon.useFakeTimers();
        const promise = publisher.publishChunk({ chunk, odinEndpoint, authToken, logger, maxRetries: 3 });
        await clock.tickAsync(10000);
        const results = await promise;
        clock.restore();

        expect(results).to.have.length(3);
        expect(results.every((r) => r.status === 'failed' && r.retries === 2)).to.be.true;
        expect(fetchOdinStub).to.have.been.calledThrice;
    });

    it('returns structured failed results when an unexpected error bubbles out', async () => {
        fetchOdinStub.rejects(new Error('DNS resolution failure'));

        const clock = sinon.useFakeTimers();
        const promise = publisher.publishChunk({ chunk, odinEndpoint, authToken, logger, maxRetries: 1 });
        await clock.tickAsync(1);
        const results = await promise;
        clock.restore();

        expect(results).to.have.length(3);
        expect(results.every((r) => r.status === 'failed' && r.retries === 0)).to.be.true;
    });
});
