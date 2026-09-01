/**
 * Product Catalog Service (Serverless Version)
 *
 * The MCS catalog endpoint has no server-side search: it is a plain GET that
 * returns the whole catalog (~1946 products, ~691 KB), which we then filter in
 * memory. The catalog changes rarely, so the response is cached at module scope
 * with a TTL. Actions build a new ProductCatalog per request, so the cache has
 * to outlive the instance: a warm I/O Runtime container reuses the module and
 * skips the refetch. Concurrent callers share one in-flight request so a cold
 * container does not stampede the endpoint.
 *
 * The catalog is the same for every user, so entries are keyed by endpoint only.
 * The cached Map is shared with all callers and must be treated as read-only.
 */

const DEFAULT_PRODUCTS_ENDPOINT = 'https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read';
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;

const catalogCache = new Map();

/** Drops every cached catalog. Exported for tests. */
export function clearProductCatalogCache() {
    catalogCache.clear();
}

function resolveCacheTtl(cacheTtlMs) {
    const ttl = Number(cacheTtlMs);
    if (cacheTtlMs === null || cacheTtlMs === undefined || cacheTtlMs === '' || Number.isNaN(ttl) || ttl < 0) {
        return DEFAULT_CACHE_TTL_MS;
    }
    return ttl;
}

export class ProductCatalog {
    constructor(authManager, productsEndpoint, cacheTtlMs) {
        this.authManager = authManager;
        this.productsEndpoint = productsEndpoint || DEFAULT_PRODUCTS_ENDPOINT;
        this.cacheTtlMs = resolveCacheTtl(cacheTtlMs);
    }

    async fetchProducts() {
        const authHeader = await this.authManager.getAuthHeader();

        const response = await fetch(this.productsEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to load products: ${response.statusText}`);
        }

        const data = await response.json();
        const productsObj = data.combinedProducts || {};

        return new Map(Object.entries(productsObj));
    }

    /**
     * One line per call so the cache can be measured in real traffic.
     * `reason=warm` means a container reused an already-settled entry, which is
     * the number that says whether container reuse is actually happening;
     * `reason=inflight` only means a concurrent caller shared a pending fetch.
     */
    logCache(outcome, reason, fields = {}) {
        const parts = [`cache=${outcome}`, `reason=${reason}`, `ttlMs=${this.cacheTtlMs}`];
        for (const [key, value] of Object.entries(fields)) {
            parts.push(`${key}=${value}`);
        }
        console.log(`[ProductCatalog] ${parts.join(' ')}`);
    }

    async loadProducts() {
        if (this.cacheTtlMs === 0) {
            this.logCache('bypass', 'disabled');
            return this.fetchProducts();
        }

        const cached = catalogCache.get(this.productsEndpoint);
        if (cached && cached.expiresAt > Date.now()) {
            const settled = cached.settled;
            const products = await cached.products;
            this.logCache('hit', settled ? 'warm' : 'inflight', {
                ageMs: Date.now() - cached.cachedAt,
                products: products.size,
            });
            return products;
        }

        const products = this.fetchProducts();
        const entry = {
            products,
            cachedAt: Date.now(),
            expiresAt: Date.now() + this.cacheTtlMs,
            settled: false,
        };
        catalogCache.set(this.productsEndpoint, entry);

        try {
            const resolved = await products;
            entry.settled = true;
            this.logCache('miss', cached ? 'expired' : 'cold', {
                products: resolved.size,
                fetchMs: Date.now() - entry.cachedAt,
            });
            return resolved;
        } catch (error) {
            // A failed fetch must not be cached: the next call retries.
            if (catalogCache.get(this.productsEndpoint) === entry) {
                catalogCache.delete(this.productsEndpoint);
            }
            throw error;
        }
    }

    async searchProducts(params) {
        const products = await this.loadProducts();

        if (!products) {
            return [];
        }

        let results = Array.from(products.values());

        if (params.searchText) {
            const search = String(params.searchText).toLowerCase();
            results = results.filter(
                (p) =>
                    String(p.name || '')
                        .toLowerCase()
                        .includes(search) ||
                    String(p.code || '')
                        .toLowerCase()
                        .includes(search) ||
                    String(p.arrangement_code || '')
                        .toLowerCase()
                        .includes(search),
            );
        }

        if (params.customerSegment) {
            results = results.filter((p) => p.customerSegments?.[params.customerSegment] === true);
        }

        if (params.marketSegment) {
            results = results.filter((p) => p.marketSegments?.[params.marketSegment] === true);
        }

        if (params.limit) {
            results = results.slice(0, params.limit);
        }

        return results;
    }

    async getProduct(code) {
        const products = await this.loadProducts();

        if (!products) {
            return null;
        }

        return products.get(code) || null;
    }

    async listAllProducts() {
        const products = await this.loadProducts();

        if (!products) {
            return [];
        }

        return Array.from(products.values());
    }
}
