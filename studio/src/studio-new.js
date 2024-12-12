import { html, LitElement, nothing } from 'lit';
import './editors/merch-card-editor.js';
import './rte/rte-field.js';
import './rte/rte-link-editor.js';
import './mas-top-nav.js';
import './mas-side-nav.js';
import './mas-toolbar.js';
import './mas-content.js';
import './mas-fetcher.js';
import './mas-toast.js';
import './mas-hash-manager.js';
import './mas-splash-screen.js';
import StoreController from './reactivity/storeController.js';
import Store from './store.js';

const BUCKET_TO_ENV = {
    e155390: 'qa',
    e59471: 'stage',
    e59433: 'prod',
};

class MasStudio extends LitElement {
    static properties = {
        bucket: { type: String, attribute: 'aem-bucket' },
        baseUrl: { type: String, attribute: 'base-url' },
    };

    constructor() {
        super();
        this.bucket = 'e59433';
    }

    createRenderRoot() {
        return this;
    }

    get env() {
        return BUCKET_TO_ENV[this.bucket] || BUCKET_TO_ENV.e59433;
    }

    currentPage = new StoreController(this, Store.currentPage);

    get content() {
        if (this.currentPage.value !== 'content') return nothing;
        return html`<div id="content-container">
            <mas-toolbar></mas-toolbar>
            <mas-content></mas-content>
        </div> `;
    }

    get splashScreen() {
        if (this.currentPage.value !== 'splash') return nothing;
        return html`<mas-splash-screen
            base-url=${this.baseUrl}
        ></mas-splash-screen>`;
    }

    render() {
        return html`
            <mas-top-nav env="${this.env}"></mas-top-nav>
            <mas-fetcher
                bucket="${this.bucket}"
                base-url="${this.baseUrl}"
            ></mas-fetcher>
            <div class="studio-content">
                <mas-side-nav></mas-side-nav>
                <div class="main-container">
                    ${this.splashScreen} ${this.content}
                </div>
            </div>
            <merch-card-editor></merch-card-editor>
            <mas-toast></mas-toast>
            <mas-hash-manager></mas-hash-manager>
        `;
    }
}

customElements.define('mas-studio', MasStudio);
