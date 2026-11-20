const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('bulk-publish server-side enforcement', () => {
    const input = { projectId: 'project', odinEndpoint: 'https://odin', authToken: 'token' };
    const denied = () => Object.assign(new Error('Bulk publish permission denied'), { statusCode: 403 });

    it('does not dispatch unauthorized projects or trust a supplied surface', async () => {
        const invoke = sinon.stub();
        const action = proxyquire('../../src/bulk-publish/index.js', {
            '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
            './permissions.js': {
                authorizeProject: async () => {
                    throw denied();
                },
            },
            '../common.js': { invokeAsyncAction: invoke },
        });
        const result = await action.main({ ...input, surface: 'ccd', __ow_headers: { authorization: 'Bearer token' } });
        expect(result.error.statusCode).to.equal(403);
        expect(invoke.called).to.be.false;
    });

    it('rejects worker authorization before snapshot, record, status or publishing effects', async () => {
        const effect = sinon.stub();
        const worker = require('../../src/bulk-publish/bulk-publish-worker.js');
        const result = await worker.main(input, {
            readProjectFragment: async () => ({ fragment: {} }),
            authorizeProject: async () => {
                throw denied();
            },
            createSnapshot: effect,
            recordSnapshot: effect,
            updateProjectFragment: effect,
            publishResolved: effect,
            logger: { info: sinon.stub(), error: sinon.stub() },
        });
        expect(result.error.statusCode).to.equal(403);
        expect(effect.called).to.be.false;
    });

    it('checks all nested snapshot references before creating any versions', async () => {
        const requests = [];
        const root = '/content/dam/mas/ccd/en_US/collection';
        const child = '/content/dam/mas/ccd/en_US/card';
        const foreign = '/content/dam/mas/acom/en_US/card';
        const snapshot = proxyquire('../../src/bulk-publish/snapshot.js', {
            '../common.js': {
                fetchOdin: async (endpoint, uri) => {
                    requests.push(uri);
                    const path = uri.split('?path=')[1];
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            items: [
                                {
                                    id: path,
                                    path,
                                    fields: [{ name: 'cards', values: [path === root ? child : foreign] }],
                                },
                            ],
                        }),
                        headers: { get: () => '/versions/version' },
                    };
                },
            },
        });
        try {
            await snapshot.createSnapshot({
                ...input,
                paths: [root],
                includeCards: true,
                assertPaths: (paths) => {
                    if (paths.includes(foreign)) throw denied();
                },
            });
            expect.fail('Expected denial');
        } catch (error) {
            expect(error.statusCode).to.equal(403);
        }
        expect(requests.some((uri) => uri.includes('/versions'))).to.be.false;
    });

    for (const file of [
        'save-snapshot-action',
        'snapshot-action',
        'reset-action',
        'revert-action',
        'check-modifications-action',
    ]) {
        it(`denies unauthorized ${file} before effects`, async () => {
            const effect = sinon.stub().resolves();
            const action = proxyquire(`../../src/bulk-publish/${file}.js`, {
                '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
                './permissions.js': {
                    authorizeProject: async () => {
                        throw denied();
                    },
                    authorizeEntries: async () => {
                        throw denied();
                    },
                },
                './project.js': {
                    readProjectFragment: async () => ({ fragment: { fields: [] } }),
                    updateProjectFragment: effect,
                },
                './snapshot.js': {
                    createSnapshot: effect,
                    recordSnapshot: effect,
                    revertSnapshot: effect,
                    checkModifications: effect,
                },
            });
            const result = await action.main({
                ...input,
                entries: ['{"fragmentId":"foreign"}'],
                paths: ['/content/dam/mas/ccd/en_US/card'],
                __ow_headers: { authorization: 'Bearer token' },
            });
            expect(result.error.statusCode).to.equal(403);
            expect(effect.called).to.be.false;
        });
    }

    it('rejects changed snapshot targets before reading their version history', async () => {
        const requests = [];
        const snapshot = proxyquire('../../src/bulk-publish/snapshot.js', {
            '../common.js': {
                fetchOdin: async (endpoint, uri) => {
                    requests.push(uri);
                    return {
                        ok: true,
                        json: async () => ({ items: [{ id: 'foreign', path: '/content/dam/mas/acom/en_US/card' }] }),
                    };
                },
            },
        });
        try {
            await snapshot.recordSnapshot({
                ...input,
                paths: ['/content/dam/mas/ccd/en_US/card'],
                assertPaths: (paths) => {
                    if (paths.includes('/content/dam/mas/acom/en_US/card')) throw denied();
                },
            });
            expect.fail('Expected denial');
        } catch (error) {
            expect(error.statusCode).to.equal(403);
        }
        expect(requests.some((uri) => uri.includes('/versions'))).to.be.false;
    });

    it('preserves propagation of project revert failures after authorization', async () => {
        const failure = new Error('Snapshot decoding failed');
        const action = proxyquire('../../src/bulk-publish/revert-action.js', {
            '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
            './permissions.js': { authorizeProject: async () => ({}) },
            './project.js': {
                readProjectFragment: async () => ({ fragment: {} }),
                getProjectSnapshots: () => {
                    throw failure;
                },
            },
        });
        try {
            await action.main(input);
            expect.fail('Expected original project revert rejection');
        } catch (error) {
            expect(error).to.equal(failure);
        }
    });

    it('preserves the original error response for direct revert operation failures carrying a status', async () => {
        const action = proxyquire('../../src/bulk-publish/revert-action.js', {
            '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
            './permissions.js': { authorizeEntries: async () => ({}) },
            './snapshot.js': {
                revertSnapshot: async () => {
                    throw denied();
                },
            },
        });
        const result = await action.main({
            odinEndpoint: input.odinEndpoint,
            entries: ['{"fragmentId":"card"}'],
            __ow_headers: { authorization: 'Bearer token' },
        });
        expect(result.error.statusCode).to.equal(500);
    });

    it('returns authorization denial for direct revert before any operation effects', async () => {
        const revert = sinon.stub();
        const action = proxyquire('../../src/bulk-publish/revert-action.js', {
            '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
            './permissions.js': {
                authorizeEntries: async () => {
                    throw denied();
                },
            },
            './snapshot.js': { revertSnapshot: revert },
        });
        const result = await action.main({
            odinEndpoint: input.odinEndpoint,
            entries: ['{"fragmentId":"foreign"}'],
            __ow_headers: { authorization: 'Bearer token' },
        });
        expect(result.error.statusCode).to.equal(403);
        expect(revert.called).to.be.false;
    });
});
