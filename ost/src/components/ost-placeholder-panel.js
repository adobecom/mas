import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';
import './ost-placeholder-options.js';
import './ost-checkout-options.js';
import './ost-live-preview.js';
import './ost-code-output.js';
import './ost-help-icon.js';
import { HELP_TOOLTIPS } from '../data/help-content.js';

export class OstPlaceholderPanel extends LitElement {
    static styles = css`
        :host {
            font-family: inherit;
            display: flex;
            flex-direction: column;
            gap: var(--spectrum-spacing-200, 16px);
            min-width: 0;
        }

        .section-label {
            font-size: 11px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }

        .placeholder-rows {
            display: flex;
            flex-direction: column;
        }

        .placeholder-row {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px 0;
            border-bottom: 1px solid var(--spectrum-gray-200);
        }

        .placeholder-row:last-child {
            border-bottom: none;
        }

        .row-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
        }

        .row-description {
            font-size: 12px;
            color: var(--spectrum-gray-600);
            margin-top: 2px;
        }

        .row-main {
            min-width: 0;
        }

        .reference-osi-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .reference-osi-field sp-textfield {
            width: 100%;
        }

        .empty-state {
            color: var(--spectrum-gray-600, #8e8e8e);
            font-size: var(--spectrum-font-size-100, 14px);
        }
    `;

    static properties = {
        referenceOsi: { type: String, state: true },
    };

    constructor() {
        super();
        this.handleStoreChange = this.handleStoreChange.bind(this);
        this.deepLinkApplied = false;
        this.referenceOsi = '';
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
        this.applyDeepLink();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    handleStoreChange() {
        this.applyDeepLink();
        this.requestUpdate();
    }

    applyDeepLink() {
        if (this.deepLinkApplied) return;
        const config = this.getRootNode()?.host?.config;
        if (config?.initialReferenceOsi) {
            this.deepLinkApplied = true;
            this.referenceOsi = config.initialReferenceOsi;
        }
    }

    handleReferenceOsiInput(e) {
        this.referenceOsi = e.target.value;
    }

    renderRow(type) {
        const isDiscount = type.type === 'discount';
        const isCheckoutUrl = type.type === 'checkoutUrl';
        const rowReferenceOsi = isDiscount ? this.referenceOsi : '';
        return html`
            <div class="placeholder-row" data-testid="ost-placeholder-row-${type.type}">
                <div class="row-main">
                    <div class="row-name">${type.name}</div>
                    ${type.description ? html`<div class="row-description">${type.description}</div>` : nothing}
                </div>

                ${isCheckoutUrl ? html`<ost-checkout-options></ost-checkout-options>` : nothing}
                ${isDiscount
                    ? html`
                          <div class="reference-osi-field">
                              <sp-field-label size="s">Reference offer OSI</sp-field-label>
                              <sp-textfield
                                  data-testid="ost-reference-osi-input"
                                  size="s"
                                  placeholder="e.g. base price OSI for comparison"
                                  .value=${this.referenceOsi}
                                  @input=${this.handleReferenceOsiInput}
                              ></sp-textfield>
                          </div>
                      `
                    : nothing}

                <ost-code-output .placeholderType=${type.type} .referenceOsi=${rowReferenceOsi}></ost-code-output>

                <ost-live-preview .placeholderType=${type.type} .referenceOsi=${rowReferenceOsi}></ost-live-preview>
            </div>
        `;
    }

    render() {
        if (!store.selectedOffer) {
            return html`<span class="empty-state">Select an offer to see placeholder options.</span>`;
        }

        const types = store.placeholderTypes;

        return html`
            <div class="section-label">Options <ost-help-icon text="${HELP_TOOLTIPS.options}"></ost-help-icon></div>
            <ost-placeholder-options></ost-placeholder-options>

            <div class="section-label">
                Placeholder Type <ost-help-icon text="${HELP_TOOLTIPS.placeholderType}"></ost-help-icon>
            </div>
            <div class="placeholder-rows">${types.map((t) => this.renderRow(t))}</div>
        `;
    }
}

customElements.define('ost-placeholder-panel', OstPlaceholderPanel);
