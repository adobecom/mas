import { html, nothing } from 'lit';
import { FRAGMENT_STATUS, CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../constants.js';
import { Fragment } from '../../aem/fragment.js';

/**
 * Renders a fragment status cell with a colored dot and label.
 * @param {string} [status]
 * @returns {import('lit').TemplateResult|typeof nothing}
 */
export function renderFragmentStatusCell(status) {
    if (!status) return nothing;
    const statusVariant =
        {
            [FRAGMENT_STATUS.PUBLISHED]: 'positive',
            [FRAGMENT_STATUS.MODIFIED]: 'yellow',
            [FRAGMENT_STATUS.DRAFT]: 'info',
        }[status] || 'neutral';
    return html`<sp-table-cell class="status-cell">
        <sp-status-light size="s" variant=${statusVariant}></sp-status-light>
        ${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}
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
    if (item.model?.path?.includes('/dictionnary')) return 'Placeholder';
    if (item.model?.path === COLLECTION_MODEL_PATH) return 'Collection';
    if (item.model?.path === CARD_MODEL_PATH) return 'Default';
    return 'Unknown';
}

/**
 * Detects clicks that originated on an interactive control inside a selectable
 * `sp-table-row` (checkbox, expand chevron, copy/action button). Used to avoid
 * toggling row selection when the user is interacting with such controls.
 * @param {Event} event
 * @returns {boolean}
 */
export function shouldIgnoreRowClickForSelection(event) {
    return event.composedPath().some((node) => {
        if (!(node instanceof Element)) return false;
        if (node.tagName === 'SP-CHECKBOX') return true;
        if (node.classList?.contains('expand-button')) return true;
        if (node.tagName === 'SP-ACTION-BUTTON') return true;
        return false;
    });
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
