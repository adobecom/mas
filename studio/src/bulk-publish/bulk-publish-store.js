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

export async function startPublishing({
    project,
    token,
    ioBaseUrl,
    repository,
    publishFn,
    pollIntervalMs = 2000,
    maxPolls = 150,
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
        await fn({ ioBaseUrl, projectId: project.id, publishedBy, token });
        for (let i = 0; i < maxPolls; i++) {
            await repository.refreshFragment(project).catch(() => {});
            const statusField = project.get()?.fields?.find((f) => f.name === 'status');
            const status = statusField?.values?.[0];
            if (terminalStatuses.has(status)) break;
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
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
    repository.refreshFragment(project).catch(() => {});
    const current = Store.bulkPublishProjects.list.data.get() ?? [];
    Store.bulkPublishProjects.list.data.set([...current]);
    return result;
}
