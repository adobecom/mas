import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';
import './ost-placeholder-options.js';
import './ost-checkout-options.js';
import './ost-live-preview.js';
import './ost-code-output.js';
import './ost-product-detail.js';

const PANEL_TABS = [
    { value: 'price', label: 'Price' },
    { value: 'checkout', label: 'Checkout' },
    { value: 'details', label: 'Offer Details' },
];

export class OstPlaceholderPanel extends LitElement {
    static styles = css`
        :host {
            font-family: inherit;
            display: flex;
            flex-direction: column;
            gap: var(--spectrum-spacing-200, 16px);
            min-width: 0;
        }

        .placeholder-rows {
            display: flex;
            flex-direction: column;
        }

        .placeholder-row {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 8px 0;
            border-bottom: 1px solid var(--spectrum-gray-200);
        }

        .placeholder-row:last-child {
            border-bottom: none;
        }

        .row-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .row-name {
            display: flex;
            align-items: center;
            gap: 8px;
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

    renderRow(type, group) {
        const isDiscount = type.type === 'discount';
        const isCheckoutUrl = type.type === 'checkoutUrl';
        const rowReferenceOsi = isDiscount ? this.referenceOsi : '';
        const roleSuffix = group.role === 'trial' || group.role === 'buy' ? `-${group.role}` : '';
        return html`
            <div class="placeholder-row" data-testid="ost-placeholder-row-${type.type}${roleSuffix}">
                <div class="row-main">
                    <div class="row-header">
                        <div class="row-name">
                            ${type.name}
                            ${group.label ? html`<sp-badge size="s" variant="informative">${group.label}</sp-badge>` : nothing}
                        </div>
                        <ost-code-output
                            .placeholderType=${type.type}
                            .referenceOsi=${rowReferenceOsi}
                            .osi=${group.osi}
                            .offer=${group.offer}
                        ></ost-code-output>
                    </div>
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

                <ost-live-preview
                    .placeholderType=${type.type}
                    .referenceOsi=${rowReferenceOsi}
                    .osi=${group.osi}
                    .offer=${group.offer}
                ></ost-live-preview>
            </div>
        `;
    }

    handleTabChange(e) {
        store.placeholderTab = e.target.selected;
    }

    // tryBuy renders one row per offer group, restricted to the two types an
    // author actually places per offer (price + CTA); exotic price types stay
    // available in Single Offer mode. Other flows render every type for their
    // one group (bundle's group carries the joined OSI).
    rowsForTab(predicate) {
        const groups = store.panelGroups;
        const types = store.placeholderTypes.filter(predicate);
        const isTryBuy = store.authoringFlow === 'tryBuy';
        const rowTypes = isTryBuy ? types.filter((t) => ['price', 'checkoutUrl'].includes(t.type)) : types;
        return groups.flatMap((group) => rowTypes.map((t) => this.renderRow(t, group)));
    }

    renderTabContent() {
        switch (store.placeholderTab) {
            case 'checkout':
                return html` <div class="placeholder-rows">${this.rowsForTab((t) => t.type === 'checkoutUrl')}</div> `;
            case 'details':
                return html`<ost-product-detail></ost-product-detail>`;
            default:
                return html`
                    <div class="placeholder-rows">${this.rowsForTab((t) => t.type !== 'checkoutUrl')}</div>
                    <ost-placeholder-options></ost-placeholder-options>
                `;
        }
    }

    render() {
        if (store.panelGroups.length === 0) {
            return html`<span class="empty-state">Select an offer to see placeholder options.</span>`;
        }

        return html`
            <sp-tabs size="m" selected=${store.placeholderTab} @change=${this.handleTabChange}>
                ${PANEL_TABS.map(
                    (tab) => html` <sp-tab data-testid="ost-tab-${tab.value}" value=${tab.value} label=${tab.label}></sp-tab> `,
                )}
            </sp-tabs>
            ${this.renderTabContent()}
        `;
    }
}

customElements.define('ost-placeholder-panel', OstPlaceholderPanel);
