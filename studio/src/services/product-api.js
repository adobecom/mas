import { IO_MCP_URL } from '../constants.js';

// TODO: revert to masstudio after MWPW-183572 merges and masstudio cache is rebuilt with DIRECT/RETAIL filter
const OST_PRODUCTS_URL = 'https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read';

function getAuthHeaders() {
    const accessToken = sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        headers['x-gw-ims-org-id'] = window.adobeIMS?.adobeIdData?.imsOrg || '';
        headers['x-api-key'] = window.adobeIMS?.adobeIdData?.client_id || '';
    }
    return headers;
}

export async function fetchProducts() {
    const response = await fetch(OST_PRODUCTS_URL, {
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
    const response = await fetch(`${IO_MCP_URL}/get-product-detail`, {
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
