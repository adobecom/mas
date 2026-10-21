import Store from '../store.js';
import { BULK_EDIT_PROJECTS_FOLDER, BULK_EDIT_PROJECT_MODEL_ID, ROOT_PATH } from '../constants.js';
import { normalizeKey } from '../utils.js';
import { getSearchSurface, loadProjectList } from '../common/utils/project-list-utils.js';

const PROJECT_TITLE_PATTERN = /^\S.*-MWPW-\d+$/;

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

export function buildBulkEditProjectPayload({ title, status }) {
    return {
        title,
        name: normalizeKey(title),
        modelId: BULK_EDIT_PROJECT_MODEL_ID,
        parentPath: getBulkEditProjectsPath(),
        fields: [
            { name: 'title', type: 'text', values: [title] },
            { name: 'status', type: 'text', values: [status] },
        ],
    };
}

export function loadBulkEditProjects(repository, abortController) {
    return loadProjectList(repository, {
        path: getBulkEditProjectsPath(),
        list: Store.bulkEditProjects.list,
        abortController,
        errorMessage: 'Could not load bulk edit projects.',
    });
}
