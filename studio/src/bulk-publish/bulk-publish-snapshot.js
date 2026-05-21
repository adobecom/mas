import { STATUS_PUBLISHED, STATUS_MODIFIED } from '../constants.js';

const SNAPSHOT_CONCURRENCY = 5;

async function runConcurrent(items, fn, limit) {
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
        while (next < items.length) {
            const i = next++;
            results[i] = await fn(items[i]);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

/**
 * Create a pre-publish snapshot of all fragments in the project.
 * @param {Object} project - Bulk publish project (has project.items and project.id/path)
 * @param {Object} aem - AEM repository object
 * @param {string} userEmail - Current user's email
 * @returns {Promise<Object>} snapshot
 */
export async function createSnapshot(project, aem, userEmail) {
    const items = (project.items ?? []).filter((item) => item.fragmentId || item.path);
    const projectId = project.id ?? project.path?.split('/').pop() ?? 'unknown';
    const projectTitle = project.title ?? '';
    const timestamp = Date.now();
    const snapshotId = `snap-${projectId}-${timestamp}`;

    async function processItem(item) {
        let fragmentId = item.fragmentId;
        if (!fragmentId) {
            const results = [];
            for await (const page of aem.sites.cf.fragments.search({ path: item.path })) {
                results.push(...page);
            }
            const rawFragment = results[0];
            if (!rawFragment) {
                throw new Error(`Fragment not found at path: ${item.path}`);
            }
            fragmentId = rawFragment.id;
        }

        const fragment = await aem.sites.cf.fragments.getById(fragmentId);
        const wasPublished = fragment.status === STATUS_PUBLISHED || fragment.status === STATUS_MODIFIED;
        const versionId = await aem.sites.cf.fragments.createVersion(fragmentId, {
            label: `Pre-publish - ${projectTitle}`,
            comment: snapshotId,
        });

        if (!versionId) {
            throw new Error(`Failed to create version for fragment: ${fragment.path}`);
        }

        return [fragmentId, { path: fragment.path, versionId, wasPublished }];
    }

    const entries = await runConcurrent(items, processItem, SNAPSHOT_CONCURRENCY);
    const fragments = Object.fromEntries(entries);

    return {
        id: snapshotId,
        createdAt: new Date(timestamp).toISOString(),
        createdBy: userEmail,
        source: 'pre-publish',
        fragments,
    };
}

/**
 * Revert all fragments in a snapshot to their saved versions.
 * @param {Object} snapshot - Snapshot returned by createSnapshot
 * @param {Object} aem - AEM repository object
 * @returns {Promise<void>}
 */
export async function revertSnapshot(snapshot, aem) {
    const failures = [];

    for (const [fragmentId, entry] of Object.entries(snapshot.fragments)) {
        try {
            await aem.sites.cf.fragments.restoreVersion(fragmentId, entry.versionId);
            if (!entry.wasPublished) {
                await aem.sites.cf.fragments.setToDraft(entry.path);
            }
        } catch (err) {
            failures.push({ path: entry.path, error: err.message });
        }
    }

    return { failures };
}

/**
 * Check which fragments have been modified since the snapshot was taken.
 * @param {Object} snapshot - Snapshot returned by createSnapshot
 * @param {Object} aem - AEM repository object
 * @returns {Promise<Array<{ path: string, modified: boolean }>>}
 */
export async function checkModifications(snapshot, aem) {
    const snapshotTime = new Date(snapshot.createdAt).getTime();
    const results = [];

    for (const [fragmentId, entry] of Object.entries(snapshot.fragments)) {
        try {
            const fragment = await aem.sites.cf.fragments.getById(fragmentId);
            const modifiedAt = fragment.modified?.at;
            const modified = modifiedAt ? new Date(modifiedAt).getTime() > snapshotTime : false;
            results.push({ path: entry.path, modified });
        } catch {
            results.push({ path: entry.path, modified: null });
        }
    }

    return results.sort((a, b) => a.path.localeCompare(b.path));
}
