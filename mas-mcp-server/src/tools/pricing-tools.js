import { AOSClient } from '../services/aos-client.js';

/**
 * Pricing and Checkout Tools
 * MCP tools for getting formatted prices and checkout URLs
 */
export class PricingTools {
    constructor(aosClient) {
        this.aosClient = aosClient;
    }

    /**
     * Get formatted price for an offer selector
     */
    async getFormattedPrice(params) {
        const {
            offerSelectorId,
            type = 'price',
            displayFormatted = true,
            displayRecurrence = true,
            displayPerUnit = false,
            displayTax = false,
            forceTaxExclusive = false,
        } = params;

        const price = await this.aosClient.getFormattedPrice(offerSelectorId, {
            type,
            displayFormatted,
            displayRecurrence,
            displayPerUnit,
            displayTax,
            forceTaxExclusive,
        });

        return {
            price,
            offerSelectorId,
        };
    }

    /**
     * Get multiple price formats for an offer selector
     */
    async getAllPriceFormats(params) {
        const { offerSelectorId } = params;

        const [price, optical, annual, strikethrough] = await Promise.all([
            this.aosClient.getFormattedPrice(offerSelectorId, { type: 'price' }),
            this.aosClient.getFormattedPrice(offerSelectorId, { type: 'optical' }),
            this.aosClient.getFormattedPrice(offerSelectorId, { type: 'annual' }),
            this.aosClient.getFormattedPrice(offerSelectorId, { type: 'strikethrough' }),
        ]);

        return {
            offerSelectorId,
            prices: {
                price,
                optical,
                annual,
                strikethrough,
            },
        };
    }

    /**
     * Get checkout URL with options
     */
    getCheckoutUrl(params) {
        const { offerSelectorId, workflowStep, modal, ctaText, promotionCode } = params;

        const checkoutUrl = this.aosClient.getCheckoutUrl(offerSelectorId, {
            workflowStep,
            modal,
            ctaText,
            promotionCode,
        });

        return {
            checkoutUrl,
            offerSelectorId,
        };
    }

    /**
     * Get multiple checkout URLs with different configurations
     */
    getCheckoutUrls(params) {
        const { offerSelectorId, configurations = [] } = params;

        const defaultConfigurations = [
            { name: 'default' },
            { name: 'email', workflowStep: 'email' },
            { name: 'recommendation', workflowStep: 'recommendation' },
            { name: 'segmentation', workflowStep: 'segmentation' },
        ];

        const configs = configurations.length > 0 ? configurations : defaultConfigurations;

        const checkoutUrls = configs.map((config) => ({
            name: config.name,
            url: this.aosClient.getCheckoutUrl(offerSelectorId, {
                workflowStep: config.workflowStep,
                modal: config.modal,
                ctaText: config.ctaText,
                promotionCode: config.promotionCode,
            }),
        }));

        return {
            offerSelectorId,
            checkoutUrls,
        };
    }
}
