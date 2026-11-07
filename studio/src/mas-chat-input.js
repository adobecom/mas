import { LitElement, html, nothing } from 'lit';
import { openOfferSelectorTool, closeOfferSelectorTool } from './rte/ost.js';
import { EVENT_OST_OFFER_SELECT, EVENT_OST_MULTI_OFFER_SELECT, EVENT_OST_SELECT } from './constants.js';
import './rte/rte-field.js';
import { pasteTextFromClipboardHtml } from './utils/chat-paste.js';
import { MAX_IMAGES } from './mas-chat/investigation-session.js';

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
        inputLocked: { type: Boolean, attribute: 'input-locked' },
        autoSendOnSelect: { type: Boolean },
        imagesEnabled: { type: Boolean },
        images: { type: Array },
    };

    constructor() {
        super();
        this.disabled = false;
        this.selectedOsi = null;
        this.selectedOffer = null;
        this.message = '';
        this.inputLocked = false;
        this.autoSendOnSelect = false;
        this.imagesEnabled = false;
        this.images = [];
        this.boundHandleOstSelect = this.handleOstSelect.bind(this);
        this.boundHandleOfferSelect = this.handleOfferSelect.bind(this);
        this.boundHandleMultiOfferSelect = this.handleMultiOfferSelect.bind(this);
        this.boundHandleEscKey = this.handleEscKey.bind(this);
        this.boundHandleRteChange = this.handleRteChange.bind(this);
        this.boundHandlePaste = this.handlePaste.bind(this);
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
        this.addEventListener('paste', this.boundHandlePaste, { capture: true });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_OST_SELECT, this.boundHandleOstSelect);
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.boundHandleOfferSelect);
        document.removeEventListener(EVENT_OST_MULTI_OFFER_SELECT, this.boundHandleMultiOfferSelect);
        document.removeEventListener('keydown', this.boundHandleEscKey, { capture: true });
        this.removeEventListener('change', this.boundHandleRteChange);
        this.removeEventListener('keyup', this.boundHandleRteChange);
        this.removeEventListener('paste', this.boundHandlePaste, { capture: true });
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
        const context = {
            osi: this.selectedOsi,
            trialOsi: this.selectedTrialOsi || null,
            trialOffer: this.selectedTrialOffer || null,
        };
        if (this.selectedOffer) context.offer = this.selectedOffer;
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
        // Prefer the raw offer_id over the OSI when we have it — the chat's
        // Rule 1 (get_offer_by_id) lookup against AOS is deterministic
        // regardless of landscape/country, whereas OSI resolution via
        // /offer_selectors/{id} is brittle for DRAFT-only or historic OSIs.
        const offerId = this.selectedOffer?.offer_id || this.selectedOffer?.id || null;
        const context = { osi: this.selectedOsi, trialOsi: null, trialOffer: null };
        if (this.selectedOffer) context.offer = this.selectedOffer;
        if (offerId) context.offerId = offerId;
        // Disambiguate the identifier type for the AI. When we have an
        // offer_id (from an OST offer payload), label it explicitly so the
        // AI routes to Rule 1 (get_offer_by_id). Otherwise label as OSI so
        // it routes to Rule 2 (resolve_offer_selector).
        const message = offerId ? `Offer ID: ${offerId}` : `OSI: ${this.selectedOsi}`;
        this.dispatchEvent(
            new CustomEvent('send-message', {
                detail: { message, context },
                bubbles: true,
                composed: true,
            }),
        );
        this.selectedOsi = null;
        this.selectedOffer = null;
    }

    /** Image files on the clipboard, e.g. a screenshot; empty for text. */
    clipboardImages(event) {
        return [...(event.clipboardData?.items ?? [])]
            .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
            .map((item) => item.getAsFile())
            .filter(Boolean);
    }

    /** Spreadsheet cells, documents and "copy image" carry text beside an image; the text wins. */
    clipboardHasText(event) {
        return ['text/plain', 'text/html'].some((type) => event.clipboardData?.getData(type));
    }

    handlePaste(event) {
        const files = this.imagesEnabled && !this.clipboardHasText(event) ? this.clipboardImages(event) : [];
        if (files.length) {
            event.preventDefault();
            event.stopPropagation();
            this.dispatchAttachImages(files);
            return;
        }
        // Rich clipboard content from Studio "copy link" carries the URL only
        // in the HTML flavor; the plain flavor is the human label. Substitute
        // anchors with their hrefs so the link survives the paste.
        const html = event.clipboardData?.getData('text/html');
        const replacement = pasteTextFromClipboardHtml(html);
        if (!replacement) return;
        const view = this.querySelector('rte-field')?.editorView;
        if (!view) return;
        event.preventDefault();
        event.stopPropagation();
        view.dispatch(view.state.tr.insertText(replacement));
        view.focus();
    }

    handleEscKey(event) {
        if (event.key === 'Escape') {
            closeOfferSelectorTool();
        }
    }

    /**
     * The typed message as plain text. The field's value is serialized HTML,
     * which would send "&" as "&amp;"; offers travel in context, not in the text.
     */
    get plainText() {
        const doc = this.querySelector('rte-field')?.editorView?.state.doc;
        if (!doc) return '';
        return doc.textBetween(0, doc.content.size, '\n', (leaf) => (leaf.type.name === 'hard_break' ? '\n' : ''));
    }

    handleRteChange() {
        this.message = this.plainText;
    }

    handleRteKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSend();
        }
    }

    handleSend() {
        const rteField = this.querySelector('rte-field');
        if (!rteField || this.uploading) return;
        const message = this.plainText.trim();

        if (!message && !this.selectedOsi) return;

        const offerId = this.selectedOffer?.offer_id || this.selectedOffer?.id || null;
        const osiLooksLikeOfferId = this.selectedOsi && /^[a-fA-F0-9]{32}$/.test(this.selectedOsi);
        const resolvedOfferId = offerId || (osiLooksLikeOfferId ? this.selectedOsi : null);
        let attachmentLabel = `Selected offer: ${this.selectedOsi}`;
        if (resolvedOfferId) attachmentLabel = `Offer ID: ${resolvedOfferId}`;
        else if (this.selectedOsi) attachmentLabel = `OSI: ${this.selectedOsi}`;
        const effectiveMessage = message || attachmentLabel;
        const context = {};
        if (this.selectedOsi) {
            context.osi = this.selectedOsi;
            context.trialOsi = null;
            context.trialOffer = null;
        }
        if (this.selectedOffer) {
            context.offer = this.selectedOffer;
        }
        if (resolvedOfferId) {
            context.offerId = resolvedOfferId;
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

        rteField.editorView.dispatch(rteField.editorView.state.tr.delete(0, rteField.editorView.state.doc.content.size));
    }

    handleChooseImages(event) {
        const files = [...event.target.files];
        event.target.value = '';
        if (!files.length) return;
        this.dispatchAttachImages(files);
    }

    dispatchAttachImages(files) {
        this.dispatchEvent(new CustomEvent('attach-images', { detail: { files }, bubbles: true, composed: true }));
    }

    get uploading() {
        return this.images.some((image) => image.status === 'uploading');
    }

    handleRemoveImage(id) {
        this.dispatchEvent(new CustomEvent('remove-image', { detail: { id }, bubbles: true, composed: true }));
    }

    handleOsiSelect() {
        openOfferSelectorTool(this, null);
    }

    handleRemoveOffer() {
        this.selectedOsi = null;
        this.selectedOffer = null;
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
                ${this.images.length
                    ? html`
                          <div class="image-previews">
                              ${this.images.map(
                                  (image) => html`
                                      <figure class="image-preview">
                                          ${image.status === 'uploading'
                                              ? html`<sp-progress-circle
                                                    indeterminate
                                                    size="s"
                                                    label="Uploading ${image.name}"
                                                ></sp-progress-circle>`
                                              : nothing}
                                          ${image.preview ? html`<img src=${image.preview} alt=${image.name} />` : nothing}
                                          <figcaption>${image.name}</figcaption>
                                          ${image.status === 'uploading'
                                              ? nothing
                                              : html`<sp-action-button
                                                    quiet
                                                    size="xs"
                                                    ?disabled=${this.disabled}
                                                    @click=${() => this.handleRemoveImage(image.id)}
                                                    title="Remove image"
                                                >
                                                    <sp-icon-close slot="icon"></sp-icon-close>
                                                </sp-action-button>`}
                                      </figure>
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
                        ${this.imagesEnabled
                            ? html`
                                  <input
                                      class="file-input"
                                      type="file"
                                      aria-label="Attach image"
                                      multiple
                                      accept="image/png,image/jpeg,image/gif,image/webp"
                                      hidden
                                      ?disabled=${this.disabled || this.uploading || this.images.length >= MAX_IMAGES}
                                      @change=${this.handleChooseImages}
                                  />
                                  <sp-action-button
                                      quiet
                                      size="s"
                                      @click=${() => this.querySelector('.file-input').click()}
                                      ?disabled=${this.disabled || this.uploading || this.images.length >= MAX_IMAGES}
                                      title="Attach image"
                                  >
                                      <sp-icon-attach slot="icon"></sp-icon-attach>
                                  </sp-action-button>
                              `
                            : nothing}
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
                            ?disabled=${this.disabled || this.inputLocked || this.uploading}
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
