import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';
import { resolveOfferSelector } from '../utils/aos-client.js';
import { PLAN_TYPE_COLORS } from '../data/plan-type-colors.js';

function getTrialDays(offer) {
    if (offer.offer_type !== 'TRIAL') return null;
    const match = (offer.price_point || '').match(/(\d+)_DAY/i);
    return match ? parseInt(match[1], 10) : null;
}

function isFreeOffer(offer) {
    if (offer?.price_point === 'FREE') return true;
    const priceValue = offer?.pricing?.prices?.[0]?.price_details?.display_rules?.price;
    return priceValue === 0;
}

function currencySymbol(offer) {
    return offer?.pricing?.currency?.symbol || '$';
}

function formatPeriod(offer) {
    const term = offer.term;
    const commitment = offer.commitment;
    if (commitment === 'YEAR' || term === 'ANNUAL') return '/yr';
    if (commitment === 'MONTH' || term === 'MONTHLY') return '/mo';
    return '';
}

function formatPrice(offer) {
    if (isFreeOffer(offer)) {
        return `${currencySymbol(offer)}0.00`;
    }
    const pricing = offer.pricing;
    if (!pricing) return '';
    const symbol = pricing.currency?.symbol || '';
    const formatString = pricing.currency?.format_string || '';
    const priceValue = pricing.prices?.[0]?.price_details?.display_rules?.price;
    if (priceValue === undefined) return '';
    if (symbol && priceValue !== undefined) {
        return `${symbol}${priceValue.toFixed(2)}`;
    }
    if (formatString) {
        return formatString.replace(/#[#,.0]+/, priceValue.toFixed(2));
    }
    return String(priceValue);
}

export class OstOfferCard extends LitElement {
    static properties = {
        offer: { type: Object },
        selected: { type: Boolean, reflect: true },
        lastSelected: { type: Boolean, reflect: true, attribute: 'last-selected' },
        // `card` switches the host from the compact table-row layout (used in
        // the product-detail offers table) to the legacy bordered card layout
        // (used in the offer tab's left column).
        card: { type: Boolean, reflect: true },
        resolving: { type: Boolean, state: true },
        copied: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: table-row;
            cursor: pointer;
        }

        :host(:hover) {
            background: var(--spectrum-gray-100);
        }

        :host([selected]) {
            background: var(--spectrum-blue-50);
        }

        :host([last-selected]:not([selected])) {
            background: var(--spectrum-gray-75, #fafafa);
            box-shadow: inset 3px 0 0 var(--spectrum-blue-700, #1473e6);
        }

        :host([last-selected]:not([selected])):hover {
            background: var(--spectrum-gray-100);
        }

        .cell {
            display: table-cell;
            padding: 10px 12px;
            vertical-align: middle;
            border-bottom: 1px solid var(--spectrum-gray-200);
            font-size: 13px;
            color: var(--spectrum-gray-800);
        }

        .cell sp-badge {
            display: inline-flex;
            vertical-align: middle;
        }

        .cell sp-badge + sp-badge {
            margin-left: 4px;
        }

        :host([selected]) .cell {
            border-bottom-color: var(--spectrum-blue-200, rgba(20, 115, 230, 0.2));
        }

        .cell-price {
            font-weight: 700;
            font-size: 14px;
            color: var(--spectrum-gray-900);
            white-space: nowrap;
        }

        .cell-id {
            font-family: inherit;
            font-size: 12px;
            color: var(--spectrum-gray-700);
            word-break: break-all;
        }

        .cell-actions {
            text-align: right;
            white-space: nowrap;
        }

        sp-progress-circle {
            vertical-align: middle;
        }

        .trial-days {
            margin-left: 4px;
            font-size: 11px;
            font-weight: 600;
            color: var(--spectrum-gray-600);
        }

        .copied-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--spectrum-positive-visual-color, #12805c);
        }

        /* Legacy bordered-card layout (offer tab left column). */
        :host([card]) {
            display: block;
            margin-bottom: 8px;
        }

        :host([card]:hover) {
            background: transparent;
        }

        .offer-card {
            border: 1px solid var(--spectrum-gray-200);
            border-radius: var(--spectrum-corner-radius-100, 4px);
            background: var(--spectrum-gray-50);
            padding: 8px;
        }

        .offer-card:hover {
            background: var(--spectrum-gray-100);
        }

        :host([card][selected]) .offer-card {
            background: var(--spectrum-gray-200);
        }

        .offer-card-grid {
            display: grid;
            grid-template-columns: repeat(10, auto);
            align-items: center;
            gap: 4px 8px;
        }

        .offer-card-icon {
            width: 48px;
            height: 48px;
            grid-column: 1 / span 1;
            border-radius: var(--spectrum-corner-radius-100, 4px);
        }

        .offer-card-name {
            grid-column: 2 / span 9;
            font-size: 16px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .offer-card-divider {
            grid-column: 1 / span 10;
            border: none;
            border-top: 1px solid var(--spectrum-gray-200);
            margin: 6px 0;
            width: 100%;
        }

        .offer-card-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--spectrum-gray-700);
            margin: 0;
        }

        .label-2 {
            grid-column: span 2;
        }

        .label-4 {
            grid-column: span 4;
        }

        .value-2 {
            grid-column: span 2;
            font-size: 13px;
            color: var(--spectrum-gray-800);
        }

        .value-4 {
            grid-column: span 4;
            font-size: 13px;
            color: var(--spectrum-gray-800);
        }

        .value-8 {
            grid-column: span 8;
            font-size: 13px;
            color: var(--spectrum-gray-800);
            word-break: break-all;
        }

        .offer-card-price {
            font-weight: 700;
            color: var(--spectrum-gray-900);
        }
    `;

    constructor() {
        super();
        this.offer = undefined;
        this.selected = false;
        this.lastSelected = false;
        this.card = false;
        this.resolving = false;
        this.copied = false;
    }

    async copyOfferId(e, offerId) {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(offerId);
            this.copied = true;
            setTimeout(() => {
                this.copied = false;
            }, 1500);
        } catch (err) {
            /* clipboard not available */
        }
    }

    updated(changed) {
        // When a deep-linked offer auto-selects, the offer list may have
        // scrolled past it — bring the selected card into view so the user sees
        // which offer was pre-chosen. Runs on first render (selected from the
        // start) and whenever `selected` flips on.
        if (changed.has('selected') && this.selected) {
            this.scrollIntoView({ block: 'nearest' });
        }
    }

    async handleClick() {
        if (!this.offer || this.resolving) return;
        if (store.authoringFlow === 'consult') {
            // In consult (AI chat) the user selects an offer to inspect/submit,
            // not to configure a placeholder. Stash it on the store so the app
            // can switch to a focused detail view.
            store.selectedOffer = this.offer;
            store.notify();
            return;
        }
        this.resolving = true;
        try {
            const config = { accessToken: store.accessToken, apiKey: store.apiKey, baseUrl: store.baseUrl, env: store.env };
            const osi = await resolveOfferSelector(this.offer, config);
            store.addOffer(this.offer, osi);
        } catch (err) {
            /* resolution failed */
        }
        this.resolving = false;
    }

    renderCard() {
        const offer = this.offer;
        const price = formatPrice(offer);
        const period = formatPeriod(offer);
        const offerId = offer.offer_id || '';

        return html`
            <div class="offer-card" @click=${this.handleClick}>
                <div class="offer-card-grid">
                    ${offer.icon ? html`<img class="offer-card-icon" src="${offer.icon}" alt="" />` : html`<span></span>`}
                    <h4 class="offer-card-name">${offer.name}</h4>
                    <hr class="offer-card-divider" />

                    <span class="offer-card-label label-2">Offer ID</span>
                    <span class="value-8">${offerId}</span>

                    <span class="offer-card-label label-2">Price Point</span>
                    <span class="value-8">${offer.price_point || ''}</span>

                    <span class="offer-card-label label-2">Plan Type</span>
                    <span class="offer-card-label label-2">Offer type</span>
                    <span class="offer-card-label label-2">Language</span>
                    <span class="offer-card-label label-4">Price</span>

                    <span class="value-2">${offer.planType || ''}</span>
                    <span class="value-2">${offer.offer_type || ''}</span>
                    <span class="value-2">${offer.language || ''}</span>
                    <span class="value-4 offer-card-price">${price}${period}</span>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.offer) return html``;
        if (this.card) return this.renderCard();

        const offer = this.offer;
        const price = formatPrice(offer);
        const period = formatPeriod(offer);
        const planType = offer.planType;
        const badgeVariant = PLAN_TYPE_COLORS[planType] || 'neutral';
        const offerId = offer.offer_id || '';

        return html`
            <span class="cell cell-price" @click=${this.handleClick}> ${price}${period} </span>
            <span class="cell" @click=${this.handleClick}>
                ${planType ? html`<sp-badge size="s" variant="${badgeVariant}">${planType}</sp-badge>` : ''}
            </span>
            <span class="cell" @click=${this.handleClick}>
                ${offer.offer_type
                    ? html`<sp-badge size="s" variant="neutral">${offer.offer_type}</sp-badge>${getTrialDays(offer) !== null
                              ? html`<span class="trial-days">${getTrialDays(offer)}d</span>`
                              : ''}`
                    : ''}
                ${offer.landscapeSource
                    ? html`<sp-badge size="s" variant="${offer.landscapeSource === 'DRAFT' ? 'yellow' : 'informative'}"
                          >${offer.landscapeSource}</sp-badge
                      >`
                    : ''}
            </span>
            <span class="cell cell-id" @click=${this.handleClick}> ${offerId} </span>
            <span class="cell cell-actions">
                ${this.resolving
                    ? html`<sp-progress-circle indeterminate size="s" label="Resolving"></sp-progress-circle>`
                    : this.copied
                      ? html`<span class="copied-label">Copied</span>`
                      : html`<sp-action-button
                            quiet
                            size="xs"
                            label="Copy offer ID"
                            @click=${(e) => this.copyOfferId(e, offerId)}
                            ><sp-icon-copy slot="icon"></sp-icon-copy
                        ></sp-action-button>`}
            </span>
        `;
    }
}

customElements.define('ost-offer-card', OstOfferCard);
