import { LitElement, html, nothing } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import { generateCodeToUse, getService, toPascalCase } from './utils.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from './editor-panel.js';
import Store from './store.js';
import { closePreview, openPreview } from './mas-card-preview.js';
import { CARD_MODEL_PATH } from './constants.js';

class MasFragmentTable extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        customRender: { type: Function, attribute: false },
        offerData: { type: Object, state: true, attribute: false },
        tooltipOpen: { type: Boolean, state: true },
        tooltipLabel: { type: String, state: true },
    };

    constructor() {
        super();
        this.offerData = null;
        this.tooltipOpen = false;
        this.tooltipLabel = null;
    }

    #reactiveControllers = new ReactiveController(this);

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

    get statusIcon() {
        const status = this.fragmentStore.value.status;
        switch (status) {
            case 'NEW':
                return html`<sp-icon-document></sp-icon-document>`;
            case 'DRAFT':
                return html`<sp-icon-draft></sp-icon-draft>`;
            case 'MODIFIED':
                return html`<sp-icon-annotate-pen></sp-icon-annotate-pen>`;
            case 'PUBLISHED':
                return html`<sp-icon-publish-check></sp-icon-publish-check>`;
            default:
                return nothing;
        }
    }

    openCardPreview() {
        openPreview(this.fragmentStore.value.id, { left: 'min(300px, 15%)' });
    }

    get tooltip() {
        return this.querySelector('.content-row-tooltip');
    }

    openTooltip(event) {
        const value = event.target.getAttribute('data-tooltip');
        if (!value) return;
        this.tooltipOpen = true;
        this.tooltipLabel = value;
        this.tooltip.style.left = `${event.target.offsetLeft + event.target.offsetWidth / 2}px`;
    }

    closeTooltip() {
        this.tooltipOpen = false;
    }

    render() {
        const data = this.fragmentStore.value;
        return html`<sp-table-row value="${data.id}"
            ><sp-table-cell class="name"> ${this.icon} ${this.getFragmentName(data)} </sp-table-cell>
            <sp-table-cell class="title">${data.title}</sp-table-cell>
            <sp-table-cell class="offer-type">${this.offerData?.offerType}</sp-table-cell>
            <sp-table-cell class="price">${this.price}</sp-table-cell>
            <sp-table-cell
                @mouseenter=${this.openTooltip}
                @mouseleave=${this.closeTooltip}
                class="offer-id"
                data-tooltip=${this.offerData?.offerId}
                ><span class="offer-id-value">${this.offerData?.offerId}</span></sp-table-cell
            >
            ${this.customRender?.(data)}
            <sp-table-cell
                @mouseenter=${this.openTooltip}
                @mouseleave=${this.closeTooltip}
                class="status ${data.status?.toLowerCase()}-cell"
                data-tooltip=${toPascalCase(data.status)}
                >${this.statusIcon}</sp-table-cell
            >
            ${data.model.path === CARD_MODEL_PATH
                ? html`<sp-table-cell class="preview" @mouseover=${this.openCardPreview} @mouseout=${closePreview}
                      ><sp-icon-preview label="Preview item"></sp-icon-preview
                  ></sp-table-cell>`
                : html`<sp-table-cell class="preview"></sp-table-cell>`}<sp-tooltip
                class="content-row-tooltip"
                .open=${this.tooltipOpen}
                >${this.tooltipLabel}</sp-tooltip
            ></sp-table-row
        >`;
    }
}

customElements.define('mas-fragment-table', MasFragmentTable);
