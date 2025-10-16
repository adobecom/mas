import { html, LitElement, nothing } from 'lit';
import './editor-panel.js';
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
import './fields/user-picker.js';
import './mas-recently-updated.js';
import './editors/merch-card-editor.js';
import './editors/merch-card-collection-editor.js';
import { initUsers } from './users.js';
import './placeholders/mas-placeholders.js';
import './mas-recently-updated.js';
import './editors/merch-card-editor.js';
import './editors/merch-card-collection-editor.js';
import './mas-confirm-dialog.js';
import './mas-product-feed-dialog.js';
import './mas-card-preview.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import router from './router.js';
import { CONSUMER_FEATURE_FLAGS, PAGE_NAMES, WCS_ENV_PROD } from './constants.js';

const BUCKET_TO_ENV = {
    e155390: 'qa',
    e59471: 'stage',
    e59433: 'prod',
};

router.start();

class MasStudio extends LitElement {
    static properties = {
        bucket: { type: String, attribute: 'aem-bucket' },
        baseUrl: { type: String, attribute: 'base-url' },
        masJsReady: { type: Boolean, state: true },
    };

    #unsubscribeLocaleObserver;
    #unsubscribeLandscapeObserver;
    #unsubscribeConsumerObserver;
    constructor() {
        super();
        this.bucket = 'e59433';
        this.masJsReady = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.subscribeLocaleObserver();
        this.initMasJs();
        this.subscribeLandscapeObserver();
        this.subscribeConsumerObserver();
        initUsers();
    }

    initMasJs() {
        customElements.whenDefined('mas-commerce-service').then(() => (this.masJsReady = true));
    }

    get commerceService() {
        return document.querySelector('mas-commerce-service');
    }

    subscribeLocaleObserver() {
        const subscription = (value, oldValue) => {
            if (value.locale !== oldValue.locale) {
                this.renderCommerceService();
            }
        };
        Store.filters.subscribe(subscription);
        this.#unsubscribeLocaleObserver = () => Store.filters.unsubscribe(subscription);
    }

    subscribeLandscapeObserver() {
        const subscription = (value, oldValue) => {
            if (value !== oldValue) {
                this.commerceService.refreshOffers();
            }
        };
        Store.landscape.subscribe(subscription);
        this.#unsubscribeLandscapeObserver = () => Store.landscape.unsubscribe(subscription);
    }

    subscribeConsumerObserver() {
        const subscription = (value, oldValue) => {
            if (value.path !== oldValue.path) {
                this.renderCommerceService();
            }
        };
        Store.search.subscribe(subscription);
        this.#unsubscribeConsumerObserver = () => Store.search.unsubscribe(subscription);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#unsubscribeLocaleObserver();
        this.#unsubscribeLandscapeObserver();
        this.#unsubscribeConsumerObserver();
    }

    createRenderRoot() {
        return this;
    }

    get aemEnv() {
        return BUCKET_TO_ENV[this.bucket] || BUCKET_TO_ENV.e59433;
    }

    page = new StoreController(this, Store.page);
    landscape = new StoreController(this, Store.landscape);

    get content() {
        if (this.page.value !== PAGE_NAMES.CONTENT) return nothing;
        return html`<div id="content-container">
            <mas-toolbar></mas-toolbar>
            <mas-content></mas-content>
        </div> `;
    }

    get placeholders() {
        if (this.page.value !== PAGE_NAMES.PLACEHOLDERS) return nothing;
        return html` <mas-placeholders></mas-placeholders> `;
    }

    get splashScreen() {
        if (this.page.value !== PAGE_NAMES.WELCOME) return nothing;
        return html`<mas-splash-screen base-url=${this.baseUrl}></mas-splash-screen>`;
    }

    renderCommerceService() {
        const ffDefaults = CONSUMER_FEATURE_FLAGS[Store.search.value.path]?.['mas-ff-defaults'] ?? 'off';
        this.commerceService.outerHTML = `<mas-commerce-service env="${WCS_ENV_PROD}" locale="${Store.filters.value.locale}" data-mas-ff-defaults="${ffDefaults}"></mas-commerce-service>`;

        // Update service landscape settings based on Store.landscape
        if (this.commerceService?.settings && Store.landscape.value) {
            this.commerceService.settings.landscape = Store.landscape.value;
        }

        function rtePriceProvider(element, options) {
            if (element.dataset.template !== 'legal') return;
            if (!element.getRootNode()?.host?.nodeName === 'RTE-FIELD') return;
            options.displayPlanType = true;
        }
        if (typeof this.commerceService.providers?.price === 'function') {
            this.commerceService.providers.price(rtePriceProvider);
        } else {
            this.commerceService.addEventListener('wcms:commerce:ready', () => {
                this.commerceService.providers.price(rtePriceProvider);
            });
        }
    }

    update() {
        super.update();
        this.renderCommerceService();
    }

    render() {
        if (this.masJsReady) {
            console.log('mas.js is ready', this.masJsReady);
        }
        return html`
            <mas-top-nav aem-env="${this.aemEnv}"></mas-top-nav>
            <mas-repository bucket="${this.bucket}" base-url="${this.baseUrl}"></mas-repository>
            <div class="studio-content">
                <mas-side-nav></mas-side-nav>
                ${this.masJsReady
                    ? html`<div class="main-container">${this.splashScreen} ${this.content} ${this.placeholders}</div>`
                    : nothing}
            </div>
            <editor-panel></editor-panel>
            <mas-toast></mas-toast>
            <mas-confirm-dialog></mas-confirm-dialog>
            <mas-product-feed-dialog></mas-product-feed-dialog>
            <mas-card-preview></mas-card-preview>
        `;
    }
}

customElements.define('mas-studio', MasStudio);
