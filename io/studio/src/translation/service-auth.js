const { Core } = require('@adobe/aio-sdk');
const crypto = require('crypto');
const { readValue, writeValue, deleteValue } = require('./state.js');

const logger = Core.Logger('service-auth', { level: 'info' });

const DEFAULT_IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';
const SERVICE_TOKEN_KEY_PREFIX = 'translation-status.service-token';
const TOKEN_EXPIRY_SAFETY_MARGIN_SECS = 5 * 60;

/**
 * Validates the client-credentials inputs and returns the normalized
 * (comma-joined) scope string. Called before any cache read/write so that
 * missing creds or scopes are never masked by a still-cached token.
 */
function validateCredentialsAndGetScope(params = {}) {
    const scope = Array.isArray(params.imsScopes) ? params.imsScopes.join(',') : params.imsScopes;
    if (!params.imsClientId || !params.imsClientSecret || !scope) {
        throw new Error('getServiceToken requires imsClientId, imsClientSecret and imsScopes');
    }
    return scope;
}

/**
 * Derives the cache key from the client id + scopes (rather than a single
 * static key) so that a credential/scope config change starts a fresh cache
 * entry instead of silently continuing to serve a token cached under the
 * previous identity.
 */
function buildServiceTokenKey(clientId, scope) {
    const identityHash = crypto.createHash('sha256').update(`${clientId}:${scope}`).digest('hex').slice(0, 16);
    return `${SERVICE_TOKEN_KEY_PREFIX}.${identityHash}`;
}

async function getCachedToken(key) {
    return readValue(key);
}

async function cacheToken(key, accessToken, expiresInSecs) {
    const ttl = Math.max(1, Math.floor(expiresInSecs) - TOKEN_EXPIRY_SAFETY_MARGIN_SECS);
    if (expiresInSecs <= TOKEN_EXPIRY_SAFETY_MARGIN_SECS) {
        logger.warn(
            `IMS token expires_in (${expiresInSecs}s) is at or below the safety margin (${TOKEN_EXPIRY_SAFETY_MARGIN_SECS}s); caching with a clamped ttl of ${ttl}s, so the cache will barely help`,
        );
    }
    await writeValue(key, { accessToken }, ttl);
}

async function fetchNewToken(params, scope, key) {
    const tokenUrl = params.imsTokenUrl || DEFAULT_IMS_TOKEN_URL;

    const body = new URLSearchParams({
        client_id: params.imsClientId,
        client_secret: params.imsClientSecret,
        grant_type: 'client_credentials',
        scope,
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!response.ok) {
        const message = `Failed to obtain IMS service token: ${response.status} ${response.statusText}`;
        logger.error(message);
        throw new Error(message);
    }

    const { access_token: accessToken, expires_in: expiresIn } = await response.json();
    if (!accessToken) {
        throw new Error('IMS token response is missing access_token');
    }
    const expiresInSecs = Number(expiresIn);
    if (!Number.isFinite(expiresInSecs) || expiresInSecs <= 0) {
        throw new Error(`IMS token response has an invalid expires_in: ${expiresIn}`);
    }

    await cacheToken(key, accessToken, expiresInSecs);
    return accessToken;
}

const pendingFetches = new Map();

async function getServiceToken({ params } = {}) {
    const scope = validateCredentialsAndGetScope(params);
    const key = buildServiceTokenKey(params.imsClientId, scope);

    const cached = await getCachedToken(key);
    if (cached?.accessToken) {
        return cached.accessToken;
    }
    let pendingFetch = pendingFetches.get(key);
    if (!pendingFetch) {
        pendingFetch = fetchNewToken(params, scope, key).finally(() => {
            pendingFetches.delete(key);
        });
        pendingFetches.set(key, pendingFetch);
    }
    return pendingFetch;
}

/**
 * Evicts the cached service token for the given client id/scopes so the next
 * getServiceToken() call fetches a fresh one from IMS instead of continuing
 * to serve a token Odin has already rejected (e.g. revoked). Callers (e.g.
 * the future Hoolihan webhook) should call this on a 401 from Odin and retry
 * once before giving up.
 */
async function invalidateServiceToken({ params } = {}) {
    const scope = validateCredentialsAndGetScope(params);
    const key = buildServiceTokenKey(params.imsClientId, scope);
    await deleteValue(key);
}

module.exports = {
    getServiceToken,
    invalidateServiceToken,
    DEFAULT_IMS_TOKEN_URL,
    SERVICE_TOKEN_KEY_PREFIX,
};
