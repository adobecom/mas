import Store from '../store.js';
import Events from '../events.js';
import { PROMOTION_MODEL_ID } from '../constants.js';
import { showToast } from '../utils.js';
import { canEditPromotions } from '../groups.js';
import { getPromotionTagFromFragment, getPromoNameFromTag, isPromoVariationPath } from './promotion-model.js';
import { compareVersionValues, versionFieldValues } from '../../libs/fragment-version.js';

const historyRequests = new Map();
const pendingVersions = new Map();
const recoveringVersions = new Set();
const RECORD_ATTEMPTS = 3;
const OUTBOX_PREFIX = 'mas.promotion-history.';
const activeRecords = new Set();
let historySession;

function historyOwner() {
    const profile = Store.profile.get();
    return JSON.stringify([document.querySelector('meta[name="io-base-url"]')?.content, profile?.id ?? profile?.email]);
}

function outboxKey(owner, payload) {
    return `${OUTBOX_PREFIX}${encodeURIComponent(owner)}.${encodeURIComponent(JSON.stringify([payload.projectId, payload.requestId]))}`;
}

function storageFailure(error) {
    if (!['SecurityError', 'QuotaExceededError'].includes(error.name)) throw error;
    console.error('Promotion history persistence unavailable:', error);
    showToast('Pending promotion history could not be stored. Closing this tab may lose the history entry.', 'warning');
}

function persistRecord(entry, remove = false) {
    try {
        if (remove) localStorage.removeItem(entry.key);
        else localStorage.setItem(entry.key, JSON.stringify({ payload: entry.payload, createdAt: entry.createdAt }));
    } catch (error) {
        storageFailure(error);
    }
}

function queueRecords(fragment, records, owner) {
    return records.map((record) => {
        const payload = {
            ...record,
            ...(record.action !== 'delete' && fragment.etag ? { completionEtag: fragment.etag } : {}),
        };
        const entry = { owner, payload, key: outboxKey(owner, payload), createdAt: Date.now() };
        persistRecord(entry);
        activeRecords.add(entry.key);
        return entry;
    });
}

function readPendingRecords() {
    const owner = historyOwner();
    const prefix = `${OUTBOX_PREFIX}${encodeURIComponent(owner)}.`;
    const entries = [];
    try {
        for (const key of Object.keys(localStorage).filter((key) => key.startsWith(prefix))) {
            if (activeRecords.has(key)) continue;
            try {
                const raw = localStorage.getItem(key);
                if (raw === null) continue;
                const stored = JSON.parse(raw);
                if (!stored || typeof stored !== 'object' || Array.isArray(stored))
                    throw new SyntaxError('Invalid pending promotion history record');
                const { payload, createdAt } = stored;
                if (
                    !payload ||
                    !Number.isFinite(createdAt) ||
                    !['save', 'create', 'delete'].includes(payload.action) ||
                    !['projectId', 'targetId', 'requestId'].every(
                        (field) =>
                            typeof payload[field] === 'string' && payload[field].length > 0 && payload[field].length <= 200,
                    ) ||
                    Object.keys(payload).some(
                        (field) =>
                            !['projectId', 'targetId', 'requestId', 'action', 'completionEtag', 'metadataOnly'].includes(field),
                    ) ||
                    (payload.completionEtag !== undefined &&
                        (typeof payload.completionEtag !== 'string' || payload.completionEtag.length > 200)) ||
                    (payload.metadataOnly !== undefined && (payload.metadataOnly !== true || payload.action === 'delete')) ||
                    key !== outboxKey(owner, payload)
                )
                    throw new SyntaxError('Invalid pending promotion history record');
                entries.push({ key, owner, payload, createdAt });
            } catch (error) {
                if (!(error instanceof SyntaxError)) throw error;
                console.error('Pending promotion history could not be recovered:', error);
                showToast('Some pending promotion history could not be recovered. Please report this issue.', 'warning');
            }
        }
    } catch (error) {
        storageFailure(error);
    }
    return entries.sort((a, b) => a.createdAt - b.createdAt);
}

export async function recoverPromotionHistory(projectId) {
    if (
        !Store.profile.get()?.email ||
        !canEditPromotions() ||
        !document.querySelector('meta[name="io-base-url"]')?.content ||
        !(sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token)
    )
        return false;
    const results = await Promise.all(
        readPendingRecords()
            .filter((entry) => entry.payload.projectId === projectId)
            .map((entry) => {
                activeRecords.add(entry.key);
                const pending = trackVersion(entry.payload.targetId, () => completeRecords([entry]));
                recoveringVersions.add(pending);
                return pending
                    .catch((error) => {
                        console.error('Promotion history recovery failed:', error);
                        return false;
                    })
                    .finally(() => recoveringVersions.delete(pending));
            }),
    );
    return results.some(Boolean);
}

