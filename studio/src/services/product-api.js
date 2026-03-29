import { executeMCPTool } from './mcp-client.js';

export async function fetchProducts() {
    return executeMCPTool('list_products', {});
}

export async function fetchProductDetail(arrangementCode) {
    return executeMCPTool('get-product-detail', { arrangementCode });
}
