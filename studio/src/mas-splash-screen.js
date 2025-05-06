import { LitElement, html } from 'lit';
import { contentIcon } from './img/content-icon.js';
import { ostIcon } from './img/ost-icon.js';
import router from './router.js';
import './mas-recently-updated.js';
import { openOfferSelectorTool } from './rte/ost.js';
import { PAGE_NAMES } from './constants.js';

class MasSplashScreen extends LitElement {
    static properties = {
        baseUrl: { type: String, attribute: 'base-url' },
    };

    async firstUpdated() {
        super.firstUpdated();
        try {
            const profile = await window.adobeIMS?.getProfile();
            const [firstName] = (profile?.displayName ?? 'User').split(' ');
            this.userName = firstName;
            this.requestUpdate();
        } catch (e) {
            this.userName = 'User';
        }
    }

    createRenderRoot() {
        return this;
    }

    openOst() {
        openOfferSelectorTool();
    }

    render() {
        return html`<div id="splash-container">
            <h1>Welcome, ${this.userName}</h1>
            <div class="quick-actions">
                <h2>Quick Actions</h2>
                <div class="actions-grid">
                    <div
                        class="quick-action-card"
                        @click=${router.navigateToPage(PAGE_NAMES.CONTENT)}
                        heading="Go to Content"
                    >
                        <div slot="cover-photo">${contentIcon}</div>
                        <div slot="heading">Go To Content</div>
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
