const { Core } = require('@adobe/aio-sdk');
const { fetchOdin, processBatchWithConcurrency } = require('../common.js');

const logger = Core.Logger('bulk-snapshot', { level: 'info' });
const FRAGMENT_CONCURRENCY = 5;
const STATUS_PUBLISHED = 'PUBLISHED';
const STATUS_MODIFIED = 'MODIFIED';

async function getFragmentByPath(odinEndpoint, fragmentPath, authToken) {
    const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments?path=${fragmentPath}`, authToken, {
        ignoreErrors: [404],
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.items?.[0] ?? null;
}

async function getFragmentById(odinEndpoint, fragmentId, authToken) {
    const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}`, authToken, {
        ignoreErrors: [404],
    });
    if (response.status === 404) throw new Error(`404 Not Found: fragment ${fragmentId}`);
    if (!response.ok) throw new Error(`Failed to get fragment: ${response.status} ${response.statusText}`);
    return response.json();
}

async function createVersion(odinEndpoint, fragmentId, label, comment, authToken) {
    const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}/versions`, authToken, {
        method: 'POST',
        contentType: 'application/json',
        body: JSON.stringify({ label, comment }),
    });
    const location = response.headers.get('Location') ?? '';
    return location.split('/').pop();
}

async function restoreVersion(odinEndpoint, fragmentId, versionId, authToken) {
    await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}/versions/restore/${versionId}`, authToken, {
        method: 'POST',
    });
}

async function unpublishFragment(odinEndpoint, fragmentPath, authToken) {
    await fetchOdin(odinEndpoint, '/adobe/sites/cf/fragments/publish', authToken, {
        method: 'POST',
        contentType: 'application/json',
        body: JSON.stringify({
            paths: [fragmentPath],
            workflowModelId: '/var/workflow/models/scheduled_deactivation',
        }),
    });
}

function isTranslationVersion(version) {
    return version.createdBy === 'odin-cf-versioning-user' || (version.comment ?? '').startsWith('Pre-rollout snapshot');
}

