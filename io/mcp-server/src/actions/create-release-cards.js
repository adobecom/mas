import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { StudioOperations } from '../lib/studio-operations.js';
import { requireIMSAuth, resolveAemBaseUrl } from '../lib/ims-validator.js';

/**
 * Fetch full MCS merchandising data directly from AOS API for a given arrangement code.
 * Same pattern as ost-products-write.js line 38, but filtered by arrangement_code.
 */
async function fetchMCSProduct(arrangementCode, aosUrl, aosApiKey, locale = 'en_US') {
    const [, country] = locale.split('_');
    const baseUrl = aosUrl.endsWith('/offers') ? aosUrl : `${aosUrl}/offers`;
    const endpoint = `${baseUrl}?country=${encodeURIComponent(country)}&merchant=ADOBE&service_providers=MERCHANDISING,PRODUCT_ARRANGEMENT_V2&locale=${encodeURIComponent(locale)}&landscape=PUBLISHED&arrangement_code=${encodeURIComponent(arrangementCode)}&page_size=200`;

    const response = await fetch(endpoint, {
        headers: { 'x-api-key': aosApiKey },
    });
    if (!response.ok) {
        throw new Error(`AOS API error: ${response.status} ${response.statusText}`);
    }

    const offers = await response.json();
    if (!offers || offers.length === 0) {
        return null;
    }

    // Take the first offer that has merchandising data
    const offer = offers.find((o) => o.merchandising) || offers[0];
    const merch = offer.merchandising || {};

    return {
        arrangement_code: offer.product_arrangement_code || arrangementCode,
        product_code: offer.product_code,
        product_family: offer.product_arrangement_v2?.family,
        customer_segment: offer.customer_segment,
        market_segments: offer.market_segments || [],
        commitment: offer.commitment,
        term: offer.term,
        // Full merchandising payload
        copy: merch.copy || {},
        assets: merch.assets || {},
        links: merch.links || {},
        misc: merch.misc || {},
        fulfillable_items: merch.fulfillable_items || [],
        metadata: merch.metadata || {},
        // Convenience aliases
        name: merch.copy?.name,
        icon: merch.assets?.icons?.svg,
    };
}

async function main(params) {
    const { arrangement_code, variants, parentPath, locale, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) return authError;

        if (!arrangement_code) {
            return { statusCode: 400, body: { error: 'arrangement_code is required' } };
        }
        if (!Array.isArray(variants) || variants.length === 0) {
            return { statusCode: 400, body: { error: 'variants array is required' } };
        }
        if (!parentPath) {
            return { statusCode: 400, body: { error: 'parentPath is required' } };
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');
        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const { url: aemBaseUrl, error: aemError } = resolveAemBaseUrl(params);
        if (aemError) return aemError;
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';
        const aosUrl = params.AOS_URL;
        const aosApiKey = params.AOS_API_KEY;

        if (!aosUrl || !aosApiKey) {
            return { statusCode: 500, body: { error: 'AOS_URL and AOS_API_KEY must be configured' } };
        }

        const aemClient = new AEMClient(aemBaseUrl, authManager);
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);
        const studioOps = new StudioOperations(aemClient, urlBuilder);

        // Fetch full MCS data directly from AOS
        const product = await fetchMCSProduct(arrangement_code, aosUrl, aosApiKey, locale || 'en_US');

        if (!product) {
            return { statusCode: 404, body: { error: `Product not found in AOS for arrangement code: ${arrangement_code}` } };
        }

        // Deterministic field mapping from MCS merchandising
        const productName = product.copy.name || product.name;
        const iconUrl = product.assets.icons?.svg || product.icon;
        const description = product.copy.description || product.copy.short_description;

        const fields = { cardTitle: productName };
        if (description) fields.description = description;
        if (iconUrl) {
            fields.mnemonics = [{ icon: iconUrl, alt: productName }];
        }

        // Deterministic tag mapping from AOS offer data
        const tags = [];
        if (product.product_code) tags.push(`mas:product_code/${product.product_code}`);
        if (product.arrangement_code) tags.push(`mas:pa/${product.arrangement_code}`);
        if (product.product_family) tags.push(`mas:product_family/${product.product_family}`);
        if (product.customer_segment) tags.push(`mas:customer_segment/${product.customer_segment}`);
        if (product.market_segments) {
            product.market_segments.forEach((s) => tags.push(`mas:market_segments/${s}`));
        }

        // Create cards
        const results = [];
        for (const variant of variants) {
            const card = {
                title: `${productName} - ${variant.charAt(0).toUpperCase() + variant.slice(1)}`,
                variant,
                parentPath,
                fields,
                tags,
            };
            try {
                const result = await studioOps.createCard(card);
                results.push(result);
            } catch (e) {
                results.push({ success: false, error: e.message, card });
            }
        }

        const successCount = results.filter((r) => r.success).length;
        return {
            statusCode: 200,
            body: {
                success: successCount === results.length,
                cards: results,
                count: results.length,
                successCount,
                product: {
                    name: productName,
                    product_code: product.product_code,
                    arrangement_code: product.arrangement_code,
                    copy: product.copy,
                    assets: product.assets,
                    links: product.links,
                    misc: product.misc,
                },
            },
        };
    } catch (error) {
        console.error('Create release cards error:', error);
        return { statusCode: 500, body: { error: error.message } };
    }
}

export { main };
