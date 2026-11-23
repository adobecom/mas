import { LitElement, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { EVENT_OST_CLOSE, EVENT_OST_OFFER_SELECT } from '../../constants.js';
import { resolveBaselineOffer } from '../../baselines/baseline-model.js';
import '../../rte/osi-field.js';
import { offerFieldStyles } from './mas-offer-field.css.js';

/**
 * Offer picker for Studio forms: opens OST, shows the selected offer and resolves its details.
 * Only reacts to OST selections opened from its own button, so several fields can share a page.
 *
 * @fires change - `{ osi, offer }` when an offer is selected; `offer` is null while it resolves,
 *   then `{ productArrangementCode, marketSegment, productCode, commitment, term }`.
 * @fires cancel - the offer selector closed without a selection.
 */
export class MasOfferField extends LitElement {
    static styles = [offerFieldStyles];

    static properties = {
        label: { type: String },
        placeholder: { type: String },
        osi: { type: String },
        optional: { type: Boolean, reflect: true },
        error: { type: String },
        details: { state: true },
    };

    #selecting = false;
    #selectionId = 0;
    #resolvedOsi = '';

    constructor() {
        super();
        this.label = '';
        this.placeholder = 'Select offer…';
        this.osi = '';
        this.optional = false;
        this.error = '';
        this.details = {};
    }

    connectedCallback() {
        super.connectedCallback();
        // Capture phase: runs before the inner osi-field closes OST, which would otherwise look like a cancel.
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.#onOstSelect, { capture: true });
        document.addEventListener(EVENT_OST_CLOSE, this.#onOstClose);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.#onOstSelect, { capture: true });
        document.removeEventListener(EVENT_OST_CLOSE, this.#onOstClose);
    }

    willUpdate(changed) {
        if (changed.has('osi') && this.osi !== this.#resolvedOsi) this.#resolve(this.osi);
    }

    get osiField() {
        return this.shadowRoot.querySelector('osi-field');
    }

    openOfferSelector() {
        this.#selecting = true;
        this.osiField.handleOpenOfferSelector();
    }

    #onOstSelect = async ({ detail: { offerSelectorId, offer } }) => {
        if (!this.#selecting || !offer) return;
        this.#selecting = false;
        this.osi = offerSelectorId;
        const resolving = this.#resolve(offerSelectorId, offer);
        this.#emitChange(null);
        if (await resolving) this.#emitChange(this.details);
    };

    #onOstClose = () => {
        if (!this.#selecting) return;
        this.#selecting = false;
        this.dispatchEvent(new CustomEvent('cancel'));
    };

    async #resolve(osi, ostOffer = {}) {
        const selectionId = ++this.#selectionId;
        this.#resolvedOsi = osi;
        const marketSegment = ostOffer.market_segments?.[0];
        this.details = { marketSegment };
        if (!osi) return false;
        const resolved = await resolveBaselineOffer(osi, ostOffer);
        if (selectionId !== this.#selectionId || osi !== this.osi) return false;
        this.details = { ...resolved, marketSegment: resolved.marketSegment ?? marketSegment };
        return true;
    }

    #emitChange(offer) {
        this.dispatchEvent(new CustomEvent('change', { detail: { osi: this.osi, offer } }));
    }

    get detailsTemplate() {
        const { productArrangementCode, marketSegment, commitment, term } = this.details;
        return html`<sp-icon-shopping-cart></sp-icon-shopping-cart>
            <div class="offer-details">
                <p>OSI: <strong>${this.osi}</strong></p>
                <p>PA code: <strong>${productArrangementCode || (this.error ? '—' : '…')}</strong></p>
                ${marketSegment ? html`<p>Market segment: <strong>${marketSegment}</strong></p>` : nothing}
                ${commitment && term ? html`<p>Commitment · term: <strong>${commitment} · ${term}</strong></p>` : nothing}
            </div>`;
    }

    render() {
        const { osi, error } = this;
        return html`
            <sp-field-label id="label" ?required=${!this.optional}>${this.label}</sp-field-label>
            <osi-field hidden .value=${osi} @change=${(event) => event.stopPropagation()}></osi-field>
            <div role="group" aria-labelledby="label" class=${osi ? 'offer-card' : nothing}>
                ${osi ? this.detailsTemplate : nothing}
                <sp-action-button
                    class=${classMap({ 'full-width': !osi, invalid: !osi && Boolean(error) })}
                    ?quiet=${Boolean(osi)}
                    aria-invalid=${error ? 'true' : nothing}
                    aria-describedby=${error ? 'error' : nothing}
                    @click=${this.openOfferSelector}
                >
                    ${osi
                        ? html`<sp-icon-edit slot="icon"></sp-icon-edit>`
                        : html`<sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>`}
                    ${osi ? 'Change offer' : this.placeholder}
                </sp-action-button>
            </div>
            <div class="field-message" aria-live="polite">
                ${error ? html`<sp-help-text id="error" variant="negative">${error}</sp-help-text>` : nothing}
            </div>
        `;
    }
}

customElements.define('mas-offer-field', MasOfferField);
