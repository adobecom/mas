import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { StudioOperations } from '../lib/studio-operations.js';
import { requireIMSAuth, resolveAemBaseUrl } from '../lib/ims-validator.js';

/**
 * Create a personalisation-grouped variation of a card.
 * Backs the `create_grouped_variation` intent.
 *
 * The registry sends `parentId` and `tags`; StudioOperations calls the same
 * things `id` and `pznTags`. The wire contract is the registry's, because that
 * is what the client sends, so the rename happens here.
 */
async function main(params) {
    const { parentId, tags, title, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!parentId) {
            return { statusCode: 400, body: { error: 'parentId is required' } };
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const { url: aemBaseUrl, error: aemError } = resolveAemBaseUrl(params);
        if (aemError) return aemError;
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';

        const aemClient = new AEMClient(aemBaseUrl, authManager);
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);
        const studioOps = new StudioOperations(aemClient, urlBuilder);

        const result = await studioOps.createGroupedVariation({ id: parentId, pznTags: tags, title });

        return {
            statusCode: 200,
            body: result,
        };
    } catch (error) {
        console.error('Create grouped variation error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
