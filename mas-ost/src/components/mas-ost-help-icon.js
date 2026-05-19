import { LitElement, html, css, nothing } from 'lit';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-info.js';
import { store } from '../store/ost-store.js';

export class MasOstHelpIcon extends LitElement {
    static properties = {
        text: { type: String },
        open: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: inline-flex;
            align-items: center;
            position: relative;
        }

        sp-action-button {
            --mod-actionbutton-icon-size: 14px;
            opacity: 0.6;
        }

        sp-action-button:hover {
            opacity: 1;
        }

        .popover {
            position: absolute;
            top: calc(100% + 6px);
            left: 50%;
            transform: translateX(-50%);
            min-width: 240px;
            max-width: 320px;
            padding: 12px 14px;
            background: var(--spectrum-white, #fff);
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            font-size: 12px;
            line-height: 1.5;
            color: var(--spectrum-gray-800);
            z-index: 10;
            cursor: default;
        }

        .popover::before {
            content: '';
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
            width: 10px;
            height: 10px;
            background: var(--spectrum-white, #fff);
            border-left: 1px solid var(--spectrum-gray-300);
            border-top: 1px solid var(--spectrum-gray-300);
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
        document.addEventListener('click', this.handleOutsideClick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
        document.removeEventListener('click', this.handleOutsideClick);
    }

    handleStoreChange() {
        this.requestUpdate();
    }

    handleOutsideClick(e) {
        if (this.open && !e.composedPath().includes(this)) {
            this.open = false;
        }
    }

    toggle(e) {
        e.stopPropagation();
        this.open = !this.open;
    }

    render() {
        if (!store.helpMode) return nothing;
        return html`
            <sp-action-button quiet size="s" @click=${this.toggle}>
                <sp-icon-info slot="icon"></sp-icon-info>
            </sp-action-button>
            ${this.open ? html`<div class="popover">${this.text}</div>` : nothing}
        `;
    }
}

customElements.define('mas-ost-help-icon', MasOstHelpIcon);
