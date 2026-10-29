import { createHash, randomUUID, sign } from 'node:crypto';
import { AdapterError, invalidResponse, LIMITS } from './contract.js';

const PUBLIC_CODES = new Set([
    'invalid-input',
    'invalid-investigation',
    'invalid-transfer',
    'idempotency-key-required',
    'caller-not-allowed',
    'surface-not-allowed',
    'session-unavailable',
    'session-scope-changed',
    'session-ended',
    'session-expired',
    'session-capacity',
    'investigation-unavailable',
    'investigation-scope-changed',
    'investigation-finished',
    'investigation-rate-limit',
    'investigation-capacity',
    'investigations-unavailable',
    'investigations-disabled',
    'attachment-unavailable',
    'attachment-scope-changed',
    'artifact-unavailable',
    'artifact-capacity',
    'idempotency-conflict',
    'transfer-unavailable',
    'transfer-scope-changed',
    'transfer-expired',
    'transfer-consumed',
    'transfer-capacity',
    'media-gateway-disabled',
    'media-storage-unavailable',
    'service-stopping',
    'service-busy',
    'request-rate-limit',
    'worker-unavailable',
]);
const MESSAGES = {
    400: 'The MASA request was rejected.',
    403: 'This Studio user or source scope is not admitted.',
    404: 'This resource is unavailable.',
    409: 'The request conflicts with retained state. Check its status before retrying.',
    410: 'The session or resource expired. Start a new session or transfer.',
    429: 'MASA is busy. Retry after the indicated delay.',
    503: 'MASA is unavailable. Retry later.',
};

/** Read bounded JSON through the deadline, including the response body, without following redirects. */
export async function requestJson(url, options, fetchImpl, maxBytes) {
    const response = await fetchImpl(url, { ...options, redirect: 'manual' });
    if (Number(response.headers.get('content-length')) > maxBytes) {
        await response.body?.cancel();
        throw new AdapterError(502, 'masa-response-too-large', 'The response exceeds the Studio control limit.');
    }
    const chunks = [];
    let size = 0;
    if (response.body) {
        for await (const chunk of response.body) {
            size += chunk.byteLength;
            if (size > maxBytes)
                throw new AdapterError(502, 'masa-response-too-large', 'The response exceeds the Studio control limit.');
            chunks.push(chunk);
        }
    }
    options.signal.throwIfAborted();
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
    return { status: response.status, headers: response.headers, raw, body: JSON.parse(raw) };
}

/**
 * Sign the exact route/body/key with fresh replay protection for every attempt. The iPaaS gateway
 * validates the Studio IMS token, then moves Target-Authorization into MASA's Authorization header.
 */
export function signedHeaders(config, identity, operation, now) {
    const iat = Math.floor(now / 1000);
    const claims = {
        iss: config.issuer,
        aud: config.audience,
        sub: identity.subject,
        mas_audience: 'internal-mas',
        conversation_id: operation.input.conversationId,
        surfaces: config.surfaces,
        iat,
        exp: iat + 60,
        jti: randomUUID(),
        method: operation.method,
        path: operation.path,
        body_sha256: createHash('sha256').update(operation.body).digest('hex'),
        idempotency_key: operation.key,
    };
    const encoded = [{ alg: 'EdDSA', typ: 'JWT' }, claims]
        .map((item) => Buffer.from(JSON.stringify(item)).toString('base64url'))
        .join('.');
    return {
        Authorization: `Bearer ${identity.token}`,
        'Target-Authorization': `Bearer ${config.serviceToken}`,
        'X-Masa-User-Assertion': `${encoded}.${sign(null, Buffer.from(encoded), config.privateKey).toString('base64url')}`,
        Accept: 'application/json',
        ...(operation.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        ...(operation.key ? { 'Idempotency-Key': operation.key } : {}),
    };
}

/** One bounded attempt: callers retain the key on ambiguous failure; the adapter never resubmits work automatically. */
export async function callMasa(config, identity, operation, { fetchImpl, signal, now }) {
    let response;
    try {
        response = await requestJson(
            config.apiOrigin + operation.path,
            {
                method: operation.method,
                headers: signedHeaders(config, identity, operation, now()),
                signal,
                ...(operation.method === 'POST' ? { body: operation.body } : {}),
            },
            fetchImpl,
            LIMITS.responseBytes,
        );
    } catch (error) {
        if (signal.aborted)
            throw new AdapterError(504, 'masa-timeout', 'MASA did not respond in time. Retry with the same idempotency key.');
        if (error instanceof AdapterError) throw error;
        throw new AdapterError(502, 'masa-unavailable', 'MASA could not be reached. Retry with the same idempotency key.');
    }
    const retry = response.headers.get('retry-after');
    const retryAfter = /^\d{1,4}$/.test(retry ?? '') ? Math.min(3600, Math.max(1, Number(retry))) : null;
    if (response.status >= 300 || response.status < 200) {
        const code = response.body?.error?.code;
        if (PUBLIC_CODES.has(code) && MESSAGES[response.status])
            throw new AdapterError(response.status, code, MESSAGES[response.status], retryAfter);
        throw new AdapterError(502, 'masa-unavailable', 'MASA rejected the backend request.', retryAfter);
    }
    if (
        ![200, 201, 202].includes(response.status) ||
        response.body?.formatVersion !== 1 ||
        !response.body.result ||
        [...config.secrets, identity.token].some((secret) =>
            JSON.stringify(response.body).includes(JSON.stringify(secret).slice(1, -1)),
        )
    )
        throw invalidResponse();
    return { status: response.status, result: response.body.result, retryAfter };
}
