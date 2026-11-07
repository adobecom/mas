/** Runtime controls are deliberately smaller than the platform's 1-MB wire limit. */
export const LIMITS = Object.freeze({
    inputBytes: 20_480,
    apiBodyBytes: 16_384,
    responseBytes: 512_000,
    imsBytes: 16_384,
    requestMs: 45_000,
    imsMs: 5000,
});
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const RESOURCE = (prefix) => new RegExp(`^${prefix}_${UUID}$`);
const ID = /^[^\s\x00-\x1f\x7f]{1,200}$/;
const KEY = /^[A-Za-z0-9_-]{16,128}$/;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/** A public failure with fixed text; raw transport/configuration errors never reach callers. */
export class AdapterError extends Error {
    constructor(status, code, message, retryAfter = null) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryAfter = retryAfter;
    }
}

const invalid = () => new AdapterError(400, 'invalid-request', 'Provide a supported Studio MASA control request.');
/** Reject an invalid trusted-backend envelope without echoing it. */
export const invalidResponse = () => new AdapterError(502, 'masa-invalid-response', 'MASA returned an invalid response.');
/** Validate a stable identifier without accepting an email-derived or browser-provided identity. */
export const validId = (value) => typeof value === 'string' && ID.test(value);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const resource = (value, prefix) => typeof value === 'string' && RESOURCE(prefix).test(value);
const text = (value, max, required = false) =>
    typeof value === 'string' && value.length <= max && (!required || /\S/.test(value));
const pick = (value, keys) =>
    Object.fromEntries(keys.filter((key) => Object.hasOwn(value, key)).map((key) => [key, value[key]]));

/** Parse only raw JSON body data; never merge browser fields into final Runtime action inputs. */
export function parseRequest(params) {
    const headers = params.__ow_headers ?? {};
    if (params.__ow_query || (params.__ow_path && params.__ow_path !== '/')) throw invalid();
    if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(headers['content-type'] ?? '') || headers['content-encoding']) {
        throw new AdapterError(415, 'unsupported-media-type', 'Send uncompressed application/json controls.');
    }
    const encoded = params.__ow_body;
    if (typeof encoded !== 'string') throw invalid();
    if (encoded.length > Math.ceil(LIMITS.inputBytes / 3) * 4)
        throw new AdapterError(413, 'request-too-large', 'The control request is too large.');
    try {
        const bytes = Buffer.from(encoded, 'base64');
        if (bytes.toString('base64') !== encoded) throw invalid();
        if (bytes.length > LIMITS.inputBytes)
            throw new AdapterError(413, 'request-too-large', 'The control request is too large.');
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch (error) {
        if (error instanceof AdapterError) throw error;
        throw invalid();
    }
}

/** Map a closed set of operations to signed routes; callers cannot provide URLs, methods or claims. */
export function resolveOperation(input, origin) {
    if (!object(input) || input.formatVersion !== 1 || !validId(input.conversationId)) throw invalid();
    const common = ['formatVersion', 'operation', 'conversationId'];
    let fields;
    let path;
    let method = 'POST';
    let body = {};
    let key = null;
    let kind;
    switch (input.operation) {
        case 'session.create':
            fields = ['idempotencyKey'];
            path = '/v1/sessions';
            key = input.idempotencyKey;
            kind = 'session';
            break;
        case 'session.get':
        case 'session.renew':
        case 'session.end':
            fields = ['sessionId'];
            kind = 'session';
            path = `/v1/sessions/${input.sessionId}`;
            if (input.operation === 'session.get') {
                method = 'GET';
                body = null;
            } else path += `/${input.operation.split('.')[1]}`;
            break;
        case 'investigation.submit':
            fields = ['sessionId', 'idempotencyKey', 'question', 'context', 'attachmentIds'];
            kind = 'investigation';
            path = '/v1/investigations';
            key = input.idempotencyKey;
            if (!text(input.question, 6000, true) || (input.context !== undefined && !text(input.context, 6000)))
                throw invalid();
            if (
                input.attachmentIds !== undefined &&
                (!Array.isArray(input.attachmentIds) ||
                    input.attachmentIds.length > 3 ||
                    new Set(input.attachmentIds).size !== input.attachmentIds.length ||
                    input.attachmentIds.some((id) => !resource(id, 'att')))
            )
                throw invalid();
            body = {
                sessionId: input.sessionId,
                question: input.question,
                context: input.context ?? '',
                attachmentIds: input.attachmentIds ?? [],
            };
            break;
        case 'investigation.get':
        case 'investigation.cancel':
            fields = ['sessionId', 'investigationId'];
            kind = 'investigation';
            path = `/v1/investigations/${input.investigationId}`;
            if (input.operation === 'investigation.get') {
                method = 'GET';
                body = null;
            } else path += '/cancel';
            break;
        case 'transfer.upload':
            fields = ['sessionId', 'idempotencyKey', 'mimetype', 'bytes', 'sha256'];
            kind = 'transfer';
            key = input.idempotencyKey;
            path = `/v1/sessions/${input.sessionId}/transfers`;
            if (
                !IMAGE_TYPES.includes(input.mimetype) ||
                !Number.isSafeInteger(input.bytes) ||
                input.bytes < 1 ||
                input.bytes > 5_000_000 ||
                typeof input.sha256 !== 'string' ||
                !/^[0-9a-f]{64}$/.test(input.sha256)
            )
                throw invalid();
            body = { operation: 'upload', origin, mimetype: input.mimetype, bytes: input.bytes, sha256: input.sha256 };
            break;
        case 'transfer.download':
            fields = ['sessionId', 'idempotencyKey', 'investigationId', 'artifactId'];
            kind = 'transfer';
            key = input.idempotencyKey;
            path = `/v1/sessions/${input.sessionId}/transfers`;
            body = { operation: 'download', origin, investigationId: input.investigationId, artifactId: input.artifactId };
            break;
        default:
            throw invalid();
    }
    if (Object.keys(input).some((name) => !common.includes(name) && !fields.includes(name))) throw invalid();
    for (const [field, prefix] of [
        ['sessionId', 'ses'],
        ['investigationId', 'inv'],
        ['artifactId', 'art'],
    ]) {
        if (fields.includes(field) && !resource(input[field], prefix)) throw invalid();
    }
    if (fields.includes('idempotencyKey') && (typeof key !== 'string' || !KEY.test(key))) throw invalid();
    const encoded = body === null ? '' : JSON.stringify(body);
    if (Buffer.byteLength(encoded) > LIMITS.apiBodyBytes)
        throw new AdapterError(413, 'request-too-large', 'The control request is too large.');
    return { kind, method, path, body: encoded, key, input };
}

