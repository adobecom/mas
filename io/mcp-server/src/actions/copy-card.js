import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { StudioOperations } from '../lib/studio-operations.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

/**
 * Copy/duplicate a card
 * Adobe I/O Runtime action for studio_copy_card operation
 */
async function main(params) {
    const { id, parentPath, newTitle, __ow_headers } = params;

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
        const studioOps = new StudioOperations(aemClient, urlBuilder);

        const result = await studioOps.copyCard({ id, parentPath, newTitle });

        return {
            statusCode: 200,
            body: result,
        };
    } catch (error) {
        console.error('Copy card error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
