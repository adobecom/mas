import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { AOSClient } from '../services/aos-client.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { cardId, offerSelectorId, etag, __ow_headers } = params;

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

        if (!offerSelectorId) {
            return {
                statusCode: 400,
                body: { error: 'Offer selector ID is required' },
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

        const updateFields = {
            mnemonicIcon: [offerSelectorId],
        };

        const fragment = await aemClient.getFragment(cardId);
        const updatedFragment = await aemClient.updateFragment(cardId, updateFields, etag || fragment.etag);

        const variantField = updatedFragment.fields?.find?.((f) => f.name === 'variant');
        const sizeField = updatedFragment.fields?.find?.((f) => f.name === 'size');

        const card = {
            id: updatedFragment.id,
            path: updatedFragment.path,
            title: updatedFragment.title,
            variant: variantField?.values?.[0] || 'plans',
            size: sizeField?.values?.[0] || 'wide',
            fields: updatedFragment.fields,
            tags: updatedFragment.tags || [],
            modified: updatedFragment.modified,
            published: updatedFragment.published,
        };

        const offers = await aosClient.resolveOfferSelector(offerSelectorId);
        const offer = offers[0];

        const studioLinks = urlBuilder.createCardLinks(card);

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'link_card_to_offer',
                card,
                offer,
                message: `Linked card "${card.title}" to offer selector ${offerSelectorId}`,
                studioLinks: {
                    viewInStudio: studioLinks.view,
                    viewFolder: studioLinks.folder,
                },
            },
        };
    } catch (error) {
        console.error('Link card to offer error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
