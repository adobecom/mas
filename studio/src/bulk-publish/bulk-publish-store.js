import Store from '../store.js';
import { BULK_PUBLISH_STATUS } from '../constants.js';
import { createSnapshot, revertSnapshot } from './bulk-publish-snapshot.js';
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

function serializeSnapshot(snapshot) {
    return Object.entries(snapshot.fragments).map(([fragmentId, entry]) =>
        JSON.stringify({
            fragmentId,
            versionId: entry.versionId,
            wasPublished: entry.wasPublished,
            createdAt: snapshot.createdAt,
        }),
    );
}

export function deserializeSnapshots(entries) {
    const parsed = entries.map((e) => JSON.parse(e));
    return {
        createdAt: parsed[0].createdAt,
        fragments: Object.fromEntries(
            parsed.map(({ fragmentId, versionId, wasPublished }) => [fragmentId, { versionId, wasPublished }]),
        ),
    };
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
        const projectTitle = getProjectField(project, 'title', '');
        snapshot = await createSnapshot({ items, id: project.id, title: projectTitle }, aem, userEmail);
    } catch (err) {
        setField(project, 'lastError', err.message);
        setField(project, 'status', BULK_PUBLISH_STATUS.DRAFT);
        await repository.saveFragment(project, false);
        return;
    }
    setSnapshots(project, serializeSnapshot(snapshot));

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
    setField(project, 'lastError', '');
    await repository.saveFragment(project, false);

    const entries = getProjectFieldList(project, 'snapshots');
    let snapshot;
    if (!entries.length) {
        setField(project, 'lastError', 'REVERT:\nNo snapshot found. Please re-publish to create a snapshot.');
        setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHED);
        await repository.saveFragment(project, false);
        return;
    }
    try {
        snapshot = deserializeSnapshots(entries);
    } catch {
        setField(project, 'lastError', 'REVERT:\nSnapshot data is corrupted. Please re-publish to create a new snapshot.');
        setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHED);
        await repository.saveFragment(project, false);
        return;
    }

    const aem = repository.aem;
    const { failures, skipped } = await revertSnapshot(snapshot, aem);

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
