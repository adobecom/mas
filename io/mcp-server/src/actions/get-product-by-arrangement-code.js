import { AuthManager } from '../lib/auth-manager.js';
import { ProductCatalog } from '../services/product-catalog.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { arrangementCode, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!arrangementCode) {
            return {
                statusCode: 400,
                body: { error: 'arrangementCode is required' },
            };
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const productCatalog = new ProductCatalog(authManager, params.PRODUCTS_ENDPOINT);

        const product = await productCatalog.getProduct(arrangementCode);

        if (!product) {
            return {
                statusCode: 200,
                body: {
                    success: true,
                    operation: 'get_product_by_arrangement_code',
                    product: null,
                    arrangementCode,
                    message: `No MCS product found for arrangement code "${arrangementCode}".`,
                },
            };
        }

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'get_product_by_arrangement_code',
                product,
                arrangementCode,
                message: `Found MCS product for ${arrangementCode}.`,
            },
        };
    } catch (error) {
        console.error('Get product by arrangement code error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
