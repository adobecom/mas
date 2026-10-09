import { html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { PAGE_NAMES } from '../../constants.js';
import Store from '../../store.js';
import { extractLocaleFromPath, extractSurfaceFromPath } from '../../utils.js';

const PAGE_ID_PARAM = {
    [PAGE_NAMES.TRANSLATION_EDITOR]: 'translationProjectId',
    [PAGE_NAMES.BULK_PUBLISH_EDITOR]: 'bulkPublishProjectId',
    [PAGE_NAMES.PROMOTIONS_EDITOR]: 'promotionId',
};

/**
 * Builds a deep link to the editor without changing the current Studio state.
 * @param {object} fragment
 * @param {object} [options]
 * @returns {string}
 */
export function buildEditorHref(fragment, options = {}) {
    const params = new URLSearchParams();
    const page = options.page ?? PAGE_NAMES.FRAGMENT_EDITOR;
    params.set('page', page);
    if (page === PAGE_NAMES.MASKS_EDITOR) {
        const maskName = fragment.fragmentName ?? fragment.path?.split('/').pop();
        if (maskName) params.set('maskName', maskName);
    } else {
        const idParam = PAGE_ID_PARAM[page] ?? 'fragmentId';
        params.set(idParam, fragment.id);
        if (idParam === 'fragmentId' && options.promotionId) params.set('promotionId', options.promotionId);
    }
    const surface = extractSurfaceFromPath(fragment.path) || Store.search.get().path;
    if (surface) params.set('path', surface);
    const region = extractLocaleFromPath(fragment.path) || Store.search.get().region;
    if (region) params.set('region', region);
    const locale = Store.filters.get().locale;
    if (locale) params.set('locale', locale);
    return `#${params}`;
}

function isNativeLinkGesture(event) {
    return event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
}

function handleLinkClick(event, options) {
    if (isNativeLinkGesture(event) || (event.detail === 0 && options.nativeKeyboard)) {
        event.stopPropagation();
        return;
    }
    event.preventDefault();
    if (event.detail === 0 && !options.selectionOnly) {
        event.stopPropagation();
        event.currentTarget.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true, detail: 2 }));
    }
}

function handleLinkDoubleClick(event) {
    if (isNativeLinkGesture(event)) event.stopPropagation();
}

function stopLinkPropagation(event) {
    event.stopPropagation();
}

function renderLink(fragment, label, options, overlay = false) {
    return html`<a
        class=${overlay ? 'row-link-overlay' : 'fragment-editor-link'}
        tabindex=${ifDefined(overlay ? '-1' : undefined)}
        aria-hidden=${ifDefined(overlay ? 'true' : undefined)}
        href=${options.href ?? buildEditorHref(fragment, options)}
        @click=${(event) => handleLinkClick(event, options)}
        @dblclick=${handleLinkDoubleClick}
        @auxclick=${stopLinkPropagation}
        @contextmenu=${stopLinkPropagation}
        >${label}</a
    >`;
}

/**
 * Renders a native editor link while preserving the containing row's interactions.
 * Enter reuses the row's double-click handler, unless the row only selects or uses native navigation.
 * @param {object} fragment
 * @param {string} label
 * @param {{page?: string, promotionId?: string, selectionOnly?: boolean, nativeKeyboard?: boolean, disabled?: boolean}} [options]
 * @returns {import('lit').TemplateResult|string}
 */
export function renderEditorLink(fragment, label, options = {}) {
    if (!fragment.id || options.disabled) return label;
    return renderLink(fragment, label, options);
}

/**
 * Renders an invisible link stretched over the whole row/item so Ctrl/Cmd+Click
 * and right-click "Open in new tab" work from anywhere on the item, not just
 * on the visible title text. Must be rendered as a direct child of the row
 * (a sibling of its cells), never nested inside a cell that truncates text
 * with `overflow: hidden`, otherwise the stretched area gets clipped.
 * @param {object} fragment
 * @param {{page?: string, promotionId?: string, href?: string, selectionOnly?: boolean, nativeKeyboard?: boolean, disabled?: boolean}} [options]
 * @returns {import('lit').TemplateResult|typeof nothing}
 */
export function renderRowLinkOverlay(fragment, options = {}) {
    if (options.disabled || (!fragment.id && !options.href)) return nothing;
    return renderLink(fragment, nothing, options, true);
}
