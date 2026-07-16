import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';
import { applyPlanType } from '@dexter/tacocat-core/src/wcsUtils.js';
import './ost-offer-card.js';
import './ost-placeholder-panel.js';
import './ost-promo-tag.js';
import './ost-selection-list.js';
import './ost-offer-detail-focused.js';

export class OstOfferTab extends LitElement {
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

        .result-text {
            font-size: 13px;
            color: var(--spectrum-gray-700);
        }

        .result-text strong {
            color: var(--spectrum-gray-900);
        }

        .panels {
            display: grid;
            grid-template-columns: 2fr 3fr;
            gap: 16px;
            min-height: 0;
        }

        .panels.single-col {
            grid-template-columns: 1fr;
        }

        .offer-list {
            padding: 8px;
            background: var(--spectrum-gray-50);
            border: 1px solid var(--spectrum-gray-200);
            border-radius: var(--spectrum-corner-radius-100, 4px);
            overflow-y: auto;
            overscroll-behavior: contain;
            min-height: 0;
        }

        .config-panel {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 12px;
            background: var(--spectrum-gray-50);
            border: 1px solid var(--spectrum-gray-200);
            border-radius: var(--spectrum-corner-radius-100, 4px);
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            min-height: 0;
            min-width: 0;
        }

        .empty-state {
            color: var(--spectrum-gray-600);
            font-size: 13px;
            padding: 16px;
            text-align: center;
        }

        .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-end {
            display: flex;
            gap: 8px;
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

    get resultText() {
        const product = store.selectedProduct;
        if (!product) return '';
        const { commitment, term, customerSegment, offerType, marketSegment } = store.aosParams;
        const { planType } = applyPlanType({ commitment, term });
        return [product.name, planType, customerSegment, offerType, marketSegment].filter(Boolean).join(', ');
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('ost-tab-cancel', { bubbles: true, composed: true }));
    }

    requestUse() {
        this.dispatchEvent(new CustomEvent('ost-tab-use', { bubbles: true, composed: true }));
    }

    requestBack() {
        this.dispatchEvent(new CustomEvent('ost-tab-back', { bubbles: true, composed: true }));
    }

    get offerList() {
        const offers = store.offers;
        if (offers.length === 0) {
            return html`<div class="empty-state">No offers found. Adjust your filters on the previous step.</div>`;
        }
        return offers.map(
            (offer) => html`
                <ost-offer-card
                    card
                    .offer=${offer}
                    ?selected=${store.isOfferSelected(offer)}
                    ?last-selected=${!store.selectedOffer && store.lastSelectedOfferId === offer.offer_id}
                ></ost-offer-card>
            `,
        );
    }

    get configPanel() {
        const flow = store.authoringFlow;
        if (flow === 'tryBuy' || flow === 'bundle') {
            return html`
                <ost-selection-list></ost-selection-list>
                ${store.panelGroups.length > 0
                    ? html`
                          <ost-placeholder-panel></ost-placeholder-panel>
                          <ost-promo-tag></ost-promo-tag>
                      `
                    : nothing}
            `;
        }
        if (flow === 'consult') {
            return store.selectedOffer
                ? html`<ost-offer-detail-focused></ost-offer-detail-focused>`
                : html`<div class="empty-state">Select an offer to view its details.</div>`;
        }
        if (!store.selectedOffer) {
            return html`<div class="empty-state">Select an offer to configure your placeholder.</div>`;
        }
        return html`
            <ost-placeholder-panel></ost-placeholder-panel>
            <ost-promo-tag></ost-promo-tag>
        `;
    }

    get footer() {
        const flow = store.authoringFlow;
        const isFocused = flow === 'consult' && store.selectedOffer;

        let useLabel = 'Use';
        let useDisabled = !store.canConfirm;
        let useVariant = 'accent';

        if (flow === 'consult') {
            useLabel = isFocused ? 'Use' : 'Close';
            useVariant = isFocused ? 'accent' : 'secondary';
            useDisabled = false;
        }

        return html`
            <div class="footer">
                <sp-button data-testid="ost-back-button" variant="secondary" size="m" @click=${() => this.requestBack()}
                    >Back</sp-button
                >
                <div class="footer-end">
                    <sp-button data-testid="ost-cancel-button" variant="secondary" size="m" @click=${() => this.cancel()}
                        >Cancel</sp-button
                    >
                    <sp-button
                        data-testid="ost-footer-use-button"
                        variant=${useVariant}
                        size="m"
                        ?disabled=${useDisabled}
                        @click=${() => this.requestUse()}
                        >${useLabel}</sp-button
                    >
                </div>
            </div>
        `;
    }

    render() {
        const isFocused = store.authoringFlow === 'consult' && store.selectedOffer;
        return html`
            <div class="result-text">Offers for <strong>${this.resultText}</strong></div>
            <div class="panels ${isFocused ? 'single-col' : ''}">
                ${isFocused ? '' : html`<div class="offer-list">${this.offerList}</div>`}
                <div class="config-panel">${this.configPanel}</div>
            </div>
            ${this.footer}
        `;
    }
}

customElements.define('ost-offer-tab', OstOfferTab);
