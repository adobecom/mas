const { getFragmentWithEtag, getValue, getValues, putToOdin, parseOdinHttpStatus } = require('../common.js');

const PROJECT_STATUS = {
    DRAFT: 'Draft',
    PUBLISHING: 'Publishing',
    PUBLISHED: 'Published',
    REVERTING: 'Reverting',
    REVERTED: 'Reverted',
};

async function readProjectFragment(odinEndpoint, projectId, authToken) {
    return getFragmentWithEtag(odinEndpoint, projectId, authToken);
}

async function updateProjectFragment(odinEndpoint, projectId, authToken, fieldUpdates, maxRetries = 2) {
    let lastError;
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
        } catch (err) {
            lastError = err;
            const status = String(parseOdinHttpStatus(err));
            if (status !== '412' && status !== '500') throw err;
            if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 500 * attempt));
        }
    }
    throw lastError;
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

module.exports = {
    PROJECT_STATUS,
    readProjectFragment,
    updateProjectFragment,
    getProjectPaths,
    getProjectLocales,
    getProjectTitle,
    getProjectSnapshots,
};
