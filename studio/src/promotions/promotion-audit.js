import Store from '../store.js';
import { PROMOTION_MODEL_ID } from '../constants.js';
import { showToast } from '../utils.js';
import { getPromotionTagFromFragment, getPromoNameFromTag, isPromoVariationPath } from './promotion-model.js';

const PENDING_KEY = 'mas.pendingPromotionAudit';

async function callAction(action, payload) {
    const baseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
    const token = sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
    if (!baseUrl) throw new Error('Studio I/O endpoint is not configured.');
    if (!token) throw new Error('Sign in to access promotion history.');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/promo-history-${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) {
        const error = new Error(body.error?.body?.error ?? body.error ?? 'Promotion history request failed.');
        error.status = response.status;
        error.details = body;
        throw error;
    }
    return body;
}

export async function listPromotionHistory(projectId, filters = {}) {
    return callAction('list', { ...filters, projectId });
}

export async function createPromotionBackup(projectId, label = 'Manual backup') {
    return callAction('backup', { projectId, label, requestId: crypto.randomUUID() });
}

export async function restorePromotionHistory(projectId, eventId, options) {
    return callAction('restore', { ...options, projectId, eventId, requestId: crypto.randomUUID() });
}

export async function recordPromotionHistory(payload) {
    return callAction('record', payload);
}

function isProject(fragment) {
    return (fragment.modelId ?? fragment.model?.id)?.replace(/={1,2}$/, '') === PROMOTION_MODEL_ID.replace(/={1,2}$/, '');
}

async function resolveProjectId(repository, fragment) {
    if (isProject(fragment)) return fragment.id;
    if (!isPromoVariationPath(fragment.path)) return null;
    const tag = getPromotionTagFromFragment(fragment);
    let projects = Store.promotions.list.data.get();
    if (!projects.length) {
        await repository.loadPromotions();
        projects = Store.promotions.list.data.get();
    }
    const project = projects
        .map((store) => store.get())
        .find((item) => {
            const projectTag = getPromotionTagFromFragment(item);
            if (tag) return projectTag === tag;
            const promoName = getPromoNameFromTag(projectTag ?? '');
            return promoName && fragment.path.includes(`/promotions/${promoName}/`);
        });
    if (!project) throw new Error('The promotion project could not be resolved. Reload and try again.');
    return project.id;
}

function readPending() {
    return JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? '[]');
}

async function completeAudit(payload) {
    const pending = readPending().filter((item) => item.requestId !== payload.requestId);
    sessionStorage.setItem(PENDING_KEY, JSON.stringify([...pending, payload]));
    try {
        await recordPromotionHistory(payload);
        sessionStorage.setItem(
            PENDING_KEY,
            JSON.stringify(readPending().filter((item) => item.requestId !== payload.requestId)),
        );
    } catch (error) {
        console.error('Promotion audit completion failed:', error);
        showToast('Your change was saved, but history could not be updated. Open Version history to retry.', 'warning');
    }
}

/** Retries durable audit completions without storing tokens or content in browser storage. */
export async function retryPendingPromotionAudits(projectId) {
    for (const pending of readPending()) {
        if (!projectId || pending.projectId === projectId) await completeAudit(pending);
    }
}

async function prepareAudit(repository, action, fragment) {
    const projectId = await resolveProjectId(repository, fragment);
    if (!projectId) return null;
    const requestId = crypto.randomUUID();
    const payload = { projectId, action, targetId: fragment.id, targetPath: fragment.path, requestId };
    const { intentId } = await recordPromotionHistory({ ...payload, phase: 'prepare' });
    return { ...payload, phase: 'complete', intentId };
}

/** Runs promotion writes with a durable server-verified intent and a confirmed completion. */
export async function withPromotionAudit(repository, action, target, write) {
    const targets = Array.isArray(target) ? target : [target];
    const relevant = targets.filter((fragment) => isProject(fragment) || isPromoVariationPath(fragment.path));
    if (!relevant.length) return write();
    const actualAction = target.auditAction ?? action;
    const isNewProject = actualAction === 'create' && relevant.every((fragment) => !fragment.id && isProject(fragment));
    if (isNewProject || actualAction === 'duplicate') {
        const created = await write();
        try {
            const intent = await prepareAudit(repository, actualAction, created);
            if (intent) await completeAudit(intent);
        } catch (error) {
            console.error('Promotion creation audit failed:', error);
            showToast('Content created, but its history could not be recorded.', 'warning');
        }
        return created;
    }
    if (actualAction === 'publish') {
        const projectIds = new Set();
        for (const fragment of relevant) projectIds.add(await resolveProjectId(repository, fragment));
        for (const projectId of projectIds) await createPromotionBackup(projectId, 'auto: pre-publish');
    }
    const intents = [];
    for (const fragment of relevant) intents.push(await prepareAudit(repository, actualAction, fragment));
    const result = await write();
    for (const intent of intents) {
        if (intent) await completeAudit({ ...intent, targetId: intent.targetId ?? result?.id });
    }
    return result;
}
