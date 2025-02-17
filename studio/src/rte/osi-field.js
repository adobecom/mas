import { LitElement, html, css } from 'lit';
import { EVENT_OST_OFFER_SELECT } from '../constants.js';
import { openOfferSelectorTool, closeOfferSelectorTool } from './ost.js';

let osiFieldSource;

class OsiField extends LitElement {
    static styles = css`
        :host {
            --mod-textfield-width: 100%;
        }
    `;
    static properties = {
        id: { type: String, attribute: true },
        value: { type: String },
        showOfferSelector: { type: String },
    };

    #boundHandlers;
    constructor() {
        super();
        this.value = '';
        this.showOfferSelector = false;
        this.#boundHandlers = {
            escKey: this.#handleEscKey.bind(this),
            ostEvent: this.#handleOstEvent.bind(this),
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.#boundHandlers.escKey, {
            capture: true,
        });
        document.addEventListener(
            EVENT_OST_OFFER_SELECT,
            this.#boundHandlers.ostEvent,
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.#boundHandlers.escKey, {
            capture: true,
        });
        document.removeEventListener(
            EVENT_OST_OFFER_SELECT,
            this.#boundHandlers.ostEvent,
        );
    }

    #handleOstEvent({ detail: { offerSelectorId, offer } }) {
        if (osiFieldSource !== this) return;
        this.value = offerSelectorId || '';
        this.showOfferSelector = false;
        this.dispatchEvent(
            new CustomEvent('change', {
                bubbles: true,
                composed: true,
            }),
        );
        closeOfferSelectorTool();
    }

    #handleTextfieldInput(event) {
        const newValue = event.target.value;
        this.value = newValue;
    }

    #handleEscKey(event) {
        if (!this.showOfferSelector) return;
        if (event.key === 'Escape') {
            event.stopPropagation();
            closeOfferSelectorTool();
        }
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
                    <sp-textfield
                        id=${this.id}
                        value=${this.value}
                        placeholder="Select an offer"
                        @input=${this.#handleTextfieldInput}
                        quiet
                    ></sp-textfield>
                </sp-action-group>
            </div>
        `;
    }
}

customElements.define('osi-field', OsiField);
