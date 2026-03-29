import { MCP_SERVER_URL } from '../constants.js';

const API_BASE = `${MCP_SERVER_URL}/api/v1`;

function getAccessToken() {
    return (
        sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token ?? window.adobeid?.authorize?.()
    );
}

export async function fetchProducts() {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated. Please log in to access product data.');

    const response = await fetch(`${API_BASE}/products`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to load products: ${response.status}`);
    }
    return response.json();
}

export async function fetchProductDetail(arrangementCode) {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated. Please log in to access product data.');

    const response = await fetch(`${API_BASE}/products/${encodeURIComponent(arrangementCode)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to load product detail: ${response.status}`);
    }
    return response.json();
}
