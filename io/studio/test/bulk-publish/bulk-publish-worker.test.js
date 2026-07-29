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
            createSnapshot: sinon.stub().resolves(['{"fragmentId":"f1"}']),
            updateProjectFragment: sinon.stub().resolves(),
            now: () => new Date('2026-06-04T00:00:00.000Z'),
            logger: { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() },
        };
        worker = require('../../src/bulk-publish/bulk-publish-worker.js');
    });
    afterEach(() => sinon.restore());

    it('reuses the pending snapshot when resuming an interrupted publish', async () => {
        deps.getProjectSnapshots.returns([JSON.stringify({ fragmentId: 'f1', publishComplete: false })]);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't' }, deps);

        expect(deps.createSnapshot).to.not.have.been.called;
    });

    it('only writes fields defined on the bulk-publish-project model', async () => {
        deps.getProjectSnapshots.returns([]);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't' }, deps);

        const MODEL_FIELDS = new Set([
            'title',
            'status',
            'urls',
            'items',
            'fragments',
            'collections',
            'placeholders',
            'locales',
            'publishedAt',
            'publishedBy',
            'lastResult',
            'lastError',
            'snapshots',
        ]);
        for (const call of deps.updateProjectFragment.getCalls()) {
            for (const name of Object.keys(call.args[3])) {
                expect(MODEL_FIELDS.has(name), `"${name}" is not on the model — Odin would reject this write`).to.be.true;
            }
        }
    });

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

    it('publishes dictionary indexes after placeholders and counts them in the result', async () => {
        deps.getProjectPaths.returns(['/content/dam/mas/acom/en_US/dictionary/free']);
        deps.getProjectLocales.returns([]);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' }]);
        deps.publishDictionaryIndexes = sinon
            .stub()
            .resolves([{ path: '/content/dam/mas/acom/en_US/dictionary/index', status: 'published' }]);

        const result = await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' },
            deps,
        );

        expect(deps.publishDictionaryIndexes).to.have.been.calledAfter(deps.publishResolved);
        expect(result.total).to.equal(2);
        expect(result.published).to.equal(2);
        expect(deps.updateProjectFragment.lastCall.args[3].status).to.equal('Published');
    });

    it('reports Partially published when the index publish fails', async () => {
        deps.getProjectPaths.returns(['/content/dam/mas/acom/en_US/dictionary/free']);
        deps.getProjectLocales.returns([]);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' }]);
        deps.publishDictionaryIndexes = sinon
            .stub()
            .resolves([{ path: '/content/dam/mas/acom/en_US/dictionary/index', status: 'failed', reason: 'not-found' }]);

        const result = await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' },
            deps,
        );

        expect(result.failed).to.equal(1);
        expect(result.failures).to.deep.include({
            path: '/content/dam/mas/acom/en_US/dictionary/index',
            reason: 'not-found',
        });
        expect(deps.updateProjectFragment.lastCall.args[3].status).to.equal('Partially published');
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

    it('ignores a fully-complete existing snapshot and takes a fresh one', async () => {
        deps.getProjectSnapshots.returns(['{"fragmentId":"f1"}']);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.createSnapshot).to.have.been.calledOnce;
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
    const { terminalStatus } = require('../../src/bulk-publish/bulk-publish-worker.js');
    const { PROJECT_STATUS } = require('../../src/bulk-publish/project.js');

    it('reports Published for an empty project instead of Failed', () => {
        expect(terminalStatus({ total: 0, published: 0, failed: 0 })).to.equal(PROJECT_STATUS.PUBLISHED);
    });

    it('reports Failed when there is work but nothing published', () => {
        expect(terminalStatus({ total: 1, published: 0, failed: 1 })).to.equal(PROJECT_STATUS.FAILED);
    });

    it('reports Published when every path published', () => {
        expect(terminalStatus({ total: 2, published: 2, failed: 0 })).to.equal(PROJECT_STATUS.PUBLISHED);
    });

    it('reports Partially published when some paths failed', () => {
        expect(terminalStatus({ total: 2, published: 1, failed: 1 })).to.equal(PROJECT_STATUS.PARTIALLY_PUBLISHED);
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
});

describe('bulk-publish-worker — main recovers a stuck project', () => {
    const { main } = require('../../src/bulk-publish/bulk-publish-worker.js');
    const { PROJECT_STATUS } = require('../../src/bulk-publish/project.js');

    const PENDING = JSON.stringify({ path: '/a', versionId: 'v1', publishComplete: false });
    const params = { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't' };

    function lastUpdateCall(updateProject) {
        return updateProject.lastCall.args[3];
    }

    it('writes Failed and preserves the pending marker when publish never succeeded', async () => {
        const updateProject = sinon.stub().resolves();
        const deps = {
            updateProjectFragment: updateProject,
            readProjectFragment: sinon.stub().resolves({ fragment: {} }),
            getProjectPaths: sinon.stub().returns(['/a']),
            getProjectLocales: sinon.stub().returns(['en_US']),
            getProjectTitle: sinon.stub().returns('P'),
            getProjectSnapshots: sinon.stub().returns([PENDING]),
            publishResolved: sinon.stub().rejects(new Error('odin exploded')),
            resolvePaths: sinon.stub().returns(['/a']),
        };

        const res = await main(params, deps);

        expect(res.statusCode).to.equal(500);
        const written = lastUpdateCall(updateProject);
        expect(written.status).to.equal(PROJECT_STATUS.FAILED);
        expect(written.lastError).to.contain('odin exploded');
        expect(written.snapshots, 'marker must survive for a resumable retry').to.be.undefined;
    });

    it('writes the real terminal status, not Failed, when only the terminal write failed', async () => {
        const updateProject = sinon.stub();
        updateProject.onCall(0).resolves();
        updateProject.onCall(1).rejects(new Error('412 conflict'));
        updateProject.onCall(2).resolves();
        const deps = {
            updateProjectFragment: updateProject,
            readProjectFragment: sinon.stub().resolves({ fragment: {} }),
            getProjectPaths: sinon.stub().returns(['/a']),
            getProjectLocales: sinon.stub().returns(['en_US']),
            getProjectTitle: sinon.stub().returns('P'),
            getProjectSnapshots: sinon.stub().returns([PENDING]),
            publishResolved: sinon.stub().resolves([{ path: '/a', status: 'published' }]),
            resolvePaths: sinon.stub().returns(['/a']),
        };

        const res = await main(params, deps);

        expect(res.statusCode).to.equal(500);
        const written = lastUpdateCall(updateProject);
        expect(written.status, 'cards are live — Failed would be a lie').to.equal(PROJECT_STATUS.PUBLISHED);
        expect(JSON.parse(written.snapshots[0]), 'publish completed, so the marker must go').to.not.have.property(
            'publishComplete',
        );
    });

    it('still returns 500 when the recovery write itself throws', async () => {
        const updateProject = sinon.stub();
        updateProject.onCall(0).resolves();
        updateProject.rejects(new Error('odin down'));
        const deps = {
            updateProjectFragment: updateProject,
            readProjectFragment: sinon.stub().resolves({ fragment: {} }),
            getProjectPaths: sinon.stub().returns(['/a']),
            getProjectLocales: sinon.stub().returns(['en_US']),
            getProjectTitle: sinon.stub().returns('P'),
            getProjectSnapshots: sinon.stub().returns([PENDING]),
            publishResolved: sinon.stub().rejects(new Error('publish failed')),
            resolvePaths: sinon.stub().returns(['/a']),
        };

        const res = await main(params, deps);

        expect(res.statusCode).to.equal(500);
        expect(res.body.error).to.be.a('string');
    });
});
