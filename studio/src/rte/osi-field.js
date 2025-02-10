import { LitElement, html, css } from 'lit';
import { EVENT_OST_SELECT } from '../constants.js';
import { openOfferSelectorTool, closeOfferSelectorTool } from './ost.js';

let osiFieldSource;

class OsiField extends LitElement {
    static properties = {
        selectedOffer: { type: String },
        showOfferSelector: { type: String },
    };

    static styles = css`
        .bold-text {
            font-weight: bold;
        }
    `;

    #boundHandlers;
    constructor() {
        super();
        this.selectedOffer = '';
        this.showOfferSelector = false;
        // this._onOstSelect = this._onOstSelect.bind(this);
        this.#boundHandlers = {
            ostEvent: this.#handleOstEvent.bind(this),
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(
            EVENT_OST_SELECT,
            this.#boundHandlers.ostEvent,
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(
            EVENT_OST_SELECT,
            this.#boundHandlers.ostEvent,
        );
    }

    #handleOstEvent(event) {
        if (osiFieldSource !== this) return;
        console.log(this);
        const offerSelectorId = event.detail['data-wcs-osi'];
        console.log('Offer Selector ID:', offerSelectorId);
        this.selectedOffer = offerSelectorId;
        this.showOfferSelector = false;
        osiFieldSource = null;
        closeOfferSelectorTool();
    }

    get #offerSelectorToolButton() {
        return html`
            <sp-divider size="s" horizontal></sp-divider>
            <sp-action-button
                emphasized
                id="offerSelectorToolButtonOSI"
                @click=${this.handleOpenOfferSelector}
                title="Offer Selector Tool"
            >
                <sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>
            </sp-action-button>
        `;
    }

    handleOpenOfferSelector(event, element) {
        osiFieldSource = this;
        debugger;
        this.showOfferSelector = true;
        openOfferSelectorTool(this, element);
    }

    render() {
        return html`
            <div>
                <sp-action-group
                    quiet
                    size="m"
                    aria-label="RTE toolbar actions"
                >
                    ${this.#offerSelectorToolButton}
                </sp-action-group>
                <p>Selected Offer: <strong>${this.selectedOffer}</strong></p>
            </div>
        `;
    }
}

customElements.define('osi-field', OsiField);
