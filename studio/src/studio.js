import { html, LitElement, nothing } from 'lit';
import './rte/rte-field.js';
import './rte/rte-link-editor.js';
import './rte/rte-icon-editor.js';
import './mas-top-nav.js';
import './mas-side-nav.js';
import './mas-toolbar.js';
import './mas-content.js';
import './mas-promotions.js';
import './mas-promotions-editor.js';
import './mas-translation.js';
import './mas-translation-editor.js';
import './mas-repository.js';
import './mas-toast.js';
import './mas-splash-screen.js';
import './fields/user-picker.js';
import './mas-recently-updated.js';
import './mas-nav-folder-picker.js';
import './mas-fragment-editor.js';
import './editor-panel.js';
import './editors/merch-card-editor.js';
import './editors/merch-card-collection-editor.js';
import { initUsers } from './users.js';
import './placeholders/mas-placeholders.js';
import './mas-confirm-dialog.js';
import './mas-card-preview.js';
import './version-page.js';
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
        this.addEventListener('fragment-loaded', this.handleFragmentLoaded);
        initUsers();
    }

    handleFragmentLoaded = () => {
        this.requestUpdate();
    };

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
        const regionSubscription = (value, oldValue) => {
            if (value.region !== oldValue.region) {
                this.renderCommerceService();
            }
        };
        Store.search.subscribe(regionSubscription);
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
        this.removeEventListener('fragment-loaded', this.handleFragmentLoaded);
    }

    createRenderRoot() {
        return this;
    }

    get aemEnv() {
        return BUCKET_TO_ENV[this.bucket] || BUCKET_TO_ENV.e59433;
    }

    page = new StoreController(this, Store.page);
    landscape = new StoreController(this, Store.landscape);
    viewMode = new StoreController(this, Store.viewMode);

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

    get versionPage() {
        if (this.page.value !== PAGE_NAMES.VERSION) return nothing;
        return html`<version-page></version-page>`;
    }

    get fragmentEditor() {
        if (this.page.value !== PAGE_NAMES.FRAGMENT_EDITOR) return nothing;
        return html`<mas-fragment-editor></mas-fragment-editor>`;
    }

    get breadcrumbs() {
        // Define navigation handlers
        const handlers = {
            content: async () => {
                Store.viewMode.set('default');
                await router.navigateToPage(PAGE_NAMES.CONTENT)();
            },
            editor: async () => {
                const fragmentId = Store.version.fragmentId.get();
                if (fragmentId) {
                    await router.navigateToFragmentEditor(fragmentId);
                }
            },
        };

        // Define breadcrumb configurations for each page
        const breadcrumbConfig = {
            [PAGE_NAMES.FRAGMENT_EDITOR]: {
                condition: () => {
                    const editor = document.querySelector('mas-fragment-editor');
                    return editor && editor.fragment && !editor.fragmentStore?.loading;
                },
                items: [{ label: 'Fragments table', handler: handlers.content }, { label: 'Editor' }],
            },
            [PAGE_NAMES.VERSION]: {
                items: [
                    { label: 'Fragments table', handler: handlers.content },
                    { label: 'Editor', handler: handlers.editor },
                    { label: 'Version history' },
                ],
            },
        };

        const config = breadcrumbConfig[this.page.value];
        if (!config) return nothing;
        if (config.condition && !config.condition()) return nothing;

        return html`
            <div class="breadcrumbs-container">
                <sp-breadcrumbs>
                    ${config.items.map(
                        (item) => html`
                            <sp-breadcrumb-item @click="${item.handler || nothing}">${item.label}</sp-breadcrumb-item>
                        `,
                    )}
                </sp-breadcrumbs>
            </div>
        `;
    }

    get promotions() {
        if (this.page.value !== PAGE_NAMES.PROMOTIONS) return nothing;
        return html`<mas-promotions></mas-promotions>`;
    }

    get promotionsEditor() {
        if (this.page.value !== PAGE_NAMES.PROMOTIONS_EDITOR) return nothing;
        return html`<mas-promotions-editor></mas-promotions-editor>`;
    }

    get translation() {
        if (this.page.value !== PAGE_NAMES.TRANSLATIONS) return nothing;
        return html`<mas-translation></mas-translation>`;
    }

    get translationEditor() {
        if (this.page.value !== PAGE_NAMES.TRANSLATION_EDITOR) return nothing;
        return html`<mas-translation-editor></mas-translation-editor>`;
    }

    renderCommerceService() {
        const ffDefaults = CONSUMER_FEATURE_FLAGS[Store.surface()]?.['mas-ff-defaults'] ?? 'on';
        this.commerceService.outerHTML = `<mas-commerce-service env="${WCS_ENV_PROD}" locale="${Store.localeOrRegion()}" data-mas-ff-defaults="${ffDefaults}"></mas-commerce-service>`;

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

    get topNav() {
        return html`<mas-top-nav aem-env="${this.aemEnv}" show-pickers></mas-top-nav>`;
    }

    get sideNav() {
        return html`<mas-side-nav></mas-side-nav>`;
    }

    render() {
        return html`
            ${this.topNav}
            <mas-repository bucket="${this.bucket}" base-url="${this.baseUrl}"></mas-repository>
            <div class="studio-content">
                ${this.sideNav} ${this.breadcrumbs}
                ${this.masJsReady
                    ? html`<div class="main-container">
                          ${this.splashScreen} ${this.content} ${this.placeholders} ${this.fragmentEditor} ${this.promotions}
                          ${this.promotionsEditor} ${this.versionPage} ${this.translation} ${this.translationEditor}
                          <editor-panel></editor-panel>
                      </div>`
                    : nothing}
            </div>
            <mas-toast></mas-toast>
            <mas-confirm-dialog></mas-confirm-dialog>
            <mas-card-preview></mas-card-preview>
        `;
    }
}

customElements.define('mas-studio', MasStudio);
