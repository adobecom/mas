import { LitElement, html } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import { generateCodeToUse, getService } from './utils.js';
import Store from './store.js';

class MasFragmentTable extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        customRender: { type: Function, attribute: false },
        offerData: { type: Object, state: true, attribute: false },
    };

    constructor() {
        super();
        this.offerData = null;
    }

    #reactiveControllers = new ReactiveController(this);

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
        return html`<img
            class="mnemonic-icon"
            src=${this.data.getFieldValue('mnemonicIcon')}
        />`;
    }

    get name() {
        return generateCodeToUse(
            this.data,
            Store.search.get().path,
            Store.page.get(),
        ).authorPath;
    }

    get price() {
        const osi = this.data.getFieldValue('osi');
        if (!osi) return '';
        return html`<span
            is="inline-price"
            data-template="price"
            data-wcs-osi=${osi}
        ></span>`;
    }

    render() {
        const data = this.fragmentStore.value;
        return html`<sp-table-row value="${data.id}"
            ><sp-table-cell class="product-name">
                ${this.icon} ${this.name}
            </sp-table-cell>
            <sp-table-cell>${data.title}</sp-table-cell>
            <sp-table-cell>${this.offerData?.offerType}</sp-table-cell>
            <sp-table-cell>${this.price}</sp-table-cell>
            <sp-table-cell class="offer-id"
                >${this.offerData?.offerId}</sp-table-cell
            >
            ${this.customRender?.(data)}
            <sp-table-cell class="status"
                >${data.status}</sp-table-cell
            ></sp-table-row
        >`;
    }
}

customElements.define('mas-fragment-table', MasFragmentTable);
