import { html } from 'lit';
import { PAGE_NAMES } from '../../constants.js';
import Store from '../../store.js';
import { extractLocaleFromPath, extractSurfaceFromPath } from '../../utils.js';

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
        params.set('maskName', fragment.fragmentName ?? fragment.path.split('/').pop());
    } else if (page === PAGE_NAMES.TRANSLATION_EDITOR) {
        params.set('translationProjectId', fragment.id);
    } else if (page === PAGE_NAMES.BULK_PUBLISH_EDITOR) {
        params.set('bulkPublishProjectId', fragment.id);
    } else if (page === PAGE_NAMES.PROMOTIONS_EDITOR) {
        params.set('promotionId', fragment.id);
    } else {
        params.set('fragmentId', fragment.id);
        if (options.promotionId) params.set('promotionId', options.promotionId);
    }
    const surface = extractSurfaceFromPath(fragment.path) || Store.search.get().path;
    if (surface) params.set('path', surface);
    const region = extractLocaleFromPath(fragment.path) || Store.search.get().region;
    if (region) params.set('region', region);
    const locale = Store.filters.get().locale;
    if (locale) params.set('locale', locale);
    const url = new URL(window.location.href);
    url.hash = params.toString();
    return url.href;
}

function isNativeLinkGesture(event) {
    return event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
}

function handleLinkClick(event) {
    if (isNativeLinkGesture(event) || event.detail === 0) {
        event.stopPropagation();
        return;
    }
    event.preventDefault();
}

function handleLinkDoubleClick(event) {
    if (isNativeLinkGesture(event)) event.stopPropagation();
}

function stopLinkPropagation(event) {
    event.stopPropagation();
}

/**
 * Renders a native editor link while preserving the containing row's interactions.
 * @param {object} fragment
 * @param {string} label
 * @param {object} [options]
 * @returns {import('lit').TemplateResult|string}
 */
export function renderEditorLink(fragment, label, options = {}) {
    if (!fragment.id) return label;
    return html`<a
        class="fragment-editor-link"
        href=${buildEditorHref(fragment, options)}
        @click=${handleLinkClick}
        @dblclick=${handleLinkDoubleClick}
        @auxclick=${stopLinkPropagation}
        @contextmenu=${stopLinkPropagation}
        >${label}</a
    >`;
}

/**
 * Renders an invisible link stretched over the whole row/item so Ctrl/Cmd+Click
 * and right-click "Open in new tab" work from anywhere on the item, not just
 * on the visible title text. Must be rendered as a direct child of the row
 * (a sibling of its cells), never nested inside a cell that truncates text
 * with `overflow: hidden`, otherwise the stretched area gets clipped.
 * @param {object} fragment
 * @param {object} [options]
 * @returns {import('lit').TemplateResult|string}
 */
export function renderRowLinkOverlay(fragment, options = {}) {
    if (!fragment.id) return '';
    return html`<a
        class="row-link-overlay"
        tabindex="-1"
        aria-hidden="true"
        href=${buildEditorHref(fragment, options)}
        @click=${handleLinkClick}
        @dblclick=${handleLinkDoubleClick}
        @auxclick=${stopLinkPropagation}
        @contextmenu=${stopLinkPropagation}
    ></a>`;
}
