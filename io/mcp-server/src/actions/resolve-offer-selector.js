import { AuthManager } from '../lib/auth-manager.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { AOSClient } from '../services/aos-client.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { offerSelectorId, country = 'US', __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!offerSelectorId) {
            return {
                statusCode: 400,
                body: { error: 'Offer selector ID is required' },
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

        const selector = await aosClient.getOfferSelector(offerSelectorId, country);
        const offers = await aosClient.resolveOfferSelector(offerSelectorId, country);

        const checkoutUrl = aosClient.getCheckoutUrl(offerSelectorId);

        const studioLinks = urlBuilder.createOfferLinks({
            product_arrangement_code: selector.product_arrangement_code,
            customer_segment: selector.customer_segment,
            offer_type: selector.offer_type,
        });

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'resolve_offer_selector',
                offers,
                selector,
                checkoutUrl,
                studioLinks,
            },
        };
    } catch (error) {
        console.error('Resolve offer selector error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
