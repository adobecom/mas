import { LitElement, html, css } from 'lit';
import Events from './events.js';

class MasToast extends LitElement {
    static styles = css`
        :host {
            position: fixed;
            bottom: 10%;
            z-index: 1000;
        }

        .toast-action {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font: inherit;
            padding: 0;
            text-decoration: underline;
            margin-left: auto;
        }

        .toast-action:hover {
            opacity: 0.8;
        }
    `;

    static properties = {
        actionHandler: { type: Function, state: true },
        actionLabel: { type: String, state: true },
        content: { type: String, state: true },
        variant: { type: String, state: true },
        isOpen: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.show = this.show.bind(this);
        this.handleAction = this.handleAction.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.actionHandler = null;
        this.actionLabel = '';
        this.content = '';
        this.variant = 'info';
        this.isOpen = false;
    }

    connectedCallback() {
        super.connectedCallback();
        Events.toast.subscribe(this.show);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Events.toast.unsubscribe(this.show);
    }

    show({ variant, content, action }) {
        this.content = content;
        this.variant = variant;

        if (action) {
            this.actionLabel = action.label || 'UNDO';
            this.actionHandler = action.handler;
        } else {
            this.actionLabel = '';
            this.actionHandler = null;
        }

        this.isOpen = true;
    }

    handleAction() {
        if (this.actionHandler) {
            this.actionHandler();
        }
        this.handleClose();
    }

    handleClose() {
        this.isOpen = false;
        this.actionHandler = null;
        this.actionLabel = '';
    }

    render() {
        return html`
            <sp-toast timeout="6000" variant="${this.variant}" ?open="${this.isOpen}" @close="${this.handleClose}">
                <span>${this.content}${this.actionLabel ? ' | ' : ''}</span>
                ${this.actionLabel
                    ? html`<button class="toast-action" @click="${this.handleAction}">${this.actionLabel}</button>`
                    : ''}
            </sp-toast>
        `;
    }
}

customElements.define('mas-toast', MasToast);
