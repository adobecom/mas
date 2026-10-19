import { AdapterError, LIMITS, validId } from './contract.js';
import { requestJson } from './client.js';

const denied = () => new AdapterError(401, 'invalid-studio-identity', 'A current Studio IMS access token is required.');

/** Match mas-agent's gateway: remote validation, verified client/type/user_id, then explicit internal pilot admission. */
export async function verifyIdentity(headers, config, fetchImpl, signal) {
    const authorization = headers.authorization;
    if (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9_.-]{1,8192}$/.test(authorization)) throw denied();
    const token = authorization.slice(7);
    const form = new FormData();
    form.set('type', 'access_token');
    form.set('client_id', config.imsClientId);
    let response;
    try {
        response = await requestJson(
            `${config.imsOrigin}/ims/validate_token/v1`,
            {
                method: 'POST',
                headers: { Authorization: authorization },
                body: form,
                signal: AbortSignal.any([signal, AbortSignal.timeout(LIMITS.imsMs)]),
            },
            fetchImpl,
            LIMITS.imsBytes,
        );
    } catch {
        throw new AdapterError(503, 'studio-identity-unavailable', 'Studio identity verification is unavailable.', 5);
    }
    if (response.status === 429 || response.status >= 500)
        throw new AdapterError(503, 'studio-identity-unavailable', 'Studio identity verification is unavailable.', 5);
    if (response.status !== 200 || response.body?.valid !== true) throw denied();
    let claims;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw denied();
        claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
        throw denied();
    }
    if (claims?.type !== 'access_token' || claims.client_id !== config.imsClientId || !validId(claims.user_id)) throw denied();
    if (!config.pilotUsers.includes(claims.user_id))
        throw new AdapterError(403, 'caller-not-allowed', 'This Studio user is not admitted to the MASA pilot.');
    return { subject: claims.user_id, token };
}
