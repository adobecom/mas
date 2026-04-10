const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/publisher.js', () => {
    let publisher;
    let fetchOdinStub;
    let fetchFragmentByPathStub;
    let logger;

    const odinEndpoint = 'https://odin.example';
    const authToken = 'token';

    beforeEach(() => {
        fetchOdinStub = sinon.stub();
        fetchFragmentByPathStub = sinon.stub();
        logger = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };

        publisher = proxyquire('../../src/bulk-publish/publisher.js', {
            '../common.js': {
                fetchOdin: fetchOdinStub,
                fetchFragmentByPath: fetchFragmentByPathStub,
            },
        });
    });

    afterEach(() => sinon.restore());

    it('publishes a fresh fragment in one attempt', async () => {
        fetchFragmentByPathStub.resolves({
            fragment: {
                id: 'frag-1',
                path: '/content/dam/mas/acom/en_US/nico',
                modified: { at: '2026-04-05T00:00:00.000Z' },
            },
            status: 200,
            etag: 'etag-1',
        });
        fetchOdinStub.resolves({ ok: true });

        const result = await publisher.publishPath({
            path: '/content/dam/mas/acom/en_US/nico',
            odinEndpoint,
            authToken,
            logger,
        });

        expect(result.status).to.equal('published');
        expect(result.retries).to.equal(0);
        expect(fetchOdinStub).to.have.been.calledOnce;
        const [, uri, , opts] = fetchOdinStub.firstCall.args;
        expect(uri).to.equal('/adobe/sites/cf/fragments/publish');
        expect(opts.method).to.equal('POST');
        expect(opts.etag).to.equal('etag-1');
        const body = JSON.parse(opts.body);
        expect(body.paths).to.deep.equal(['/content/dam/mas/acom/en_US/nico']);
        expect(body.workflowModelId).to.equal(publisher.WORKFLOW_MODEL_ID);
    });

    it('skips a fragment that is already published', async () => {
        fetchFragmentByPathStub.resolves({
            fragment: {
                id: 'frag-1',
                path: '/content/dam/mas/acom/en_US/nico',
                modified: { at: '2026-04-01T00:00:00.000Z' },
                published: { at: '2026-04-05T00:00:00.000Z' },
            },
            status: 200,
            etag: 'etag-1',
        });

        const result = await publisher.publishPath({
            path: '/content/dam/mas/acom/en_US/nico',
            odinEndpoint,
            authToken,
            logger,
        });

        expect(result.status).to.equal('skipped');
        expect(result.reason).to.equal('already-published');
        expect(fetchOdinStub).to.not.have.been.called;
    });

    it('retries on transient errors and succeeds on the second attempt', async () => {
        fetchFragmentByPathStub.resolves({
            fragment: {
                id: 'frag-1',
                path: '/content/dam/mas/acom/en_US/nico',
                modified: { at: '2026-04-05T00:00:00.000Z' },
            },
            status: 200,
            etag: 'etag-1',
        });
        fetchOdinStub.onFirstCall().rejects(new Error('429 Too Many Requests'));
        fetchOdinStub.onSecondCall().resolves({ ok: true });

        const clock = sinon.useFakeTimers();
        const promise = publisher.publishPath({
            path: '/content/dam/mas/acom/en_US/nico',
            odinEndpoint,
            authToken,
            logger,
            maxRetries: 3,
        });
        await clock.tickAsync(2000);
        const result = await promise;
        clock.restore();

        expect(result.status).to.equal('published');
        expect(result.retries).to.equal(1);
        expect(fetchOdinStub).to.have.been.calledTwice;
    });

    it('fails after exhausting retries', async () => {
        fetchFragmentByPathStub.resolves({
            fragment: {
                id: 'frag-1',
                path: '/content/dam/mas/acom/en_US/nico',
                modified: { at: '2026-04-05T00:00:00.000Z' },
            },
            status: 200,
            etag: 'etag-1',
        });
        fetchOdinStub.rejects(new Error('500 Internal Server Error'));

        const clock = sinon.useFakeTimers();
        const promise = publisher.publishPath({
            path: '/content/dam/mas/acom/en_US/nico',
            odinEndpoint,
            authToken,
            logger,
            maxRetries: 3,
        });
        await clock.tickAsync(10000);
        const result = await promise;
        clock.restore();

        expect(result.status).to.equal('failed');
        expect(result.retries).to.equal(2);
        expect(fetchOdinStub).to.have.been.calledThrice;
    });

    it('returns failed with not-found when fragment is missing', async () => {
        fetchFragmentByPathStub.resolves({ fragment: null, status: 404 });

        const result = await publisher.publishPath({
            path: '/content/dam/mas/acom/en_US/ghost',
            odinEndpoint,
            authToken,
            logger,
        });

        expect(result.status).to.equal('failed');
        expect(result.reason).to.equal('not-found');
        expect(fetchOdinStub).to.not.have.been.called;
    });
});
