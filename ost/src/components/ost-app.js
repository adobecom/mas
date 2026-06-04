import { LitElement, html, css } from 'lit';
import './ost-entitlements-tab.js';
import './ost-offer-tab.js';
import './ost-help-banner.js';
import { store } from '../store/ost-store.js';
import { getOfferSelector } from '../utils/aos-client.js';

const ADOBE_FONTS_URL = 'https://use.typekit.net/pps7abe.css';
const PRODUCTS_ENDPOINT = 'https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read';

export class OstApp extends LitElement {
    static properties = {
        config: { type: Object },
        dialog: { type: Boolean, reflect: true },
        productsError: { type: String, state: true },
        usingFocusedOffer: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow: hidden;
            font-family:
                'adobe-clean',
                'adobe-clean-ux',
                system-ui,
                -apple-system,
                sans-serif;
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
            font-family:
                'adobe-clean',
                'adobe-clean-ux',
                system-ui,
                -apple-system,
                sans-serif;
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
            min-width: min(1100px, 90vw);
            height: 85vh;
            min-height: 640px;
            max-height: 95vh;
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
            flex-direction: column;
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }

        .ost-tabs {
            display: flex;
            justify-content: center;
            padding-top: 10px;
            flex-shrink: 0;
            background: var(--spectrum-gray-100);
        }

        .ost-tab-body {
            display: flex;
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }

        .ost-help-banner-wrapper {
            padding: 0 24px;
            background: var(--spectrum-gray-100);
            flex-shrink: 0;
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
        this.reapplyingDeepLink = false;
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
        this.maybeReapplyDeepLink();
        this.requestUpdate();
    }