function historyRequestKey(projectId, filters) {
    const session = JSON.stringify([
        document.querySelector('meta[name="io-base-url"]')?.content,
        document.querySelector('mas-repository')?.getAttribute('base-url'),
        Store.profile.get()?.id ?? Store.profile.get()?.email,
        sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token,
    ]);
    if (historySession !== session) {
        clearPromotionHistoryRequests();
        historySession = session;
    }
    return JSON.stringify([projectId, Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))]);
}

/** Prevents new history reads from reusing requests started before a content or session change. */
export function clearPromotionHistoryRequests(projectId) {
    for (const [key, entry] of historyRequests) {
        if (!projectId || entry.projectId === projectId) historyRequests.delete(key);
    }
}

Events.fragmentSaved.subscribe(() => clearPromotionHistoryRequests());

async function callAction(action, { projectId, ...payload }) {
    const baseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
    const token = sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
    if (!baseUrl) throw new Error('Studio I/O endpoint is not configured.');
    if (!token) throw new Error('Sign in to access promotion versions.');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/history-${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, scopeType: 'promotion', rootId: projectId }),
        signal: AbortSignal.timeout(action === 'restore' ? 55000 : 15000),
        keepalive: action === 'record',
    });
    let body;
    try {
        body = await response.json();
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        if (response.ok) throw new Error('Promotion version service returned an invalid response.');
    }
    if (!response.ok) {
        const error = new Error(
            body?.error?.body?.error ?? body?.error ?? `Promotion version request failed (${response.status}).`,
        );
        error.status = response.status;
        error.details = body;
        throw error;
    }
    return body;
}

/** Fetches fresh history while sharing identical requests that are still in flight. */
export async function listPromotionHistory(projectId, filters = {}) {
    while (pendingVersions.size) {
        const writes = [...pendingVersions.values()].filter((pending) => !recoveringVersions.has(pending));
        if (!writes.length) break;
        await Promise.allSettled(writes);
    }
    const key = historyRequestKey(projectId, filters);
    let entry = historyRequests.get(key);
    if (!entry) {
        entry = { projectId, pending: callAction('list', { ...filters, projectId }) };
        historyRequests.set(key, entry);
    }
    try {
        return structuredClone(await entry.pending);
    } finally {
        if (historyRequests.get(key) === entry) historyRequests.delete(key);
    }
}

export async function restorePromotionHistory(projectId, eventId, options) {
    clearPromotionHistoryRequests(projectId);
    try {
        return await callAction('restore', { ...options, projectId, eventId, requestId: crypto.randomUUID() });
    } finally {
        clearPromotionHistoryRequests(projectId);
    }
}

function isProject(fragment) {
    return (fragment.modelId ?? fragment.model?.id)?.replace(/={1,2}$/, '') === PROMOTION_MODEL_ID.replace(/={1,2}$/, '');
}

async function resolveProjectIds(repository, fragment) {
    if (isProject(fragment)) return [fragment.id];
    if (!isPromoVariationPath(fragment.path)) return [];
    const tag = getPromotionTagFromFragment(fragment);
    const matchingProjects = () =>
        Store.promotions.list.data
            .get()
            .map((store) => store.get())
            .filter((project) => {
                const projectTag = getPromotionTagFromFragment(project);
                if (tag) return projectTag === tag;
                const name = getPromoNameFromTag(projectTag ?? '');
                return name && fragment.path.includes(`/promotions/${name}/`);
            });
    let matches = matchingProjects();
    if (!matches.length) {
        await repository.loadPromotions();
        matches = matchingProjects();
    }
    if (!matches.length) throw new Error('The promotion project could not be resolved. Reload and try again.');
    return matches.map((project) => project.id);
}

async function retryRecord(payload, owner) {
    for (let attempt = 0; attempt < RECORD_ATTEMPTS; attempt += 1) {
        try {
            if (owner !== undefined && owner !== historyOwner())
                throw Object.assign(new Error('Promotion history session changed'), { name: 'HistorySessionChanged' });
            return await callAction('record', payload);
        } catch (error) {
            const transient =
                error.status === 429 || error.status >= 500 || ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name);
            if (!transient || attempt === RECORD_ATTEMPTS - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
        }
    }
}

function trackVersion(fragmentId, operation, complete) {
    const previous = pendingVersions.get(fragmentId);
    let resultId;
    const saved = (async () => {
        if (previous) await Promise.allSettled([previous]);
        return operation();
    })();
    const pending = (
        complete
            ? saved.then((result) => {
                  if (result?.id && result.id !== fragmentId) {
                      resultId = result.id;
                      pendingVersions.set(resultId, pending);
                  }
                  return complete(result);
              })
            : saved
    ).finally(() => {
        if (pendingVersions.get(fragmentId) === pending) pendingVersions.delete(fragmentId);
        if (resultId && pendingVersions.get(resultId) === pending) pendingVersions.delete(resultId);
    });
    pendingVersions.set(fragmentId, pending);
    if (complete) {
        void pending.catch((error) => console.error('Promotion history completion failed:', error));
        return saved;
    }
    return pending;
}

