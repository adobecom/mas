import { LitElement, html, nothing } from 'lit';
import { openOfferSelectorTool, closeOfferSelectorTool } from './rte/ost.js';
import { EVENT_OST_OFFER_SELECT, EVENT_OST_MULTI_OFFER_SELECT, EVENT_OST_SELECT } from './constants.js';
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
        inputLocked: { type: Boolean, attribute: 'input-locked' },
        autoSendOnSelect: { type: Boolean },
    };

    constructor() {
        super();
        this.disabled = false;
        this.selectedOsi = null;
        this.selectedOffer = null;
        this.message = '';
        this.selectedCards = [];
        this.inputLocked = false;
        this.autoSendOnSelect = false;
        this.boundHandleOstSelect = this.handleOstSelect.bind(this);
        this.boundHandleOfferSelect = this.handleOfferSelect.bind(this);
        this.boundHandleMultiOfferSelect = this.handleMultiOfferSelect.bind(this);
        this.boundHandleEscKey = this.handleEscKey.bind(this);
        this.boundHandleRteChange = this.handleRteChange.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_OST_SELECT, this.boundHandleOstSelect);
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.boundHandleOfferSelect);
        document.addEventListener(EVENT_OST_MULTI_OFFER_SELECT, this.boundHandleMultiOfferSelect);
        document.addEventListener('keydown', this.boundHandleEscKey, { capture: true });
        this.addEventListener('change', this.boundHandleRteChange);
        this.addEventListener('keyup', this.boundHandleRteChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_OST_SELECT, this.boundHandleOstSelect);
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.boundHandleOfferSelect);
        document.removeEventListener(EVENT_OST_MULTI_OFFER_SELECT, this.boundHandleMultiOfferSelect);
        document.removeEventListener('keydown', this.boundHandleEscKey, { capture: true });
        this.removeEventListener('change', this.boundHandleRteChange);
        this.removeEventListener('keyup', this.boundHandleRteChange);
    }

    handleOstSelect(event) {
        const attributes = event.detail;
        const offerSelectorId = attributes['data-wcs-osi'];
        const offer = attributes.offer || null;

        if (offerSelectorId) {
            this.selectedOsi = offerSelectorId;
            this.selectedOffer = offer;
            closeOfferSelectorTool();
            if (this.autoSendOnSelect) {
                this.autoSendOnSelect = false;
                this.sendOffer();
            }
        }
    }

    handleOfferSelect(event) {
        const { offerSelectorId, offer } = event.detail;
        this.selectedOsi = offerSelectorId || '';
        this.selectedOffer = offer || null;
        closeOfferSelectorTool();
        if (this.autoSendOnSelect) {
            this.autoSendOnSelect = false;
            this.sendOffer();
        }
    }

    handleMultiOfferSelect(event) {
        const { base, trial } = event.detail || {};
        if (!base?.osi) return;
        // Stash both onto the input so sendMultiOffer can read them. The
        // single-OSI fields stay populated for back-compat with sendOffer().
        this.selectedOsi = base.osi;
        this.selectedOffer = base.offer || null;
        this.selectedTrialOsi = trial?.osi || null;
        this.selectedTrialOffer = trial?.offer || null;
        closeOfferSelectorTool();
        if (this.autoSendOnSelect) {
            this.autoSendOnSelect = false;
            this.sendMultiOffer();
        }
    }

    sendMultiOffer() {
        if (!this.selectedOsi) return;
        const context = { osi: this.selectedOsi };
        if (this.selectedOffer) context.offer = this.selectedOffer;
        if (this.selectedTrialOsi) context.trialOsi = this.selectedTrialOsi;
        if (this.selectedTrialOffer) context.trialOffer = this.selectedTrialOffer;
        const trialNote = this.selectedTrialOsi ? ` and trial offer: ${this.selectedTrialOsi}` : ' (no trial offer selected)';
        this.dispatchEvent(
            new CustomEvent('send-message', {
                detail: {
                    message: `Selected base offer: ${this.selectedOsi}${trialNote}`,
                    context,
                },
                bubbles: true,
                composed: true,
            }),
        );
        this.selectedOsi = null;
        this.selectedOffer = null;
        this.selectedTrialOsi = null;
        this.selectedTrialOffer = null;
    }

    sendOffer() {
        if (!this.selectedOsi) return;
        const context = { osi: this.selectedOsi };
        if (this.selectedOffer) context.offer = this.selectedOffer;
        this.dispatchEvent(
            new CustomEvent('send-message', {
                detail: { message: `Selected offer: ${this.selectedOsi}`, context },
                bubbles: true,
                composed: true,
            }),
        );
        this.selectedOsi = null;
        this.selectedOffer = null;
    }

    handleEscKey(event) {
        if (event.key === 'Escape') {
            closeOfferSelectorTool();
        }
    }

    handleRteChange() {
        const rteField = this.querySelector('rte-field');
        if (rteField) {
            this.message = rteField.value || '';
        }
    }

    handleRteKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSend();
        }
    }

    handleSend() {
        const rteField = this.querySelector('rte-field');
        if (!rteField) return;
        const message = (rteField.value || '').trim();

        if (!message && !this.selectedOsi) return;

        const effectiveMessage = message || `Selected offer: ${this.selectedOsi}`;
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
                detail: { message: effectiveMessage, context },
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
                    : nothing}
                ${this.selectedCards.length > 0
                    ? html`
                          <div class="selected-cards-badges">
                              ${this.selectedCards.map(
                                  (card) => html`
                                      <sp-tag size="s" deletable @delete=${() => this.handleRemoveCard(card.id)}>
                                          ${card.id.split('/').pop()}${card.osi ? ` (${card.osi})` : ''}
                                      </sp-tag>
                                  `,
                              )}
                          </div>
                      `
                    : nothing}
                <div class="input-row">
                    <div class="rte-wrapper">
                        <rte-field
                            inline="true"
                            hide-offer-selector="true"
                            hide-toolbar="true"
                            hide-counter="true"
                            no-border="true"
                            maxLength="500"
                            @keydown=${this.handleRteKeyDown}
                            ?disabled=${this.disabled || this.inputLocked}
                        >
                        </rte-field>
                    </div>
                    <div class="input-actions">
                        <sp-action-button
                            quiet
                            size="s"
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
                                      size="s"
                                      @click=${this.handleOsiSelect}
                                      ?disabled=${this.disabled}
                                      title="Attach offer"
                                  >
                                      <sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>
                                  </sp-action-button>
                              `
                            : nothing}
                        <sp-button
                            variant="accent"
                            size="s"
                            @click=${this.handleSend}
                            ?disabled=${this.disabled || this.inputLocked}
                            title="Send message"
                        >
                            <sp-icon-send slot="icon"></sp-icon-send>
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-input', MasChatInput);
