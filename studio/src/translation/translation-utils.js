import { html, nothing } from 'lit';
import { FRAGMENT_STATUS } from '../constants.js';
import Store from '../store.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from '../editor-panel.js';

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
