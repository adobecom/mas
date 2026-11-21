import Store from '../store.js';
import { BULK_PUBLISH_STATUS } from '../constants.js';
import { showToast } from '../utils.js';

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

function finishPublishing(project) {
    const current = { ...Store.bulkPublishProjects.publishing.get() };
    delete current[project.id];
    Store.bulkPublishProjects.publishing.set(current);
}

function trackPublishingNotifications() {
    const stores = [Store.page, Store.promotions.promotionId, Store.bulkPublishProjects.projectId];
    let active = true;
    const release = () => {
        for (const store of stores) store.unsubscribe(onChange);
    };
    const onChange = (value, previous) => {
        if (value !== previous) {
            active = false;
            queueMicrotask(release);
        }
    };
    for (const store of stores) store.subscribe(onChange);
    return {
        get active() {
            return active;
        },
        release,
    };
}

async function monitorPublishing({ project, repository, pollIntervalMs, maxPolls, sleepFn }) {
    const terminalStatuses = new Set([
        BULK_PUBLISH_STATUS.PUBLISHED,
        BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED,
        BULK_PUBLISH_STATUS.FAILED,
    ]);
    try {
        let interval = pollIntervalMs;
        for (let i = 0; i < maxPolls; i++) {
            await repository.refreshFragment(project, { skipPromoMerge: true, skipReferences: true }).catch(() => {});
            const statusField = project.get()?.fields?.find((f) => f.name === 'status');
            const status = statusField?.values?.[0];
            if (terminalStatuses.has(status)) return { status };
            await sleepFn(interval);
            interval = Math.min(interval * POLL_BACKOFF_FACTOR, POLL_MAX_INTERVAL_MS);
        }
        return { timedOut: true };
    } finally {
        finishPublishing(project);
    }
}

export async function startPublishing({
    project,
    token,
    ioBaseUrl,
    aemOdinEndpoint,
    repository,
    publishFn,
    pollIntervalMs = 2000,
    maxPolls = 150,
    sleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    includeVariations = false,
    includeCards = false,
    publishReferences = true,
    waitForCompletion = true,
}) {
    if (Store.bulkPublishProjects.publishing.get()[project.id]) return { alreadyPublishing: true };
    Store.bulkPublishProjects.publishing.set({
        ...Store.bulkPublishProjects.publishing.get(),
        [project.id]: true,
    });

    const notifications = waitForCompletion ? null : trackPublishingNotifications();
    let monitor;
    try {
        const fn = publishFn ?? (await import('./bulk-publish-client.js')).publishBulk;
        const profile = await window.adobeIMS?.getProfile?.().catch(() => null);
        const publishedBy = profile?.email ?? '';
        const acceptance = await fn({
            ioBaseUrl,
            projectId: project.id,
            publishedBy,
            token,
            aemOdinEndpoint,
            includeVariations,
            includeCards,
            publishReferences,
        });
        if (!waitForCompletion && acceptance?.accepted !== true) {
            throw new Error('Bulk Publish acceptance could not be confirmed. Check the project before publishing again.');
        }
        monitor = monitorPublishing({ project, repository, pollIntervalMs, maxPolls, sleepFn });
        if (waitForCompletion) return await monitor;
        monitor.then(
            (outcome) => {
                if (notifications.active && outcome.timedOut)
                    showToast(`Bulk Publish ${project.id} is still processing. Check the project.`, 'warning');
                notifications.release();
            },
            (error) => {
                console.error(`Failed to track Bulk Publish ${project.id}`, error);
                if (notifications.active)
                    showToast(`Could not track Bulk Publish ${project.id}. Check the project.`, 'negative');
                notifications.release();
            },
        );
        return { accepted: true, activationId: acceptance.activationId ?? null };
    } finally {
        if (!monitor) {
            finishPublishing(project);
            notifications?.release();
        }
    }
}

export async function resetToDraft({ project, token, ioBaseUrl, repository }) {
    const { resetAction } = await import('./bulk-publish-client.js');
    const result = await resetAction({ ioBaseUrl, projectId: project.id, token });
    patchProjectStore(project, { status: result.status });
    repository.refreshFragment(project).catch(() => {});
    const current = Store.bulkPublishProjects.list.data.get() ?? [];
    Store.bulkPublishProjects.list.data.set([...current]);
    return result;
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

export async function saveSnapshot({ project, token, ioBaseUrl, saveSnapshotFn }) {
    if (!project?.id) return;
    const fn = saveSnapshotFn ?? (await import('./bulk-publish-client.js')).saveSnapshotAction;
    await fn({ ioBaseUrl, projectId: project.id, token });
}
