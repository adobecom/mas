const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);
const { expect } = chai;

function createProjectFragment(overrides = {}) {
    const { status = ['ASYNC_PROCESSING'], targetLocales = ['fr_FR', 'de_DE', 'es_ES'], completedLocales = [] } = overrides;
    return {
        id: 'proj-1',
        fields: [
            { name: 'status', values: status },
            { name: 'targetLocales', values: targetLocales },
            { name: 'completedLocales', values: completedLocales },
        ],
    };
}

function fragmentResponse(fragment, etag) {
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(fragment),
        headers: { get: (name) => (name?.toLowerCase() === 'etag' ? etag : null) },
    };
}

function conflictResponse() {
    return {
        ok: false,
        status: 412,
        statusText: 'Precondition Failed',
        json: () => Promise.resolve({}),
        headers: { get: () => null },
    };
}

describe('Translation project-start-service — CF mirror helpers', () => {
    let projectStartService;
    let mockLogger;
    const baseParams = { odinEndpoint: 'https://test-odin.com' };

    beforeEach(function () {
        this.timeout(5000);
        mockLogger = { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub() };
        projectStartService = proxyquire('../../src/translation/project-start-service.js', {
            '@adobe/aio-sdk': {
                Core: { Logger: sinon.stub().returns(mockLogger) },
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('addCompletedLocale', () => {
        it('is idempotent: adding the same locale twice produces a single occurrence', async () => {
            let completedLocales = [];
            const patchCalls = [];
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') {
                    return fragmentResponse(createProjectFragment({ completedLocales }), 'etag-1');
                }
                patchCalls.push(JSON.parse(options.body));
                completedLocales = ['fr_FR'];
                return fragmentResponse(createProjectFragment({ completedLocales }), 'etag-2');
            });

            const first = await projectStartService.addCompletedLocale('proj-1', 'fr_FR', 'token', baseParams);
            const second = await projectStartService.addCompletedLocale('proj-1', 'fr_FR', 'token', baseParams);

            expect(first).to.deep.equal({ success: true, etag: 'etag-2' });
            expect(second).to.deep.equal({ success: true, skipped: true });
            expect(patchCalls).to.have.lengthOf(1);
            expect(patchCalls[0][0].value).to.deep.equal(['fr_FR']);
        });

        it('preserves existing completed locales when appending', async () => {
            const fragment = createProjectFragment({ completedLocales: ['fr_FR'] });
            let patchBody;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(fragment, 'etag-1');
                patchBody = JSON.parse(options.body);
                return fragmentResponse(fragment, 'etag-2');
            });

            const result = await projectStartService.addCompletedLocale('proj-1', 'de_DE', 'token', baseParams);

            expect(result).to.deep.equal({ success: true, etag: 'etag-2' });
            expect(patchBody[0].value).to.deep.equal(['fr_FR', 'de_DE']);
        });

        it('refetches and retries up to 3 times on etag conflict before giving up', async () => {
            let getCalls = 0;
            let patchCalls = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') {
                    getCalls += 1;
                    return fragmentResponse(createProjectFragment(), `etag-${getCalls}`);
                }
                patchCalls += 1;
                return conflictResponse();
            });

            const result = await projectStartService.addCompletedLocale('proj-1', 'fr_FR', 'token', baseParams, {
                sleep: sinon.stub().resolves(),
            });

            expect(result).to.deep.equal({ success: false, error: 'etag-conflict-retries-exhausted' });
            expect(getCalls).to.equal(3);
            expect(patchCalls).to.equal(3);
        });

        it('backs off between retries via getBackoffDelay instead of retrying immediately', async () => {
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(createProjectFragment(), 'etag');
                return conflictResponse();
            });
            const sleep = sinon.stub().resolves();

            await projectStartService.addCompletedLocale('proj-1', 'fr_FR', 'token', baseParams, {
                sleep,
                initialRetryDelayMs: 100,
                maxRetryDelayMs: 1000,
                jitterRatio: 0,
            });

            expect(sleep).to.have.been.calledTwice;
            expect(sleep.firstCall.args[0]).to.equal(100);
            expect(sleep.secondCall.args[0]).to.equal(200);
        });
    });

    describe('completeProjectLocale', () => {
        it('appends the final locale and sets the status in a single PATCH', async () => {
            const fragment = createProjectFragment({ completedLocales: ['fr_FR', 'de_DE'] });
            let patchCalls = 0;
            let patchBody;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(fragment, 'etag-1');
                patchCalls += 1;
                patchBody = JSON.parse(options.body);
                return fragmentResponse(fragment, 'etag-2');
            });

            const result = await projectStartService.completeProjectLocale('proj-1', 'es_ES', 'COMPLETED', 'token', baseParams);

            expect(result).to.deep.equal({ success: true, etag: 'etag-2' });
            expect(patchCalls).to.equal(1);
            expect(patchBody).to.deep.equal([
                { op: 'replace', path: '/fields/2/values', value: ['fr_FR', 'de_DE', 'es_ES'] },
                { op: 'replace', path: '/fields/0/values', value: ['COMPLETED'] },
            ]);
        });

        it('is idempotent on the locale but still writes the status', async () => {
            const fragment = createProjectFragment({ completedLocales: ['fr_FR', 'de_DE', 'es_ES'] });
            let patchBody;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(fragment, 'etag-1');
                patchBody = JSON.parse(options.body);
                return fragmentResponse(fragment, 'etag-2');
            });

            const result = await projectStartService.completeProjectLocale('proj-1', 'es_ES', 'COMPLETED', 'token', baseParams);

            expect(result).to.deep.equal({ success: true, etag: 'etag-2' });
            expect(patchBody[0].value).to.deep.equal(['fr_FR', 'de_DE', 'es_ES']);
        });

        it('aborts without patching when completedLocales or status is not found on the fragment', async () => {
            const fragment = { id: 'proj-1', fields: [{ name: 'targetLocales', values: ['fr_FR'] }] };
            let patchCalls = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(fragment, 'etag-1');
                patchCalls += 1;
                return fragmentResponse(fragment, 'etag-2');
            });

            const result = await projectStartService.completeProjectLocale('proj-1', 'fr_FR', 'COMPLETED', 'token', baseParams);

            expect(result).to.deep.equal({ success: false, error: 'field-not-found' });
            expect(patchCalls).to.equal(0);
        });

        it('refetches and retries up to 3 times on etag conflict before giving up', async () => {
            let getCalls = 0;
            let patchCalls = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') {
                    getCalls += 1;
                    return fragmentResponse(createProjectFragment(), `etag-${getCalls}`);
                }
                patchCalls += 1;
                return conflictResponse();
            });

            const result = await projectStartService.completeProjectLocale('proj-1', 'fr_FR', 'COMPLETED', 'token', baseParams, {
                sleep: sinon.stub().resolves(),
            });

            expect(result).to.deep.equal({ success: false, error: 'etag-conflict-retries-exhausted' });
            expect(getCalls).to.equal(3);
            expect(patchCalls).to.equal(3);
        });
    });

    describe('patchProjectFields', () => {
        it('builds a json-patch operation list combining multiple field updates into one PATCH', async () => {
            const fragment = createProjectFragment();
            let patchBody;
            let patchCalls = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(fragment, 'etag-1');
                patchCalls += 1;
                patchBody = JSON.parse(options.body);
                return fragmentResponse(fragment, 'etag-2');
            });

            const result = await projectStartService.patchProjectFields(
                'proj-1',
                { status: ['IN_PROGRESS'], completedLocales: ['fr_FR'] },
                'token',
                baseParams,
            );

            expect(result).to.deep.equal({ success: true, etag: 'etag-2' });
            expect(patchCalls).to.equal(1);
            expect(patchBody).to.deep.include({ op: 'replace', path: '/fields/0/values', value: ['IN_PROGRESS'] });
            expect(patchBody).to.deep.include({ op: 'replace', path: '/fields/2/values', value: ['fr_FR'] });
        });

        it('aborts without patching when a requested field is not found on the fragment', async () => {
            const fragment = createProjectFragment();
            let patchCalls = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(fragment, 'etag-1');
                patchCalls += 1;
                return fragmentResponse(fragment, 'etag-2');
            });

            const result = await projectStartService.patchProjectFields(
                'proj-1',
                { status: ['IN_PROGRESS'], notAField: ['x'] },
                'token',
                baseParams,
            );

            expect(result).to.deep.equal({ success: false, error: 'field-not-found' });
            expect(patchCalls).to.equal(0);
        });

        it('refetches and retries up to 3 times on etag conflict before giving up', async () => {
            let getCalls = 0;
            let patchCalls = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') {
                    getCalls += 1;
                    return fragmentResponse(createProjectFragment(), `etag-${getCalls}`);
                }
                patchCalls += 1;
                return conflictResponse();
            });

            const result = await projectStartService.patchProjectFields(
                'proj-1',
                { status: ['IN_PROGRESS'] },
                'token',
                baseParams,
                { sleep: sinon.stub().resolves() },
            );

            expect(result).to.deep.equal({ success: false, error: 'etag-conflict-retries-exhausted' });
            expect(getCalls).to.equal(3);
            expect(patchCalls).to.equal(3);
        });
    });

    describe('setProjectStatus', () => {
        it('delegates to updateProjectStatus', async () => {
            const fragment = createProjectFragment();
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(fragment, 'etag-1');
                return fragmentResponse(fragment, 'etag-2');
            });

            const result = await projectStartService.setProjectStatus('proj-1', 'COMPLETED', 'token', baseParams);

            expect(result).to.deep.equal({ success: true, etag: 'etag-2' });
        });

        it('recovers once the etag conflict clears within the retry budget', async () => {
            let attempt = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') return fragmentResponse(createProjectFragment(), 'etag-1');
                attempt += 1;
                if (attempt < 2) return conflictResponse();
                return fragmentResponse(createProjectFragment(), 'etag-2');
            });

            const result = await projectStartService.setProjectStatus('proj-1', 'COMPLETED', 'token', baseParams, {
                sleep: sinon.stub().resolves(),
            });

            expect(result).to.deep.equal({ success: true, etag: 'etag-2' });
        });

        it('retries up to 3 times on etag conflict before giving up', async () => {
            let getCalls = 0;
            let patchCalls = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') {
                    getCalls += 1;
                    return fragmentResponse(createProjectFragment(), `etag-${getCalls}`);
                }
                patchCalls += 1;
                return conflictResponse();
            });

            const result = await projectStartService.setProjectStatus('proj-1', 'COMPLETED', 'token', baseParams, {
                sleep: sinon.stub().resolves(),
            });

            expect(result).to.deep.equal({ success: false, error: 'etag-conflict-retries-exhausted' });
            expect(getCalls).to.equal(3);
            expect(patchCalls).to.equal(3);
        });

        it('propagates non-412 errors without retrying', async () => {
            let getCalls = 0;
            global.fetch = sinon.stub().callsFake(async (url, options = {}) => {
                if (!options.method || options.method === 'GET') {
                    getCalls += 1;
                    return fragmentResponse(createProjectFragment(), 'etag-1');
                }
                return { ok: false, status: 500, statusText: 'Internal Server Error', json: () => Promise.resolve({}) };
            });

            let error;
            try {
                await projectStartService.setProjectStatus('proj-1', 'COMPLETED', 'token', baseParams);
            } catch (e) {
                error = e;
            }

            expect(error).to.be.instanceOf(Error);
            expect(getCalls).to.equal(1);
        });
    });
});
