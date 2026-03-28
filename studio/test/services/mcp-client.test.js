import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const MOCK_MCP_LOCAL_URL = 'http://localhost:3001';
const MOCK_MCP_PROD_URL = 'https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScaleMCP';

let executeMCPTool;
let executeStudioOperationWithProgress;
let executeStudioOperation;

function stubDeps(mcpUrl) {
    const mod = {
        MCP_SERVER_URL: mcpUrl,
    };
    return mod;
}

describe('mcp-client', () => {
    let sandbox;
    let fetchStub;
    let originalSessionStorage;
    let originalAdobeIMS;
    let originalAdobeId;
    let metaStub;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(window, 'fetch');

        originalSessionStorage = window.sessionStorage;
        originalAdobeIMS = window.adobeIMS;
        originalAdobeId = window.adobeid;

        sandbox.stub(sessionStorage, 'getItem').callsFake((key) => {
            if (key === 'masAccessToken') return 'test-token-123';
            return null;
        });

        window.adobeIMS = {
            getAccessToken: () => ({ token: 'ims-token-456' }),
            adobeIdData: {
                imsOrg: 'test-org-id@AdobeOrg',
                client_id: 'test-client-id',
            },
        };

        window.adobeid = {
            authorize: () => 'adobeid-token-789',
        };

        metaStub = sandbox
            .stub(document, 'querySelector')
            .withArgs('meta[name="aem-base-url"]')
            .returns({
                getAttribute: () => 'https://aem.example.com',
            });

        const module = await import('../../src/services/mcp-client.js');
        executeMCPTool = module.executeMCPTool;
        executeStudioOperationWithProgress = module.executeStudioOperationWithProgress;
        executeStudioOperation = module.executeStudioOperation;
    });

    afterEach(() => {
        sandbox.restore();
        window.adobeIMS = originalAdobeIMS;
        window.adobeid = originalAdobeId;
    });

    describe('executeMCPTool', () => {
        it('sends correct headers with auth token', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await executeMCPTool('publish_card', { id: 'frag-1' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers['Authorization']).to.equal('Bearer test-token-123');
            expect(options.headers['Content-Type']).to.equal('application/json');
        });

        it('sends IMS org ID from window.adobeIMS', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await executeMCPTool('publish_card', { id: 'frag-1' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers['x-gw-ims-org-id']).to.equal('test-org-id@AdobeOrg');
            expect(options.headers['x-api-key']).to.equal('test-client-id');
        });

        it('includes _aemBaseUrl in request body', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await executeMCPTool('search_cards', { query: 'test' });

            const [, options] = fetchStub.firstCall.args;
            const body = JSON.parse(options.body);
            expect(body._aemBaseUrl).to.equal('https://aem.example.com');
            expect(body.query).to.equal('test');
        });

        it('handles successful response', async () => {
            const mockResult = {
                id: 'frag-1',
                title: 'Test Card',
            };
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const result = await executeMCPTool('get_card', { id: 'frag-1' });

            expect(result).to.deep.equal(mockResult);
        });

        it('handles non-OK response and throws with error message', async () => {
            fetchStub.resolves({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'Internal server error' }),
            });

            try {
                await executeMCPTool('publish_card', { id: 'frag-1' });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Failed to execute');
                expect(error.message).to.include('publish_card');
            }
        });

        it('handles non-OK response when json parsing fails', async () => {
            fetchStub.resolves({
                ok: false,
                status: 502,
                json: () => Promise.reject(new Error('parse error')),
            });

            try {
                await executeMCPTool('publish_card', { id: 'frag-1' });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Failed to execute');
                expect(error.message).to.include('502');
            }
        });

        it('handles fetch failure and throws with error message', async () => {
            fetchStub.rejects(new Error('Network error'));

            try {
                await executeMCPTool('publish_card', { id: 'frag-1' });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Failed to execute');
                expect(error.message).to.include('Network error');
            }
        });

        it('falls back to IMS token when session storage is empty', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);

            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await executeMCPTool('get_card', { id: 'frag-1' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers['Authorization']).to.equal('Bearer ims-token-456');
        });

        it('omits auth headers when no token is available', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);
            window.adobeIMS = {
                getAccessToken: () => null,
                adobeIdData: {},
            };
            window.adobeid = { authorize: () => undefined };

            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await executeMCPTool('get_card', { id: 'frag-1' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers['Authorization']).to.be.undefined;
            expect(options.headers['x-gw-ims-org-id']).to.be.undefined;
        });
    });

    describe('executeStudioOperationWithProgress', () => {
        it('returns directly if no jobId in initial result', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        success: true,
                        message: 'done',
                    }),
            });

            const result = await executeStudioOperationWithProgress('publish_card', { id: 'frag-1' }, null);

            expect(result.success).to.be.true;
            expect(result.message).to.equal('done');
            expect(fetchStub.callCount).to.equal(1);
        });

        it('polls for job status at specified interval', async () => {
            let callCount = 0;
            fetchStub.callsFake(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ jobId: 'job-123' }),
                    });
                }
                if (callCount === 2) {
                    return Promise.resolve({
                        ok: true,
                        json: () =>
                            Promise.resolve({
                                status: 'in_progress',
                                progress: 50,
                            }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            status: 'completed',
                            type: 'bulk_publish',
                            total: 5,
                            successCount: 5,
                            failureCount: 0,
                            successful: [],
                            failed: [],
                            skipped: [],
                            skippedCount: 0,
                            message: 'All done',
                        }),
                });
            });

            const result = await executeStudioOperationWithProgress('bulk_publish_cards', { ids: ['1', '2'] }, null, 50);

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('bulk_publish');
            expect(result.total).to.equal(5);
        });

        it('resolves when status is completed', async () => {
            let callCount = 0;
            fetchStub.callsFake(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ jobId: 'job-456' }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            status: 'completed',
                            type: 'bulk_update',
                            total: 3,
                            successCount: 3,
                            failureCount: 0,
                            successful: ['a', 'b', 'c'],
                            failed: [],
                            skipped: [],
                            skippedCount: 0,
                            updatedCards: ['a', 'b', 'c'],
                            previewLimit: 10,
                        }),
                });
            });

            const result = await executeStudioOperationWithProgress('bulk_update_cards', { ids: [] }, null, 10);

            expect(result.success).to.be.true;
            expect(result.successCount).to.equal(3);
            expect(result.updatedCards).to.deep.equal(['a', 'b', 'c']);
            expect(result.previewLimit).to.equal(10);
        });

        it('rejects when status is failed', async () => {
            let callCount = 0;
            fetchStub.callsFake(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ jobId: 'job-fail' }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            status: 'failed',
                            error: 'Bulk operation failed',
                        }),
                });
            });

            try {
                await executeStudioOperationWithProgress('bulk_delete_cards', { ids: [] }, null, 10);
                expect.fail('Should have rejected');
            } catch (error) {
                expect(error.message).to.equal('Bulk operation failed');
            }
        });

        it('calls onProgress callback with status updates', async () => {
            const progressSpy = sandbox.spy();
            let callCount = 0;
            fetchStub.callsFake(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ jobId: 'job-progress' }),
                    });
                }
                if (callCount === 2) {
                    return Promise.resolve({
                        ok: true,
                        json: () =>
                            Promise.resolve({
                                status: 'in_progress',
                                progress: 50,
                            }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            status: 'completed',
                            type: 'bulk_publish',
                            total: 2,
                            successCount: 2,
                            failureCount: 0,
                            successful: [],
                            failed: [],
                            skipped: [],
                            skippedCount: 0,
                        }),
                });
            });

            await executeStudioOperationWithProgress('bulk_publish_cards', { ids: [] }, progressSpy, 10);

            expect(progressSpy.callCount).to.be.at.least(1);
            expect(progressSpy.firstCall.args[0]).to.have.property('status');
        });
    });

    describe('executeStudioOperation', () => {
        it('maps publish_card result correctly', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        id: 'frag-1',
                        title: 'My Card',
                        path: '/content/dam/mas/cards/my-card',
                        deepLink: 'https://example.com/link',
                    }),
            });

            const result = await executeStudioOperation('publish_card', {
                id: 'frag-1',
            });

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('publish');
            expect(result.fragmentId).to.equal('frag-1');
            expect(result.fragmentTitle).to.equal('My Card');
            expect(result.fragmentPath).to.equal('/content/dam/mas/cards/my-card');
            expect(result.message).to.include('published');
            expect(result.deepLink).to.equal('https://example.com/link');
        });

        it('maps search_cards result correctly', async () => {
            const cards = [
                { id: '1', title: 'Card A' },
                { id: '2', title: 'Card B' },
            ];
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ results: cards }),
            });

            const result = await executeStudioOperation('search_cards', {
                query: 'test',
            });

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('search');
            expect(result.results).to.deep.equal(cards);
            expect(result.count).to.equal(2);
            expect(result.message).to.include('2');
        });

        it('maps search_cards with cards property', async () => {
            const cards = [{ id: '1', title: 'Card A' }];
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ cards }),
            });

            const result = await executeStudioOperation('search_cards', {
                query: 'test',
            });

            expect(result.results).to.deep.equal(cards);
            expect(result.count).to.equal(1);
        });

        it('maps delete_card result correctly', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        id: 'frag-99',
                        title: 'Deleted Card',
                    }),
            });

            const result = await executeStudioOperation('delete_card', {
                id: 'frag-99',
            });

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('delete');
            expect(result.fragmentId).to.equal('frag-99');
            expect(result.fragmentTitle).to.equal('Deleted Card');
            expect(result.message).to.include('deleted');
        });

        it('maps unpublish_card result correctly', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        id: 'frag-2',
                        title: 'Unpub Card',
                        path: '/content/dam/mas/cards/unpub',
                        deepLink: 'https://example.com/unpub',
                    }),
            });

            const result = await executeStudioOperation('unpublish_card', {
                id: 'frag-2',
            });

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('unpublish');
            expect(result.message).to.include('unpublished');
        });

        it('maps get_card result correctly', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        card: { id: 'c1', title: 'Got Card' },
                        deepLink: 'https://example.com/card',
                    }),
            });

            const result = await executeStudioOperation('get_card', {
                id: 'c1',
            });

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('get');
            expect(result.fragment).to.deep.equal({
                id: 'c1',
                title: 'Got Card',
            });
        });

        it('maps copy_card result correctly', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        newCard: {
                            id: 'new-1',
                            title: 'Copy of Card',
                            path: '/content/dam/mas/cards/copy',
                        },
                        deepLink: 'https://example.com/copy',
                    }),
            });

            const result = await executeStudioOperation('copy_card', {
                id: 'orig-1',
            });

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('copy');
            expect(result.originalId).to.equal('orig-1');
            expect(result.newFragmentId).to.equal('new-1');
        });

        it('maps update_card result correctly', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        id: 'u1',
                        title: 'Updated Card',
                        deepLink: 'https://example.com/updated',
                    }),
            });

            const result = await executeStudioOperation('update_card', {
                id: 'u1',
                updates: { title: 'Updated Card' },
            });

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('update');
            expect(result.updatedFields).to.deep.equal(['title']);
        });

        it('handles default case for unknown tools', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        results: [{ id: '1' }, { id: '2' }],
                        message: 'Custom result',
                    }),
            });

            const result = await executeStudioOperation('some_unknown_tool', {
                data: 'test',
            });

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('some_unknown_tool');
            expect(result.results).to.have.lengthOf(2);
            expect(result.message).to.equal('Custom result');
        });

        it('default case maps cards array when results is empty', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        results: [],
                        cards: [{ card: { id: 'c1' } }, { card: { id: 'c2' } }],
                    }),
            });

            const result = await executeStudioOperation('some_unknown_tool', {
                data: 'test',
            });

            expect(result.results).to.have.lengthOf(2);
            expect(result.results[0]).to.deep.equal({ id: 'c1' });
        });

        it('default case generates message when no items', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ results: [] }),
            });

            const result = await executeStudioOperation('some_tool', {});

            expect(result.message).to.equal('Operation completed');
            expect(result.count).to.equal(0);
        });
    });
});
