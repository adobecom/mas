import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { StudioOperations } from '../lib/studio-operations.js';

/**
 * Publish a card to production
 * Adobe I/O Runtime action for studio_publish_card operation
 */
async function main(params) {
    const { id, publishReferences = true, __ow_headers } = params;

    try {
        const accessToken = __ow_headers?.authorization?.replace('Bearer ', '');

        if (!accessToken) {
            return {
                statusCode: 401,
                body: { error: 'Authorization required' },
            };
        }

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const aemBaseUrl = params.AEM_BASE_URL || 'https://author-p133911-e1313554.adobeaemcloud.com';
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';

        const aemClient = new AEMClient(aemBaseUrl, authManager);
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);
        const studioOps = new StudioOperations(aemClient, urlBuilder);

        const result = await studioOps.publishCard({ id, publishReferences });

        return {
            statusCode: 200,
            body: result,
        };
    } catch (error) {
        console.error('Publish card error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
