import { expect } from 'chai';
import { ProductCatalog, clearProductCatalogCache } from '../../src/services/product-catalog.js';

const ENDPOINT = 'https://products.example.com/ost-products-read';
const OTHER_ENDPOINT = 'https://products.example.com/other-products-read';
const STUB_AUTH = { getAuthHeader: async () => 'Bearer fake-token' };

function catalogPayload(codes) {
    const combinedProducts = {};
    for (const code of codes) {
        combinedProducts[code] = { code, name: `Product ${code}`, arrangement_code: code };
    }
    return { combinedProducts };
}

/**
 * Stub fetch that answers every call with the next payload in the list,
 * repeating the last one once the list runs out.
 */
function stubFetch(payloads, { deferred = false } = {}) {
    const state = { calls: [], release: null };
    let gate = Promise.resolve();
    if (deferred) {
        gate = new Promise((resolve) => {
            state.release = resolve;
        });
    }
    globalThis.fetch = async (url) => {
        state.calls.push(url);
        const payload = payloads[Math.min(state.calls.length - 1, payloads.length - 1)];
        await gate;
        return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => payload,
        };
    };
    return state;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Captures console.log lines emitted by the service. */
function captureLogs() {
    const lines = [];
    const original = console.log;
    console.log = (...args) => {
        lines.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    };
    lines.restore = () => {
        console.log = original;
    };
    return lines;
}

