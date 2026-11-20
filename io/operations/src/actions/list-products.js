import { AuthManager } from '../lib/auth-manager.js';
import { ProductCatalog } from '../services/product-catalog.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

// Runtime drops any action result over 1 MB; the full MCS catalog is larger, about 1.4 MB.
const MAX_PRODUCTS = 50;

async function main(params) {
    const { searchText, customerSegment, marketSegment, limit, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const productsEndpoint = params.PRODUCTS_ENDPOINT;
        const productCatalog = new ProductCatalog(authManager, productsEndpoint, params.PRODUCTS_CACHE_TTL_MS);

        const matches = await productCatalog.searchProducts({ searchText, customerSegment, marketSegment });
        const requested = Number(limit) > 0 ? Number(limit) : MAX_PRODUCTS;
        const products = matches.slice(0, Math.min(requested, MAX_PRODUCTS));

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'list_products',
                products,
                count: products.length,
                total: matches.length,
            },
        };
    } catch (error) {
        console.error('List products error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
