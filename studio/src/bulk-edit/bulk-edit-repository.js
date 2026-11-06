import Store from '../store.js';
import { BULK_EDIT_PROJECTS_FOLDER, BULK_EDIT_PROJECT_MODEL_ID, ROOT_PATH } from '../constants.js';
import { normalizeKey } from '../utils.js';
import { getSearchSurface, loadProjectList, mergePendingProjects } from '../common/utils/project-list-utils.js';

const PROJECT_TITLE_PATTERN = /^\S.*-(MWPW|DOTCOM)-\d+$/;

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
