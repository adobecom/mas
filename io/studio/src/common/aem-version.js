const { fetchOdin } = require('../common.js');

function strictVersionId(location, endpoint, fragmentId) {
    let url;
    let versionId;
    const prefix = `/adobe/sites/cf/fragments/${fragmentId}/versions/`;
    try {
        if (!location) throw new Error('Missing Location');
        url = new URL(location, endpoint);
        versionId = decodeURIComponent(url.pathname.slice(prefix.length));
        if (
            url.origin !== endpoint ||
            !url.pathname.startsWith(prefix) ||
            url.search ||
            url.hash ||
            url.username ||
            url.password ||
            !versionId.length ||
            versionId.length > 200 ||
            ['.', '..'].includes(versionId) ||
            /[/\\?#\0]/.test(versionId)
        ) {
            throw new Error('Invalid Location');
        }
    } catch {
        throw Object.assign(new Error('AEM returned an invalid version location'), { statusCode: 502 });
    }
    return versionId;
}

async function createVersion(
    odinEndpoint,
    fragmentId,
    label,
    comment,
    authToken,
    { request = fetchOdin, strictLocation = false } = {},
) {
    const response = await request(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}/versions`, authToken, {
        method: 'POST',
        contentType: 'application/json',
        body: JSON.stringify({ label, comment }),
    });
    const location = response.headers.get('Location') ?? '';
    return strictLocation ? strictVersionId(location, odinEndpoint, fragmentId) : location.split('/').pop();
}

async function restoreVersion(odinEndpoint, fragmentId, versionId, authToken, { request = fetchOdin } = {}) {
    await request(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}/versions/restore/${versionId}`, authToken, {
        method: 'POST',
    });
}

async function fetchVersionHistory(odinEndpoint, fragmentId, authToken, { request = fetchOdin } = {}) {
    const response = await request(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}/versions`, authToken, {
        ignoreErrors: [404],
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data?.items ?? [];
}

module.exports = { createVersion, restoreVersion, fetchVersionHistory };
