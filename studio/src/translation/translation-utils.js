import { html, nothing } from 'lit';
import { FRAGMENT_STATUS } from '../constants.js';
import Store from '../store.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from '../editor-panel.js';

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
    const { fragmentParts } = getFragmentPartsToUse(Store, data);
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
