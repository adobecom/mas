import { LitElement, html, css } from 'lit';
import { EVENT_OST_OFFER_SELECT } from '../constants.js';
import { openOfferSelectorTool, closeOfferSelectorTool } from './ost.js';

let osiFieldSource;

class OsiField extends LitElement {
    static properties = {
        selectedOffer: { type: String },
        showOfferSelector: { type: String },
    };

    #boundHandlers;
    constructor() {
        super();
        this.selectedOffer = '';
        this.showOfferSelector = false;
        this.#boundHandlers = {
            ostEvent: this.#handleOstEvent.bind(this),
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(
            EVENT_OST_OFFER_SELECT,
            this.#boundHandlers.ostEvent,
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(
            EVENT_OST_OFFER_SELECT,
            this.#boundHandlers.ostEvent,
        );
    }

    #handleOstEvent({ detail: { offerSelectorId, offer } }) {
        if (osiFieldSource !== this) return;
        this.selectedOffer = offerSelectorId;
        this.showOfferSelector = false;
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
