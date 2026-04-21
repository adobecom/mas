import '../utils/safe-define.js';
import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/theme/spectrum-two/theme-light.js';
import '@spectrum-web-components/theme/spectrum-two/scale-medium.js';
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/button/sp-button.js';
import './mas-ost-country-picker.js';
import './mas-ost-search.js';
import './mas-ost-filter-bar.js';
import './mas-ost-product-list.js';
import './mas-ost-product-detail.js';
import './mas-ost-placeholder-panel.js';
import './mas-ost-promo-tag.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-info.js';
import '@spectrum-web-components/picker/sp-picker.js';
import '@spectrum-web-components/menu/sp-menu.js';
import '@spectrum-web-components/menu/sp-menu-item.js';
import './mas-ost-welcome-screen.js';
import './mas-ost-selection-list.js';
import './mas-ost-help-banner.js';
import { store } from '../store/ost-store.js';
import { getOfferSelector } from '../utils/aos-client.js';

const ADOBE_FONTS_URL = 'https://use.typekit.net/pps7abe.css';
const PRODUCTS_ENDPOINT =
    'https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read';

export class MasOstApp extends LitElement {
    static properties = {
        config: { type: Object },
        dialog: { type: Boolean, reflect: true },
        productsError: { type: String, state: true },
    };

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow: hidden;
            font-family: 'adobe-clean', 'adobe-clean-ux', system-ui, -apple-system, sans-serif;
        }

        :host([dialog]) {
            position: fixed;
            inset: 0;
            height: auto;
            z-index: var(--ost-z-index, 20000);
        }

        sp-theme {
            display: block;
            height: 100%;
            overflow: hidden;
        }

        .ost-header-bar,
        .ost-container,
        .ost-footer-bar,
        .ost-dialog {
            font-family: 'adobe-clean', 'adobe-clean-ux', system-ui, -apple-system, sans-serif;
        }

        :host([dialog]) sp-theme {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ost-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
        }

        .ost-dialog {
            position: relative;
            display: flex;
            flex-direction: column;
            width: min(1100px, 90vw);
            height: 85vh;
            background: var(--spectrum-white, #fff);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            z-index: 1;
        }

        .ost-dialog .ost-container {
            flex: 1;
            overflow: hidden;
        }

        .ost-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 20px;
            background: var(--spectrum-gray-50);
            border-bottom: 1px solid var(--spectrum-gray-200);
            flex-shrink: 0;
        }

        .ost-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--spectrum-gray-900);
        }

        .ost-header-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .ost-footer-bar {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            height: 52px;
            padding: 0 16px;
            gap: 8px;
            background: var(--spectrum-gray-50);
            border-top: 1px solid var(--spectrum-gray-200);
            flex-shrink: 0;
        }

        .ost-container {
            display: flex;
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }

        .ost-left-panel {
            width: 340px;
            min-width: 340px;
            display: flex;
            flex-direction: column;
            border-right: 1px solid var(--spectrum-gray-200);
            background: var(--spectrum-gray-75);
            overflow: hidden;
        }

        .ost-left-header {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 16px;
            flex-shrink: 0;
            border-bottom: 1px solid var(--spectrum-gray-200);
        }

        .ost-left-products-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--spectrum-gray-600);
            padding: 8px 16px 0;
            flex-shrink: 0;
        }

        .ost-left-panel mas-ost-product-list {
            flex: 1;
            overflow-y: auto;
            overscroll-behavior: contain;
            padding: 0 12px 16px;
        }

        .ost-left-panel-error {
            margin: 0 16px 12px;
            padding: 10px 12px;
            border: 1px solid var(--spectrum-red-300, #f5c2c7);
            border-radius: 8px;
            background: var(--spectrum-red-75, #fff1f1);
            color: var(--spectrum-red-900, #c9252d);
            font-size: 12px;
            line-height: 1.4;
        }

        .ost-right-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 24px;
            overflow-y: auto;
            overscroll-behavior: contain;
            min-width: 0;
            min-height: 0;
            background: var(--spectrum-white, #fff);
        }

        .ost-close-btn {
            appearance: none;
            background: transparent;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            color: var(--spectrum-gray-700);
            font-size: 16px;
            line-height: 1;
            transition: background 0.15s;
        }

        .ost-close-btn:hover {
            background: var(--spectrum-gray-200);
        }

        .ost-close-btn:focus-visible {
            outline: 2px solid var(--spectrum-blue-900);
            outline-offset: 2px;
        }

    `;

    constructor() {
        super();
        this.dialog = false;
        this.productsError = '';
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
        if (store.zIndex) {
            this.style.setProperty('--ost-z-index', store.zIndex);
        }
        this.ensureAdobeFonts();
        this.ensureCommerceService();
        this.fetchProducts();
    }

    ensureAdobeFonts() {
        if (document.querySelector(`link[href="${ADOBE_FONTS_URL}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = ADOBE_FONTS_URL;
        document.head.appendChild(link);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    handleStoreChange() {
        this.requestUpdate();
    }

    updated(changed) {
        if (changed.has('config') && this.config) {
            store.init(this.config);
            this.ensureCommerceService();
            this.applyDeepLink();
        }
    }

    applyDeepLink() {
        const params = this.config?.searchParameters;
        if (params) {
            store.applySearchParams(params);
        }
        const osiId = this.config?.searchOfferSelectorId;
        const offerId = store.deepLink.offerId;
        if (osiId || offerId) {
            this.resolveDeepLinkOffer(osiId || offerId);
        } else if (store.aosParams.arrangementCode) {
            this.resolveDeepLinkProduct(store.aosParams.arrangementCode);
        }
    }

    resolveDeepLinkProduct(arrangementCode) {
        const tryResolve = () => {
            const match = store.allProducts.find(([, product]) => {
                const code = product.arrangement_code || product.code || '';
                return code === arrangementCode;
            });
            if (match) {
                store.setProduct(match[1]);
                return true;
            }
            return false;
        };
        if (tryResolve()) return;
        const handler = () => {
            if (store.allProducts.length > 0 && tryResolve()) {
                store.removeEventListener('state-changed', handler);
            }
        };
        store.addEventListener('state-changed', handler);
    }

    async resolveDeepLinkOffer(id) {
        try {
            const config = {
                accessToken: store.accessToken,
                apiKey: store.apiKey,
                baseUrl: store.baseUrl,
                env: store.env,
            };
            const result = await getOfferSelector(id, config);
            const code =
                result?.product_arrangement_code ||
                result?.arrangement_code;
            if (!code) return;

            const aosUpdates = { arrangementCode: code };
            if (result.commitment)
                aosUpdates.commitment = result.commitment;
            if (result.term) aosUpdates.term = result.term;
            if (result.customer_segment)
                aosUpdates.customerSegment = result.customer_segment;
            if (result.market_segment)
                aosUpdates.marketSegment = result.market_segment;
            if (result.offer_type)
                aosUpdates.offerType = result.offer_type;
            store.setAosParams(aosUpdates);
            store.setOsi(id);

            this.resolveDeepLinkProduct(code);

            const handler = () => {
                if (store.offers.length > 0) {
                    store.removeEventListener('state-changed', handler);
                    const match = store.offers.find(
                        (o) =>
                            o.offer_type === result.offer_type &&
                            o.price_point === result.price_point,
                    );
                    if (match) {
                        store.setOffer(match);
                    } else if (store.offers.length === 1) {
                        store.setOffer(store.offers[0]);
                    }
                }
            };
            store.addEventListener('state-changed', handler);
        } catch {
            /* OSI resolution failed */
        }
    }

    async fetchProducts() {
        if (store.allProducts.length > 0) return;
        if (window?.tacocat?.products) {
            this.productsError = '';
            store.setProducts(Object.entries(window.tacocat.products));
            return;
        }
        this.productsError = '';
        store.productsLoading = true;
        store.notify();
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(store.accessToken ? { Authorization: `Bearer ${store.accessToken}` } : {}),
            };
            const adobeIMS = window.adobeIMS;
            if (store.accessToken) {
                headers['x-gw-ims-org-id'] = adobeIMS?.adobeIdData?.imsOrg || '';
                headers['x-api-key'] = adobeIMS?.adobeIdData?.client_id || store.apiKey || '';
            }

            const response = await fetch(PRODUCTS_ENDPOINT, {
                headers,
            });
            if (!response.ok) {
                throw new Error(`Product catalog request failed (${response.status})`);
            }
            const data = await response.json();
            if (!data?.combinedProducts) {
                throw new Error('Product catalog response did not include combinedProducts');
            }
            window.tacocat = window.tacocat || {};
            window.tacocat.products = data.combinedProducts;
            store.setProducts(Object.entries(data.combinedProducts));
        } catch (err) {
            this.productsError = err?.message || 'Unable to load products.';
            store.setProducts([]);
        }
        store.productsLoading = false;
        store.notify();
    }

    ensureCommerceService() {
        if (store.masCommerceService) return;
        let el = document.querySelector('mas-commerce-service');
        if (!el) {
            let root = this.getRootNode();
            while (root && !el) {
                el = root.querySelector?.('mas-commerce-service');
                if (!el && root.host) {
                    root = root.host.getRootNode();
                } else {
                    break;
                }
            }
        }
        if (!el) {
            el = document.createElement('mas-commerce-service');
            document.body.appendChild(el);
        }
        store.masCommerceService = el;
    }

    select(detail) {
        this.dispatchEvent(
            new CustomEvent('ost-select', {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
        if (typeof store.onSelect === 'function') {
            const { osi, type, offer, options, promoOverride, country } =
                detail;
            store.onSelect(osi, type, offer, options, promoOverride, country);
        }
    }

    selectMulti() {
        if (!store.canConfirmMultiSelect) return;
        const detail = {
            base: store.selectedBaseOsi
                ? { osi: store.selectedBaseOsi, offer: store.selectedBaseOffer }
                : null,
            trial: store.selectedTrialOsi
                ? { osi: store.selectedTrialOsi, offer: store.selectedTrialOffer }
                : null,
            country: store.country,
        };
        this.dispatchEvent(
            new CustomEvent('ost-multi-select', {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
        if (typeof store.onMultiSelect === 'function') {
            store.onMultiSelect(detail);
        }
    }

    cancel() {
        this.dispatchEvent(
            new CustomEvent('ost-cancel', {
                bubbles: true,
                composed: true,
            }),
        );
        if (typeof store.onCancel === 'function') {
            store.onCancel();
        }
    }

    renderRightPanel() {
        const state = store.viewState;
        if (state === 'welcome') {
            return html`<mas-ost-welcome-screen></mas-ost-welcome-screen>`;
        }
        if (state === 'configure') {
            return html`
                <mas-ost-product-detail summary></mas-ost-product-detail>
                <mas-ost-placeholder-panel></mas-ost-placeholder-panel>
                <mas-ost-promo-tag></mas-ost-promo-tag>
            `;
        }
        return html`
            <mas-ost-product-detail></mas-ost-product-detail>
        `;
    }

    renderContent() {
        const showSelectionList = store.authoringFlow === 'tryBuy' || store.authoringFlow === 'bundle';
        return html`
            ${showSelectionList ? html`<mas-ost-selection-list></mas-ost-selection-list>` : ''}
            <div class="ost-container">
                <div class="ost-left-panel">
                    <div class="ost-left-header">
                        <mas-ost-search></mas-ost-search>
                        <mas-ost-filter-bar></mas-ost-filter-bar>
                    </div>
                    ${this.productsError
                        ? html`<div class="ost-left-panel-error">${this.productsError}</div>`
                        : ''}
                    <div class="ost-left-products-label">Products</div>
                    <mas-ost-product-list></mas-ost-product-list>
                </div>
                <div class="ost-right-panel">
                    <mas-ost-help-banner></mas-ost-help-banner>
                    ${this.renderRightPanel()}
                </div>
            </div>
        `;
    }


    handleBack() {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
        store.notify();
    }

    handleFooterUse() {
        const flow = store.authoringFlow;
        if (flow === 'tryBuy') {
            this.selectMulti();
            return;
        }
        if (flow === 'bundle') {
            this.selectBundle();
            return;
        }
        if (flow === 'consult') {
            this.cancel();
            return;
        }
        const panel = this.shadowRoot.querySelector('mas-ost-placeholder-panel');
        const codeOutput = panel?.shadowRoot?.querySelector('mas-ost-code-output');
        if (codeOutput) {
            codeOutput.handleUse();
        }
    }

    selectBundle() {
        if (!store.canConfirm) return;
        const detail = {
            offers: store.selectedOffers.map((o) => ({ osi: o.osi, offer: o.offer })),
            country: store.country,
        };
        this.dispatchEvent(
            new CustomEvent('ost-bundle-select', {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
        if (typeof store.onBundleSelect === 'function') {
            store.onBundleSelect(detail);
        }
    }

    render() {
        const headerBar = html`
            <div class="ost-header-bar">
                <span class="ost-title">Offer Selector Tool</span>
                <div class="ost-header-controls">
                    <mas-ost-country-picker></mas-ost-country-picker>
                    <sp-picker
                        size="s"
                        label="Authoring mode"
                        value=${store.authoringFlow}
                        @change=${(e) => store.setAuthoringFlow(e.target.value)}
                    >
                        <sp-menu-item value="tryBuy">Try / Buy</sp-menu-item>
                        <sp-menu-item value="bundle">Soft Bundle</sp-menu-item>
                        <sp-menu-item value="consult">Consult</sp-menu-item>
                    </sp-picker>
                    <sp-action-button
                        quiet
                        size="s"
                        class="ost-help-toggle"
                        ?selected=${store.helpMode}
                        @click=${() => store.toggleHelp()}
                    >
                        <sp-icon-info slot="icon"></sp-icon-info>
                        Help
                    </sp-action-button>
                    ${this.dialog
                        ? html`<button
                              class="ost-close-btn"
                              aria-label="Close"
                              @click=${() => this.cancel()}
                          >&times;</button>`
                        : ''}
                </div>
            </div>
        `;

        const flow = store.authoringFlow;
        let useLabel = 'Use';
        let useDisabled = true;

        if (flow === 'single') {
            useDisabled = store.viewState !== 'configure';
        } else if (flow === 'tryBuy') {
            useDisabled = !store.canConfirm;
            useLabel = store.selectedTrialOsi ? 'Use both offers' : 'Use base offer only';
        } else if (flow === 'bundle') {
            useDisabled = !store.canConfirm;
            useLabel = `Use bundle (${store.selectedOffers.length} offers)`;
        } else if (flow === 'consult') {
            useLabel = 'Close';
            useDisabled = false;
        }

        const footerBar = html`
            <div class="ost-footer-bar">
                ${flow === 'single' && store.viewState === 'configure'
                    ? html`<sp-button
                          variant="secondary"
                          size="m"
                          @click=${() => this.handleBack()}
                      >Back</sp-button>`
                    : ''}
                <sp-button
                    variant="${flow === 'consult' ? 'secondary' : 'accent'}"
                    size="m"
                    ?disabled=${useDisabled}
                    @click=${() => this.handleFooterUse()}
                >${useLabel}</sp-button>
            </div>
        `;

        const content = html`
            ${headerBar}
            ${this.renderContent()}
            ${footerBar}
        `;

        return html`
            <sp-theme
                system="spectrum-two"
                color="light"
                scale="medium"
            >
                ${this.dialog
                    ? html`
                          <div class="ost-backdrop" @click=${() => this.cancel()}></div>
                          <div class="ost-dialog">
                              ${content}
                          </div>
                      `
                    : content}
            </sp-theme>
        `;
    }
}

customElements.define('mas-ost-app', MasOstApp);
