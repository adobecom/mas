import { AdapterError, LIMITS } from './contract.js';
import { requestJson } from './client.js';

const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const unavailable = () => new AdapterError(503, 'masa-gateway-unavailable', 'The MASA gateway is unavailable. Retry later.', 5);

/** Cache the iPaaS service token IMS issues for the gateway client's permanent authorization code. */
export function createGatewayToken() {
    let cached = null;
    return async (config, fetchImpl, signal, now) => {
        if (cached && now() < cached.expiresAt - REFRESH_MARGIN_MS) return cached.token;
        const { imsOrigin, clientId, clientSecret, authCode } = config.gateway;
        let response;
        try {
            response = await requestJson(
                `${imsOrigin}/ims/token/v3`,
                {
                    method: 'POST',
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        client_id: clientId,
                        client_secret: clientSecret,
                        code: authCode,
                    }),
                    signal: AbortSignal.any([signal, AbortSignal.timeout(LIMITS.imsMs)]),
                },
                fetchImpl,
                LIMITS.imsBytes,
            );
        } catch {
            throw unavailable();
        }
        const { access_token: token, expires_in: expiresIn } = response.body ?? {};
        if (response.status !== 200 || !/^[A-Za-z0-9_.-]{1,8192}$/.test(token ?? '') || !(Number(expiresIn) > 0))
            throw unavailable();
        cached = { token, expiresAt: now() + Number(expiresIn) * 1000 };
        return token;
    };
}
