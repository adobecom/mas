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
        expect(body.filterReferencesByStatus).to.deep.equal(['DRAFT', 'MODIFIED', 'UNPUBLISHED']);
    });

    it('sends empty filterReferencesByStatus when explicitly passed []', async () => {
        fetchOdinStub.resolves(odinResponse(chunk.map((path) => ({ id: `id-${path}`, path, status: 'SUCCESS_TRIGGERED' }))));

        await publisher.publishChunk({ chunk, odinEndpoint, authToken, logger, filterReferencesByStatus: [] });

        const body = JSON.parse(fetchOdinStub.firstCall.args[3].body);
        expect(body.filterReferencesByStatus).to.deep.equal([]);
    });

    it('honors a filterReferencesByStatus override', async () => {
        fetchOdinStub.resolves(odinResponse([{ id: 'id-a', path: chunk[0], status: 'SUCCESS_TRIGGERED' }]));

        await publisher.publishChunk({
            chunk: [chunk[0]],
            odinEndpoint,
            authToken,
            logger,
            filterReferencesByStatus: [],
        });

        const body = JSON.parse(fetchOdinStub.firstCall.args[3].body);
        expect(body.filterReferencesByStatus).to.deep.equal([]);
    });

    it('activates each index separately with CSRF protection instead of starting a workflow', async () => {
        const indexes = ['/content/dam/mas/acom/en_US/dictionary/index', '/content/dam/mas/acom/fr_FR/dictionary/index'];
        fetchOdinStub.withArgs(odinEndpoint, '/libs/granite/csrf/token.json', authToken).resolves({
            json: async () => ({ token: 'csrf-token' }),
        });
        fetchOdinStub.withArgs(odinEndpoint, '/bin/replicate', authToken).resolves({ status: 200 });

        const results = await publisher.publishChunk({ chunk: indexes, odinEndpoint, authToken, logger, replicate: true });

        expect(fetchOdinStub.callCount).to.equal(4);
        for (const [index, path] of indexes.entries()) {
            const [, uri, , options] = fetchOdinStub.getCall(index * 2 + 1).args;
            expect(uri).to.equal('/bin/replicate');
            expect(options).to.include({
                method: 'POST',
                contentType: 'application/x-www-form-urlencoded',
                csrfToken: 'csrf-token',
            });
            const form = new URLSearchParams(options.body);
            expect(form.get('cmd')).to.equal('Activate');
            expect(form.getAll('path')).to.deep.equal([path]);
            expect([...form.keys()]).to.deep.equal(['cmd', 'path']);
        }
        expect(results).to.deep.equal(indexes.map((path) => ({ path, status: 'published', retries: 0 })));
    });

    for (const status of [403, 404]) {
        it(`isolates a replication ${status} failure without failing the other paths`, async () => {
            fetchOdinStub.withArgs(odinEndpoint, '/libs/granite/csrf/token.json', authToken).resolves({
                json: async () => ({ token: 'csrf-token' }),
            });
            fetchOdinStub
                .withArgs(odinEndpoint, '/bin/replicate', authToken)
                .callsFake(async (endpoint, uri, token, options) => {
                    if (new URLSearchParams(options.body).getAll('path').includes(chunk[1])) {
                        throw new Error(`POST failed with status ${status}`);
                    }
                    return { status: 200 };
                });

            const results = await publisher.publishChunk({ chunk, odinEndpoint, authToken, logger, replicate: true });

            expect(results.map(({ path, status }) => ({ path, status }))).to.deep.equal([
                { path: chunk[0], status: 'published' },
                { path: chunk[1], status: 'failed' },
                { path: chunk[2], status: 'published' },
            ]);
            expect(results[1].reason).to.include(`status ${status}`);
            expect(fetchOdinStub.callCount).to.equal(6);
        });
    }

    it('reports forbidden replication without falling back to the reference workflow', async () => {
        fetchOdinStub.withArgs(odinEndpoint, '/libs/granite/csrf/token.json', authToken).resolves({
            json: async () => ({ token: 'csrf-token' }),
        });
        fetchOdinStub
            .withArgs(odinEndpoint, '/bin/replicate', authToken)
            .rejects(new Error('POST failed with status 403: Forbidden'));

        const results = await publisher.publishChunk({ chunk: [chunk[0]], odinEndpoint, authToken, logger, replicate: true });

        expect(results.every((result) => result.status === 'failed' && result.reason.includes('403'))).to.be.true;
        expect(fetchOdinStub.callCount).to.equal(2);
        expect(logger.error.calledOnce).to.be.true;
    });

    it('does not activate indexes when the CSRF request fails', async () => {
        fetchOdinStub.rejects(new Error('GET failed with status 401: Unauthorized'));

        const results = await publisher.publishChunk({ chunk: [chunk[0]], odinEndpoint, authToken, logger, replicate: true });

        expect(results.every((result) => result.status === 'failed' && result.reason.includes('401'))).to.be.true;
        expect(fetchOdinStub).to.have.been.calledOnce;
        expect(fetchOdinStub.firstCall.args[1]).to.equal('/libs/granite/csrf/token.json');
    });

    it('retries transient replication failures with a fresh CSRF token', async () => {
        fetchOdinStub
            .withArgs(odinEndpoint, '/libs/granite/csrf/token.json', authToken)
            .onFirstCall()
            .resolves({ json: async () => ({ token: 'csrf-first' }) })
            .onSecondCall()
            .resolves({ json: async () => ({ token: 'csrf-second' }) });
        fetchOdinStub
            .withArgs(odinEndpoint, '/bin/replicate', authToken)
            .onFirstCall()
            .rejects(new Error('POST failed with status 503: Unavailable'))
            .onSecondCall()
            .resolves({ status: 200 });
        const clock = sinon.useFakeTimers();

        const publishing = publisher.publishChunk({ chunk: [chunk[0]], odinEndpoint, authToken, logger, replicate: true });
        await clock.tickAsync(1000);
        const results = await publishing;

        expect(results.every((result) => result.status === 'published' && result.retries === 1)).to.be.true;
        expect(fetchOdinStub.callCount).to.equal(4);
        expect(fetchOdinStub.lastCall.args[3].csrfToken).to.equal('csrf-second');
    });

    it('retries only the failed replication path without publishing successful paths twice', async () => {
        let tokenCount = 0;
        const attemptedPaths = [];
        fetchOdinStub.withArgs(odinEndpoint, '/libs/granite/csrf/token.json', authToken).callsFake(async () => ({
            json: async () => ({ token: `csrf-${++tokenCount}` }),
        }));
        fetchOdinStub.withArgs(odinEndpoint, '/bin/replicate', authToken).callsFake(async (endpoint, uri, token, options) => {
            const paths = new URLSearchParams(options.body).getAll('path');
            attemptedPaths.push(paths);
            if (paths.includes(chunk[1]) && attemptedPaths.length === 2) {
                throw new Error('POST failed with status 503: Unavailable');
            }
            return { status: 200 };
        });
        const clock = sinon.useFakeTimers();

        const publishing = publisher.publishChunk({ chunk, odinEndpoint, authToken, logger, replicate: true });
        await clock.tickAsync(1000);
        const results = await publishing;

        expect(attemptedPaths).to.deep.equal([[chunk[0]], [chunk[1]], [chunk[1]], [chunk[2]]]);
        expect(results).to.deep.equal([
            { path: chunk[0], status: 'published', retries: 0 },
            { path: chunk[1], status: 'published', retries: 1 },
            { path: chunk[2], status: 'published', retries: 0 },
        ]);
        expect(fetchOdinStub.getCall(5).args[3].csrfToken).to.equal('csrf-3');
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
