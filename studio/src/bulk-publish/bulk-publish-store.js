import Store from '../store.js';
import { BULK_PUBLISH_STATUS } from '../constants.js';

function patchProjectStore(project, fields) {
    const snapshot = structuredClone(project.get());
    for (const [name, val] of Object.entries(fields)) {
        if (val === undefined) continue;
        const field = snapshot.fields?.find((f) => f.name === name);
        if (field) field.values = [val];
    }
    project.refreshFrom(snapshot);
}

const POLL_BACKOFF_FACTOR = 1.5;
const POLL_MAX_INTERVAL_MS = 30000;

export async function startPublishing({
    project,
    token,
    ioBaseUrl,
    repository,
    publishFn,
    pollIntervalMs = 2000,
    maxPolls = 150,
    sleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    includeVariations = false,
    includeCards = false,
}) {
    const fn = publishFn ?? (await import('./bulk-publish-client.js')).publishBulk;
    const profile = await window.adobeIMS?.getProfile?.().catch(() => null);
    const publishedBy = profile?.email ?? '';

    Store.bulkPublishProjects.publishing.set({
        ...Store.bulkPublishProjects.publishing.get(),
        [project.id]: true,
    });
    const terminalStatuses = new Set([
        BULK_PUBLISH_STATUS.PUBLISHED,
        BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED,
        BULK_PUBLISH_STATUS.FAILED,
    ]);
    try {
        await fn({ ioBaseUrl, projectId: project.id, publishedBy, token, includeVariations, includeCards });
        let interval = pollIntervalMs;
        for (let i = 0; i < maxPolls; i++) {
            await repository.refreshFragment(project, { skipPromoMerge: true }).catch(() => {});
            const statusField = project.get()?.fields?.find((f) => f.name === 'status');
            const status = statusField?.values?.[0];
            if (terminalStatuses.has(status)) return { status };
            await sleepFn(interval);
            interval = Math.min(interval * POLL_BACKOFF_FACTOR, POLL_MAX_INTERVAL_MS);
        }
        return { timedOut: true };
    } finally {
        const current = { ...Store.bulkPublishProjects.publishing.get() };
        delete current[project.id];
        Store.bulkPublishProjects.publishing.set(current);
    }
}

export async function startReverting({ project, token, ioBaseUrl, repository }) {
    const { revertAction } = await import('./bulk-publish-client.js');
    const result = await revertAction({ ioBaseUrl, projectId: project.id, token });
    patchProjectStore(project, { status: result.status });
    repository.refreshFragment(project, { skipPromoMerge: true }).catch(() => {});
    const current = Store.bulkPublishProjects.list.data.get() ?? [];
    Store.bulkPublishProjects.list.data.set([...current]);
    return result;
}
