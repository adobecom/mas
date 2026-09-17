const { expect } = require('chai');
const proxyquire = require('proxyquire');

const VALID_HEADERS = { authorization: 'Bearer good-token' };

function load({ store = {}, tokenValid = true } = {}) {
    const fakeState = {
        get: async (key) => (store[key] === undefined ? undefined : { value: store[key] }),
    };
    return proxyquire('../../src/ost-products/read.js', {
        '@adobe/aio-lib-state': { init: async () => fakeState, '@noCallThru': true },
        '@adobe/aio-lib-ims': {
            Ims: class {
                async validateToken() {
                    return { valid: tokenValid };
                }
            },
            '@noCallThru': true,
        },
    });
}

describe('ost-products-read', () => {
    it('returns 404 with a JSON error when the product cache was never written', async () => {
        const mod = load({ store: {} });

        const result = await mod.main({ __ow_headers: VALID_HEADERS });

        expect(result.statusCode).to.equal(404);
        expect(result.headers['Content-Type']).to.equal('application/json');
        expect(result.body).to.be.an('object');
        expect(result.body.error)
            .to.be.a('string')
            .and.to.match(/ost-products-write/i);
    });

    it('never returns a 2xx with an empty body', async () => {
        const mod = load({ store: {} });

        const result = await mod.main({ __ow_headers: VALID_HEADERS });

        const isSuccess = result.statusCode >= 200 && result.statusCode < 300;
        const hasBody = result.body !== undefined && result.body !== null && result.body !== '';
        expect(isSuccess && !hasBody, `got ${result.statusCode} with body ${JSON.stringify(result.body)}`).to.equal(false);
    });

    it('returns the cached payload with json and brotli headers when present', async () => {
        const payload = Buffer.from('compressed-bytes');
        const mod = load({ store: { ostResult: payload } });

        const result = await mod.main({ __ow_headers: VALID_HEADERS });

        expect(result.statusCode).to.equal(200);
        expect(result.body).to.equal(payload);
        expect(result.headers['Content-Type']).to.equal('application/json');
        expect(result.headers['Content-Encoding']).to.equal('br');
    });

    it('treats a cached value with no byte length as missing rather than serving it as brotli', async () => {
        // aio-lib-state round-trips values through serialization, so a Buffer can
        // come back as {type:'Buffer',data:[...]}. That has no .length, so a
        // length-only guard would fall through to the 200 path with
        // Content-Encoding: br set and hand the browser undecodable bytes.
        const mod = load({ store: { ostResult: { type: 'Buffer', data: [] } } });

        const result = await mod.main({ __ow_headers: VALID_HEADERS });

        expect(result.statusCode).to.equal(404);
    });

    it('serves a non-empty string payload, which is how state may return the cache', async () => {
        const mod = load({ store: { ostResult: 'brotli-bytes-as-string' } });

        const result = await mod.main({ __ow_headers: VALID_HEADERS });

        expect(result.statusCode).to.equal(200);
        expect(result.headers['Content-Encoding']).to.equal('br');
    });

    it('returns 401 when the bearer token is invalid', async () => {
        const mod = load({ store: { ostResult: Buffer.from('x') }, tokenValid: false });

        const result = await mod.main({ __ow_headers: VALID_HEADERS });

        expect(result.statusCode).to.equal(401);
    });
});
