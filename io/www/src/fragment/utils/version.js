/**
 * Create a new version of a fragment
 * @param {Object} config - Configuration object
 * @param {string} config.fragmentId - Fragment ID
 * @param {string} config.bucket - AEM bucket (e.g., 'e59433')
 * @param {string} config.authToken - Bearer authentication token
 * @param {Object} [config.versionData] - Version data
 * @param {string} [config.versionData.label] - Version label
 * @param {string} [config.versionData.comment] - Version comment
 * @returns {Promise<Object>} Created version response
 */
async function createFragmentVersion({ fragmentId, bucket, authToken, versionData = {} }) {
    if (!fragmentId) {
        throw new Error('Fragment ID is required');
    }
    if (!bucket) {
        throw new Error('bucket is required');
    }
    if (!authToken) {
        throw new Error('authToken is required');
    }

    const url = `https://${bucket}.adobeaemcloud.com/adobe/sites/cf/fragments/${fragmentId}/versions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(versionData),
    }).catch((err) => {
        throw new Error(`Network error: ${err.message}`);
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to create fragment version: ${response.status} ${errorText}`);
    }

    return await response.json();
}

export { createFragmentVersion };
