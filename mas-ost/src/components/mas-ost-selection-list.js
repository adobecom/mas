import { LitElement, html, css, nothing } from 'lit';
import '@spectrum-web-components/button/sp-button.js';
import { store } from '../store/ost-store.js';

function offerLabel(offer) {
    if (!offer) return '';
    return offer.offer_id || offer.product_arrangement_code || '';
}

export class MasOstSelectionList extends LitElement {
    static styles = css`
        :host {
            display: block;
            padding: 12px 24px 0;
            background: var(--spectrum-white, #fff);
            flex-shrink: 0;
            font-family: inherit;
        }

        .selection-slot {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 8px;
            background: var(--spectrum-gray-50);
            margin-bottom: 8px;
            transition:
                border-color 0.15s,
                background 0.15s,
                box-shadow 0.15s;
        }

        .selection-slot.active {
            border-color: var(--spectrum-blue-700, #1473e6);
            background: var(--spectrum-blue-100, #e0f2ff);
        }

        /* A slot that already holds an offer — give it a distinct, pronounced
         * look so users can see at a glance that the slot is locked in, even
         * when it isn't the currently-targeted slot. Positive (green) accent
         * mirrors Spectrum's "success" semantic.
         * Colors are pinned to explicit light-palette hex values so they stay
         * readable regardless of the ambient Spectrum theme (token resolution
         * inside a dark theme flips grays into mauve/beige shades that lose
         * contrast on a saturated green fill). */
        .selection-slot.filled {
            border-color: #12805c;
            border-width: 2px;
            padding: 11px 13px; /* keep internal dimensions stable despite thicker border */
            background: #eaf7ee;
            box-shadow: 0 1px 3px rgba(18, 128, 92, 0.12);
        }

        .selection-slot.filled .slot-label {
            color: #0d6245;
        }

        .selection-slot.filled .slot-value {
            font-weight: 600;
            color: #1d1d1d;
        }

        .selection-slot.filled.active {
            /* Slot is both targeted AND filled — layer both cues: blue ring
             * on the outside, green fill inside, via box-shadow. */
            border-color: #12805c;
            box-shadow: 0 0 0 2px #378ef0;
        }

        .slot-check {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            border-radius: 50%;
            background: var(--spectrum-positive-visual-color, #12805c);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
        }

        .selection-slot.clickable {
            cursor: pointer;
        }

        .selection-slot.clickable:hover {
            background: var(--spectrum-gray-100);
        }

        .selection-slot.active.clickable:hover {
            background: var(--spectrum-blue-100, #e0f2ff);
        }

        .selection-slot.filled.clickable:hover {
            background: #d5efdc;
        }

        .slot-content {
            flex: 1;
            min-width: 0;
        }

        .slot-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--spectrum-gray-600);
        }

        .slot-value {
            font-size: 13px;
            color: var(--spectrum-gray-900);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .slot-value.empty {
            color: var(--spectrum-gray-500);
            font-style: italic;
        }

        .slot-number {
            font-size: 12px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            min-width: 18px;
        }

        .slot-clear {
            background: transparent;
            border: none;
            color: var(--spectrum-gray-700);
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            padding: 4px;
            flex-shrink: 0;
        }

        .slot-clear:hover {
            color: var(--spectrum-gray-900);
        }

        .bundle-hint {
            font-size: 12px;
            color: var(--spectrum-gray-600);
            padding: 6px 14px;
            font-style: italic;
        }

        .confirm-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border: 1px solid var(--spectrum-yellow-400, #e6a300);
            border-radius: 8px;
            background: var(--spectrum-yellow-100, #fff3cd);
            margin-bottom: 8px;
            font-size: 13px;
            color: var(--spectrum-gray-900);
        }

        .confirm-bar .confirm-text {
            flex: 1;
        }

        .confirm-bar sp-button {
            flex-shrink: 0;
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

    renderConfirmBar() {
        if (!store.pendingFlowSwitch) return nothing;
        const offerNames =
            store.selectedOffers.length > 0
                ? store.selectedOffers
                      .map((o) => offerLabel(o.offer))
                      .filter(Boolean)
                      .join(', ')
                : offerLabel(store.selectedOffer);
        return html`
            <div class="confirm-bar">
                <span class="confirm-text">Keep "${offerNames}" in your new selection?</span>
                <sp-button size="s" variant="primary" @click=${() => store.confirmFlowSwitch(true)}>Keep</sp-button>
                <sp-button size="s" variant="secondary" @click=${() => store.confirmFlowSwitch(false)}>Discard</sp-button>
            </div>
        `;
    }

    renderTryBuy() {
        const baseOffer = store.selectedBaseOffer;
        const trialOffer = store.selectedTrialOffer;
        const currentSlot = store.currentSlot;

        return html`
            ${this.renderConfirmBar()}
            <div
                class="selection-slot clickable ${currentSlot === 'trial' ? 'active' : ''} ${trialOffer ? 'filled' : ''}"
                @click=${() => store.setCurrentSlot('trial')}
            >
                ${trialOffer ? html`<span class="slot-check" aria-hidden="true">✓</span>` : nothing}
                <div class="slot-content">
                    <div class="slot-label">Trial offer (Free trial CTA, optional)</div>
                    <div class="slot-value ${trialOffer ? '' : 'empty'}">
                        ${trialOffer ? offerLabel(trialOffer) : 'Click to target, then pick an offer below'}
                    </div>
                </div>
                ${trialOffer
                    ? html`<button
                          class="slot-clear"
                          title="Clear trial offer"
                          @click=${(e) => {
                              e.stopPropagation();
                              store.removeOfferByRole('trial');
                          }}
                      >
                          &times;
                      </button>`
                    : nothing}
            </div>
            <div
                class="selection-slot clickable ${currentSlot === 'base' ? 'active' : ''} ${baseOffer ? 'filled' : ''}"
                @click=${() => store.setCurrentSlot('base')}
            >
                ${baseOffer ? html`<span class="slot-check" aria-hidden="true">✓</span>` : nothing}
                <div class="slot-content">
                    <div class="slot-label">Base offer (Buy CTA)</div>
                    <div class="slot-value ${baseOffer ? '' : 'empty'}">
                        ${baseOffer ? offerLabel(baseOffer) : 'Click to target, then pick an offer below'}
                    </div>
                </div>
                ${baseOffer
                    ? html`<button
                          class="slot-clear"
                          title="Clear base offer"
                          @click=${(e) => {
                              e.stopPropagation();
                              store.removeOfferByRole('base');
                          }}
                      >
                          &times;
                      </button>`
                    : nothing}
            </div>
        `;
    }

    renderBundle() {
        const offers = store.selectedOffers;
        return html`
            ${this.renderConfirmBar()}
            ${offers.map(
                (entry, index) => html`
                    <div class="selection-slot filled">
                        <span class="slot-check" aria-hidden="true">✓</span>
                        <span class="slot-number">${index + 1}.</span>
                        <div class="slot-content">
                            <div class="slot-value">${offerLabel(entry.offer)}</div>
                        </div>
                        <button class="slot-clear" title="Remove offer" @click=${() => store.removeOffer(index)}>
                            &times;
                        </button>
                    </div>
                `,
            )}
            <div class="bundle-hint">Click offers below to add to bundle</div>
        `;
    }

    render() {
        if (store.authoringFlow === 'tryBuy') return this.renderTryBuy();
        if (store.authoringFlow === 'bundle') return this.renderBundle();
        return nothing;
    }
}

customElements.define('mas-ost-selection-list', MasOstSelectionList);
