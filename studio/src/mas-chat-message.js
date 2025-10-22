import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './mas-card-selection-dialog.js';
import './mas-collection-preview.js';
import './mas-prompt-suggestions.js';
import './mas-operation-result.js';
import { parseMarkdown } from './utils/markdown-parser.js';

/**
 * Chat Message Component
 * Displays individual messages from user or assistant
 */
export class MasChatMessage extends LitElement {
    static properties = {
        message: { type: Object },
        showSuggestions: { type: Boolean },
    };

    createRenderRoot() {
        return this;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    handleCardAction(action) {
        this.dispatchEvent(
            new CustomEvent('card-action', {
                detail: {
                    action,
                    config: this.message.cardConfig,
                    fragmentId: this.message.fragmentId,
                    fragmentTitle: this.message.fragmentTitle,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderCardPreview() {
        const { fragmentId, fragmentPath, fragmentTitle, fragmentStatus, validation, isCreatingDraft } = this.message;

        if (isCreatingDraft) {
            return html`
                <div class="message-card-preview">
                    <div class="draft-creating">
                        <sp-progress-circle indeterminate size="m"></sp-progress-circle>
                        <span>Creating draft card...</span>
                    </div>
                </div>
            `;
        }

        if (!fragmentId) {
            return html`<div class="message-card-preview">
                <p>Card preview unavailable</p>
            </div>`;
        }

        return html`
            <div class="message-card-preview">
                <div class="card-info">
                    <sp-badge size="s" variant="notice">${fragmentStatus || 'DRAFT'}</sp-badge>
                    ${validation?.warnings?.length > 0
                        ? html` <sp-badge size="s" variant="yellow">${validation.warnings.length} warnings</sp-badge> `
                        : ''}
                    ${validation?.errors?.length > 0
                        ? html` <sp-badge size="s" variant="negative">${validation.errors.length} errors</sp-badge> `
                        : ''}
                </div>

                ${validation?.warnings?.length > 0
                    ? html`
                          <div class="card-warnings">
                              ${validation.warnings.map((warning) => html` <div class="warning-item">⚠️ ${warning}</div> `)}
                          </div>
                      `
                    : ''}
                ${validation?.errors?.length > 0
                    ? html`
                          <div class="card-errors">
                              ${validation.errors.map((error) => html` <div class="error-item">❌ ${error}</div> `)}
                          </div>
                      `
                    : ''}

                <div class="card-visual-preview">
                    <merch-card>
                        <aem-fragment fragment="${fragmentId}" author ims></aem-fragment>
                    </merch-card>
                </div>

                <div class="card-path-info">
                    <sp-icon-folder size="s"></sp-icon-folder>
                    <span>${fragmentPath}</span>
                </div>

                <div class="card-actions">
                    <sp-button size="s" variant="accent" @click=${() => this.handleCardAction('edit')}>
                        <sp-icon-edit slot="icon"></sp-icon-edit>
                        Open in Editor
                    </sp-button>
                    <sp-button size="s" variant="primary" @click=${() => this.handleCardAction('publish')}>
                        Publish to Production
                    </sp-button>
                    <sp-button size="s" variant="secondary" @click=${() => this.handleCardAction('regenerate')}>
                        Regenerate
                    </sp-button>
                    <sp-button size="s" variant="negative" @click=${() => this.handleCardAction('delete')}>
                        Delete Draft
                    </sp-button>
                </div>
            </div>
        `;
    }

    renderCollectionPreview() {
        const { collectionConfig, validation } = this.message;

        return html`
            <div class="message-collection-preview">
                <div class="collection-info">
                    <sp-badge size="s">Collection</sp-badge>
                    <span>${collectionConfig.cards.length} cards</span>
                    ${validation?.cardValidations?.some((v) => v.warnings?.length > 0)
                        ? html` <sp-badge size="s" variant="yellow">Warnings</sp-badge> `
                        : ''}
                </div>

                <div class="collection-cards">
                    ${collectionConfig.cards.map(
                        (card, index) => html`
                            <div class="collection-card-item">
                                <sp-badge size="s">${card.variant}</sp-badge>
                                <span>${this.extractTitle(card)}</span>
                            </div>
                        `,
                    )}
                </div>

                <div class="card-actions">
                    <sp-button
                        size="s"
                        variant="primary"
                        @click=${() => this.handleCollectionAction('save')}
                        ?disabled=${!validation?.valid}
                    >
                        Save Collection
                    </sp-button>
                </div>
            </div>
        `;
    }

    handleCollectionAction(action) {
        this.dispatchEvent(
            new CustomEvent('collection-action', {
                detail: {
                    action,
                    config: this.message.collectionConfig,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    extractTitle(cardConfig) {
        if (!cardConfig.title) return 'Untitled';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardConfig.title;
        return tempDiv.textContent || 'Untitled';
    }

    renderCollectionSelection() {
        return html`
            <div class="message-content">
                <p>${this.message.content}</p>
                <sp-button size="m" variant="accent" @click=${this.handleOpenSelector}>
                    <sp-icon-selection-checked slot="icon"></sp-icon-selection-checked>
                    Select Cards
                </sp-button>
            </div>
        `;
    }

    async handleOpenSelector() {
        const dialog = document.createElement('mas-card-selection-dialog');
        document.body.appendChild(dialog);

        const selectedCardIds = await dialog.open();

        if (selectedCardIds?.length > 0) {
            this.dispatchEvent(
                new CustomEvent('cards-selected', {
                    detail: { cardIds: selectedCardIds },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    renderCollectionPreviewView() {
        return html`
            <div class="message-content">
                <p>${this.message.content}</p>
                <mas-collection-preview
                    .fragmentIds=${this.message.fragmentIds}
                    .suggestedTitle=${this.message.suggestedTitle}
                    @create-collection=${this.handleCreateFromPreview}
                ></mas-collection-preview>
            </div>
        `;
    }

    handleCreateFromPreview(event) {
        this.dispatchEvent(
            new CustomEvent('create-collection-from-preview', {
                detail: event.detail,
                bubbles: true,
                composed: true,
            }),
        );
    }

    async handleViewAllCards(event) {
        const { results } = event.detail;

        const dialog = document.createElement('mas-card-selection-dialog');
        document.body.appendChild(dialog);

        await dialog.open({
            mode: 'view-only',
            fragments: results,
        });

        dialog.remove();
    }

    getOfferProductName(offer) {
        if (!offer) return '';
        return offer.productName || offer.name || 'Unknown Product';
    }

    getOfferIcon(offer) {
        if (!offer) return '';
        return offer.icon || offer.iconUrl || '';
    }

    handleOperationAction(action) {
        const operationData = this.message.mcpOperation
            ? {
                  type: 'mcp_operation',
                  mcpTool: this.message.mcpOperation.mcpTool,
                  mcpParams: this.message.mcpOperation.mcpParams,
              }
            : this.message.operation;

        this.dispatchEvent(
            new CustomEvent('operation-action', {
                detail: {
                    action,
                    operation: operationData,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderOperationRequest() {
        const { operation, operationType, confirmationRequired } = this.message;

        return html`
            <div class="message-operation-request">
                <div class="operation-info">
                    <sp-icon-workflow size="s"></sp-icon-workflow>
                    <span>Operation: <strong>${operationType}</strong></span>
                </div>
                ${confirmationRequired
                    ? html`
                          <div class="operation-confirmation">
                              <p>⚠️ This operation requires confirmation. Are you sure you want to proceed?</p>
                              <div class="operation-actions">
                                  <sp-button size="s" variant="secondary" @click=${() => this.handleOperationAction('cancel')}>
                                      Cancel
                                  </sp-button>
                                  <sp-button size="s" variant="accent" @click=${() => this.handleOperationAction('execute')}>
                                      Confirm & Execute
                                  </sp-button>
                              </div>
                          </div>
                      `
                    : html`
                          <div class="operation-actions">
                              <sp-button size="s" variant="primary" @click=${() => this.handleOperationAction('execute')}>
                                  Execute Operation
                              </sp-button>
                          </div>
                      `}
            </div>
        `;
    }

    render() {
        if (!this.message) return html``;

        const {
            role,
            content,
            type,
            cardConfig,
            collectionConfig,
            isLoading,
            osi,
            offer,
            cards,
            operation,
            operationResult,
            operationType,
            operationLoading,
            fragmentId,
        } = this.message;

        const messageClass = `chat-message chat-message-${role}`;
        const isUser = role === 'user';

        if (type === 'collection-selection') {
            return html`
                <div class=${messageClass}>
                    <div class="message-avatar message-avatar-${role}">
                        <sp-icon-magic-wand></sp-icon-magic-wand>
                    </div>
                    <div class="message-card">${this.renderCollectionSelection()}</div>
                </div>
            `;
        }

        if (type === 'collection-preview') {
            return html`
                <div class=${messageClass}>
                    <div class="message-avatar message-avatar-${role}">
                        <sp-icon-magic-wand></sp-icon-magic-wand>
                    </div>
                    <div class="message-card">${this.renderCollectionPreviewView()}</div>
                </div>
            `;
        }

        return html`
            <div class=${messageClass}>
                <div class="message-avatar message-avatar-${role}">
                    ${isUser ? html`<sp-icon-user></sp-icon-user>` : html`<sp-icon-magic-wand></sp-icon-magic-wand>`}
                </div>

                <div class="message-card">
                    <div class="message-header">
                        <span class="message-role">${isUser ? 'You' : 'AI Assistant'}</span>
                        <span class="message-timestamp">${this.formatTimestamp(this.message.timestamp)}</span>
                    </div>

                    ${osi
                        ? html`
                              <div class="message-offer-context">
                                  <div class="message-offer-card">
                                      ${this.getOfferIcon(offer)
                                          ? html`
                                                <div class="message-offer-icon">
                                                    <img
                                                        src="${this.getOfferIcon(offer)}"
                                                        alt="${this.getOfferProductName(offer)}"
                                                    />
                                                </div>
                                            `
                                          : html`
                                                <div class="message-offer-icon">
                                                    <sp-icon-shopping-cart></sp-icon-shopping-cart>
                                                </div>
                                            `}
                                      <div class="message-offer-details">
                                          <span class="message-offer-product">${this.getOfferProductName(offer)}</span>
                                          <span class="message-offer-osi">${osi}</span>
                                      </div>
                                  </div>
                              </div>
                          `
                        : ''}
                    ${cards && cards.length > 0
                        ? html`
                              <div class="message-cards-context">
                                  <div class="message-cards-header">
                                      <sp-icon-selection-checked size="s"></sp-icon-selection-checked>
                                      <span>Selected ${cards.length} card${cards.length !== 1 ? 's' : ''} for context</span>
                                  </div>
                                  <div class="message-cards-list">
                                      ${cards.map((cardId) => html` <sp-tag size="s"> ${cardId.split('/').pop()} </sp-tag> `)}
                                  </div>
                              </div>
                          `
                        : ''}

                    <div class="message-content">
                        ${isLoading
                            ? html`
                                  <div class="message-loading">
                                      <sp-progress-circle indeterminate size="s"></sp-progress-circle>
                                      <span>Thinking...</span>
                                  </div>
                              `
                            : html` <div class="message-text">${unsafeHTML(isUser ? content : parseMarkdown(content))}</div> `}
                        ${this.showSuggestions ? html`<mas-prompt-suggestions></mas-prompt-suggestions>` : ''}
                    </div>

                    ${cardConfig || fragmentId ? this.renderCardPreview() : ''}
                    ${collectionConfig ? this.renderCollectionPreview() : ''}
                    ${operation || (this.message.mcpOperation && this.message.confirmationRequired)
                        ? this.renderOperationRequest()
                        : ''}
                    ${operationLoading
                        ? html`
                              <div class="operation-loading">
                                  <sp-progress-circle indeterminate size="s"></sp-progress-circle>
                                  <span>Processing...</span>
                              </div>
                          `
                        : ''}
                    ${operationResult
                        ? html`<mas-operation-result
                              .result=${operationResult}
                              .operationType=${operationType}
                              @view-all-cards=${this.handleViewAllCards}
                          ></mas-operation-result>`
                        : ''}
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-message', MasChatMessage);
