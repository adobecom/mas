const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');

chai.use(sinonChai);

const { selectRolloutItems } = require('../../src/bulk-publish/bulk-publish-worker.js');

describe('bulk-publish-worker — selectRolloutItems', () => {
    const sourcePaths = ['/content/dam/mas/acom/en_US/card-a', '/content/dam/mas/acom/en_US/card-b'];

    it('selects only not-found failures whose locale is user-selected', () => {
        const details = [
            { path: '/content/dam/mas/acom/es_MX/card-a', status: 'failed', reason: 'not-found' },
            { path: '/content/dam/mas/acom/de_DE/card-a', status: 'failed', reason: 'not-found' },
            { path: '/content/dam/mas/acom/es_MX/card-b', status: 'published' },
        ];
        const items = selectRolloutItems({ details, sourcePaths, locales: ['es_MX', 'fr_CA'] });

        expect(items).to.deep.equal([{ contentPath: '/content/dam/mas/acom/en_US/card-a', targetLocales: ['es_MX'] }]);
    });

    it('accumulates multiple selected target locales under one source', () => {
        const details = [
            { path: '/content/dam/mas/acom/es_MX/card-a', status: 'failed', reason: 'not-found' },
            { path: '/content/dam/mas/acom/fr_CA/card-a', status: 'failed', reason: 'not-found' },
        ];
        const items = selectRolloutItems({ details, sourcePaths, locales: ['es_MX', 'fr_CA'] });
        expect(items).to.deep.equal([{ contentPath: '/content/dam/mas/acom/en_US/card-a', targetLocales: ['es_MX', 'fr_CA'] }]);
    });

    it('returns empty when no locales were selected', () => {
        const details = [{ path: '/content/dam/mas/acom/es_MX/card-a', status: 'failed', reason: 'not-found' }];
        expect(selectRolloutItems({ details, sourcePaths, locales: [] })).to.deep.equal([]);
    });

    it('ignores non-not-found failures', () => {
        const details = [{ path: '/content/dam/mas/acom/es_MX/card-a', status: 'failed', reason: 'error-forbidden' }];
        expect(selectRolloutItems({ details, sourcePaths, locales: ['es_MX'] })).to.deep.equal([]);
    });
});

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
            rolloutLocales: sinon.stub().resolves(true),
            waitForFragments: sinon.stub().resolves({ ready: ['/content/dam/mas/acom/es_MX/a'], pending: [] }),
            createSnapshot: sinon.stub().resolves(['{"fragmentId":"f1"}']),
            updateProjectFragment: sinon.stub().resolves(),
            now: () => new Date('2026-06-04T00:00:00.000Z'),
            logger: { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() },
        };
        worker = require('../../src/bulk-publish/bulk-publish-worker.js');
    });
    afterEach(() => sinon.restore());

    it('publishes, rolls out a not-found selected locale, snapshots after rollout, writes Published', async () => {
        deps.publishResolved
            .onFirstCall()
            .resolves([
                { path: '/content/dam/mas/acom/en_US/a', status: 'published' },
                { path: '/content/dam/mas/acom/es_MX/a', status: 'failed', reason: 'not-found' },
            ])
            .onSecondCall()
            .resolves([{ path: '/content/dam/mas/acom/es_MX/a', status: 'published' }]);

        const result = await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: 'u@x.com' },
            deps,
        );

        expect(deps.rolloutLocales).to.have.been.calledOnce;
        expect(deps.publishResolved).to.have.been.calledTwice;
        const snapArgs = deps.createSnapshot.firstCall.args[0];
        expect(snapArgs.paths).to.include.members(['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/es_MX/a']);
        expect(result.published).to.equal(2);
        expect(result.rolledOut).to.equal(1);
        const fields = deps.updateProjectFragment.lastCall.args[3];
        expect(fields.status).to.equal('Published');
        expect(fields.publishedBy).to.equal('u@x.com');
        expect(fields.publishedAt).to.be.a('string');
        expect(JSON.parse(fields.lastResult).published).to.equal(2);
    });

    it('writes Partially published when a rolled-out path stays pending', async () => {
        deps.waitForFragments.resolves({ ready: [], pending: ['/content/dam/mas/acom/es_MX/a'] });
        deps.publishResolved.onFirstCall().resolves([
            { path: '/content/dam/mas/acom/en_US/a', status: 'published' },
            { path: '/content/dam/mas/acom/es_MX/a', status: 'failed', reason: 'not-found' },
        ]);
        const result = await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' },
            deps,
        );
        expect(result.rolloutPending).to.equal(1);
        expect(deps.updateProjectFragment.lastCall.args[3].status).to.equal('Partially published');
    });

    it('sets PUBLISHING with pending-marked snapshot before finalizing', async () => {
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);
        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);
        const firstUpdate = deps.updateProjectFragment.getCall(0).args[3];
        expect(firstUpdate.status).to.equal('Publishing');
        expect(firstUpdate.snapshots[0]).to.include('publishComplete');
    });
});