function sessionResult(value, expectedId) {
    if (
        !object(value) ||
        !resource(value.id, 'ses') ||
        (expectedId && value.id !== expectedId) ||
        !['active', 'ended', 'expired'].includes(value.status) ||
        !Number.isFinite(Date.parse(value.expiresAt))
    )
        throw invalidResponse();
    return pick(value, [
        'id',
        'status',
        'createdAt',
        'lastActiveAt',
        'expiresAt',
        'idleExpiresAt',
        'activeInvestigations',
        'workDeadlineAt',
        'idleTimeoutMs',
    ]);
}

/** Preserve MASA findings and lifecycle data while returning only supported control metadata. */
export function projectResult(result, operation, config) {
    if (!object(result)) throw invalidResponse();
    const { input, kind } = operation;
    if (kind === 'session') return sessionResult(result, input.sessionId);
    if (kind === 'transfer') {
        const upload = input.operation === 'transfer.upload';
        if (
            !resource(result.id, 'trf') ||
            result.sessionId !== input.sessionId ||
            result.operation !== (upload ? 'upload' : 'download') ||
            result.method !== (upload ? 'POST' : 'GET') ||
            result.path !== `/v1/media/transfers/${result.id}` ||
            typeof result.grant !== 'string' ||
            !/^[A-Za-z0-9_-]{43}$/.test(result.grant) ||
            !Number.isFinite(Date.parse(result.expiresAt)) ||
            !['ready', 'uploaded', 'uploading', 'used', 'failed', 'interrupted'].includes(result.status)
        )
            throw invalidResponse();
        if (upload && (result.bytes !== input.bytes || result.mimetype !== input.mimetype || result.sha256 !== input.sha256))
            throw invalidResponse();
        return {
            ...pick(result, [
                'id',
                'sessionId',
                'operation',
                'status',
                'method',
                'grant',
                'expiresAt',
                ...(upload ? ['mimetype', 'bytes', 'sha256'] : []),
            ]),
            url: config.mediaOrigin + result.path,
        };
    }
    if (
        !resource(result.id, 'inv') ||
        (input.investigationId && input.investigationId !== result.id) ||
        !['queued', 'running', 'completed', 'failed', 'cancelled', 'interrupted'].includes(result.status)
    )
        throw invalidResponse();
    // Session-less jobs and another live session in the same conversation cannot enter this adapter.
    if (result.session?.id !== input.sessionId)
        throw new AdapterError(404, 'investigation-unavailable', 'This investigation is unavailable in this session.');
    const session = sessionResult(result.session, input.sessionId);
    let finding = null;
    if (result.result !== null) {
        if (!object(result.result) || !Array.isArray(result.result.artifacts)) throw invalidResponse();
        finding = pick(result.result, [
            'formatVersion',
            'jobId',
            'kind',
            'answer',
            'withheld',
            'evidence',
            'lists',
            'knowledgeRevision',
            'servedModels',
            'usage',
            'wallMs',
            'budgetExhausted',
            'budgetExhaustedBy',
            'limitations',
            'sourceRevisions',
        ]);
        finding.artifacts = result.result.artifacts.map((artifact) => {
            if (!object(artifact) || !resource(artifact.id, 'art') || artifact.sessionId !== session.id)
                throw invalidResponse();
            return pick(artifact, [
                'id',
                'kind',
                'evidenceId',
                'filename',
                'title',
                'mimetype',
                'bytes',
                'sha256',
                'sessionId',
                'available',
                'expiresAt',
            ]);
        });
    }
    return {
        ...pick(result, [
            'id',
            'status',
            'createdAt',
            'startedAt',
            'finishedAt',
            'expiresAt',
            'cancellationPending',
            'progress',
            'error',
        ]),
        session,
        result: finding,
    };
}
