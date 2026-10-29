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

export async function restorePromotionHistory(projectId, eventId, options) {
    return callAction('restore', { ...options, projectId, eventId, requestId: crypto.randomUUID() });
}

export async function recordPromotionHistory(payload) {
    return callAction('record', payload);
}

function isProject(fragment) {
    return (fragment.modelId ?? fragment.model?.id)?.replace(/={1,2}$/, '') === PROMOTION_MODEL_ID.replace(/={1,2}$/, '');
}

async function resolveProjectIds(repository, fragment) {
    if (isProject(fragment)) return [fragment.id];
    if (!fragment.path || !isPromoVariationPath(fragment.path)) return [];
    const tag = getPromotionTagFromFragment(fragment);
    const matchesProject = (item) => {
        const projectTag = getPromotionTagFromFragment(item);
        if (tag) return projectTag === tag;
        const promoName = getPromoNameFromTag(projectTag ?? '');
        return promoName && fragment.path.includes(`/promotions/${promoName}/`);
    };
    let matches = Store.promotions.list.data
        .get()
        .map((store) => store.get())
        .filter(matchesProject);
    if (!matches.length) {
        const projects = await repository.searchFragmentList(
            { path: repository.getPromotionsPath(), sort: [{ on: 'created', order: 'DESC' }] },
            50,
        );
        matches = projects.filter(matchesProject);
    }
    if (!matches.length) {
        throw new Error('The promotion project could not be resolved. Reload and try again.');
    }
    return matches.map((project) => project.id);
}

function readPending() {
    return JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? '[]');
}

function updatePending(payload) {
    const pending = readPending().filter((item) => item.requestId !== payload.requestId);
    sessionStorage.setItem(PENDING_KEY, JSON.stringify([...pending, payload]));
}

async function completeAudit(payload) {
    const { attempts = 0, notified = false, blocked, nextRetryAt, ...request } = payload;
    updatePending(payload);
    try {
        await recordPromotionHistory(request);
        sessionStorage.setItem(
            PENDING_KEY,
            JSON.stringify(readPending().filter((item) => item.requestId !== payload.requestId)),
        );
    } catch (error) {
        const permanent = error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status);
        updatePending({
            ...request,
            attempts: attempts + 1,
            notified: true,
            blocked: permanent || attempts >= 2,
            nextRetryAt: Date.now() + 30000 * 2 ** attempts,
        });
        if (!notified) {
            console.error('Promotion audit completion failed:', error);
            showToast('Your change was saved, but its history could not be completed. Review Version history.', 'warning');
        }
    }
}

/** Retries durable audit completions without storing tokens or content in browser storage. */
export async function retryPendingPromotionAudits(projectId) {
    for (const pending of readPending()) {
        if (
            (!projectId || pending.projectId === projectId) &&
            !pending.blocked &&
            (!pending.nextRetryAt || pending.nextRetryAt <= Date.now())
        ) {
            await completeAudit(pending);
        }
    }
    const pending = readPending().filter((item) => !projectId || item.projectId === projectId);
    return { pending: pending.length, blocked: pending.filter((item) => item.blocked).length };
}

async function prepareAudit(projectId, action, fragment) {
    const requestId = crypto.randomUUID();
    const payload = { projectId, action, targetId: fragment.id, targetPath: fragment.path, requestId };
    const { intentId } = await recordPromotionHistory({ ...payload, phase: 'prepare' });
    return { ...payload, phase: 'complete', intentId };
}

/** Runs promotion writes with a durable server-verified intent and a confirmed completion. */
export async function withPromotionAudit(repository, action, target, write) {
    const targets = Array.isArray(target) ? target : [target];
    const actualAction = target.auditAction ?? action;
    const isNewProject = actualAction === 'create' && targets.every((fragment) => !fragment.id && isProject(fragment));
    if (isNewProject || actualAction === 'duplicate') {
        const created = await write();
        if (!created) throw new Error('Created fragment could not be confirmed. Reload before retrying.');
        for (const projectId of await resolveProjectIds(repository, created)) {
            await completeAudit({
                projectId,
                action: actualAction,
                targetId: created.id,
                targetPath: created.path,
                requestId: crypto.randomUUID(),
                ...(created.etag ? { completionEtag: created.etag } : {}),
                ...(actualAction === 'duplicate' && (target.sourceProjectId ?? (isProject(target) ? target.id : undefined))
                    ? { sourceProjectId: target.sourceProjectId ?? target.id }
                    : {}),
            });
        }
        return created;
    }
    const intents = [];
    const publication = ['publish', 'unpublish'].includes(actualAction);
    for (const fragment of publication ? targets.filter(isProject) : targets) {
        for (const projectId of await resolveProjectIds(repository, fragment)) {
            intents.push(await prepareAudit(projectId, actualAction, fragment));
        }
    }
    let result;
    try {
        result = await write();
    } catch (error) {
        if (error.mutationCommitted) {
            for (const intent of intents) {
                await completeAudit({
                    ...intent,
                    ...(error.mutationEtag ? { completionEtag: error.mutationEtag } : {}),
                });
            }
        }
        throw error;
    }
    const failures = publication ? (result?.items ?? []).filter((item) => item.status !== 'SUCCESS_TRIGGERED') : [];
    for (const intent of intents) {
        if (
            failures.some((item) => item.id === intent.targetId || (item.path !== undefined && item.path === intent.targetPath))
        )
            continue;
        const targetId = intent.targetId ?? result?.id;
        await completeAudit({
            ...intent,
            targetId,
            ...(result?.id === targetId && result?.etag ? { completionEtag: result.etag } : {}),
            ...(['publish', 'unpublish'].includes(actualAction) && result?.workflowInstanceId
                ? { workflowInstanceId: result.workflowInstanceId }
                : {}),
        });
    }
    if (failures.length) {
        throw new Error(
            `${actualAction === 'publish' ? 'Publication' : 'Unpublication'} could not be triggered for ${failures.length} fragment(s). Review the affected fragments before retrying.`,
        );
    }
    return result;
}
