const assert = require('node:assert/strict');
const { createHash, generateKeyPairSync, verify } = require('node:crypto');
const { createServer } = require('node:http');
// Other suites replace/delete global.fetch in their hooks; keep this local HTTP test independent.
const nativeFetch = globalThis.fetch;

const keys = generateKeyPairSync('ed25519');
const origin = 'https://studio.example.test';
const subject = 'pilot-user@AdobeID';
const timestamp = Date.parse('2026-10-19T12:00:00Z');
const sessionId = 'ses_11111111-1111-4111-8111-111111111111';
const investigationId = 'inv_22222222-2222-4222-8222-222222222222';
const artifactId = 'art_33333333-3333-4333-8333-333333333333';
const transferId = 'trf_44444444-4444-4444-8444-444444444444';
const attachmentId = 'att_55555555-5555-4555-8555-555555555555';
const key = 'request-key-123456789';
const config = {
    MASA_API_ENABLED: 'true',
    MASA_API_BASE_URL: 'https://control.example.test',
    MASA_MEDIA_BASE_URL: 'https://media.example.test',
    MASA_API_SERVICE_TOKEN: 'test-service-token-'.padEnd(64, 'x'),
    MASA_IDENTITY_PRIVATE_KEY_B64: Buffer.from(keys.privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64'),
    MASA_API_ISSUER: 'studio-test',
    MASA_API_AUDIENCE: 'masa-test',
    MASA_PILOT_USERS: subject,
    MASA_READ_SURFACES: 'acom,sandbox',
    MASA_STUDIO_ORIGINS: origin,
    MASA_IMS_ENVIRONMENT: 'prod',
    MASA_IMS_CLIENT_ID: 'mas-studio',
};
const token = (overrides = {}) =>
    [
        'header',
        Buffer.from(
            JSON.stringify({
                type: 'access_token',
                client_id: 'mas-studio',
                user_id: subject,
                sub: 'must-not-be-used',
                ...overrides,
            }),
        ).toString('base64url'),
        'signature',
    ].join('.');
const session = (overrides = {}) => ({
    id: sessionId,
    status: 'active',
    createdAt: new Date(timestamp).toISOString(),
    lastActiveAt: new Date(timestamp).toISOString(),
    expiresAt: new Date(timestamp + 1800000).toISOString(),
    idleExpiresAt: new Date(timestamp + 1800000).toISOString(),
    activeInvestigations: 0,
    workDeadlineAt: null,
    idleTimeoutMs: 1800000,
    ...overrides,
});
const investigation = (overrides = {}) => ({
    id: investigationId,
    status: 'queued',
    session: session(),
    statusUrl: `/v1/investigations/${investigationId}`,
    createdAt: new Date(timestamp).toISOString(),
    startedAt: null,
    finishedAt: null,
    expiresAt: new Date(timestamp + 1800000).toISOString(),
    cancellationPending: false,
    progress: { modelCalls: 0, probeResults: 0, elapsedMs: 0 },
    result: null,
    error: null,
    ...overrides,
});
const transfer = (overrides = {}) => ({
    id: transferId,
    sessionId,
    operation: 'upload',
    status: 'ready',
    method: 'POST',
    path: `/v1/media/transfers/${transferId}`,
    grant: 'g'.repeat(43),
    expiresAt: new Date(timestamp + 120000).toISOString(),
    mimetype: 'image/png',
    bytes: 123,
    sha256: 'a'.repeat(64),
    ...overrides,
});
const json = (value, status = 200, headers = {}) =>
    new Response(JSON.stringify(value), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    });
const input = (operation = 'session.create', values = {}) => ({
    formatVersion: 1,
    operation,
    conversationId: 'conversation-123',
    ...values,
});
const params = (value = input('session.create', { idempotencyKey: key }), overrides = {}) => ({
    ...config,
    __ow_method: 'post',
    __ow_query: '',
    __ow_path: '',
    __ow_headers: { origin, authorization: `Bearer ${token()}`, 'content-type': 'application/json' },
    __ow_body: Buffer.from(JSON.stringify(value)).toString('base64'),
    ...overrides,
});
let createHandler;

