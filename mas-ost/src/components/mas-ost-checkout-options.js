import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/picker/sp-picker.js';
import '@spectrum-web-components/menu/sp-menu-item.js';
import '@spectrum-web-components/checkbox/sp-checkbox.js';
import {
    WORKFLOW_STEPS,
    DEFAULT_MODAL_BY_OFFER,
    CheckoutController,
} from '../controllers/checkout-controller.js';
import '@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js';
import { store } from '../store/ost-store.js';

export class MasOstCheckoutOptions extends LitElement {
    static properties = {
        ctaDropdownOpen: { type: Boolean, state: true },
        ctaFilter: { type: String, state: true },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: flex;
            flex-direction: column;
            gap: var(--spectrum-spacing-200, 16px);
        }

        .row {
            display: flex;
            gap: var(--spectrum-spacing-200, 16px);
            align-items: end;
        }

        .info-text {
            font-size: var(--spectrum-font-size-100, 13px);
            color: var(--spectrum-gray-700);
            line-height: 1.5;
            margin-top: var(--spectrum-spacing-100);
        }

        .workflow-picker {
            display: flex;
            flex-direction: column;
        }

        .cta-wrapper {
            position: relative;
            width: fit-content;
            min-width: 200px;
        }

        .cta-label {
            font-size: var(--spectrum-field-label-text-size, 12px);
            font-weight: var(--spectrum-field-label-text-font-weight, 400);
            color: var(--spectrum-field-label-text-color, var(--spectrum-gray-700));
            margin-bottom: var(--spectrum-field-label-bottom-to-field, 4px);
        }

        .cta-button {
            display: flex;
            align-items: center;
            gap: 8px;
            height: var(--spectrum-component-height-100, 32px);
            padding: 0 10px;
            background: var(--spectrum-gray-75);
            border: 1px solid var(--spectrum-gray-400);
            border-radius: var(--spectrum-corner-radius-100, 4px);
            font-size: var(--spectrum-font-size-75, 12px);
            font-family: var(--spectrum-font-family, system-ui);
            color: var(--spectrum-gray-800);
            cursor: pointer;
            box-sizing: border-box;
        }

        .cta-button:hover {
            border-color: var(--spectrum-gray-500);
            background: var(--spectrum-gray-100);
        }

        .cta-button-label {
            flex: 1;
        }

        .cta-chevron {
            color: var(--spectrum-gray-600);
            transform: rotate(90deg);
            width: 8px;
            height: 8px;
        }

