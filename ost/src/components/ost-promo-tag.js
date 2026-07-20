import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';
import { computePromoStatus, PROMO_CONTEXT_CANCEL_VALUE } from '@dexter/tacocat-core/src/promotion.js';

export class OstPromoTag extends LitElement {
    static styles = css`
        :host {
            font-family: inherit;
            display: block;
            border-top: 1px solid var(--spectrum-gray-200);
            padding-top: 16px;
            margin-top: 8px;
        }

        .promo-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .promo-label {
            font-size: 13px;
            color: var(--spectrum-gray-800);
            white-space: nowrap;
        }

        .promo-row sp-textfield {
            flex: 1;
            min-width: 0;
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
        const hasContextualPromo = !!store.promotionCode;
        const isCancelled = store.storedPromoOverride === PROMO_CONTEXT_CANCEL_VALUE;
        return html`
            <div class="promo-row">
                <span class="promo-label">Promotion:</span>
                <sp-badge data-testid="ost-promo-label" variant=${status.variant}>${status.text}</sp-badge>
                ${hasContextualPromo
                    ? html`
                          <sp-action-button
                              data-testid="ost-promo-cancel-context"
                              quiet
                              size="s"
                              label=${isCancelled ? 'Restore context promo' : 'Cancel context promo'}
                              ?selected=${isCancelled}
                              @click=${() => store.setPromoCode(isCancelled ? undefined : PROMO_CONTEXT_CANCEL_VALUE)}
                          >
                              <sp-icon-cancel slot="icon"></sp-icon-cancel>
                          </sp-action-button>
                      `
                    : nothing}
                <sp-textfield
                    data-testid="ost-promo-override-input"
                    label="Override"
                    size="s"
                    value=${isCancelled ? '' : store.storedPromoOverride || ''}
                    @input=${(e) => store.setPromoCode(e.target.value)}
                ></sp-textfield>
                <sp-action-button
                    data-testid="ost-promo-clear"
                    quiet
                    size="s"
                    label="Clear"
                    @click=${() => store.setPromoCode(undefined)}
                >
                    <sp-icon-undo slot="icon"></sp-icon-undo>
                </sp-action-button>
            </div>
        `;
    }
}

customElements.define('ost-promo-tag', OstPromoTag);
