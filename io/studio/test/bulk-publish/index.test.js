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
    let imsValidateStub;
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
        imsValidateStub = sinon.stub().resolves({ valid: true });
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

        action = proxyquire('../../src/bulk-publish/index.js', {
            '@adobe/aio-sdk': { Core: { Logger: () => loggerStub } },
            '@adobe/aio-lib-ims': {
                Ims: class {
                    validateTokenAllowList(...args) {
                        return imsValidateStub(...args);
                    }
                },
            },
            './resolver.js': { resolvePaths },
            './publisher.js': publisher,
            '../../utils.js': require('../../utils.js'),
        });
    });

    afterEach(() => sinon.restore());

    it('returns 400 when paths is missing', async () => {
        const result = await action.main({ ...baseParams, paths: undefined });
        expect(result.error.statusCode).to.equal(400);
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

    it('returns 401 when IMS validation fails', async () => {
        imsValidateStub.resolves({ valid: false });
        const result = await action.main({ ...baseParams });
        expect(result.error.statusCode).to.equal(401);
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
});
