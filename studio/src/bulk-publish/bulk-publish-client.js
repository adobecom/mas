const ENDPOINT = '/bulk-publish';
const REVERT_ENDPOINT = '/bulk-revert';
const CHECK_MODIFICATIONS_ENDPOINT = '/bulk-check-modifications';
const SAVE_SNAPSHOT_ENDPOINT = '/bulk-save-snapshot';

export class BulkPublishError extends Error {
    constructor(message, { status = null, body = null } = {}) {
        super(message);
        this.name = 'BulkPublishError';
        this.status = status;
        this.body = body;
    }
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

export async function publishBulk({ ioBaseUrl, projectId, publishedBy = '', token }) {
    if (!projectId) throw new BulkPublishError('projectId is required');
    return callAction(ioBaseUrl, ENDPOINT, { projectId, publishedBy }, token);
}

export async function revertAction({ ioBaseUrl, projectId, token }) {
    if (!projectId) throw new BulkPublishError('projectId is required');
    return callAction(ioBaseUrl, REVERT_ENDPOINT, { projectId }, token);
}

export async function checkModificationsAction({ ioBaseUrl, entries, token }) {
    return callAction(ioBaseUrl, CHECK_MODIFICATIONS_ENDPOINT, { entries }, token);
}

export async function saveSnapshotAction({ ioBaseUrl, projectId, token }) {
    if (!projectId) throw new BulkPublishError('projectId is required');
    return callAction(ioBaseUrl, SAVE_SNAPSHOT_ENDPOINT, { projectId }, token);
}
