import { IO_MCP_URL } from '../mas-chat/config.js';

// TODO(MWPW-183572 post-merge): revert to masstudio (prod) endpoint once the
// masstudio OST cache has been rebuilt with DIRECT/RETAIL channel filtering.
// Tracking: https://jira.corp.adobe.com/browse/MWPW-183572
// Do NOT ship this dev namespace to production unchanged.
const OST_PRODUCTS_URL = 'https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read';

// Defense-in-depth: client-side format check on arrangement codes before they
// reach the backend. Real MCS arrangement codes are alphanumeric + underscore
// or hyphen, max ~60 chars in observed data. Audit finding N1.
const ARRANGEMENT_CODE_PATTERN = /^[A-Z0-9_-]{1,64}$/i;

const DEFAULT_TIMEOUT_MS = 10000;

// The OST catalog is ~1946 products / ~691 KB and changes rarely, but the
// picker and the chat both refetch it on demand. Cache the parsed list for the
// tab and re-filter per call: caching the filtered result instead would let one
// search poison the catalog for the next caller. Concurrent callers share the
// in-flight request so a cold page load issues one fetch, not three.
const PRODUCT_CACHE_TTL_MS = 10 * 60 * 1000;

let productCache = null;

/** Drops the cached catalog so the next call refetches. Exported for tests. */
export function clearProductCache() {
    productCache = null;
}

async function loadCatalog() {
    if (productCache && productCache.expiresAt > Date.now()) {
        return productCache.products;
    }

    const request = (async () => {
        const response = await fetchWithTimeout(OST_PRODUCTS_URL, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Failed to fetch products: ${response.status} ${text.slice(0, 200)}`);
        }
        const data = await response.json();
        const productsObj = data.combinedProducts || data;
        return Array.isArray(productsObj) ? productsObj : Object.values(productsObj);
    })();

    const entry = { products: request, expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS };
    productCache = entry;

    try {
        return await request;
    } catch (error) {
        // A failed fetch must not be cached: the next call retries.
        if (productCache === entry) {
            productCache = null;
        }
        throw error;
    }
}

function getAuthHeaders() {
    const accessToken = sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
        throw new Error('Not authenticated: missing IMS access token');
    }
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-gw-ims-org-id': window.adobeIMS?.adobeIdData?.imsOrg || '',
        'x-api-key': window.adobeIMS?.adobeIdData?.client_id || '',
    };
}

async function fetchWithTimeout(url, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

export async function fetchProducts(options = {}) {
    // Shallow copy: callers own their array, so sorting or splicing the result
    // cannot reorder the shared cache. The product objects stay shared, which
    // is why nothing should mutate them in place.
    let products = [...(await loadCatalog())];

    // Client-side filtering mirrors the backend mcp list_products field set
    // (name / product_code / arrangement_code). Without this, chat-side
    // recovery calls (see mas-chat.js recoverProductLookup) would render the
    // full cache as "matches" for any search term.
    if (options.searchText) {
        const needle = String(options.searchText).toLowerCase();
        products = products.filter(
            (p) =>
                String(p.name || '')
                    .toLowerCase()
                    .includes(needle) ||
                String(p.product_code || p.code || '')
                    .toLowerCase()
                    .includes(needle) ||
                String(p.arrangement_code || '')
                    .toLowerCase()
                    .includes(needle),
        );
    }

    return { success: true, operation: 'list_products', products, count: products.length };
}

export async function fetchProductDetail(arrangementCode, { landscape = 'DRAFT' } = {}) {
    if (typeof arrangementCode !== 'string' || !ARRANGEMENT_CODE_PATTERN.test(arrangementCode)) {
        throw new Error(`Invalid arrangement code: must match ${ARRANGEMENT_CODE_PATTERN}`);
    }
    const response = await fetchWithTimeout(`${IO_MCP_URL}/get-product-detail`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ arrangementCode, landscape }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to fetch product detail: ${response.status}`);
    }
    return response.json();
}
