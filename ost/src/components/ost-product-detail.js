import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';
import './ost-offer-card.js';

export class OstProductDetail extends LitElement {
    static properties = {
        summary: { type: Boolean, reflect: true },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        :host(:not([summary])) {
            flex: 1;
        }

        .header {
            display: flex;
            align-items: center;
            gap: var(--spectrum-spacing-200, 16px);
            margin-bottom: var(--spectrum-spacing-200, 16px);
            border-bottom: 1px solid var(--spectrum-gray-200);
            padding-bottom: var(--spectrum-spacing-200, 16px);
        }

        .section-label {
            font-size: var(--spectrum-font-size-75, 11px);
            color: var(--spectrum-gray-700, #464646);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: var(--spectrum-spacing-100, 8px);
        }

        .header-icon {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
            border-radius: var(--spectrum-corner-radius-100, 4px);
        }

        .header-info {
            flex: 1;
            min-width: 0;
        }

        .product-name {
            font-size: var(--spectrum-font-size-200, 16px);
            font-weight: var(--spectrum-bold-font-weight, 700);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .arrangement-code {
            font-size: var(--spectrum-font-size-75, 12px);
            color: var(--spectrum-gray-600, #6e6e6e);
            font-family: inherit;
            overflow-wrap: anywhere;
        }

        .arrangement-label {
            font-weight: 600;
            color: var(--spectrum-gray-700);
        }

        .offer-details {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 4px 12px;
            font-size: 12px;
            padding: 12px 16px;
            background: var(--spectrum-gray-50);
            border-radius: 6px;
            margin-bottom: 12px;
        }

        .detail-label {
            font-weight: 600;
            color: var(--spectrum-gray-700);
            white-space: nowrap;
        }

        .detail-value {
            color: var(--spectrum-gray-800);
            font-family: inherit;
            word-break: break-all;
        }

        .offers-table {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }

        .offers-table-head {
            display: table-header-group;
        }

        .offers-table-body {
            display: table-row-group;
        }

        .th {
            display: table-cell;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 600;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 2px solid var(--spectrum-gray-200);
            white-space: nowrap;
            text-align: left;
        }

        .th-actions {
            text-align: right;
        }

        :host([summary]) {
            flex-shrink: 0;
        }

        :host([summary]) .header {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
            background: var(--spectrum-gray-75);
            border-radius: 8px;
            padding: 12px 16px;
            flex-wrap: wrap;
        }

        :host([summary]) .header-icon {
            width: 28px;
            height: 28px;
        }

        .hint-text {
            font-size: 13px;
            color: var(--spectrum-gray-500);
            font-style: italic;
            text-align: center;
            padding: 16px;
        }

        .empty-state {
            color: var(--spectrum-gray-600, #959595);
            font-size: var(--spectrum-font-size-100, 14px);
            padding: var(--spectrum-spacing-300, 24px);
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
        }

        .loading-container {
            display: flex;
            justify-content: center;
            padding: var(--spectrum-spacing-300, 24px);
        }
    `;

    constructor() {
        super();
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

    render() {
        const product = store.selectedProduct;
        if (!product) {
            return html`<div class="empty-state">Select a product to view offers.</div>`;
        }

        const arrangementCode = product.arrangement_code || product.arrangementCode || store.aosParams.arrangementCode;

        if (this.summary) {
            return html`
                <div class="header">
                    ${product.icon ? html`<img class="header-icon" src="${product.icon}" alt="" />` : ''}
                    <div class="header-info">
                        <div class="product-name">${product.name}</div>
                        <div class="arrangement-code">${arrangementCode}</div>
                    </div>
                    ${store.landscape === 'BOTH'
                        ? nothing
                        : html`<sp-badge size="s" variant="informative">${store.landscape}</sp-badge>`}
                </div>
            `;
        }

        const offers = store.offers;
        return html`
            <div class="header">
                ${product.icon ? html`<img class="header-icon" src="${product.icon}" alt="" />` : ''}
                <div class="header-info">
                    <div class="product-name">${product.name}</div>
                    <div class="arrangement-code"><span class="arrangement-label">Code: </span>${arrangementCode}</div>
                </div>
                <sp-badge size="s" variant="informative">${store.landscape}</sp-badge>
            </div>
            <div class="offer-details">
                <span class="detail-label">Arrangement Code</span>
                <span class="detail-value">${arrangementCode}</span>
                ${product.product_code
                    ? html`
                          <span class="detail-label">Product Code</span>
                          <span class="detail-value">${product.product_code}</span>
                      `
                    : ''}
                ${product.product_family
                    ? html`
                          <span class="detail-label">Product Family</span>
                          <span class="detail-value">${product.product_family}</span>
                      `
                    : ''}
            </div>
            ${store.loading
                ? html`<div class="loading-container">
                      <sp-progress-circle indeterminate size="m" label="Loading offers"></sp-progress-circle>
                  </div>`
                : offers.length === 0
                  ? html`<div class="empty-state">
                        No offers found. Try changing your filters or switching to Draft landscape.
                    </div>`
                  : html`
                        <div class="section-label">Offers (${offers.length})</div>
                        <div class="offers-table">
                            <div class="offers-table-head">
                                <span class="th">Price</span>
                                <span class="th">Plan</span>
                                <span class="th">Type</span>
                                <span class="th">Offer ID</span>
                                <span class="th th-actions"></span>
                            </div>
                            <div class="offers-table-body">
                                ${offers.map(
                                    (offer) => html`
                                        <ost-offer-card
                                            .offer=${offer}
                                            ?selected=${store.isOfferSelected(offer)}
                                            ?last-selected=${!store.selectedOffer &&
                                            store.lastSelectedOfferId === offer.offer_id}
                                        ></ost-offer-card>
                                    `,
                                )}
                            </div>
                        </div>
                        ${!store.selectedOffer
                            ? html`<div class="hint-text">Select an offer to configure your placeholder</div>`
                            : ''}
                    `}
        `;
    }
}

customElements.define('ost-product-detail', OstProductDetail);
