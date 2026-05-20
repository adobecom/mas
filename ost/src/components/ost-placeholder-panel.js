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
        }

        .section-label {
            font-size: 11px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }

        .type-chips {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spectrum-spacing-100, 8px);
        }

        .chips-divider {
            border: none;
            border-top: 1px solid var(--spectrum-gray-200);
            margin: 0;
        }

        .options-section {
            padding: 0;
        }

        .empty-state {
            color: var(--spectrum-gray-600, #8e8e8e);
            font-size: var(--spectrum-font-size-100, 14px);
        }

        .reference-osi-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .reference-osi-field sp-textfield {
            width: 100%;
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
        this.selectedType = 'price';
        this.options = { ...store.defaultPlaceholderOptions, ...store.offerSelectorPlaceholderOptions };
    }

    get placeholderCtrl() {
        return this;
    }

    setType(type) {
        this.selectedType = type;
        this.options = { ...store.defaultPlaceholderOptions, ...store.offerSelectorPlaceholderOptions };
        this.requestUpdate();
    }

    toggleOption(key) {
        this.options[key] = !this.options[key];
        this.requestUpdate();
    }

    getEffectiveOptions() {
        const typeConfig = store.placeholderTypes.find((t) => t.type === this.selectedType);
        const overrides = typeConfig?.overrides || {};
        return { ...this.options, ...overrides };
    }

    serializeOptions() {
        return { ...this.getEffectiveOptions() };
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
        const dl = store.deepLink;
        if (!dl?.type) return;
        this.deepLinkApplied = true;
        this.setType(dl.type);
        const config = this.getRootNode()?.host?.config;
        if (config?.initialReferenceOsi) {
            this.referenceOsi = config.initialReferenceOsi;
        }
    }

    get isDiscount() {
        return this.selectedType === 'discount';
    }

    handleReferenceOsiInput(e) {
        this.referenceOsi = e.target.value;
    }

    get isCheckoutUrl() {
        return this.selectedType === 'checkoutUrl';
    }

    selectType(type) {
        this.setType(type);
    }

    render() {
        if (!store.selectedOffer) {
            return html`<span class="empty-state">Select an offer to see placeholder options.</span>`;
        }

        const types = store.placeholderTypes;
        const selected = this.selectedType;

        return html`
            <div class="section-label">
                Placeholder Type <ost-help-icon text="${HELP_TOOLTIPS.placeholderType}"></ost-help-icon>
            </div>
            <div class="type-chips">
                ${types.map(
                    (t) => html`
                        <sp-action-button
                            data-testid="ost-placeholder-chip-${t.type}"
                            ?selected=${selected === t.type}
                            ?quiet=${selected !== t.type}
                            size="s"
                            @click=${() => this.selectType(t.type)}
                        >
                            ${t.name}
                        </sp-action-button>
                    `,
                )}
            </div>

            <hr class="chips-divider" />

            <div class="section-label">Options <ost-help-icon text="${HELP_TOOLTIPS.options}"></ost-help-icon></div>
            <div class="options-section">
                ${this.isCheckoutUrl
                    ? html`
                          <div class="section-label">
                              Checkout Options <ost-help-icon text="${HELP_TOOLTIPS.checkoutOptions}"></ost-help-icon>
                          </div>
                          <ost-checkout-options></ost-checkout-options>
                      `
                    : html`<ost-placeholder-options></ost-placeholder-options>`}
            </div>

            ${this.isDiscount
                ? html`
                      <div class="reference-osi-field">
                          <sp-field-label size="s">Reference offer OSI</sp-field-label>
                          <sp-textfield
                              size="s"
                              placeholder="e.g. base price OSI for comparison"
                              .value=${this.referenceOsi}
                              @input=${this.handleReferenceOsiInput}
                          ></sp-textfield>
                      </div>
                  `
                : nothing}

            <ost-live-preview
                .placeholderType=${selected}
                .referenceOsi=${this.isDiscount ? this.referenceOsi : ''}
            ></ost-live-preview>
            <ost-code-output
                .placeholderType=${selected}
                .referenceOsi=${this.isDiscount ? this.referenceOsi : ''}
            ></ost-code-output>
        `;
    }
}

customElements.define('ost-placeholder-panel', OstPlaceholderPanel);
