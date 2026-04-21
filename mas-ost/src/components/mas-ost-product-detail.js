import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/badge/sp-badge.js';
import '@spectrum-web-components/progress-circle/sp-progress-circle.js';
import { store } from '../store/ost-store.js';
import { applyPlanType } from '../utils/plan-types.js';
import { searchOffers, createOfferSelector, resolveOfferSelector } from '../utils/aos-client.js';
import './mas-ost-offer-card.js';
import './mas-ost-help-icon.js';
import { HELP_TOOLTIPS } from '../data/help-content.js';

function formatPrice(offer) {
    if (!offer) return '';
    const pricing = offer.pricing;
    if (!pricing) return '';
    const symbol = pricing.currency?.symbol || '';
    const formatString = pricing.currency?.format_string || '';
    const priceValue =
        pricing.prices?.[0]?.price_details?.display_rules?.price;
    if (priceValue === undefined) return '';
    if (symbol) return `${symbol}${priceValue.toFixed(2)}`;
    if (formatString) {
        return formatString.replace(/#[#,.0]+/, priceValue.toFixed(2));
    }
    return String(priceValue);
}

const DEFAULT_AOS_PARAMS = {
    buyingProgram: 'RETAIL',
    merchant: 'ADOBE',
    salesChannel: 'DIRECT',
    serviceProviders: ['PRICING'],
};

export class MasOstProductDetail extends LitElement {
    static properties = {
        loading: { type: Boolean, state: true },
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

        .change-link {
            font-size: 13px;
            color: var(--spectrum-blue-900);
            cursor: pointer;
            white-space: nowrap;
            text-decoration: none;
        }

        .change-link:hover {
            text-decoration: underline;
        }

        .summary-price {
            font-weight: 700;
            font-size: 14px;
            white-space: nowrap;
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
        this.loading = false;
        this.previousProduct = undefined;
        this.previousParamsKey = '';
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
        this.handleStoreChange();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    handleChangeOffer() {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
        store.notify();
    }

    async autoResolveOsi(offer) {
        if (offer.offer_type?.startsWith('fake-')) {
            store.setOsi(offer.offer_type);
            return;
        }
        try {
            const params = {
                product_arrangement_code: offer.product_arrangement_code,
                buying_program: offer.buying_program,
                commitment: offer.commitment,
                term: offer.term,
                customer_segment: offer.customer_segment,
                market_segment: Array.isArray(offer.market_segments)
                    ? offer.market_segments[0]
                    : offer.market_segment,
                sales_channel: offer.sales_channel,
                offer_type: offer.offer_type,
                price_point: offer.price_point,
                merchant: offer.merchant,
            };
            const config = {
                accessToken: store.accessToken,
                apiKey: store.apiKey,
                baseUrl: store.baseUrl,
                env: store.env,
            };
            const { data: { id } } = await createOfferSelector(params, config);
            store.setOsi(id);
        } catch {
            /* auto OSI resolution failed — user can still click the offer */
        }
    }

    async autoFillBaseAndTrial(offers) {
        if (!store.multiSelect) return;
        const baseOffer = offers.find((o) => o.offer_type === 'BASE');
        const trialOffer = offers.find((o) => o.offer_type === 'TRIAL');
        if (!baseOffer || !trialOffer || offers.length !== 2) return;

        const config = {
            accessToken: store.accessToken,
            apiKey: store.apiKey,
            baseUrl: store.baseUrl,
            env: store.env,
        };
        try {
            const [baseOsi, trialOsi] = await Promise.all([
                resolveOfferSelector(baseOffer, config),
                resolveOfferSelector(trialOffer, config),
            ]);
            store.addOffer(baseOffer, baseOsi, 'base');
            store.addOffer(trialOffer, trialOsi, 'trial');
        } catch {
            /* auto-fill failed — user can select manually */
        }
    }

    handleStoreChange() {
        const product = store.selectedProduct;
        const paramsKey = JSON.stringify(store.aosParams) + store.country + store.landscape + store.env;
        const shouldRefetch =
            product &&
            (product !== this.previousProduct ||
                paramsKey !== this.previousParamsKey);
        if (shouldRefetch) {
            this.previousProduct = product;
            this.previousParamsKey = paramsKey;
            this.fetchOffers(product);
        }
        this.requestUpdate();
    }

    async fetchOffers(product) {
        const {
            aosParams: {
                commitment,
                term,
                customerSegment,
                offerType,
                marketSegment,
                pricePoint,
            },
            country,
            landscape,
            env,
            environment,
            apiKey,
            accessToken,
        } = store;

        const arrangementCode = product.arrangement_code || product.arrangementCode || store.aosParams.arrangementCode;

        if (offerType && offerType.startsWith('fake-')) {
            const fakeOffer = {
                offer_id: 'Fake Offer',
                offer_type: offerType,
                price_point: 'I am not real!',
                language: 'Fake',
                market_segments: ['COM'],
                pricing: {
                    currency: { format_string: "'US$'#,##0.00" },
                    prices: [{ price_details: { display_rules: { price: 99.9 } } }],
                },
                planType: 'Fake',
                name: product.name,
                icon: product.icon,
                id: 'Fake Offer',
            };
            store.setOffers([fakeOffer]);
            return;
        }

        this.loading = true;
        try {
            let language = country === 'GB' ? 'EN' : 'MULT';
            if (commitment === 'PERPETUAL') {
                language = undefined;
            }

            const searchParams = {
                ...DEFAULT_AOS_PARAMS,
                arrangementCode: [arrangementCode],
                pricePoint: pricePoint ? [pricePoint] : undefined,
                commitment,
                term,
                offerType,
                customerSegment,
                marketSegment,
                country,
                language,
            };

            const searchConfig = {
                accessToken,
                apiKey,
                baseUrl: store.baseUrl,
                env,
                environment,
                landscape,
                pageSize: 1000,
            };

            const res = await searchOffers(searchParams, searchConfig);
            let offers = (res.data || res).map(applyPlanType);
            offers = offers.map((offer) => ({
                ...offer,
                id: offer.offer_id,
                name: product.name,
                icon: product.icon,
            }));
            offers.sort(
                ({ name: nameLeft, price_point: ppLeft }, { name: nameRight, price_point: ppRight }) =>
                    `${nameRight}${ppRight}`.localeCompare(`${nameLeft}${ppLeft}`),
            );
            store.setOffers(offers);
            if (offers.length === 1) {
                store.setOffer(offers[0]);
                this.autoResolveOsi(offers[0]);
            } else {
                await this.autoFillBaseAndTrial(offers);
            }
        } catch {
            store.setOffers([]);
        }
        this.loading = false;
    }

    render() {
        const product = store.selectedProduct;
        if (!product) {
            return html`<div class="empty-state">Select a product to view offers.</div>`;
        }

        const arrangementCode = product.arrangement_code || product.arrangementCode || store.aosParams.arrangementCode;

        if (this.summary) {
            const offer = store.selectedOffer;
            const price = offer ? formatPrice(offer) : '';
            return html`
                <div class="header">
                    ${product.icon ? html`<img class="header-icon" src="${product.icon}" alt="" />` : ''}
                    <div class="header-info">
                        <div class="product-name">${product.name}</div>
                        <div class="arrangement-code">${arrangementCode}</div>
                    </div>
                    ${price ? html`<span class="summary-price">${price}</span>` : ''}
                    <sp-badge size="s" variant="informative">${store.landscape}</sp-badge>
                    <a class="change-link" @click=${this.handleChangeOffer}>Change</a>
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
                ${product.product_code ? html`
                    <span class="detail-label">Product Code</span>
                    <span class="detail-value">${product.product_code}</span>
                ` : ''}
                ${product.product_family ? html`
                    <span class="detail-label">Product Family</span>
                    <span class="detail-value">${product.product_family}</span>
                ` : ''}
            </div>
            ${this.loading
                ? html`<div class="loading-container"><sp-progress-circle indeterminate size="m" label="Loading offers"></sp-progress-circle></div>`
                : offers.length === 0
                    ? html`<div class="empty-state">No offers found. Try changing your filters or switching to Draft landscape.</div>`
                    : html`
                        <div class="section-label">Offers (${offers.length})</div>
                        <div class="offers-table">
                            <div class="offers-table-head">
                                <span class="th">Price</span>
                                <span class="th">Plan <mas-ost-help-icon text="${HELP_TOOLTIPS.planBadge}"></mas-ost-help-icon></span>
                                <span class="th">Type</span>
                                <span class="th">Offer ID <mas-ost-help-icon text="${HELP_TOOLTIPS.offerId}"></mas-ost-help-icon></span>
                                <span class="th th-actions"></span>
                            </div>
                            <div class="offers-table-body">
                                ${offers.map(
                                    (offer) => html`
                                        <mas-ost-offer-card
                                            .offer=${offer}
                                            ?selected=${store.isOfferSelected(offer)}
                                        ></mas-ost-offer-card>
                                    `,
                                )}
                            </div>
                        </div>
                        ${!store.selectedOffer ? html`<div class="hint-text">Select an offer to configure your placeholder</div>` : ''}
                    `}
        `;
    }
}

customElements.define('mas-ost-product-detail', MasOstProductDetail);
