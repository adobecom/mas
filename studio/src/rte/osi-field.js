import { LitElement, html, nothing, css } from 'lit';
import { EVENT_OST_OFFER_SELECT } from '../constants.js';
import { openOfferSelectorTool, closeOfferSelectorTool } from './ost.js';

let osiFieldSource;

class OsiField extends LitElement {
    static properties = {
        id: { type: String, attribute: true },
        value: { type: String },
        showOfferSelector: { type: String },
    };

    static styles = css`
        .error-state {
            color: #ea3829;
        }
    `;

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
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.#boundHandlers.ostEvent);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.#boundHandlers.escKey, {
            capture: true,
        });
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.#boundHandlers.ostEvent);
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

    #handleEscKey(event) {
        if (!this.showOfferSelector) return;
        if (event.key === 'Escape') {
            event.stopPropagation();
            closeOfferSelectorTool();
        }
    }

    get #offerSelectorToolButton() {
        return html`
            <sp-action-button
                id="offerSelectorToolButtonOSI"
                @click=${this.handleOpenOfferSelector}
                title="Offer Selector Tool"
            >
                <sp-icon-shopping-cart slot="icon" class="${!this.value ? 'error-state' : ''}"></sp-icon-shopping-cart>
                ${!this.value ? html` <sp-icon-alert size="m" slot="icon" class="error-state"></sp-icon-alert> ` : nothing}
            </sp-action-button>
        `;
    }

    handleOpenOfferSelector(event, element) {
        if (!element && this.value) {
            element = document.createElement('span');
            element.setAttribute('data-wcs-osi', this.value);
            element.isInlinePrice = true;
        }
        osiFieldSource = this;
        this.showOfferSelector = true;
        openOfferSelectorTool(this, element);
    }

    render() {
        return html`
            <div>
                <sp-action-group quiet size="m" aria-label="OSI field toolbar actions">
                    ${this.#offerSelectorToolButton}
                </sp-action-group>
                <p id=${this.id}>Selected Offer: <strong>${this.value}</strong></p>
            </div>
        `;
    }
}

customElements.define('osi-field', OsiField);
