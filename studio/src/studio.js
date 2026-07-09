import { html, LitElement, nothing } from 'lit';
import './mas-top-nav.js';
import './mas-side-nav.js';
import './mas-toolbar.js';
import './mas-content.js';
import './mas-repository.js';
import './mas-toast.js';
import './fields/user-picker.js';
import './common/fields/tree-picker-field.js';
import './mas-recently-updated.js';
import './mas-nav-folder-picker.js';
import { initUsers } from './users.js';
import './mas-confirm-dialog.js';
import './mas-card-preview.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import router from './router.js';
import { CONSUMER_FEATURE_FLAGS, PAGE_NAMES, PICKERS, WCS_ENV_PROD } from './constants.js';
import './utils/price-error-handler.js';

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
    #pendingImports = new Set();
    #failedImports = new Set();
    constructor() {
        super();
        this.bucket = 'e59433';
        this.masJsReady = false;
    }

    connectedCallback() {
        super.connectedCallback();
        Store.settings.initAem(this.bucket, this.baseUrl);
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
        this.#pendingImports = new Set();
        this.#failedImports = new Set();
    }

    createRenderRoot() {
        return this;
    }

    #lazyLoad(elementName, importPath) {
        if (customElements.get(elementName)) return true;
        if (this.#failedImports.has(elementName)) return false;
        if (!this.#pendingImports.has(elementName)) {
            this.#pendingImports.add(elementName);
            import(importPath).catch(() => {
                this.#pendingImports.delete(elementName);
                this.#failedImports.add(elementName);
                console.error(`Failed to load ${elementName} from ${importPath}`);
                Events.toast.emit({ variant: 'negative', content: `Failed to load page` });
            });
            customElements.whenDefined(elementName).then(() => this.requestUpdate());
        }
        return false;
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
        </div>`;
    }

    get placeholders() {
        if (this.page.value !== PAGE_NAMES.PLACEHOLDERS) return nothing;
        if (!this.#lazyLoad('mas-placeholders', './placeholders/mas-placeholders.js')) return nothing;
        return html` <mas-placeholders></mas-placeholders> `;
    }

    get settings() {
        if (this.page.value !== PAGE_NAMES.SETTINGS && this.page.value !== PAGE_NAMES.SETTINGS_EDITOR) return nothing;
        if (!this.#lazyLoad('mas-settings', './settings/mas-settings.js')) return nothing;
        return html`<mas-settings bucket=${this.bucket} base-url=${this.baseUrl}></mas-settings>`;
    }

    get masks() {
        if (this.page.value !== PAGE_NAMES.MASKS && this.page.value !== PAGE_NAMES.MASKS_EDITOR) return nothing;
        if (!this.#lazyLoad('mas-masks', './masks/mas-masks.js')) return nothing;
        return html`<mas-masks bucket=${this.bucket} base-url=${this.baseUrl}></mas-masks>`;
    }

    get splashScreen() {
        if (this.page.value !== PAGE_NAMES.WELCOME) return nothing;
        if (!this.#lazyLoad('mas-splash-screen', './mas-splash-screen.js')) return nothing;
        return html`<mas-splash-screen base-url=${this.baseUrl}></mas-splash-screen>`;
    }

    get versionPage() {
        if (this.page.value !== PAGE_NAMES.VERSION) return nothing;
        if (!this.#lazyLoad('version-page', './version-page.js')) return nothing;
        return html`<version-page></version-page>`;
    }

    get fragmentEditor() {
        if (this.page.value !== PAGE_NAMES.FRAGMENT_EDITOR) return nothing;
        if (!this.#lazyLoad('mas-fragment-editor', './mas-fragment-editor.js')) return nothing;
        return html`<mas-fragment-editor></mas-fragment-editor>`;
    }

    get promotions() {
        if (this.page.value !== PAGE_NAMES.PROMOTIONS) return nothing;
        if (!this.#lazyLoad('mas-promotions', './promotions/mas-promotions.js')) return nothing;
        return html`<mas-promotions></mas-promotions>`;
    }

    get promotionsEditor() {
        if (this.page.value !== PAGE_NAMES.PROMOTIONS_EDITOR) return nothing;
        if (!this.#lazyLoad('mas-promotions-editor', './promotions/mas-promotions-editor.js')) return nothing;
        return html`<mas-promotions-editor></mas-promotions-editor>`;
    }

    get translation() {
        if (this.page.value !== PAGE_NAMES.TRANSLATIONS) return nothing;
        if (!this.#lazyLoad('mas-translation', './translation/mas-translation.js')) return nothing;
        return html`<mas-translation></mas-translation>`;
    }

    get translationEditor() {
        if (this.page.value !== PAGE_NAMES.TRANSLATION_EDITOR) return nothing;
        if (!this.#lazyLoad('mas-translation-editor', './translation/mas-translation-editor.js')) return nothing;
        return html`<mas-translation-editor></mas-translation-editor>`;
    }

    get bulkPublish() {
        if (this.page.value !== PAGE_NAMES.BULK_PUBLISH) return nothing;
        if (!this.#lazyLoad('mas-bulk-publish', './bulk-publish/mas-bulk-publish.js')) return nothing;
        return html`<mas-bulk-publish></mas-bulk-publish>`;
    }

    get bulkPublishEditor() {
        if (this.page.value !== PAGE_NAMES.BULK_PUBLISH_EDITOR) return nothing;
        if (!this.#lazyLoad('mas-bulk-publish-editor', './bulk-publish/mas-bulk-publish-editor.js')) return nothing;
        return html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`;
    }

    get advancedTools() {
        if (this.page.value !== PAGE_NAMES.ADVANCED_TOOLS) return nothing;
        if (!this.#lazyLoad('mas-advanced-tools', './mas-advanced-tools.js')) return nothing;
        return html`<mas-advanced-tools></mas-advanced-tools>`;
    }

    get pickersToHide() {
        if ([PAGE_NAMES.PROMOTIONS_EDITOR, PAGE_NAMES.PROMOTIONS].includes(this.page.value)) {
            return [PICKERS.FOLDER, PICKERS.LOCALE];
        }
        return [];
    }

    renderCommerceService() {
        const ffDefaults = CONSUMER_FEATURE_FLAGS[Store.surface()]?.['mas-ff-defaults'] ?? 'on';
        this.commerceService.outerHTML = `<mas-commerce-service env="${WCS_ENV_PROD}" locale="${Store.localeOrRegion()}" data-mas-ff-defaults="${ffDefaults}" preview="true"></mas-commerce-service>`;

        // Update service landscape settings based on Store.landscape
        if (this.commerceService?.settings && Store.landscape.value) {
            this.commerceService.settings.landscape = Store.landscape.value;
        }

        function rtePriceProvider(element, options) {
            if (element.dataset.template !== 'legal') return;
            if (element.getRootNode()?.host?.nodeName !== 'RTE-FIELD') return;
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

    update(changedProperties) {
        super.update(changedProperties);
        if (changedProperties.has('masJsReady') && this.masJsReady) {
            this.renderCommerceService();
        }
    }

    get topNav() {
        return html`<mas-top-nav aem-env="${this.aemEnv}" .pickersToHide="${this.pickersToHide}"></mas-top-nav>`;
    }

    get sideNav() {
        return html`<mas-side-nav></mas-side-nav>`;
    }

    get editorPanel() {
        if (this.page.value !== PAGE_NAMES.CONTENT) return nothing;
        if (!this.#lazyLoad('editor-panel', './editor-panel.js')) return nothing;
        return html`<editor-panel></editor-panel>`;
    }

    render() {
        return html`
            ${this.topNav}
            <mas-repository bucket="${this.bucket}" base-url="${this.baseUrl}"></mas-repository>
            <div class="studio-content">
                ${this.sideNav}
                ${this.masJsReady
                    ? html`<div class="main-container">
                          ${this.splashScreen} ${this.content} ${this.placeholders} ${this.fragmentEditor} ${this.promotions}
                          ${this.promotionsEditor} ${this.versionPage} ${this.translation} ${this.translationEditor}
                          ${this.bulkPublish} ${this.bulkPublishEditor} ${this.advancedTools} ${this.editorPanel}
                          ${this.settings} ${this.masks}
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
