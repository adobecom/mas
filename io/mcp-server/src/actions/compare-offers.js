import { AuthManager } from '../lib/auth-manager.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { AOSClient } from '../services/aos-client.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { arrangementCode, customerSegment, marketSegment, country = 'US', __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!arrangementCode) {
            return {
                statusCode: 400,
                body: { error: 'Arrangement code is required' },
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

        const offers = await aosClient.searchOffers({
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

        const studioLinks = urlBuilder.createOfferLinks({
            product_arrangement_code: arrangementCode,
            customer_segment: customerSegment,
        });

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'compare_offers',
                offers,
                comparison: {
                    byPlanType,
                    byOfferType,
                    byPricePoint,
                },
                studioLinks,
            },
        };
    } catch (error) {
        console.error('Compare offers error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
