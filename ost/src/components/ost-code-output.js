import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';
import { computePromoStatus, PROMO_CONTEXT_CANCEL_VALUE } from '@dexter/tacocat-core/src/promotion.js';

export class OstCodeOutput extends LitElement {
    static properties = {
        buttonText: { type: String, state: true },
        placeholderType: { type: String },
        referenceOsi: { type: String },
        osi: { type: String },
        offer: { type: Object },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: inline-flex;
        }
    `;

    constructor() {
        super();
        this.buttonText = 'Use';
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    handleStoreChange() {
        this.requestUpdate();
    }

    get effectiveOsi() {
        return this.osi || store.selectedOsi;
    }

    get effectiveOffer() {
        return this.offer || store.selectedOffer;
    }

    // Scope the checkout controller to this row: tryBuy renders one checkout
    // row per offer, each with its own ost-checkout-options.
    get checkoutCtrl() {
        return this.closest('.placeholder-row')?.querySelector('ost-checkout-options')?.checkout;
    }

    getCodeString() {
        const baseOsi = this.effectiveOsi;
        if (!baseOsi) return '';

        const type = this.placeholderType;
        if (!type) return '';
        const options = store.getEffectiveOptions(type);

        const checkoutCtrl = this.checkoutCtrl;

        const osi = type === 'discount' && this.referenceOsi ? `${baseOsi},${this.referenceOsi}` : baseOsi;
        const parts = [`osi="${osi}"`];
        if (type !== 'price') {
            parts.push(`type="${type}"`);
        }

        const typeConfig = store.placeholderTypes.find((t) => t.type === type);
        const typeOverrides = typeConfig?.overrides || {};
        const defaults = { ...store.defaultPlaceholderOptions, ...typeOverrides };

        const optionParts = [];
        Object.entries(options).forEach(([key, val]) => {
            if (val === undefined || val === false || val === '') return;
            if (defaults[key] === val) return;
            optionParts.push(`${key}="${val}"`);
        });
        if (store.storedPromoOverride) {
            optionParts.push(`promotionCode="${store.storedPromoOverride}"`);
        }
        if (optionParts.length > 0) {
            parts.push(optionParts.join(' '));
        }

        if (checkoutCtrl) {
            if (checkoutCtrl.workflowStep && checkoutCtrl.workflowStep !== 'email') {
                parts.push(`workflowStep="${checkoutCtrl.workflowStep}"`);
            }
            if (checkoutCtrl.ctaText) {
                parts.push(`ctaText="${checkoutCtrl.ctaText}"`);
            }
            if (checkoutCtrl.enableModal && checkoutCtrl.modalType) {
                parts.push(`modal="${checkoutCtrl.modalType}"`);
            }
            if (checkoutCtrl.entitlement) {
                parts.push('entitlement="true"');
            }
            if (checkoutCtrl.upgrade) {
                parts.push('upgrade="true"');
            }
        }

        return `{{${type} ${parts.join(' ')}}}`;
    }

    async handleUse() {
        const baseOsi = this.effectiveOsi;
        const type = this.placeholderType;
        if (!type) return;
        const osi = type === 'discount' && this.referenceOsi ? `${baseOsi},${this.referenceOsi}` : baseOsi;
        const options = store.getEffectiveOptions(type);

        const checkoutCtrl = this.checkoutCtrl;

        if (checkoutCtrl) {
            options.workflowStep = checkoutCtrl.workflowStep;
            options.checkoutWorkflowStep = checkoutCtrl.workflowStep;
            if (checkoutCtrl.enableModal) {
                options.modal = checkoutCtrl.modalType;
            }
            if (checkoutCtrl.entitlement) {
                options.entitlement = true;
            }
            if (checkoutCtrl.upgrade) {
                options.upgrade = true;
            }
            // Fall back to the UI's displayed default; ctaText may be '' if
            // the user opened the checkout config but didn't pick from the
            // dropdown — Studio looks up CTA_TEXTS[options.ctaText] and would
            // skip the text attribute entirely on an empty string.
            options.ctaText = checkoutCtrl.ctaText || checkoutCtrl.defaultCtaText;
        }

        options.workflow = 'UCv3';
        options.marketSegment = store.aosParams.marketSegment || 'COM';
        options.clientId = store.checkoutClientId;

        const promoStatus = computePromoStatus(store.storedPromoOverride, store.promotionCode);

        // Persist the literal cancel value
        // effectivePromoCode would lose it (collapses to undefined)
        const promoOverride =
            store.storedPromoOverride === PROMO_CONTEXT_CANCEL_VALUE
                ? PROMO_CONTEXT_CANCEL_VALUE
                : promoStatus.effectivePromoCode;

        let node = this.getRootNode();
        while (node?.host && node.host.tagName !== 'OST-APP') {
            node = node.host.getRootNode();
        }
        const app = node?.host?.tagName === 'OST-APP' ? node.host : null;
        if (app) {
            app.select({
                osi,
                type,
                offer: this.effectiveOffer,
                options,
                promoOverride,
                country: store.country,
            });
        }

        try {
            await navigator.clipboard.writeText(this.getCodeString());
        } catch (e) {
            /* clipboard not available */
        }

        this.buttonText = 'Copied';
        window.setTimeout(() => {
            this.buttonText = 'Use';
        }, 400);
    }

    render() {
        return html`
            <sp-button
                data-testid="ost-use-button"
                variant="accent"
                size="s"
                ?disabled=${!this.effectiveOsi}
                @click=${() => this.handleUse()}
            >
                ${this.buttonText}
            </sp-button>
        `;
    }
}

customElements.define('ost-code-output', OstCodeOutput);
