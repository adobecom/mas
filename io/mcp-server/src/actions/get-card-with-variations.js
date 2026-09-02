import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { StudioOperations } from '../lib/studio-operations.js';
import { requireIMSAuth, resolveAemBaseUrl } from '../lib/ims-validator.js';

/**
 * Fetch a card together with all of its variations
 * Backs the `get_card_with_variations` intent.
 */
async function main(params) {
    const { id, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!id) {
            return { statusCode: 400, body: { error: 'id is required' } };
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

        const result = await studioOps.getCardWithVariations({ id });

        return {
            statusCode: 200,
            body: result,
        };
    } catch (error) {
        console.error('Fetch a card together with all of its variations error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
