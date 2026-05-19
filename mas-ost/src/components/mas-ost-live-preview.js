import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';

export class MasOstLivePreview extends LitElement {
    static properties = {
        placeholderType: { type: String },
        referenceOsi: { type: String },
    };

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
            content: "\u00a0";
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

    updated() {
        this.renderPreview();
    }

    getPanel() {
        const root = this.getRootNode();
        return root?.host?.tagName === 'MAS-OST-PLACEHOLDER-PANEL'
            ? root.host
            : null;
    }

    buildPlaceholderOptions() {
        const panel = this.getPanel();
        if (!panel) return null;

        const osi = store.selectedOsi;
        const service = store.masCommerceService;
        if (!osi || !service) return null;
        if (typeof service.createInlinePrice !== 'function') return null;

        const ctrl = panel.placeholderCtrl;
        const checkoutCtrl = panel.shadowRoot
            ?.querySelector('mas-ost-checkout-options')
            ?.checkout;
        const type = this.placeholderType || ctrl.selectedType;
        const options = ctrl.getEffectiveOptions();
        const promoStatus = store.storedPromoOverride;
        const promotionCode = store.promotionCode;

        const wcsOsi = type === 'discount' && this.referenceOsi
            ? [osi, this.referenceOsi]
            : [osi];

        const placeholderOptions = {
            ...options,
            forceTaxExclusive: !options.forceTaxExclusive,
            promotionCode: promoStatus || promotionCode,
            wcsOsi,
            template: type,
            clientId: store.checkoutClientId,
        };

        if (checkoutCtrl) {
            placeholderOptions.workflowStep = checkoutCtrl.workflowStep;
            placeholderOptions.checkoutWorkflowStep =
                checkoutCtrl.workflowStep;
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
        placeholderOptions.marketSegment =
            store.aosParams.marketSegment || 'COM';

        return { type, placeholderOptions, service };
    }

    renderPreview() {
        const container = this.shadowRoot?.querySelector(
            '.placeholder-container',
        );
        if (!container) return;

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const result = this.buildPlaceholderOptions();
        if (!result) return;

        const { type, placeholderOptions, service } = result;

        let placeholder;
        if (type === 'checkoutUrl') {
            const ctaLabel = placeholderOptions.ctaText || 'Buy now';
            if (typeof service.createCheckoutButton === 'function') {
                placeholder = service.createCheckoutButton(
                    placeholderOptions,
                    ctaLabel,
                );
            } else {
                placeholder = service.createCheckoutLink(
                    placeholderOptions,
                    ctaLabel,
                );
            }
        } else {
            placeholder = service.createInlinePrice(placeholderOptions);
        }

        if (placeholder) {
            if (type && type !== 'price') {
                placeholder.dataset.template = type;
            }
            container.appendChild(placeholder);
        }

        const isPromo = store.selectedOffer?.offer_type === 'PROMOTION';
        if (type === 'discount' && !this.referenceOsi && !isPromo) {
            const hint = document.createElement('span');
            hint.className = 'discount-hint';
            hint.textContent = 'Enter a reference offer OSI to calculate the discount percentage.';
            container.appendChild(hint);
        }
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
            <div class="preview-card">
                <div class="label">
                    Live Preview
                    ${typeName
                        ? html`<span class="type-badge">${typeName}</span>`
                        : ''}
                </div>
                <div class="placeholder-container"></div>
            </div>
        `;
    }
}

customElements.define('mas-ost-live-preview', MasOstLivePreview);
