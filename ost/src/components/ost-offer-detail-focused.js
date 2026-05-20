import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';
import { resolveOfferSelector } from '../utils/aos-client.js';

function isFreeOffer(offer) {
    if (offer?.price_point === 'FREE') return true;
    const priceValue = offer?.pricing?.prices?.[0]?.price_details?.display_rules?.price;
    return priceValue === 0;
}

function currencySymbol(offer) {
    return offer?.pricing?.currency?.symbol || '$';
}

function formatPrice(offer) {
    if (isFreeOffer(offer)) {
        return `${currencySymbol(offer)}0.00`;
    }
    const pricing = offer?.pricing;
    if (!pricing) return '';
    const symbol = pricing.currency?.symbol || '';
    const formatString = pricing.currency?.format_string || '';
    const priceValue = pricing.prices?.[0]?.price_details?.display_rules?.price;
    if (priceValue === undefined) return '';
    if (symbol) return `${symbol}${priceValue.toFixed(2)}`;
    if (formatString) return formatString.replace(/#[#,.0]+/, priceValue.toFixed(2));
    return String(priceValue);
}

function formatPeriod(offer) {
    const term = offer?.term;
    const commitment = offer?.commitment;
    if (commitment === 'YEAR' || term === 'ANNUAL') return '/yr';
    if (commitment === 'MONTH' || term === 'MONTHLY') return '/mo';
    return '';
}

const PLAN_BADGE_VARIANT = {
    ABM: 'positive',
    PUF: 'informative',
    M2M: 'yellow',
    PERPETUAL: 'seafoam',
    P3Y: 'fuchsia',
};

export class OstOfferDetailFocused extends LitElement {
    static properties = {
        osi: { type: String, state: true },
        osiLoading: { type: Boolean, state: true },
        osiError: { type: String, state: true },
        osiCopied: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            display: flex;
            flex: 1;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
            font-family: inherit;
        }

        .scroll {
            flex: 1;
            overflow-y: auto;
            padding: 28px 32px 24px;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
        }

        .header-icon {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            object-fit: cover;
        }

        .header-info {
            flex: 1;
            min-width: 0;
        }

        .product-name {
            font-size: 18px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
        }

        .arrangement-code {
            font-size: 12px;
            color: var(--spectrum-gray-700);
            word-break: break-all;
        }

        .price-block {
            margin-bottom: 24px;
            display: flex;
            align-items: baseline;
            gap: 12px;
        }

        .price {
            font-size: 32px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
        }

        .period {
            font-size: 16px;
            color: var(--spectrum-gray-700);
        }

        .section-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--spectrum-gray-600);
            margin: 24px 0 12px;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: 160px 1fr;
            gap: 10px 16px;
            font-size: 13px;
        }

        .detail-label {
            color: var(--spectrum-gray-600);
            font-weight: 600;
        }

        .detail-value {
            color: var(--spectrum-gray-900);
            word-break: break-all;
        }

        .badges {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .osi-cell {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .osi-value {
            word-break: break-all;
            font-family: inherit;
        }

        .osi-error {
            color: var(--spectrum-red-900, #c9252d);
            font-size: 12px;
        }

        .osi-empty {
            color: var(--spectrum-gray-500);
        }

        .copied-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--spectrum-positive-visual-color, #12805c);
        }
    `;

    constructor() {
        super();
        this.osi = '';
        this.osiLoading = false;
        this.osiError = '';
        this.osiCopied = false;
        this.resolvedOfferId = null;
        this.storeHandler = () => {
            this.requestUpdate();
            this.ensureOsi();
        };
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.storeHandler);
        this.ensureOsi();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.storeHandler);
    }

    async ensureOsi() {
        const offer = store.selectedOffer;
        if (!offer) {
            this.osi = '';
            this.osiError = '';
            this.resolvedOfferId = null;
            return;
        }
        const offerId = offer.offer_id || offer.id;
        if (this.resolvedOfferId === offerId && (this.osi || this.osiError)) return;
        this.resolvedOfferId = offerId;
        this.osi = '';
        this.osiError = '';
        this.osiLoading = true;
        try {
            const osi = await resolveOfferSelector(offer, {
                accessToken: store.accessToken,
                apiKey: store.apiKey,
                baseUrl: store.baseUrl,
                env: store.env,
            });
            // Ignore stale responses if the user navigated to a different offer.
            if (this.resolvedOfferId !== offerId) return;
            this.osi = osi || '';
        } catch (err) {
            if (this.resolvedOfferId !== offerId) return;
            this.osiError = 'Could not resolve OSI';
        } finally {
            if (this.resolvedOfferId === offerId) this.osiLoading = false;
        }
    }

    async copyOsi() {
        if (!this.osi) return;
        try {
            await navigator.clipboard.writeText(this.osi);
            this.osiCopied = true;
            setTimeout(() => {
                this.osiCopied = false;
            }, 1500);
        } catch (err) {
            /* clipboard not available */
        }
    }

    render() {
        const product = store.selectedProduct;
        const offer = store.selectedOffer;
        if (!offer) return html``;

        const price = formatPrice(offer);
        const period = formatPeriod(offer);
        const planType = offer.planType;
        const planVariant = PLAN_BADGE_VARIANT[planType] || 'neutral';
        const marketSegments = Array.isArray(offer.market_segments) ? offer.market_segments : [];

        return html`
            <div class="scroll">
                <div class="header">
                    ${product?.icon ? html`<img class="header-icon" src="${product.icon}" alt="" />` : ''}
                    <div class="header-info">
                        <div class="product-name">${product?.name ?? offer.name ?? 'Offer'}</div>
                        ${product?.arrangement_code
                            ? html`<div class="arrangement-code">${product.arrangement_code}</div>`
                            : ''}
                    </div>
                    <sp-badge size="s" variant="informative">${store.landscape}</sp-badge>
                </div>

                <div class="price-block">
                    ${price ? html`<span class="price">${price}</span>` : ''}
                    ${period ? html`<span class="period">${period}</span>` : ''}
                </div>

                <div class="section-label">Offer details</div>
                <div class="detail-grid">
                    <span class="detail-label">Offer ID</span>
                    <span class="detail-value">${offer.offer_id || ''}</span>

                    <span class="detail-label">OSI</span>
                    <span class="detail-value osi-cell">
                        ${this.osiLoading
                            ? html`<sp-progress-circle indeterminate size="s" label="Resolving OSI"></sp-progress-circle>`
                            : this.osi
                              ? html`
                                    <span class="osi-value">${this.osi}</span>
                                    ${this.osiCopied
                                        ? html`<span class="copied-label">Copied</span>`
                                        : html`<sp-action-button quiet size="xs" label="Copy OSI" @click=${() => this.copyOsi()}
                                              ><sp-icon-copy slot="icon"></sp-icon-copy
                                          ></sp-action-button>`}
                                `
                              : this.osiError
                                ? html`<span class="osi-error">${this.osiError}</span>`
                                : html`<span class="osi-empty">—</span>`}
                    </span>

                    ${planType
                        ? html`
                              <span class="detail-label">Plan</span>
                              <span class="detail-value"
                                  ><sp-badge size="s" variant="${planVariant}">${planType}</sp-badge></span
                              >
                          `
                        : ''}
                    ${offer.offer_type
                        ? html`
                              <span class="detail-label">Offer type</span>
                              <span class="detail-value"
                                  ><sp-badge size="s" variant="neutral">${offer.offer_type}</sp-badge></span
                              >
                          `
                        : ''}
                    ${offer.commitment
                        ? html`
                              <span class="detail-label">Commitment</span>
                              <span class="detail-value">${offer.commitment}</span>
                          `
                        : ''}
                    ${offer.term
                        ? html`
                              <span class="detail-label">Term</span>
                              <span class="detail-value">${offer.term}</span>
                          `
                        : ''}
                    ${offer.customer_segment
                        ? html`
                              <span class="detail-label">Customer segment</span>
                              <span class="detail-value">${offer.customer_segment}</span>
                          `
                        : ''}
                    ${marketSegments.length > 0
                        ? html`
                              <span class="detail-label">Market segments</span>
                              <span class="detail-value">
                                  <div class="badges">
                                      ${marketSegments.map((m) => html`<sp-badge size="s" variant="neutral">${m}</sp-badge>`)}
                                  </div>
                              </span>
                          `
                        : ''}
                    ${offer.price_point
                        ? html`
                              <span class="detail-label">Price point</span>
                              <span class="detail-value">${offer.price_point}</span>
                          `
                        : ''}
                    ${offer.language
                        ? html`
                              <span class="detail-label">Language</span>
                              <span class="detail-value">${offer.language}</span>
                          `
                        : ''}
                </div>

                ${product
                    ? html`
                          <div class="section-label">Product</div>
                          <div class="detail-grid">
                              ${product.product_code
                                  ? html`
                                        <span class="detail-label">Product code</span>
                                        <span class="detail-value">${product.product_code}</span>
                                    `
                                  : ''}
                              ${product.product_family
                                  ? html`
                                        <span class="detail-label">Product family</span>
                                        <span class="detail-value">${product.product_family}</span>
                                    `
                                  : ''}
                              ${product.arrangement_code
                                  ? html`
                                        <span class="detail-label">Arrangement code</span>
                                        <span class="detail-value">${product.arrangement_code}</span>
                                    `
                                  : ''}
                          </div>
                      `
                    : ''}
            </div>
        `;
    }
}

customElements.define('ost-offer-detail-focused', OstOfferDetailFocused);
