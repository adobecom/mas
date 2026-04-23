import { AuthManager } from '../lib/auth-manager.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { AOSClient } from '../services/aos-client.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { offerId, country = 'US', __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!offerId) {
            return {
                statusCode: 400,
                body: { error: 'Offer ID is required' },
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

        const offer = await aosClient.getOffer(offerId, country);

        const studioLinks = urlBuilder.createOfferLinks({
            product_arrangement_code: offer.product_arrangement_code,
            customer_segment: offer.customer_segment,
            offer_type: offer.offer_type,
        });

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'get_offer_by_id',
                offer,
                studioLinks,
            },
        };
    } catch (error) {
        console.error('Get offer by ID error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
