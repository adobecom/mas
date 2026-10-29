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

/** Read immutable action inputs, never fields parsed from browser JSON. Empty enablement stays off. */
export function loadConfig(params) {
    if (params.MASA_API_ENABLED !== 'true' && params.MASA_API_ENABLED !== true) return null;
    try {
        if (
            !validId(params.MASA_API_ISSUER) ||
            !validId(params.MASA_API_AUDIENCE) ||
            typeof params.MASA_API_SERVICE_TOKEN !== 'string' ||
            !/^[A-Za-z0-9_-]{43,256}$/.test(params.MASA_API_SERVICE_TOKEN) ||
            !['prod', 'stage'].includes(params.MASA_IMS_ENVIRONMENT) ||
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
            apiOrigin: origin(params.MASA_API_BASE_URL),
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
            imsOrigin:
                params.MASA_IMS_ENVIRONMENT === 'prod'
                    ? 'https://ims-na1.adobelogin.com'
                    : 'https://ims-na1-stg1.adobelogin.com',
            imsClientId: params.MASA_IMS_CLIENT_ID,
            secrets: [params.MASA_API_SERVICE_TOKEN, params.MASA_IDENTITY_PRIVATE_KEY_B64, pem.toString('utf8')],
        };
    } catch {
        throw invalid();
    }
}
