import { LitElement, html, nothing } from 'lit';
import Store from './store.js';
import { PAGE_NAMES } from './constants.js';

export class MasChatFab extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
    };

    constructor() {
        super();
        this.open = false;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.pageUnsubscribe = Store.page.subscribe(() => this.requestUpdate());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.pageUnsubscribe?.();
    }

    get isAIPage() {
        return Store.page.get() === PAGE_NAMES.AI_ASSISTANT;
    }

    toggleDrawer() {
        this.open = !this.open;
        this.dispatchEvent(
            new CustomEvent('chat-drawer-toggle', {
                detail: { open: this.open },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        if (this.isAIPage) return nothing;

        return html`
            <sp-action-button
                class="chat-fab ${this.open ? 'chat-fab-active' : ''}"
                size="l"
                @click=${this.toggleDrawer}
                title="${this.open ? 'Close AI Assistant' : 'Open AI Assistant'}"
            >
                ${this.open
                    ? html`<sp-icon-close slot="icon"></sp-icon-close>`
                    : html`<sp-icon-chat slot="icon"></sp-icon-chat>`}
            </sp-action-button>
        `;
    }
}

customElements.define('mas-chat-fab', MasChatFab);
