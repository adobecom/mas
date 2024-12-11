import { LitElement, html } from 'lit';
import { contentIcon } from './img/content-icon.js';
import { promosIcon } from './img/promos-icon.js';
import { ostIcon } from './img/ost-icon.js';
import Store from './store.js';
import StoreController from './reactivity/storeController.js';
import './mas-recently-updated.js';

class MasSplashScreen extends LitElement {
    static properties = {
        baseUrl: { type: String, attribute: 'base-url' },
    };

    createRenderRoot() {
        return this;
    }

    search = new StoreController(this, Store.search);

    render() {
        return html`<div id="splash-container">
            <h1>Welcome, Nick</h1>
            <div class="quick-actions">
                <h2>Quick Actions</h2>
                <div class="actions-grid">
                    <div
                        class="quick-action-card"
                        @click=${() => Store.currentPage.set('content')}
                        heading="Go to Content"
                    >
                        <div slot="cover-photo">${contentIcon}</div>
                        <div slot="heading">Go To Content</div>
                    </div>
                    <div
                        class="quick-action-card"
                        @click=${this.viewPromotions}
                    >
                        <div slot="cover-photo">${promosIcon}</div>
                        <div slot="heading">View Promotions</div>
                    </div>
                    <div class="quick-action-card" @click=${this.openOst}>
                        <div slot="cover-photo">${ostIcon}</div>
                        <div slot="heading">Open Offer Selector Tool</div>
                    </div>
                </div>
            </div>
            <div class="recently-updated">
                <mas-recently-updated source="aem" base-url="${this.baseUrl}">
                </mas-recently-updated>
            </div>
        </div>`;
    }
}

customElements.define('mas-splash-screen', MasSplashScreen);
