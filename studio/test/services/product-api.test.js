import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

let fetchProducts;
let fetchProductDetail;

describe('product-api', () => {
    let sandbox;
    let fetchStub;
    let originalAdobeIMS;
    let originalAdobeId;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(window, 'fetch');

        originalAdobeIMS = window.adobeIMS;
        originalAdobeId = window.adobeid;

        sandbox.stub(sessionStorage, 'getItem').callsFake((key) => {
            if (key === 'masAccessToken') return 'test-token-123';
            return null;
        });

        window.adobeIMS = {
            getAccessToken: () => ({ token: 'ims-token-456' }),
        };

        window.adobeid = {
            authorize: () => 'adobeid-token-789',
        };

        const module = await import('../../src/services/product-api.js');
        fetchProducts = module.fetchProducts;
        fetchProductDetail = module.fetchProductDetail;
    });

    afterEach(() => {
        sandbox.restore();
        window.adobeIMS = originalAdobeIMS;
        window.adobeid = originalAdobeId;
    });

    describe('fetchProducts', () => {
        it('returns parsed JSON on success', async () => {
            const mockProducts = [{ name: 'Photoshop' }, { name: 'Illustrator' }];
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve(mockProducts),
            });

            const result = await fetchProducts();

            expect(result).to.deep.equal(mockProducts);
        });

        it('includes Bearer token from sessionStorage', async () => {
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await fetchProducts();

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers.Authorization).to.equal('Bearer test-token-123');
        });

        it('falls back to adobeIMS token when sessionStorage is empty', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);

            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await fetchProducts();

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers.Authorization).to.equal('Bearer ims-token-456');
        });

        it('falls back to adobeid.authorize when other sources are unavailable', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);
            window.adobeIMS = { getAccessToken: () => null };

            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await fetchProducts();

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers.Authorization).to.equal('Bearer adobeid-token-789');
        });

        it('throws when no auth token is available', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);
            window.adobeIMS = { getAccessToken: () => null };
            window.adobeid = { authorize: () => undefined };

            try {
                await fetchProducts();
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Not authenticated');
            }
        });

        it('throws with server error message on non-ok response', async () => {
            fetchStub.resolves({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'Internal server error' }),
            });

            try {
                await fetchProducts();
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.equal('Internal server error');
            }
        });

        it('throws generic error when response body is not JSON', async () => {
            fetchStub.resolves({
                ok: false,
                status: 502,
                json: () => Promise.reject(new Error('parse error')),
            });

            try {
                await fetchProducts();
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Failed to load products');
                expect(error.message).to.include('502');
            }
        });
    });

    describe('fetchProductDetail', () => {
        it('returns parsed JSON with URL-encoded arrangement code', async () => {
            const mockDetail = { name: 'Photoshop', arrangementCode: 'abc/123' };
            fetchStub.resolves({
                ok: true,
                json: () => Promise.resolve(mockDetail),
            });

            const result = await fetchProductDetail('abc/123');

            expect(result).to.deep.equal(mockDetail);
            const [url] = fetchStub.firstCall.args;
            expect(url).to.include(encodeURIComponent('abc/123'));
        });

        it('throws when no auth token is available', async () => {
            sessionStorage.getItem.restore();
            sandbox.stub(sessionStorage, 'getItem').returns(null);
            window.adobeIMS = { getAccessToken: () => null };
            window.adobeid = { authorize: () => undefined };

            try {
                await fetchProductDetail('some-code');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.include('Not authenticated');
            }
        });

        it('throws with server error on non-ok response', async () => {
            fetchStub.resolves({
                ok: false,
                status: 404,
                json: () => Promise.resolve({ error: 'Product not found' }),
            });

            try {
                await fetchProductDetail('missing-code');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.equal('Product not found');
            }
        });
    });
});
