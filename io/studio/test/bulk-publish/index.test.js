const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/index.js', () => {
    let action;
    let fetchOdinStub;
    let fetchFragmentByPathStub;
    let isAllowedStub;
    let loggerStub;

    const baseParams = {
        __ow_headers: { authorization: 'Bearer test-token' },
        aemOdinEndpoint: 'https://odin.example',
        allowedClientId: 'mas-studio',
        paths: ['/content/dam/mas/acom/en_US/nico'],
    };

    function successResponseFor(paths) {
        return {
            json: async () => ({
                workflowInstanceId: 'wf-1',
                items: paths.map((path) => ({ id: `id-${path}`, path, status: 'SUCCESS_TRIGGERED' })),
            }),
        };
    }

    beforeEach(() => {
        fetchOdinStub = sinon.stub().callsFake((_, __, ___, opts) => {
            const body = JSON.parse(opts.body);
            return Promise.resolve(successResponseFor(body.paths));
        });
        fetchFragmentByPathStub = sinon.stub();
        isAllowedStub = sinon.stub().resolves(true);
        loggerStub = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };

        const { resolvePaths } = require('../../src/bulk-publish/resolver.js');

        const publisher = proxyquire('../../src/bulk-publish/publisher.js', {
            '../common.js': {
                fetchOdin: fetchOdinStub,
                fetchFragmentByPath: fetchFragmentByPathStub,
            },
        });

        const realUtils = require('../../utils.js');
        action = proxyquire('../../src/bulk-publish/index.js', {
            '@adobe/aio-sdk': { Core: { Logger: () => loggerStub } },
            './resolver.js': { resolvePaths },
            './publisher.js': publisher,
            './snapshot.js': { createSnapshot: sinon.stub().resolves([]) },
            './project.js': {
                readProjectFragment: sinon.stub().resolves({ fragment: { fields: [] }, etag: '"e"' }),
                updateProjectFragment: sinon.stub().resolves(),
                getProjectPaths: sinon.stub().returns([]),
                getProjectLocales: sinon.stub().returns([]),
                getProjectTitle: sinon.stub().returns(''),
            },
            '../../utils.js': { ...realUtils, isAllowed: isAllowedStub },
        });
    });

    afterEach(() => sinon.restore());

    it('returns 400 when paths is missing', async () => {
        const result = await action.main({ ...baseParams, paths: undefined });
        expect(result.error.statusCode).to.equal(400);
    });

    it('validates token against allowedClientId from params', async () => {
        await action.main({ ...baseParams });
        expect(isAllowedStub).to.have.been.calledWith(sinon.match.string, 'mas-studio');
    });

    it('returns 401 when IMS validation fails regardless of params', async () => {
        isAllowedStub.resolves(false);
        const result = await action.main({ ...baseParams, allowedClientId: 'attacker-id' });
        expect(result.error.statusCode).to.equal(401);
    });

    it('returns 400 when neither aemOdinEndpoint nor odinEndpoint is provided', async () => {
        const { aemOdinEndpoint, ...withoutEndpoint } = baseParams;
        const result = await action.main(withoutEndpoint);
        expect(result.error.statusCode).to.equal(400);
        expect(result.error.body.error).to.include('aemOdinEndpoint');
    });

    it('accepts legacy odinEndpoint param when aemOdinEndpoint is absent', async () => {
        const { aemOdinEndpoint, ...withoutAem } = baseParams;
        const result = await action.main({ ...withoutAem, odinEndpoint: 'https://legacy.example' });
        expect(result.statusCode).to.equal(200);
    });

    it('returns 400 when a path does not start with /content/dam/mas/', async () => {
        const result = await action.main({ ...baseParams, paths: ['/content/dam/internal/secrets'] });
        expect(result.error.statusCode).to.equal(400);
        expect(result.error.body.error).to.include('/content/dam/mas/');
    });

    it('returns 400 with a clear message when paths contains a non-string entry', async () => {
        const result = await action.main({ ...baseParams, paths: [null, '/content/dam/mas/acom/en_US/nico'] });
        expect(result.error.statusCode).to.equal(400);
        expect(result.error.body.error).to.include('/content/dam/mas/');
    });

    it('returns 400 when paths exceeds maximum', async () => {
        const paths = Array.from({ length: 501 }, (_, i) => `/content/dam/mas/acom/en_US/item-${i}`);
        const result = await action.main({ ...baseParams, paths });
        expect(result.error.statusCode).to.equal(400);
        expect(result.error.body.error).to.include('500');
    });

    it('returns 400 when locales exceeds maximum', async () => {
        const locales = Array.from({ length: 51 }, (_, i) => `locale_${i}`);
        const result = await action.main({ ...baseParams, locales });
        expect(result.error.statusCode).to.equal(400);
        expect(result.error.body.error).to.include('50');
    });

    it('never calls fetchFragmentByPath (skip-check removed)', async () => {
        await action.main({ ...baseParams });
        expect(fetchFragmentByPathStub).to.not.have.been.called;
    });

    describe('publish-fresh scenario', () => {
        it('publishes a single path via one Odin chunk call', async () => {
            const result = await action.main({ ...baseParams });

            expect(result.statusCode).to.equal(200);
            expect(result.body.summary).to.deep.equal({ total: 1, published: 1, skipped: 0, failed: 0 });
            expect(fetchOdinStub).to.have.been.calledOnce;
            const [, , , opts] = fetchOdinStub.firstCall.args;
            const body = JSON.parse(opts.body);
            expect(body.paths).to.deep.equal(baseParams.paths);
            expect(result.body.details[0]).to.include({ status: 'published', retries: 0 });
        });
    });

    describe('filterReferencesByStatus passthrough', () => {
        it('sends filterReferencesByStatus=[] when neither includeVariations nor includeCards', async () => {
            await action.main({ ...baseParams });
            const body = JSON.parse(fetchOdinStub.firstCall.args[3].body);
            expect(body.filterReferencesByStatus).to.deep.equal([]);
        });

        it('sends filterReferencesByStatus=[DRAFT,MODIFIED,UNPUBLISHED] when includeVariations=true', async () => {
            await action.main({ ...baseParams, includeVariations: true });
            const body = JSON.parse(fetchOdinStub.firstCall.args[3].body);
            expect(body.filterReferencesByStatus).to.deep.equal(['DRAFT', 'MODIFIED', 'UNPUBLISHED']);
        });

        it('sends filterReferencesByStatus=[DRAFT,MODIFIED,UNPUBLISHED] when includeCards=true', async () => {
            await action.main({ ...baseParams, includeCards: true });
            const body = JSON.parse(fetchOdinStub.firstCall.args[3].body);
            expect(body.filterReferencesByStatus).to.deep.equal(['DRAFT', 'MODIFIED', 'UNPUBLISHED']);
        });
    });

    describe('429 retry scenario', () => {
        it('retries the whole chunk on 429 and succeeds on the second attempt', async () => {
            fetchOdinStub.reset();
            fetchOdinStub.onFirstCall().rejects(new Error('POST failed with status 429: Too Many Requests'));
            fetchOdinStub.onSecondCall().callsFake((_, __, ___, opts) => {
                const body = JSON.parse(opts.body);
                return Promise.resolve(successResponseFor(body.paths));
            });

            const clock = sinon.useFakeTimers();
            const promise = action.main({ ...baseParams });
            await clock.tickAsync(2000);
            const result = await promise;
            clock.restore();

            expect(result.statusCode).to.equal(200);
            expect(result.body.summary).to.deep.equal({ total: 1, published: 1, skipped: 0, failed: 0 });
            expect(result.body.details[0]).to.include({ status: 'published', retries: 1 });
            expect(fetchOdinStub).to.have.been.calledTwice;
        });
    });

    describe('partial-failure + restart idempotency', () => {
        it('first run fails some paths, re-running publishes the previously failed ones', async () => {
            const paths = [
                '/content/dam/mas/acom/en_US/a',
                '/content/dam/mas/acom/en_US/b',
                '/content/dam/mas/acom/en_US/c',
                '/content/dam/mas/acom/en_US/d',
                '/content/dam/mas/acom/en_US/e',
            ];

            const failPaths = new Set([paths[3], paths[4]]);

            fetchOdinStub.reset();
            fetchOdinStub.callsFake((_, __, ___, opts) => {
                const body = JSON.parse(opts.body);
                return Promise.resolve({
                    json: async () => ({
                        workflowInstanceId: 'wf',
                        items: body.paths.map((path) => ({
                            id: `id-${path}`,
                            path,
                            status: failPaths.has(path) ? 'ERROR_INVALID' : 'SUCCESS_TRIGGERED',
                        })),
                    }),
                });
            });

            const firstRun = await action.main({ ...baseParams, paths });
            expect(firstRun.body.summary.published).to.equal(3);
            expect(firstRun.body.summary.failed).to.equal(2);

            failPaths.clear();
            fetchOdinStub.resetHistory();

            const secondRun = await action.main({ ...baseParams, paths });
            expect(secondRun.body.summary.published).to.equal(5);
            expect(secondRun.body.summary.failed).to.equal(0);
            expect(fetchOdinStub).to.have.been.calledOnce;
        });
    });

    describe('locale grouping and chunking', () => {
        it('issues one Odin call per locale group (1 path × 2 locales → 3 chunks)', async () => {
            const result = await action.main({
                ...baseParams,
                paths: ['/content/dam/mas/acom/en_US/nico'],
                locales: ['fr_FR', 'de_DE'],
            });

            expect(result.body.summary.total).to.equal(3);
            expect(result.body.summary.published).to.equal(3);
            expect(fetchOdinStub).to.have.been.calledThrice;
            const localesSeen = fetchOdinStub
                .getCalls()
                .map((call) => JSON.parse(call.args[3].body).paths[0])
                .map((path) => path.split('/')[5]);
            expect(localesSeen).to.have.members(['en_US', 'fr_FR', 'de_DE']);
        });

        it('chunks 55 same-locale paths into 50 + 5 and sends all 55 (no silent truncation)', async () => {
            const paths = Array.from({ length: 55 }, (_, i) => `/content/dam/mas/acom/en_US/item-${i}`);

            const result = await action.main({ ...baseParams, paths });

            expect(result.body.summary.total).to.equal(55);
            expect(result.body.summary.published).to.equal(55);
            expect(fetchOdinStub).to.have.been.calledTwice;
            const chunkSizes = fetchOdinStub
                .getCalls()
                .map((call) => JSON.parse(call.args[3].body).paths.length)
                .sort((a, b) => b - a);
            expect(chunkSizes).to.deep.equal([50, 5]);
            const allSent = fetchOdinStub.getCalls().flatMap((call) => JSON.parse(call.args[3].body).paths);
            expect(new Set(allSent).size).to.equal(55);
        });

        it('groups paths from multiple locales into separate chunks of varying size', async () => {
            const paths = ['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/en_US/b', '/content/dam/mas/acom/fr_FR/c'];

            const result = await action.main({ ...baseParams, paths });

            expect(result.body.summary.total).to.equal(3);
            expect(result.body.summary.published).to.equal(3);
            expect(fetchOdinStub).to.have.been.calledTwice;
            const bodies = fetchOdinStub.getCalls().map((call) => JSON.parse(call.args[3].body).paths);
            const sizes = bodies.map((p) => p.length).sort((a, b) => b - a);
            expect(sizes).to.deep.equal([2, 1]);
        });
    });

    describe('project-orchestration mode (projectId)', () => {
        const paths = ['/content/dam/mas/acom/en_US/card1', '/content/dam/mas/acom/en_US/card2'];
        const locales = [];
        const projectFragment = {
            id: 'proj-uuid',
            title: 'My Project',
            description: '',
            fields: [
                { name: 'title', values: ['My Project'] },
                { name: 'fragments', values: paths },
                { name: 'locales', values: locales },
                { name: 'status', values: ['Draft'] },
            ],
        };

        let getFragmentWithEtagStub;
        let putToOdinStub;
        let createSnapshotStub;
        let projectAction;

        beforeEach(() => {
            getFragmentWithEtagStub = sinon.stub().resolves({ fragment: projectFragment, etag: '"etag-1"' });
            putToOdinStub = sinon.stub().resolves({ success: true });
            createSnapshotStub = sinon
                .stub()
                .resolves([
                    '{"fragmentId":"frag-1","versionId":"v1","wasPublished":true,"createdAt":"2025-01-01T00:00:00.000Z"}',
                ]);

            const { resolvePaths } = require('../../src/bulk-publish/resolver.js');
            const publisher = proxyquire('../../src/bulk-publish/publisher.js', {
                '../common.js': { fetchOdin: fetchOdinStub, fetchFragmentByPath: fetchFragmentByPathStub },
            });
            const realUtils = require('../../utils.js');

            projectAction = proxyquire('../../src/bulk-publish/index.js', {
                '@adobe/aio-sdk': { Core: { Logger: () => loggerStub } },
                './resolver.js': { resolvePaths },
                './publisher.js': publisher,
                './snapshot.js': { createSnapshot: createSnapshotStub },
                './project.js': {
                    readProjectFragment: getFragmentWithEtagStub,
                    updateProjectFragment: putToOdinStub,
                    getProjectPaths: () => paths,
                    getProjectLocales: () => locales,
                    getProjectTitle: () => 'My Project',
                    getProjectSnapshots: () => [],
                },
                '../../utils.js': { ...realUtils, isAllowed: isAllowedStub },
            });
        });

        it('returns 401 when auth fails', async () => {
            isAllowedStub.resolves(false);
            const result = await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });
            expect(result.error.statusCode).to.equal(401);
        });

        it('sets status PUBLISHING then PUBLISHED on full success', async () => {
            const result = await projectAction.main({
                ...baseParams,
                paths: undefined,
                projectId: 'proj-uuid',
                publishedBy: 'user@example.com',
            });

            expect(result.statusCode).to.equal(200);
            expect(result.body.status).to.equal('Published');
            expect(result.body.publishedBy).to.equal('user@example.com');

            const firstPatch = putToOdinStub.firstCall.args[3];
            expect(firstPatch).to.include({ status: 'Publishing', lastError: '' });
        });

        it('sets status DRAFT with lastError when createSnapshot fails', async () => {
            createSnapshotStub.rejects(new Error('snapshot failed'));

            const result = await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });

            expect(result.statusCode).to.equal(200);
            expect(result.body.status).to.equal('Draft');
            expect(result.body.lastError).to.equal('snapshot failed');
        });

        it('calls createSnapshot with paths and projectId from project fragment', async () => {
            await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });

            expect(createSnapshotStub.calledOnce).to.be.true;
            const snapshotArgs = createSnapshotStub.firstCall.args[0];
            expect(snapshotArgs.paths).to.deep.equal(paths);
            expect(snapshotArgs.projectId).to.equal('proj-uuid');
        });

        it('calls createSnapshot with includeCards: false, includeVariations: false by default', async () => {
            await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });

            const snapshotArgs = createSnapshotStub.firstCall.args[0];
            expect(snapshotArgs.includeCards).to.be.false;
            expect(snapshotArgs.includeVariations).to.be.false;
        });

        it('calls createSnapshot with includeVariations: true when includeVariations param is set', async () => {
            await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid', includeVariations: true });

            const snapshotArgs = createSnapshotStub.firstCall.args[0];
            expect(snapshotArgs.includeVariations).to.be.true;
        });

        it('calls createSnapshot with includeCards: true when includeCards param is set', async () => {
            await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid', includeCards: true });

            const snapshotArgs = createSnapshotStub.firstCall.args[0];
            expect(snapshotArgs.includeCards).to.be.true;
        });

        it('includes snapshots in final project update', async () => {
            await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });

            const lastPatch = putToOdinStub.lastCall.args[3];
            expect(lastPatch.snapshots).to.be.an('array').with.length(1);
        });

        it('returns 500 when setting status to Publishing fails', async () => {
            putToOdinStub.onFirstCall().rejects(new Error('patch failed'));

            const result = await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.include('Failed to update project status');
        });

        it('sets status DRAFT when no paths resolve after locale expansion', async () => {
            const { resolvePaths: _real, ...restResolver } = require('../../src/bulk-publish/resolver.js');
            const realUtils = require('../../utils.js');
            const publisher = proxyquire('../../src/bulk-publish/publisher.js', {
                '../common.js': { fetchOdin: fetchOdinStub, fetchFragmentByPath: fetchFragmentByPathStub },
            });

            const emptyResolveAction = proxyquire('../../src/bulk-publish/index.js', {
                '@adobe/aio-sdk': { Core: { Logger: () => loggerStub } },
                './resolver.js': { resolvePaths: sinon.stub().returns([]) },
                './publisher.js': publisher,
                './snapshot.js': { createSnapshot: createSnapshotStub },
                './project.js': {
                    readProjectFragment: getFragmentWithEtagStub,
                    updateProjectFragment: putToOdinStub,
                    getProjectPaths: () => paths,
                    getProjectLocales: () => [],
                    getProjectTitle: () => 'My Project',
                    getProjectSnapshots: () => [],
                },
                '../../utils.js': { ...realUtils, isAllowed: isAllowedStub },
            });

            const result = await emptyResolveAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });

            expect(result.statusCode).to.equal(200);
            expect(result.body.status).to.equal('Draft');
            expect(result.body.lastError).to.equal('No valid paths after locale resolution');
        });

        it('returns 500 with actionable message when final project patch fails', async () => {
            putToOdinStub.onSecondCall().rejects(new Error('final patch failed'));

            const result = await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.include('Content was published but project state could not be saved');
            expect(loggerStub.error).to.have.been.calledWithMatch(sinon.match(/project-final-patch-error/));
        });

        it('always sends filterReferencesByStatus=[] in project mode (snapshot handles traversal, cascade must not overshoot)', async () => {
            await projectAction.main({
                ...baseParams,
                paths: undefined,
                projectId: 'proj-uuid',
                includeCards: true,
                includeVariations: true,
            });

            const publishBody = JSON.parse(fetchOdinStub.firstCall.args[3].body);
            expect(publishBody.filterReferencesByStatus).to.deep.equal([]);
        });

        it('uses snapshot paths as publish targets when snapshot entries contain path', async () => {
            const snapshotPaths = [
                '/content/dam/mas/acom/en_US/card1',
                '/content/dam/mas/acom/en_US/card2',
                '/content/dam/mas/acom/en_US/card3',
            ];
            createSnapshotStub.resolves(
                snapshotPaths.map((path, i) =>
                    JSON.stringify({
                        fragmentId: `frag-${i}`,
                        path,
                        versionId: `v${i}`,
                        wasPublished: false,
                        createdAt: '2025-01-01T00:00:00.000Z',
                    }),
                ),
            );

            await projectAction.main({ ...baseParams, paths: undefined, projectId: 'proj-uuid' });

            const publishBody = JSON.parse(fetchOdinStub.firstCall.args[3].body);
            expect(publishBody.paths).to.deep.equal(snapshotPaths);
        });
    });
});