async function fetchVersionHistory(odinEndpoint, fragmentId, authToken) {
    const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}/versions`, authToken, {
        ignoreErrors: [404],
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data?.items ?? [];
}

async function findNonTranslationVersion(odinEndpoint, fragmentId, authToken) {
    const versions = await fetchVersionHistory(odinEndpoint, fragmentId, authToken);
    const found = versions.find((v) => !isTranslationVersion(v));
    return found?.id ?? null;
}

function serializeEntries(snapshot) {
    return Object.entries(snapshot.fragments).map(([fragmentId, entry]) =>
        JSON.stringify({
            fragmentId,
            versionId: entry.versionId,
            wasPublished: entry.wasPublished,
            createdAt: snapshot.createdAt,
        }),
    );
}

function deserializeEntries(entries) {
    const parsed = entries.map((e) => JSON.parse(e));
    return {
        createdAt: parsed[0].createdAt,
        fragments: Object.fromEntries(
            parsed.map(({ fragmentId, versionId, wasPublished }) => [fragmentId, { versionId, wasPublished }]),
        ),
    };
}

async function createSnapshot({ paths, projectId, projectTitle, odinEndpoint, authToken }) {
    const timestamp = Date.now();
    const snapshotId = `snap-${projectId}-${timestamp}`;

    logger.info(JSON.stringify({ event: 'snapshot-start', projectId, count: paths.length }));

    const entries = await processBatchWithConcurrency(paths, FRAGMENT_CONCURRENCY, async (path) => {
        const fragment = await getFragmentByPath(odinEndpoint, path, authToken);
        if (!fragment) throw new Error(`Fragment not found at path: ${path}`);
        const wasPublished = fragment.status === STATUS_PUBLISHED || fragment.status === STATUS_MODIFIED;
        const versionId = await createVersion(
            odinEndpoint,
            fragment.id,
            `Pre-bulk-publish - ${projectTitle}`,
            snapshotId,
            authToken,
        );
        if (!versionId) throw new Error(`Failed to create version for fragment: ${path}`);
        return [fragment.id, { path: fragment.path, versionId, wasPublished }];
    });

    const snapshot = {
        id: snapshotId,
        createdAt: new Date(timestamp).toISOString(),
        fragments: Object.fromEntries(entries),
    };

    logger.info(JSON.stringify({ event: 'snapshot-complete', projectId, count: paths.length }));
    return serializeEntries(snapshot);
}

async function revertSnapshot({ entries, odinEndpoint, authToken }) {
    const snapshot = deserializeEntries(entries);
    const fragmentEntries = Object.entries(snapshot.fragments);

    logger.info(JSON.stringify({ event: 'revert-start', count: fragmentEntries.length }));

    const results = await processBatchWithConcurrency(fragmentEntries, FRAGMENT_CONCURRENCY, async ([fragmentId, entry]) => {
        let fragment;
        try {
            fragment = await getFragmentById(odinEndpoint, fragmentId, authToken);
        } catch (err) {
            if (err?.message?.includes('404')) return { skipped: fragmentId };
            return { path: fragmentId, error: err.message };
        }
        try {
            await restoreVersion(odinEndpoint, fragmentId, entry.versionId, authToken);
            if (!entry.wasPublished) {
                await unpublishFragment(odinEndpoint, fragment.path, authToken);
            }
            return null;
        } catch (err) {
            return { path: fragment.path, error: err.message };
        }
    });

    const failures = results.filter((r) => r?.error);
    const skipped = results.filter((r) => r?.skipped).map((r) => r.skipped);
    logger.info(JSON.stringify({ event: 'revert-complete', failures: failures.length, skipped: skipped.length }));

    return { failures, skipped };
}

async function recordSnapshot({ paths, odinEndpoint, authToken }) {
    const timestamp = Date.now();
    const createdAt = new Date(timestamp).toISOString();

    logger.info(JSON.stringify({ event: 'record-snapshot-start', count: paths.length }));

    const results = await processBatchWithConcurrency(paths, FRAGMENT_CONCURRENCY, async (path) => {
        const fragment = await getFragmentByPath(odinEndpoint, path, authToken);
        if (!fragment) return { path, error: `Fragment not found at path: ${path}` };
        const wasPublished = fragment.status === STATUS_PUBLISHED || fragment.status === STATUS_MODIFIED;
        const versionId = await findNonTranslationVersion(odinEndpoint, fragment.id, authToken);
        if (!versionId) return { path, error: `No non-translation version found for fragment: ${path}` };
        return [fragment.id, { path: fragment.path, versionId, wasPublished }];
    });

    const failures = results.filter((r) => r?.error);
    const pairs = results.filter((r) => Array.isArray(r));

    const snap = {
        createdAt,
        fragments: Object.fromEntries(pairs),
    };

    logger.info(JSON.stringify({ event: 'record-snapshot-complete', count: pairs.length, failures: failures.length }));
    return { entries: serializeEntries(snap), failures };
}

async function checkModifications({ entries, odinEndpoint, authToken }) {
    const snapshot = deserializeEntries(entries);
    const snapshotTime = new Date(snapshot.createdAt).getTime();
    const fragmentEntries = Object.entries(snapshot.fragments);

    logger.info(JSON.stringify({ event: 'check-modifications-start', count: fragmentEntries.length }));

    const results = await processBatchWithConcurrency(fragmentEntries, FRAGMENT_CONCURRENCY, async ([fragmentId]) => {
        try {
            const fragment = await getFragmentById(odinEndpoint, fragmentId, authToken);
            const modifiedAt = fragment.modified?.at;
            const modified = modifiedAt ? new Date(modifiedAt).getTime() > snapshotTime : false;
            return { fragmentId, path: fragment.path, modified };
        } catch {
            return { fragmentId, path: fragmentId, modified: null };
        }
    });

    logger.info(JSON.stringify({ event: 'check-modifications-complete', count: results.length }));
    return results.sort((a, b) => a.path.localeCompare(b.path));
}

module.exports = {
    createSnapshot,
    revertSnapshot,
    checkModifications,
    recordSnapshot,
};
