import { AuthManager } from './auth-manager.js';

/**
 * Product Catalog Service
 * Manages Adobe product listings
 */
export class ProductCatalog {
    constructor(authManager, productsEndpoint) {
        this.authManager = authManager;
        this.productsEndpoint =
            productsEndpoint || 'https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read';
        this.products = null;
    }

    /**
     * Load products from endpoint
     */
    async loadProducts() {
        if (this.products) {
            return;
        }

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

        this.products = new Map(Object.entries(productsObj));
    }

    /**
     * Search products by name or code
     */
    async searchProducts(params) {
        await this.loadProducts();

        if (!this.products) {
            return [];
        }

        let results = Array.from(this.products.entries()).map(([_, product]) => product);

        if (params.searchText) {
            const search = params.searchText.toLowerCase();
            results = results.filter(
                (p) =>
                    p.name.toLowerCase().includes(search) ||
                    p.code.toLowerCase().includes(search) ||
                    p.arrangement_code?.toLowerCase().includes(search),
            );
        }

        if (params.customerSegment) {
            results = results.filter((p) => p.customerSegments[params.customerSegment] === true);
        }

        if (params.marketSegment) {
            results = results.filter((p) => p.marketSegments[params.marketSegment] === true);
        }

        if (params.limit) {
            results = results.slice(0, params.limit);
        }

        return results;
    }

    /**
     * Get product by code
     */
    async getProduct(code) {
        await this.loadProducts();

        if (!this.products) {
            return null;
        }

        return this.products.get(code) || null;
    }

    /**
     * List all products
     */
    async listAllProducts() {
        await this.loadProducts();

        if (!this.products) {
            return [];
        }

        return Array.from(this.products.values());
    }
}
