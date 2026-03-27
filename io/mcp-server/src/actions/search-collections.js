import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';

const SURFACE_PATHS = {
    acom: '/content/dam/mas/acom',
    ccd: '/content/dam/mas/ccd',
    'adobe-home': '/content/dam/mas/adobe-home',
    commerce: '/content/dam/mas/commerce',
    sandbox: '/content/dam/mas/sandbox',
    nala: '/content/dam/mas/nala',
};

async function main(params) {
    const { surface, query, limit = 50, offset = 0, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!surface) {
            return {
                statusCode: 400,
                body: { error: 'Surface is required' },
            };
        }

        if (!SURFACE_PATHS[surface]) {
            return {
                statusCode: 400,
                body: { error: `Invalid surface: ${surface}. Must be one of: ${Object.keys(SURFACE_PATHS).join(', ')}` },
            };
        }

        const accessToken = __ow_headers.authorization.replace('Bearer ', '');

        const authManager = new AuthManager();
        authManager.setAccessToken(accessToken);

        const aemBaseUrl = params._aemBaseUrl || params.AEM_BASE_URL || 'https://author-p133911-e1313554.adobeaemcloud.com';
        const studioBaseUrl = params.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html';

        const aemClient = new AEMClient(aemBaseUrl, authManager);
        const urlBuilder = new StudioURLBuilder(studioBaseUrl);

        const path = SURFACE_PATHS[surface];

        const fragments = await aemClient.searchFragments({
            path,
            query,
            modelIds: [COLLECTION_MODEL_ID],
            tags: ['mas:studio/content-type/merch-card-collection'],
            limit,
            offset,
        });

        const collections = fragments.map((fragment) => {
            const cardPathsField = fragment.fields?.find?.((f) => f.name === 'cardPaths');
            return {
                id: fragment.id,
                path: fragment.path,
                title: fragment.title,
                cardPaths: cardPathsField?.values || [],
                fields: fragment.fields,
                tags: fragment.tags || [],
                modified: fragment.modified,
                published: fragment.published,
            };
        });

        const studioLinks = {
            viewInStudio: urlBuilder.buildContentLink({
                path,
                query,
                tags: { contentType: ['merch-card-collection'] },
            }),
        };

        return {
            statusCode: 200,
            body: {
                success: true,
                operation: 'search_collections',
                collections,
                count: collections.length,
                studioLinks,
            },
        };
    } catch (error) {
        console.error('Search collections error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
