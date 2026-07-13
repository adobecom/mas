const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');

chai.use(sinonChai);

describe('bulk-publish-worker — runWorker', () => {
    let worker, deps;
    beforeEach(() => {
        deps = {
            readProjectFragment: sinon.stub().resolves({ fragment: { id: 'proj-1' }, etag: 'e1' }),
            getProjectPaths: sinon.stub().returns(['/content/dam/mas/acom/en_US/a']),
            getProjectLocales: sinon.stub().returns(['es_MX']),
            getProjectTitle: sinon.stub().returns('Proj'),
            getProjectSnapshots: sinon.stub().returns([]),
            publishResolved: sinon.stub(),
            createSnapshot: sinon.stub().resolves({ entries: ['{"fragmentId":"f1"}'], expandedPaths: [] }),
            updateProjectFragment: sinon.stub().resolves(),
            now: () => new Date('2026-06-04T00:00:00.000Z'),
            logger: { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() },
        };
        worker = require('../../src/bulk-publish/bulk-publish-worker.js');
    });
    afterEach(() => sinon.restore());

    it('publishes all paths, snapshots the project paths, writes Published', async () => {
        deps.getProjectPaths.returns(['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/en_US/b']);
        deps.getProjectLocales.returns([]);
        deps.publishResolved.resolves([
            { path: '/content/dam/mas/acom/en_US/a', status: 'published' },
            { path: '/content/dam/mas/acom/en_US/b', status: 'published' },
        ]);

        const result = await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: 'u@x.com' },
            deps,
        );

        expect(deps.publishResolved).to.have.been.calledOnce;
        const snapArgs = deps.createSnapshot.firstCall.args[0];
        expect(snapArgs.paths).to.deep.equal(['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/en_US/b']);
        expect(result.published).to.equal(2);
        expect(result.failed).to.equal(0);
        const fields = deps.updateProjectFragment.lastCall.args[3];
        expect(fields.status).to.equal('Published');
        expect(fields.publishedBy).to.equal('u@x.com');
        expect(fields.publishedAt).to.be.a('string');
        expect(JSON.parse(fields.lastResult).published).to.equal(2);
    });

    it('relabels not-found failures as not-localized and writes Partially published', async () => {
        deps.publishResolved.resolves([
            { path: '/content/dam/mas/acom/en_US/a', status: 'published' },
            { path: '/content/dam/mas/acom/es_MX/a', status: 'failed', reason: 'not-found' },
        ]);

        const result = await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' },
            deps,
        );

        expect(result.published).to.equal(1);
        expect(result.failed).to.equal(1);
        expect(result.reasons['not-localized']).to.equal(1);
        expect(result.reasons['not-found']).to.equal(undefined);
        expect(result.failures).to.deep.include({ path: '/content/dam/mas/acom/es_MX/a', reason: 'not-localized' });
        expect(deps.updateProjectFragment.lastCall.args[3].status).to.equal('Partially published');
    });

    it('writes Failed when nothing publishes', async () => {
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/es_MX/a', status: 'failed', reason: 'not-found' }]);

        const result = await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' },
            deps,
        );

        expect(result.published).to.equal(0);
        expect(deps.updateProjectFragment.lastCall.args[3].status).to.equal('Failed');
    });

    it('sets PUBLISHING with pending-marked snapshot before finalizing', async () => {
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);
        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);
        const firstUpdate = deps.updateProjectFragment.getCall(0).args[3];
        expect(firstUpdate.status).to.equal('Publishing');
        expect(firstUpdate.snapshots[0]).to.include('publishComplete');
    });

    it('snapshots and sets Publishing before publishing starts', async () => {
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.createSnapshot).to.have.been.calledBefore(deps.publishResolved);
        expect(deps.updateProjectFragment.getCall(0).calledBefore(deps.publishResolved.firstCall)).to.equal(true);
        expect(deps.updateProjectFragment.getCall(0).args[3].status).to.equal('Publishing');
    });

    it('sets Publishing before publishing when reusing a pending snapshot', async () => {
        deps.getProjectSnapshots.returns(['{"fragmentId":"f1","publishComplete":false}']);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.updateProjectFragment.getCall(0).calledBefore(deps.publishResolved.firstCall)).to.equal(true);
        expect(deps.updateProjectFragment.getCall(0).args[3].status).to.equal('Publishing');
    });

    it('reuses a pending snapshot on re-run instead of taking a new one', async () => {
        deps.getProjectSnapshots.returns(['{"fragmentId":"f1","publishComplete":false}']);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.createSnapshot).to.not.have.been.called;
        const firstUpdate = deps.updateProjectFragment.getCall(0).args[3];
        expect(firstUpdate.status).to.equal('Publishing');
        expect(firstUpdate).to.not.have.property('snapshots');
        const finalSnapshots = deps.updateProjectFragment.lastCall.args[3].snapshots;
        expect(finalSnapshots[0]).to.not.include('publishComplete');
    });

    it('publishes expanded paths (cards) when includeCards is true', async () => {
        const collPath = '/content/dam/mas/acom/en_US/coll';
        const cardPath = '/content/dam/mas/acom/en_US/card-1';
        deps.getProjectPaths.returns([collPath]);
        deps.getProjectLocales.returns([]);
        deps.createSnapshot.resolves({
            entries: ['{"fragmentId":"f-coll"}'],
            expandedPaths: [collPath, cardPath],
        });
        deps.publishResolved.resolves([
            { path: collPath, status: 'published' },
            { path: cardPath, status: 'published' },
        ]);

        await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '', includeCards: true },
            deps,
        );

        const publishedPaths = deps.publishResolved.firstCall.args[0];
        expect(publishedPaths).to.include(collPath);
        expect(publishedPaths).to.include(cardPath);
    });

    it('publishes only top-level paths when includeCards and includeVariations are both false', async () => {
        const collPath = '/content/dam/mas/acom/en_US/coll';
        const cardPath = '/content/dam/mas/acom/en_US/card-1';
        deps.getProjectPaths.returns([collPath]);
        deps.getProjectLocales.returns([]);
        deps.createSnapshot.resolves({
            entries: ['{"fragmentId":"f-coll"}'],
            expandedPaths: [collPath, cardPath],
        });
        deps.publishResolved.resolves([{ path: collPath, status: 'published' }]);

        await worker.runWorker(
            {
                projectId: 'proj-1',
                odinEndpoint: 'https://odin',
                authToken: 't',
                publishedBy: '',
                includeCards: false,
                includeVariations: false,
            },
            deps,
        );

        const publishedPaths = deps.publishResolved.firstCall.args[0];
        expect(publishedPaths).to.deep.equal([collPath]);
    });

    it('ignores a fully-complete existing snapshot and takes a fresh one', async () => {
        deps.getProjectSnapshots.returns(['{"fragmentId":"f1"}']);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.createSnapshot).to.have.been.calledOnce;
    });

    it('publishes card paths recovered from pending snapshot entries on resume with includeCards', async () => {
        const collPath = '/content/dam/mas/acom/en_US/coll';
        const cardPath = '/content/dam/mas/acom/en_US/card-1';
        const pendingEntries = [
            JSON.stringify({
                fragmentId: 'f-coll',
                path: collPath,
                versionId: 'v1',
                wasPublished: true,
                createdAt: '2026-01-01T00:00:00.000Z',
                publishComplete: false,
            }),
            JSON.stringify({
                fragmentId: 'f-card',
                path: cardPath,
                versionId: 'v2',
                wasPublished: false,
                createdAt: '2026-01-01T00:00:00.000Z',
                publishComplete: false,
            }),
        ];
        deps.getProjectSnapshots.returns(pendingEntries);
        deps.getProjectPaths.returns([collPath]);
        deps.getProjectLocales.returns([]);
        deps.publishResolved.resolves([
            { path: collPath, status: 'published' },
            { path: cardPath, status: 'published' },
        ]);

        await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '', includeCards: true },
            deps,
        );

        const publishedPaths = deps.publishResolved.firstCall.args[0];
        expect(publishedPaths).to.include(collPath);
        expect(publishedPaths).to.include(cardPath);
        expect(deps.createSnapshot).to.not.have.been.called;
    });

    it('treats a malformed snapshot entry as not-pending and takes a fresh snapshot', async () => {
        deps.getProjectSnapshots.returns(['not-json']);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.createSnapshot).to.have.been.calledOnce;
    });
});

