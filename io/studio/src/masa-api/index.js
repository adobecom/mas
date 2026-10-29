import { randomUUID } from 'node:crypto';
import { AdapterError, LIMITS, parseRequest, projectResult, resolveOperation } from './contract.js';
import { loadConfig } from './config.js';
import { verifyIdentity } from './identity.js';
import { callMasa } from './client.js';

/** Build the Runtime boundary with injectable transport/clock for deterministic contract tests. */
export function createHandler({
    fetchImpl = (...args) => fetch(...args),
    now = Date.now,
    logger = console.info,
    requestMs = LIMITS.requestMs,
} = {}) {
    return async (params) => {
        const requestId = randomUUID();
        const started = now();
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        };
        let status = 500;
        let operationName = null;
        try {
            const config = loadConfig(params);
            if (!config) throw new AdapterError(503, 'masa-disabled', 'Studio MASA integration is not enabled.');
            const requestHeaders = params.__ow_headers ?? {};
            const origin = requestHeaders.origin;
            if (!config.studioOrigins.includes(origin))
                throw new AdapterError(403, 'studio-origin-denied', 'This Studio origin is not admitted.');
            headers['Access-Control-Allow-Origin'] = origin;
            headers.Vary = 'Origin';
            headers['Access-Control-Expose-Headers'] = 'Retry-After';
            if (params.__ow_method === 'options') {
                const requested = (requestHeaders['access-control-request-headers'] ?? '')
                    .toLowerCase()
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
                if (
                    requestHeaders['access-control-request-method'] !== 'POST' ||
                    requested.some((name) => !['authorization', 'content-type'].includes(name))
                ) {
                    throw new AdapterError(403, 'studio-preflight-denied', 'Unsupported Studio request.');
                }
                status = 204;
                return {
                    statusCode: status,
                    headers: {
                        ...headers,
                        'Access-Control-Allow-Methods': 'POST',
                        'Access-Control-Allow-Headers': 'authorization, content-type',
                        'Access-Control-Max-Age': '60',
                    },
                };
            }
            if (params.__ow_method !== 'post')
                throw new AdapterError(405, 'method-not-allowed', 'Use POST for Studio controls.');
            const operation = resolveOperation(parseRequest(params), origin);
            operationName = operation.input.operation;
            const signal = AbortSignal.timeout(requestMs);
            const identity = await verifyIdentity(requestHeaders, config, fetchImpl, signal);
            const options = { fetchImpl, signal, now };
            // Check the session binding before cancelling: ownership alone could refer to a legacy
            // session-less job or another session in the same conversation.
            if (operationName === 'investigation.cancel') {
                const inspect = {
                    ...operation,
                    path: operation.path.slice(0, -'/cancel'.length),
                    method: 'GET',
                    body: '',
                    key: null,
                };
                projectResult((await callMasa(config, identity, inspect, options)).result, inspect, config);
            }
            const response = await callMasa(config, identity, operation, options);
            const body = { formatVersion: 1, requestId, result: projectResult(response.result, operation, config) };
            if (response.retryAfter) headers['Retry-After'] = String(response.retryAfter);
            if (Buffer.byteLength(JSON.stringify({ statusCode: response.status, headers, body })) > LIMITS.responseBytes) {
                throw new AdapterError(502, 'masa-response-too-large', 'The response exceeds the Studio control limit.');
            }
            status = response.status;
            return { statusCode: status, headers, body };
        } catch (error) {
            const failure =
                error instanceof AdapterError
                    ? error
                    : new AdapterError(500, 'studio-masa-error', 'Studio could not process this MASA request.');
            status = failure.status;
            if (failure.retryAfter) headers['Retry-After'] = String(failure.retryAfter);
            return {
                statusCode: status,
                headers,
                body: { formatVersion: 1, requestId, error: { code: failure.code, message: failure.message } },
            };
        } finally {
            logger(
                JSON.stringify({
                    event: 'studio-masa-request',
                    requestId,
                    operation: operationName,
                    status,
                    durationMs: now() - started,
                }),
            );
        }
    };
}

/** Entry point for the separately enabled, raw-HTTP MASA Runtime action. */
export async function main(params) {
    return createHandler()(params);
}
