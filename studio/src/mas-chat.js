import { LitElement, html, nothing } from 'lit';
import './mas-chat-message.js';
import './mas-chat-input.js';
import './mas-prompt-suggestions.js';
import './mas-card-selection-dialog.js';
import './mas-operation-result.js';
import './mas-chat-session-selector.js';
import Store from './store.js';
import router from './router.js';
import { createFragmentFromAIConfig, createFragmentDataForAEM } from './utils/ai-card-mapper.js';
import { executeOperationWithFeedback } from './utils/ai-operations-executor.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { showToast, getHashParam, extractSurfaceFromPath as extractSurface } from './utils.js';
import { AI_CHAT_BASE_URL, TAG_MODEL_ID_MAPPING, SURFACES } from './constants.js';
import { getDamPath } from './mas-repository.js';
import { openOfferSelectorTool } from './rte/ost.js';
import sessionManager from './services/chat-session-manager.js';
import { fetchProducts, fetchProductDetail } from './services/product-api.js';

const KNOWN_SURFACES = new Set(Object.values(SURFACES).map(({ name }) => name));
const RECENT_MCS_PRODUCT_LIMIT = 6;
const PRODUCT_SELECTION_MESSAGE_REGEX = /(which product|select(?:ing)? the product|pick one below|type any product name)/i;
const SEGMENT_SELECTION_MESSAGE_REGEX = /who is this card targeting/i;
const PRODUCT_TIMESTAMP_PATHS = [
    ['createdAt'],
    ['created_at'],
    ['created'],
    ['dateAdded'],
    ['date_added'],
    ['addedAt'],
    ['added_at'],
    ['updatedAt'],
    ['updated_at'],
    ['modifiedAt'],
    ['modified_at'],
    ['metadata', 'createdAt'],
    ['metadata', 'created_at'],
    ['metadata', 'updatedAt'],
    ['metadata', 'updated_at'],
    ['misc', 'createdAt'],
    ['misc', 'created_at'],
    ['misc', 'updatedAt'],
    ['misc', 'updated_at'],
];

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
    };

    constructor() {
        super();
        this.messages = [];
        this.isLoading = false;
        this.error = null;
        this.conversationHistory = [];
        this.showPromptSuggestions = true;
        this.currentSessionId = null;
        this.showWelcomeScreen = true;
        this.recentReleaseProductsPromise = null;
        this.recentReleaseProductsCache = [];
        this.selectedReleaseProduct = null;
        this.selectedReleaseOffer = null;
        this.selectedReleaseOsi = null;
    }

    #repositoryEl = null;

    get repository() {
        return (this.#repositoryEl ??= document.querySelector('mas-repository'));
    }

    getCurrentSurface() {
        const path = Store.search?.value?.path || getHashParam('path');
        return this.extractSurfaceFromPath(path);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
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
        this.addEventListener('button-selected', this.handleButtonSelected);
        this.addEventListener('confirmation-action', this.handleConfirmationAction);
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
        this.removeEventListener('button-selected', this.handleButtonSelected);
        this.removeEventListener('confirmation-action', this.handleConfirmationAction);
    }

    loadActiveSession() {
        const session = sessionManager.getActiveSession();
        this.currentSessionId = session.id;

        const hasRealMessages =
            session.messages &&
            session.messages.length > 0 &&
            session.messages.some((m) => m.role === 'user' || (m.role === 'assistant' && !m.showSuggestions));

        if (hasRealMessages) {
            this.messages = session.messages;
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

        if (this.messages.length > 0 && session.name.startsWith('Chat ')) {
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
        this.messages = session.messages || [];
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
        this.recentReleaseProductsPromise = null;
        this.selectedReleaseProduct = null;
        this.selectedReleaseOffer = null;
        this.selectedReleaseOsi = null;
    }

    handlePromptSelected(event) {
        const { prompt, intentHint } = event.detail;
        this.showPromptSuggestions = false;
        this.showWelcomeScreen = false;
        this.handleSendMessage({ detail: { message: prompt, context: { intentHint } } });
    }

    handleButtonSelected(event) {
        const { value, label, product } = event.detail;
        const messageIndex = this.messages.findLastIndex(
            (m) => m.role === 'assistant' && m.buttonGroup && !m.buttonGroup.selectedValue,
        );
        if (messageIndex !== -1) {
            const updatedMessage = {
                ...this.messages[messageIndex],
                buttonGroup: {
                    ...this.messages[messageIndex].buttonGroup,
                    selectedValue: value,
                },
            };
            this.messages = [...this.messages.slice(0, messageIndex), updatedMessage, ...this.messages.slice(messageIndex + 1)];
        }
        if (product?.arrangement_code || product?.arrangementCode) {
            this.selectedReleaseProduct = product;
        }
        this.handleSendMessage({ detail: { message: label, context: {} } });
    }

    handleConfirmationAction(event) {
        const { action, selectedVariants } = event.detail;
        this.messages = this.messages.map((msg) => (msg.confirmationSummary ? { ...msg, confirmed: true } : msg));
        if (action === 'confirm') {
            const variantList = selectedVariants?.length ? selectedVariants.join(', ') : '';
            const message = variantList
                ? `Confirmed. Create cards for these variants: ${variantList}.`
                : 'Confirmed. Create the card.';
            this.handleSendMessage({
                detail: {
                    message,
                    context: { selectedVariants, osi: this.selectedReleaseOsi },
                },
            });
        } else {
            this.handleSendMessage({ detail: { message: 'Start over. Let me create a different card.', context: {} } });
        }
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

        if (context?.osi) {
            userMessage.osi = context.osi;
            this.selectedReleaseOsi = context.osi;
        }
        if (context?.offer) {
            userMessage.offer = context.offer;
            this.selectedReleaseOffer = context.offer;
        }
        if (context?.cards && context.cards.length > 0) {
            userMessage.cards = context.cards;
        }

        this.messages = [...this.messages, userMessage];

        this.isLoading = true;
        this.error = null;

        try {
            const currentPath = Store.search?.value?.path || getHashParam('path');
            const enrichedContext = {
                ...context,
                currentPath: currentPath ? `/content/dam/mas/${currentPath}` : null,
                currentLocale: Store.filters?.value?.locale || 'en_US',
                lastOperation: this.getLastOperationResult(),
                workingSet: this.getRecentFragments(),
            };

            const response = await this.callAIChatAction({
                message,
                conversationHistory: this.conversationHistory,
                context: enrichedContext,
                intentHint: enrichedContext.intentHint || null,
            });

            if (response.type === 'operation' || response.type === 'mcp_operation') {
                if (response.type === 'mcp_operation' && response.mcpTool === 'search_cards') {
                    const surface =
                        this.extractSurfaceFromPath(Store.search?.value?.path) ||
                        this.extractSurfaceFromPath(getHashParam('path')) ||
                        'acom';

                    response.mcpParams.surface = surface;
                    response.mcpParams.locale = Store.filters?.value?.locale || 'en_US';

                    if (response.mcpParams.query) {
                        const query = response.mcpParams.query.toLowerCase();
                        const imagePatterns = [
                            /\b(with|has|have|containing|that have)\s+(background\s*)?(image|images|backgroundimage)\b/i,
                            /\bbackground\s*image\b/i,
                            /\bhas\s+image\b/i,
                        ];
                        const isImageQuery = imagePatterns.some((pattern) => pattern.test(query));
                        if (isImageQuery && !query.includes('backgroundimage:')) {
                            response.mcpParams.query = 'backgroundImage:*';
                        }
                    }
                }

                const messageData = {
                    role: 'assistant',
                    content: response.message || 'Processing your request...',
                    confirmationRequired: response.confirmationRequired,
                    timestamp: Date.now(),
                };

                if (response.type === 'mcp_operation') {
                    messageData.mcpOperation = {
                        mcpTool: response.mcpTool,
                        mcpParams: response.mcpParams,
                    };
                    messageData.operationType = 'mcp_operation';
                } else {
                    messageData.operation = response.data;
                    messageData.operationType = response.operation;
                }

                this.messages = [...this.messages, messageData];
                this.conversationHistory = response.conversationHistory || [];

                if (!response.confirmationRequired) {
                    const operationToExecute =
                        response.type === 'mcp_operation'
                            ? {
                                  type: 'mcp_operation',
                                  mcpTool: response.mcpTool,
                                  mcpParams: response.mcpParams,
                              }
                            : response.data;

                    await this.executeOperation(operationToExecute);
                }
            } else if (response.type === 'card') {
                const messageIndex = this.messages.length;
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        isCreatingDraft: true,
                        validation: response.validation,
                        timestamp: Date.now(),
                    },
                ];

                try {
                    const draftFragment = await this.saveDraftToAEM(response.cardConfig);

                    this.messages = [
                        ...this.messages.slice(0, messageIndex),
                        {
                            role: 'assistant',
                            content: response.message,
                            fragmentId: draftFragment.id,
                            fragmentPath: draftFragment.path,
                            fragmentTitle: draftFragment.title,
                            fragmentStatus: draftFragment.status,
                            validation: response.validation,
                            timestamp: Date.now(),
                        },
                        ...this.messages.slice(messageIndex + 1),
                    ];

                    showToast(`Draft card "${draftFragment.title}" created`, 'positive');
                } catch (error) {
                    console.error('Failed to create draft:', error);
                    showToast(`Failed to create draft: ${error.message}`, 'negative');

                    this.messages = [
                        ...this.messages.slice(0, messageIndex),
                        {
                            role: 'error',
                            content: `Failed to create draft card: ${error.message}. You can try regenerating the card.`,
                            timestamp: Date.now(),
                        },
                        ...this.messages.slice(messageIndex + 1),
                    ];
                }
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
            } else if (response.type === 'guided_step') {
                const autoSelectedSegment = this.getAutoSelectedSegmentOption(response, context?.offer);
                if (autoSelectedSegment) {
                    await this.handleSendMessage({
                        detail: {
                            message: autoSelectedSegment.label,
                            context: {},
                        },
                    });
                    return;
                }

                const guidedStep = await this.enrichGuidedStepWithRecentProducts(response);
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: guidedStep.message,
                        buttonGroup: guidedStep.buttonGroup,
                        productCards: guidedStep.productCards,
                        timestamp: Date.now(),
                    },
                ];
            } else if (response.type === 'open_ost') {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        openOst: true,
                        ostSearchParams: response.searchParams,
                        timestamp: Date.now(),
                    },
                ];
            } else if (response.type === 'open_ost') {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        openOst: true,
                        ostSearchParams: response.searchParams,
                        timestamp: Date.now(),
                    },
                ];
            } else if (response.type === 'release_confirmation') {
                const confirmationSummary = await this.enrichReleaseConfirmationSummary(response.confirmationSummary);
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        confirmationSummary,
                        confirmationRequired: true,
                        timestamp: Date.now(),
                    },
                ];
            } else {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message || 'I processed your request but have nothing further to add.',
                        type: response.type,
                        sources: response.sources || [],
                        fragmentIds: response.fragmentIds,
                        suggestedTitle: response.suggestedTitle,
                        timestamp: Date.now(),
                    },
                ];
            }

            if (response.type !== 'operation' && response.type !== 'mcp_operation') {
                this.conversationHistory = response.conversationHistory || [];
            }
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
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to communicate with AI service');
        }

        return response.json();
    }

    handleOpenOstFromResponse(event) {
        const chatInput = this.querySelector('mas-chat-input');
        if (chatInput) chatInput.autoSendOnSelect = true;
        openOfferSelectorTool(this, null, event.detail.searchParams);
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
            const regenerateMessage = 'Can you regenerate that card?';
            this.handleSendMessage({
                detail: {
                    message: regenerateMessage,
                    context: { previousCard: config },
                },
            });
        }
    }

    async openInEditor(cardConfig) {
        try {
            const fragment = createFragmentFromAIConfig(cardConfig, cardConfig.variant, {
                title: this.extractTitle(cardConfig),
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
            this.isLoading = true;

            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository not found');
            }

            const title = this.extractTitle(cardConfig);
            const fragmentData = createFragmentDataForAEM(cardConfig, cardConfig.variant, {
                title,
                parentPath: `${getDamPath(Store.search.value.path)}/${Store.filters.value.locale || 'en_US'}`,
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

    generateUniqueFragmentName(title) {
        const baseName = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const timestamp = Date.now();
        return `${baseName}-${timestamp}`;
    }

    async saveDraftToAEM(cardConfig) {
        const repository = this.repository;
        if (!repository) {
            throw new Error('Repository not found');
        }

        const title = this.extractTitle(cardConfig);
        const uniqueName = this.generateUniqueFragmentName(title);
        const fragmentData = createFragmentDataForAEM(cardConfig, cardConfig.variant, {
            title,
            name: uniqueName,
            parentPath: `${getDamPath(Store.search.value.path)}/${Store.filters.value.locale || 'en_US'}`,
        });

        const newFragment = await repository.aem.sites.cf.fragments.create(fragmentData);

        const AemFragmentElement = customElements.get('aem-fragment');
        if (AemFragmentElement && newFragment) {
            AemFragmentElement.cache.add(newFragment);
        }

        return newFragment;
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
            this.isLoading = true;
            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository not found');
            }

            const fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);
            await repository.aem.sites.cf.fragments.publishFragment(fragment);

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
            this.isLoading = false;
        }
    }

    async deleteDraft(fragmentId, fragmentTitle) {
        try {
            this.isLoading = true;
            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository not found');
            }

            const fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);
            await repository.aem.sites.cf.fragments.delete(fragment);

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

            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository not found');
            }

            const parentPath = `${getDamPath(Store.search.value.path)}/${Store.filters.value.locale || 'en_US'}`;
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
                    content: `Collection saved with ${savedCards.length} cards in ${this.capitalize(Store.search.value.path)} folder, ${Store.filters.value.locale || 'en_US'} locale.`,
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

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
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
        this.isLoading = true;

        try {
            const repository = this.repository;
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
                    content: `Collection "${title}" created with ${cardIds.length} cards in ${this.capitalize(Store.search.value.path)} folder, ${Store.filters.value.locale || 'en_US'} locale.`,
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

        this.messages = this.messages.map((msg) =>
            msg.operation === operation || msg.mcpOperation?.mcpTool === operation?.mcpTool
                ? { ...msg, confirmationRequired: false, operation: null }
                : msg,
        );

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

        const repository = this.repository;
        if (!repository) {
            showToast('Repository not found', 'negative');
            this.isLoading = false;
            return;
        }

        const operationType = operation.type === 'mcp_operation' ? operation.mcpTool : operation.operation;
        const isPreviewOperation = ['preview_bulk_update', 'preview_bulk_publish', 'preview_bulk_delete'].includes(
            operationType,
        );
        const isBulkOperation = ['bulk_update_cards', 'bulk_publish_cards', 'bulk_delete_cards'].includes(operationType);

        if (isPreviewOperation) {
            await this.executePreviewOperation(operation, operationType);
        } else if (isBulkOperation) {
            await this.executeBulkOperationWithProgress(operation, operationType);
        } else {
            await this.executeRegularOperation(operation, repository, operationType);
        }

        this.isLoading = false;
    }

    async executePreviewOperation(operation, operationType) {
        const { executeStudioOperation } = await import('./services/mcp-client.js');

        try {
            const previewData = await executeStudioOperation(operation.mcpTool, operation.mcpParams);

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: 'Preview generated. Please review the changes and approve or cancel.',
                    previewData,
                    previewOperation: operationType,
                    previewParams: operation.mcpParams,
                    timestamp: Date.now(),
                },
            ];
        } catch (error) {
            console.error('Preview operation error:', error);
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to generate preview: ${error.message}`,
                    timestamp: Date.now(),
                },
            ];
            showToast(`Failed to generate preview: ${error.message}`, 'negative');
        }
    }

    handleApprovePreview(event) {
        const { previewData, operation } = event.detail;

        const lastMessage = this.messages[this.messages.length - 1];
        if (!lastMessage.previewParams) {
            console.error('No preview params found in last message');
            return;
        }

        const executionToolMap = {
            preview_bulk_update: 'bulk_update_cards',
            preview_bulk_publish: 'bulk_publish_cards',
            preview_bulk_delete: 'bulk_delete_cards',
        };

        const executionTool = executionToolMap[operation];
        if (!executionTool) {
            console.error('Unknown preview operation:', operation);
            return;
        }

        const executionOperation = {
            type: 'mcp_operation',
            mcpTool: executionTool,
            mcpParams: lastMessage.previewParams,
        };

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

    handleCancelPreview(event) {
        const { operation } = event.detail;

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

    async executeBulkOperationWithProgress(operation, operationType) {
        const { executeStudioOperationWithProgress } = await import('./services/mcp-client.js');

        const loadingMessage = this.getOperationLoadingMessage(operationType);
        const messageId = Date.now();
        const loadingMessageObj = {
            role: 'assistant',
            content: loadingMessage,
            operationLoading: true,
            operationType,
            progress: { current: 0, total: operation.mcpParams.fragmentIds?.length || 0 },
            timestamp: Date.now(),
            messageId,
        };

        this.messages = [...this.messages, loadingMessageObj];

        try {
            const result = await executeStudioOperationWithProgress(operation.mcpTool, operation.mcpParams, (statusUpdate) => {
                this.messages = this.messages.map((msg) =>
                    msg.messageId === messageId
                        ? {
                              ...msg,
                              content: `Processing ${statusUpdate.completed}/${statusUpdate.total} cards...`,
                              progress: {
                                  current: statusUpdate.completed,
                                  total: statusUpdate.total,
                                  percentage: statusUpdate.percentage,
                                  successful: statusUpdate.successCount,
                                  failed: statusUpdate.failureCount,
                              },
                          }
                        : msg,
                );
                this.requestUpdate();
            });

            this.messages = this.messages.map((msg) =>
                msg.messageId === messageId
                    ? {
                          role: 'assistant',
                          content: result.message,
                          operationResult: result,
                          operationType,
                          operationLoading: false,
                          timestamp: Date.now(),
                      }
                    : msg,
            );

            showToast(result.message, 'positive');
        } catch (error) {
            console.error('Bulk operation error:', error);
            this.messages = this.messages.map((msg) =>
                msg.messageId === messageId
                    ? {
                          role: 'error',
                          content: `Operation failed: ${error.message}`,
                          operationLoading: false,
                          timestamp: Date.now(),
                      }
                    : msg,
            );
            showToast(error.message, 'negative');
        }
    }

    async executeRegularOperation(operation, repository, operationType) {
        const loadingMessage = this.getOperationLoadingMessage(operationType);

        const loadingMessageObj = {
            role: 'assistant',
            content: loadingMessage,
            operationLoading: true,
            operationType,
            timestamp: Date.now(),
        };

        this.messages = [...this.messages, loadingMessageObj];

        let operationResult = null;

        const silent = operationType === 'list_products';

        await executeOperationWithFeedback(
            operation,
            repository,
            (res) => {
                operationResult = res;
                this.messages = this.messages.map((msg) =>
                    msg === loadingMessageObj
                        ? {
                              role: 'assistant',
                              content: res.message,
                              operationResult: res,
                              operationType,
                              operationLoading: false,
                              timestamp: Date.now(),
                          }
                        : msg,
                );
            },
            (error) => {
                this.messages = this.messages.map((msg) =>
                    msg === loadingMessageObj
                        ? {
                              role: 'error',
                              content: `Operation failed: ${error.message}`,
                              operationLoading: false,
                              timestamp: Date.now(),
                          }
                        : msg,
                );
            },
            { silent },
        );

        if (operationType === 'list_products' && operationResult?.success) {
            this.messages = this.messages.filter((msg) => msg.operationResult !== operationResult);
            await this.continueWithMCPResult('list_products', operationResult.rawResult);
        }
    }

    async continueWithMCPResult(tool, result) {
        const products = result?.products || [];
        if (!products.length) return;

        const summary = products
            .slice(0, 20)
            .map((p) => {
                const copy = p.copy || {};
                const assets = p.assets || {};
                const parts = [`- ${copy.name || p.name} (code: ${p.product_code}, arrangement: ${p.arrangement_code}`];
                parts.push(`icon: ${assets.icons?.svg || p.icon || 'none'}`);
                if (copy.description) parts.push(`description: "${copy.description}"`);
                else if (copy.short_description) parts.push(`short_description: "${copy.short_description}"`);
                parts.push(`segment: ${p.customer_segment || Object.keys(p.customerSegments || {}).join(', ')}`);
                parts.push(
                    `markets: ${Array.isArray(p.market_segments) ? p.market_segments.join(', ') : Object.keys(p.marketSegments || {}).join(', ')}`,
                );
                parts.push(`family: ${p.product_family || 'none'}`);
                if (copy.tags?.length) parts.push(`mcs_tags: ${copy.tags.join(', ')}`);
                if (Object.keys(p.links || {}).length) parts.push(`has_links: yes`);
                if (Object.keys(p.misc || {}).length) parts.push(`misc: ${JSON.stringify(p.misc)}`);
                parts.push(')');
                return parts.join(', ');
            })
            .join('\n');

        const toolResultMessage = `[MCS product data retrieved via ${tool}]\n${summary}${products.length > 30 ? `\n...and ${products.length - 30} more` : ''}`;

        this.conversationHistory = [...this.conversationHistory, { role: 'user', content: toolResultMessage }];

        this.isLoading = true;

        try {
            const currentPath = Store.search?.value?.path || getHashParam('path');
            const response = await this.callAIChatAction({
                message: toolResultMessage,
                conversationHistory: this.conversationHistory,
                context: {
                    currentPath: currentPath ? `/content/dam/mas/${currentPath}` : null,
                    currentLocale: Store.filters?.value?.locale || 'en_US',
                },
            });

            this.conversationHistory = response.conversationHistory || [];

            if (response.type === 'operation' || response.type === 'mcp_operation') {
                const messageData = {
                    role: 'assistant',
                    content: response.message,
                    timestamp: Date.now(),
                };
                if (response.type === 'mcp_operation') {
                    messageData.mcpOperation = { mcpTool: response.mcpTool, mcpParams: response.mcpParams };
                    messageData.operationType = 'mcp_operation';
                }
                this.messages = [...this.messages, messageData];
                if (!response.confirmationRequired) {
                    const op =
                        response.type === 'mcp_operation'
                            ? { type: 'mcp_operation', mcpTool: response.mcpTool, mcpParams: response.mcpParams }
                            : response.data;
                    await this.executeOperation(op);
                }
            } else if (response.type === 'guided_step') {
                const autoSelectedSegment = this.getAutoSelectedSegmentOption(response, context?.offer);
                if (autoSelectedSegment) {
                    await this.handleSendMessage({
                        detail: {
                            message: autoSelectedSegment.label,
                            context: {},
                        },
                    });
                    return;
                }

                const guidedStep = await this.enrichGuidedStepWithRecentProducts(response);
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: guidedStep.message,
                        buttonGroup: guidedStep.buttonGroup,
                        productCards: guidedStep.productCards,
                        timestamp: Date.now(),
                    },
                ];
            } else if (response.type === 'release_confirmation') {
                const confirmationSummary = await this.enrichReleaseConfirmationSummary(response.confirmationSummary);
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        confirmationSummary,
                        confirmationRequired: true,
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
                        sources: response.sources || [],
                        timestamp: Date.now(),
                    },
                ];
            }
        } catch (error) {
            console.error('Continue with MCP result error:', error);
            this.messages = [
                ...this.messages,
                { role: 'error', content: `Failed to process product data: ${error.message}`, timestamp: Date.now() },
            ];
        } finally {
            this.isLoading = false;
        }
    }

    getOperationLoadingMessage(operationType) {
        const messages = {
            search_cards: 'Searching for cards...',
            search: 'Searching for cards...',
            publish_card: 'Publishing card...',
            publish: 'Publishing card...',
            unpublish_card: 'Unpublishing card...',
            unpublish: 'Unpublishing card...',
            delete_card: 'Deleting card...',
            delete: 'Deleting card...',
            copy_card: 'Copying card...',
            copy: 'Copying card...',
            update_card: 'Updating card...',
            update: 'Updating card...',
            get_card: 'Fetching card details...',
            get: 'Fetching card details...',
            list_products: 'Fetching products from MCS...',
            create_release_cards: 'Creating release cards...',
        };

        return messages[operationType] || 'Executing operation...';
    }

    async handleOpenCardFromOperation(event) {
        const { fragment } = event.detail;
        const drawer = document.querySelector('mas-chat-drawer');
        drawer?.close();
        await router.navigateToFragmentEditor(fragment.id);
        showToast('Card opened in editor');
    }

    extractSurfaceFromPath(path) {
        if (!path || typeof path !== 'string') return null;
        const surface = path.includes('/') ? extractSurface(path) : path;
        return KNOWN_SURFACES.has(surface) ? surface : null;
    }

    async enrichGuidedStepWithRecentProducts(response) {
        if (!this.isProductSelectionStep(response)) {
            return response;
        }

        const recentProducts = await this.getRecentReleaseProducts();
        if (!recentProducts.length) {
            return response;
        }

        return {
            ...response,
            productCards: recentProducts,
            buttonGroup: {
                ...response.buttonGroup,
                label: response.buttonGroup?.label || 'Product',
                inputHint: response.buttonGroup?.inputHint || 'Or type a product name to search...',
            },
        };
    }

    async enrichReleaseConfirmationSummary(summary) {
        const selectedProductDescription = this.getPreferredProductDescription(this.selectedReleaseProduct);
        const selectedSegment = this.getPreferredReleaseSegment(summary);
        if (selectedProductDescription) {
            return {
                ...summary,
                product: {
                    ...(this.selectedReleaseProduct || {}),
                    ...(summary?.product || {}),
                    description: selectedProductDescription,
                },
                segment: selectedSegment,
            };
        }

        const arrangementCode =
            summary?.product?.arrangement_code ?? summary?.product?.arrangementCode ?? summary?.product?.value ?? '';

        if (!arrangementCode) {
            return summary;
        }

        try {
            const preferredDescriptionFromSummary = this.getPreferredProductDescription(summary.product);
            if (preferredDescriptionFromSummary) {
                return {
                    ...summary,
                    product: {
                        ...summary.product,
                        description: preferredDescriptionFromSummary,
                    },
                    segment: selectedSegment,
                };
            }

            const productCatalog = await fetchProducts().catch(() => ({ products: [] }));
            const matchingProduct = (productCatalog.products || []).find((product) => {
                const productArrangementCode = product?.arrangement_code ?? product?.arrangementCode ?? product?.value;
                return productArrangementCode === arrangementCode;
            });

            const catalogDescription = this.getPreferredProductDescription(matchingProduct, matchingProduct?.copy);
            if (catalogDescription) {
                return {
                    ...summary,
                    product: {
                        ...summary.product,
                        description: catalogDescription,
                    },
                    segment: selectedSegment,
                };
            }

            const productDetail = await fetchProductDetail(arrangementCode).catch(() => null);
            const mcsProduct = productDetail?.product;
            if (mcsProduct) {
                const mcsDescription = this.getPreferredProductDescription(mcsProduct, mcsProduct?.copy);
                if (mcsDescription) {
                    return {
                        ...summary,
                        product: {
                            ...summary.product,
                            description: mcsDescription,
                        },
                        segment: selectedSegment,
                    };
                }
            }

            return {
                ...summary,
                segment: selectedSegment,
            };
        } catch (error) {
            console.error('Failed to enrich release confirmation summary:', error);
            return {
                ...summary,
                segment: selectedSegment,
            };
        }
    }

    isProductSelectionStep(response) {
        if (response?.type !== 'guided_step') return false;
        if (response.buttonGroup?.label === 'Product') return true;
        return PRODUCT_SELECTION_MESSAGE_REGEX.test(response.message || '');
    }

    isSegmentSelectionStep(response) {
        if (response?.type !== 'guided_step') return false;
        if (response.buttonGroup?.label === 'Customer Segment') return true;
        return SEGMENT_SELECTION_MESSAGE_REGEX.test(response.message || '');
    }

    getAutoSelectedSegmentOption(response, offer) {
        if (!this.isSegmentSelectionStep(response) || !offer || !response.buttonGroup?.options?.length) {
            return null;
        }

        const customerSegment = String(offer.customer_segment || '').toUpperCase();
        const marketSegment = String(
            Array.isArray(offer.market_segments) ? offer.market_segments[0] : offer.market_segment || '',
        ).toUpperCase();

        if (!customerSegment) {
            return null;
        }

        return (
            response.buttonGroup.options.find((option) => {
                const value = String(option.value || '').toUpperCase();
                const [optionCustomerSegment, optionMarketSegment] = value.split('|');
                if (optionCustomerSegment !== customerSegment) {
                    return false;
                }
                return !optionMarketSegment || !marketSegment || optionMarketSegment === marketSegment;
            }) || null
        );
    }

    async getRecentReleaseProducts() {
        if (!this.recentReleaseProductsPromise) {
            this.recentReleaseProductsPromise = this.loadRecentReleaseProducts()
                .then((products) => {
                    this.recentReleaseProductsCache = products;
                    return products;
                })
                .catch((error) => {
                    console.error('Failed to load recent MCS products for AI chat:', error);
                    this.recentReleaseProductsPromise = null;
                    return this.recentReleaseProductsCache;
                });
        }

        return this.recentReleaseProductsPromise;
    }

    async loadRecentReleaseProducts() {
        let lastError;

        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                const result = await fetchProducts();
                const products = this.selectRecentMCSProducts(result.products || []);
                if (products.length) {
                    return products;
                }
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError) {
            throw lastError;
        }

        return [];
    }

    selectRecentMCSProducts(products) {
        return products
            .map((product, index) => ({
                product,
                index,
                timestamp: this.getProductTimestamp(product),
            }))
            .sort((a, b) => {
                if (a.timestamp !== null && b.timestamp !== null) {
                    return b.timestamp - a.timestamp;
                }
                if (a.timestamp !== null) return -1;
                if (b.timestamp !== null) return 1;
                return b.index - a.index;
            })
            .filter(({ product }) => {
                const segments = Object.keys(product.customerSegments || {}).filter((key) => product.customerSegments[key]);
                return segments.length === 0 || !segments.every((s) => s === 'ENTERPRISE');
            })
            .slice(0, RECENT_MCS_PRODUCT_LIMIT)
            .map(({ product }) => this.mapProductToChatCard(product));
    }

    getProductTimestamp(product) {
        for (const path of PRODUCT_TIMESTAMP_PATHS) {
            let value = product;
            for (const key of path) {
                value = value?.[key];
            }

            if (!value) continue;

            const timestamp = Date.parse(value);
            if (!Number.isNaN(timestamp)) {
                return timestamp;
            }
        }

        return null;
    }

    mapProductToChatCard(product) {
        const customerSegments = Object.entries(product.customerSegments || {})
            .filter(([, enabled]) => enabled)
            .map(([segment]) => segment);
        const segments = customerSegments.length ? customerSegments : [product.customer_segment].filter(Boolean);

        return {
            label: product.copy?.name || product.name || product.arrangement_code,
            value: product.arrangement_code,
            arrangement_code: product.arrangement_code,
            product_code: product.product_code,
            product_family: product.product_family,
            segments,
            icon: product.assets?.icons?.svg || product.icon,
            description: this.getPreferredProductDescription(product, product.copy),
        };
    }

    getPreferredProductDescription(...sources) {
        const candidates = [];

        for (const source of sources) {
            const values = [
                source?.copy?.description,
                source?.copy?.short_description,
                source?.copy?.shortDescription,
                source?.description,
                source?.short_description,
                source?.shortDescription,
            ];

            for (const value of values) {
                const normalized = typeof value === 'string' ? value.trim() : '';
                if (normalized) {
                    candidates.push(normalized);
                }
            }
        }

        return candidates.sort((left, right) => right.length - left.length)[0] || '';
    }

    getPreferredReleaseSegment(summary) {
        if (summary?.segment?.label) {
            return summary.segment;
        }

        const offer = this.selectedReleaseOffer;
        const customerSegment = String(offer?.customer_segment || '').trim();
        if (customerSegment) {
            return {
                label: this.formatSegmentLabel(customerSegment),
                value: customerSegment,
            };
        }

        const productSegment = this.selectedReleaseProduct?.segments?.[0];
        if (productSegment) {
            return {
                label: this.formatSegmentLabel(productSegment),
                value: productSegment,
            };
        }

        return summary?.segment;
    }

    formatSegmentLabel(segment) {
        return String(segment)
            .toLowerCase()
            .split(/[_\s-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    scrollToLatestResponse() {
        const messagesContainer = this.querySelector('.chat-messages');
        if (!messagesContainer) return;
        requestAnimationFrame(() => {
            const messages = messagesContainer.querySelectorAll('.chat-message-assistant');
            const lastAssistant = messages[messages.length - 1];
            if (lastAssistant) {
                lastAssistant.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                messagesContainer.scrollTo({
                    top: messagesContainer.scrollHeight,
                    behavior: 'smooth',
                });
            }
        });
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('messages') || changedProperties.has('isLoading')) {
            this.scrollToLatestResponse();
            if (changedProperties.has('messages')) {
                this.saveCurrentSession();
            }
        }
    }

    getLastOperationResult() {
        const lastOp = this.messages
            .slice()
            .reverse()
            .find((m) => m.operationResult);

        if (!lastOp) return null;

        const fragmentIds = lastOp.operationResult.results?.map((f) => f.id) || [];

        return {
            type: lastOp.operationResult.operation,
            fragmentIds,
            count: lastOp.operationResult.count || 0,
            timestamp: lastOp.timestamp,
        };
    }

    getRecentFragments(limit = 50) {
        return this.messages
            .filter((m) => m.operationResult?.results)
            .slice(-3)
            .flatMap((m) =>
                m.operationResult.results.map((f) => ({
                    id: f.id,
                    title: f.title || f.cardTitle,
                    variant: this.extractVariant(f),
                    osi: this.extractOsi(f),
                })),
            )
            .slice(0, limit);
    }

    extractVariant(fragment) {
        const path = fragment.path || fragment.id || '';
        const match = path.match(/\/([^/]+)$/);
        return match ? match[1] : fragment.variant || 'unknown';
    }

    extractOsi(fragment) {
        if (fragment.osi) return fragment.osi;
        if (fragment.fields && !Array.isArray(fragment.fields)) {
            return fragment.fields.osi || null;
        }
        if (Array.isArray(fragment.fields)) {
            const osiField = fragment.fields.find((f) => f.name === 'osi');
            return osiField?.values?.[0] || null;
        }
        return null;
    }

    render() {
        if (this.showWelcomeScreen) {
            return this.renderWelcomeScreen();
        }
        return this.renderChatView();
    }

    renderWelcomeScreen() {
        return html`
            <div class="chat-welcome-container">
                <div class="welcome-header-actions">
                    <mas-chat-session-selector></mas-chat-session-selector>
                </div>

                <div class="welcome-content">
                    <div class="welcome-greeting">
                        <h1>How can I help?</h1>
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
                    : nothing}
            </div>
        `;
    }

    renderChatView() {
        return html`
            <div class="chat-page-container">
                <div class="chat-header">
                    <div class="chat-header-content">
                        <h2 class="chat-header-title">AI Assistant</h2>
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
                    : nothing}

                <div class="chat-container">
                    <div class="chat-messages">
                        ${this.messages.map(
                            (message) => html`
                                <mas-chat-message
                                    .message=${message}
                                    .showSuggestions=${this.showPromptSuggestions && message.showSuggestions}
                                    @card-action=${this.handleCardAction}
                                    @collection-action=${this.handleCollectionAction}
                                    @open-ost-from-response=${this.handleOpenOstFromResponse}
                                ></mas-chat-message>
                            `,
                        )}
                        ${this.isLoading
                            ? html`
                                  <div class="typing-indicator">
                                      <div class="typing-dot"></div>
                                      <div class="typing-dot"></div>
                                      <div class="typing-dot"></div>
                                  </div>
                              `
                            : nothing}
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
