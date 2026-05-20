const ENDPOINT = '/bulk-publish';

export class BulkPublishError extends Error {
    constructor(message, { status = null, body = null } = {}) {
        super(message);
        this.name = 'BulkPublishError';
        this.status = status;
        this.body = body;
    }
}

export async function publishBulk({ ioBaseUrl, paths, locales = [], token }) {
    if (!Array.isArray(paths) || paths.length === 0) {
        throw new BulkPublishError('paths must be a non-empty array');
    }
    if (!ioBaseUrl) throw new BulkPublishError('ioBaseUrl is required');
    if (!token) throw new BulkPublishError('token is required');

    let response;
    try {
        response = await fetch(`${ioBaseUrl}${ENDPOINT}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paths, locales }),
        });
    } catch (err) {
        throw new BulkPublishError(err.message);
    }

    let body = null;
    try {
        body = await response.json();
    } catch {
        // ignore parse error
    }

    if (!response.ok) {
        const message = (body && (body.error?.body?.error || body.error)) || response.statusText;
        throw new BulkPublishError(message, { status: response.status, body });
    }

    return body;
}
