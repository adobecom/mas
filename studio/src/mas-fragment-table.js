import { LitElement, html, css } from 'lit';
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

    static styles = css`
        .price-error-title {
            color: var(--merch-color-error, #d73220);
            font-weight: 600;
        }
    `;

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
            return html`<span class="price-error-title">Price Unavailable</span>`;
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
                        ? html`<sp-icon-alert class="price-error-icon"></sp-icon-alert>`
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