describe('bulk-publish-worker — terminalStatus', () => {
    const { terminalStatus, WORKER_STATUS } = require('../../src/bulk-publish/bulk-publish-worker.js');

    it('reports Published for an empty project instead of Failed', () => {
        expect(terminalStatus({ total: 0, published: 0, failed: 0 })).to.equal(WORKER_STATUS.PUBLISHED);
    });

    it('reports Failed when there is work but nothing published', () => {
        expect(terminalStatus({ total: 1, published: 0, failed: 1 })).to.equal(WORKER_STATUS.FAILED);
    });

    it('reports Published when every path published', () => {
        expect(terminalStatus({ total: 2, published: 2, failed: 0 })).to.equal(WORKER_STATUS.PUBLISHED);
    });

    it('reports Partially published when some paths failed', () => {
        expect(terminalStatus({ total: 2, published: 1, failed: 1 })).to.equal(WORKER_STATUS.PARTIALLY_PUBLISHED);
    });
});

describe('bulk-publish-worker — main', () => {
    const { main } = require('../../src/bulk-publish/bulk-publish-worker.js');

    it('returns a 500 envelope with the error message when the worker throws', async () => {
        const res = await main({ projectId: 'proj-1', odinEndpoint: 'https://odin.invalid', authToken: 't' });
        expect(res.statusCode).to.equal(500);
        expect(res.body).to.have.property('error');
        expect(res.body.error).to.be.a('string');
    });

    it('maps aemOdinEndpoint over odinEndpoint without throwing on param access', async () => {
        const res = await main({ projectId: 'proj-1', aemOdinEndpoint: 'https://odin.invalid', authToken: 't' });
        expect(res.statusCode).to.equal(500);
        expect(res.body.error).to.be.a('string');
    });

    it('updates project status to Failed when runWorker throws', async () => {
        const updateProjectFragment = sinon.stub().resolves();
        const runWorkerStub = sinon.stub().rejects(new Error('snapshot failed'));
        const res = await main(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't' },
            { runWorker: runWorkerStub, updateProjectFragment },
        );
        expect(res.statusCode).to.equal(500);
        expect(updateProjectFragment).to.have.been.calledOnce;
        expect(updateProjectFragment.firstCall.args[3]).to.deep.include({ status: 'Failed' });
    });

    it('forwards includeCards and includeVariations from params to runWorker', async () => {
        const runWorkerStub = sinon.stub().resolves({ published: 1, failed: 0 });
        await main(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', includeCards: true, includeVariations: true },
            { runWorker: runWorkerStub },
        );
        const input = runWorkerStub.firstCall.args[0];
        expect(input.includeCards).to.equal(true);
        expect(input.includeVariations).to.equal(true);
    });

    it('does not throw if updateProjectFragment also fails during error recovery', async () => {
        const updateProjectFragment = sinon.stub().rejects(new Error('update failed'));
        const runWorkerStub = sinon.stub().rejects(new Error('worker error'));
        const res = await main(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't' },
            { runWorker: runWorkerStub, updateProjectFragment },
        );
        expect(res.statusCode).to.equal(500);
        expect(res.body.error).to.equal('worker error');
    });
});
