import { expect } from '@open-wc/testing';

describe('ai-operations-executor', () => {
    let executeOperation;
    let executeOperationWithFeedback;
    let originalFetch;
    let mockRepository;

    function createMockRepository() {
        const fragments = new Map();
        fragments.set('frag-1', {
            id: 'frag-1',
            title: 'Test Card',
            path: '/content/dam/mas/acom/en_US/test-card',
            fields: [{ name: 'variant', values: ['catalog'] }],
            model: { path: '/conf/mas/settings/dam/cfm/models/card' },
        });

        return {
            search: { value: { path: '/content/dam/mas/acom' } },
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            getById: async (id) => fragments.get(id) || null,
                            getByPath: async (path) => {
                                for (const f of fragments.values()) {
                                    if (f.path === path) return f;
                                }
                                return null;
                            },
                            publish: async () => true,
                            delete: async () => true,
                            copy: async (fragment) => ({
                                ...fragment,
                                id: 'frag-copy',
                                title: `Copy of ${fragment.title}`,
                                path: `${fragment.path}-copy`,
                            }),
                            save: async (fragment) => fragment,
                        },
                    },
                },
                searchFragment: async function* (params, limit) {
                    yield [fragments.get('frag-1')];
                },
            },
        };
    }

    beforeEach(async () => {
        originalFetch = globalThis.fetch;
        mockRepository = createMockRepository();
        const mod = await import('../../src/utils/ai-operations-executor.js');
        executeOperation = mod.executeOperation;
        executeOperationWithFeedback = mod.executeOperationWithFeedback;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe('executeOperation', () => {
        it('throws for invalid operation data', async () => {
            try {
                await executeOperation({}, mockRepository);
                expect.fail('should throw');
            } catch (err) {
                expect(err.message).to.equal('Invalid operation data');
            }
        });

        it('throws for null operation', async () => {
            try {
                await executeOperation(null, mockRepository);
                expect.fail('should throw');
            } catch (err) {
                expect(err).to.be.an('error');
            }
        });

        it('throws for unknown operation type', async () => {
            try {
                await executeOperation({ operation: 'fly_to_moon' }, mockRepository);
                expect.fail('should throw');
            } catch (err) {
                expect(err.message).to.include('Unknown operation');
            }
        });

        describe('publish', () => {
            it('publishes a fragment', async () => {
                const result = await executeOperation({ operation: 'publish', fragmentId: 'frag-1' }, mockRepository);
                expect(result.success).to.be.true;
                expect(result.fragmentTitle).to.equal('Test Card');
            });

            it('throws when fragment not found', async () => {
                try {
                    await executeOperation({ operation: 'publish', fragmentId: 'nonexistent' }, mockRepository);
                    expect.fail('should throw');
                } catch (err) {
                    expect(err.message).to.include('Fragment not found');
                }
            });
        });

        describe('get', () => {
            it('gets fragment by ID', async () => {
                const result = await executeOperation({ operation: 'get', fragmentId: 'frag-1' }, mockRepository);
                expect(result.success).to.be.true;
                expect(result.fragment.title).to.equal('Test Card');
            });

            it('gets fragment by path', async () => {
                const result = await executeOperation(
                    { operation: 'get', fragmentId: '/content/dam/mas/acom/en_US/test-card' },
                    mockRepository,
                );
                expect(result.success).to.be.true;
                expect(result.fragment.id).to.equal('frag-1');
            });

            it('throws when fragment not found', async () => {
                try {
                    await executeOperation({ operation: 'get', fragmentId: 'missing' }, mockRepository);
                    expect.fail('should throw');
                } catch (err) {
                    expect(err.message).to.include('Fragment not found');
                }
            });
        });

        describe('delete', () => {
            it('deletes a fragment', async () => {
                const result = await executeOperation({ operation: 'delete', fragmentId: 'frag-1' }, mockRepository);
                expect(result.success).to.be.true;
                expect(result.fragmentTitle).to.equal('Test Card');
            });
        });

        describe('copy', () => {
            it('copies a fragment', async () => {
                const result = await executeOperation({ operation: 'copy', fragmentId: 'frag-1' }, mockRepository);
                expect(result.success).to.be.true;
                expect(result.newFragmentId).to.equal('frag-copy');
                expect(result.newFragmentTitle).to.include('Copy of');
            });
        });

        describe('update', () => {
            it('updates fragment fields', async () => {
                const result = await executeOperation(
                    {
                        operation: 'update',
                        fragmentId: 'frag-1',
                        updates: { cardTitle: 'Updated Title' },
                    },
                    mockRepository,
                );
                expect(result.success).to.be.true;
                expect(result.updatedFields).to.include('cardTitle');
            });

            it('adds new fields when not found', async () => {
                const result = await executeOperation(
                    {
                        operation: 'update',
                        fragmentId: 'frag-1',
                        updates: { newField: 'value' },
                    },
                    mockRepository,
                );
                expect(result.success).to.be.true;
                expect(result.updatedFields).to.include('newField');
            });
        });

        describe('search', () => {
            it('returns search results', async () => {
                const result = await executeOperation({ operation: 'search', params: { query: 'test' } }, mockRepository);
                expect(result.success).to.be.true;
                expect(result.results).to.be.an('array');
            });
        });

        describe('mcp_operation', () => {
            it('delegates to MCP client', async () => {
                globalThis.fetch = async () => ({
                    ok: true,
                    json: async () => ({
                        result: { success: true, data: 'mcp-result' },
                    }),
                });

                window.adobeIMS = {
                    getAccessToken: () => ({ token: 'tok' }),
                    adobeIdData: { client_id: 'test' },
                };
                sessionStorage.setItem('masAccessToken', 'tok');

                const result = await executeOperation(
                    {
                        type: 'mcp_operation',
                        mcpTool: 'search_cards',
                        mcpParams: { query: 'test' },
                    },
                    mockRepository,
                );
                expect(result).to.exist;

                delete window.adobeIMS;
                sessionStorage.removeItem('masAccessToken');
            });
        });
    });

    describe('executeOperationWithFeedback', () => {
        it('calls onSuccess on successful operation', async () => {
            let successResult = null;
            await executeOperationWithFeedback(
                { operation: 'get', fragmentId: 'frag-1' },
                mockRepository,
                (result) => {
                    successResult = result;
                },
                null,
            );
            expect(successResult).to.exist;
            expect(successResult.success).to.be.true;
        });

        it('calls onError on failed operation', async () => {
            let errorResult = null;
            await executeOperationWithFeedback({ operation: 'get', fragmentId: 'missing' }, mockRepository, null, (err) => {
                errorResult = err;
            });
            expect(errorResult).to.exist;
            expect(errorResult.message).to.include('Fragment not found');
        });

        it('returns error result on failure', async () => {
            const result = await executeOperationWithFeedback(
                { operation: 'get', fragmentId: 'missing' },
                mockRepository,
                null,
                null,
            );
            expect(result.success).to.be.false;
            expect(result.error).to.be.a('string');
        });
    });
});
