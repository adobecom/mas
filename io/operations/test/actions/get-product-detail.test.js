import { expect } from 'chai';
import { Ims } from '@adobe/aio-lib-ims';
import { main } from '../../src/actions/get-product-detail.js';

function createResponse(status, data, statusText = '') {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: statusText || (status === 200 ? 'OK' : 'Error'),
        json: async () => data,
    });
}

const validHeaders = { authorization: 'Bearer valid-test-token' };

describe('get-product-detail', () => {
    let originalFetch;
    let originalValidateToken;

    before(() => {
        originalValidateToken = Ims.prototype.validateToken;
    });

    after(() => {
        Ims.prototype.validateToken = originalValidateToken;
    });

    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    function mockAuth(valid = true) {
        Ims.prototype.validateToken = async () => (valid ? { valid: true } : { valid: false });
    }

    it('returns 401 when no authorization header', async () => {
        const result = await main({ __ow_headers: {} });
        expect(result.statusCode).to.equal(401);
    });

    it('returns 401 when authorization header is invalid', async () => {
        const result = await main({
            __ow_headers: { authorization: 'invalid' },
        });
        expect(result.statusCode).to.equal(401);
    });

    it('returns 400 when arrangementCode is missing', async () => {
        mockAuth();
        const result = await main({
            __ow_headers: validHeaders,
        });
        expect(result.statusCode).to.equal(400);
        expect(result.body.error).to.equal('arrangementCode is required');
    });

    it('returns 500 when AOS_URL is missing', async () => {
        mockAuth();
        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'test-code',
            AOS_API_KEY: 'test-key',
        });
        expect(result.statusCode).to.equal(500);
        expect(result.body.error).to.equal('AOS_URL and AOS_API_KEY must be configured');
    });

    it('returns 500 when AOS_API_KEY is missing', async () => {
        mockAuth();
        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'test-code',
            AOS_URL: 'https://aos.example.com',
        });
        expect(result.statusCode).to.equal(500);
        expect(result.body.error).to.equal('AOS_URL and AOS_API_KEY must be configured');
    });

    it('forwards status code when AOS API returns non-OK response', async () => {
        mockAuth();
        globalThis.fetch = () => createResponse(503, null, 'Service Unavailable');

        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'test-code',
            AOS_URL: 'https://aos.example.com',
            AOS_API_KEY: 'test-key',
        });
        expect(result.statusCode).to.equal(503);
        expect(result.body.error).to.equal('AOS API error: 503 Service Unavailable');
    });

    it('returns 404 when AOS API returns empty array', async () => {
        mockAuth();
        globalThis.fetch = () => createResponse(200, []);

        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'test-code',
            AOS_URL: 'https://aos.example.com',
            AOS_API_KEY: 'test-key',
        });
        expect(result.statusCode).to.equal(404);
        expect(result.body.error).to.equal('No product found for arrangement code: test-code');
    });

    it('returns 200 with correct product shape when merchandising data exists', async () => {
        mockAuth();
        const mockOffer = {
            product_arrangement_code: 'PA-123',
            product_code: 'PROD-001',
            product_arrangement_v2: { family: 'CREATIVE_CLOUD' },
            customer_segment: 'INDIVIDUAL',
            market_segments: ['COM'],
            merchandising: {
                copy: { name: 'Photoshop', description: 'Edit photos' },
                assets: { icons: { svg: 'https://example.com/icon.svg' } },
                links: { learn_more: 'https://example.com' },
                misc: { tier: 'premium' },
                fulfillable_items: [{ id: 'fi-1' }],
                metadata: { version: '2024' },
            },
        };
        globalThis.fetch = () => createResponse(200, [mockOffer]);

        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'PA-123',
            AOS_URL: 'https://aos.example.com',
            AOS_API_KEY: 'test-key',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body.success).to.equal(true);
        expect(result.body.operation).to.equal('get_product_detail');

        const product = result.body.product;
        expect(product.arrangement_code).to.equal('PA-123');
        expect(product.product_code).to.equal('PROD-001');
        expect(product.product_family).to.equal('CREATIVE_CLOUD');
        expect(product.customer_segment).to.equal('INDIVIDUAL');
        expect(product.market_segments).to.deep.equal(['COM']);
        expect(product.copy).to.deep.equal({
            name: 'Photoshop',
            description: 'Edit photos',
        });
        expect(product.assets).to.deep.equal({
            icons: { svg: 'https://example.com/icon.svg' },
        });
        expect(product.links).to.deep.equal({
            learn_more: 'https://example.com',
        });
        expect(product.misc).to.deep.equal({ tier: 'premium' });
        expect(product.fulfillable_items).to.deep.equal([{ id: 'fi-1' }]);
        expect(product.metadata).to.deep.equal({ version: '2024' });
        expect(product.name).to.equal('Photoshop');
        expect(product.icon).to.equal('https://example.com/icon.svg');
    });

    it('falls back to first offer when no offer has merchandising data', async () => {
        mockAuth();
        const fallbackOffer = {
            product_arrangement_code: 'PA-456',
            product_code: 'PROD-002',
            product_arrangement_v2: { family: 'DOCUMENT_CLOUD' },
            customer_segment: 'TEAM',
            market_segments: ['EDU'],
        };
        globalThis.fetch = () => createResponse(200, [fallbackOffer]);

        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'PA-456',
            AOS_URL: 'https://aos.example.com',
            AOS_API_KEY: 'test-key',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body.success).to.equal(true);

        const product = result.body.product;
        expect(product.arrangement_code).to.equal('PA-456');
        expect(product.product_code).to.equal('PROD-002');
        expect(product.product_family).to.equal('DOCUMENT_CLOUD');
        expect(product.customer_segment).to.equal('TEAM');
        expect(product.market_segments).to.deep.equal(['EDU']);
        expect(product.copy).to.deep.equal({});
        expect(product.assets).to.deep.equal({});
        expect(product.links).to.deep.equal({});
        expect(product.misc).to.deep.equal({});
        expect(product.fulfillable_items).to.deep.equal([]);
        expect(product.metadata).to.deep.equal({});
        expect(product.name).to.be.undefined;
        expect(product.icon).to.be.undefined;
    });

    it('prefers offer with merchandising over first offer', async () => {
        mockAuth();
        const plainOffer = {
            product_arrangement_code: 'PA-PLAIN',
            product_code: 'PROD-PLAIN',
        };
        const merchOffer = {
            product_arrangement_code: 'PA-MERCH',
            product_code: 'PROD-MERCH',
            merchandising: {
                copy: { name: 'Preferred Product' },
                assets: {},
                links: {},
                misc: {},
                fulfillable_items: [],
                metadata: {},
            },
        };
        globalThis.fetch = () => createResponse(200, [plainOffer, merchOffer]);

        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'PA-MERCH',
            AOS_URL: 'https://aos.example.com',
            AOS_API_KEY: 'test-key',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body.product.product_code).to.equal('PROD-MERCH');
        expect(result.body.product.name).to.equal('Preferred Product');
    });

    it('uses arrangementCode as fallback when offer lacks product_arrangement_code', async () => {
        mockAuth();
        const offer = { product_code: 'PROD-NO-AC' };
        globalThis.fetch = () => createResponse(200, [offer]);

        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'FALLBACK-CODE',
            AOS_URL: 'https://aos.example.com',
            AOS_API_KEY: 'test-key',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body.product.arrangement_code).to.equal('FALLBACK-CODE');
    });

    it('returns 500 when fetch throws an error', async () => {
        mockAuth();
        globalThis.fetch = () => Promise.reject(new Error('Network failure'));

        const result = await main({
            __ow_headers: validHeaders,
            arrangementCode: 'test-code',
            AOS_URL: 'https://aos.example.com',
            AOS_API_KEY: 'test-key',
        });
        expect(result.statusCode).to.equal(500);
        expect(result.body.error).to.equal('Network failure');
    });
});
