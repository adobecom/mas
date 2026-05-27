import Store from '../store.js';

export async function startPublishing({ project, token, ioBaseUrl, repository }) {
    const { publishBulk } = await import('./bulk-publish-client.js');
    const profile = await window.adobeIMS?.getProfile?.().catch(() => null);
    const publishedBy = profile?.email ?? '';

    Store.bulkPublishProjects.publishing.set({
        ...Store.bulkPublishProjects.publishing.get(),
        [project.id]: true,
    });
    try {
        const result = await publishBulk({ ioBaseUrl, projectId: project.id, publishedBy, token });
        await repository.refreshFragment(project);
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
    await repository.refreshFragment(project);
    const current = Store.bulkPublishProjects.list.data.get() ?? [];
    Store.bulkPublishProjects.list.data.set([...current]);
    return result;
}
