const ENDPOINT = '/bulk-publish';
const SNAPSHOT_ENDPOINT = '/bulk-snapshot';
const REVERT_ENDPOINT = '/bulk-revert';
const CHECK_MODIFICATIONS_ENDPOINT = '/bulk-check-modifications';

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

async function callAction(ioBaseUrl, endpoint, payload, token) {
    if (!ioBaseUrl) throw new BulkPublishError('ioBaseUrl is required');
    if (!token) throw new BulkPublishError('token is required');
    let response;
    try {
        response = await fetch(`${ioBaseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
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

export async function createSnapshotAction({ ioBaseUrl, paths, projectId, projectTitle, token }) {
    const { entries } = await callAction(ioBaseUrl, SNAPSHOT_ENDPOINT, { paths, projectId, projectTitle }, token);
    return entries;
}

export async function revertSnapshotAction({ ioBaseUrl, entries, token }) {
    return callAction(ioBaseUrl, REVERT_ENDPOINT, { entries }, token);
}

export async function checkModificationsAction({ ioBaseUrl, entries, token }) {
    return callAction(ioBaseUrl, CHECK_MODIFICATIONS_ENDPOINT, { entries }, token);
}
