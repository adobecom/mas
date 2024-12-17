import { LitElement, html, css } from 'lit';
import Events from './events.js';

class MasToast extends LitElement {
    static styles = css`
        :host {
            position: fixed;
            bottom: 10%;
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

    show({ variant, content }) {
        const toast = this.shadowRoot.querySelector('sp-toast');
        if (toast) {
            toast.textContent = content;
            toast.variant = variant;
            toast.open = true;
        }
    }

    render() {
        return html`<sp-toast timeout="6000"></sp-toast>`;
    }
}

customElements.define('mas-toast', MasToast);
