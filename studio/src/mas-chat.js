import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import './mas-chat-message.js';
import './mas-chat-input.js';
import './mas-prompt-suggestions.js';
import './mas-card-selection-dialog.js';
import './mas-operation-result.js';
import './mas-chat-session-selector.js';
import Store from './store.js';
import router from './router.js';
import { createFragmentFromAIConfig } from './utils/ai-card-mapper.js';
import { callAIChatAction } from './services/ai-client.js';
import { saveToAEM, publishDraft, deleteDraft, saveCollectionToAEM } from './services/aem-operations.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { showToast, getHashParam, extractTitleText } from './utils.js';
import { TAG_MODEL_ID_MAPPING, SURFACE_MAP, PAGE_NAMES, SURFACES } from './constants.js';
import { getDamPath } from './mas-repository.js';
import sessionManager from './services/chat-session-manager.js';
import {
    buildEnrichedContext,
    routeResponse,
    createDraft,
    dispatchOperation,
    resolvePreviewApproval,
    getLastOperationResult,
    getRecentFragments,
} from './services/chat-dispatcher.js';

/**
 * Main AI Chat Component
 * Provides conversational interface for creating merch cards
 */
export class MasChat extends LitElement {
    static properties = {
        messages: { type: Array },
        isLoading: { type: Boolean },
        error: { type: String },
        showPromptSuggestions: { type: Boolean },
        currentSessionId: { type: String },
        showWelcomeScreen: { type: Boolean },
        userName: { type: String },
    };

    activeOperations = new Set();

    constructor() {
        super();
        this.messages = [];
        this.isLoading = false;
        this.error = null;
        this.conversationHistory = [];
        this.showPromptSuggestions = true;
        this.currentSessionId = null;
        this.showWelcomeScreen = true;
        this.userName = null;
    }

    startOperation(key) {
        this.activeOperations.add(key);
        this.isLoading = true;
    }

    endOperation(key) {
        this.activeOperations.delete(key);
        this.isLoading = this.activeOperations.size > 0;
    }

    async fetchUserName() {
        try {
            const profile = await window.adobeIMS?.getProfile?.();
            if (profile?.first_name) {
                this.userName = profile.first_name;
            } else if (profile?.displayName) {
                this.userName = profile.displayName.split(' ')[0];
            }
        } catch {
            this.userName = null;
        }
    }

    getTimeGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }

    getCurrentSurface() {
        const path = Store.search?.value?.path || getHashParam('path');
        if (!path) return null;
        return SURFACE_MAP[path] || null;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchUserName();
        this.loadActiveSession();
        this.addEventListener('cards-selected', this.handleCardsSelected);
        this.addEventListener('create-collection-from-preview', this.handleCreateCollectionFromPreview);
        this.addEventListener('prompt-selected', this.handlePromptSelected);
        this.addEventListener('operation-action', this.handleOperationAction);
        this.addEventListener('open-card', this.handleOpenCardFromOperation);
        this.addEventListener('session-changed', this.handleSessionChanged);
        this.addEventListener('session-cleared', this.handleSessionCleared);
        this.addEventListener('approve-preview', this.handleApprovePreview);
        this.addEventListener('cancel-preview', this.handleCancelPreview);
        this.handleKeyboardShortcut = this.handleKeyboardShortcut.bind(this);
        document.addEventListener('keydown', this.handleKeyboardShortcut);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.saveCurrentSession();
        this.removeEventListener('cards-selected', this.handleCardsSelected);
        this.removeEventListener('create-collection-from-preview', this.handleCreateCollectionFromPreview);
        this.removeEventListener('prompt-selected', this.handlePromptSelected);
        this.removeEventListener('operation-action', this.handleOperationAction);
        this.removeEventListener('open-card', this.handleOpenCardFromOperation);
        this.removeEventListener('session-changed', this.handleSessionChanged);
        this.removeEventListener('session-cleared', this.handleSessionCleared);
        this.removeEventListener('approve-preview', this.handleApprovePreview);
        this.removeEventListener('cancel-preview', this.handleCancelPreview);
        document.removeEventListener('keydown', this.handleKeyboardShortcut);
    }

    handleKeyboardShortcut(event) {
        if (router.path !== PAGE_NAMES.AI_ASSISTANT) return;
        const mod = event.metaKey || event.ctrlKey;
        if (mod && event.key === 'k') {
            event.preventDefault();
            const rteField = this.querySelector('mas-chat-input rte-field');
            if (rteField) rteField.focus();
        }
        if (mod && event.shiftKey && event.key === 'N') {
            event.preventDefault();
            const selector = this.querySelector('mas-chat-session-selector');
            if (selector) selector.handleNewSession?.();
        }
    }

    loadActiveSession() {
        const session = sessionManager.getActiveSession();
        this.currentSessionId = session.id;

        const hasRealMessages =
            session.messages &&
            session.messages.length > 0 &&
            session.messages.some((m) => m.role === 'user' || (m.role === 'assistant' && !m.showSuggestions));

        if (hasRealMessages) {
            this.messages = session.messages.map((m) => ({ ...m, fromHistory: true }));
            this.conversationHistory = session.conversationHistory || [];
            this.showPromptSuggestions = false;
            this.showWelcomeScreen = false;
        } else {
            this.addWelcomeMessage();
        }
    }

    saveCurrentSession() {
        if (!this.currentSessionId) return;

        const session = sessionManager.getSession(this.currentSessionId);
        if (!session) return;

        if (this.messages.length > 0 && !session.name.startsWith('Chat ')) {
            const firstUserMessage = this.messages.find((m) => m.role === 'user');
            if (firstUserMessage) {
                const generatedName = sessionManager.generateSessionName(firstUserMessage.content);
                sessionManager.renameSession(this.currentSessionId, generatedName);
            }
        }

        sessionManager.updateSessionDebounced(this.currentSessionId, {
            messages: this.messages,
            conversationHistory: this.conversationHistory,
        });
    }

    handleSessionChanged(event) {
        this.saveCurrentSession();

        const { sessionId } = event.detail;
        const session = sessionManager.getSession(sessionId);

        if (!session) {
            this.addWelcomeMessage();
            return;
        }

        this.currentSessionId = sessionId;
        this.messages = (session.messages || []).map((m) => ({ ...m, fromHistory: true }));
        this.conversationHistory = session.conversationHistory || [];

        const hasRealMessages =
            this.messages.length > 0 &&
            this.messages.some((m) => m.role === 'user' || (m.role === 'assistant' && !m.showSuggestions));

        this.showPromptSuggestions = !hasRealMessages;
        this.showWelcomeScreen = !hasRealMessages;

        if (!hasRealMessages) {
            this.addWelcomeMessage();
        }

        const selector = this.querySelector('mas-chat-session-selector');
        if (selector) {
            selector.loadSessions();
        }
    }

    handleSessionCleared(event) {
        const { sessionId } = event.detail;
        if (sessionId === this.currentSessionId) {
            this.messages = [];
            this.conversationHistory = [];
            this.showPromptSuggestions = true;
            this.showWelcomeScreen = true;
        }
    }

    addWelcomeMessage() {
        this.messages = [];
        this.showWelcomeScreen = true;
        this.showPromptSuggestions = true;
    }

    handlePromptSelected(event) {
        const { prompt } = event.detail;
        this.showPromptSuggestions = false;
        this.showWelcomeScreen = false;
        this.handleSendMessage({ detail: { message: prompt, context: {} } });
    }

    async handleSendMessage(event) {
        const { message, context } = event.detail;

        if (!message.trim()) return;

        this.showPromptSuggestions = false;
        this.showWelcomeScreen = false;

        const userMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now(),
        };

        if (context?.osi) userMessage.osi = context.osi;
        if (context?.offer) userMessage.offer = context.offer;
        if (context?.cards?.length > 0) userMessage.cards = context.cards;

        this.messages = [...this.messages, userMessage];

        this.startOperation('sendMessage');
        this.error = null;

        try {
            const enrichedContext = buildEnrichedContext(context, this.messages);

            const response = await callAIChatAction({
                message,
                conversationHistory: this.conversationHistory,
                context: enrichedContext,
            });

            const routed = routeResponse(response);
            const messageIndex = this.messages.length;
            this.messages = [...this.messages, ...routed.messages];

            if (routed.cardConfig) {
                const draftResult = await createDraft(routed.cardConfig, routed.messages[0]);
                this.messages = [
                    ...this.messages.slice(0, messageIndex),
                    draftResult.message,
                    ...this.messages.slice(messageIndex + 1),
                ];
            }

            if (routed.executeOp) {
                await this.executeOperation(routed.executeOp);
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
            this.endOperation('sendMessage');
        }
    }

    async handleCardAction(event) {
        const { action, config, fragmentId, fragmentTitle } = event.detail;

        if (action === 'edit') {
            if (fragmentId) {
                await this.openDraftInEditor(fragmentId);
            } else {
                this.openInEditor(config);
            }
        } else if (action === 'save') {
            await this.saveToAEM(config);
        } else if (action === 'publish') {
            await this.publishDraft(fragmentId);
        } else if (action === 'delete') {
            await this.deleteDraft(fragmentId, fragmentTitle);
        } else if (action === 'regenerate') {
            this.handleSendMessage({
                detail: {
                    message: 'Can you regenerate that card?',
                    context: { previousCard: config },
                },
            });
        }
    }

    async openInEditor(cardConfig) {
        try {
            const fragment = createFragmentFromAIConfig(cardConfig, cardConfig.variant, {
                title: extractTitleText(cardConfig.title, 'AI Generated Card'),
            });

            const fragmentStore = new FragmentStore(fragment);
            const storeFragments = Store.fragments.list.data.get();
            if (!storeFragments.find((s) => s.get()?.id === fragment.id)) {
                Store.fragments.list.data.set((prev) => [fragmentStore, ...prev]);
            }

            await router.navigateToFragmentEditor(fragment.id);
            showToast('Card opened in editor');
        } catch (error) {
            console.error('Failed to open in editor:', error);
            showToast(`Failed to open card: ${error.message}`, 'negative');
        }
    }

    async saveToAEM(cardConfig) {
        try {
            this.startOperation('saveToAEM');

            const title = extractTitleText(cardConfig.title, 'AI Generated Card');
            const newFragment = await saveToAEM(cardConfig);

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
            this.endOperation('saveToAEM');
        }
    }

    async openDraftInEditor(fragmentId) {
        try {
            await router.navigateToFragmentEditor(fragmentId);
            showToast('Draft card opened in editor');
        } catch (error) {
            console.error('Failed to open draft in editor:', error);
            showToast(`Failed to open card: ${error.message}`, 'negative');
        }
    }

    async publishDraft(fragmentId) {
        try {
            this.startOperation('publish');
            const fragment = await publishDraft(fragmentId);

            showToast(`Card "${fragment.title}" published successfully!`, 'positive');

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `✓ Card "${fragment.title}" has been published to production.`,
                    timestamp: Date.now(),
                },
            ];
        } catch (error) {
            console.error('Failed to publish draft:', error);
            showToast(`Failed to publish: ${error.message}`, 'negative');
        } finally {
            this.endOperation('publish');
        }
    }

    async deleteDraft(fragmentId, fragmentTitle) {
        try {
            this.startOperation('delete');
            await deleteDraft(fragmentId);

            showToast(`Draft "${fragmentTitle}" deleted successfully!`, 'positive');

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `✓ Draft card "${fragmentTitle}" has been deleted.`,
                    timestamp: Date.now(),
                },
            ];
        } catch (error) {
            console.error('Failed to delete draft:', error);
            showToast(`Failed to delete: ${error.message}`, 'negative');
        } finally {
            this.endOperation('delete');
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
            this.startOperation('saveCollection');

            showToast(`Saving ${collectionConfig.cards.length} cards...`, 'info');

            const savedCards = await saveCollectionToAEM(collectionConfig);
            const surface = Store.search.value.path;
            const locale = Store.filters.value.locale || 'en_US';

            showToast(`Collection saved successfully! ${savedCards.length} cards created.`, 'positive');

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `Collection saved with ${savedCards.length} cards in ${surface.charAt(0).toUpperCase() + surface.slice(1)} folder, ${locale} locale.`,
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
            this.endOperation('saveCollection');
        }
    }

    async handleCardsSelected(event) {
        const { cardIds } = event.detail;
        await this.createCollection(cardIds, 'Selected Cards Collection');
    }

    async handleCreateCollectionFromPreview(event) {
        const { fragmentIds, title } = event.detail;
        await this.createCollection(fragmentIds, title);
    }

    async createCollection(cardIds, title) {
        this.startOperation('createCollection');

        try {
            const repository = document.querySelector('mas-repository');
            if (!repository) throw new Error('Repository not found');

            const collectionData = {
                modelId: TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card-collection'],
                title,
                parentPath: `${getDamPath(Store.search.value.path)}/${Store.filters.value.locale || 'en_US'}`,
                fields: [
                    { name: 'cards', type: 'content-fragment', multiple: true, values: cardIds },
                    { name: 'label', type: 'text', values: [title] },
                ],
            };

            await repository.aem.sites.cf.fragments.create(collectionData);

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `Collection "${title}" created with ${cardIds.length} cards in ${Store.search.value.path} folder, ${Store.filters.value.locale || 'en_US'} locale.`,
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
            this.endOperation('createCollection');
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
        this.startOperation('executeOp');

        const repository = document.querySelector('mas-repository');
        if (!repository) {
            showToast('Repository not found', 'negative');
            this.endOperation('executeOp');
            return;
        }

        await dispatchOperation(operation, {
            onMessages: (newMessages) => {
                this.messages = [...this.messages, ...newMessages];
            },
            onAddLoadingMessage: (loadingMessage) => {
                this.messages = [...this.messages, loadingMessage];
            },
            onUpdateMessage: (messageId, updates) => {
                this.messages = this.messages.map((msg) => (msg.messageId === messageId ? { ...msg, ...updates } : msg));
                this.requestUpdate();
            },
            onReplaceLoadingMessage: (loadingMessage, replacement) => {
                this.messages = this.messages.map((msg) => (msg === loadingMessage ? replacement : msg));
            },
        });

        this.endOperation('executeOp');
    }

    handleApprovePreview(event) {
        const { operation } = event.detail;

        const lastMessage = this.messages[this.messages.length - 1];
        if (!lastMessage.previewParams) {
            console.error('No preview params found in last message');
            return;
        }

        const executionOperation = resolvePreviewApproval(operation, lastMessage.previewParams);
        if (!executionOperation) {
            console.error('Unknown preview operation:', operation);
            return;
        }

        this.messages = [
            ...this.messages,
            {
                role: 'assistant',
                content: 'Starting bulk operation...',
                timestamp: Date.now(),
            },
        ];

        this.executeOperation(executionOperation);
    }

    handleCancelPreview() {
        this.messages = [
            ...this.messages,
            {
                role: 'assistant',
                content: 'Preview cancelled. No changes were made.',
                timestamp: Date.now(),
            },
        ];

        showToast('Operation cancelled', 'info');
    }

    async handleOpenCardFromOperation(event) {
        const { fragment } = event.detail;
        await router.navigateToFragmentEditor(fragment.id);
        showToast('Card opened in editor');
    }

    scrollToBottom(smooth = false) {
        const messagesContainer = this.querySelector('.chat-messages');
        if (!messagesContainer) return;
        const scrollOptions = smooth ? { behavior: 'smooth' } : {};
        requestAnimationFrame(() => {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                ...scrollOptions,
            });
        });
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('messages') || changedProperties.has('isLoading')) {
            this.scrollToBottom();
            if (changedProperties.has('messages')) {
                this.saveCurrentSession();
            }
        }
    }

    render() {
        if (this.showWelcomeScreen) {
            return this.renderWelcomeScreen();
        }
        return this.renderChatView();
    }

    renderWelcomeScreen() {
        const greeting = this.getTimeGreeting();
        const name = this.userName;

        return html`
            <div class="chat-welcome-container">
                <div class="welcome-header-actions">
                    <mas-chat-session-selector></mas-chat-session-selector>
                </div>

                <div class="welcome-content">
                    <div class="welcome-icon-wrapper">
                        <sp-icon-magic-wand></sp-icon-magic-wand>
                    </div>
                    <div class="welcome-greeting">
                        <h1>${greeting}${name ? `, ${name}` : ''}</h1>
                        <p class="welcome-subtitle">Your AI assistant for Merch at Scale</p>
                    </div>

                    <div class="welcome-input-wrapper">
                        <mas-chat-input
                            @send-message=${this.handleSendMessage}
                            .disabled=${this.isLoading}
                            placeholder="How can I help you today?"
                        ></mas-chat-input>
                    </div>

                    <mas-prompt-suggestions .context=${{ surface: this.getCurrentSurface() }}></mas-prompt-suggestions>
                </div>

                ${this.isLoading
                    ? html`
                          <div class="welcome-loading">
                              <sp-progress-circle indeterminate size="m"></sp-progress-circle>
                          </div>
                      `
                    : ''}
            </div>
        `;
    }

    getSurfaceLabel(surfaceKey) {
        const entry = Object.values(SURFACES).find((s) => s.name === surfaceKey);
        return entry?.label || surfaceKey;
    }

    renderContextBar() {
        const surface = this.getCurrentSurface();
        const locale = Store.filters?.value?.locale;
        const workingSet = getRecentFragments(this.messages);
        const lastOp = getLastOperationResult(this.messages);

        if (!surface && !locale && !workingSet.length && !lastOp) return '';

        return html`
            <div class="context-bar">
                ${surface ? html`<sp-tag size="s">${this.getSurfaceLabel(surface)}</sp-tag>` : ''}
                ${locale ? html`<sp-tag size="s">${locale}</sp-tag>` : ''}
                ${workingSet.length > 0 ? html`<sp-tag size="s">${workingSet.length} cards in context</sp-tag>` : ''}
                ${lastOp ? html`<sp-tag size="s">Last: ${lastOp.type}</sp-tag>` : ''}
            </div>
        `;
    }

    renderChatView() {
        return html`
            <div class="chat-page-container">
                <div class="chat-header">
                    <div class="chat-header-content">
                        <sp-icon-magic-wand size="l" class="chat-header-icon"></sp-icon-magic-wand>
                        <div class="chat-header-text">
                            <h2>Cosmocat</h2>
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        <mas-chat-session-selector></mas-chat-session-selector>
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
                        ${repeat(
                            this.messages,
                            (message) => message.timestamp,
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
                </div>

                ${this.renderContextBar()}
                <div class="chat-input">
                    <mas-chat-input @send-message=${this.handleSendMessage} .disabled=${this.isLoading}></mas-chat-input>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat', MasChat);