function harness({
    backend = () => json({ formatVersion: 1, result: session() }),
    ims = () => json({ valid: true }),
    ...options
} = {}) {
    const calls = [];
    const logs = [];
    const handler = createHandler({
        now: () => timestamp,
        logger: (event) => logs.push(event),
        fetchImpl: async (url, init) => {
            calls.push({ url, init });
            return url.startsWith('https://ims-na1') ? ims(url, init) : backend(url, init);
        },
        ...options,
    });
    return { handler, calls, logs, backendCalls: () => calls.filter(({ url }) => url.startsWith(config.MASA_API_BASE_URL)) };
}

function inspectAssertion(call, method, path, body, idempotencyKey = null) {
    assert.equal(call.url, config.MASA_API_BASE_URL + path);
    assert.equal(call.init.method, method);
    assert.equal(call.init.redirect, 'manual');
    assert.equal(call.init.body ?? '', body);
    assert.equal(call.init.headers['Target-Authorization'], `Bearer ${config.MASA_API_SERVICE_TOKEN}`);
    assert.equal(call.init.headers['Idempotency-Key'] ?? null, idempotencyKey);
    const [header, payload, signature] = call.init.headers['X-Masa-User-Assertion'].split('.');
    assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url')), { alg: 'EdDSA', typ: 'JWT' });
    assert.equal(verify(null, Buffer.from(`${header}.${payload}`), keys.publicKey, Buffer.from(signature, 'base64url')), true);
    const claims = JSON.parse(Buffer.from(payload, 'base64url'));
    assert.deepEqual(
        { ...claims, jti: '<nonce>' },
        {
            iss: 'studio-test',
            aud: 'masa-test',
            sub: subject,
            mas_audience: 'internal-mas',
            conversation_id: 'conversation-123',
            surfaces: ['acom', 'sandbox'],
            iat: timestamp / 1000,
            exp: timestamp / 1000 + 60,
            jti: '<nonce>',
            method,
            path,
            body_sha256: createHash('sha256').update(body).digest('hex'),
            idempotency_key: idempotencyKey,
        },
    );
    assert.match(claims.jti, /^[0-9a-f-]{36}$/);
    return claims;
}

