import Store from '../store.js';
import { BULK_PUBLISH_STATUS } from '../constants.js';

function setField(project, name, value) {
    if (typeof project.updateField === 'function') {
        project.updateField(name, [value]);
    } else {
        project.setFieldValue(name, value);
    }
}

export async function startPublishing({ project, paths, locales, token, ioBaseUrl, publishFn, repository }) {
    setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHING);
    setField(project, 'lastError', '');
    await repository.saveFragment(project, false);

    const promise = publishFn({ ioBaseUrl, paths, locales, token });
    Store.bulkPublishProjects.publishing.set({
        ...Store.bulkPublishProjects.publishing.get(),
        [project.id]: true,
    });

    let userEmail = '';
    try {
        const profile = await window.adobeIMS?.getProfile?.();
        userEmail = profile?.email ?? '';
    } catch {
        // profile fetch is non-critical
    }

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
