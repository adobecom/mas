import { AuthManager } from '../lib/auth-manager.js';
import { AEMClient } from '../lib/aem-client.js';
import { StudioURLBuilder } from '../lib/studio-url-builder.js';
import { StudioOperations } from '../lib/studio-operations.js';
import { requireIMSAuth, resolveAemBaseUrl } from '../lib/ims-validator.js';

const DEFAULT_TIMEOUT_MS = 5000;
const KEYWORD_SEARCH_TIMEOUT_MS = 15000;
const HARD_RESULT_CAP = 200;

const TIMEOUT_SENTINEL = Symbol('search-cards-timeout');

function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve(TIMEOUT_SENTINEL), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Search for cards with filters
 * Adobe I/O Runtime action for studio_search_cards operation
 *
 * Hardened in MWPW-183572:
 *   - Hard timeout (5s default, override via SEARCH_TIMEOUT_MS) returning a
 *     structured `{success: false, error: 'TIMEOUT'}` instead of a 502.
 *   - Hard 200-result cap to keep response payloads bounded even when the
 *     caller passes `limit > 200`.
 *   - When the caller provides `id` or `osi` only (no `query`/`tags`), the
 *     request is short-circuited to `studioOps.searchById` for a fast path.
 */
async function main(params) {
    const { surface, query, tags, limit, locale, osi, titleSearch, id, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
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

        const isFastPath = (id || osi) && !query && !(tags && tags.length);
        // Keyword/title search both paginate via cursor and may scan thousands of fragments;
        // give them the long timeout. Single-card / OSI fast paths use the default.
        const isKeywordSearch = !!query;
        const baseTimeout = isKeywordSearch ? KEYWORD_SEARCH_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
        const timeoutMs = parseInt(params.SEARCH_TIMEOUT_MS, 10) || baseTimeout;

        const operation = isFastPath
            ? studioOps.searchById({ id, osi, surface, locale })
            : studioOps.searchCards({
                  surface,
                  query,
                  tags,
                  limit: capLimit(limit),
                  locale,
                  osi,
                  titleSearch,
              });

        const result = await withTimeout(operation, timeoutMs);

        if (result === TIMEOUT_SENTINEL) {
            return {
                statusCode: 200,
                body: {
                    success: false,
                    error: 'TIMEOUT',
                    operation: 'search',
                    results: [],
                    count: 0,
                    message: `Search timed out after ${timeoutMs}ms`,
                },
            };
        }

        if (Array.isArray(result?.results) && result.results.length > HARD_RESULT_CAP) {
            result.results = result.results.slice(0, HARD_RESULT_CAP);
            result.count = result.results.length;
            result.truncated = true;
        }

        return {
            statusCode: 200,
            body: result,
        };
    } catch (error) {
        console.error('Search cards error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

function capLimit(limit) {
    const parsed = parseInt(limit, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return HARD_RESULT_CAP;
    return Math.min(parsed, HARD_RESULT_CAP);
}

export { main };
