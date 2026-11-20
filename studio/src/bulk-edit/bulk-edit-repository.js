import Store from '../store.js';
import { BULK_EDIT_PROJECTS_FOLDER, BULK_EDIT_PROJECT_MODEL_ID, ROOT_PATH } from '../constants.js';
import { normalizeKey } from '../utils.js';
import { getSearchSurface, loadProjectList, mergePendingProjects } from '../common/utils/project-list-utils.js';

const PROJECT_TITLE_PATTERN = /^\S.*-(MWPW|DOTCOM)-\d+$/;

function bulkEditConnection() {
    const ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
    const token = sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
    if (!ioBaseUrl) throw new Error('Studio IO base URL is not configured.');
    if (!token) throw new Error('An IMS access token is required for bulk editing.');
    return {
        ioBaseUrl,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-gw-ims-org-id': '3B962FB55F5F922E0A495C88',
        },
    };
}

async function readBulkEditResponse(response) {
    if (!response.ok) throw new Error(`Bulk Find request failed: ${response.status} ${await response.text()}`);
    return response.json();
}

function waitForFindPoll(signal) {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
        const abort = () => {
            clearTimeout(timer);
            reject(signal.reason);
        };
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', abort);
            resolve();
        }, 1000);
        signal.addEventListener('abort', abort, { once: true });
    });
}

/** Starts a read-only Bulk Find job and yields local pages from its completed JSON export. */
export async function* searchBulkEditFragmentPages({ query, replace, locale, surface, tags, status }, limit, controller) {
    const { signal } = controller;
    signal.throwIfAborted();
    const { ioBaseUrl, headers } = bulkEditConnection();
    const endpoint = `${ioBaseUrl}/bulk-edit-find`;
    const job = await readBulkEditResponse(
        await fetch(endpoint, {
            method: 'POST',
            headers,
            signal,
            body: JSON.stringify({
                surface,
                find: query,
                replace: replace || query,
                searchIn: '*',
                matchCase: false,
                locale: [locale],
                ...(tags?.length ? { tags } : {}),
                ...(status?.length ? { status } : {}),
            }),
        }),
    );
    if (!job.jobId) throw new Error('Bulk Find did not return a job ID.');
    // The worker may run for up to an hour; never poll indefinitely.
    for (let poll = 0; poll < 3600; poll++) {
        signal.throwIfAborted();
        const progress = await readBulkEditResponse(
            await fetch(`${endpoint}?jobId=${encodeURIComponent(job.jobId)}`, {
                headers: bulkEditConnection().headers,
                signal,
            }),
        );
        if (progress.status === 'FAILED' || progress.status === 'CANCELLED') {
            throw new Error(progress.error || `Bulk Find job ${progress.status.toLowerCase()}.`);
        }
        if (progress.done && progress.exportReady) {
            if (!progress.exports?.json) throw new Error('Bulk Find did not return a JSON export URL.');
            // Presigned Files URLs must not receive Studio's IMS credentials.
            const result = await readBulkEditResponse(await fetch(progress.exports.json, { signal }));
            if (!Array.isArray(result.items)) throw new Error('Bulk Find returned an invalid results export.');
            for (let start = 0; start < result.items.length; start += limit) {
                signal.throwIfAborted();
                yield result.items.slice(start, start + limit);
            }
            return;
        }
        await waitForFindPoll(signal);
    }
    throw new Error('Bulk Find did not finish within one hour. Please retry.');
}

/**
 * Prepares, but does not send, a replacement request for a completed backend Find job.
 * Uses Studio's environment-resolved IO URL and IMS credentials, defaulting to a dry run.
 * @param {string} findJobId completed backend Find job ID, not a Studio project ID
 * @param {{ dryRun?: boolean }} [options] set dryRun to false only for an intentional live replacement
 * @returns {{ url: string, init: RequestInit }} URL and options for fetch
 */
export function buildBulkEditReplaceRequest(findJobId, { dryRun = true } = {}) {
    if (!findJobId) throw new Error('A completed backend Find job ID is required.');
    const { ioBaseUrl, headers } = bulkEditConnection();

    return {
        url: `${ioBaseUrl}/bulk-edit-replace`,
        init: {
            method: 'POST',
            headers,
            body: JSON.stringify({ findJobId, dryRun }),
        },
    };
}

export function isValidBulkEditProjectTitle(title) {
    return PROJECT_TITLE_PATTERN.test(title ?? '');
}

export function isBulkEditProjectTitleTaken(title, projectId) {
    const key = normalizeKey(title);
    return Store.bulkEditProjects.list.data.get().some((store) => {
        const project = store.get();
        return project.id !== projectId && normalizeKey(project.getFieldValue('title') ?? '') === key;
    });
}

export function getBulkEditProjectsPath() {
    return `${ROOT_PATH}/${BULK_EDIT_PROJECTS_FOLDER}/${getSearchSurface(Store.search.get()?.path)}`;
}

/** Serializes editor configuration using the existing bulk-edit project model. */
export function buildBulkEditConfigurationFields({
    findText,
    replaceText,
    searchFields,
    matchCase,
    resultFilters,
    selectedFragments,
}) {
    const selection = [...selectedFragments.values()].map(({ id, path }) => ({ id, path }));
    return [
        { name: 'searchTerm', type: 'text', values: [findText] },
        { name: 'replaceTerm', type: 'text', values: [replaceText] },
        { name: 'fieldNames', type: 'text', multiple: true, values: [...searchFields] },
        { name: 'fragments', type: 'content-fragment', multiple: true, values: selection.map(({ path }) => path) },
        // Keep identities, not stale copies of authored fragment content.
        { name: 'items', type: 'text', values: [JSON.stringify({ matchCase, resultFilters, selection })] },
    ];
}

/** Builds a draft project, optionally including its editor configuration. */
export function buildBulkEditProjectPayload({ title, status, configurationFields = [] }) {
    return {
        title,
        name: normalizeKey(title),
        modelId: BULK_EDIT_PROJECT_MODEL_ID,
        parentPath: getBulkEditProjectsPath(),
        fields: [
            { name: 'title', type: 'text', values: [title] },
            { name: 'status', type: 'text', values: [status] },
            ...configurationFields,
        ],
    };
}

export function loadBulkEditProjects(repository, abortController) {
    const path = getBulkEditProjectsPath();
    return loadProjectList(repository, {
        path,
        list: Store.bulkEditProjects.list,
        abortController,
        errorMessage: 'Could not load bulk edit projects.',
        transform: (projects) => mergePendingProjects(Store.bulkEditProjects.list.data, projects, path),
    });
}
