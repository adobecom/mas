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

    describe('empty 2xx responses', () => {
        // The ost-products cache is only seeded in the prod IO workspace, so
        // stage and personal workspaces answer 200 with content-length 0. A raw
        // response.json() then throws a DOMException whose message says nothing
        // about products, which is what reached users as
        // "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
        const emptyBody = () => Promise.reject(new SyntaxError('Unexpected end of JSON input'));

        it('fetchProducts explains an empty catalog response instead of leaking a JSON parse error', async () => {
            fetchStub.resolves({ ok: true, status: 200, json: emptyBody });

            try {
                await fetchProducts();
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.not.include("Failed to execute 'json'");
                expect(error.message).to.match(/empty response/i);
                expect(error.message).to.match(/product/i);
            }
        });

        it('does not cache an empty catalog response', async () => {
            fetchStub.resolves({ ok: true, status: 200, json: emptyBody });
            await fetchProducts().catch(() => {});

            fetchStub.resolves({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ combinedProducts: { p1: { name: 'Photoshop' } } }),
            });
            const result = await fetchProducts();

            expect(result.products).to.have.lengthOf(1);
        });

        it('fetchProductDetail explains an empty detail response instead of leaking a JSON parse error', async () => {
            fetchStub.resolves({ ok: true, status: 200, json: emptyBody });

            try {
                await fetchProductDetail('PHSP_DIRECT_TEAM');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.not.include("Failed to execute 'json'");
                expect(error.message).to.match(/empty response/i);
            }
        });
    });

    describe('timeout and format guard', () => {
        function abortOnSignal() {
            fetchStub.callsFake(
                (url, init) =>
                    new Promise((resolve, reject) => {
                        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
                    }),
            );
        }

        it('passes an abort signal to the catalog fetch', async () => {
            fetchStub.resolves({ ok: true, json: () => Promise.resolve({ combinedProducts: {} }) });

            await fetchProducts();

            expect(fetchStub.firstCall.args[1].signal).to.be.instanceOf(AbortSignal);
        });

        it('aborts a hung catalog request after the timeout and does not cache the failure', async () => {
            const clock = sandbox.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            abortOnSignal();

            const pending = fetchProducts().then(
                () => null,
                (error) => error,
            );
            await clock.tickAsync(10001);
            const error = await pending;
            clock.restore();

            expect(error).to.be.instanceOf(Error);
            expect(error.name).to.equal('AbortError');

            fetchStub.resetBehavior();
            fetchStub.resolves({ ok: true, json: () => Promise.resolve({ combinedProducts: { p1: { name: 'A' } } }) });
            const retry = await fetchProducts();
            expect(retry.products).to.have.length(1);
        });

        it('aborts a hung product detail request after the timeout', async () => {
            const clock = sandbox.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            abortOnSignal();

            const pending = fetchProductDetail('PHSP_DIRECT_TEAM').then(
                () => null,
                (error) => error,
            );
            await clock.tickAsync(10001);
            const error = await pending;
            clock.restore();

            expect(error.name).to.equal('AbortError');
        });

        ['abc/def', 'abc.def', 'abc;rm', '../etc', 'päx', 'a'.repeat(65), 12345, null, undefined].forEach((code) => {
            it(`rejects malformed arrangement code ${String(code).slice(0, 12)} before any request`, async () => {
                try {
                    await fetchProductDetail(code);
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect(error.message).to.include('Invalid arrangement code');
                }
                expect(fetchStub.called).to.be.false;
            });
        });

        ['PA-1930', 'phsp_direct_individual', 'A', 'a'.repeat(64)].forEach((code) => {
            it(`accepts well-formed arrangement code ${code.slice(0, 24)}`, async () => {
                fetchStub.resolves({ ok: true, json: () => Promise.resolve({ product: {} }) });

                await fetchProductDetail(code);

                expect(JSON.parse(fetchStub.firstCall.args[1].body).arrangementCode).to.equal(code);
            });
        });

        it('defaults landscape to DRAFT and honors an override', async () => {
            fetchStub.resolves({ ok: true, json: () => Promise.resolve({ product: {} }) });

            await fetchProductDetail('PA-1930');
            await fetchProductDetail('PA-1930', { landscape: 'PUBLISHED' });

            expect(JSON.parse(fetchStub.firstCall.args[1].body).landscape).to.equal('DRAFT');
            expect(JSON.parse(fetchStub.secondCall.args[1].body).landscape).to.equal('PUBLISHED');
        });
    });

    describe('catalog shapes', () => {
        it('flattens a combinedProducts object into an array of its values', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve({ combinedProducts: { x: { name: 'X' }, y: { name: 'Y' } } }),
            });

            const result = await fetchProducts();

            expect(result.products.map((p) => p.name)).to.deep.equal(['X', 'Y']);
        });

        it('accepts combinedProducts that is already an array', async () => {
            fetchStub.resolves({ ok: true, json: () => Promise.resolve({ combinedProducts: [{ name: 'X' }] }) });

            const result = await fetchProducts();

            expect(result.products).to.deep.equal([{ name: 'X' }]);
        });

        it('searches by arrangement code and product code, case-insensitively', async () => {
            fetchStub.resolves({
                ok: true,
                json: () =>
                    Promise.resolve([
                        { name: 'Firefly Standard', arrangement_code: 'PA-1930', product_code: 'FFLY' },
                        { name: 'Photoshop', arrangement_code: 'phsp_direct', product_code: 'PHSP' },
                    ]),
            });

            const byPa = await fetchProducts({ searchText: 'pa-1930' });
            const byCode = await fetchProducts({ searchText: 'phsp' });

            expect(byPa.products.map((p) => p.name)).to.deep.equal(['Firefly Standard']);
            expect(byCode.products.map((p) => p.name)).to.deep.equal(['Photoshop']);
        });

        it('returns an empty successful result for an empty catalog object', async () => {
            fetchStub.resolves({ ok: true, json: () => Promise.resolve({}) });

            const result = await fetchProducts({ searchText: 'photoshop' });

            expect(result.success).to.be.true;
            expect(result.count).to.equal(0);
        });
    });

    describe('OST catalog endpoint', () => {
        let meta;

        afterEach(() => {
            if (meta) {
                meta.remove();
                meta = null;
            }
        });

        // The catalog is shared, read-only data seeded only in the prod masStudio
        // workspace. A personal/stage env (io.studio.env=axel) has no cache, so
        // reading it from the page's env 404s. The read must target prod even when
        // io-base-url points elsewhere.
        it('reads the catalog from prod masStudio even when the page env points to a personal workspace', async () => {
            meta = document.createElement('meta');
            meta.name = 'io-base-url';
            meta.content = 'https://14257-masstudio-axel.adobeioruntime.net/api/v1/web/MerchAtScaleStudio';
            document.head.appendChild(meta);
            fetchStub.resolves({ ok: true, json: () => Promise.resolve({ combinedProducts: {} }) });

            await fetchProducts();

            expect(fetchStub.firstCall.args[0]).to.equal(
                'https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read',
            );
        });
    });
});
