import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { id, cardPaths, etag, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!id) {
            return {
                statusCode: 400,
                body: { error: 'Collection ID is required' },
            };
        }

        if (!cardPaths || cardPaths.length === 0) {
            return {
                statusCode: 400,
                body: { error: 'At least one card path is required' },
            };
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const aemBaseUrl = params._aemBaseUrl || params.AEM_BASE_URL || 'https://author-p133911-e1313554.adobeaemcloud.com';
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';

        const aemClient = new AEMClient(aemBaseUrl, authManager);
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);

        const fragment = await aemClient.getFragment(id);
        const cardPathsField = fragment.fields?.find?.((f) => f.name === 'cardPaths');
        const existingPaths = cardPathsField?.values || [];

        const newPaths = [...new Set([...existingPaths, ...cardPaths])];

        const updateFields = {
            cardPaths: newPaths,
        };

        const updatedFragment = await aemClient.updateFragment(id, updateFields, etag || fragment.etag);

        const updatedCardPathsField = updatedFragment.fields?.find?.((f) => f.name === 'cardPaths');
        const collection = {
            id: updatedFragment.id,
            path: updatedFragment.path,
            title: updatedFragment.title,
            cardPaths: updatedCardPathsField?.values || [],
            fields: updatedFragment.fields,
            tags: updatedFragment.tags || [],
            modified: updatedFragment.modified,
            published: updatedFragment.published,
        };

        const studioLinks = urlBuilder.createCollectionLinks(collection);

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'add_cards_to_collection',
                collection,
                addedCount: cardPaths.length,
                message: `Added ${cardPaths.length} card(s) to collection "${updatedFragment.title}"`,
                studioLinks: {
                    viewInStudio: studioLinks.view,
                },
            },
        };
    } catch (error) {
        console.error('Add cards to collection error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
