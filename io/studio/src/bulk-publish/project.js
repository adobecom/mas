const { getFragmentWithEtag, getValue, getValues, putToOdin } = require('../common.js');

// Contract: these strings must match BULK_PUBLISH_STATUS in studio/src/constants.js (UI side).
// LOCKED is deliberately absent: it is a client-side concurrency lock, never written by IO.
const PROJECT_STATUS = {
    DRAFT: 'Draft',
    PUBLISHING: 'Publishing',
    PUBLISHED: 'Published',
    PARTIALLY_PUBLISHED: 'Partially published',
    FAILED: 'Failed',
    REVERTING: 'Reverting',
    REVERTED: 'Reverted',
};

async function readProjectFragment(odinEndpoint, projectId, authToken) {
    return getFragmentWithEtag(odinEndpoint, projectId, authToken);
}

async function updateProjectFragment(odinEndpoint, projectId, authToken, fieldUpdates, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const { fragment, etag } = await getFragmentWithEtag(odinEndpoint, projectId, authToken);
        const fields = fragment.fields.map((field) => {
            if (field.name in fieldUpdates) {
                const v = fieldUpdates[field.name];
                return { ...field, values: Array.isArray(v) ? v : [v] };
            }
            return field;
        });
        for (const [name, v] of Object.entries(fieldUpdates)) {
            if (!fields.find((f) => f.name === name)) {
                fields.push({ name, values: Array.isArray(v) ? v : [v] });
            }
        }
        try {
            await putToOdin(odinEndpoint, projectId, authToken, {
                title: fragment.title ?? '',
                description: fragment.description ?? '',
                fields,
                etag,
            });
            return;
        } catch (error) {
            const conflict = /status 412/.test(error?.message || '');
            if (!conflict || attempt === maxRetries) throw error;
        }
    }
}

function getProjectPaths(fragment) {
    const paths = getValues(fragment, 'fragments')?.values ?? [];
    if (paths.length) return paths;
    // Legacy fallback: older projects stored items as a serialized JSON array in the 'items' field
    const raw = getValue(fragment, 'items')?.value;
    if (!raw) return [];
    try {
        const items = JSON.parse(raw);
        return items.filter((i) => i.status === 'valid' && i.path).map((i) => i.path);
    } catch {
        return [];
    }
}

function getProjectLocales(fragment) {
    return getValues(fragment, 'locales')?.values ?? [];
}

function getProjectTitle(fragment) {
    return getValue(fragment, 'title')?.value ?? '';
}

function getProjectSnapshots(fragment) {
    return getValues(fragment, 'snapshots')?.values ?? [];
}

// The publishComplete:false marker is what lets an interrupted publish resume against its original
// snapshot instead of re-snapshotting already-modified fragments.
function hasPendingSnapshot(entries) {
    if (!entries.length) return false;
    try {
        return entries.some((e) => JSON.parse(e).publishComplete === false);
    } catch {
        return false;
    }
}

function addPendingMarker(entries) {
    return entries.map((e) => JSON.stringify({ ...JSON.parse(e), publishComplete: false }));
}

function removePendingMarker(entries) {
    return entries.map((e) => {
        const { publishComplete, ...rest } = JSON.parse(e);
        return JSON.stringify(rest);
    });
}

module.exports = {
    PROJECT_STATUS,
    readProjectFragment,
    updateProjectFragment,
    getProjectPaths,
    getProjectLocales,
    getProjectTitle,
    getProjectSnapshots,
    hasPendingSnapshot,
    addPendingMarker,
    removePendingMarker,
};
