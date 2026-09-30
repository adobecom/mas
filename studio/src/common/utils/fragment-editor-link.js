import { html, nothing } from 'lit';
import { getHashParams } from '../../utils.js';
import { PAGE_NAMES } from '../../constants.js';

/**
 * Builds the fragment-editor deep-link hash for a fragment, matching the format
 * historically produced by mas-fragment-editor's getFragmentEditorUrl(): the current
 * URL's other hash params (surface, locale, filters, etc.) are preserved, since that
 * mirrors what router.navigateToFragmentEditor() leaves in the hash today.
 * @param {string} fragmentId
 * @param {{ path?: string }} [options] - Explicit surface `path` to set, overriding the current one.
 * @returns {string}
 */
export function getFragmentEditorHref(fragmentId, { path } = {}) {
    const params = getHashParams();
    params.set('page', PAGE_NAMES.FRAGMENT_EDITOR);
    params.set('fragmentId', fragmentId);
    if (path) params.set('path', path);
    return `#${params.toString()}`;
}

/**
 * True for pointer events that should fall through to native browser handling
 * (new tab, new window, or the context menu) instead of a row's in-page click handler.
 * @param {MouseEvent} event
 * @returns {boolean}
 */
export function isNativeNewTabClick(event) {
    return event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
}

/**
 * Renders `content` inside a real anchor for `href`, so native Ctrl/Cmd+Click,
 * middle-click and right-click "Open Link in New Tab" work without any custom
 * context menu. A plain click is intercepted and delegated to `onPlainClick`, so
 * the row keeps its existing selection/expand/navigation behaviour unchanged.
 * This is the one shared anchor+click pattern every deep-linked row uses,
 * whatever editor `href` points at (fragment editor, mask editor, etc).
 * @param {{href: string, className?: string, content: unknown, onPlainClick?: (event: MouseEvent) => void}} options
 * @returns {import('lit').TemplateResult}
 */
export function renderNewTabAwareLink({ href, className, content, onPlainClick }) {
    return html`<a
        href=${href}
        class=${className ?? nothing}
        style="color: inherit; text-decoration: none;"
        @click=${(event) => {
            if (isNativeNewTabClick(event)) return;
            event.preventDefault();
            onPlainClick?.(event);
        }}
        >${content}</a
    >`;
}

/**
 * `renderNewTabAwareLink` pointed at the fragment editor deep-link for `fragmentId`.
 * @param {{fragmentId: string, path?: string, className?: string, content: unknown, onPlainClick?: (event: MouseEvent) => void}} options
 * @returns {import('lit').TemplateResult}
 */
export function renderFragmentEditorLink({ fragmentId, path, className, content, onPlainClick }) {
    return renderNewTabAwareLink({ href: getFragmentEditorHref(fragmentId, { path }), className, content, onPlainClick });
}
