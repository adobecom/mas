import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';

async function main(params) {
    const { title, parentPath, cardPaths = [], fields = {}, tags = [], __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const aemBaseUrl = params._aemBaseUrl || params.AEM_BASE_URL || 'https://author-p133911-e1313554.adobeaemcloud.com';
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';

        const aemClient = new AEMClient(aemBaseUrl, authManager);
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);

        const fragmentData = {
            title,
            description: `Merch card collection: ${title}`,
            modelId: COLLECTION_MODEL_ID,
            parentPath,
            fields: [
                { name: 'cardPaths', values: cardPaths },
                ...Object.entries(fields).map(([name, value]) => ({
                    name,
                    values: Array.isArray(value) ? value : [value],
                })),
            ],
            tags: [...tags, 'mas:studio/content-type/merch-card-collection'],
        };

        const fragment = await aemClient.createFragment(fragmentData);

        const collection = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            cardPaths: cardPaths,
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
                operation: 'create_collection',
                collection,
                message: `Created collection: "${fragment.title}"`,
                studioLinks: {
                    viewInStudio: studioLinks.view,
                },
            },
        };
    } catch (error) {
        console.error('Create collection error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
