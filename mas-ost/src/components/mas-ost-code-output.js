import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/button/sp-button.js';
import { store } from '../store/ost-store.js';
import { computePromoStatus } from '../utils/promo-status.js';

export class MasOstCodeOutput extends LitElement {
    static properties = {
        buttonText: { type: String, state: true },
        placeholderType: { type: String },
        referenceOsi: { type: String },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .code-card {
            background: var(--spectrum-gray-900, #1a1a1a);
            border-radius: 8px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        code {
            flex: 1;
            font-family: inherit;
            font-size: 12px;
            color: var(--spectrum-green-400, #2d9d78);
            overflow-wrap: break-word;
            white-space: pre-wrap;
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

    get panel() {
        const root = this.getRootNode();
        return root?.host?.tagName === 'MAS-OST-PLACEHOLDER-PANEL'
            ? root.host
            : null;
    }

    getCodeString() {
        const panel = this.panel;
        if (!panel) return '';

        const baseOsi = store.selectedOsi;
        if (!baseOsi) return '';

        const ctrl = panel.placeholderCtrl;
        const type = this.placeholderType || ctrl.selectedType;
        const options = ctrl.getEffectiveOptions();

        const checkoutCtrl = panel.shadowRoot
            ?.querySelector('mas-ost-checkout-options')
            ?.checkout;

        const osi = type === 'discount' && this.referenceOsi
            ? `${baseOsi},${this.referenceOsi}`
            : baseOsi;
        const parts = [`osi="${osi}"`];
        if (type !== 'price') {
            parts.push(`type="${type}"`);
        }

        const optionParts = [];
        Object.entries(options).forEach(([key, val]) => {
            if (val !== undefined && val !== false && val !== '') {
                optionParts.push(`${key}="${val}"`);
            }
        });
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
        const panel = this.panel;
        if (!panel) return;

        const baseOsi = store.selectedOsi;
        const ctrl = panel.placeholderCtrl;
        const type = this.placeholderType || ctrl.selectedType;
        const osi = type === 'discount' && this.referenceOsi
            ? `${baseOsi},${this.referenceOsi}`
            : baseOsi;
        const options = ctrl.serializeOptions();

        const checkoutCtrl = panel.shadowRoot
            ?.querySelector('mas-ost-checkout-options')
            ?.checkout;

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
            options.ctaText = checkoutCtrl.ctaText;
        }

        options.workflow = 'UCv3';
        options.marketSegment = store.aosParams.marketSegment || 'COM';
        options.clientId = store.checkoutClientId;

        const promoStatus = computePromoStatus(
            store.storedPromoOverride,
            store.promotionCode,
        );

        let node = this.getRootNode();
        while (node?.host && node.host.tagName !== 'MAS-OST-APP') {
            node = node.host.getRootNode();
        }
        const app = node?.host?.tagName === 'MAS-OST-APP' ? node.host : null;
        if (app) {
            app.select({
                osi,
                type,
                offer: store.selectedOffer,
                options,
                promoOverride: promoStatus.effectivePromoCode,
                country: store.country,
            });
        }

        try {
            await navigator.clipboard.writeText(this.getCodeString());
        } catch (e) {
            /* clipboard not available */
        }

        this.buttonText = 'Copied';
        const resetTimer = window.setTimeout(() => {
            this.buttonText = 'Use';
            window.clearTimeout(resetTimer);
        }, 400);
    }

    render() {
        const code = this.getCodeString();
        return html`
            <div class="code-card">
                <code>${code}</code>
                <sp-button
                    variant="accent"
                    size="s"
                    ?disabled=${!store.selectedOsi}
                    @click=${() => this.handleUse()}
                >
                    ${this.buttonText}
                </sp-button>
            </div>
        `;
    }
}

customElements.define('mas-ost-code-output', MasOstCodeOutput);
