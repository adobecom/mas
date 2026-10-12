import { html, nothing } from 'lit';
import { PAGE_NAMES } from '../constants.js';
import '../mas-chat.js';
import '../mas-chat-fab.js';
import '../mas-chat-drawer.js';
import '../mas-product-catalog.js';
import '../mas-product-detail.js';

export function renderChatPages(pageValue) {
    if (pageValue === PAGE_NAMES.AI_ASSISTANT) {
        return html`<mas-chat></mas-chat>`;
    }
    if (pageValue === PAGE_NAMES.PRODUCT_CATALOG) {
        return html`<div id="content-container">
            <mas-product-catalog></mas-product-catalog>
        </div>`;
    }
    if (pageValue === PAGE_NAMES.PRODUCT_DETAIL) {
        return html`<div id="content-container">
            <mas-product-detail></mas-product-detail>
        </div>`;
    }
    return nothing;
}

export function renderChatOverlay(onToggle) {
    return html`
        <mas-chat-fab @chat-drawer-toggle=${onToggle}></mas-chat-fab>
        <mas-chat-drawer @chat-drawer-toggle=${onToggle}></mas-chat-drawer>
    `;
}

export function handleChatDrawerToggle(event, host) {
    const drawer = host.querySelector('mas-chat-drawer');
    const fab = host.querySelector('mas-chat-fab');
    const { open } = event.detail;
    if (drawer) drawer.open = open;
    if (fab) fab.open = open;
}
