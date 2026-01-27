import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

async function main(params) {
    const { id, __ow_headers } = params;

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

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const aemBaseUrl = params._aemBaseUrl || params.AEM_BASE_URL || 'https://author-p133911-e1313554.adobeaemcloud.com';
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';

        const aemClient = new AEMClient(aemBaseUrl, authManager);
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);

        const fragment = await aemClient.getFragment(id);

        if (!fragment) {
            return {
                statusCode: 404,
                body: { error: `Collection not found: ${id}` },
            };
        }

        const cardPathsField = fragment.fields?.find?.((f) => f.name === 'cardPaths');
        const cardPaths = cardPathsField?.values || [];

        const collection = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            cardPaths,
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = urlBuilder.createCollectionLinks(collection);

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'get_collection',
                collection,
                studioLinks: {
                    viewInStudio: studioLinks.view,
                },
            },
        };
    } catch (error) {
        console.error('Get collection error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
