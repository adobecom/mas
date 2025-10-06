import { LitElement, html, css } from 'lit';
import StoreController from './reactivity/store-controller.js';
import './mas-chat-message.js';
import './mas-chat-input.js';
import './mas-chat-preview.js';
import './mas-prompt-suggestions.js';
import './mas-card-selection-dialog.js';
import './mas-operation-result.js';
import Store, { editFragment } from './store.js';
import { createFragmentFromAIConfig, createFragmentDataForAEM } from './utils/ai-card-mapper.js';
import { executeOperationWithFeedback } from './utils/ai-operations-executor.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { showToast } from './utils.js';
import { AI_CHAT_BASE_URL, TAG_MODEL_ID_MAPPING } from './constants.js';

/**
 * Main AI Chat Component
 * Provides conversational interface for creating merch cards
 */
export class MasChat extends LitElement {
    static properties = {
        messages: { type: Array },
        isLoading: { type: Boolean },
        currentCardConfig: { type: Object },
        error: { type: String },
        showPromptSuggestions: { type: Boolean },
    };

    constructor() {
        super();
        this.messages = [];
        this.isLoading = false;
        this.currentCardConfig = null;
        this.error = null;
        this.conversationHistory = [];
        this.showPromptSuggestions = true;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addWelcomeMessage();
        this.addEventListener('cards-selected', this.handleCardsSelected);
        this.addEventListener('create-collection-from-preview', this.handleCreateCollectionFromPreview);
        this.addEventListener('prompt-selected', this.handlePromptSelected);
        this.addEventListener('direct-action', this.handleDirectAction);
        this.addEventListener('operation-action', this.handleOperationAction);
        this.addEventListener('open-card', this.handleOpenCardFromOperation);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('cards-selected', this.handleCardsSelected);
        this.removeEventListener('create-collection-from-preview', this.handleCreateCollectionFromPreview);
        this.removeEventListener('prompt-selected', this.handlePromptSelected);
        this.removeEventListener('direct-action', this.handleDirectAction);
        this.removeEventListener('operation-action', this.handleOperationAction);
        this.removeEventListener('open-card', this.handleOpenCardFromOperation);
    }

    addWelcomeMessage() {
        this.messages = [
            {
                role: 'assistant',
                content:
                    'Hi! I can help you create merch cards using natural language. Pick a suggestion below or type your own request.',
                timestamp: Date.now(),
                showSuggestions: true,
            },
        ];
    }

    handlePromptSelected(event) {
        const { prompt } = event.detail;
        this.showPromptSuggestions = false;
        this.handleSendMessage({ detail: { message: prompt, context: {} } });
    }

