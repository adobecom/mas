import { expect } from '@open-wc/testing';
import { IMS_ORG_ID, AEM_AUTHOR_URL } from '../../src/constants.js';

describe('mcp-client', () => {
    let originalFetch;
    let originalAdobeIMS;
    let originalSessionStorage;
    let originalConsoleWarn;
    let originalConsoleError;
    let originalQuerySelector;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        originalAdobeIMS = window.adobeIMS;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;
        originalQuerySelector = document.querySelector;
        console.warn = () => {};
        console.error = () => {};
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        window.adobeIMS = originalAdobeIMS;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
        document.querySelector = originalQuerySelector;
        sessionStorage.removeItem('masAccessToken');
    });

    async function loadModule() {
        return import('../../src/services/mcp-client.js');
    }

    function setupAuth(token = 'test-token') {
        sessionStorage.setItem('masAccessToken', token);
        window.adobeIMS = {
            getAccessToken: () => ({ token }),
            adobeIdData: { client_id: 'test-client-id' },
        };
    }

    describe('executeMCPTool', () => {
        it('sends correct request with auth headers', async () => {
            const { executeMCPTool } = await loadModule();
            setupAuth('my-token');
            document.querySelector = () => null;

            globalThis.fetch = async (url, options) => {
                expect(options.method).to.equal('POST');
                expect(options.headers['Authorization']).to.equal('Bearer my-token');
                expect(options.headers['Content-Type']).to.equal('application/json');
                expect(options.headers['x-gw-ims-org-id']).to.equal(IMS_ORG_ID);
                return {
                    ok: true,
                    json: async () => ({ success: true }),
                };
            };

            const result = await executeMCPTool('publish_card', { id: '123' });
            expect(result.success).to.be.true;
        });

        it('replaces underscores with dashes in endpoint URL', async () => {
            const { executeMCPTool } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async (url) => {
                expect(url).to.include('/publish-card');
                expect(url).not.to.include('publish_card');
                return {
                    ok: true,
                    json: async () => ({}),
                };
            };

            await executeMCPTool('publish_card', {});
        });

        it('resolves localhost AEM URL to AEM_AUTHOR_URL', async () => {
            const { executeMCPTool } = await loadModule();
            setupAuth();

            const meta = document.createElement('meta');
            meta.setAttribute('name', 'aem-base-url');
            meta.setAttribute('content', 'http://localhost:8080');
            document.querySelector = (selector) => {
                if (selector === 'meta[name="aem-base-url"]') return meta;
                return originalQuerySelector.call(document, selector);
            };

            globalThis.fetch = async (url, options) => {
                const body = JSON.parse(options.body);
                expect(body._aemBaseUrl).to.equal(AEM_AUTHOR_URL);
                return {
                    ok: true,
                    json: async () => ({}),
                };
            };

            await executeMCPTool('get_card', { id: '1' });
        });

        it('uses non-localhost AEM URL as-is', async () => {
            const { executeMCPTool } = await loadModule();
            setupAuth();
            const remoteUrl = 'https://author-p22655-e59433.adobeaemcloud.com';

            const meta = document.createElement('meta');
            meta.setAttribute('name', 'aem-base-url');
            meta.setAttribute('content', remoteUrl);
            document.querySelector = (selector) => {
                if (selector === 'meta[name="aem-base-url"]') return meta;
                return originalQuerySelector.call(document, selector);
            };

            globalThis.fetch = async (url, options) => {
                const body = JSON.parse(options.body);
                expect(body._aemBaseUrl).to.equal(remoteUrl);
                return {
                    ok: true,
                    json: async () => ({}),
                };
            };

            await executeMCPTool('get_card', { id: '1' });
        });

        it('warns when no access token is available', async () => {
            const { executeMCPTool } = await loadModule();
            sessionStorage.removeItem('masAccessToken');
            delete window.adobeIMS;

            let warned = false;
            console.warn = (msg) => {
                if (msg.includes('No access token')) warned = true;
            };

            globalThis.fetch = async (url, options) => {
                expect(options.headers['Authorization']).to.be.undefined;
                return {
                    ok: true,
                    json: async () => ({}),
                };
            };

            await executeMCPTool('get_card', {});
            expect(warned).to.be.true;
        });

        it('throws on non-OK response (non-retryable)', async () => {
            const { executeMCPTool } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: false,
                status: 400,
                headers: new Headers(),
                json: async () => ({ error: 'bad request' }),
            });

            try {
                await executeMCPTool('publish_card', {});
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.message).to.include('Failed to execute publish_card');
            }
        });

        it('retries on retryable errors and eventually throws', async () => {
            const { executeMCPTool } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            let callCount = 0;
            globalThis.fetch = async () => {
                callCount++;
                return {
                    ok: false,
                    status: 503,
                    headers: new Headers({ 'retry-after': '0' }),
                    json: async () => ({ error: 'service unavailable' }),
                };
            };

            try {
                await executeMCPTool('publish_card', {});
                expect.fail('should have thrown');
            } catch (err) {
                expect(callCount).to.equal(4);
                expect(err.message).to.include('503');
            }
        });
    });

    describe('executeStudioOperation', () => {
        it('formats publish_card result', async () => {
            const { executeStudioOperation } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({
                    id: 'f1',
                    title: 'My Card',
                    path: '/content/dam/test',
                    deepLink: 'https://example.com',
                }),
            });

            const result = await executeStudioOperation('publish_card', {});
            expect(result.success).to.be.true;
            expect(result.operation).to.equal('publish');
            expect(result.fragmentId).to.equal('f1');
            expect(result.message).to.include('My Card');
        });

        it('formats unpublish_card result', async () => {
            const { executeStudioOperation } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({
                    id: 'f2',
                    title: 'Unpub Card',
                    path: '/test',
                }),
            });

            const result = await executeStudioOperation('unpublish_card', {});
            expect(result.operation).to.equal('unpublish');
            expect(result.message).to.include('unpublished');
        });

        it('formats search_cards result', async () => {
            const { executeStudioOperation } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({
                    results: [{ id: '1' }, { id: '2' }],
                }),
            });

            const result = await executeStudioOperation('search_cards', {});
            expect(result.operation).to.equal('search');
            expect(result.count).to.equal(2);
            expect(result.message).to.include('2 cards');
        });

        it('formats delete_card result', async () => {
            const { executeStudioOperation } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({ id: 'f3', title: 'Deleted Card' }),
            });

            const result = await executeStudioOperation('delete_card', {});
            expect(result.operation).to.equal('delete');
            expect(result.message).to.include('deleted');
        });

        it('formats copy_card result', async () => {
            const { executeStudioOperation } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({
                    newCard: { id: 'f-new', title: 'Copy', path: '/test' },
                    deepLink: 'https://link',
                }),
            });

            const result = await executeStudioOperation('copy_card', { id: 'f-orig' });
            expect(result.operation).to.equal('copy');
            expect(result.originalId).to.equal('f-orig');
            expect(result.newFragmentId).to.equal('f-new');
        });

        it('formats update_card result', async () => {
            const { executeStudioOperation } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({ id: 'f4', title: 'Updated' }),
            });

            const result = await executeStudioOperation('update_card', {
                updates: { title: 'New' },
            });
            expect(result.operation).to.equal('update');
            expect(result.updatedFields).to.deep.equal(['title']);
        });

        it('formats get_card result', async () => {
            const { executeStudioOperation } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({
                    card: { id: 'c1', title: 'Found Card' },
                    deepLink: 'https://link',
                }),
            });

            const result = await executeStudioOperation('get_card', { id: 'c1' });
            expect(result.operation).to.equal('get');
            expect(result.fragment.title).to.equal('Found Card');
        });

        it('returns default for unknown tools', async () => {
            const { executeStudioOperation } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({ foo: 'bar' }),
            });

            const result = await executeStudioOperation('unknown_tool', {});
            expect(result.success).to.be.true;
            expect(result.operation).to.equal('unknown');
            expect(result.rawResult.foo).to.equal('bar');
        });
    });

    describe('executeStudioOperationWithProgress', () => {
        it('returns immediately if no jobId in initial result', async () => {
            const { executeStudioOperationWithProgress } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({ directResult: true }),
            });

            const result = await executeStudioOperationWithProgress('publish_card', {});
            expect(result.directResult).to.be.true;
        });

        it('polls until completed', async () => {
            const { executeStudioOperationWithProgress } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            let callCount = 0;
            globalThis.fetch = async (url) => {
                callCount++;
                if (callCount === 1) {
                    return {
                        ok: true,
                        json: async () => ({ jobId: 'job-1' }),
                    };
                }
                if (callCount === 2) {
                    return {
                        ok: true,
                        json: async () => ({
                            status: 'in_progress',
                            progress: 50,
                        }),
                    };
                }
                return {
                    ok: true,
                    json: async () => ({
                        status: 'completed',
                        type: 'bulk_update',
                        total: 5,
                        successCount: 5,
                        failureCount: 0,
                        successful: [],
                        failed: [],
                        skipped: [],
                        skippedCount: 0,
                        message: 'Done',
                        updatedCards: [],
                        previewLimit: 0,
                    }),
                };
            };

            const progressUpdates = [];
            const result = await executeStudioOperationWithProgress(
                'bulk_update_cards',
                {},
                (status) => progressUpdates.push(status),
                10,
            );

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('bulk_update');
            expect(result.total).to.equal(5);
            expect(progressUpdates.length).to.be.greaterThan(0);
        });

        it('rejects on failed job', async () => {
            const { executeStudioOperationWithProgress } = await loadModule();
            setupAuth();
            document.querySelector = () => null;

            let callCount = 0;
            globalThis.fetch = async () => {
                callCount++;
                if (callCount === 1) {
                    return {
                        ok: true,
                        json: async () => ({ jobId: 'job-fail' }),
                    };
                }
                return {
                    ok: true,
                    json: async () => ({
                        status: 'failed',
                        error: 'Something went wrong',
                    }),
                };
            };

            try {
                await executeStudioOperationWithProgress('bulk_delete_cards', {}, () => {}, 10);
                expect.fail('should have rejected');
            } catch (err) {
                expect(err.message).to.equal('Something went wrong');
            }
        });
    });
});
