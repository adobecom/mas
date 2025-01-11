import { html, LitElement, nothing } from 'lit';
import './editor-panel.js';
import './editors/merch-card-editor.js';
import './rte/rte-field.js';
import './rte/rte-link-editor.js';
import './mas-top-nav.js';
import './mas-side-nav.js';
import './mas-toolbar.js';
import './mas-content.js';
import './mas-repository.js';
import './mas-toast.js';
import './mas-hash-manager.js';
import './mas-splash-screen.js';
import StoreController from './reactivity/store-controller.js';
import Store, { navigateToPage } from './store.js';

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

    connectedCallback() {
        super.connectedCallback();
    }

    handleInitialPageLoad() {
        const url = new URL(window.location.href);
        const pageParam = url.searchParams.get('page');

        if (pageParam === 'welcome') {
            navigateToPage('splash')();
            history.pushState({}, '', url.toString());
            return;
        } else {
            url.searchParams.delete('page');
            history.replaceState({}, '', url.toString());
            navigateToPage('content')();
        }
    }

    render() {
        return html`
            <mas-top-nav env="${this.env}"></mas-top-nav>
            <mas-repository
                bucket="${this.bucket}"
                base-url="${this.baseUrl}"
            ></mas-repository>
            <div class="studio-content">
                <mas-side-nav></mas-side-nav>
                <div class="main-container">
                    ${this.splashScreen} ${this.content}
                </div>
            </div>
            <editor-panel></editor-panel>
            <mas-toast></mas-toast>
            <mas-hash-manager></mas-hash-manager>
        `;
    }
}

customElements.define('mas-studio', MasStudio);
