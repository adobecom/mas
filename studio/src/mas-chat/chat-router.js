import { html, nothing } from 'lit';
import { PAGE_NAMES } from '../constants.js';
import { getStudioFeatures, isFeaturePageEnabled } from './features.js';

const stylesUrl = new URL('../styles/chat.css', import.meta.url).href;

/** Renders enabled feature pages after their lazy imports succeed. */
export function renderChatPages(pageValue, load) {
    if (!isFeaturePageEnabled(pageValue)) return nothing;
    if (pageValue === PAGE_NAMES.AI_ASSISTANT) {
        if (!load('mas-chat', './mas-chat.js')) return nothing;
        return html`<div class="mas-feature"><link rel="stylesheet" href=${stylesUrl} /><mas-chat></mas-chat></div>`;
    }
    if (pageValue === PAGE_NAMES.PRODUCT_CATALOG) {
        if (!load('mas-product-catalog', './mas-product-catalog.js')) return nothing;
        return html`<div class="mas-feature">
            <link rel="stylesheet" href=${stylesUrl} />
            <div id="content-container">
                <mas-product-catalog></mas-product-catalog>
            </div>
        </div>`;
    }
    if (pageValue === PAGE_NAMES.PRODUCT_DETAIL) {
        if (!load('mas-product-detail', './mas-product-detail.js')) return nothing;
        return html`<div class="mas-feature">
            <link rel="stylesheet" href=${stylesUrl} />
            <div id="content-container">
                <mas-product-detail></mas-product-detail>
            </div>
        </div>`;
    }
    return nothing;
}

/** Loads only the launcher until an author explicitly opens the drawer. */
export function renderChatOverlay(onToggle, load, open) {
    if (!getStudioFeatures().assistant) return nothing;
    if (!load('mas-chat-fab', './mas-chat-fab.js')) return nothing;
    return html`
        <div class="mas-feature">
            <link rel="stylesheet" href=${stylesUrl} />
            <mas-chat-fab .open=${open} @chat-drawer-toggle=${onToggle}></mas-chat-fab>
            ${open && load('mas-chat-drawer', './mas-chat-drawer.js')
                ? html`<mas-chat-drawer open @chat-drawer-toggle=${onToggle}></mas-chat-drawer>`
                : nothing}
        </div>
    `;
}

/** Keeps assistant visibility separate from shared authoring state. */
export function handleChatDrawerToggle(event, host) {
    host.chatDrawerOpen = event.detail.open;
}
