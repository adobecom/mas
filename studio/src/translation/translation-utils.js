import { html, nothing } from 'lit';
import { FRAGMENT_STATUS, TRANSLATION_PROJECT_MODEL_ID } from '../constants.js';
import Store from '../store.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING, normalizeKey } from '../utils.js';

/** Fields carried over verbatim when duplicating a translation project; `title`, `status`, and `submissionDate` are reset. */
const TRANSLATION_PROJECT_FIELD_TYPE_MAP = {
    title: { type: 'text', multiple: false },
    status: { type: 'text', multiple: false },
    fragments: { type: 'content-fragment', multiple: true },
    placeholders: { type: 'content-fragment', multiple: true },
    collections: { type: 'content-fragment', multiple: true },
    targetLocales: { type: 'text', multiple: true },
    submissionDate: { type: 'date-time', multiple: false },
    projectType: { type: 'enumeration', multiple: false },
};

/**
 * Allows duplication unless the translation project is queued or running.
 * @param {string} [status]
 * @returns {boolean}
 */
export function canDuplicateTranslationProject(status) {
    return status !== 'QUEUED' && status !== 'RUNNING';
}

/**
 * True when title's normalizeKey slug collides with an existing one.
 * @param {string} title
 * @param {string[]} [existingTitles]
 * @returns {boolean}
 */
export function isTranslationProjectTitleTaken(title, existingTitles = []) {
    const normalized = normalizeKey(title?.trim());
    if (!normalized) return false;
    return existingTitles.some((existing) => normalizeKey(existing?.trim()) === normalized);
}

/**
 * Extracts non-empty titles from a list of translation project fragments, for the duplicate-title check.
 * @param {Array<{ title: string }>} [projects]
 * @returns {string[]}
 */
export function getTranslationProjectTitles(projects = []) {
    return projects.map((project) => project.title).filter(Boolean);
}

/**
 * Builds a create-fragment payload for duplicating a translation project under a new title.
 * @param {{ fields: Array<{ name: string, type?: string, multiple?: boolean, values?: unknown[] }> }} sourceFragment
 * @param {string} title
 * @returns {{ name: string, title: string, fields: Array<{ name: string, type: string, multiple: boolean, values: unknown[] }> }}
 */
export function buildTranslationProjectDuplicatePayload(sourceFragment, title) {
    return {
        name: normalizeKey(title?.trim()),
        title,
        fields: sourceFragment.fields.map((field) => ({
            name: field.name,
            type: TRANSLATION_PROJECT_FIELD_TYPE_MAP[field.name]?.type ?? field.type,
            multiple: TRANSLATION_PROJECT_FIELD_TYPE_MAP[field.name]?.multiple ?? field.multiple ?? false,
            values:
                field.name === 'title'
                    ? [title]
                    : field.name === 'status' || field.name === 'submissionDate'
                      ? []
                      : field.values,
        })),
    };
}

/**
 * Duplicates a translation project as a new Draft project with the same
 * fragments, placeholders, collections, and target locales as the source.
 * @param {{ createFragment: Function, getTranslationsPath: () => string }} repository
 * @param {Object} sourceProject
 * @param {string} title
 * @returns {Promise<Object>} the newly created translation project fragment
 */
export async function duplicateTranslationProject(repository, sourceProject, title) {
    const payload = {
        ...buildTranslationProjectDuplicatePayload(sourceProject, title),
        parentPath: repository.getTranslationsPath(),
        modelId: TRANSLATION_PROJECT_MODEL_ID,
    };
    const newProject = await repository.createFragment(payload, false);
    if (!newProject) {
        const error = new Error('Failed to duplicate project.');
        error.alreadyToasted = true;
        throw error;
    }
    return newProject;
}

export const ODIN_LOC_TASK_NAME_MAX_LENGTH = 255;

/**
 * Returns an error message when `value` is not a valid task name.
 * Rules: non-empty after trim, at least one alphanumeric character, only `A–Z`, `a–z`, `0–9`, `-`, `_`, `.`,
 * no consecutive dots, max {@link ODIN_LOC_TASK_NAME_MAX_LENGTH} characters.
 * @param {string} value - Project title
 * @returns {string|null}
 */
export function getOdinLocTaskNameValidationError(value) {
    const title = (value ?? '').trim();
    if (title.length === 0) {
        return 'Project title cannot be empty.';
    }
    if (title.length > ODIN_LOC_TASK_NAME_MAX_LENGTH) {
        return `Project title must be at most ${ODIN_LOC_TASK_NAME_MAX_LENGTH} characters.`;
    }
    if (!/[A-Za-z0-9]/.test(title)) {
        return 'Project title must include at least one letter or number.';
    }
    if (!/^[A-Za-z0-9._-]+$/.test(title)) {
        return 'Project title may only use letters, numbers, hyphens, underscores and dots.';
    }
    if (title.includes('..')) {
        return 'Project title cannot contain two dots in a row.';
    }
    return null;
}

/**
 * Returns a human-readable fragment name for display (e.g. "merch-card: SURFACE / Title").
 * @param {Object} data - Fragment data (object with model.path, fields, tags, etc.)
 * @returns {string}
 */
export function getFragmentName(data) {
    const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
    const { fragmentParts } = getFragmentPartsToUse(data, Store.search.value.path);
    return `${webComponentName}: ${fragmentParts}`;
}

/**
 * Renders a fragment status cell (sp-table-cell with status dot and label).
 * Shared by MasSelectItemsTable and MasCollapsibleTableRow.
 * @param {string} [status] - Fragment status (e.g. FRAGMENT_STATUS.PUBLISHED)
 * @returns {import('lit').TemplateResult|typeof nothing}
 */
export function renderFragmentStatusCell(status) {
    if (!status) return nothing;
    let statusClass = '';
    if (status === FRAGMENT_STATUS.PUBLISHED) {
        statusClass = 'green';
    } else if (status === FRAGMENT_STATUS.MODIFIED) {
        statusClass = 'blue';
    }
    return html`<sp-table-cell class="status-cell">
        <div class="status-dot ${statusClass}"></div>
        ${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}
    </sp-table-cell>`;
}
