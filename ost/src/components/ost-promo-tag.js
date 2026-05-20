import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/badge/sp-badge.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/textfield/sp-textfield.js';
import { store } from '../store/ost-store.js';
import { computePromoStatus, PROMO_CONTEXT_CANCEL_VALUE } from '../utils/promo-status.js';

export class OstPromoTag extends LitElement {
    static styles = css`
        :host {
            font-family: inherit;
            display: block;
            border-top: 1px solid var(--spectrum-gray-200);
            padding-top: 16px;
            margin-top: 8px;
        }

        .section-label {
            font-size: 11px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }

        .promo-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
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

    get status() {
        return computePromoStatus(store.storedPromoOverride, store.promotionCode);
    }

    render() {
        const status = this.status;
        return html`
            <div class="section-label">Promotion</div>
            <div class="promo-row">
                <sp-badge data-testid="ost-promo-label" variant=${status.variant}>${status.text}</sp-badge>
                <sp-textfield
                    data-testid="ost-promo-override-input"
                    label="Override"
                    size="s"
                    value=${store.storedPromoOverride === PROMO_CONTEXT_CANCEL_VALUE ? '' : store.storedPromoOverride || ''}
                    @input=${(e) => store.setPromoCode(e.target.value)}
                ></sp-textfield>
                <sp-action-button data-testid="ost-promo-clear" quiet size="s" @click=${() => store.setPromoCode(undefined)}>
                    Clear
                </sp-action-button>
            </div>
        `;
    }
}

customElements.define('ost-promo-tag', OstPromoTag);
