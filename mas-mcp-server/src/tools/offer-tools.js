import { AOSClient } from '../services/aos-client.js';
import { ProductCatalog } from '../services/product-catalog.js';
import { StudioURLBuilder } from '../utils/studio-url-builder.js';

/**
 * Offer Discovery Tools
 * MCP tools for searching and retrieving offer information from AOS
 */
export class OfferTools {
    constructor(aosClient, productCatalog, urlBuilder) {
        this.aosClient = aosClient;
        this.productCatalog = productCatalog;
        this.urlBuilder = urlBuilder;
    }

    /**
     * Search for offers with filters
     */
    async searchOffers(params) {
        const offers = await this.aosClient.searchOffers(params);

        const studioLinks = {
            viewCardsInStudio: this.urlBuilder.buildContentLink({
                tags: {
                    offerType: params.offerType ? [params.offerType] : undefined,
                    customerSegment: params.customerSegment ? [params.customerSegment] : undefined,
                    marketSegments: params.marketSegment ? [params.marketSegment] : undefined,
                },
            }),
            createWithAI: this.urlBuilder.buildChatLink(),
        };

        return {
            offers,
            studioLinks,
        };
    }

    /**
     * Get offer by ID
     */
    async getOfferById(params) {
        const { offerId, country = 'US' } = params;

        const offer = await this.aosClient.getOffer(offerId, country);

        const studioLinks = this.urlBuilder.createOfferLinks({
            product_arrangement_code: offer.product_arrangement_code,
            customer_segment: offer.customer_segment,
            offer_type: offer.offer_type,
        });

        return {
            offer,
            studioLinks,
        };
    }

    /**
     * List all products
     */
    async listProducts(params = {}) {
        const products = await this.productCatalog.searchProducts(params);

        return {
            products,
            total: products.length,
        };
    }

    /**
     * Get product by code
     */
    async getProduct(params) {
        const { code } = params;

        const product = await this.productCatalog.getProduct(code);

        return { product };
    }

    /**
     * Compare offers for a product
     */
    async compareOffers(params) {
        const { arrangementCode, customerSegment, marketSegment, country = 'US' } = params;

        const offers = await this.aosClient.searchOffers({
            arrangementCode,
            customerSegment,
            marketSegment,
            country,
        });

        const byPlanType = {};
        const byOfferType = {};
        const byPricePoint = {};

        offers.forEach((offer) => {
            if (offer.planType) {
                if (!byPlanType[offer.planType]) {
                    byPlanType[offer.planType] = [];
                }
                byPlanType[offer.planType].push(offer);
            }

            if (offer.offer_type) {
                if (!byOfferType[offer.offer_type]) {
                    byOfferType[offer.offer_type] = [];
                }
                byOfferType[offer.offer_type].push(offer);
            }

            if (offer.price_point) {
                if (!byPricePoint[offer.price_point]) {
                    byPricePoint[offer.price_point] = [];
                }
                byPricePoint[offer.price_point].push(offer);
            }
        });

        const studioLinks = this.urlBuilder.createOfferLinks({
            product_arrangement_code: arrangementCode,
            customer_segment: customerSegment,
        });

        return {
            offers,
            comparison: {
                byPlanType,
                byOfferType,
                byPricePoint,
            },
            studioLinks,
        };
    }

    /**
     * Find offers by product name
     */
    async findOffersByProductName(params) {
        const { productName, customerSegment, marketSegment, country = 'US' } = params;

        const products = await this.productCatalog.searchProducts({
            searchText: productName,
            limit: 1,
        });

        if (products.length === 0) {
            return {
                product: null,
                offers: [],
                studioLinks: {},
            };
        }

        const product = products[0];

        const offers = await this.aosClient.searchOffers({
            arrangementCode: product.arrangement_code,
            customerSegment,
            marketSegment,
            country,
        });

        const studioLinks = this.urlBuilder.createOfferLinks({
            product_arrangement_code: product.arrangement_code,
            customer_segment: customerSegment,
        });

        return {
            product,
            offers,
            studioLinks,
        };
    }
}
