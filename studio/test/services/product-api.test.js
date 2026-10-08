import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { fetchProducts, fetchProductDetail, clearProductCache } from '../../src/services/product-api.js';

describe('product-api', () => {
    let sandbox;
    let fetchStub;

    beforeEach(() => {
        clearProductCache();
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(window, 'fetch');

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
    });

    afterEach(() => {
        sandbox.restore();
        delete window.adobeIMS;
        clearProductCache();
    });

    describe('fetchProducts caching', () => {
        const catalog = {
            combinedProducts: {
                p1: { name: 'Photoshop', arrangement_code: 'PHSP' },
                p2: { name: 'Lightroom', arrangement_code: 'LGHT' },
            },
        };

        function resolveCatalog() {
            fetchStub.resolves({ ok: true, json: () => Promise.resolve(catalog) });
        }

        it('does not refetch the catalog on a second call', async () => {
            resolveCatalog();

            const first = await fetchProducts();
            const second = await fetchProducts();

            expect(fetchStub.callCount).to.equal(1);
            expect(first.products).to.have.length(2);
            expect(second.products).to.have.length(2);
        });

        it('caches the unfiltered catalog and re-filters per call', async () => {
            resolveCatalog();

            const all = await fetchProducts();
            const filtered = await fetchProducts({ searchText: 'lightroom' });
            const againAll = await fetchProducts();

            expect(fetchStub.callCount).to.equal(1);
            expect(all.products).to.have.length(2);
            expect(filtered.products).to.have.length(1);
            expect(filtered.products[0].name).to.equal('Lightroom');
            expect(againAll.products).to.have.length(2);
        });

        it('does not let a filtered call poison the cache for later callers', async () => {
            resolveCatalog();

            await fetchProducts({ searchText: 'photoshop' });
            const all = await fetchProducts();

            expect(fetchStub.callCount).to.equal(1);
            expect(all.products).to.have.length(2);
        });

        it('shares one request when callers arrive concurrently', async () => {
            let release;
            const gate = new Promise((resolve) => {
                release = resolve;
            });
            fetchStub.callsFake(async () => {
                await gate;
                return { ok: true, json: () => Promise.resolve(catalog) };
            });

            const pending = [fetchProducts(), fetchProducts(), fetchProducts({ searchText: 'photoshop' })];
            release();
            const results = await Promise.all(pending);

            expect(fetchStub.callCount).to.equal(1);
            expect(results[0].products).to.have.length(2);
            expect(results[2].products).to.have.length(1);
        });

        it('refetches once the TTL has expired', async () => {
            const clock = sandbox.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
            resolveCatalog();

            await fetchProducts();
            clock.tick(60 * 1000);
            await fetchProducts();
            expect(fetchStub.callCount).to.equal(1);

            clock.tick(10 * 60 * 1000);
            await fetchProducts();
            expect(fetchStub.callCount).to.equal(2);
        });

        it('does not cache a failed fetch', async () => {
            fetchStub.onFirstCall().resolves({ ok: false, status: 503, text: () => Promise.resolve('down') });
            fetchStub.onSecondCall().resolves({ ok: true, json: () => Promise.resolve(catalog) });

            try {
                await fetchProducts();
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Failed to fetch products');
            }

            const result = await fetchProducts();
            expect(fetchStub.callCount).to.equal(2);
            expect(result.products).to.have.length(2);
        });

        it('hands each caller its own array so sorting one cannot corrupt the cache', async () => {
            resolveCatalog();

            const first = await fetchProducts();
            first.products.sort((a, b) => a.name.localeCompare(b.name));
            first.products.pop();
            const second = await fetchProducts();

            expect(fetchStub.callCount).to.equal(1);
            expect(second.products).to.have.length(2);
            expect(second.products[0].name).to.equal('Photoshop');
        });

        it('refetches after the cache is cleared', async () => {
            resolveCatalog();

            await fetchProducts();
            clearProductCache();
            await fetchProducts();

            expect(fetchStub.callCount).to.equal(2);
        });
    });

    describe('fetchProducts', () => {
        it('returns normalized products list on success', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ combinedProducts: { p1: { name: 'Photoshop' }, p2: { name: 'Lightroom' } } }),
            });

            const result = await fetchProducts();

            expect(result.success).to.be.true;
            expect(result.operation).to.equal('list_products');
            expect(result.products).to.have.length(2);
            expect(result.count).to.equal(2);
        });

        it('falls back to data shape when combinedProducts is absent', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve([{ name: 'Photoshop' }]),
            });

            const result = await fetchProducts();

            expect(result.products).to.have.length(1);
            expect(result.products[0].name).to.equal('Photoshop');
        });

        it('sends Authorization header when access token is available', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ combinedProducts: {} }),
            });

            await fetchProducts();

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers['Authorization']).to.equal('Bearer test-token-123');
            expect(options.headers['x-gw-ims-org-id']).to.equal('test-org-id@AdobeOrg');
            expect(options.headers['x-api-key']).to.equal('test-client-id');
        });

        it('throws Not authenticated when no token is available', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);
            window.adobeIMS = {
                getAccessToken: () => null,
                adobeIdData: {},
            };

            try {
                await fetchProducts();
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Not authenticated');
            }
            expect(fetchStub.called).to.be.false;
        });

        it('throws on non-OK response', async () => {
            fetchStub.resolves({
                ok: false,
                status: 500,
                text: () => Promise.resolve('Internal server error'),
            });

            try {
                await fetchProducts();
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Failed to fetch products');
                expect(error.message).to.include('500');
            }
        });
    });

    describe('fetchProductDetail', () => {
        it('rejects an arrangement code containing invalid characters (e.g. <script>)', async () => {
            try {
                await fetchProductDetail('<script>');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Invalid arrangement code');
            }
            expect(fetchStub.called).to.be.false;
        });

        it('rejects an empty arrangement code', async () => {
            try {
                await fetchProductDetail('');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Invalid arrangement code');
            }
            expect(fetchStub.called).to.be.false;
        });

        it('rejects an arrangement code longer than 64 characters', async () => {
            try {
                await fetchProductDetail('a'.repeat(65));
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Invalid arrangement code');
            }
            expect(fetchStub.called).to.be.false;
        });

        it('rejects an arrangement code with whitespace', async () => {
            try {
                await fetchProductDetail('abc 123');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Invalid arrangement code');
            }
            expect(fetchStub.called).to.be.false;
        });

        it('accepts a real arrangement code with underscores (typical MCS shape)', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ product: { name: 'Photoshop' } }),
            });
            const result = await fetchProductDetail('creative_cloud_all_apps_with_10_tb_cloud_services_individual');
            expect(fetchStub.calledOnce).to.be.true;
            expect(result.product.name).to.equal('Photoshop');
        });

        it('POSTs arrangementCode and returns parsed JSON', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ product: { name: 'Photoshop' } }),
            });

            const result = await fetchProductDetail('abc-123');

            expect(fetchStub.calledOnce).to.be.true;
            const [, options] = fetchStub.firstCall.args;
            expect(options.method).to.equal('POST');
            const body = JSON.parse(options.body);
            expect(body.arrangementCode).to.equal('abc-123');
            expect(result.product.name).to.equal('Photoshop');
        });

        it('throws Not authenticated when no token is available', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);
            window.adobeIMS = {
                getAccessToken: () => null,
                adobeIdData: {},
            };

            try {
                await fetchProductDetail('abc-123');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Not authenticated');
            }
            expect(fetchStub.called).to.be.false;
        });

        it('throws on non-OK response', async () => {
            fetchStub.resolves({
                ok: false,
                status: 404,
                json: () => Promise.resolve({ error: 'Not found' }),
            });

            try {
                await fetchProductDetail('missing-code');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Not found');
            }
        });
    });
});
