import { LitElement, html, css } from 'lit';
import Events from './events.js';

class MasToast extends LitElement {
    static styles = css`
        :host {
            position: fixed;
            bottom: 10%;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }

        sp-toast:not([open]) {
            display: none;
        }

        .pinned {
            --mod-toast-negative-background-color-default: var(--spectrum-orange-900);
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

    show({ variant, content, pinned = false }) {
        const toast = this.shadowRoot.querySelector(pinned ? '.pinned' : '.auto-close');
        if (toast) {
            toast.textContent = content;
            toast.variant = variant;
            toast.open = true;
        }
    }

    render() {
        return html`
            <sp-toast class="auto-close" timeout="6000"></sp-toast>
            <sp-toast class="pinned" timeout="30000"></sp-toast>
        `;
    }
}

customElements.define('mas-toast', MasToast);
