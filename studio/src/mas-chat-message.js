import { LitElement, html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './mas-card-selection-dialog.js';
import './mas-collection-preview.js';
import './mas-prompt-suggestions.js';
import './mas-operation-result.js';
import './mas-bulk-preview.js';
import './mas-chat-button-group.js';
import './mas-chat-product-cards.js';
import './mas-chat-confirmation-summary.js';
import { parseMarkdown } from './utils/markdown-parser.js';
import { buildStudioFragmentHref, showToast } from './utils.js';
import Store from './store.js';

/**
 * Chat Message Component
 * Displays individual messages from user or assistant
 */
export class MasChatMessage extends LitElement {
    static properties = {
        message: { type: Object },
        showSuggestions: { type: Boolean },
        sourcesExpanded: { type: Boolean },
    };

    constructor() {
        super();
        this.sourcesExpanded = false;
    }

    createRenderRoot() {
        return this;
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

    async copyFragmentLink() {
        const { fragmentId } = this.message;
        if (!fragmentId) return;
        const url = buildStudioFragmentHref({
            webComponentName: 'merch-card',
            fragmentId,
            page: 'content',
        });
        try {
            await navigator.clipboard.writeText(url);
            showToast('Fragment link copied', 'positive');
        } catch {
            showToast('Failed to copy link', 'negative');
        }
    }

    handleFeedback(rating) {
        if (!this.message) return;
        if (this.message.feedback === rating) return;
        this.message.feedback = rating;
        this.requestUpdate();
        this.dispatchEvent(
            new CustomEvent('chat-feedback', {
                detail: {
                    rating,
                    messageId: this.message.id || null,
                    content: this.message.content || '',
                    timestamp: this.message.timestamp || Date.now(),
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderFeedbackFooter() {
        if (!this.message || this.message.role !== 'assistant') return nothing;
        if (this.message.isLoading) return nothing;
        if (!this.message.content || !String(this.message.content).trim()) return nothing;

        const rating = this.message.feedback || null;
        return html`
            <div class="message-feedback">
                <sp-action-button
                    quiet
                    size="s"
                    title="Helpful"
                    ?selected=${rating === 'up'}
                    @click=${() => this.handleFeedback('up')}
                >
                    <sp-icon-thumb-up slot="icon"></sp-icon-thumb-up>
                </sp-action-button>
                <sp-action-button
                    quiet
                    size="s"
                    title="Not helpful"
                    ?selected=${rating === 'down'}
                    @click=${() => this.handleFeedback('down')}
                >
                    <sp-icon-thumb-down slot="icon"></sp-icon-thumb-down>
                </sp-action-button>
            </div>
        `;
    }

    renderCardPreview() {
        const { fragmentId, fragmentPath, fragmentStatus, validation, isCreatingDraft, isDocumentation } = this.message;

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

        if (isDocumentation) {
            return html`
                <div class="message-card-preview message-card-preview--example">
                    <div class="card-info">
                        <sp-badge size="s" variant="informative">Example</sp-badge>
                    </div>
                    <div class="card-visual-preview">
                        <merch-card>
                            <aem-fragment fragment="${fragmentId}" author ims></aem-fragment>
                        </merch-card>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="message-card-preview">
                <div class="card-info">
                    <sp-badge size="s" variant="notice">${fragmentStatus || 'DRAFT'}</sp-badge>
                    ${validation?.warnings?.length > 0
                        ? html` <sp-badge size="s" variant="yellow">${validation.warnings.length} warnings</sp-badge> `
                        : nothing}
                    ${validation?.errors?.length > 0
                        ? html` <sp-badge size="s" variant="negative">${validation.errors.length} errors</sp-badge> `
                        : nothing}
                </div>

                ${validation?.warnings?.length > 0
                    ? html`
                          <div class="card-warnings">
                              ${validation.warnings.map((warning) => html` <div class="warning-item">⚠️ ${warning}</div> `)}
                          </div>
                      `
                    : nothing}
                ${validation?.errors?.length > 0
                    ? html`
                          <div class="card-errors">
                              ${validation.errors.map((error) => html` <div class="error-item">❌ ${error}</div> `)}
                          </div>
                      `
                    : nothing}

                <div class="card-visual-preview">
                    <merch-card>
                        <aem-fragment fragment="${fragmentId}" author ims></aem-fragment>
                    </merch-card>
                </div>

                <div class="card-path-info">
                    <sp-icon-folder size="s"></sp-icon-folder>
                    <span>${fragmentPath}</span>
                </div>

                <div class="card-actions card-actions-primary">
                    <sp-button size="s" variant="accent" @click=${() => this.copyFragmentLink()}>
                        <sp-icon-link slot="icon"></sp-icon-link>
                        Copy Fragment Link
                    </sp-button>
                    <sp-button size="s" variant="primary" @click=${() => this.handleCardAction('edit')}>
                        <sp-icon-edit slot="icon"></sp-icon-edit>
                        Edit in Fragment Editor
                    </sp-button>
                </div>
                <div class="card-actions card-actions-secondary">
                    <sp-button size="s" variant="secondary" @click=${() => this.handleCardAction('publish')}>
                        Publish
                    </sp-button>
                    <sp-button size="s" variant="secondary" @click=${() => this.handleCardAction('regenerate')}>
                        Regenerate
                    </sp-button>
                    <sp-button size="s" variant="negative" @click=${() => this.handleCardAction('delete')}> Delete </sp-button>
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
                        : nothing}
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

    renderOperationProgress() {
        const { progress } = this.message;

        if (!progress) {
            return html`
                <div class="operation-loading">
                    <sp-progress-circle indeterminate size="s"></sp-progress-circle>
                    <span>Processing...</span>
                </div>
            `;
        }

        const { current = 0, total = 0, percentage = 0, successful = 0, failed = 0, skipped = 0, items = [] } = progress;

        const recentItems = items.slice(-5).reverse();

        return html`
            <div class="operation-progress">
                <div class="progress-header">
                    <span class="progress-text">Processing ${current}/${total} cards...</span>
                    <span class="progress-percentage">${percentage}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                </div>

                ${recentItems.length > 0
                    ? html`
                          <div class="progress-activity">
                              <div class="activity-header">Recent Activity:</div>
                              ${recentItems.map(
                                  (item) => html`
                                      <div class="activity-item activity-item-${item.status}">
                                          ${item.status === 'completed'
                                              ? html`<sp-icon-checkmark-circle size="s"></sp-icon-checkmark-circle>`
                                              : item.status === 'failed'
                                                ? html`<sp-icon-alert size="s"></sp-icon-alert>`
                                                : html`<sp-icon-skip size="s"></sp-icon-skip>`}
                                          <div class="activity-item-details">
                                              <strong>${item.fragmentName}</strong>
                                              ${item.changes && item.changes.length > 0
                                                  ? item.changes.map(
                                                        (change) => html`<div class="activity-change">• ${change}</div>`,
                                                    )
                                                  : nothing}
                                              ${item.error
                                                  ? html`<div class="activity-error">Error: ${item.error}</div>`
                                                  : nothing}
                                          </div>
                                      </div>
                                  `,
                              )}
                          </div>
                      `
                    : nothing}

                <div class="progress-stats">
                    ${successful > 0 ? html`<span class="success-stat">✓ ${successful} completed</span>` : nothing}
                    ${failed > 0 ? html`<span class="failure-stat">✗ ${failed} failed</span>` : nothing}
                    ${skipped > 0 ? html`<span class="skipped-stat">⊘ ${skipped} skipped</span>` : nothing}
                    ${current < total ? html`<span class="remaining-stat">⋯ ${total - current} remaining</span>` : nothing}
                </div>
            </div>
        `;
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
                    <sp-icon-select-multi slot="icon"></sp-icon-select-multi>
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
        const { confirmationRequired } = this.message;

        if (confirmationRequired) {
            return html`
                <div class="operation-actions">
                    <sp-button size="s" variant="secondary" @click=${() => this.handleOperationAction('cancel')}>
                        Cancel
                    </sp-button>
                    <sp-button size="s" variant="accent" @click=${() => this.handleOperationAction('execute')}>
                        Confirm & Execute
                    </sp-button>
                </div>
            `;
        }

        return html`
            <div class="operation-actions">
                <sp-button size="s" variant="primary" @click=${() => this.handleOperationAction('execute')}>
                    Execute Operation
                </sp-button>
            </div>
        `;
    }

    renderSources() {
        const { sources } = this.message;

        if (!sources || sources.length === 0) {
            return nothing;
        }

        return html`
            <div class="message-sources">
                <sp-action-button
                    quiet
                    size="s"
                    class="sources-toggle ${this.sourcesExpanded ? 'expanded' : ''}"
                    @click=${() => {
                        this.sourcesExpanded = !this.sourcesExpanded;
                    }}
                >
                    <sp-icon-info slot="icon"></sp-icon-info>
                    Sources (${sources.length})
                    <sp-icon-chevron-down size="s"></sp-icon-chevron-down>
                </sp-action-button>
                ${this.sourcesExpanded
                    ? html`
                          <div class="sources-list">
                              ${sources.map(
                                  (source) => html`
                                      <div class="source-item">
                                          ${source.url
                                              ? html`<a href="${source.url}" target="_blank" class="source-link">
                                                    ${source.url}
                                                    <sp-icon-link-out size="xs"></sp-icon-link-out>
                                                </a>`
                                              : html`<span class="source-section">${source.section}</span>`}
                                          ${source.score
                                              ? html`<span class="source-score">${Math.round(source.score * 100)}%</span>`
                                              : nothing}
                                      </div>
                                  `,
                              )}
                          </div>
                      `
                    : nothing}
            </div>
        `;
    }

    render() {
        if (!this.message) return nothing;

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

        const hasDisplayableContent =
            content ||
            isLoading ||
            osi ||
            (cards && cards.length > 0) ||
            cardConfig ||
            fragmentId ||
            collectionConfig ||
            operation ||
            operationResult ||
            operationLoading ||
            this.message.productCards ||
            this.message.buttonGroup ||
            this.message.openOst ||
            this.message.confirmationSummary ||
            this.message.previewData ||
            this.message.mcpOperation ||
            this.showSuggestions;

        if (!hasDisplayableContent && !isUser) return nothing;

        if (type === 'collection-selection') {
            return html`
                <div class=${messageClass}>
                    <div class="message-card">${this.renderCollectionSelection()}</div>
                </div>
            `;
        }

        if (type === 'collection-preview') {
            return html`
                <div class=${messageClass}>
                    <div class="message-card">${this.renderCollectionPreviewView()}</div>
                </div>
            `;
        }

        return html`
            <div class=${messageClass}>
                <div class="message-card">
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
                        : nothing}
                    ${cards && cards.length > 0
                        ? html`
                              <div class="message-cards-context">
                                  <div class="message-cards-header">
                                      <sp-icon-select-multi size="s"></sp-icon-select-multi>
                                      <span>Selected ${cards.length} card${cards.length !== 1 ? 's' : ''} for context</span>
                                  </div>
                                  <div class="message-cards-list">
                                      ${cards.map((card) => {
                                          const cardId = typeof card === 'string' ? card : card.id;
                                          return html` <sp-tag size="s"> ${cardId.split('/').pop()} </sp-tag> `;
                                      })}
                                  </div>
                              </div>
                          `
                        : nothing}
                    ${isLoading
                        ? html`<div class="message-content">
                              <div class="message-loading">
                                  <sp-progress-circle indeterminate size="s"></sp-progress-circle>
                                  <span>Thinking...</span>
                              </div>
                          </div>`
                        : operationResult && content === operationResult.message
                          ? nothing
                          : content || this.showSuggestions
                            ? html`<div class="message-content">
                                  <div class="message-text">
                                      ${role === 'error'
                                          ? html`<sp-icon-alert size="s" class="error-icon"></sp-icon-alert> `
                                          : nothing}${isUser ? content : unsafeHTML(parseMarkdown(content))}
                                  </div>
                                  ${this.showSuggestions ? html`<mas-prompt-suggestions></mas-prompt-suggestions>` : nothing}
                              </div>`
                            : nothing}
                    ${this.message.productCards
                        ? html`<mas-chat-product-cards
                              .products=${this.message.productCards}
                              .selectedValue=${this.message.buttonGroup?.selectedValue}
                          ></mas-chat-product-cards>`
                        : this.message.buttonGroup
                          ? html`<mas-chat-button-group
                                .buttons=${this.message.buttonGroup.options}
                                .selectedValue=${this.message.buttonGroup.selectedValue}
                                .inputHint=${this.message.buttonGroup.inputHint}
                            ></mas-chat-button-group>`
                          : nothing}
                    ${this.message.openOst
                        ? html`<sp-button
                              variant="accent"
                              ?disabled=${this.message.ostConfirmed}
                              @click=${() =>
                                  this.dispatchEvent(
                                      new CustomEvent('open-ost-from-response', {
                                          detail: { searchParams: this.message.ostSearchParams },
                                          bubbles: true,
                                          composed: true,
                                      }),
                                  )}
                          >
                              <sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>
                              Select Offer
                          </sp-button>`
                        : nothing}
                    ${this.message.confirmationSummary
                        ? html`<mas-chat-confirmation-summary
                              .summary=${this.message.confirmationSummary}
                              ?confirmed=${this.message.confirmed}
                              surface=${Store.search?.value?.path || ''}
                          ></mas-chat-confirmation-summary>`
                        : nothing}
                    ${cardConfig || fragmentId ? this.renderCardPreview() : nothing}
                    ${collectionConfig ? this.renderCollectionPreview() : nothing}
                    ${operation || (this.message.mcpOperation && this.message.confirmationRequired)
                        ? this.renderOperationRequest()
                        : nothing}
                    ${this.message.previewData
                        ? html`<mas-bulk-preview
                              .previewData=${this.message.previewData}
                              .operation=${this.message.previewOperation}
                          ></mas-bulk-preview>`
                        : nothing}
                    ${operationLoading ? this.renderOperationProgress() : nothing}
                    ${operationResult
                        ? html`<mas-operation-result
                              .result=${operationResult}
                              .operationType=${operationType}
                          ></mas-operation-result>`
                        : nothing}
                    ${this.renderFeedbackFooter()}
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-message', MasChatMessage);
