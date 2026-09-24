import { AuthManager } from '../lib/auth-manager.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { AOSClient } from '../services/aos-client.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
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
        __ow_headers,
    } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!productArrangementCode) {
            return {
                statusCode: 400,
                body: { error: 'Product arrangement code is required' },
            };
        }

        if (!customerSegment) {
            return {
                statusCode: 400,
                body: { error: 'Customer segment is required' },
            };
        }

        if (!marketSegment) {
            return {
                statusCode: 400,
                body: { error: 'Market segment is required' },
            };
        }

        if (!offerType) {
            return {
                statusCode: 400,
                body: { error: 'Offer type is required' },
            };
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const aosBaseUrl = params.AOS_URL || 'https://aos.adobe.io';
        const aosApiKey = params.AOS_API_KEY || '';
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';

        const aosClient = new AOSClient(authManager, {
            baseUrl: aosBaseUrl,
            apiKey: aosApiKey,
        });
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);

        const result = await aosClient.createOfferSelector({
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

        const checkoutUrl = aosClient.getCheckoutUrl(result.id);

        const studioLinks = urlBuilder.createOfferLinks({
            product_arrangement_code: productArrangementCode,
            customer_segment: customerSegment,
            offer_type: offerType,
        });

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'create_offer_selector',
                offerSelectorId: result.id,
                checkoutUrl,
                studioLinks,
            },
        };
    } catch (error) {
        console.error('Create offer selector error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
