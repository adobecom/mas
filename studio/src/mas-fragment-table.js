import { LitElement, html } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import { generateCodeToUse, getService, showToast } from './utils.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from './editor-panel.js';
import Store from './store.js';
import { closePreview, openPreview } from './mas-card-preview.js';
import { CARD_MODEL_PATH } from './constants.js';
import { MasRepository } from './mas-repository.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';

class MasFragmentTable extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        customRender: { type: Function, attribute: false },
        offerData: { type: Object, state: true, attribute: false },
        expanded: { type: Boolean, state: true, attribute: false },
    };

    constructor() {
        super();
        this.offerData = null;
        this.expanded = false;
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
        const wcsOsi = this.data.getFieldValue('osi');
        if (!wcsOsi) return;
        const service = getService();
        const priceOptions = service.collectPriceOptions({ wcsOsi });
        const [offersPromise] = service.resolveOfferSelectors(priceOptions);
        if (!offersPromise) return;
        const [offer] = await offersPromise;
        this.offerData = offer;
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
        return html`<span is="inline-price" data-template="price" data-wcs-osi=${osi}></span>`;
    }

    openCardPreview() {
        openPreview(this.fragmentStore.value.id, { left: 'min(300px, 15%)' });
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

    async toggleExpand(e) {
        e.stopPropagation();
        this.expanded = !this.expanded;
        const fragment = this.fragmentStore.value;
        // Fetch references only when expanding and references are not yet loaded
        if (this.expanded && this.repository && !fragment.references?.length) {
            const references = await this.repository.loadReferences(fragment.id);
            this.fragmentStore.value.references = references;
            this.requestUpdate();
        }
    }

    renderExpandedContent() {
        const fragment = this.fragmentStore.value;
        const variations = fragment.listLocaleVariations();
        const hasVariations = variations && Array.isArray(variations) && variations.length > 0;

        return html`
            <div class="expanded-content">
                ${hasVariations
                    ? html`<h3 class="expanded-title">Variations</h3>`
                    : html`<h3 class="expanded-title">No Variations found.</h3>`}
                <sp-tabs selected="locale" quiet>
                    <sp-tab value="locale" label="Locale">Locale</sp-tab>
                    <sp-tab value="promotion" label="Promotion">Promotion</sp-tab>
                    <sp-tab value="personalization" label="Personalization">Personalization</sp-tab>
                    <sp-tab-panel value="locale">
                        <div class="embedded-table-container">
                            ${hasVariations
                                ? variations.map(
                                      (variationFragment) => html`
                                          <mas-fragment-table
                                              class="mas-fragment"
                                              data-id="${variationFragment.id}"
                                              .fragmentStore=${new FragmentStore(new Fragment(variationFragment))}
                                          ></mas-fragment-table>
                                      `,
                                  )
                                : html`<p>No locale variations found</p>`}
                        </div>
                    </sp-tab-panel>
                    <sp-tab-panel value="promotion">
                        <div class="tab-content-placeholder">
                            <p>Promotion content will be displayed here</p>
                        </div>
                    </sp-tab-panel>
                    <sp-tab-panel value="personalization">
                        <div class="tab-content-placeholder">
                            <p>Personalization content will be displayed here</p>
                        </div>
                    </sp-tab-panel>
                </sp-tabs>
            </div>
        `;
    }

    render() {
        const data = this.fragmentStore.value;
        return html`
            <sp-table-row value="${data.id}" class="${this.expanded ? 'expanded' : ''}">
                <sp-table-cell class="name">
                    <button
                        class="expand-button"
                        @click=${this.toggleExpand}
                        aria-label="${this.expanded ? 'Collapse' : 'Expand'} row"
                    >
                        ${this.expanded
                            ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-right></sp-icon-chevron-right>`}
                    </button>
                    ${this.icon} ${this.getFragmentName(data)}
                </sp-table-cell>
                <sp-table-cell class="title">${data.title}</sp-table-cell>
                <sp-table-cell class="offer-id">
                    <span class="offer-id-text" title=${this.offerData?.offerId}> ${this.getTruncatedOfferId()} </span>
                    ${this.offerData?.offerId
                        ? html`<sp-icon-copy
                              label="Copy to clipboard"
                              class="copy-icon"
                              @click=${this.copyOfferIdToClipboard}
                          ></sp-icon-copy>`
                        : ''}
                </sp-table-cell>
                <sp-table-cell class="offer-type">${this.offerData?.offerType}</sp-table-cell>
                <sp-table-cell class="price">${this.price}</sp-table-cell>
                ${this.customRender?.(data)}
                <sp-table-cell class="status ${data.status?.toLowerCase()}-cell"
                    ><div class="status-dot"></div>
                    <span class="status-text">${data.status}</span></sp-table-cell
                >
                ${data.model.path === CARD_MODEL_PATH
                    ? html`<sp-table-cell class="preview" @mouseover=${this.openCardPreview} @mouseout=${closePreview}
                          ><sp-icon-preview label="Preview item"></sp-icon-preview
                      ></sp-table-cell>`
                    : html`<sp-table-cell class="preview"></sp-table-cell>`}
            </sp-table-row>
            ${this.expanded ? html`<div class="expanded-row-container">${this.renderExpandedContent()}</div>` : ''}
        `;
    }
}

customElements.define('mas-fragment-table', MasFragmentTable);
