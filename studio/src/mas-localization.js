import { LitElement, html } from 'lit';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';

class MasLocalization extends LitElement {
    page = new StoreController(this, Store.page);

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <div class="localization-container">
                <h1>Localization</h1>
                <p>Localization page content goes here</p>
            </div>
        `;
    }
}

customElements.define('mas-localization', MasLocalization);
