import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { AOSClient } from '../services/aos-client.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { cardId, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!cardId) {
            return {
                statusCode: 400,
                body: { error: 'Card ID is required' },
            };
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const aemBaseUrl = params._aemBaseUrl || params.AEM_BASE_URL || 'https://author-p133911-e1313554.adobeaemcloud.com';
        const aosBaseUrl = params.AOS_URL || 'https://aos.adobe.io';
        const aosApiKey = params.AOS_API_KEY || '';
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';

        const aemClient = new AEMClient(aemBaseUrl, authManager);
        const aosClient = new AOSClient(authManager, {
            baseUrl: aosBaseUrl,
            apiKey: aosApiKey,
        });
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);

        const fragment = await aemClient.getFragment(cardId);

        const variantField = fragment.fields?.find?.((f) => f.name === 'variant');
        const sizeField = fragment.fields?.find?.((f) => f.name === 'size');
        const mnemonicIconField = fragment.fields?.find?.((f) => f.name === 'mnemonicIcon');

        const card = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant: variantField?.values?.[0] || 'plans',
            size: sizeField?.values?.[0] || 'wide',
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const issues = [];
        let offer = null;

        const offerSelectorId = mnemonicIconField?.values?.[0];

        if (!offerSelectorId) {
            issues.push('No offer selector linked to card');
        } else {
            try {
                const offers = await aosClient.resolveOfferSelector(offerSelectorId);
                offer = offers[0];

                const cardTags = card.tags || [];
                const offerPlanType = offer.planType;
                const offerType = offer.offer_type;
                const customerSegment = offer.customer_segment;

                if (offerPlanType && !cardTags.some((tag) => tag === `mas:plan_type/${offerPlanType.toLowerCase()}`)) {
                    issues.push(`Card missing plan_type tag: mas:plan_type/${offerPlanType.toLowerCase()}`);
                }

                if (offerType && !cardTags.some((tag) => tag === `mas:offer_type/${offerType.toLowerCase()}`)) {
                    issues.push(`Card missing offer_type tag: mas:offer_type/${offerType.toLowerCase()}`);
                }

                if (customerSegment && !cardTags.some((tag) => tag === `mas:customer_segment/${customerSegment.toLowerCase()}`)) {
                    issues.push(`Card missing customer_segment tag: mas:customer_segment/${customerSegment.toLowerCase()}`);
                }
            } catch (error) {
                issues.push(`Failed to resolve offer selector: ${error.message}`);
            }
        }

        const studioLinks = urlBuilder.createCardLinks(card);

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'validate_card_offer',
                card,
                offer,
                isConsistent: issues.length === 0,
                issues,
                studioLinks: {
                    viewInStudio: studioLinks.view,
                    viewFolder: studioLinks.folder,
                },
            },
        };
    } catch (error) {
        console.error('Validate card offer error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