describe('ProductCatalog caching', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        clearProductCatalogCache();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        clearProductCatalogCache();
    });

    it('fetches the catalog on a cold cache (miss)', async () => {
        const fetchState = stubFetch([catalogPayload(['A', 'B'])]);
        const catalog = new ProductCatalog(STUB_AUTH, ENDPOINT);

        const products = await catalog.loadProducts();

        expect(fetchState.calls.length).to.equal(1);
        expect(fetchState.calls[0]).to.equal(ENDPOINT);
        expect(products.size).to.equal(2);
    });

    it('serves a second call from cache without refetching (hit)', async () => {
        const fetchState = stubFetch([catalogPayload(['A', 'B']), catalogPayload(['C'])]);
        const catalog = new ProductCatalog(STUB_AUTH, ENDPOINT);

        const first = await catalog.loadProducts();
        const second = await catalog.loadProducts();

        expect(fetchState.calls.length).to.equal(1);
        expect(second.size).to.equal(first.size);
        expect(second.get('A').name).to.equal('Product A');
    });

    it('shares the cache across instances so warm containers skip the refetch', async () => {
        const fetchState = stubFetch([catalogPayload(['A', 'B'])]);

        await new ProductCatalog(STUB_AUTH, ENDPOINT).searchProducts({});
        await new ProductCatalog(STUB_AUTH, ENDPOINT).searchProducts({});
        const third = await new ProductCatalog(STUB_AUTH, ENDPOINT).getProduct('B');

        expect(fetchState.calls.length).to.equal(1);
        expect(third.code).to.equal('B');
    });

    it('refetches once the TTL has expired', async () => {
        const fetchState = stubFetch([catalogPayload(['A']), catalogPayload(['A', 'B'])]);
        const catalog = new ProductCatalog(STUB_AUTH, ENDPOINT, 10);

        const first = await catalog.loadProducts();
        expect(first.size).to.equal(1);

        await sleep(30);

        const second = await catalog.loadProducts();
        expect(fetchState.calls.length).to.equal(2);
        expect(second.size).to.equal(2);
    });

    it('does not stampede the endpoint when calls arrive concurrently', async () => {
        const fetchState = stubFetch([catalogPayload(['A', 'B'])], { deferred: true });

        const pending = [
            new ProductCatalog(STUB_AUTH, ENDPOINT).loadProducts(),
            new ProductCatalog(STUB_AUTH, ENDPOINT).loadProducts(),
            new ProductCatalog(STUB_AUTH, ENDPOINT).searchProducts({ searchText: 'product' }),
            new ProductCatalog(STUB_AUTH, ENDPOINT).listAllProducts(),
        ];
        fetchState.release();
        const results = await Promise.all(pending);

        expect(fetchState.calls.length).to.equal(1);
        expect(results[0].size).to.equal(2);
        expect(results[2].length).to.equal(2);
        expect(results[3].length).to.equal(2);
    });

    it('keys the cache by endpoint', async () => {
        const fetchState = stubFetch([catalogPayload(['A']), catalogPayload(['B', 'C'])]);

        const first = await new ProductCatalog(STUB_AUTH, ENDPOINT).loadProducts();
        const second = await new ProductCatalog(STUB_AUTH, OTHER_ENDPOINT).loadProducts();

        expect(fetchState.calls.length).to.equal(2);
        expect(first.size).to.equal(1);
        expect(second.size).to.equal(2);
    });

    it('does not cache a failed fetch', async () => {
        let call = 0;
        globalThis.fetch = async () => {
            call += 1;
            if (call === 1) {
                return { ok: false, status: 503, statusText: 'Service Unavailable' };
            }
            return { ok: true, status: 200, statusText: 'OK', json: async () => catalogPayload(['A']) };
        };
        const catalog = new ProductCatalog(STUB_AUTH, ENDPOINT);

        let error;
        try {
            await catalog.loadProducts();
        } catch (e) {
            error = e;
        }
        expect(error).to.be.an('error');

        const products = await catalog.loadProducts();
        expect(call).to.equal(2);
        expect(products.size).to.equal(1);
    });

    it('bypasses the cache when the TTL is zero', async () => {
        const fetchState = stubFetch([catalogPayload(['A']), catalogPayload(['A', 'B'])]);
        const catalog = new ProductCatalog(STUB_AUTH, ENDPOINT, 0);

        await catalog.loadProducts();
        const second = await catalog.loadProducts();

        expect(fetchState.calls.length).to.equal(2);
        expect(second.size).to.equal(2);
    });

    it('falls back to the default TTL when the param is missing or unparseable', async () => {
        const fetchState = stubFetch([catalogPayload(['A'])]);

        await new ProductCatalog(STUB_AUTH, ENDPOINT).loadProducts();
        await new ProductCatalog(STUB_AUTH, ENDPOINT, '').loadProducts();
        await new ProductCatalog(STUB_AUTH, ENDPOINT, 'not-a-number').loadProducts();

        expect(fetchState.calls.length).to.equal(1);
    });

    it('accepts a TTL passed as a string, the way action params arrive', async () => {
        const fetchState = stubFetch([catalogPayload(['A']), catalogPayload(['A', 'B'])]);
        const catalog = new ProductCatalog(STUB_AUTH, ENDPOINT, '10');

        await catalog.loadProducts();
        await sleep(30);
        await catalog.loadProducts();

        expect(fetchState.calls.length).to.equal(2);
    });

    describe('hit/miss logging', () => {
        let logs;

        beforeEach(() => {
            logs = captureLogs();
        });

        afterEach(() => {
            logs.restore();
        });

        it('logs a cold miss on the first call', async () => {
            stubFetch([catalogPayload(['A', 'B'])]);

            await new ProductCatalog(STUB_AUTH, ENDPOINT).loadProducts();

            const line = logs.find((l) => l.includes('[ProductCatalog]'));
            expect(line).to.contain('cache=miss');
            expect(line).to.contain('reason=cold');
            expect(line).to.contain('products=2');
        });

        it('logs a hit with the entry age on a subsequent call', async () => {
            stubFetch([catalogPayload(['A', 'B'])]);
            const catalog = new ProductCatalog(STUB_AUTH, ENDPOINT);

            await catalog.loadProducts();
            await catalog.loadProducts();

            const hits = logs.filter((l) => l.includes('cache=hit'));
            expect(hits.length).to.equal(1);
            expect(hits[0]).to.contain('reason=warm');
            expect(hits[0]).to.match(/ageMs=\d+/);
            expect(hits[0]).to.contain('products=2');
        });

        it('distinguishes an expired miss from a cold miss', async () => {
            stubFetch([catalogPayload(['A']), catalogPayload(['A', 'B'])]);
            const catalog = new ProductCatalog(STUB_AUTH, ENDPOINT, 10);

            await catalog.loadProducts();
            await sleep(30);
            await catalog.loadProducts();

            const misses = logs.filter((l) => l.includes('cache=miss'));
            expect(misses.length).to.equal(2);
            expect(misses[0]).to.contain('reason=cold');
            expect(misses[1]).to.contain('reason=expired');
        });

        it('logs a bypass when caching is turned off', async () => {
            stubFetch([catalogPayload(['A'])]);

            await new ProductCatalog(STUB_AUTH, ENDPOINT, 0).loadProducts();

            const line = logs.find((l) => l.includes('[ProductCatalog]'));
            expect(line).to.contain('cache=bypass');
        });

        it('marks a stampede waiter as inflight, not as a warm-container hit', async () => {
            const fetchState = stubFetch([catalogPayload(['A', 'B'])], { deferred: true });

            const pending = [
                new ProductCatalog(STUB_AUTH, ENDPOINT).loadProducts(),
                new ProductCatalog(STUB_AUTH, ENDPOINT).loadProducts(),
                new ProductCatalog(STUB_AUTH, ENDPOINT).loadProducts(),
            ];
            fetchState.release();
            await Promise.all(pending);

            expect(logs.filter((l) => l.includes('cache=miss')).length).to.equal(1);
            const hits = logs.filter((l) => l.includes('cache=hit'));
            expect(hits.length).to.equal(2);
            expect(hits.every((l) => l.includes('reason=inflight'))).to.equal(true);
        });
    });
});
