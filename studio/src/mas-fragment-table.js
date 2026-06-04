import { LitElement, html, css } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import { extractLocaleFromPath, generateCodeToUse, getService, showToast, previewFragmentOnPage } from './utils.js';
import { getFragmentName } from './translation/translation-utils.js';
import Store from './store.js';
import { closePreview, openPreview } from './mas-card-preview.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from './constants.js';
import { MasRepository } from './mas-repository.js';
import router from './router.js';
import './mas-variation-dialog.js';

class MasFragmentTable extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        editFragmentStore: { type: Object, attribute: false },
        offerData: { type: Object, state: true, attribute: false },
        expanded: { type: Boolean, attribute: false },
        nested: { type: Boolean, attribute: false },
        canCreateVariation: { type: Boolean, attribute: false },
        toggleExpand: { type: Function, attribute: false },
        showVariationDialog: { state: true },
        failedPrice: { type: Boolean, state: true },
    };

    static styles = css`
        .price-error-title {
            color: var(--merch-color-error, #d73220);
            font-weight: 600;
        }
    `;

    constructor() {
        super();
        this.offerData = null;
        this.editFragmentStore = null;
        this.expanded = false;
        this.nested = false;
        this.canCreateVariation = true;
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
            return html`<span class="price-error-title">Price unavailable</span>`;
        }
        return html`<span is="inline-price" data-template="price" data-wcs-osi=${osi}></span>`;
    }

    openCardPreview() {
        // Centered horizontally and vertically — actual placement done in CSS.
        openPreview(this.fragmentStore.value.id, {});
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
            const locale = extractLocaleFromPath(fragment.path);
            const viewPage = this.data?.model?.path === COLLECTION_MODEL_PATH;
            router.navigateToFragmentEditor(fragment.id, { locale, viewPage });
        }
    }

    handleEditFragment(event) {
        event.stopPropagation();
        const editorStore = this.editFragmentStore || this.fragmentStore;
        const fragment = editorStore?.get?.() || editorStore?.value;
        if (fragment?.id) {
            const locale = extractLocaleFromPath(fragment.path);
            router.navigateToFragmentEditor(fragment.id, { locale, fragmentStore: editorStore });
        }
    }

    previewOnPage(event) {
        event.stopPropagation();
        previewFragmentOnPage(this.fragmentStore.value);
    }

    async copyCode(event) {
        event.stopPropagation();
        const { code, richText, href } = generateCodeToUse(this.data, Store.search.get().path, Store.page.get());
        if (!code || !richText || !href) return;

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([href], { type: 'text/plain' }),
                    'text/html': new Blob([richText], { type: 'text/html' }),
                }),
            ]);
            showToast('Code copied to clipboard', 'positive');
        } catch (e) {
            showToast('Failed to copy code to clipboard', 'negative');
        }
    }

    getTruncatedOfferId() {
        const offerId = this.offerData?.offerId;
        if (!offerId || offerId.length <= 5) return offerId;
        return `...${offerId.slice(-5)}`;
    }

    // Display offer type in sentence case (Base, Trial, Promo) regardless of
    // the casing stored on the data (which is typically all caps).
    get formattedOfferType() {
        const t = this.offerData?.offerType;
        if (!t) return '';
        return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    }

    // Display status in sentence case (Draft, Modified, Published…) regardless
    // of how it's stored (typically all caps).
    get formattedStatus() {
        const s = this.fragmentStore.value?.status;
        if (!s) return '';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
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
                      .offerData=${this.offerData}
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
                    ${this.nested
                        ? html`<span class="path-text">${data.locale}</span>`
                        : html`<div class="icon">${this.icon}</div>
                              <span class="path-text">${getFragmentName(data)}</span>`}
                </sp-table-cell>
                <sp-table-cell class="title">${data.title || html`<span class="cell-empty">-</span>`}</sp-table-cell>
                <sp-table-cell class="offer-id">
                    ${this.offerData?.offerId
                        ? html`<overlay-trigger placement="top" hover-only>
                                  <span slot="trigger" class="offer-id-text">${this.offerData.offerId}</span>
                                  <sp-tooltip
                                      slot="hover-content"
                                      placement="top"
                                      style="max-width: 160px; white-space: normal; word-break: break-all; text-align: center;"
                                  >
                                      ${this.offerData.offerId}
                                  </sp-tooltip>
                              </overlay-trigger>
                              <button
                                  class="copy-icon-button"
                                  aria-label="Copy Offer ID to clipboard"
                                  @click=${this.copyOfferIdToClipboard}
                              >
                                  <sp-icon-copy class="copy-icon"></sp-icon-copy>
                              </button>`
                        : html`<span class="cell-empty">-</span>`}
                </sp-table-cell>
                <sp-table-cell class="offer-type">
                    ${this.formattedOfferType || html`<span class="cell-empty">-</span>`}
                </sp-table-cell>
                <sp-table-cell class="last-modified-by">
                    ${data.modified?.by || html`<span class="cell-empty">-</span>`}
                </sp-table-cell>
                <sp-table-cell class="price">${this.price || html`<span class="cell-empty">-</span>`}</sp-table-cell>
                <sp-table-cell class="status ${data.status?.toLowerCase()}-cell"
                    ><div class="status-dot"></div>
                    <span class="status-text">${this.formattedStatus}</span></sp-table-cell
                >
                <sp-table-cell class="actions">
                    ${this.failedPrice
                        ? html`<sp-icon-alert class="price-error-icon"></sp-icon-alert>`
                        : html`<sp-action-menu placement="bottom-end" quiet>
                              <sp-icon-more slot="icon"></sp-icon-more>
                              <sp-menu-item
                                  @click=${this.handleCreateVariation}
                                  ?hidden=${this.nested || !this.canCreateVariation}
                              >
                                  <sp-icon slot="icon">
                                      <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="20"
                                          height="20"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                          aria-hidden="true"
                                      >
                                          <path
                                              d="M16 8.75C16.4142 8.75 16.75 8.41421 16.75 8C16.75 7.58579 16.4142 7.25 16 7.25C15.5858 7.25 15.25 7.58579 15.25 8C15.25 8.41421 15.5858 8.75 16 8.75Z"
                                          />
                                          <path
                                              d="M11.5 9.875C10.7417 9.875 10.125 9.2583 10.125 8.5C10.125 7.7417 10.7417 7.125 11.5 7.125C12.2583 7.125 12.875 7.7417 12.875 8.5C12.875 9.2583 12.2583 9.875 11.5 9.875ZM11.5 8.125C11.2935 8.125 11.125 8.29346 11.125 8.5C11.125 8.70654 11.2935 8.875 11.5 8.875C11.7065 8.875 11.875 8.70654 11.875 8.5C11.875 8.29346 11.7065 8.125 11.5 8.125Z"
                                          />
                                          <path
                                              d="M15.75 11H4.99475L10.7134 4.36572C11.4951 3.45849 11.4424 2.12646 10.5947 1.39599L10.2725 1.11865C9.85107 0.75488 9.30176 0.59521 8.73144 0.66797C8.18896 0.73682 7.68701 1.01074 7.31835 1.43897L1.43945 8.25977C0.65722 9.167 0.71045 10.4985 1.55713 11.2285L1.87988 11.5068C2.06311 11.6649 2.27075 11.7827 2.49316 11.8615C2.1892 12.2452 2 12.7236 2 13.25V16.25C2 17.7666 3.2334 19 4.75 19H15.25C16.7666 19 18 17.7666 18 16.25V13.25C18 12.0093 16.9907 11 15.75 11ZM2.5752 9.23926L8.45411 2.41846C8.58106 2.27149 8.74708 2.17774 8.9214 2.15576C8.94142 2.15332 8.96632 2.15088 8.99415 2.15088C9.08058 2.15088 9.19581 2.1709 9.29347 2.25488L9.61574 2.53222C9.83254 2.71923 9.81545 3.11034 9.57765 3.38622L3.69826 10.207C3.57131 10.354 3.40529 10.4477 3.23097 10.4697C3.1504 10.48 2.98829 10.4814 2.85939 10.3711L2.53664 10.0928C2.31984 9.90576 2.3379 9.51514 2.5752 9.23926ZM16.5 16.25C16.5 16.9395 15.9395 17.5 15.25 17.5H4.75C4.06055 17.5 3.5 16.9395 3.5 16.25V13.25C3.5 12.8364 3.83643 12.5 4.25 12.5H15.75C16.1636 12.5 16.5 12.8364 16.5 13.25V16.25Z"
                                          />
                                          <path
                                              d="M11.5 15.5H8.5C8.08594 15.5 7.75 15.1641 7.75 14.75C7.75 14.3359 8.08594 14 8.5 14H11.5C11.9141 14 12.25 14.3359 12.25 14.75C12.25 15.1641 11.9141 15.5 11.5 15.5Z"
                                          />
                                          <path
                                              d="M14.6274 5.94678C14.5234 5.94678 14.4199 5.9209 14.3271 5.86963C14.1816 5.79004 14.0737 5.65576 14.0274 5.49707L13.271 2.90478C13.1743 2.57324 13.3647 2.22607 13.6958 2.12939L16.2876 1.37304C16.6211 1.27685 16.9663 1.46679 17.063 1.79784L17.8193 4.38964C17.916 4.72118 17.7256 5.06835 17.3945 5.16503L14.8027 5.92187C14.7451 5.93847 14.686 5.94678 14.6274 5.94678ZM14.646 3.1543L15.0522 4.54639L16.4443 4.14014L16.0381 2.74805L14.646 3.1543Z"
                                          />
                                      </svg>
                                  </sp-icon>
                                  Create variation
                              </sp-menu-item>
                              <sp-menu-item @click=${this.handleEditFragment}>
                                  <sp-icon-edit slot="icon"></sp-icon-edit>
                                  Edit fragment
                              </sp-menu-item>
                              <sp-menu-item @click=${this.previewOnPage}>
                                  <sp-icon-preview slot="icon"></sp-icon-preview>
                                  Preview on page
                              </sp-menu-item>
                              <sp-menu-item @click=${this.copyCode}>
                                  <sp-icon-code slot="icon"></sp-icon-code>
                                  Copy code
                              </sp-menu-item>
                          </sp-action-menu>`}
                </sp-table-cell>
                <sp-table-cell
                    class="preview"
                    @mouseover=${data.model?.path === CARD_MODEL_PATH ? this.openCardPreview : undefined}
                    @mouseout=${data.model?.path === CARD_MODEL_PATH ? closePreview : undefined}
                >
                    <sp-icon-preview label="Preview item"></sp-icon-preview>
                </sp-table-cell>
            </sp-table-row>
        `;
    }
}

customElements.define('mas-fragment-table', MasFragmentTable);