        .cta-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 240px;
            overflow-y: auto;
            overscroll-behavior: contain;
            background: var(--spectrum-white, #fff);
            border: 1px solid var(--spectrum-gray-200);
            border-radius: var(--spectrum-popover-corner-radius, 4px);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1);
            z-index: 10;
            margin-top: 4px;
            padding: 6px 0;
        }

        .cta-option {
            padding: 5px 10px;
            font-size: var(--spectrum-font-size-75, 12px);
            cursor: pointer;
            color: var(--spectrum-gray-800);
        }

        .cta-option:hover {
            background: var(--spectrum-gray-200);
        }

        .cta-option[data-selected] {
            color: var(--spectrum-blue-900);
            background: var(--spectrum-blue-100);
        }
    `;

    constructor() {
        super();
        this.checkout = new CheckoutController(this, store);
        this.deepLinkApplied = false;
        this.ctaDropdownOpen = false;
        this.ctaFilter = '';
        this.handleDocClick = this.handleDocClick.bind(this);
    }

    get workflowSteps() {
        if (this.checkout.enableModal) {
            return [{ id: 'segmentation', name: 'Segmentation' }];
        }
        return WORKFLOW_STEPS;
    }

    get modalTypes() {
        const offerType = store.selectedOffer?.offer_type;
        const allTypes = [
            { id: 'twp', name: 'TWP' },
            { id: 'd2p', name: 'D2P' },
            { id: 'crm', name: 'CRM' },
        ];
        if (offerType === 'BASE') {
            return allTypes.filter((t) => t.id !== 'twp');
        }
        if (offerType === 'TRIAL') {
            return allTypes.filter((t) => t.id !== 'd2p');
        }
        return allTypes;
    }

    connectedCallback() {
        super.connectedCallback();
        this.handleStoreChange = () => {
            this.applyDeepLink();
            this.requestUpdate();
        };
        store.subscribe(this.handleStoreChange);
        document.addEventListener('click', this.handleDocClick);
    }

    handleDocClick(e) {
        if (this.ctaDropdownOpen && !e.composedPath().includes(this)) {
            this.ctaDropdownOpen = false;
        }
    }

    selectCta(id) {
        this.checkout.setCtaText(id);
        this.ctaDropdownOpen = false;
        this.ctaFilter = '';
    }

    applyDeepLink() {
        if (this.deepLinkApplied) return;
        const dl = store.deepLink;
        if (!dl || Object.keys(dl).length === 0) return;
        this.deepLinkApplied = true;
        const ctrl = this.checkout;
        if (dl.workflowStep) ctrl.setWorkflowStep(dl.workflowStep);
        if (dl.text) ctrl.setCtaText(dl.text);
        if (dl.modal) {
            ctrl.toggleModal(true);
            ctrl.setModalType(dl.modal);
        }
        if (dl.entitlement) ctrl.toggleEntitlement(true);
        if (dl.upgrade) ctrl.toggleUpgrade(true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
        document.removeEventListener('click', this.handleDocClick);
    }

    get ctaTexts() {
        const option = store.ctaTextOption;
        if (!option) return [];
        return typeof option.getTexts === 'function' ? option.getTexts() : [];
    }

    get defaultCtaText() {
        const option = store.ctaTextOption;
        if (!option) return 'Buy now';
        return typeof option.getDefaultText === 'function' ? option.getDefaultText() : 'Buy now';
    }

    render() {
        const ctrl = this.checkout;
        const ctaTexts = this.ctaTexts;
        const currentCta = ctrl.ctaText || this.defaultCtaText;
        const currentLabel = ctaTexts.find((t) => t.id === currentCta)?.name || currentCta;
        return html`
            ${ctaTexts.length > 0 ? html`
                <div class="cta-wrapper">
                    <div class="cta-label">Choose your CTA text</div>
                    <button
                        class="cta-button"
                        @click=${() => { this.ctaDropdownOpen = !this.ctaDropdownOpen; }}
                    >
                        <span class="cta-button-label">${currentLabel}</span>
                        <sp-icon-chevron100 class="cta-chevron"></sp-icon-chevron100>
                    </button>
                    ${this.ctaDropdownOpen ? html`
                        <div class="cta-dropdown">
                            ${ctaTexts.map((t) => html`
                                <div
                                    class="cta-option"
                                    ?data-selected=${t.id === currentCta}
                                    @click=${() => this.selectCta(t.id)}
                                >${t.name}</div>
                            `)}
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <div class="workflow-picker">
                <sp-picker
                    label="Workflow Step"
                    value=${ctrl.workflowStep}
                    ?disabled=${ctrl.enableModal}
                    @change=${(e) => ctrl.setWorkflowStep(e.target.value)}
                >
                    ${this.workflowSteps.map(
                        (s) =>
                            html`<sp-menu-item value=${s.id}
                                >${s.name}</sp-menu-item
                            >`,
                    )}
                </sp-picker>
            </div>

            <sp-checkbox
                ?checked=${ctrl.enableModal}
                @change=${(e) => {
                    ctrl.toggleModal(e.target.checked);
                    if (e.target.checked) {
                        const offerType = store.selectedOffer?.offer_type;
                        ctrl.setModalType(
                            DEFAULT_MODAL_BY_OFFER[offerType] || 'd2p',
                        );
                    }
                }}
            >
                Enable Modal
            </sp-checkbox>

            ${ctrl.enableModal
                ? html`
                      <sp-picker
                          label="Modal Type"
                          value=${ctrl.modalType}
                          @change=${(e) => ctrl.setModalType(e.target.value)}
                      >
                          ${this.modalTypes.map(
                              (m) =>
                                  html`<sp-menu-item value=${m.id}
                                      >${m.name}</sp-menu-item
                                  >`,
                          )}
                      </sp-picker>
                  `
                : ''}

            <sp-checkbox
                ?checked=${ctrl.entitlement}
                @change=${(e) => ctrl.toggleEntitlement(e.target.checked)}
            >
                Enable Entitlements
            </sp-checkbox>

            <sp-checkbox
                ?checked=${ctrl.upgrade}
                @change=${(e) => ctrl.toggleUpgrade(e.target.checked)}
            >
                Enable Upgrade
            </sp-checkbox>

            <span class="info-text">
                Entitlement/Upgrade features will show a Download/Upgrade button
                to logged-in eligible users. Both can be combined with Modal
                feature or Checkout Link.
            </span>
        `;
    }
}

customElements.define('mas-ost-checkout-options', MasOstCheckoutOptions);
