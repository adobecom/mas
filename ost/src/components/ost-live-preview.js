import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';

export class OstLivePreview extends LitElement {
    static properties = {
        placeholderType: { type: String },
        referenceOsi: { type: String },
    };

    #placeholderNode = null;
    #showDiscountHint = false;

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .preview-card {
            background: var(--spectrum-gray-50);
            border-radius: 8px;
            padding: 20px;
            min-height: 56px;
        }

        .label {
            font-size: 11px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
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
            min-height: 40px;
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

        .placeholder-container .discount-hint {
            font-size: 13px;
            color: var(--spectrum-gray-600);
            font-style: italic;
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
        const built = this.#buildPlaceholder();
        this.#placeholderNode = built?.node ?? null;
        this.#showDiscountHint = built?.showHint ?? false;
    }

    getPanel() {
        const root = this.getRootNode();
        return root?.host?.tagName === 'OST-PLACEHOLDER-PANEL' ? root.host : null;
    }

    buildPlaceholderOptions() {
        const panel = this.getPanel();
        if (!panel) return null;

        const osi = store.selectedOsi;
        const service = store.masCommerceService;
        if (!osi || !service) return null;
        if (typeof service.createInlinePrice !== 'function') return null;

        const ctrl = panel.placeholderCtrl;
        const checkoutCtrl = panel.shadowRoot?.querySelector('ost-checkout-options')?.checkout;
        const type = this.placeholderType || ctrl.selectedType;
        const typeOverrides = store.placeholderTypes.find((t) => t.type === type)?.overrides || {};
        const options = { ...ctrl.getEffectiveOptions(), ...typeOverrides };

        const wcsOsi = type === 'discount' && this.referenceOsi ? [osi, this.referenceOsi] : [osi];

        const placeholderOptions = {
            ...options,
            promotionCode: store.effectivePromoCode,
            wcsOsi,
            template: type,
            clientId: store.checkoutClientId,
            country: store.country,
            landscape: store.landscape,
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

    #buildPlaceholder() {
        const result = this.buildPlaceholderOptions();
        if (!result) return null;

        const { type, placeholderOptions, service } = result;

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

        const isPromo = store.selectedOffer?.offer_type === 'PROMOTION';
        const showHint = type === 'discount' && !this.referenceOsi && !isPromo;

        return { node, showHint };
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
                    ${this.#placeholderNode ?? nothing}
                    ${this.#showDiscountHint
                        ? html`<span class="discount-hint"
                              >Enter a reference offer OSI to calculate the discount percentage.</span
                          >`
                        : nothing}
                </div>
            </div>
        `;
    }
}

customElements.define('ost-live-preview', OstLivePreview);
