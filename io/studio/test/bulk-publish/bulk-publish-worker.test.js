const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');

chai.use(sinonChai);

describe('bulk-publish-worker — runWorker', () => {
    let worker, deps;
    const preRecordedEntries = [
        '{"fragmentId":"frag-1","versionId":"v-green","wasPublished":true,"createdAt":"2026-01-01T00:00:00Z"}',
    ];
    const publishCreatedEntries = [
        '{"fragmentId":"frag-1","versionId":"v-red","wasPublished":true,"createdAt":"2026-01-02T00:00:00Z"}',
    ];
    beforeEach(() => {
        deps = {
            readProjectFragment: sinon.stub().resolves({ fragment: { id: 'proj-1' }, etag: 'e1' }),
            getProjectPaths: sinon.stub().returns(['/content/dam/mas/acom/en_US/a']),
            getProjectLocales: sinon.stub().returns(['es_MX']),
            getProjectTitle: sinon.stub().returns('Proj'),
            getProjectSnapshots: sinon.stub().returns([]),
            publishResolved: sinon.stub(),
            createSnapshot: sinon.stub().resolves({ entries: ['{"fragmentId":"f1"}'], expandedPaths: [], failures: [] }),
            recordSnapshot: sinon.stub().resolves({ entries: preRecordedEntries, failures: [] }),
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

    it('uses pre-recorded snapshots as revert target and still calls createSnapshot for CF versions', async () => {
        deps.getProjectSnapshots.returns(preRecordedEntries);
        deps.createSnapshot.resolves({ entries: publishCreatedEntries, failures: [] });
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.createSnapshot).to.have.been.calledOnce;
        expect(deps.recordSnapshot).to.not.have.been.called;
        const finalSnapshots = deps.updateProjectFragment.lastCall.args[3].snapshots;
        expect(JSON.parse(finalSnapshots[0]).versionId).to.equal('v-green');
    });

    it('passes includeCards and includeVariations to createSnapshot in pre-recorded branch', async () => {
        deps.getProjectSnapshots.returns(preRecordedEntries);
        deps.createSnapshot.resolves({ entries: publishCreatedEntries, expandedPaths: [], failures: [] });
        deps.publishResolved.resolves([]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker(
            {
                projectId: 'proj-1',
                odinEndpoint: 'https://odin',
                authToken: 't',
                publishedBy: '',
                includeCards: true,
                includeVariations: true,
            },
            deps,
        );

        const snapshotCall = deps.createSnapshot.firstCall.args[0];
        expect(snapshotCall.includeCards).to.equal(true);
        expect(snapshotCall.includeVariations).to.equal(true);
    });

    it('merges cascaded entries (not in pre-recorded) into snapshotEntries in pre-recorded branch', async () => {
        const collEntry = JSON.stringify({
            fragmentId: 'frag-coll',
            versionId: 'v-green',
            wasPublished: true,
            createdAt: '2026-01-01T00:00:00Z',
        });
        const cardEntry = JSON.stringify({
            fragmentId: 'frag-card',
            versionId: 'v-pre-bulk',
            wasPublished: false,
            createdAt: '2026-01-01T00:00:00Z',
        });
        deps.getProjectSnapshots.returns([collEntry]);
        deps.createSnapshot.resolves({
            entries: [
                // frag-coll is already in pre-recorded → should be skipped
                JSON.stringify({
                    fragmentId: 'frag-coll',
                    versionId: 'v-pre-bulk',
                    wasPublished: true,
                    createdAt: '2026-01-01T00:00:00Z',
                }),
                cardEntry,
            ],
            expandedPaths: ['/content/dam/coll', '/content/dam/card'],
            failures: [],
        });
        deps.publishResolved.resolves([]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '', includeCards: true },
            deps,
        );

        const finalSnapshots = deps.updateProjectFragment.lastCall.args[3].snapshots;
        expect(finalSnapshots).to.have.length(2);
        expect(JSON.parse(finalSnapshots[0]).versionId).to.equal('v-green'); // pre-recorded wins
        expect(JSON.parse(finalSnapshots[1]).fragmentId).to.equal('frag-card'); // cascaded appended
    });

    it('merges cascaded entries into snapshotEntries in fallback (no pre-recorded) branch', async () => {
        const collEntry = JSON.stringify({
            fragmentId: 'frag-coll',
            versionId: null,
            wasPublished: false,
            createdAt: '2026-01-01T00:00:00Z',
        });
        const cardEntry = JSON.stringify({
            fragmentId: 'frag-card',
            versionId: 'v-pre-bulk',
            wasPublished: false,
            createdAt: '2026-01-01T00:00:00Z',
        });
        deps.getProjectSnapshots.returns([]);
        deps.recordSnapshot.resolves({ entries: [collEntry], failures: [] });
        deps.createSnapshot.resolves({
            entries: [
                JSON.stringify({
                    fragmentId: 'frag-coll',
                    versionId: 'v-pre-bulk',
                    wasPublished: false,
                    createdAt: '2026-01-01T00:00:00Z',
                }),
                cardEntry,
            ],
            expandedPaths: ['/content/dam/coll', '/content/dam/card'],
            failures: [],
        });
        deps.publishResolved.resolves([]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '', includeCards: true },
            deps,
        );

        const finalSnapshots = deps.updateProjectFragment.lastCall.args[3].snapshots;
        expect(finalSnapshots).to.have.length(2);
        expect(JSON.parse(finalSnapshots[0]).versionId).to.be.null; // record entry wins (null = new card)
        expect(JSON.parse(finalSnapshots[1]).fragmentId).to.equal('frag-card'); // cascaded appended
    });

    it('publishes expanded paths from pre-recorded branch when includeCards is true', async () => {
        const collPath = '/content/dam/mas/acom/en_US/coll';
        const cardPath = '/content/dam/mas/acom/en_US/card-1';
        const collEntry = JSON.stringify({
            fragmentId: 'frag-coll',
            versionId: 'v-green',
            wasPublished: true,
            createdAt: '2026-01-01T00:00:00Z',
        });
        deps.getProjectPaths.returns([collPath]);
        deps.getProjectSnapshots.returns([collEntry]);
        deps.createSnapshot.resolves({
            entries: [
                JSON.stringify({
                    fragmentId: 'frag-coll',
                    versionId: 'v-pre-bulk',
                    wasPublished: true,
                    createdAt: '2026-01-01T00:00:00Z',
                }),
            ],
            expandedPaths: [collPath, cardPath],
            failures: [],
        });
        deps.publishResolved.resolves([
            { path: collPath, status: 'published' },
            { path: cardPath, status: 'published' },
        ]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker(
            { projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '', includeCards: true },
            deps,
        );

        const publishedPaths = deps.publishResolved.firstCall.args[0];
        expect(publishedPaths).to.include(collPath);
        expect(publishedPaths).to.include(cardPath);
    });

    it('publishes expanded paths (cards) when includeCards is true', async () => {
        const collPath = '/content/dam/mas/acom/en_US/coll';
        const cardPath = '/content/dam/mas/acom/en_US/card-1';
        deps.getProjectPaths.returns([collPath]);
        deps.getProjectLocales.returns([]);
        deps.createSnapshot.resolves({
            entries: ['{"fragmentId":"f-coll"}'],
            expandedPaths: [collPath, cardPath],
            failures: [],
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
            failures: [],
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

    it('calls recordSnapshot when no pre-recorded snapshots exist (fallback path)', async () => {
        deps.getProjectSnapshots.returns([]);
        deps.recordSnapshot.resolves({ entries: preRecordedEntries, failures: [] });
        deps.createSnapshot.resolves({ entries: publishCreatedEntries, failures: [] });
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.recordSnapshot).to.have.been.calledOnce;
        expect(deps.createSnapshot).to.have.been.calledOnce;
        const finalSnapshots = deps.updateProjectFragment.lastCall.args[3].snapshots;
        expect(JSON.parse(finalSnapshots[0]).versionId).to.equal('v-green');
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

    it('uses pre-recorded snapshots with versionId: null (new cards) as revert target', async () => {
        const nullVersionEntries = [
            JSON.stringify({ fragmentId: 'frag-new', versionId: null, wasPublished: false, createdAt: '2026-01-01T00:00:00Z' }),
        ];
        deps.getProjectSnapshots.returns(nullVersionEntries);
        deps.createSnapshot.resolves({ entries: publishCreatedEntries, failures: [] });
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.createSnapshot).to.have.been.calledOnce;
        expect(deps.recordSnapshot).to.not.have.been.called;
        const finalSnapshots = deps.updateProjectFragment.lastCall.args[3].snapshots;
        expect(JSON.parse(finalSnapshots[0]).versionId).to.be.null;
    });

    it('falls through to record+createSnapshot when existing entry has publishComplete: true', async () => {
        const completedEntry = JSON.stringify({
            fragmentId: 'frag-1',
            versionId: 'v-green',
            wasPublished: true,
            createdAt: '2026-01-01T00:00:00Z',
            publishComplete: true,
        });
        deps.getProjectSnapshots.returns([completedEntry]);
        deps.recordSnapshot.resolves({ entries: preRecordedEntries, failures: [] });
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.recordSnapshot).to.have.been.calledOnce;
        expect(deps.createSnapshot).to.have.been.calledOnce;
    });

    it('preserves snapshotError in final update when recordSnapshot has failures (fallback path)', async () => {
        deps.getProjectSnapshots.returns([]);
        const failures = [{ path: '/content/dam/mas/acom/en_US/a', error: 'No non-translation version found' }];
        deps.recordSnapshot.resolves({ entries: [], failures });
        deps.createSnapshot.resolves({ entries: publishCreatedEntries, failures: [] });
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        const finalLastError = deps.updateProjectFragment.lastCall.args[3].lastError;
        expect(finalLastError).to.include('SAVE_SNAPSHOT:');
        expect(finalLastError).to.include('/content/dam/mas/acom/en_US/a');
    });

    it('treats a malformed snapshot entry as not pre-recorded and falls back to record+snapshot', async () => {
        deps.getProjectSnapshots.returns(['not-json']);
        deps.publishResolved.resolves([{ path: '/content/dam/mas/acom/en_US/a', status: 'published' }]);
        deps.getProjectLocales.returns([]);

        await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't', publishedBy: '' }, deps);

        expect(deps.recordSnapshot).to.have.been.calledOnce;
        expect(deps.createSnapshot).to.have.been.calledOnce;
    });

    it('sets status to Failed and returns early when project has no paths and no pending snapshot', async () => {
        const { PROJECT_STATUS } = require('../../src/bulk-publish/project.js');
        deps.getProjectPaths.returns([]);
        deps.getProjectSnapshots.returns([]);

        const result = await worker.runWorker({ projectId: 'proj-1', odinEndpoint: 'https://odin', authToken: 't' }, deps);

        expect(deps.createSnapshot).to.not.have.been.called;
        expect(deps.publishResolved).to.not.have.been.called;
        const updateCall = deps.updateProjectFragment.firstCall;
        expect(updateCall.args[3].status).to.equal(PROJECT_STATUS.FAILED);
        expect(updateCall.args[3].lastError).to.be.a('string').and.not.be.empty;
        expect(result.total).to.equal(0);
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
