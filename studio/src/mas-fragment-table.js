import { LitElement, html } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import { generateCodeToUse, getService, showToast } from './utils.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from './editor-panel.js';
import Store from './store.js';
import { closePreview, openPreview } from './mas-card-preview.js';
import { CARD_MODEL_PATH } from './constants.js';
import { MasRepository } from './mas-repository.js';
import router from './router.js';
import './mas-variation-dialog.js';

class MasFragmentTable extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        offerData: { type: Object, state: true, attribute: false },
        expanded: { type: Boolean, attribute: false },
        nested: { type: Boolean, attribute: false },
        toggleExpand: { type: Function, attribute: false },
        showVariationDialog: { state: true },
        failedPrice: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.offerData = null;
        this.expanded = false;
        this.nested = false;
        this.showVariationDialog = false;
        this.failedPrice = false;
    }

    #reactiveControllers = new ReactiveController(this);

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadOfferData();
    }

    getFragmentName(data) {
        const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
        const fragmentParts = getFragmentPartsToUse(Store, data).fragmentParts;
        return `${webComponentName}: ${fragmentParts}`;
    }

    get data() {
        return this.fragmentStore.value;
    }

    async loadOfferData() {
        this.failedPrice = false;
        const wcsOsi = this.data.getFieldValue('osi');
        if (!wcsOsi) return;
        try {
            const service = getService();
            const priceOptions = service.collectPriceOptions({ wcsOsi });
            const [offersPromise] = service.resolveOfferSelectors(priceOptions);
            if (!offersPromise) {
                this.failedPrice = true;
                return;
            }
            const [offer] = await offersPromise;
            if (!offer) {
                this.failedPrice = true;
                return;
            }
            this.offerData = offer;
        } catch (error) {
            this.failedPrice = true;
        }
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore')) {
            this.#reactiveControllers.updateStores([this.fragmentStore]);
        }
        super.update(changedProperties);
    }

    get icon() {
        const iconSrc = this.data.getFieldValue('mnemonicIcon'); // Returns only the first one
        if (!iconSrc) return '';
        return html`<img class="mnemonic-icon" src=${this.data.getFieldValue('mnemonicIcon')} />`;
    }

    get name() {
        return generateCodeToUse(this.data, Store.search.get().path, Store.page.get()).authorPath;
    }

    get price() {
        const osi = this.data.getFieldValue('osi');
        if (!osi) return '';
        if (this.failedPrice) {
            return html`<span style="color: #D73220; font-weight: 600;">Price Unavailable</span>`;
        }
        return html`<span is="inline-price" data-template="price" data-wcs-osi=${osi}></span>`;
    }

    openCardPreview() {
        openPreview(this.fragmentStore.value.id, { left: 'min(300px, 15%)' });
    }

    handleActionsClick(event) {
        event.stopPropagation();
        const actionMenu = event.currentTarget.querySelector('sp-action-menu');
        if (actionMenu) {
            actionMenu.open = !actionMenu.open;
        }
    }

    handleCreateVariation(event) {
        event.stopPropagation();
        this.showVariationDialog = true;
    }

    handleVariationDialogCancel() {
        this.showVariationDialog = false;
    }

    handleFragmentCopied(event) {
        this.showVariationDialog = false;
        const { fragment } = event.detail;
        if (fragment?.id) {
            const locale = this.extractLocaleFromPath(fragment.path);
            router.navigateToFragmentEditor(fragment.id, { locale });
        }
    }

    handleEditFragment(event) {
        event.stopPropagation();
        const fragment = this.fragmentStore.value;
        if (fragment?.id) {
            const locale = this.extractLocaleFromPath(fragment.path);
            router.navigateToFragmentEditor(fragment.id, { locale });
        }
    }

    extractLocaleFromPath(path) {
        if (!path) return null;
        const parts = path.split('/');
        const masIndex = parts.indexOf('mas');
        if (masIndex === -1) return null;
        return parts[masIndex + 2] || null;
    }

    getTruncatedOfferId() {
        const offerId = this.offerData?.offerId;
        if (!offerId || offerId.length <= 5) return offerId;
        return `...${offerId.slice(-5)}`;
    }

    async copyOfferIdToClipboard(e) {
        e.stopPropagation();
        const offerId = this.offerData?.offerId;
        if (!offerId) return;

        try {
            await navigator.clipboard.writeText(offerId);
            showToast('Offer ID copied to clipboard', 'positive');
        } catch (err) {
            console.error('Failed to copy offer ID:', err);
            showToast('Failed to copy Offer ID', 'negative');
        }
    }

    render() {
        const data = this.fragmentStore.value;
        return html`
            ${this.showVariationDialog
                ? html`<mas-variation-dialog
                      .fragment=${data}
                      .isVariation=${false}
                      @cancel=${this.handleVariationDialogCancel}
                      @fragment-copied=${this.handleFragmentCopied}
                  ></mas-variation-dialog>`
                : ''}
            <sp-table-row
                value="${data.id}"
                class="${this.expanded ? 'expanded' : ''} ${this.failedPrice ? 'price-failed' : ''}"
            >
                ${this.nested
                    ? ''
                    : html`<sp-table-cell class="expand-cell" @click=${this.toggleExpand}>
                          <button class="expand-button" aria-label="${this.expanded ? 'Collapse' : 'Expand'} row">
                              ${this.expanded
                                  ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                                  : html`<sp-icon-chevron-right></sp-icon-chevron-right>`}
                          </button>
                      </sp-table-cell>`}
                <sp-table-cell class="name">
                    ${this.nested ? html`${data.locale}` : html`${this.icon} ${this.getFragmentName(data)}`}
                </sp-table-cell>
                <sp-table-cell class="title">${data.title}</sp-table-cell>
                <sp-table-cell class="offer-id">
                    <span class="offer-id-text" title=${this.offerData?.offerId}> ${this.getTruncatedOfferId()} </span>
                    ${this.offerData?.offerId
                        ? html`<button
                              class="copy-icon-button"
                              aria-label="Copy Offer ID to clipboard"
                              @click=${this.copyOfferIdToClipboard}
                          >
                              <sp-icon-copy class="copy-icon"></sp-icon-copy>
                          </button>`
                        : ''}
                </sp-table-cell>
                <sp-table-cell class="offer-type">${this.offerData?.offerType}</sp-table-cell>
                <sp-table-cell class="last-modified-by">${data.modified?.by}</sp-table-cell>
                <sp-table-cell class="price">${this.price}</sp-table-cell>
                <sp-table-cell class="status ${data.status?.toLowerCase()}-cell"
                    ><div class="status-dot"></div>
                    <span class="status-text">${data.status}</span></sp-table-cell
                >
                <sp-table-cell class="actions">
                    ${this.failedPrice
                        ? html`<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M8.99943 13.611C8.79185 13.6183 8.58959 13.5446 8.43548 13.4055C8.13818 13.0773 8.13818 12.5775 8.43548 12.2494C8.5879 12.1069 8.79083 12.0309 8.99946 12.0381C9.21217 12.0296 9.41876 12.1103 9.56918 12.2608C9.71504 12.4117 9.79342 12.6153 9.78641 12.8249C9.79755 13.0361 9.72378 13.2431 9.58148 13.3997C9.42526 13.5478 9.2144 13.6243 8.99943 13.611Z"
                                  fill="#D73220"
                              />
                              <path
                                  d="M9 10.575C8.62734 10.575 8.325 10.2727 8.325 9.9V6.3C8.325 5.92735 8.62734 5.625 9 5.625C9.37265 5.625 9.675 5.92735 9.675 6.3V9.9C9.675 10.2727 9.37265 10.575 9 10.575Z"
                                  fill="#D73220"
                              />
                              <path
                                  d="M15.0601 16.2H2.93993C2.21967 16.2 1.56928 15.8308 1.20058 15.2121C0.831873 14.5933 0.816051 13.8454 1.15883 13.2117L7.21889 2.00917C7.57309 1.35438 8.25557 0.947449 8.99999 0.947449C9.74442 0.947449 10.4269 1.35438 10.7811 2.00917L16.8412 13.2117C17.1839 13.8454 17.1681 14.5934 16.7994 15.2121C16.4307 15.8309 15.7803 16.2 15.0601 16.2ZM8.99999 2.29745C8.87914 2.29745 8.579 2.33173 8.40629 2.65077L2.34623 13.8533C2.18143 14.1583 2.30097 14.422 2.36029 14.5204C2.41918 14.6197 2.59364 14.85 2.93993 14.85H15.06C15.4063 14.85 15.5808 14.6197 15.6397 14.5204C15.699 14.422 15.8185 14.1583 15.6537 13.8533L9.5937 2.65077C9.421 2.33173 9.12085 2.29745 8.99999 2.29745Z"
                                  fill="#D73220"
                              />
                          </svg>`
                        : html`<sp-action-menu placement="bottom-end" quiet>
                              <sp-icon-more slot="icon"></sp-icon-more>
                              ${!this.nested
                                  ? html`<sp-menu-item @click=${this.handleCreateVariation}>
                                        <sp-icon-user-group slot="icon"></sp-icon-user-group>
                                        Create variation
                                    </sp-menu-item>`
                                  : ''}
                              <sp-menu-item @click=${this.handleEditFragment}>
                                  <sp-icon-edit slot="icon"></sp-icon-edit>
                                  Edit fragment
                              </sp-menu-item>
                          </sp-action-menu>`}
                </sp-table-cell>
                ${data.model?.path === CARD_MODEL_PATH
                    ? html`<sp-table-cell class="preview" @mouseover=${this.openCardPreview} @mouseout=${closePreview}
                          ><sp-icon-preview label="Preview item"></sp-icon-preview
                      ></sp-table-cell>`
                    : html`<sp-table-cell class="preview"></sp-table-cell>`}
            </sp-table-row>
        `;
    }
}

customElements.define('mas-fragment-table', MasFragmentTable);
