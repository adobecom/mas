import { IO_MCP_URL } from '../constants.js';

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

export async function fetchProducts() {
    const response = await fetchWithTimeout(OST_PRODUCTS_URL, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to fetch products: ${response.status} ${text.slice(0, 200)}`);
    }
    const data = await response.json();
    const productsObj = data.combinedProducts || data;
    const products = Array.isArray(productsObj) ? productsObj : Object.values(productsObj);
    return { success: true, operation: 'list_products', products, count: products.length };
}

export async function fetchProductDetail(arrangementCode) {
    if (typeof arrangementCode !== 'string' || !ARRANGEMENT_CODE_PATTERN.test(arrangementCode)) {
        throw new Error(`Invalid arrangement code: must match ${ARRANGEMENT_CODE_PATTERN}`);
    }
    const response = await fetchWithTimeout(`${IO_MCP_URL}/get-product-detail`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ arrangementCode }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to fetch product detail: ${response.status}`);
    }
    return response.json();
}
