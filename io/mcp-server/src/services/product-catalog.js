/**
 * Product Catalog Service (Serverless Version)
 * No caching - fetches fresh data on each request
 */
export class ProductCatalog {
    constructor(authManager, productsEndpoint) {
        this.authManager = authManager;
        this.productsEndpoint =
            productsEndpoint || 'https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read';
    }

    async loadProducts() {
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

    async searchProducts(params) {
        const products = await this.loadProducts();

        if (!products) {
            return [];
        }

        let results = Array.from(products.values());

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
