import { LitElement, html } from 'lit';
import { openOfferSelectorTool, closeOfferSelectorTool } from './rte/ost.js';
import { EVENT_OST_OFFER_SELECT, EVENT_OST_SELECT } from './constants.js';
import './rte/rte-field.js';
import './mas-card-selection-dialog.js';

/**
 * Chat Input Component
 * RTE field with send button and offer selector
 */
export class MasChatInput extends LitElement {
    static properties = {
        disabled: { type: Boolean },
        selectedOsi: { type: String },
        selectedOffer: { type: Object },
        message: { type: String },
        selectedCards: { type: Array },
    };

    constructor() {
        super();
        this.disabled = false;
        this.selectedOsi = null;
        this.selectedOffer = null;
        this.message = '';
        this.selectedCards = [];
        this.boundHandleOstSelect = this.handleOstSelect.bind(this);
        this.boundHandleOfferSelect = this.handleOfferSelect.bind(this);
        this.boundHandleEscKey = this.handleEscKey.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_OST_SELECT, this.boundHandleOstSelect);
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.boundHandleOfferSelect);
        document.addEventListener('keydown', this.boundHandleEscKey, { capture: true });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_OST_SELECT, this.boundHandleOstSelect);
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.boundHandleOfferSelect);
        document.removeEventListener('keydown', this.boundHandleEscKey, { capture: true });
    }

    handleOstSelect(event) {
        const attributes = event.detail;
        const offerSelectorId = attributes['data-wcs-osi'];
        const offer = attributes.offer || null;

        if (offerSelectorId) {
            this.selectedOsi = offerSelectorId;
            this.selectedOffer = offer;
            closeOfferSelectorTool();
            this.requestUpdate();
        }
    }

    handleOfferSelect(event) {
        const { offerSelectorId, offer } = event.detail;
        this.selectedOsi = offerSelectorId || '';
        this.selectedOffer = offer || null;
        closeOfferSelectorTool();
        this.requestUpdate();
    }

    handleEscKey(event) {
        if (event.key === 'Escape') {
            closeOfferSelectorTool();
        }
    }

    handleRteChange(event) {
        const rteField = event.target;
        this.message = rteField.value || '';
    }

    handleRteKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSend();
        }
    }

    handleSend() {
        const rteField = this.querySelector('rte-field');
        const message = this.message.trim();

        if (!message) return;

        const context = {};
        if (this.selectedOsi) {
            context.osi = this.selectedOsi;
        }
        if (this.selectedOffer) {
            context.offer = this.selectedOffer;
        }
        if (this.selectedCards.length > 0) {
            context.cards = this.selectedCards;
        }

        this.dispatchEvent(
            new CustomEvent('send-message', {
                detail: { message, context },
                bubbles: true,
                composed: true,
            }),
        );

        this.message = '';
        this.selectedOsi = null;
        this.selectedOffer = null;
        this.selectedCards = [];

        rteField.editorView.dispatch(rteField.editorView.state.tr.delete(0, rteField.editorView.state.doc.content.size));
    }

    handleOsiSelect() {
        openOfferSelectorTool(this, null);
    }

    handleRemoveOffer() {
        this.selectedOsi = null;
        this.selectedOffer = null;
        this.requestUpdate();
    }

    async handleSelectCards() {
        const dialog = document.createElement('mas-card-selection-dialog');
        document.body.appendChild(dialog);

        const selectedCardIds = await dialog.open();

        if (selectedCardIds?.length > 0) {
            this.selectedCards = selectedCardIds;
            this.requestUpdate();
        }
    }

    handleRemoveCard(cardId) {
        this.selectedCards = this.selectedCards.filter((id) => id !== cardId);
        this.requestUpdate();
    }

    render() {
        return html`
            <div class="input-container">
                <div class="rte-wrapper">
                    ${this.selectedOsi
                        ? html`
                              <div class="selected-offer-badge">
                                  Selected offer: ${this.selectedOsi}
                                  <sp-action-button quiet size="xs" @click=${this.handleRemoveOffer} title="Remove offer">
                                      <sp-icon-close slot="icon"></sp-icon-close>
                                  </sp-action-button>
                              </div>
                          `
                        : ''}
                    ${this.selectedCards.length > 0
                        ? html`
                              <div class="selected-cards-badges">
                                  ${this.selectedCards.map(
                                      (cardId) => html`
                                          <sp-tag size="m" deletable @delete=${() => this.handleRemoveCard(cardId)}>
                                              ${cardId.split('/').pop()}
                                          </sp-tag>
                                      `,
                                  )}
                              </div>
                          `
                        : ''}

                    <rte-field
                        inline="true"
                        hideOfferSelector="true"
                        hideCounter="true"
                        maxLength="500"
                        placeholder="Type your message... (e.g., 'Create a fries card for Photoshop')"
                        @change=${this.handleRteChange}
                        @keydown=${this.handleRteKeyDown}
                        ?disabled=${this.disabled}
                    >
                    </rte-field>
                </div>

                <div class="input-actions">
                    <sp-button size="m" variant="secondary" @click=${this.handleSelectCards} ?disabled=${this.disabled}>
                        <sp-icon-selection-checked slot="icon"></sp-icon-selection-checked>
                        Select Cards
                    </sp-button>

                    ${!this.selectedOsi
                        ? html`
                              <sp-button size="m" variant="secondary" @click=${this.handleOsiSelect} ?disabled=${this.disabled}>
                                  <sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>
                                  Attach Offer
                              </sp-button>
                          `
                        : ''}

                    <sp-button size="m" variant="accent" @click=${this.handleSend} ?disabled=${this.disabled || !this.message}>
                        <sp-icon-send slot="icon"></sp-icon-send>
                        Send
                    </sp-button>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-input', MasChatInput);
