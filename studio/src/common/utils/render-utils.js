import { html, nothing } from 'lit';
import { FRAGMENT_STATUS, CARD_MODEL_PATH, COLLECTION_MODEL_PATH, PAGE_NAMES, DICTIONARY_MODEL_PATH } from '../../constants.js';
import { Fragment } from '../../aem/fragment.js';
import Store from '../../store.js';
import { generateCodeToUse, extractSurfaceFromPath } from '../../utils.js';
import { isPromoVariationPath } from '../../promotions/promotion-model.js';

/**
 * Studio display path for an item-picker row's "Path" column: the same
 * `authorPath` (`<web-component>: <surface> / <name>`) the content table view shows,
 * resolved against the active search surface and page.
 * @param {object} fragment - Fragment payload or Fragment instance
 * @returns {string}
 */
export function getStudioFragmentDisplayPath(fragment) {
    const page = Store.page.get();
    const path =
        page === PAGE_NAMES.PROMOTIONS_EDITOR
            ? Store.promotions.itemPickerSurface.get() || extractSurfaceFromPath(fragment?.path) || Store.search.get().path
            : extractSurfaceFromPath(fragment?.path) || Store.search.get().path;
    return generateCodeToUse(fragment, path, page)?.authorPath || '';
}

/**
 * Extracts the surface from a fragment path and applies it to the search store.
 * @param {string} path
 */
export function applySearchSurfaceFromPath(path) {
    const surface = extractSurfaceFromPath(path);
    if (surface) Store.search.set((prev) => ({ ...prev, path: surface }));
}

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

const PROMOTION_STATUS_LABEL = {
    draft: 'DRAFT',
    active: 'ACTIVE',
    scheduled: 'SCHEDULED',
    expired: 'EXPIRED',
    modified: 'MODIFIED',
    unknown: 'UNKNOWN',
};

/**
 * Status cell for promotion list (draft / active / scheduled / expired / unknown).
 * @param {string} [promotionStatus]
 * @returns {import('lit').TemplateResult|typeof nothing}
 */
export function renderPromotionStatusCell(promotionStatus) {
    if (!promotionStatus) return nothing;
    const key = promotionStatus.toLowerCase();
    let statusClass = '';
    if (key === 'active') statusClass = 'green';
    else if (key === 'draft') statusClass = 'blue';
    else if (key === 'scheduled') statusClass = 'yellow';
    else if (key === 'modified') statusClass = 'yellow';
    const label = PROMOTION_STATUS_LABEL[key] ?? key.toUpperCase();
    return html`<sp-table-cell class="status-cell">
        <div class="status-dot ${statusClass}"></div>
        ${label}
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
    if (isPromoVariationPath(item.path)) return 'Promotion';
    if (item.model?.path?.includes(DICTIONARY_MODEL_PATH)) return 'Placeholder';
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
        if (node.classList?.contains('copy-icon-button')) return true;
        if (node.tagName === 'SP-ACTION-BUTTON') return true;
        if (node.tagName === 'SP-ACTION-MENU') return true;
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
