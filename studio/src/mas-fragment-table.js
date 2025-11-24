import { LitElement, html } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import { generateCodeToUse, getService, showToast } from './utils.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from './editor-panel.js';
import Store, { editFragment } from './store.js';
import { closePreview, openPreview } from './mas-card-preview.js';
import { CARD_MODEL_PATH } from './constants.js';
import { MasRepository } from './mas-repository.js';

class MasFragmentTable extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        customRender: { type: Function, attribute: false },
        offerData: { type: Object, state: true, attribute: false },
        expanded: { type: Boolean, attribute: false },
        nested: { type: Boolean, attribute: false },
        toggleExpand: { type: Function, attribute: false },
        loadingReferences: { type: Boolean, state: true, attribute: false },
        internalExpanded: { type: Boolean, state: true, attribute: false },
    };

    constructor() {
        super();
        this.offerData = null;
        this.expanded = false;
        this.nested = false;
        this.loadingReferences = false;
        this.internalExpanded = false;
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

    get isExpanded() {
        // Nested fragments manage their own state, non-nested are controlled by parent
        return this.nested ? this.internalExpanded : this.expanded;
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

    handleActionsClick(event) {
        event.stopPropagation();
        const actionMenu = event.currentTarget.querySelector('sp-action-menu');
        if (actionMenu) {
            actionMenu.open = !actionMenu.open;
        }
    }

    handleCreateVariation(event) {
        event.stopPropagation();
        // TODO: Implement create variation logic
    }

    handleEditFragment(event) {
        event.stopPropagation();
        editFragment(this.fragmentStore, event.clientX);
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

    handleToggleExpand(e) {
        if (this.nested) {
            // Nested fragments manage their own state
            this.toggleExpandNested(e);
        } else if (this.toggleExpand) {
            // Non-nested fragments call parent's method
            this.toggleExpand(e);
        }
    }

    async toggleExpandNested(e) {
        e.stopPropagation();
        const newExpandedState = !this.internalExpanded;
        this.internalExpanded = newExpandedState;

        const fragment = this.fragmentStore.value;
        // Fetch references only when expanding and references are not yet loaded
        if (newExpandedState && this.repository && !fragment.references?.length) {
            this.loadingReferences = true;

            try {
                const references = await this.repository.loadReferences(fragment.id);
                this.fragmentStore.value.references = references;
            } catch (error) {
                console.error('Failed to load references:', error);
                showToast('Failed to load references', 'negative');
            } finally {
                this.loadingReferences = false;
            }
        }
    }

    render() {
        const data = this.fragmentStore.value;
        return html`
            <sp-table-row value="${data.id}" class="${this.isExpanded ? 'expanded' : ''}">
                ${!this.nested
                    ? html`<sp-table-cell class="expand-cell" @click=${this.handleToggleExpand}>
                          <button class="expand-button" aria-label="${this.isExpanded ? 'Collapse' : 'Expand'} row">
                              ${this.isExpanded
                                  ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                                  : html`<sp-icon-chevron-right></sp-icon-chevron-right>`}
                          </button>
                      </sp-table-cell>`
                    : html`<sp-table-cell class="expand-cell"></sp-table-cell>`}
                <sp-table-cell class="name">
                    ${this.nested ? html`${data.locale}` : html`${this.icon} ${this.getFragmentName(data)}`}
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
                <sp-table-cell class="actions">
                    <sp-action-menu placement="bottom-end" quiet>
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
                    </sp-action-menu>
                </sp-table-cell>
                ${data.model.path === CARD_MODEL_PATH
                    ? html`<sp-table-cell class="preview" @mouseover=${this.openCardPreview} @mouseout=${closePreview}
                          ><sp-icon-preview label="Preview item"></sp-icon-preview
                      ></sp-table-cell>`
                    : html`<sp-table-cell class="preview"></sp-table-cell>`}
            </sp-table-row>
        `;
    }
}

customElements.define('mas-fragment-table', MasFragmentTable);
