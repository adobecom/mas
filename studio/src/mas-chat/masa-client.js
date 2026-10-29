import { getAIChatBaseURL } from './config.js';

/** A recoverable transport/admission failure that the investigation UI can explain and retry. */
export class MasaClientError extends Error {
    constructor(code, message, status = 0, retryAfter = 0) {
        super(message);
        this.code = code;
        this.status = status;
        this.retryAfter = retryAfter;
    }
}

/** Compute the gateway's exact-byte binding before transferring any image. */
export async function mediaDigest(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function accessToken() {
    const token = window.adobeIMS.getAccessToken()?.token;
    if (!token) throw new MasaClientError('invalid-studio-identity', 'Sign in again to use investigations.', 401);
    return token;
}

async function readBytes(response, limit) {
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > limit) {
                await reader.cancel();
                throw new MasaClientError('response-too-large', 'The response is too large to display.');
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }
    return new Blob(chunks).arrayBuffer();
}

/** JSON controls and direct binary transfers; credentials are read afresh and never retained. */
export class MasaClient {
    constructor({
        url = `${getAIChatBaseURL()}/masa-api.http`,
        mediaOrigin = document.querySelector('meta[name="masa-media-origin"]')?.content ?? '',
        fetchImpl = window.fetch.bind(window),
        getToken = accessToken,
    } = {}) {
        this.url = url;
        this.mediaOrigin = mediaOrigin;
        this.fetch = fetchImpl;
        this.getToken = getToken;
    }

    async request(url, init, { binary = false, signal } = {}) {
        try {
            const response = await this.fetch(url, {
                ...init,
                headers: { ...init.headers, Authorization: `Bearer ${this.getToken()}` },
                signal: AbortSignal.any([AbortSignal.timeout(50000), ...(signal ? [signal] : [])]),
                credentials: 'omit',
                redirect: 'error',
                cache: 'no-store',
                referrerPolicy: 'no-referrer',
            });
            const bytes = await readBytes(response, binary && response.ok ? 5000000 : 512000);
            if (binary && response.ok) return bytes;
            const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
            const retryAfter = Math.min(3600, Math.max(0, Number(response.headers.get('Retry-After')) || 0));
            if (!response.ok) throw new MasaClientError(body.error.code, body.error.message, response.status, retryAfter);
            if (body.formatVersion !== 1)
                throw new MasaClientError('invalid-response', 'MASA returned an unsupported response.');
            return { result: body.result, retryAfter };
        } catch (error) {
            if (error instanceof MasaClientError || signal?.aborted) throw error;
            if (['TypeError', 'SyntaxError', 'TimeoutError', 'AbortError'].includes(error.name)) {
                throw new MasaClientError(
                    'connection-unavailable',
                    'Connection interrupted. Retry the same request to check whether it was accepted.',
                    0,
                    5,
                );
            }
            throw error;
        }
    }

    control(conversationId, operation, fields = {}, signal) {
        return this.request(
            this.url,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formatVersion: 1, operation, conversationId, ...fields }),
            },
            { signal },
        );
    }

    transferUrl(descriptor) {
        let url;
        try {
            url = new URL(descriptor.url);
        } catch (error) {
            if (!(error instanceof TypeError)) throw error;
            throw new MasaClientError('invalid-transfer', 'The file transfer destination is unavailable.');
        }
        if (
            url.origin !== this.mediaOrigin ||
            url.protocol !== 'https:' ||
            url.username ||
            url.password ||
            url.search ||
            url.hash ||
            url.pathname !== `/v1/media/transfers/${descriptor.id}`
        ) {
            throw new MasaClientError('invalid-transfer', 'The file transfer destination is unavailable.');
        }
        return url.href;
    }

    async upload(conversationId, sessionId, intent) {
        if (!intent.descriptor) {
            intent.sha256 = await mediaDigest(await intent.file.arrayBuffer());
            intent.descriptor = (
                await this.control(conversationId, 'transfer.upload', {
                    sessionId,
                    idempotencyKey: intent.key,
                    mimetype: intent.file.type,
                    bytes: intent.file.size,
                    sha256: intent.sha256,
                })
            ).result;
        }
        const descriptor = intent.descriptor;
        if (
            descriptor.method !== 'POST' ||
            descriptor.operation !== 'upload' ||
            descriptor.sessionId !== sessionId ||
            descriptor.bytes !== intent.file.size ||
            descriptor.sha256 !== intent.sha256 ||
            descriptor.mimetype !== intent.file.type
        ) {
            throw new MasaClientError('invalid-transfer', 'The image transfer does not match this request.');
        }
        return (
            await this.request(this.transferUrl(descriptor), {
                method: 'POST',
                body: intent.file,
                headers: { 'Content-Type': intent.file.type, 'X-Masa-Transfer-Grant': descriptor.grant },
            })
        ).result;
    }

    async download(conversationId, sessionId, investigationId, artifact) {
        const descriptor = (
            await this.control(conversationId, 'transfer.download', {
                sessionId,
                investigationId,
                artifactId: artifact.id,
                idempotencyKey: crypto.randomUUID(),
            })
        ).result;
        if (descriptor.method !== 'GET' || descriptor.operation !== 'download' || descriptor.sessionId !== sessionId) {
            throw new MasaClientError('invalid-transfer', 'The download does not belong to this session.');
        }
        const bytes = await this.request(
            this.transferUrl(descriptor),
            { method: 'GET', headers: { 'X-Masa-Transfer-Grant': descriptor.grant } },
            { binary: true },
        );
        if (
            bytes.byteLength !== artifact.bytes ||
            (await mediaDigest(bytes)) !== artifact.sha256 ||
            !['image/png', 'text/csv'].includes(artifact.mimetype)
        ) {
            throw new MasaClientError('invalid-transfer', 'The downloaded file failed its integrity check. Request it again.');
        }
        return new Blob([bytes], { type: artifact.mimetype });
    }
}
