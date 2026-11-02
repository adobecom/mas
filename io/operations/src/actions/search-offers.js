import { AuthManager } from '../lib/auth-manager.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { AOSClient } from '../services/aos-client.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const {
        arrangementCode,
        commitment,
        term,
        customerSegment,
        marketSegment,
        offerType,
        country,
        language,
        pricePoint,
        __ow_headers,
    } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
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

        const offers = await aosClient.searchOffers({
            arrangementCode,
            commitment,
            term,
            customerSegment,
            marketSegment,
            offerType,
            country,
            language,
            pricePoint,
        });

        const studioLinks = {
            viewCardsInStudio: urlBuilder.buildContentLink({
                tags: {
                    offerType: offerType ? [offerType] : undefined,
                    customerSegment: customerSegment ? [customerSegment] : undefined,
                    marketSegments: marketSegment ? [marketSegment] : undefined,
                },
            }),
            createWithAI: urlBuilder.buildChatLink(),
        };

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'search_offers',
                offers,
                count: offers.length,
                studioLinks,
            },
        };
    } catch (error) {
        console.error('Search offers error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
