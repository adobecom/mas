import { LitElement, html, nothing, unsafeCSS } from 'lit';
import { EVENT_TYPE_RESOLVED, SELECTOR_MAS_INLINE_PRICE } from './constants.js';
import { styles } from './merch-addon.css.js';

export default class MerchAddon extends LitElement {
    static properties = {
        planType: { type: String, attribute: 'plan-type', reflect: true },
        checked: { type: Boolean, reflect: true },
        customCheckbox: {
            type: Boolean,
            attribute: 'custom-checkbox',
            reflect: true,
        },
        background: { type: String, attribute: 'background' },
    };

    constructor() {
        super();
        this.planType = undefined;
        this.checked = false;
        this.updatePlanType = this.updatePlanType.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleCustomClick = this.handleCustomClick.bind(this);
    }

    getOsi(planType, offerType) {
        const offerTypeOptions = {
            TRIAL: ['TRIAL'],
            BASE: ['BASE', 'PROMOTION', 'TRIAL'],
            PROMOTION: ['PROMOTION', 'BASE', 'TRIAL'],
        };
        // Get the priority list for this offer type
        const priorityList = offerTypeOptions[offerType] || [offerType];
        // Build the selector by joining the options with comma
        const selector = priorityList
            .map(
                (type) =>
                    `p[data-plan-type="${planType}"] ${SELECTOR_MAS_INLINE_PRICE}[data-offer-type="${type}"]`,
            )
            .join(', ');

        const el = this.querySelector(selector);
        return el?.dataset?.wcsOsi;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener(EVENT_TYPE_RESOLVED, this.updatePlanType);
        if (this.background) {
            this.style.setProperty('--merch-addon-background', this.background);
        }
        // In page markup the add-on can render before its card is ready to
        // report a title, so render once more when the card is.
        const card = this.closest('merch-card');
        if (card) {
            customElements
                .whenDefined('merch-card')
                .then(() => card.updateComplete)
                .then(() => {
                    this.requestUpdate();
                });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener(EVENT_TYPE_RESOLVED, this.updatePlanType);
    }

    updatePlanType(e) {
        if (e.target.tagName !== 'SPAN') return;
        const price = e.target;
        const offer = price?.value?.[0];
        if (!offer) return;
        price.setAttribute('data-offer-type', offer.offerType);
        const p = price.closest('p');
        // Respect an already-set plan type (authored explicitly, or already
        // claimed by another <p> resolving to the same plan type) so two
        // blocks never simultaneously display the same plan type.
        if (p.getAttribute('data-plan-type')) return;
        const claimedBy = this.querySelector(
            `p[data-plan-type="${offer.planType}"]`,
        );
        if (claimedBy && claimedBy !== p) return;
        p.setAttribute('data-plan-type', offer.planType);
    }

    handleChange(e) {
        this.checked = e.target.checked;
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { checked: this.checked },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleCustomClick() {
        const addonCheckbox = this.shadowRoot.querySelector('input');
        addonCheckbox.click();
    }

    handleKeyDown(e) {
        if (e.key === ' ') {
            e.preventDefault();
            this.handleCustomClick();
        }
    }

    render() {
        // The same add-on copy repeats on every card, so the card title tells
        // the checkboxes apart. The title lives in the card's light DOM, so a
        // hidden copy in this shadow root is what gets referenced.
        const product = this.closest('merch-card')?.title;
        const labelledBy = product
            ? 'custom-checkbox-label addon-product'
            : 'custom-checkbox-label';
        return html` <input
                type="checkbox"
                id="addon-checkbox"
                aria-labelledby=${product ? labelledBy : nothing}
                .checked=${this.checked}
                @change=${this.handleChange}
            />
            <span
                role="checkbox"
                aria-checked=${this.checked}
                tabindex="0"
                aria-labelledby=${labelledBy}
                id="custom-checkbox"
                @click=${this.handleCustomClick}
                @keydown=${this.handleKeyDown}
            >
            </span>
            <label id="custom-checkbox-label" for="addon-checkbox">
                <slot></slot>
            </label>
            ${product
                ? html`<span id="addon-product" hidden>${product}</span>`
                : nothing}`;
    }

    static styles = unsafeCSS(styles);
}

customElements.define('merch-addon', MerchAddon);
