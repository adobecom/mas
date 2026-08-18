import { LitElement, html, nothing, css } from 'lit';
import { EVENT_OST_OFFER_SELECT } from '../constants.js';
import { openOfferSelectorTool, closeOfferSelectorTool } from './ost.js';

let osiFieldSource;

class OsiField extends LitElement {
    static properties = {
        id: { type: String, attribute: true },
        value: { type: String },
        showOfferSelector: { type: String },
        // Opt-in: also capture a promo code from OST and store it comma-joined as `<osi>,<promoCode>`.
        // Off by default so bare-osi and discount-badge (`A,B`) fields are unaffected.
        allowPromotionCode: { type: Boolean, attribute: 'allow-promotion-code' },
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
        this.allowPromotionCode = false;
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

    #handleOstEvent({ detail: { offerSelectorId, promotionCode } }) {
        if (osiFieldSource !== this) return;
        const osi = offerSelectorId || '';
        this.value = this.allowPromotionCode && promotionCode ? `${osi},${promotionCode}` : osi;
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
            if (this.allowPromotionCode) {
                // Reopen with the osi and promo split so OST prefills the promo field instead of
                // reading `<osi>,<promoCode>` as a bundle.
                const [osi, promotionCode] = this.value.split(',');
                element.setAttribute('data-wcs-osi', osi);
                if (promotionCode) element.setAttribute('data-promotion-code', promotionCode);
            } else {
                element.setAttribute('data-wcs-osi', this.value);
            }
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
