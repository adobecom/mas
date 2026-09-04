import { html, nothing } from 'lit';
import {
    FRAGMENT_STATUS,
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    PAGE_NAMES,
    DICTIONARY_MODEL_PATH,
    BASELINE_VARIATION,
} from '../../constants.js';
import { Fragment } from '../../aem/fragment.js';
import Store from '../../store.js';
import { generateLinkToUse, extractSurfaceFromPath } from '../../utils.js';
import { isPromoVariationPath } from '../../promotions/promotion-model.js';
import { toggleSidebarIcon } from '../../icons.js';
import { getItemsSelectionStore } from '../items-selection-store.js';

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
    return generateLinkToUse(fragment, path, page)?.authorPath || '';
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
 * Renders the baseline-variation notice shown when a promotion
 * variation has no tags of its own and inherits the project's tags.
 * @returns {import('lit').TemplateResult}
 */
export function renderInheritedTagsNotice() {
    return html`<div class="text-with-tooltip">
        ${BASELINE_VARIATION.TEXT}
        <overlay-trigger placement="top" triggered-by="hover">
            <div slot="trigger"><sp-icon-info size="s"></sp-icon-info></div>
            <sp-tooltip slot="hover-content" placement="top">${BASELINE_VARIATION.TOOLTIP_TEXT}</sp-tooltip>
        </overlay-trigger>
    </div>`;
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

/**
 * Stops an event from bubbling further (used for internal overlay/popover events).
 * @param {Event} event
 */
export function stopPropagation(event) {
    event.stopPropagation();
}

/**
 * Whether the active items-selection store is currently showing only selected items.
 * @returns {boolean}
 */
export function isShowingSelected() {
    return getItemsSelectionStore().showSelected.value;
}

/**
 * Flips the active items-selection store's "show selected" flag.
 */
export function toggleShowSelected() {
    getItemsSelectionStore().showSelected.set(!isShowingSelected());
}

/**
 * Label for the selected-items toggle button.
 * @param {boolean} showingSelection
 * @returns {string}
 */
export function getToggleSelectedLabel(showingSelection) {
    return showingSelection ? 'Hide selection' : 'Selected items';
}

/**
 * Tab label, appending the selection count when viewOnly.
 * @param {{value: string, label: string}} tab
 * @param {boolean} viewOnly
 * @returns {string}
 */
export function formatTabLabel(tab, viewOnly) {
    if (!viewOnly) return tab.label;
    const valueUppercase = tab.value.charAt(0).toUpperCase() + tab.value.slice(1);
    const count = getItemsSelectionStore()[`selected${valueUppercase}`].value.length;
    return `${tab.label} (${count})`;
}

/**
 * Renders the floating "Selected items" / "Hide selection" toggle button.
 * @param {{count: number, showingSelection: boolean, onToggle: () => void}} options
 * @returns {import('lit').TemplateResult}
 */
export function renderSelectionToggle({ count, showingSelection, onToggle }) {
    const toggleLabel = getToggleSelectedLabel(showingSelection);
    return html`
        <div class="selected-items-count">
            <sp-button variant="secondary" @click=${onToggle} ?disabled=${!count} class="ghost-button">
                <sp-icon slot="icon" label=${toggleLabel} class=${showingSelection ? 'flipped' : ''}>
                    ${toggleSidebarIcon}
                </sp-icon>
                ${toggleLabel} (${count})
            </sp-button>
        </div>
    `;
}
