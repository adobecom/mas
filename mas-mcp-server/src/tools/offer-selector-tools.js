import { AOSClient } from '../services/aos-client.js';
import { StudioURLBuilder } from '../utils/studio-url-builder.js';

/**
 * Offer Selector Tools
 * MCP tools for creating and resolving offer selectors
 */
export class OfferSelectorTools {
    constructor(aosClient, urlBuilder) {
        this.aosClient = aosClient;
        this.urlBuilder = urlBuilder;
    }

    /**
     * Create or retrieve an offer selector
     */
    async createOfferSelector(params) {
        const {
            productArrangementCode,
            commitment,
            term,
            customerSegment,
            marketSegment,
            offerType,
            pricePoint,
            buyingProgram,
            merchant,
            salesChannel,
        } = params;

        const result = await this.aosClient.createOfferSelector({
            product_arrangement_code: productArrangementCode,
            commitment,
            term,
            customer_segment: customerSegment,
            market_segment: marketSegment,
            offer_type: offerType,
            price_point: pricePoint,
            buying_program: buyingProgram,
            merchant,
            sales_channel: salesChannel,
        });

        const checkoutUrl = this.aosClient.getCheckoutUrl(result.id);

        const studioLinks = this.urlBuilder.createOfferLinks({
            product_arrangement_code: productArrangementCode,
            customer_segment: customerSegment,
            offer_type: offerType,
        });

        return {
            offerSelectorId: result.id,
            checkoutUrl,
            studioLinks,
        };
    }

    /**
     * Get offer selector details
     */
    async getOfferSelector(params) {
        const { offerSelectorId, country = 'US' } = params;

        const selector = await this.aosClient.getOfferSelector(offerSelectorId, country);

        const checkoutUrl = this.aosClient.getCheckoutUrl(offerSelectorId);

        return {
            selector,
            checkoutUrl,
        };
    }

    /**
     * Resolve offers from an offer selector
     */
    async resolveOfferSelector(params) {
        const { offerSelectorId, country = 'US' } = params;

        const selector = await this.aosClient.getOfferSelector(offerSelectorId, country);
        const offers = await this.aosClient.resolveOfferSelector(offerSelectorId, country);

        const checkoutUrl = this.aosClient.getCheckoutUrl(offerSelectorId);

        const studioLinks = this.urlBuilder.createOfferLinks({
            product_arrangement_code: selector.product_arrangement_code,
            customer_segment: selector.customer_segment,
            offer_type: selector.offer_type,
        });

        return {
            offers,
            selector,
            checkoutUrl,
            studioLinks,
        };
    }

    /**
     * Get checkout URL for offer selector with options
     */
    getCheckoutUrl(params) {
        const { offerSelectorId, workflowStep, modal, ctaText, promotionCode } = params;

        const checkoutUrl = this.aosClient.getCheckoutUrl(offerSelectorId, {
            workflowStep,
            modal,
            ctaText,
            promotionCode,
        });

        return { checkoutUrl };
    }

    /**
     * Bulk create offer selectors for multiple configurations
     */
    async bulkCreateOfferSelectors(params) {
        const { productArrangementCode, customerSegment, marketSegment, offerType, variations } = params;

        const selectors = await Promise.all(
            variations.map(async (variation) => {
                const result = await this.aosClient.createOfferSelector({
                    product_arrangement_code: productArrangementCode,
                    customer_segment: customerSegment,
                    market_segment: marketSegment,
                    offer_type: offerType,
                    commitment: variation.commitment,
                    term: variation.term,
                    price_point: variation.pricePoint,
                });

                return {
                    offerSelectorId: result.id,
                    checkoutUrl: this.aosClient.getCheckoutUrl(result.id),
                    commitment: variation.commitment,
                    term: variation.term,
                    pricePoint: variation.pricePoint,
                };
            }),
        );

        const studioLinks = this.urlBuilder.createOfferLinks({
            product_arrangement_code: productArrangementCode,
            customer_segment: customerSegment,
            offer_type: offerType,
        });

        return {
            selectors,
            studioLinks,
        };
    }
}
