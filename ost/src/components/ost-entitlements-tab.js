import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';
import './ost-search.js';
import './ost-product-list.js';
import './ost-filter-bar.js';
import './ost-country-picker.js';
import './ost-product-detail.js';

const FLOW_LABELS = [
    { value: 'single', label: 'Single Offer' },
    { value: 'tryBuy', label: 'Try / Buy' },
    { value: 'bundle', label: 'Soft Bundle' },
];

export class OstEntitlementsTab extends LitElement {
    static styles = css`
        :host {
            font-family: inherit;
            display: grid;
            grid-template-rows: auto 1fr auto;
            gap: 16px;
            flex: 1;
            min-height: 490px;
            padding: 16px 24px;
            background: var(--spectrum-gray-100);
            overflow: hidden;
        }

        .tab-heading {
            font-size: 16px;
            font-weight: 600;
            color: var(--spectrum-gray-900);
            margin: 0;
        }

        .panels {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            min-height: 0;
        }

        .panel {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px;
            background: var(--spectrum-gray-50);
            border: 1px solid var(--spectrum-gray-200);
            border-radius: var(--spectrum-corner-radius-100, 4px);
            min-height: 0;
            overflow: hidden;
        }

        .panel-products ost-product-list {
            flex: 1;
            overflow-y: auto;
            overscroll-behavior: contain;
        }

        .panel-entitlements {
            overflow-y: auto;
        }

        .panel-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--spectrum-gray-600);
        }

        .panel-error {
            padding: 10px 12px;
            border: 1px solid var(--spectrum-red-300, #f5c2c7);
            border-radius: 8px;
            background: var(--spectrum-red-75, #fff1f1);
            color: var(--spectrum-red-900, #c9252d);
            font-size: 12px;
            line-height: 1.4;
        }

        .mode-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 20px;
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
    `;

    static properties = {
        productsError: { type: String },
    };

    constructor() {
        super();
        this.productsError = '';
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

    cancel() {
        this.dispatchEvent(new CustomEvent('ost-tab-cancel', { bubbles: true, composed: true }));
    }

    // Resolve any pending (debounced) search before advancing so a fast
    // type-then-Next on an OSI/offer query still resolves its product/offer.
    // The flush clears the prior selection synchronously, so "Use" stays
    // disabled on the offer step until the new query's offer resolves (no race
    // where Use is clickable on a stale selection).
    handleNext() {
        const search = this.shadowRoot?.querySelector('ost-search');
        if (search?.hasPendingOsiSearch?.()) {
            store.clearSelectedOffer();
        }
        search?.flushPendingSearch?.();
        store.goToOffer();
    }

    render() {
        return html`
            <h2 class="tab-heading">Select your product from the list below</h2>

            <div class="panels">
                <div class="panel panel-products">
                    <ost-search></ost-search>
                    <div class="panel-label">Products</div>
                    ${this.productsError ? html`<div class="panel-error">${this.productsError}</div>` : ''}
                    <ost-product-list></ost-product-list>
                </div>

                <div class="panel panel-entitlements">
                    <div class="panel-label">Select your entitlements</div>
                    <ost-filter-bar></ost-filter-bar>
                    <ost-country-picker></ost-country-picker>
                    <div class="mode-group">
                        <span class="panel-label">Authoring mode</span>
                        <sp-picker
                            data-testid="ost-authoring-mode"
                            size="s"
                            label="Authoring mode"
                            value=${store.authoringFlow}
                            @change=${(e) => store.chooseAuthoringFlow(e.target.value)}
                        >
                            ${FLOW_LABELS.map(
                                (flow) =>
                                    html`<sp-menu-item data-testid="ost-authoring-mode-${flow.value}" value=${flow.value}
                                        >${flow.label}</sp-menu-item
                                    >`,
                            )}
                        </sp-picker>
                    </div>
                    <ost-product-detail summary></ost-product-detail>
                </div>
            </div>

            <div class="footer">
                <sp-button data-testid="ost-cancel-button" variant="secondary" size="m" @click=${() => this.cancel()}
                    >Cancel</sp-button
                >
                <sp-button
                    data-testid="ost-footer-next-button"
                    variant="accent"
                    size="m"
                    ?disabled=${!store.canAdvance}
                    @click=${() => this.handleNext()}
                    >Next</sp-button
                >
            </div>
        `;
    }
}

customElements.define('ost-entitlements-tab', OstEntitlementsTab);
