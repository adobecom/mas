import Store from '../store.js';

function patchProjectStore(project, fields) {
    const snapshot = structuredClone(project.get());
    for (const [name, val] of Object.entries(fields)) {
        if (val === undefined) continue;
        const field = snapshot.fields?.find((f) => f.name === name);
        if (field) field.values = [val];
    }
    project.refreshFrom(snapshot);
}

export async function startPublishing({ project, token, ioBaseUrl, repository, includeVariations = false, includeCards = false }) {
    const { publishBulk } = await import('./bulk-publish-client.js');
    const profile = await window.adobeIMS?.getProfile?.().catch(() => null);
    const publishedBy = profile?.email ?? '';

    Store.bulkPublishProjects.publishing.set({
        ...Store.bulkPublishProjects.publishing.get(),
        [project.id]: true,
    });
    try {
        const result = await publishBulk({ ioBaseUrl, projectId: project.id, publishedBy, token, includeVariations, includeCards });
        patchProjectStore(project, {
            status: result.status,
            publishedAt: result.publishedAt,
            publishedBy: result.publishedBy,
        });
        repository.refreshFragment(project).catch(() => {});
        return result;
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
