import { LitElement, html, css } from 'lit';
import Events from './events.js';

const AUTO_CLOSE_TIMEOUT_MS = 6000;

class MasToast extends LitElement {
    static styles = css`
        :host {
            position: fixed;
            bottom: 10%;
            z-index: 1000;
        }
    `;

    constructor() {
        super();
        this.show = this.show.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        Events.toast.subscribe(this.show);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Events.toast.unsubscribe(this.show);
    }

    show({ variant, content, persistent = false }) {
        const toast = this.shadowRoot.querySelector('sp-toast');
        if (toast) {
            toast.textContent = content;
            toast.variant = variant;
            toast.timeout = persistent ? null : AUTO_CLOSE_TIMEOUT_MS;
            toast.open = true;
        }
    }

    render() {
        return html`<sp-toast timeout="${AUTO_CLOSE_TIMEOUT_MS}"></sp-toast>`;
    }
}

customElements.define('mas-toast', MasToast);
