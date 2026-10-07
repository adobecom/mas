import { expect } from 'chai';
import { Ims } from '@adobe/aio-lib-ims';
import { main } from '../../src/actions/list-products.js';
import { clearProductCatalogCache } from '../../src/services/product-catalog.js';

const ENDPOINT = 'https://products.example.com/ost-products-read';
const validHeaders = { authorization: 'Bearer valid-test-token' };

const CATALOG = {
    combinedProducts: {
        phsp: { code: 'PHSP', name: 'Photoshop', arrangement_code: 'phsp_direct_individual' },
        ilst: { code: 'ILST', name: 'Illustrator', arrangement_code: 'ilst_direct_individual' },
        pa1930: { code: 'FFLY', name: 'Adobe Firefly Standard', arrangement_code: 'PA-1930' },
        pa1931: { code: 'FFLP', name: 'Adobe Firefly Pro', arrangement_code: 'PA-1931' },
    },
};

function respond(status, json, statusText = 'OK') {
    return { ok: status >= 200 && status < 300, status, statusText, json };
}

describe('list-products action', () => {
    let originalFetch;
    let originalValidateToken;
    let fetchCalls;

    before(() => {
        originalValidateToken = Ims.prototype.validateToken;
    });

    after(() => {
        Ims.prototype.validateToken = originalValidateToken;
    });

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        fetchCalls = [];
        clearProductCatalogCache();
        Ims.prototype.validateToken = async () => ({ valid: true });
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        clearProductCatalogCache();
    });

    function stubCatalog(responseFactory) {
        globalThis.fetch = async (url, init) => {
            fetchCalls.push({ url, init });
            return responseFactory();
        };
    }

    function call(extra = {}) {
        return main({
            __ow_headers: validHeaders,
            PRODUCTS_ENDPOINT: ENDPOINT,
            PRODUCTS_CACHE_TTL_MS: 0,
            ...extra,
        });
    }

    it('returns 401 without an authorization header and never reads the catalog', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await main({ __ow_headers: {}, PRODUCTS_ENDPOINT: ENDPOINT });

        expect(result.statusCode).to.equal(401);
        expect(fetchCalls).to.have.length(0);
    });

    it('returns the whole catalog when no searchText is given', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await call();

        expect(result.statusCode).to.equal(200);
        expect(result.body.operation).to.equal('list_products');
        expect(result.body.count).to.equal(4);
        expect(result.body.products).to.have.length(4);
    });

    it('forwards the caller token to the catalog endpoint', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        await call();

        expect(fetchCalls[0].url).to.equal(ENDPOINT);
        expect(fetchCalls[0].init.headers.Authorization).to.equal('Bearer valid-test-token');
    });

    it('matches a single product by exact PA code in searchText', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await call({ searchText: 'PA-1930' });

        expect(result.body.count).to.equal(1);
        expect(result.body.products[0].name).to.equal('Adobe Firefly Standard');
    });

    it('matches PA codes case-insensitively', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await call({ searchText: 'pa-1930' });

        expect(result.body.products.map((p) => p.arrangement_code)).to.deep.equal(['PA-1930']);
    });

    it('returns several products when searchText is a shared substring', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await call({ searchText: 'firefly' });

        expect(result.body.count).to.equal(2);
        expect(result.body.products.map((p) => p.arrangement_code)).to.have.members(['PA-1930', 'PA-1931']);
    });

    it('matches on product code', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await call({ searchText: 'fflp' });

        expect(result.body.products.map((p) => p.name)).to.deep.equal(['Adobe Firefly Pro']);
    });

    it('returns success with zero products when nothing matches', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await call({ searchText: 'does-not-exist' });

        expect(result.statusCode).to.equal(200);
        expect(result.body.success).to.equal(true);
        expect(result.body.count).to.equal(0);
        expect(result.body.products).to.deep.equal([]);
    });

    it('honors limit', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await call({ limit: 2 });

        expect(result.body.products).to.have.length(2);
    });

    it('filters by customerSegment and marketSegment flags', async () => {
        stubCatalog(() =>
            respond(200, async () => ({
                combinedProducts: {
                    a: { name: 'A', customerSegments: { INDIVIDUAL: true }, marketSegments: { COM: true } },
                    b: { name: 'B', customerSegments: { TEAM: true }, marketSegments: { COM: true } },
                },
            })),
        );

        const result = await call({ customerSegment: 'INDIVIDUAL', marketSegment: 'COM' });

        expect(result.body.products.map((p) => p.name)).to.deep.equal(['A']);
    });

    // Characterization: the action has no 32-hex OSI/offer-id guard. That
    // routing lives in the ai-chat handler (io/studio ai-chat/index.js), which
    // never sends such a string as searchText. Here it is plain fuzzy text.
    it('treats a 32-hex string as plain fuzzy text and matches nothing', async () => {
        stubCatalog(() => respond(200, async () => CATALOG));

        const result = await call({ searchText: 'F5B3D59867BC5B6020EFA0763C3AE92A' });

        expect(result.statusCode).to.equal(200);
        expect(result.body.count).to.equal(0);
    });

    it('returns an empty list when the catalog has no combinedProducts key', async () => {
        stubCatalog(() => respond(200, async () => ({})));

        const result = await call({ searchText: 'photoshop' });

        expect(result.statusCode).to.equal(200);
        expect(result.body.products).to.deep.equal([]);
    });

    it('returns an empty list for an empty combinedProducts map', async () => {
        stubCatalog(() => respond(200, async () => ({ combinedProducts: {} })));

        const result = await call();

        expect(result.statusCode).to.equal(200);
        expect(result.body.count).to.equal(0);
    });

    it('answers with a clear, actionable error (not a raw JSON-parse crash) when the catalog body is empty', async () => {
        stubCatalog(() =>
            respond(200, async () => {
                throw new SyntaxError('Unexpected end of JSON input');
            }),
        );

        const result = await call();

        expect(result.statusCode).to.equal(500);
        expect(result.body.error).to.be.a('string');
        expect(result.body.error).to.not.include('Unexpected end of JSON input');
        expect(result.body.error).to.match(/empty response|not populated|product catalog/i);
    });

    it('answers 500 naming the upstream status text when the catalog endpoint fails', async () => {
        stubCatalog(() => respond(404, async () => ({}), 'Not Found'));

        const result = await call();

        expect(result.statusCode).to.equal(500);
        expect(result.body.error).to.include('Failed to load products');
        expect(result.body.error).to.include('Not Found');
    });
});
