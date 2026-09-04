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
 * Copies text to the clipboard and dispatches a `show-toast` event on the given host.
 * @param {EventTarget} host - Element to dispatch the `show-toast` event on (bubbles/composed)
 * @param {Event} e - Triggering click event (its propagation is stopped)
 * @param {string} text - Text to copy
 * @param {{ successMessage?: string, errorMessage?: string }} [options]
 */
export async function copyToClipboardWithToast(
    host,
    e,
    text,
    { successMessage = 'Copied to clipboard', errorMessage = 'Failed to copy' } = {},
) {
    e.stopPropagation();
    try {
        await navigator.clipboard.writeText(text);
        host.dispatchEvent(
            new CustomEvent('show-toast', {
                detail: { text: successMessage, variant: 'positive' },
                bubbles: true,
                composed: true,
            }),
        );
    } catch (err) {
        console.error('Failed to copy:', err);
        host.dispatchEvent(
            new CustomEvent('show-toast', {
                detail: { text: errorMessage, variant: 'negative' },
                bubbles: true,
                composed: true,
            }),
        );
    }
}

/**
 * Renders a value with a hover tooltip and a copy-to-clipboard button.
 * @param {EventTarget} host - Element to dispatch the `show-toast` event on when copying
 * @param {string} value
 * @param {{ ariaLabel?: string, successMessage?: string, errorMessage?: string }} [options]
 * @returns {import('lit').TemplateResult}
 */
export function renderCopyableValue(host, value, { ariaLabel = 'Copy to clipboard', successMessage, errorMessage } = {}) {
    return html`<span class="copyable-value">
        <overlay-trigger triggered-by="hover">
            <div slot="trigger">${value}</div>
            <sp-tooltip slot="hover-content" placement="bottom"> ${value} </sp-tooltip>
        </overlay-trigger>
        <sp-action-button
            icon-only
            quiet
            aria-label=${ariaLabel}
            @click=${(e) => copyToClipboardWithToast(host, e, value, { successMessage, errorMessage })}
        >
            <sp-icon-copy slot="icon"></sp-icon-copy>
        </sp-action-button>
    </span>`;
}

/**
 * Renders a table cell showing a value with a hover tooltip and a copy-to-clipboard button,
 * or an empty-state label when there's no value.
 * @param {EventTarget} host - Element to dispatch the `show-toast` event on when copying
 * @param {string|null|undefined} value
 * @param {{ className?: string, emptyLabel?: string, ariaLabel?: string, successMessage?: string, errorMessage?: string }} [options]
 * @returns {import('lit').TemplateResult}
 */
export function renderCopyableValueCell(
    host,
    value,
    { className = 'offer-id', emptyLabel = 'no offer data', ...options } = {},
) {
    return html`
        <sp-table-cell class=${className}>${value ? renderCopyableValue(host, value, options) : emptyLabel}</sp-table-cell>
    `;
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