async function projectRecords(repository, fragment, projectId, action) {
    return (projectId ? [projectId] : await resolveProjectIds(repository, fragment)).map((rootId) => ({
        projectId: rootId,
        targetId: fragment.id,
        requestId: crypto.randomUUID(),
        action,
    }));
}

async function prepareRecords(repository, fragment, action, owner) {
    const prepared = [];
    const revisions = new Set();
    try {
        for (const record of await projectRecords(repository, fragment, undefined, action)) {
            if (action === 'create') {
                prepared.push(record);
                continue;
            }
            try {
                const preparation = await retryRecord(
                    {
                        ...record,
                        phase: 'prepare',
                        ...(fragment.etag ? { expectedEtag: fragment.etag } : {}),
                    },
                    owner,
                );
                prepared.push(record);
                if (preparation.etag) revisions.add(preparation.etag);
            } catch (error) {
                if (error.name === 'HistorySessionChanged') throw error;
                if (action === 'save') prepared.push({ ...record, metadataOnly: true });
                console.error(`Promotion history preparation failed for project ${record.projectId}:`, error);
            }
        }
    } catch (error) {
        if (error.name === 'HistorySessionChanged') throw error;
        console.error('Promotion history project resolution failed:', error);
    }
    if (action !== 'delete' && revisions.size > 1)
        throw new Error('Fragment changed while preparing history. Reload before saving.');
    return { prepared, etag: [...revisions][0] };
}

async function completeRecords(records) {
    clearPromotionHistoryRequests();
    let recorded = false;
    let snapshotUnavailable = false;
    try {
        for (const entry of records) {
            try {
                let result;
                try {
                    result = await retryRecord(entry.payload, entry.owner);
                } catch (error) {
                    if (error.status !== 409 || entry.payload.action === 'delete' || entry.payload.metadataOnly) throw error;
                    entry.payload.metadataOnly = true;
                    persistRecord(entry);
                    result = await retryRecord(entry.payload, entry.owner);
                }
                snapshotUnavailable ||= Boolean(result.event?.snapshotUnavailable);
                persistRecord(entry, true);
                recorded = true;
            } catch (error) {
                if (error.name === 'HistorySessionChanged') continue;
                console.error(`Promotion history recording failed for project ${entry.payload.projectId}:`, error);
            } finally {
                activeRecords.delete(entry.key);
            }
        }
    } finally {
        clearPromotionHistoryRequests();
    }
    if (snapshotUnavailable)
        showToast('Your change was recorded, but its snapshot is unavailable and it cannot be restored.', 'warning');
    return recorded;
}

/** Persists creation records before returning, then completes them in the background. */
export async function savePromotionVersion(repository, fragment, { projectId } = {}) {
    if (!canEditPromotions()) return;
    const owner = historyOwner();
    let records = [];
    return trackVersion(
        fragment.id,
        async () => {
            try {
                records = await projectRecords(repository, fragment, projectId, 'create');
            } catch (error) {
                console.error('Promotion history project resolution failed:', error);
            }
            records = queueRecords(fragment, records, owner);
            return fragment;
        },
        () => completeRecords(records),
    );
}

/** Uses server-prepared snapshots and records history after returning the content operation. */
export async function withPromotionVersion(repository, fragment, write, { action } = {}) {
    if (
        !canEditPromotions() ||
        (!isProject(fragment) && !isPromoVariationPath(fragment.path)) ||
        (action === 'delete' && !isPromoVariationPath(fragment.path))
    )
        return write();
    const owner = historyOwner();
    action ??= fragment.id ? 'save' : 'create';
    let preparation;
    return trackVersion(
        action === 'create' ? crypto.randomUUID() : fragment.id,
        async () => {
            preparation = action === 'create' ? { prepared: [] } : await prepareRecords(repository, fragment, action, owner);
            if (owner !== historyOwner()) throw new Error('Sign-in changed; reload before continuing.');
            const submitted =
                action === 'save'
                    ? structuredClone(versionFieldValues({ ...fragment, tags: fragment.newTags ?? fragment.tags }))
                    : undefined;
            const saved = await write(
                action === 'save' && preparation.etag ? { expectedEtag: preparation.etag, refetchEtag: false } : undefined,
            );
            if (saved) {
                if (action === 'create') preparation = await prepareRecords(repository, saved, action, owner);
                if (
                    action === 'save' &&
                    preparation.etag &&
                    saved.etag === preparation.etag &&
                    compareVersionValues(submitted, versionFieldValues(saved)).length
                )
                    preparation.prepared = preparation.prepared.map((record) => ({ ...record, metadataOnly: true }));
                preparation.prepared = queueRecords(action === 'delete' ? fragment : saved, preparation.prepared, owner);
            }
            return saved;
        },
        async (saved) => {
            if (!saved) return;
            await completeRecords(preparation.prepared);
        },
    );
}

Store.profile.subscribe(() => clearPromotionHistoryRequests());
