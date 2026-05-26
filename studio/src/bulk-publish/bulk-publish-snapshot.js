import { STATUS_PUBLISHED, STATUS_MODIFIED } from '../constants.js';

const FRAGMENT_CONCURRENCY = 5;

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
            const rawFragment = await aem.sites.cf.fragments.getByPath(item.path);
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

    const entries = await runConcurrent(items, processItem, FRAGMENT_CONCURRENCY);
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
    const entries = Object.entries(snapshot.fragments);

    const results = await runConcurrent(
        entries,
        async ([fragmentId, entry]) => {
            let fragment;
            try {
                fragment = await aem.sites.cf.fragments.getById(fragmentId);
            } catch (err) {
                if (err?.response?.status === 404) return { skipped: fragmentId };
                return { path: fragmentId, error: err.message };
            }
            try {
                await aem.sites.cf.fragments.restoreVersion(fragmentId, entry.versionId);
                if (!entry.wasPublished) {
                    await aem.sites.cf.fragments.setToDraft(fragment.path);
                }
                return null;
            } catch (err) {
                return { path: fragment.path, error: err.message };
            }
        },
        FRAGMENT_CONCURRENCY,
    );

    return {
        failures: results.filter((r) => r?.error),
        skipped: results.filter((r) => r?.skipped).map((r) => r.skipped),
    };
}

/**
 * Check which fragments have been modified since the snapshot was taken.
 * @param {Object} snapshot - Snapshot returned by createSnapshot
 * @param {Object} aem - AEM repository object
 * @returns {Promise<Array<{ path: string, modified: boolean }>>}
 */
export async function checkModifications(snapshot, aem) {
    const snapshotTime = new Date(snapshot.createdAt).getTime();
    const entries = Object.entries(snapshot.fragments);

    const results = await runConcurrent(
        entries,
        async ([fragmentId, entry]) => {
            try {
                const fragment = await aem.sites.cf.fragments.getById(fragmentId);
                const modifiedAt = fragment.modified?.at;
                const modified = modifiedAt ? new Date(modifiedAt).getTime() > snapshotTime : false;
                return { fragmentId, path: fragment.path, modified };
            } catch {
                return { fragmentId, path: fragmentId, modified: null };
            }
        },
        FRAGMENT_CONCURRENCY,
    );

    return results.sort((a, b) => a.path.localeCompare(b.path));
}