    maybeReapplyDeepLink() {
        if (this.reapplyingDeepLink) return;
        if (store.wizardStep !== 'offer') return;
        if (store.selectedOffer || !store.initialOsi) return;
        this.reapplyingDeepLink = true;
        this.resolveDeepLinkOffer(store.initialOsi).finally(() => {
            this.reapplyingDeepLink = false;
        });
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
        const hasDeepLinkIntent = osiId || offerId || store.deepLink.type || store.aosParams.arrangementCode;
        if (hasDeepLinkIntent && store.wizardStep !== 'offer') {
            // A deep-linked open (RTE double-click on an existing CTA, chat OSI
            // attach) already has its target chosen — land directly on Tab 2.
            store.wizardStep = 'offer';
            store.notify();
        }
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
            if (store.allProducts.length > 0) {
                // Detach BEFORE calling setProduct — setProduct synchronously
                // fires state-changed, which would re-enter this handler and
                // recurse infinitely on a "Maximum call stack size" error.
                store.removeEventListener('state-changed', handler);
                tryResolve();
            }
        };
        store.addEventListener('state-changed', handler);
    }

    async resolveDeepLinkOffer(id) {
        store.initialOsi = id;
        try {
            const config = {
                accessToken: store.accessToken,
                apiKey: store.apiKey,
                baseUrl: store.baseUrl,
                env: store.env,
            };
            const result = await getOfferSelector(id, config);
            const code = result?.product_arrangement_code || result?.arrangement_code;
            if (!code) return;

            const aosUpdates = { arrangementCode: code };
            if (result.commitment) aosUpdates.commitment = result.commitment;
            if (result.term) aosUpdates.term = result.term;
            if (result.customer_segment) aosUpdates.customerSegment = result.customer_segment;
            const marketSegment = Array.isArray(result.market_segments) ? result.market_segments[0] : result.market_segment;
            if (marketSegment) aosUpdates.marketSegment = marketSegment;
            if (result.offer_type) aosUpdates.offerType = result.offer_type;
            store.setAosParams(aosUpdates);
            store.setOsi(id);

            this.resolveDeepLinkProduct(code);

            const handler = () => {
                if (store.offers.length > 0) {
                    store.removeEventListener('state-changed', handler);
                    const match = store.offers.find(
                        (o) => o.offer_type === result.offer_type && o.price_point === result.price_point,
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
            const { osi, type, offer, options, promoOverride, country } = detail;
            store.onSelect(osi, type, offer, options, promoOverride, country);
        }
    }

    selectMulti() {
        if (!store.canConfirmMultiSelect) return;
        const detail = {
            base: store.selectedBaseOsi ? { osi: store.selectedBaseOsi, offer: store.selectedBaseOffer } : null,
            trial: store.selectedTrialOsi ? { osi: store.selectedTrialOsi, offer: store.selectedTrialOffer } : null,
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

    handleFocusedBack() {
        store.selectedOffer = undefined;
        store.notify();
    }

    async handleFocusedUse() {
        const offer = store.selectedOffer;
        if (!offer || this.usingFocusedOffer) return;
        this.usingFocusedOffer = true;
        try {
            // In consult mode (chat-origin "Use") we hand back the offer
            // directly. The chat-input prefers `offer.offer_id` over the OSI
            // for deterministic lookups, so we don't need to create/resolve a
            // canonical OSI here. Skipping the POST /offer_selectors call
            // avoids a redundant AOS round-trip and the "No offers found"
            // state that can appear when that lookup fails.
            const passthroughOsi = offer.offer_id || offer.id || '';
            if (typeof store.onSelect === 'function') {
                store.onSelect(passthroughOsi, 'price', offer, {}, undefined, store.country);
            }
            this.dispatchEvent(
                new CustomEvent('ost-select', {
                    bubbles: true,
                    composed: true,
                    detail: { osi: passthroughOsi, offer, country: store.country },
                }),
            );
        } finally {
            this.usingFocusedOffer = false;
        }
    }

    handleBack() {
        // Tab-2 "Back": for single/consult, step back to Tab 1 (preserving the
        // chosen product). The consult focused-detail view has its own Back
        // (handleFocusedBack) that stays on Tab 2.
        store.goToEntitlements();
    }

    get wasDeepLinked() {
        // True when the OST was opened with a target offer already chosen
        // (RTE double-click, chat OSI attach).
        return !!(this.config?.searchOfferSelectorId || store.deepLink?.offerId);
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
        // The placeholder panel now lives inside ost-offer-tab; reach its
        // code-output through the tab's shadow root.
        const tab = this.shadowRoot.querySelector('ost-offer-tab');
        const panel = tab?.shadowRoot?.querySelector('ost-placeholder-panel');
        const codeOutput = panel?.shadowRoot?.querySelector('ost-code-output');
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

    // Tab footers dispatch intent events; ost-app owns the handlers so the
    // event/callback contracts (consumed by Studio's RTE + chat) stay here.
    onTabUse() {
        if (store.authoringFlow === 'consult' && store.selectedOffer) {
            this.handleFocusedUse();
            return;
        }
        this.handleFooterUse();
    }

    onTabBack() {
        if (store.authoringFlow === 'consult' && store.selectedOffer) {
            this.handleFocusedBack();
            return;
        }
        this.handleBack();
    }

    handleTabChange(e) {
        const next = e.target.selected;
        if (next === 'offer') {
            store.goToOffer();
        } else {
            store.goToEntitlements();
        }
    }

    render() {
        const closeButton = this.dialog
            ? html`<button
                  class="ost-close-btn"
                  aria-label="Close"
                  data-testid="ost-close-button"
                  @click=${() => this.cancel()}
              >
                  &times;
              </button>`
            : '';

        const headerBar = html`
            <div class="ost-header-bar">
                <span class="ost-title">Offer Selector Tool</span>
                <div class="ost-header-controls">
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
                    ${closeButton}
                </div>
            </div>
        `;

        const tabBody =
            store.wizardStep === 'offer'
                ? html`<ost-offer-tab
                      @ost-tab-use=${() => this.onTabUse()}
                      @ost-tab-back=${() => this.onTabBack()}
                      @ost-tab-cancel=${() => this.cancel()}
                  ></ost-offer-tab>`
                : html`<ost-entitlements-tab
                      .productsError=${this.productsError}
                      @ost-tab-cancel=${() => this.cancel()}
                  ></ost-entitlements-tab>`;

        const content = html`
            ${headerBar}
            <div class="ost-container">
                <div class="ost-tabs">
                    <sp-tabs size="m" selected=${store.wizardStep} @change=${(e) => this.handleTabChange(e)}>
                        <sp-tab label="Select your product and entitlements" value="entitlements"></sp-tab>
                        <sp-tab
                            label="Select your offer"
                            value="offer"
                            ?disabled=${!store.canAdvance && store.wizardStep !== 'offer'}
                        ></sp-tab>
                    </sp-tabs>
                </div>
                ${store.helpMode ? html`<div class="ost-help-banner-wrapper"><ost-help-banner></ost-help-banner></div>` : ''}
                <div class="ost-tab-body">${tabBody}</div>
            </div>
        `;

        return html`
            <sp-theme system="spectrum-two" color="light" scale="medium">
                ${this.dialog
                    ? html`
                          <div class="ost-backdrop" @click=${() => this.cancel()}></div>
                          <div class="ost-dialog" data-testid="ost-modal">${content}</div>
                      `
                    : html`<div data-testid="ost-modal">${content}</div>`}
            </sp-theme>
        `;
    }
}

customElements.define('ost-app', OstApp);
