import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { StudioOperations } from '../lib/studio-operations.js';
import { requireIMSAuth, resolveAemBaseUrl } from '../lib/ims-validator.js';

const DEFAULT_TIMEOUT_MS = 5000;
const TIMEOUT_SENTINEL = Symbol('search-by-id-timeout');

function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve(TIMEOUT_SENTINEL), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Fast-path direct lookup for a single fragment by ID or by OSI.
 *
 * Adobe I/O Runtime action for the deterministic search router. Takes one of:
 *   - `id`: a fragment UUID. Returns at most one card; misses are surfaced as
 *     an empty result set (the chat UI renders a polite dead-end with two
 *     pivot suggestions).
 *   - `osi`: an offer selector ID. Returns 0+ cards filtered by exact `osi`
 *     field match. Surface-scoped if `surface` is provided; otherwise scans
 *     `/content/dam/mas`.
 */
async function main(params) {
    const { id, osi, surface, locale, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) return authError;

        if (!id && !osi) {
            return {
                statusCode: 400,
                body: { error: 'Either `id` or `osi` is required' },
            };
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

        const timeoutMs = parseInt(params.SEARCH_TIMEOUT_MS, 10) || DEFAULT_TIMEOUT_MS;
        const result = await withTimeout(studioOps.searchById({ id, osi, surface, locale }), timeoutMs);

        if (result === TIMEOUT_SENTINEL) {
            return {
                statusCode: 200,
                body: {
                    success: false,
                    error: 'TIMEOUT',
                    operation: 'searchById',
                    results: [],
                    count: 0,
                    message: `Lookup timed out after ${timeoutMs}ms`,
                },
            };
        }

        return { statusCode: 200, body: result };
    } catch (error) {
        console.error('Search by id error:', error);
        return { statusCode: 500, body: { error: error.message } };
    }
}

export { main };
