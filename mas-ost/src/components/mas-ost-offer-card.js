import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/badge/sp-badge.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-copy.js';
import { store } from '../store/ost-store.js';
import { resolveOfferSelector } from '../utils/aos-client.js';

const PLAN_TYPE_COLORS = {
    ABM: 'positive',
    PUF: 'informative',
    M2M: 'yellow',
    PERPETUAL: 'seafoam',
    P3Y: 'fuchsia',
};

function getTrialDays(offer) {
    if (offer.offer_type !== 'TRIAL') return null;
    const match = (offer.price_point || '').match(/(\d+)_DAY/i);
    return match ? parseInt(match[1], 10) : null;
}

function formatPeriod(offer) {
    const term = offer.term;
    const commitment = offer.commitment;
    if (commitment === 'YEAR' || term === 'ANNUAL') return '/yr';
    if (commitment === 'MONTH' || term === 'MONTHLY') return '/mo';
    return '';
}

function formatPrice(offer) {
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

export class MasOstOfferCard extends LitElement {
    static properties = {
        offer: { type: Object },
        selected: { type: Boolean, reflect: true },
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

        .cell {
            display: table-cell;
            padding: 10px 12px;
            vertical-align: middle;
            border-bottom: 1px solid var(--spectrum-gray-200);
            font-size: 13px;
            color: var(--spectrum-gray-800);
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
    `;

    constructor() {
        super();
        this.offer = undefined;
        this.selected = false;
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

    async handleClick() {
        if (!this.offer || this.resolving) return;
        if (store.authoringFlow === 'consult') return;
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

    render() {
        if (!this.offer) return html``;

        const offer = this.offer;
        const price = formatPrice(offer);
        const period = formatPeriod(offer);
        const planType = offer.planType;
        const badgeVariant = PLAN_TYPE_COLORS[planType] || 'neutral';
        const offerId = offer.offer_id || '';

        return html`
            <span class="cell cell-price" @click=${this.handleClick}>
                ${price}${period}
            </span>
            <span class="cell" @click=${this.handleClick}>
                ${planType
                    ? html`<sp-badge size="s" variant="${badgeVariant}">${planType}</sp-badge>`
                    : ''}
            </span>
            <span class="cell" @click=${this.handleClick}>
                ${offer.offer_type
                    ? html`<sp-badge size="s" variant="neutral">${offer.offer_type}</sp-badge>${getTrialDays(offer) !== null ? html`<span class="trial-days">${getTrialDays(offer)}d</span>` : ''}`
                    : ''}
            </span>
            <span class="cell cell-id" @click=${this.handleClick}>
                ${offerId}
            </span>
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
                          ><sp-icon-copy slot="icon"></sp-icon-copy></sp-action-button>`}
            </span>
        `;
    }
}

customElements.define('mas-ost-offer-card', MasOstOfferCard);
