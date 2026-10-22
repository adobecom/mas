import { html } from 'lit';
import { SURFACES } from '../../constants.js';
import { FragmentStore } from '../../reactivity/fragment-store.js';
import { Fragment } from '../../aem/fragment.js';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
});

const SURFACE_NAMES = new Set(Object.values(SURFACES).map(({ name }) => name));

export function getSearchSurface(path) {
    const surface = path?.split('/').filter(Boolean)[0]?.toLowerCase();
    return SURFACE_NAMES.has(surface) ? surface : SURFACES.SANDBOX.name;
}

export function getProjectField(project, name, fallback) {
    const data = project.value ?? project;
    return data.getFieldValue?.(name) ?? data[name] ?? fallback;
}

export function getProjectFieldList(project, name) {
    const data = project.value ?? project;
    return data.getFieldValues?.(name) ?? data[name] ?? [];
}

/**
 * Formats a project date for list views, or returns an em dash when missing or invalid.
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatProjectDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';
    return DATE_FORMATTER.format(date);
}

/**
 * Renders placeholder table rows shown while a project list loads.
 * @param {number} columns - Cells per row
 */
export function renderSkeletonRows(columns) {
    return Array.from(
        { length: 5 },
        (_, i) => html`
            <sp-table-row key=${i}>
                ${Array.from(
                    { length: columns },
                    () => html`<sp-table-cell><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>`,
                )}
            </sp-table-row>
        `,
    );
}

/**
 * Loads project fragments under `path`, newest first, into a `{ data, loading }` list store.
 * An aborted request is treated as superseded: it neither publishes results nor clears the loading flag.
 * @param {object} repository - mas-repository element
 * @param {{ path: string, list: { data, loading }, abortController?: AbortController, errorMessage: string, transform?: (stores: FragmentStore[]) => FragmentStore[] }} options
 * @returns {Promise<boolean>} true when the results were published
 */
export async function loadProjectList(
    repository,
    { path, list, abortController, errorMessage, transform = (stores) => stores },
) {
    const isActive = () => !abortController?.signal.aborted;
    list.loading.set(true);
    try {
        const fragments = await repository.searchFragmentList(
            { path, sort: [{ on: 'modifiedOrCreated', order: 'DESC' }] },
            50,
            abortController,
        );
        if (!isActive()) return false;
        list.data.set(transform(fragments.map((fragment) => new FragmentStore(new Fragment(fragment)))));
        return true;
    } catch (error) {
        if (isActive()) repository.processError(error, errorMessage);
        return false;
    } finally {
        if (isActive()) list.loading.set(false);
    }
}

export const PENDING_PROJECTS_META = 'pendingProjects';

/**
 * Registers a newly created project so list loads keep it visible until AEM search indexes it.
 * @param {ReactiveStore} list - the project list data store
 * @param {FragmentStore} projectStore - the store shared with the editor, so edits show in the list
 */
export function trackPendingProject(list, projectStore) {
    const pending = list.getMeta(PENDING_PROJECTS_META) ?? new Map();
    pending.set(projectStore.id, projectStore);
    list.setMeta(PENDING_PROJECTS_META, pending);
}

export function untrackPendingProject(list, id) {
    list.getMeta(PENDING_PROJECTS_META)?.delete(id);
}

/**
 * Prepends pending projects of the active folder that AEM search has not returned yet, newest first,
 * and forgets the ones it has.
 * @param {ReactiveStore} list - the project list data store
 * @param {FragmentStore[]} projects - indexed projects in server sort order
 * @param {string} path - the active surface's projects folder
 * @returns {FragmentStore[]}
 */
export function mergePendingProjects(list, projects, path) {
    const pending = list.getMeta(PENDING_PROJECTS_META) ?? new Map();
    for (const project of projects) pending.delete(project.id);
    const unindexed = [...pending.values()].reverse().filter((project) => project.get().path.startsWith(`${path}/`));
    return [...unindexed, ...projects];
}
