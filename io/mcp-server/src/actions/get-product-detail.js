import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { arrangementCode, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!arrangementCode) {
            return {
                statusCode: 400,
                body: { error: 'arrangementCode is required' },
            };
        }

        const aosUrl = params.AOS_URL;
        const aosApiKey = params.AOS_API_KEY;
        if (!aosUrl || !aosApiKey) {
            return {
                statusCode: 500,
                body: { error: 'AOS_URL and AOS_API_KEY must be configured' },
            };
        }

        const endpoint = `${aosUrl}?country=US&merchant=ADOBE&service_providers=MERCHANDISING,PRODUCT_ARRANGEMENT_V2&locale=en_US&api_key=${aosApiKey}&landscape=PUBLISHED&arrangement_code=${arrangementCode}&page_size=200`;

        const response = await fetch(endpoint);
        if (!response.ok) {
            return {
                statusCode: response.status,
                body: { error: `AOS API error: ${response.status} ${response.statusText}` },
            };
        }

        const offers = await response.json();
        if (!offers || offers.length === 0) {
            return {
                statusCode: 404,
                body: { error: `No product found for arrangement code: ${arrangementCode}` },
            };
        }

        const offer = offers.find((o) => o.merchandising) || offers[0];
        const merch = offer.merchandising || {};

        const product = {
            arrangement_code: offer.product_arrangement_code || arrangementCode,
            product_code: offer.product_code,
            product_family: offer.product_arrangement_v2?.family,
            customer_segment: offer.customer_segment,
            market_segments: offer.market_segments || [],
            copy: merch.copy || {},
            assets: merch.assets || {},
            links: merch.links || {},
            misc: merch.misc || {},
            fulfillable_items: merch.fulfillable_items || [],
            metadata: merch.metadata || {},
            name: merch.copy?.name,
            icon: merch.assets?.icons?.svg,
        };

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'get_product_detail',
                product,
            },
        };
    } catch (error) {
        console.error('Get product detail error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
