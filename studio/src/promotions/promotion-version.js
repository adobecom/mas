import Store from '../store.js';
import Events from '../events.js';
import { PROMOTION_MODEL_ID } from '../constants.js';
import { showToast } from '../utils.js';
import { getPromotionTagFromFragment, getPromoNameFromTag, isPromoVariationPath } from './promotion-model.js';

const HISTORY_CACHE_TTL = 60000;
const historyPages = new Map();
let historySession;

function historyCacheKey(projectId, filters) {
    const session = JSON.stringify([
        document.querySelector('meta[name="io-base-url"]')?.content,
        document.querySelector('mas-repository')?.getAttribute('base-url'),
        Store.profile.get()?.id ?? Store.profile.get()?.email,
        sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token,
    ]);
    if (historySession !== session) {
        clearPromotionHistoryCache();
        historySession = session;
    }
    return JSON.stringify([projectId, Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))]);
}

/** Returns the unexpired history page for the current Studio session. */
export function getCachedPromotionHistory(projectId, filters = {}) {
    const key = historyCacheKey(projectId, filters);
    const entry = historyPages.get(key);
    if (entry?.expiresAt > Date.now()) return structuredClone(entry.data);
    if (entry && !entry.pending) historyPages.delete(key);
}

/** Invalidates promotion history, including pending responses from an older generation. */
export function clearPromotionHistoryCache(projectId) {
    for (const [key, entry] of historyPages) {
        if (!projectId || entry.projectId === projectId) historyPages.delete(key);
    }
}

Events.fragmentSaved.subscribe(() => clearPromotionHistoryCache());
Store.profile.subscribe(() => clearPromotionHistoryCache());

async function callAction(action, payload) {
    const baseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
    const token = sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
    if (!baseUrl) throw new Error('Studio I/O endpoint is not configured.');
    if (!token) throw new Error('Sign in to access promotion versions.');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/promo-history-${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) {
        const error = new Error(body.error?.body?.error ?? body.error ?? 'Promotion version request failed.');
        error.status = response.status;
        error.details = body;
        throw error;
    }
    return body;
}

export async function listPromotionHistory(projectId, filters = {}, { refresh = false } = {}) {
    const key = historyCacheKey(projectId, filters);
    const cached = getCachedPromotionHistory(projectId, filters);
    const entry = historyPages.get(key) ?? { projectId };
    if (!entry.pending) {
        if (cached && !refresh) return cached;
        historyPages.set(key, entry);
        entry.pending = (async () => {
            try {
                const page = await callAction('list', { ...filters, projectId });
                if (historyPages.get(key) === entry) {
                    entry.data = page;
                    entry.expiresAt = Date.now() + HISTORY_CACHE_TTL;
                }
                return page;
            } catch (error) {
                if (historyPages.get(key) === entry) historyPages.delete(key);
                throw error;
            } finally {
                entry.pending = null;
            }
        })();
    }
    return structuredClone(await entry.pending);
}

export async function restorePromotionHistory(projectId, eventId, options) {
    clearPromotionHistoryCache(projectId);
    try {
        return await callAction('restore', { ...options, projectId, eventId, requestId: crypto.randomUUID() });
    } finally {
        clearPromotionHistoryCache(projectId);
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

export async function savePromotionVersion(repository, fragment, { beforeVersionId, action = 'create' } = {}) {
    clearPromotionHistoryCache();
    try {
        for (const projectId of await resolveProjectIds(repository, fragment)) {
            await callAction('record', {
                projectId,
                targetId: fragment.id,
                requestId: crypto.randomUUID(),
                action,
                ...(beforeVersionId ? { beforeVersionId } : {}),
                ...(fragment.etag ? { completionEtag: fragment.etag } : {}),
            });
        }
    } catch (error) {
        console.error('Promotion version capture failed:', error);
        showToast('Your content was saved, but its version could not be recorded. Review Version history.', 'warning');
    } finally {
        clearPromotionHistoryCache();
    }
}

export async function withPromotionVersion(repository, fragment, write) {
    if (!isProject(fragment) && !isPromoVariationPath(fragment.path)) return write();
    const beforeVersionId = fragment.id ? await repository.aem.sites.cf.fragments.createVersion(fragment.id) : undefined;
    if (fragment.id && !beforeVersionId) throw new Error('AEM did not confirm the version before saving.');
    const saved = await write();
    await savePromotionVersion(repository, saved, { beforeVersionId, action: fragment.id ? 'save' : 'create' });
    return saved;
}