    handleDirectAction(event) {
        const { action, prompt } = event.detail;
        this.showPromptSuggestions = false;

        if (action === 'open-collection-selector') {
            this.messages = [
                ...this.messages,
                {
                    role: 'user',
                    content: prompt,
                    timestamp: Date.now(),
                },
            ];

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content:
                        "I'll help you create a collection. Click the button below to select cards from your existing cards.",
                    type: 'collection-selection',
                    timestamp: Date.now(),
                },
            ];
        }
    }

    async handleSendMessage(event) {
        const { message, context } = event.detail;

        if (!message.trim()) return;

        this.showPromptSuggestions = false;

        const userMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now(),
        };

        if (context?.osi) {
            userMessage.osi = context.osi;
        }
        if (context?.offer) {
            userMessage.offer = context.offer;
        }
        if (context?.cards && context.cards.length > 0) {
            userMessage.cards = context.cards;
        }

        this.messages = [...this.messages, userMessage];

        this.isLoading = true;
        this.error = null;

        try {
            const enrichedContext = {
                ...context,
                currentCardId: this.currentCardConfig?.id,
                currentPath: Store.search.value.path,
            };

            const response = await this.callAIChatAction({
                message,
                conversationHistory: this.conversationHistory,
                context: enrichedContext,
            });

            if (response.type === 'operation') {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        operation: response.data,
                        operationType: response.operation,
                        confirmationRequired: response.confirmationRequired,
                        timestamp: Date.now(),
                    },
                ];
            } else if (response.type === 'card') {
                this.currentCardConfig = response.cardConfig;

                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        cardConfig: response.cardConfig,
                        validation: response.validation,
                        timestamp: Date.now(),
                    },
                ];
            } else if (response.type === 'collection') {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        collectionConfig: response.collectionConfig,
                        validation: response.validation,
                        timestamp: Date.now(),
                    },
                ];
            } else {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        type: response.type,
                        fragmentIds: response.fragmentIds,
                        timestamp: Date.now(),
                    },
                ];
            }

            this.conversationHistory = response.conversationHistory || [];
        } catch (error) {
            console.error('Chat error:', error);
            this.error = error.message;
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Sorry, I encountered an error: ${error.message}`,
                    timestamp: Date.now(),
                },
            ];
        } finally {
            this.isLoading = false;
        }
    }

    async callAIChatAction(params) {
        if (!window.adobeIMS) {
            throw new Error('Adobe IMS not loaded');
        }

        const accessTokenObj = window.adobeIMS.getAccessToken();
        if (!accessTokenObj || !accessTokenObj.token) {
            throw new Error('Not authenticated. Please log in first.');
        }

        const aioBaseURL = AI_CHAT_BASE_URL;
        const actionUrl = `${aioBaseURL}/ai-chat`;

        const response = await fetch(actionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessTokenObj.token}`,
                'x-api-key': window.adobeIMS?.adobeIdData?.client_id || '',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to communicate with AI service');
        }

        return response.json();
    }

    async handleCardAction(event) {
        const { action, config } = event.detail;

        if (action === 'edit') {
            this.openInEditor(config);
        } else if (action === 'save') {
            await this.saveToAEM(config);
        } else if (action === 'regenerate') {
            const regenerateMessage = 'Can you regenerate that card?';
            this.handleSendMessage({
                detail: {
                    message: regenerateMessage,
                    context: { previousCard: config },
                },
            });
        }
    }

    openInEditor(cardConfig) {
        try {
            const fragment = createFragmentFromAIConfig(cardConfig, cardConfig.variant, {
                title: this.extractTitle(cardConfig),
            });

            const fragmentStore = new FragmentStore(fragment);

            editFragment(fragmentStore);

            showToast('Card opened in editor');
        } catch (error) {
            console.error('Failed to open in editor:', error);
            showToast(`Failed to open card: ${error.message}`, 'negative');
        }
    }

    async saveToAEM(cardConfig) {
        try {
            this.isLoading = true;

            const repository = document.querySelector('mas-repository');
            if (!repository) {
                throw new Error('Repository not found');
            }

            const title = this.extractTitle(cardConfig);
            const fragmentData = createFragmentDataForAEM(cardConfig, cardConfig.variant, {
                title,
                parentPath: Store.search.value.path || '/content/dam/mas',
            });

            const newFragment = await repository.aem.sites.cf.fragments.create(fragmentData);

            showToast(`Card "${title}" saved successfully!`, 'positive');

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `✓ Card saved to AEM at: ${newFragment.path}`,
                    timestamp: Date.now(),
                },
            ];
        } catch (error) {
            console.error('Failed to save to AEM:', error);
            showToast(`Failed to save card: ${error.message}`, 'negative');
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to save: ${error.message}`,
                    timestamp: Date.now(),
                },
            ];
        } finally {
            this.isLoading = false;
        }
    }

    async handleCollectionAction(event) {
        const { action, config } = event.detail;

        if (action === 'save') {
            await this.saveCollectionToAEM(config);
        }
    }

    async saveCollectionToAEM(collectionConfig) {
        try {
            this.isLoading = true;

            const repository = document.querySelector('mas-repository');
            if (!repository) {
                throw new Error('Repository not found');
            }

            const parentPath = Store.search.value.path || '/content/dam/mas';
            const collectionTitle = collectionConfig.title || 'AI Generated Collection';

            showToast(`Saving ${collectionConfig.cards.length} cards...`, 'info');

            const savedCards = [];
            for (const [index, cardConfig] of collectionConfig.cards.entries()) {
                const cardTitle = `${collectionTitle} - Card ${index + 1}`;
                const fragmentData = createFragmentDataForAEM(cardConfig, cardConfig.variant, {
                    title: cardTitle,
                    parentPath,
                });

                const newFragment = await repository.aem.sites.cf.fragments.create(fragmentData);
                savedCards.push(newFragment);
            }

            showToast(`Collection saved successfully! ${savedCards.length} cards created.`, 'positive');

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `✓ Collection saved with ${savedCards.length} cards:\n${savedCards.map((f) => `- ${f.title}`).join('\n')}`,
                    timestamp: Date.now(),
                },
            ];
        } catch (error) {
            console.error('Failed to save collection to AEM:', error);
            showToast(`Failed to save collection: ${error.message}`, 'negative');
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to save collection: ${error.message}`,
                    timestamp: Date.now(),
                },
            ];
        } finally {
            this.isLoading = false;
        }
    }

    extractTitle(cardConfig) {
        if (!cardConfig.title) return 'AI Generated Card';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardConfig.title;
        return tempDiv.textContent || 'AI Generated Card';
    }

    async handleCardsSelected(event) {
        const { cardIds } = event.detail;
        await this.createCollection(cardIds, 'Selected Cards Collection');
    }

    async handleCreateCollectionFromPreview(event) {
        const { fragmentIds, fragments } = event.detail;

        const title =
            fragments.length > 0
                ? `${fragments[0].title} and ${fragments.length - 1} more`
                : `AI Generated Collection (${fragmentIds.length} cards)`;

        await this.createCollection(fragmentIds, title);
    }

    async createCollection(cardIds, title) {
        this.isLoading = true;

        try {
            const repository = document.querySelector('mas-repository');
            if (!repository) throw new Error('Repository not found');

            const collectionData = {
                modelId: TAG_MODEL_ID_MAPPING['mas:studio/content-type/collection'],
                title,
                parentPath: Store.search.value.path || '/content/dam/mas',
                fields: [
                    { name: 'cards', values: cardIds },
                    { name: 'label', values: [title] },
                ],
            };

            const newCollection = await repository.aem.sites.cf.fragments.create(collectionData);

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `✓ Collection "${title}" created with ${cardIds.length} cards at: ${newCollection.path}`,
                    timestamp: Date.now(),
                },
            ];

            showToast('Collection created successfully!', 'positive');
        } catch (error) {
            console.error('Failed to create collection:', error);
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to create collection: ${error.message}`,
                    timestamp: Date.now(),
                },
            ];
            showToast(`Failed to create collection: ${error.message}`, 'negative');
        } finally {
            this.isLoading = false;
        }
    }

    async handleOperationAction(event) {
        const { action, operation } = event.detail;

        if (action === 'execute') {
            await this.executeOperation(operation);
        } else if (action === 'cancel') {
            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: 'Operation cancelled.',
                    timestamp: Date.now(),
                },
            ];
        }
    }

    async executeOperation(operation) {
        this.isLoading = true;

        const repository = document.querySelector('mas-repository');
        if (!repository) {
            showToast('Repository not found', 'negative');
            this.isLoading = false;
            return;
        }

        const result = await executeOperationWithFeedback(
            operation,
            repository,
            (res) => {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: res.message,
                        operationResult: res,
                        operationType: operation.operation,
                        timestamp: Date.now(),
                    },
                ];
            },
            (error) => {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'error',
                        content: `Operation failed: ${error.message}`,
                        timestamp: Date.now(),
                    },
                ];
            },
        );

        this.isLoading = false;
    }

    handleOpenCardFromOperation(event) {
        const { fragment } = event.detail;
        const fragmentStore = new FragmentStore(fragment);
        editFragment(fragmentStore);
        showToast('Card opened in editor');
    }

    scrollToBottom() {
        const messagesContainer = this.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('messages')) {
            setTimeout(() => this.scrollToBottom(), 100);
        }
    }

    render() {
        return html`
            <div class="chat-page-container">
                <div class="chat-header">
                    <div class="chat-header-content">
                        <sp-icon-magic-wand size="l" class="chat-header-icon"></sp-icon-magic-wand>
                        <div class="chat-header-text">
                            <h2>Merch at Scale AI Creator</h2>
                            <p>Create merch cards with natural language</p>
                        </div>
                    </div>
                </div>

                ${this.error
                    ? html`
                          <sp-banner type="error" open>
                              <div slot="content">${this.error}</div>
                          </sp-banner>
                      `
                    : ''}

                <div class="chat-container">
                    <div class="chat-messages">
                        ${this.messages.map(
                            (message) => html`
                                <mas-chat-message
                                    .message=${message}
                                    .showSuggestions=${this.showPromptSuggestions && message.showSuggestions}
                                    @card-action=${this.handleCardAction}
                                    @collection-action=${this.handleCollectionAction}
                                ></mas-chat-message>
                            `,
                        )}
                        ${this.isLoading
                            ? html`
                                  <mas-chat-message
                                      .message=${{
                                          role: 'assistant',
                                          content: 'Thinking...',
                                          isLoading: true,
                                      }}
                                  ></mas-chat-message>
                              `
                            : ''}
                    </div>

                    <div class="chat-preview">
                        <mas-chat-preview .cardConfig=${this.currentCardConfig}></mas-chat-preview>
                    </div>
                </div>

                <div class="chat-input">
                    <mas-chat-input @send-message=${this.handleSendMessage} .disabled=${this.isLoading}></mas-chat-input>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat', MasChat);
