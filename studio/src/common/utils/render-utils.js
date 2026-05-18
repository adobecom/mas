import { html, nothing } from 'lit';
import { FRAGMENT_STATUS, CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../constants.js';

// AEM returns UNPUBLISHED for fragments that were published then unpublished.
// From the Studio perspective these behave identically to DRAFT.
const DISPLAY_STATUS = {
    [FRAGMENT_STATUS.UNPUBLISHED]: FRAGMENT_STATUS.DRAFT,
};
import { Fragment } from '../../aem/fragment.js';

/**
 * Renders a fragment status cell with a colored dot and label.
 * @param {string} [status]
 * @returns {import('lit').TemplateResult|typeof nothing}
 */
export function renderFragmentStatusCell(status) {
    if (!status) return nothing;
    const displayStatus = DISPLAY_STATUS[status] ?? status;
    let statusClass = '';
    if (status === FRAGMENT_STATUS.PUBLISHED) {
        statusClass = 'green';
    } else if (status === FRAGMENT_STATUS.MODIFIED) {
        statusClass = 'blue';
    }
    return html`<sp-table-cell class="status-cell">
        <div class="status-dot ${statusClass}"></div>
        ${displayStatus.charAt(0).toUpperCase()}${displayStatus.slice(1).toLowerCase()}
    </sp-table-cell>`;
}

/**
 * Returns a human-readable item type label.
 * @param {Object} item
 * @returns {string}
 */
export function getItemTypeLabel(item) {
    if (!item) return 'Unknown';
    if (Fragment.isGroupedVariationPath(item.path)) return 'Grouped variation';
    if (item.model?.path?.includes('/dictionary/')) return 'Placeholder';
    if (item.model?.path === COLLECTION_MODEL_PATH) return 'Collection';
    if (item.model?.path === CARD_MODEL_PATH) return 'Default';
    return 'Unknown';
}

/**
 * Returns a display title for an item (card, collection, or placeholder).
 * @param {Object} item
 * @param {number} [maxLength=54]
 * @returns {string}
 */
export function getItemTitle(item, maxLength = 54) {
    if (!item) return '-';
    if (item.model?.path === CARD_MODEL_PATH || item.model?.path === COLLECTION_MODEL_PATH) {
        const title = item.title || '-';
        return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
    }
    return item.key || item.getFieldValue?.('key') || '-';
}
