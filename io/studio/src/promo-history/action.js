const { execute } = require('./service.js');

const REQUEST_FIELDS = [
    'projectId',
    'action',
    'targetId',
    'completionEtag',
    'beforeVersionId',
    'requestId',
    'query',
    'cursor',
    'limit',
    'eventId',
    'selections',
    'expected',
];

async function handle(operation, params) {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    try {
        let body = params;
        if (params.__ow_body !== undefined) {
            try {
                const raw = params.__ow_body;
                if (typeof raw === 'string' && raw.length > 200000) throw new Error('Oversized body');
                body =
                    typeof raw === 'string'
                        ? JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString())
                        : raw;
                if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
            } catch {
                return { statusCode: 400, headers, body: { error: 'Invalid JSON request body' } };
            }
        }
        const request = Object.fromEntries(
            REQUEST_FIELDS.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]),
        );
        const result = await execute(operation, {
            ...request,
            odinEndpoint: params.odinEndpoint,
            __ow_headers: params.__ow_headers,
            __ow_method: params.__ow_method,
        });
        return { statusCode: 200, headers, body: result };
    } catch (error) {
        return {
            statusCode: error.statusCode ?? 500,
            headers,
            body: {
                error: error.statusCode ? error.message : 'Version service unavailable',
                ...(error.result ? error.result : {}),
            },
        };
    }
}

module.exports = { handle };
