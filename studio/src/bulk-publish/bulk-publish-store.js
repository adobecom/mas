import Store from '../store.js';
import { BULK_PUBLISH_STATUS } from '../constants.js';
import { getProjectField, getProjectFieldList } from './bulk-publish-utils.js';

function setField(project, name, value) {
    if (typeof project.updateField === 'function') {
        project.updateField(name, [value]);
    } else {
        project.setFieldValue(name, value);
    }
}

function setSnapshots(project, entries) {
    if (typeof project.updateField === 'function') {
        project.updateField('snapshots', entries);
    } else {
        project.setFieldValue('snapshots', entries);
    }
}

export async function startPublishing({ project, paths, locales, token, ioBaseUrl, publishFn, repository }) {
    setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHING);
    setField(project, 'lastError', '');
    await repository.saveFragment(project, false);

    const profile = await window.adobeIMS?.getProfile?.().catch(() => null);
    const userEmail = profile?.email ?? '';

    let snapshotEntries;
    try {
        const { createSnapshotAction } = await import('./bulk-publish-client.js');
        const projectTitle = getProjectField(project, 'title', '');
        snapshotEntries = await createSnapshotAction({ ioBaseUrl, paths, projectId: project.id, projectTitle, token });
    } catch (err) {
        setField(project, 'lastError', err.message);
        setField(project, 'status', BULK_PUBLISH_STATUS.DRAFT);
        await repository.saveFragment(project, false);
        return;
    }
    setSnapshots(project, snapshotEntries);

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

export async function startReverting({ project, token, ioBaseUrl, repository }) {
    setField(project, 'status', BULK_PUBLISH_STATUS.REVERTING);
    setField(project, 'lastError', '');
    await repository.saveFragment(project, false);

    const entries = getProjectFieldList(project, 'snapshots');
    if (!entries.length) {
        setField(project, 'lastError', 'REVERT:\nNo snapshot found. Please re-publish to create a snapshot.');
        setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHED);
        await repository.saveFragment(project, false);
        return;
    }

    const { revertSnapshotAction } = await import('./bulk-publish-client.js');
    let revertResult;
    try {
        revertResult = await revertSnapshotAction({ ioBaseUrl, entries, token });
    } catch (err) {
        setField(project, 'lastError', `REVERT:\n${err.message}`);
        setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHED);
        await repository.saveFragment(project, false);
        return;
    }
    const { failures, skipped } = revertResult;

    if (skipped.length > 0) {
        const skipSet = new Set(skipped);
        const updated = entries.filter((e) => {
            try {
                return !skipSet.has(JSON.parse(e).fragmentId);
            } catch {
                return true;
            }
        });
        setSnapshots(project, updated);
    }

    if (failures.length === 0) {
        setField(project, 'status', BULK_PUBLISH_STATUS.REVERTED);
    } else {
        const lines = failures.map((f) => `${f.path}: ${f.error}`).join('\n');
        setField(project, 'lastError', `REVERT:\n${lines}`);
        setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHED);
    }
    await repository.saveFragment(project, false);

    const current = Store.bulkPublishProjects.list.data.get() ?? [];
    Store.bulkPublishProjects.list.data.set([...current]);
}
