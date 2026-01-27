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
        placeholder: { type: String },
    };

    constructor() {
        super();
        this.disabled = false;
        this.selectedOsi = null;
        this.selectedOffer = null;
        this.message = '';
        this.selectedCards = [];
        this.placeholder = "Type your message... (e.g., 'Create a fries card for Photoshop')";
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
        this.selectedCards = this.selectedCards.filter((card) => card.id !== cardId);
        this.requestUpdate();
    }

    render() {
        return html`
            <div class="input-container">
                ${this.selectedOsi
                    ? html`
                          <div class="selected-offer-badge">
                              <sp-icon-shopping-cart></sp-icon-shopping-cart>
                              <span class="offer-id">${this.selectedOsi}</span>
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
                                  (card) => html`
                                      <sp-tag size="m" deletable @delete=${() => this.handleRemoveCard(card.id)}>
                                          ${card.id.split('/').pop()}${card.osi ? ` (${card.osi})` : ''}
                                      </sp-tag>
                                  `,
                              )}
                          </div>
                      `
                    : ''}
                <div class="rte-wrapper">
                    <rte-field
                        inline="true"
                        hide-offer-selector="true"
                        hide-toolbar="true"
                        hide-counter="true"
                        no-border="true"
                        maxLength="500"
                        placeholder="${this.placeholder}"
                        @change=${this.handleRteChange}
                        @keydown=${this.handleRteKeyDown}
                        ?disabled=${this.disabled}
                    >
                    </rte-field>
                </div>

                <div class="input-actions">
                    <sp-action-button
                        quiet
                        @click=${this.handleSelectCards}
                        ?disabled=${this.disabled}
                        title="Select cards for context"
                    >
                        <sp-icon-select-multi slot="icon"></sp-icon-select-multi>
                    </sp-action-button>

                    ${!this.selectedOsi
                        ? html`
                              <sp-action-button
                                  quiet
                                  @click=${this.handleOsiSelect}
                                  ?disabled=${this.disabled}
                                  title="Attach offer"
                              >
                                  <sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>
                              </sp-action-button>
                          `
                        : ''}

                    <sp-action-button
                        variant="accent"
                        @click=${this.handleSend}
                        ?disabled=${this.disabled || !this.message}
                        title="Send message"
                    >
                        <sp-icon-send slot="icon"></sp-icon-send>
                    </sp-action-button>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-input', MasChatInput);
