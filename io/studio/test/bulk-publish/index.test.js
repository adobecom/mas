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
        odinEndpoint: 'https://odin.example',
        allowedClientId: 'mas-studio',
        paths: ['/content/dam/mas/acom/en_US/nico'],
    };

    beforeEach(() => {
        fetchOdinStub = sinon.stub().resolves({ ok: true });
        fetchFragmentByPathStub = sinon.stub();
        imsValidateStub = sinon.stub().resolves({ valid: true });
        loggerStub = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };

        const { resolvePaths } = require('../../src/bulk-publish/resolver.js');
        const { isAlreadyPublished } = require('../../src/bulk-publish/skip-check.js');
        const { processBatchWithConcurrency } = proxyquire('../../src/common.js', {
            '@adobe/aio-sdk': { Core: { Logger: () => loggerStub } },
        });

        const publisher = proxyquire('../../src/bulk-publish/publisher.js', {
            '../common.js': {
                fetchOdin: fetchOdinStub,
                fetchFragmentByPath: fetchFragmentByPathStub,
            },
            './skip-check.js': { isAlreadyPublished },
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
            '../common.js': { processBatchWithConcurrency },
            './resolver.js': { resolvePaths },
            './publisher.js': publisher,
            './queue.js': { enqueue: (task) => task() },
            '../../utils.js': require('../../utils.js'),
        });
    });

    afterEach(() => sinon.restore());

    it('returns 400 when paths is missing', async () => {
        const result = await action.main({ ...baseParams, paths: undefined });
        expect(result.error.statusCode).to.equal(400);
    });

    it('returns 401 when IMS validation fails', async () => {
        imsValidateStub.resolves({ valid: false });
        fetchFragmentByPathStub.resolves({
            fragment: makeFragment({ path: baseParams.paths[0] }),
            status: 200,
            etag: 'e',
        });
        const result = await action.main({ ...baseParams });
        expect(result.error.statusCode).to.equal(401);
    });

    describe('verification scenario 1 — publish-fresh', () => {
        it('publishes an unpublished fragment and logs success', async () => {
            fetchFragmentByPathStub.resolves({
                fragment: makeFragment({
                    path: baseParams.paths[0],
                    modified: '2026-04-05T00:00:00.000Z',
                }),
                status: 200,
                etag: 'etag-1',
            });

            const result = await action.main({ ...baseParams });

            expect(result.statusCode).to.equal(200);
            expect(result.body.summary).to.deep.equal({ total: 1, published: 1, skipped: 0, failed: 0 });
            expect(fetchOdinStub).to.have.been.calledOnce;
            expect(result.body.details[0]).to.include({ status: 'published', retries: 0 });
        });
    });

    describe('verification scenario 2 — skip-already-published', () => {
        it('does not call publish when published.at > modified.at', async () => {
            fetchFragmentByPathStub.resolves({
                fragment: makeFragment({
                    path: baseParams.paths[0],
                    modified: '2026-04-01T00:00:00.000Z',
                    published: '2026-04-05T00:00:00.000Z',
                }),
                status: 200,
                etag: 'etag-1',
            });

            const result = await action.main({ ...baseParams });

            expect(result.statusCode).to.equal(200);
            expect(result.body.summary).to.deep.equal({ total: 1, published: 0, skipped: 1, failed: 0 });
            expect(fetchOdinStub).to.not.have.been.called;
            expect(result.body.details[0]).to.include({ status: 'skipped', reason: 'already-published' });
        });
    });

    describe('verification scenario 3 — 429 retry', () => {
        it('retries after a transient failure and succeeds on the second attempt', async () => {
            fetchFragmentByPathStub.resolves({
                fragment: makeFragment({
                    path: baseParams.paths[0],
                    modified: '2026-04-05T00:00:00.000Z',
                }),
                status: 200,
                etag: 'etag-1',
            });
            fetchOdinStub.onFirstCall().rejects(new Error('429 Too Many Requests'));
            fetchOdinStub.onSecondCall().resolves({ ok: true });

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

    describe('verification scenario 4 — partial failure + restart', () => {
        it('re-running the same input after a partial failure only retries the failures', async () => {
            const paths = [
                '/content/dam/mas/acom/en_US/a',
                '/content/dam/mas/acom/en_US/b',
                '/content/dam/mas/acom/en_US/c',
                '/content/dam/mas/acom/en_US/d',
                '/content/dam/mas/acom/en_US/e',
            ];

            const state = {
                '/content/dam/mas/acom/en_US/a': { published: false, failCount: 0 },
                '/content/dam/mas/acom/en_US/b': { published: false, failCount: 0 },
                '/content/dam/mas/acom/en_US/c': { published: false, failCount: 0 },
                '/content/dam/mas/acom/en_US/d': { published: false, failCount: 3 },
                '/content/dam/mas/acom/en_US/e': { published: false, failCount: 3 },
            };

            fetchFragmentByPathStub.callsFake((endpoint, path) => {
                const entry = state[path];
                const fragment = makeFragment({
                    path,
                    modified: '2026-04-01T00:00:00.000Z',
                    published: entry.published ? '2026-04-05T00:00:00.000Z' : undefined,
                });
                return Promise.resolve({ fragment, status: 200, etag: 'e' });
            });

            fetchOdinStub.callsFake((endpoint, uri, token, opts) => {
                const body = JSON.parse(opts.body);
                const path = body.paths[0];
                const entry = state[path];
                if (entry.failCount > 0) {
                    entry.failCount -= 1;
                    return Promise.reject(new Error('Odin transient error'));
                }
                entry.published = true;
                return Promise.resolve({ ok: true });
            });

            const clock = sinon.useFakeTimers();
            const firstRunPromise = action.main({ ...baseParams, paths });
            await clock.tickAsync(30000);
            const firstRun = await firstRunPromise;
            clock.restore();

            expect(firstRun.statusCode).to.equal(200);
            expect(firstRun.body.summary.published).to.equal(3);
            expect(firstRun.body.summary.failed).to.equal(2);
            expect(firstRun.body.summary.skipped).to.equal(0);

            fetchOdinStub.resetHistory();
            state['/content/dam/mas/acom/en_US/d'].failCount = 0;
            state['/content/dam/mas/acom/en_US/e'].failCount = 0;

            const secondRun = await action.main({ ...baseParams, paths });

            expect(secondRun.statusCode).to.equal(200);
            expect(secondRun.body.summary.skipped).to.equal(3);
            expect(secondRun.body.summary.published).to.equal(2);
            expect(secondRun.body.summary.failed).to.equal(0);
            expect(fetchOdinStub).to.have.been.calledTwice;
        });
    });

    describe('locale expansion', () => {
        it('expands paths × locales and publishes each target', async () => {
            fetchFragmentByPathStub.callsFake((endpoint, path) =>
                Promise.resolve({
                    fragment: makeFragment({ path, modified: '2026-04-05T00:00:00.000Z' }),
                    status: 200,
                    etag: 'e',
                }),
            );

            const result = await action.main({
                ...baseParams,
                paths: ['/content/dam/mas/acom/en_US/nico'],
                locales: ['fr_FR', 'de_DE'],
            });

            expect(result.body.summary.total).to.equal(3);
            expect(result.body.summary.published).to.equal(3);
            expect(fetchOdinStub).to.have.been.calledThrice;
        });
    });
});

function makeFragment({ path, modified, published }) {
    const fragment = {
        id: `id-${path}`,
        path,
        modified: { at: modified, by: 'test@adobe.com', fullName: 'Test User' },
    };
    if (published) {
        fragment.published = { at: published, by: 'test@adobe.com', fullName: 'Test User' };
    }
    return fragment;
}