describe('Studio MASA Runtime adapter', function () {
    before(async () => {
        ({ createHandler } = await import('../../src/masa-api/index.js'));
    });

    it('stays disabled without integration credentials and performs no network calls', async () => {
        for (const enabled of [undefined, '', 'false', false, 'TRUE']) {
            const h = harness();
            const response = await h.handler({ MASA_API_ENABLED: enabled });
            assert.equal(response.statusCode, 503);
            assert.equal(response.body.error.code, 'masa-disabled');
            assert.equal(h.calls.length, 0);
        }
    });

    it('fails closed on missing credentials, unsafe endpoints, wildcard admission and wrong signing keys', async () => {
        const wrongKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({
            type: 'pkcs8',
            format: 'pem',
        });
        for (const override of [
            { MASA_API_SERVICE_TOKEN: '' },
            { MASA_API_BASE_URL: 'http://control.example.test' },
            { MASA_MEDIA_BASE_URL: 'https://media.example.test/path' },
            { MASA_STUDIO_ORIGINS: '*' },
            { MASA_PILOT_USERS: '*' },
            { MASA_READ_SURFACES: 'all' },
            { MASA_IMS_ENVIRONMENT: 'unknown' },
            { MASA_IDENTITY_PRIVATE_KEY_B64: Buffer.from(wrongKey).toString('base64') },
        ]) {
            const h = harness();
            const response = await h.handler(params(undefined, override));
            assert.equal(response.body.error.code, 'masa-not-configured');
            assert.equal(h.calls.length, 0);
        }
    });

    it('admits exact configured origins and handles preflight without an IMS request', async () => {
        const h = harness();
        const response = await h.handler(
            params(undefined, {
                __ow_method: 'options',
                __ow_headers: {
                    origin,
                    'access-control-request-method': 'POST',
                    'access-control-request-headers': 'Authorization, Content-Type',
                },
            }),
        );
        assert.equal(response.statusCode, 204);
        assert.equal(response.headers['Access-Control-Allow-Origin'], origin);
        assert.equal(response.headers.Vary, 'Origin');
        assert.equal(h.calls.length, 0);
        for (const headers of [
            { origin: 'https://studio.example.test.evil' },
            { origin: 'null' },
            {},
            { origin, 'access-control-request-method': 'GET' },
            { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'x-masa-user-assertion' },
        ]) {
            assert.equal(
                (await h.handler(params(undefined, { __ow_method: 'options', __ow_headers: headers }))).statusCode,
                403,
            );
        }
        assert.equal((await h.handler(params(undefined, { __ow_method: 'get' }))).statusCode, 405);
    });

    it('parses only bounded raw JSON and rejects attempts to supply backend authority', async () => {
        const h = harness();
        for (const extra of [
            { subject },
            { surfaces: ['all'] },
            { method: 'DELETE' },
            { url: 'https://evil.test' },
            { path: '/v1/search' },
            { MASA_API_ENABLED: 'true' },
            { MASA_API_BASE_URL: 'https://evil.test' },
            { origin: 'https://evil.test' },
        ]) {
            assert.equal((await h.handler(params(input('session.create', { idempotencyKey: key, ...extra })))).statusCode, 400);
        }
        for (const override of [
            { __ow_query: 'MASA_API_BASE_URL=https://evil.test' },
            { __ow_path: '/v1/search' },
            { __ow_body: '{}' },
            { __ow_body: Buffer.from('{broken').toString('base64') },
            { __ow_body: Buffer.from([0xff]).toString('base64') },
        ])
            assert.equal((await h.handler(params(undefined, override))).statusCode, 400);
        assert.equal((await h.handler(params(undefined, { __ow_body: 'a'.repeat(30000) }))).statusCode, 413);
        assert.equal(
            (await h.handler(params(undefined, { __ow_headers: { origin, 'content-type': 'text/plain' } }))).statusCode,
            415,
        );
        assert.equal(h.calls.length, 0);
    });

    it('requires remote IMS validation on every call and signs user_id rather than sub or email', async () => {
        const h = harness();
        await h.handler(params());
        await h.handler(params());
        const imsCalls = h.calls.filter(({ url }) => url.includes('/ims/'));
        assert.equal(imsCalls.length, 2);
        assert.equal(imsCalls[0].url, 'https://ims-na1.adobelogin.com/ims/validate_token/v1');
        assert.equal(imsCalls[0].init.headers.Authorization, `Bearer ${token()}`);
        assert.equal(imsCalls[0].init.body.get('type'), 'access_token');
        assert.equal(imsCalls[0].init.body.get('client_id'), 'mas-studio');
        const first = inspectAssertion(h.backendCalls()[0], 'POST', '/v1/sessions', '{}', key);
        const second = inspectAssertion(h.backendCalls()[1], 'POST', '/v1/sessions', '{}', key);
        assert.notEqual(first.jti, second.jti);
        assert.equal(
            h.logs.some((line) => line.includes(subject) || line.includes(token())),
            false,
        );
    });

    it('sends the verified Studio IMS token for the iPaaS gateway and the service token for it to move', async () => {
        const h = harness();
        await h.handler(params());
        const { headers } = h.backendCalls()[0].init;
        assert.equal(headers.Authorization, `Bearer ${token()}`);
        assert.equal(headers['Target-Authorization'], `Bearer ${config.MASA_API_SERVICE_TOKEN}`);
    });

    it('rejects remotely invalid, wrong-client, wrong-type, sub-only and unadmitted identities before MASA', async () => {
        for (const claims of [
            { client_id: 'other-client' },
            { type: 'id_token' },
            { user_id: undefined, sub: subject },
            { user_id: 'not-admitted@AdobeID' },
            { user_id: 'has whitespace' },
        ]) {
            const h = harness();
            const response = await h.handler(
                params(undefined, {
                    __ow_headers: {
                        origin,
                        'content-type': 'application/json',
                        authorization: `Bearer ${token(claims)}`,
                    },
                }),
            );
            assert.ok([401, 403].includes(response.statusCode));
            assert.equal(h.backendCalls().length, 0);
        }
        for (const ims of [() => json({ valid: false }), () => json({ valid: true }, 401), () => json({ valid: true }, 503)]) {
            const h = harness({ ims });
            assert.ok([401, 503].includes((await h.handler(params())).statusCode));
            assert.equal(h.backendCalls().length, 0);
        }
        const h = harness();
        assert.equal(
            (await h.handler(params(undefined, { __ow_headers: { origin, 'content-type': 'application/json' } }))).statusCode,
            401,
        );
        assert.equal(h.calls.length, 0);
    });

    const routes = [
        ['session.create', { idempotencyKey: key }, 'POST', '/v1/sessions', '{}', session(), 201],
        ['session.get', { sessionId }, 'GET', `/v1/sessions/${sessionId}`, '', session(), 200],
        ['session.renew', { sessionId }, 'POST', `/v1/sessions/${sessionId}/renew`, '{}', session(), 200],
        ['session.end', { sessionId }, 'POST', `/v1/sessions/${sessionId}/end`, '{}', session({ status: 'ended' }), 200],
        [
            'investigation.submit',
            { sessionId, idempotencyKey: key, question: 'Why is this card blank?', attachmentIds: [attachmentId] },
            'POST',
            '/v1/investigations',
            JSON.stringify({ sessionId, question: 'Why is this card blank?', context: '', attachmentIds: [attachmentId] }),
            investigation(),
            202,
        ],
        [
            'investigation.get',
            { sessionId, investigationId },
            'GET',
            `/v1/investigations/${investigationId}`,
            '',
            investigation(),
            200,
        ],
        [
            'investigation.cancel',
            { sessionId, investigationId },
            'POST',
            `/v1/investigations/${investigationId}/cancel`,
            '{}',
            investigation({ status: 'cancelled' }),
            200,
        ],
        [
            'transfer.upload',
            { sessionId, idempotencyKey: key, mimetype: 'image/png', bytes: 123, sha256: 'a'.repeat(64) },
            'POST',
            `/v1/sessions/${sessionId}/transfers`,
            JSON.stringify({ operation: 'upload', origin, mimetype: 'image/png', bytes: 123, sha256: 'a'.repeat(64) }),
            transfer(),
            201,
        ],
        [
            'transfer.download',
            { sessionId, idempotencyKey: key, investigationId, artifactId },
            'POST',
            `/v1/sessions/${sessionId}/transfers`,
            JSON.stringify({ operation: 'download', origin, investigationId, artifactId }),
            transfer({ operation: 'download', method: 'GET' }),
            201,
        ],
    ];
    for (const [operation, values, method, path, body, result, status] of routes) {
        it(`signs the exact ${operation} contract and preserves its lifecycle response`, async () => {
            const h = harness({ backend: () => json({ formatVersion: 1, result }, status, { 'Retry-After': '3' }) });
            const response = await h.handler(params(input(operation, values)));
            assert.equal(response.statusCode, status, JSON.stringify(response.body));
            assert.equal(response.body.formatVersion, 1);
            assert.match(response.body.requestId, /^[0-9a-f-]{36}$/);
            assert.equal(response.body.result.id, result.id);
            assert.equal(response.body.result.status, result.status);
            assert.equal(response.headers['Retry-After'], '3');
            assert.equal(response.headers['Cache-Control'], 'no-store');
            const calls = h.backendCalls();
            assert.equal(calls.length, operation === 'investigation.cancel' ? 2 : 1);
            inspectAssertion(calls.at(-1), method, path, body, values.idempotencyKey ?? null);
            if (operation === 'investigation.cancel')
                inspectAssertion(calls[0], 'GET', `/v1/investigations/${investigationId}`, '');
            if (operation.startsWith('transfer.')) {
                assert.equal(response.body.result.url, `${config.MASA_MEDIA_BASE_URL}/v1/media/transfers/${transferId}`);
                assert.equal(response.body.result.grant, result.grant);
                assert.equal(Object.hasOwn(response.body.result, 'path'), false);
            }
            assert.equal(Object.hasOwn(response.body.result, 'statusUrl'), false);
        });
    }

    it('bounds questions, attachment references and transfer metadata before authentication', async () => {
        const h = harness();
        const valid = { sessionId, idempotencyKey: key, question: 'Question?' };
        for (const values of [
            { question: ' ' },
            { question: 'x'.repeat(6001) },
            { sessionId: '../other' },
            { attachmentIds: [attachmentId, attachmentId] },
            { attachmentIds: ['https://image.example.test'] },
        ])
            assert.equal((await h.handler(params(input('investigation.submit', { ...valid, ...values })))).statusCode, 400);
        // Within the character caps, but over the backend's UTF-8 byte cap.
        assert.equal(
            (
                await h.handler(
                    params(input('investigation.submit', { ...valid, question: 'é'.repeat(5000), context: 'é'.repeat(4000) })),
                )
            ).statusCode,
            413,
        );
        for (const values of [{ bytes: 5000001 }, { mimetype: 'image/svg+xml' }, { sha256: 'invalid' }]) {
            assert.equal(
                (
                    await h.handler(
                        params(
                            input('transfer.upload', {
                                sessionId,
                                idempotencyKey: key,
                                mimetype: 'image/png',
                                bytes: 123,
                                sha256: 'a'.repeat(64),
                                ...values,
                            }),
                        ),
                    )
                ).statusCode,
                400,
            );
        }
        assert.equal(h.calls.length, 0);
    });

    it('does not cancel a session-less investigation or one belonging to another session', async () => {
        for (const binding of [undefined, session({ id: sessionId.replace('11111111', '99999999') })]) {
            const h = harness({ backend: () => json({ formatVersion: 1, result: investigation({ session: binding }) }) });
            const response = await h.handler(params(input('investigation.cancel', { sessionId, investigationId })));
            assert.equal(response.statusCode, 404);
            assert.equal(h.backendCalls().length, 1);
            assert.equal(h.backendCalls()[0].init.method, 'GET');
        }
    });

    it('retains findings and artifact metadata while removing direct control/download URLs', async () => {
        const result = {
            formatVersion: 1,
            answer: 'Check the offer.',
            evidence: [{ id: 'e1' }],
            lists: [{ items: ['a'] }],
            artifacts: [
                {
                    id: artifactId,
                    sessionId,
                    filename: 'report.json',
                    available: true,
                    bytes: 123,
                    downloadUrl: '/v1/investigations/secret/artifacts/secret',
                    expiresAt: session().expiresAt,
                },
            ],
        };
        const h = harness({
            backend: () => json({ formatVersion: 1, result: investigation({ status: 'completed', result }) }),
        });
        const response = await h.handler(params(input('investigation.get', { sessionId, investigationId })));
        assert.equal(response.statusCode, 200);
        assert.equal(response.body.result.result.answer, result.answer);
        assert.deepEqual(response.body.result.result.lists, result.lists);
        assert.equal(response.body.result.result.artifacts[0].available, true);
        assert.equal(JSON.stringify(response).includes('downloadUrl'), false);
    });

    it('rejects forged transfer destinations, mismatched bindings and echoed credentials', async () => {
        const values = { sessionId, idempotencyKey: key, mimetype: 'image/png', bytes: 123, sha256: 'a'.repeat(64) };
        for (const changes of [
            { path: 'https://evil.test/collect' },
            { path: `/v1/media/transfers/${transferId}?target=evil` },
            { sessionId: 'other' },
            { sha256: 'b'.repeat(64) },
            { grant: 'short' },
            { method: 'GET' },
        ]) {
            const h = harness({ backend: () => json({ formatVersion: 1, result: transfer(changes) }) });
            assert.equal((await h.handler(params(input('transfer.upload', values)))).statusCode, 502);
        }
        for (const secret of [
            config.MASA_API_SERVICE_TOKEN,
            config.MASA_IDENTITY_PRIVATE_KEY_B64,
            keys.privateKey.export({ type: 'pkcs8', format: 'pem' }),
            token(),
        ]) {
            const h = harness({ backend: () => json({ formatVersion: 1, result: session({ leak: secret }) }) });
            const response = await h.handler(params());
            assert.equal(response.statusCode, 502);
            assert.equal(JSON.stringify([response, h.logs]).includes(secret), false);
        }
    });

    it('preserves actionable busy/expiry/conflict status and Retry-After without backend error text', async () => {
        for (const [status, code] of [
            [429, 'request-rate-limit'],
            [429, 'investigation-capacity'],
            [410, 'session-expired'],
            [409, 'idempotency-conflict'],
            [503, 'worker-unavailable'],
            [403, 'caller-not-allowed'],
        ]) {
            const h = harness({
                backend: () =>
                    json({ error: { code, message: config.MASA_API_SERVICE_TOKEN } }, status, { 'Retry-After': '60' }),
            });
            const response = await h.handler(params());
            assert.equal(response.statusCode, status);
            assert.equal(response.body.error.code, code);
            assert.equal(response.headers['Retry-After'], '60');
            assert.equal(JSON.stringify([response, h.logs]).includes(config.MASA_API_SERVICE_TOKEN), false);
            assert.equal(h.backendCalls().length, 1);
        }
    });

    it('does not retry an ambiguous failure and makes a fresh assertion when the caller retries the same key', async () => {
        let attempt = 0;
        const h = harness({
            backend: () => {
                if (++attempt === 1) throw new Error(config.MASA_API_SERVICE_TOKEN);
                return json({ formatVersion: 1, result: session() });
            },
        });
        const failed = await h.handler(params());
        assert.equal(failed.statusCode, 502);
        assert.equal(h.backendCalls().length, 1);
        assert.equal((await h.handler(params())).statusCode, 200);
        const first = inspectAssertion(h.backendCalls()[0], 'POST', '/v1/sessions', '{}', key);
        const second = inspectAssertion(h.backendCalls()[1], 'POST', '/v1/sessions', '{}', key);
        assert.notEqual(first.jti, second.jti);
    });

    it('rejects oversized declared/chunked responses and malformed or redirect responses without following them', async () => {
        for (const backend of [
            () => new Response('{}', { headers: { 'Content-Length': '512001' } }),
            () => new Response('x'.repeat(512001)),
            () => new Response('<html>broken</html>'),
            () => json({}, 302, { Location: 'https://evil.test' }),
            () => json({ formatVersion: 2, result: session() }),
        ]) {
            const h = harness({ backend });
            assert.equal((await h.handler(params())).statusCode, 502);
            assert.equal(h.backendCalls().length, 1);
        }
    });

    it('includes the Runtime wrapper in the response limit and never truncates findings to fit', async () => {
        const value = {
            formatVersion: 1,
            result: investigation({ status: 'completed', result: { answer: '', artifacts: [] } }),
        };
        value.result.result.answer = 'x'.repeat(512000 - Buffer.byteLength(JSON.stringify(value)));
        const h = harness({ backend: () => json(value) });
        const response = await h.handler(params(input('investigation.get', { sessionId, investigationId })));
        assert.equal(response.statusCode, 502);
        assert.equal(response.body.error.code, 'masa-response-too-large');
        assert.equal(Object.hasOwn(response.body, 'result'), false);
    });

    it('keeps the deadline active while reading a stalled upstream response body', async function () {
        this.timeout(5000);
        const server = createServer((request, response) => {
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.write('{"formatVersion":1,');
        });
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        try {
            const h = harness({
                requestMs: 100,
                backend: (url, init) => nativeFetch(`http://127.0.0.1:${server.address().port}`, init),
            });
            const response = await h.handler(params());
            assert.equal(response.statusCode, 504);
            assert.equal(response.body.error.code, 'masa-timeout');
            assert.equal(h.backendCalls().length, 1);
        } finally {
            server.closeAllConnections();
            await new Promise((resolve) => server.close(resolve));
        }
    });
});
