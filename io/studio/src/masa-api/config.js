import { createPrivateKey } from 'node:crypto';
import { AdapterError, validId } from './contract.js';

const invalid = () => new AdapterError(503, 'masa-not-configured', 'Studio MASA integration is not configured.');
const list = (value, max, validate) => {
    if (typeof value !== 'string') throw invalid();
    const entries = value.split(',').map((item) => item.trim());
    if (
        !entries.length ||
        entries.length > max ||
        new Set(entries).size !== entries.length ||
        entries.some((item) => !validate(item))
    )
        throw invalid();
    return entries;
};
const origin = (value, local = false) => {
    if (typeof value !== 'string' || value.length > 200) throw invalid();
    const url = new URL(value);
    if (
        url.origin !== value ||
        (url.protocol !== 'https:' && !(local && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    )
        throw invalid();
    return value;
};
/** A gateway routes on a path prefix and strips it, so MASA still receives the signed `/v1/...` path. */
const apiBase = (value) => {
    if (typeof value !== 'string' || value.length > 200) throw invalid();
    const url = new URL(value);
    const prefix = url.pathname === '/' ? '' : url.pathname;
    if (origin(url.origin) + prefix !== value || !/^(?:\/[\w-]+)*$/.test(prefix)) throw invalid();
    return value;
};

const imsOrigin = (environment) => {
    if (environment === 'prod') return 'https://ims-na1.adobelogin.com';
    if (environment === 'stage') return 'https://ims-na1-stg1.adobelogin.com';
    throw invalid();
};
const credential = (value, pattern) => {
    if (typeof value !== 'string' || !pattern.test(value)) throw invalid();
    return value;
};

/** Read immutable action inputs, never fields parsed from browser JSON. Empty enablement stays off. */
export function loadConfig(params) {
    if (params.MASA_API_ENABLED !== 'true' && params.MASA_API_ENABLED !== true) return null;
    try {
        if (
            !validId(params.MASA_API_ISSUER) ||
            !validId(params.MASA_API_AUDIENCE) ||
            typeof params.MASA_API_SERVICE_TOKEN !== 'string' ||
            !/^[A-Za-z0-9_-]{43,256}$/.test(params.MASA_API_SERVICE_TOKEN) ||
            typeof params.MASA_IMS_CLIENT_ID !== 'string' ||
            !/^[A-Za-z0-9_-]{1,200}$/.test(params.MASA_IMS_CLIENT_ID) ||
            typeof params.MASA_IDENTITY_PRIVATE_KEY_B64 !== 'string' ||
            params.MASA_IDENTITY_PRIVATE_KEY_B64.length > 2048
        )
            throw invalid();
        const pem = Buffer.from(params.MASA_IDENTITY_PRIVATE_KEY_B64, 'base64');
        if (pem.toString('base64') !== params.MASA_IDENTITY_PRIVATE_KEY_B64) throw invalid();
        const privateKey = createPrivateKey(pem);
        if (privateKey.asymmetricKeyType !== 'ed25519') throw invalid();
        return {
            apiBaseUrl: apiBase(params.MASA_API_BASE_URL),
            mediaOrigin: origin(params.MASA_MEDIA_BASE_URL),
            privateKey,
            serviceToken: params.MASA_API_SERVICE_TOKEN,
            issuer: params.MASA_API_ISSUER,
            audience: params.MASA_API_AUDIENCE,
            pilotUsers: list(params.MASA_PILOT_USERS, 100, (value) => value !== '*' && validId(value)),
            surfaces: list(
                params.MASA_READ_SURFACES,
                32,
                (value) => value !== 'all' && /^[a-z][a-z0-9-]{1,30}$/.test(value),
            ).sort(),
            studioOrigins: list(params.MASA_STUDIO_ORIGINS, 8, (value) => Boolean(origin(value, true))),
            imsOrigin: imsOrigin(params.MASA_IMS_ENVIRONMENT),
            imsClientId: params.MASA_IMS_CLIENT_ID,
            // The gateway admits only IMS service tokens, so it never sees the Studio user's token.
            gateway: {
                imsOrigin: imsOrigin(params.MASA_GATEWAY_IMS_ENVIRONMENT),
                clientId: credential(params.MASA_GATEWAY_CLIENT_ID, /^[A-Za-z0-9_-]{1,200}$/),
                clientSecret: credential(params.MASA_GATEWAY_CLIENT_SECRET, /^[\x21-\x7e]{1,512}$/),
                authCode: credential(params.MASA_GATEWAY_AUTH_CODE, /^[A-Za-z0-9_.-]{1,8192}$/),
                apiKey: credential(params.MASA_GATEWAY_API_KEY, /^[A-Za-z0-9_-]{1,200}$/),
            },
            secrets: [
                params.MASA_API_SERVICE_TOKEN,
                params.MASA_IDENTITY_PRIVATE_KEY_B64,
                pem.toString('utf8'),
                params.MASA_GATEWAY_CLIENT_SECRET,
                params.MASA_GATEWAY_AUTH_CODE,
            ],
        };
    } catch {
        throw invalid();
    }
}
