import { AuthManager } from '../lib/auth-manager.js';
import { ProductCatalog } from '../services/product-catalog.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

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
        const productCatalog = new ProductCatalog(authManager, productsEndpoint);

        const products = await productCatalog.searchProducts({
            searchText,
            customerSegment,
            marketSegment,
            limit,
        });

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'list_products',
                products,
                count: products.length,
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
