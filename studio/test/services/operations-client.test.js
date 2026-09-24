import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const MOCK_MCP_LOCAL_URL = 'http://localhost:3001';
const MOCK_MCP_PROD_URL = 'https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScaleMCP';

let executeOperation;
let executeStudioOperation;

function stubDeps(mcpUrl) {
    const mod = {
        OPERATIONS_SERVICE_URL: mcpUrl,
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

        const module = await import('../../src/services/operations-client.js');
        executeOperation = module.executeOperation;
        executeStudioOperation = module.executeStudioOperation;
    });

    afterEach(() => {
        sandbox.restore();
        window.adobeIMS = originalAdobeIMS;
        window.adobeid = originalAdobeId;
    });

    describe('executeOperation', () => {
        it('sends correct headers with auth token', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await executeOperation('publish_card', { id: 'frag-1' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers['Authorization']).to.equal('Bearer test-token-123');
            expect(options.headers['Content-Type']).to.equal('application/json');
        });

        it('sends IMS org ID from window.adobeIMS', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await executeOperation('publish_card', { id: 'frag-1' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers['x-gw-ims-org-id']).to.equal('test-org-id@AdobeOrg');
            expect(options.headers['x-api-key']).to.equal('test-client-id');
        });

        it('includes _aemBaseUrl in request body', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await executeOperation('search_cards', { query: 'test' });

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

            const result = await executeOperation('get_card', { id: 'frag-1' });

            expect(result).to.deep.equal(mockResult);
        });

        it('handles non-OK response and throws with error message', async () => {
            fetchStub.resolves({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'Internal server error' }),
            });

            try {
                await executeOperation('publish_card', { id: 'frag-1' });
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
                await executeOperation('publish_card', { id: 'frag-1' });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Failed to execute');
                expect(error.message).to.include('502');
            }
        });

        it('handles fetch failure and throws with error message', async () => {
            fetchStub.rejects(new Error('Network error'));

            try {
                await executeOperation('publish_card', { id: 'frag-1' });
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

            await executeOperation('get_card', { id: 'frag-1' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers['Authorization']).to.equal('Bearer ims-token-456');
        });

        it('throws Not authenticated when no token is available', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);
            window.adobeIMS = {
                getAccessToken: () => null,
                adobeIdData: {},
            };

            try {
                await executeOperation('get_card', { id: 'frag-1' });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Not authenticated');
            }
            expect(fetchStub.called).to.be.false;
        });

        it('throws Not authenticated when IMS getAccessToken returns undefined token', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);
            window.adobeIMS = {
                getAccessToken: () => ({ token: undefined }),
                adobeIdData: {},
            };

            try {
                await executeOperation('publish_card', { id: 'frag-1' });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Not authenticated');
            }
            expect(fetchStub.called).to.be.false;
        });
    });

    describe('executeStudioOperation', () => {
        it('preserves the resolved selector data consumed by release continuation', async () => {
            fetchStub.resolves({
                ok: true,
                json: async () => ({
                    success: true,
                    operation: 'resolve_offer_selector',
                    offerSelectorId: 'selected-osi',
                    offers: [{ product_arrangement_code: 'PA-1636' }],
                    selector: { product_arrangement_code: 'PA-1636' },
                    checkoutUrl: 'https://example.com/checkout',
                    studioLinks: {},
                }),
            });

            const result = await executeStudioOperation('resolve_offer_selector', { offerSelectorId: 'selected-osi' });

            expect(result.rawResult?.selector?.product_arrangement_code).to.equal('PA-1636');
        });

        it('preserves a partially failed release result', async () => {
            fetchStub.resolves({
                ok: true,
                json: async () => ({
                    success: false,
                    cards: [
                        { success: true, card: { id: 'created-card' } },
                        { success: false, error: 'Creation failed', card: { variant: 'catalog' } },
                    ],
                    count: 2,
                    successCount: 1,
                    product: { name: 'Test product' },
                }),
            });

            const result = await executeStudioOperation('create_release_cards', {});

            expect(result.success).to.equal(false);
        });

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

            expect(result.message).to.equal('some tool completed.');
            expect(result.count).to.equal(0);
        });

        it('default case never reports a misleading "N cards created" message for unknown tools', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ results: [{ id: '1' }, { id: '2' }, { id: '3' }] }),
            });
            const warnSpy = sandbox.stub(console, 'warn');
            const result = await executeStudioOperation('future_tool', {});
            expect(result.message).to.equal('future tool completed — 3 results.');
            expect(result.message).to.not.include('created');
            expect(warnSpy.calledOnce).to.be.true;
            expect(warnSpy.firstCall.args[0]).to.include('future_tool');
        });

        describe('defensive guards on response shape drift', () => {
            it('publish_card falls back when result.id is missing', async () => {
                fetchStub.resolves({
                    ok: true,
                    json: () => Promise.resolve({ card: { id: 'nested-id', title: 'From card' } }),
                });
                const result = await executeStudioOperation('publish_card', { id: 'param-id' });
                expect(result.fragmentId).to.equal('nested-id');
                expect(result.fragmentTitle).to.equal('From card');
                expect(result.message).to.equal('✓ "From card" has been published to production.');
            });

            it('publish_card falls back to mcpParams.id when result is empty', async () => {
                fetchStub.resolves({ ok: true, json: () => Promise.resolve({}) });
                const result = await executeStudioOperation('publish_card', { id: 'param-id' });
                expect(result.fragmentId).to.equal('param-id');
                expect(result.message).to.equal('✓ Card published to production.');
            });

            it('get_card returns null fragment and safe message when result.card is missing', async () => {
                fetchStub.resolves({ ok: true, json: () => Promise.resolve({}) });
                const result = await executeStudioOperation('get_card', { id: 'frag-1' });
                expect(result.fragment).to.equal(null);
                expect(result.message).to.equal('Card not found');
            });

            it('copy_card accepts result.card when newCard shape drifts', async () => {
                fetchStub.resolves({
                    ok: true,
                    json: () => Promise.resolve({ card: { id: 'copied-id', title: 'Copied', path: '/x' } }),
                });
                const result = await executeStudioOperation('copy_card', { id: 'orig-id' });
                expect(result.newFragmentId).to.equal('copied-id');
                expect(result.newFragmentTitle).to.equal('Copied');
                expect(result.newFragmentPath).to.equal('/x');
            });

        });
    });
});
