const { Core } = require('@adobe/aio-sdk');
const { readValue, writeValue } = require('./state.js');

const logger = Core.Logger('service-auth', { level: 'info' });

const DEFAULT_IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';
const SERVICE_TOKEN_KEY = 'translation-status.service-token';
const TOKEN_EXPIRY_SAFETY_MARGIN_SECS = 5 * 60;

async function getCachedToken() {
    return readValue(SERVICE_TOKEN_KEY);
}

async function cacheToken(accessToken, expiresInSecs) {
    const ttl = Math.max(1, Math.floor(expiresInSecs) - TOKEN_EXPIRY_SAFETY_MARGIN_SECS);
    if (expiresInSecs <= TOKEN_EXPIRY_SAFETY_MARGIN_SECS) {
        logger.warn(
            `IMS token expires_in (${expiresInSecs}s) is at or below the safety margin (${TOKEN_EXPIRY_SAFETY_MARGIN_SECS}s); caching with a clamped ttl of ${ttl}s, so the cache will barely help`,
        );
    }
    await writeValue(SERVICE_TOKEN_KEY, { accessToken }, ttl);
}

async function fetchNewToken(params = {}) {
    const tokenUrl = params.imsTokenUrl || DEFAULT_IMS_TOKEN_URL;
    const scope = Array.isArray(params.imsScopes) ? params.imsScopes.join(',') : params.imsScopes;
    if (!params.imsClientId || !params.imsClientSecret || !scope) {
        throw new Error('getServiceToken requires imsClientId, imsClientSecret and imsScopes');
    }

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

    await cacheToken(accessToken, expiresInSecs);
    return accessToken;
}

let pendingFetch = null;

async function getServiceToken({ params } = {}) {
    const cached = await getCachedToken();
    if (cached?.accessToken) {
        return cached.accessToken;
    }
    if (!pendingFetch) {
        pendingFetch = fetchNewToken(params).finally(() => {
            pendingFetch = null;
        });
    }
    return pendingFetch;
}

module.exports = {
    getServiceToken,
    DEFAULT_IMS_TOKEN_URL,
    SERVICE_TOKEN_KEY,
};
