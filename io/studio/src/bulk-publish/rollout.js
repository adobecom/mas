const { postToOdinWithRetry, fetchFragmentByPath } = require('../common.js');

const LOCALE_SYNC_URI = '/bin/localeSync';

async function rolloutLocales({ odinEndpoint, authToken, items, maxRetries = 3 }) {
    const payload = {
        items: items.map(({ contentPath, targetLocales }) => ({
            contentPath,
            targetLocales,
            syncNestedCFs: false,
        })),
    };
    try {
        await postToOdinWithRetry(odinEndpoint, LOCALE_SYNC_URI, authToken, payload, maxRetries);
        return true;
    } catch {
        return false;
    }
}

async function waitForFragments({ odinEndpoint, authToken, paths, maxAttempts = 10 }) {
    let remaining = [...paths];
    const ready = [];
    for (let attempt = 1; attempt <= maxAttempts && remaining.length > 0; attempt++) {
        const stillMissing = [];
        for (const path of remaining) {
            const { status } = await fetchFragmentByPath(odinEndpoint, path, authToken);
            if (status === 200) ready.push(path);
            else stillMissing.push(path);
        }
        remaining = stillMissing;
        if (remaining.length > 0 && attempt < maxAttempts) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    return { ready, pending: remaining };
}

module.exports = { rolloutLocales, waitForFragments, LOCALE_SYNC_URI };
