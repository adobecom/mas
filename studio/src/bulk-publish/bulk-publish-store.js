import Store from '../store.js';
import { BULK_PUBLISH_STATUS } from '../constants.js';
import { createSnapshot, revertSnapshot } from './bulk-publish-snapshot.js';

function setField(project, name, value) {
    if (typeof project.updateField === 'function') {
        project.updateField(name, [value]);
    } else {
        project.setFieldValue(name, value);
    }
}

export async function startPublishing({ project, items, paths, locales, token, ioBaseUrl, publishFn, repository }) {
    setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHING);
    setField(project, 'lastError', '');
    await repository.saveFragment(project, false);

    const profile = await window.adobeIMS?.getProfile?.().catch(() => null);
    const userEmail = profile?.email ?? '';

    const aem = repository.aem;
    let snapshot;
    try {
        snapshot = await createSnapshot({ items, id: project.id }, aem, userEmail);
    } catch (err) {
        setField(project, 'lastError', err.message);
        setField(project, 'status', BULK_PUBLISH_STATUS.DRAFT);
        await repository.saveFragment(project, false);
        return;
    }
    setField(project, 'snapshot', JSON.stringify(snapshot));

    const promise = publishFn({ ioBaseUrl, paths, locales, token });
    Store.bulkPublishProjects.publishing.set({
        ...Store.bulkPublishProjects.publishing.get(),
        [project.id]: true,
    });

    try {
        const result = await promise;
        setField(project, 'lastResult', JSON.stringify(result));
        setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHED);
        setField(project, 'publishedAt', new Date().toISOString());
        if (userEmail) setField(project, 'publishedBy', userEmail);
        await repository.saveFragment(project, false);
        return result;
    } catch (err) {
        setField(project, 'lastError', err.message);
        setField(project, 'status', BULK_PUBLISH_STATUS.DRAFT);
        await repository.saveFragment(project, false);
        throw err;
    } finally {
        const current = { ...Store.bulkPublishProjects.publishing.get() };
        delete current[project.id];
        Store.bulkPublishProjects.publishing.set(current);
    }
}

export async function startReverting({ project, repository }) {
    setField(project, 'status', BULK_PUBLISH_STATUS.REVERTING);
    await repository.saveFragment(project, false);

    const raw =
        typeof project.value?.getFieldValue === 'function'
            ? project.value.getFieldValue('snapshot')
            : (project.getFieldValue?.('snapshot') ?? project.snapshot);
    let snapshot;
    try {
        snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
        snapshot = raw;
    }

    const aem = repository.aem;
    try {
        await revertSnapshot(snapshot, aem);
        setField(project, 'status', BULK_PUBLISH_STATUS.REVERTED);
        setField(project, 'snapshot', null);
    } catch (err) {
        console.error('Failed to revert bulk publish project:', err);
        setField(project, 'lastError', err.message);
        setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHED);
    }
    await repository.saveFragment(project, false);

    const current = Store.bulkPublishProjects.list.data.get() ?? [];
    Store.bulkPublishProjects.list.data.set([...current]);
}
