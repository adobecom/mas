import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';

export class OstLivePreview extends LitElement {
    static properties = {
        placeholderType: { type: String },
        referenceOsi: { type: String },
        osi: { type: String },
        offer: { type: Object },
    };

    #placeholderNode = null;
    #staticDiscount = false;

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .preview-card {
            background: var(--spectrum-gray-50);
            border-radius: 8px;
            padding: 12px;
        }

        .label {
            font-size: 11px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .type-badge {
            font-size: 10px;
            font-weight: 600;
            color: var(--spectrum-blue-900);
            background: var(--spectrum-blue-100);
            padding: 2px 6px;
            border-radius: 3px;
            text-transform: capitalize;
        }

        .placeholder-container {
            min-height: 24px;
        }

        .placeholder-container a,
        .placeholder-container button {
            pointer-events: none;
        }

        .placeholder-container span.placeholder-resolved[data-template='strikethrough'],
        .placeholder-container span.price.price-strikethrough,
        .placeholder-container span.placeholder-resolved[data-template='promo-strikethrough'],
        .placeholder-container span.price.price-promo-strikethrough {
            text-decoration: line-through;
        }

        .placeholder-container span.price-strikethrough span.price-recurrence,
        .placeholder-container span.price-strikethrough span.price-tax-inclusivity {
            display: none;
        }

        .placeholder-container sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        .placeholder-container span.placeholder-resolved[data-template='optical'],
        .placeholder-container span.price.price-optical {
            font-weight: 700;
        }

        .placeholder-container span[data-template='legal'],
        .placeholder-container span.price-legal {
            display: block;
            font-size: 14px;
            font-style: italic;
            color: var(--spectrum-gray-700);
            line-height: 1.5;
        }

        .placeholder-container span.price-legal::first-letter {
            text-transform: uppercase;
        }

        .placeholder-container .price-unit-type:not(.disabled)::before,
        .placeholder-container .price-tax-inclusivity:not(.disabled)::before {
            content: '\u00a0';
        }
    `;

    constructor() {
        super();
        this.placeholderType = 'price';
        this.referenceOsi = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.handleStoreChange = () => this.requestUpdate();
        store.subscribe(this.handleStoreChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    willUpdate() {
        // Resolve geo-aware tax defaults for the selected offer (idempotent per
        // offer+country). Updates the shared store, which re-renders this row
        // and the "Disable" checkboxes with the correct DE/EU tax label state.
        const offer = this.effectiveOffer;
        if (offer) store.applyGeoTaxDefaults(offer);
        const built = this.#buildPlaceholder();
        this.#staticDiscount = built?.staticDiscount ?? false;
        this.#placeholderNode = built?.node ?? null;
    }

    get effectiveOsi() {
        return this.osi || store.selectedOsi;
    }

    get effectiveOffer() {
        return this.offer || store.selectedOffer;
    }

    buildPlaceholderOptions() {
        const osi = this.effectiveOsi;
        const service = store.masCommerceService;
        if (!osi || !service) return null;
        if (typeof service.createInlinePrice !== 'function') return null;

        const type = this.placeholderType;
        if (!type) return null;
        // Scope the checkout controller to this row — tryBuy renders one
        // checkout row per offer, each with its own ost-checkout-options.
        const checkoutCtrl = this.closest('.placeholder-row')?.querySelector('ost-checkout-options')?.checkout;
        const options = store.getEffectiveOptions(type);

        // Split joined OSIs (soft bundle) so each resolves individually and
        // the price template sums them.
        const wcsOsi = type === 'discount' && this.referenceOsi ? [osi, this.referenceOsi] : osi.split(',');

        const placeholderOptions = {
            ...options,
            promotionCode: store.effectivePromoCode,
            wcsOsi,
            template: type,
            clientId: store.checkoutClientId,
            country: store.country,
            landscape: store.landscape,
            'mas-ff-defaults': true,
        };

        if (checkoutCtrl) {
            placeholderOptions.workflowStep = checkoutCtrl.workflowStep;
            placeholderOptions.checkoutWorkflowStep = checkoutCtrl.workflowStep;
            if (checkoutCtrl.enableModal) {
                placeholderOptions.modal = checkoutCtrl.modalType;
            }
            if (checkoutCtrl.entitlement) {
                placeholderOptions.entitlement = true;
            }
            if (checkoutCtrl.upgrade) {
                placeholderOptions.upgrade = true;
            }
            placeholderOptions.ctaText = checkoutCtrl.ctaText;
        }

        placeholderOptions.workflow = 'UCv3';
        placeholderOptions.marketSegment = store.aosParams.marketSegment || 'COM';

        return { type, placeholderOptions, service };
    }

    // The discount % is only computable for a PROMOTION offer — it has a
    // current price below its priceWithoutDiscount. Everything else (BASE,
    // TRIAL — a free trial has no price delta to compute) has no discount, so
    // render a static 0% instead of an empty inline-price preview.
    #discountIsComputable() {
        return this.effectiveOffer?.offer_type === 'PROMOTION';
    }

    #buildPlaceholder() {
        const result = this.buildPlaceholderOptions();
        if (!result) return null;

        const { type, placeholderOptions, service } = result;

        if (type === 'discount' && !this.referenceOsi && !this.#discountIsComputable()) {
            // Render 0% as a Lit-managed template node (see render()), not an
            // imperative DOM node — alternating a raw node with a raw
            // inline-price node in the same binding makes Lit drop it on the
            // next selection.
            return { staticDiscount: true, node: null };
        }

        let node;
        if (type === 'checkoutUrl') {
            const ctaLabel = placeholderOptions.ctaText || 'Buy now';
            if (typeof service.createCheckoutButton === 'function') {
                node = service.createCheckoutButton(placeholderOptions, ctaLabel);
            } else {
                node = service.createCheckoutLink(placeholderOptions, ctaLabel);
            }
        } else {
            node = service.createInlinePrice(placeholderOptions);
        }

        if (node && type && type !== 'price') {
            node.dataset.template = type;
        }

        return { node };
    }

    getTypeName() {
        const type = this.placeholderType;
        if (!type) return '';
        const match = store.placeholderTypes.find((t) => t.type === type);
        return match?.name || type;
    }

    render() {
        const typeName = this.getTypeName();
        return html`
            <div class="preview-card" data-testid="ost-live-preview">
                <div class="label">Live Preview ${typeName ? html`<span class="type-badge">${typeName}</span>` : nothing}</div>
                <div class="placeholder-container" data-testid="ost-preview-container">
                    ${this.#staticDiscount
                        ? html`<span class="discount" data-template="discount">0%</span>`
                        : (this.#placeholderNode ?? nothing)}
                </div>
            </div>
        `;
    }
}

customElements.define('ost-live-preview', OstLivePreview);
