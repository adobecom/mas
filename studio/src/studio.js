import { html, LitElement, nothing } from 'lit';
import './editor-panel.js';
import './editors/merch-card-editor.js';
import './rte/rte-field.js';
import './rte/rte-link-editor.js';
import './rte/rte-icon-editor.js';
import './mas-top-nav.js';
import './mas-side-nav.js';
import './mas-toolbar.js';
import './mas-content.js';
import './mas-repository.js';
import './mas-toast.js';
import './mas-splash-screen.js';
import './filters/locale-picker.js';
import StoreController from './reactivity/store-controller.js';
import Store, { linkStoreToHash } from './store.js';
import { WCS_ENV_PROD, WCS_ENV_STAGE } from './constants.js';

const BUCKET_TO_ENV = {
    e155390: 'qa',
    e59471: 'stage',
    e59433: 'prod',
};

linkStoreToHash(Store.search, ['path', 'query']);
linkStoreToHash(Store.filters, ['locale', 'tags'], {
    locale: 'en_US',
    tags: [],
});
linkStoreToHash(Store.page, 'page', 'welcome');
linkStoreToHash(Store.commerceEnv, 'commerce.env', WCS_ENV_PROD);

class MasStudio extends LitElement {
    static properties = {
        bucket: { type: String, attribute: 'aem-bucket' },
        baseUrl: { type: String, attribute: 'base-url' },
    };

    constructor() {
        super();
        this.bucket = 'e59433';
    }

    // we need to completely remove&add element to the dom
    toggleCommerce(env) {
        const service = this.querySelector('mas-commerce-service');
        const newService = service.cloneNode(true);
        newService.setAttribute('env', env);
        service.remove();
        this.prepend(newService);
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    createRenderRoot() {
        return this;
    }

    get aemEnv() {
        return BUCKET_TO_ENV[this.bucket] || BUCKET_TO_ENV.e59433;
    }

    page = new StoreController(this, Store.page);
    commerceEnv = new StoreController(this, Store.commerceEnv);

    get content() {
        if (this.page.value !== 'content') return nothing;
        return html`<div id="content-container">
            <mas-toolbar></mas-toolbar>
            <mas-content></mas-content>
        </div> `;
    }

    get splashScreen() {
        if (this.page.value !== 'welcome') return nothing;
        return html`<mas-splash-screen
            base-url=${this.baseUrl}
        ></mas-splash-screen>`;
    }

    render() {
        return html`
            ${this.commerceEnv.value === WCS_ENV_STAGE
                ? html`<mas-commerce-service
                      env="${WCS_ENV_STAGE}"
                  ></mas-commerce-service>`
                : html`<mas-commerce-service></mas-commerce-service>`}
            <mas-top-nav aem-env="${this.aemEnv}"></mas-top-nav>
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
        `;
    }
}

customElements.define('mas-studio', MasStudio);
