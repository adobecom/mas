import { LitElement, html, css } from 'lit';
import StoreController from './reactivity/store-controller.js';
import './mas-chat-message.js';
import './mas-chat-input.js';
import './mas-prompt-suggestions.js';
import './mas-card-selection-dialog.js';
import './mas-operation-result.js';
import './mas-chat-session-selector.js';
import Store, { editFragment } from './store.js';
import { createFragmentFromAIConfig, createFragmentDataForAEM } from './utils/ai-card-mapper.js';
import { executeOperationWithFeedback } from './utils/ai-operations-executor.js';
import { Fragment } from './aem/fragment.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { showToast, getHashParam } from './utils.js';
import { AI_CHAT_BASE_URL, TAG_MODEL_ID_MAPPING } from './constants.js';
import { getDamPath } from './mas-repository.js';
import sessionManager from './services/chat-session-manager.js';

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
    };

    constructor() {
        super();
        this.messages = [];
        this.isLoading = false;
        this.error = null;
        this.conversationHistory = [];
        this.showPromptSuggestions = true;
        this.currentSessionId = null;
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
    }

    loadActiveSession() {
        const session = sessionManager.getActiveSession();
        this.currentSessionId = session.id;

        if (session.messages && session.messages.length > 0) {
            this.messages = session.messages;
            this.conversationHistory = session.conversationHistory || [];
            this.showPromptSuggestions = false;
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
        this.messages = session.messages || [];
        this.conversationHistory = session.conversationHistory || [];
        this.showPromptSuggestions = this.messages.length === 0 || this.messages.every((m) => m.role === 'assistant');

        if (this.messages.length === 0) {
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
            this.addWelcomeMessage();
        }
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
        this.saveCurrentSession();
    }

    handlePromptSelected(event) {
        const { prompt } = event.detail;
        this.showPromptSuggestions = false;
        this.handleSendMessage({ detail: { message: prompt, context: {} } });
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
            const currentPath = Store.search?.value?.path || getHashParam('path');
            const enrichedContext = {
                ...context,
                currentPath: currentPath ? `/content/dam/mas/${currentPath}` : null,
                currentLocale: Store.filters?.value?.locale || 'en_US',
                lastOperation: this.getLastOperationResult(),
                workingSet: this.getRecentFragments(),
            };

            console.log('[AI Chat] Sending enriched context to backend:', {
                hasLastOperation: !!enrichedContext.lastOperation,
                lastOperationType: enrichedContext.lastOperation?.type,
                fragmentCount: enrichedContext.lastOperation?.fragmentIds?.length || 0,
                workingSetSize: enrichedContext.workingSet?.length || 0,
                surface: enrichedContext.surface,
                locale: enrichedContext.currentLocale,
                path: enrichedContext.currentPath,
            });

            const response = await this.callAIChatAction({
                message,
                conversationHistory: this.conversationHistory,
                context: enrichedContext,
            });

            if (response.type === 'operation' || response.type === 'mcp_operation') {
                if (response.type === 'mcp_operation' && response.mcpTool === 'studio_search_cards') {
                    let surface = null;
                    let detectionMethod = null;

                    console.log('[AI Chat] Surface Detection Debug:');
                    console.log('  Store.search.value.path:', Store.search?.value?.path);
                    console.log('  URL hash param (path):', getHashParam('path'));
                    console.log('  Store.folders.data:', Store.folders?.data?.value);

                    if (Store.search?.value?.path) {
                        surface = this.extractSurfaceFromPath(Store.search.value.path);
                        detectionMethod = 'Store.search.value.path';
                        console.log(`  ✓ Method 1 (Store.search.value.path): ${surface}`);
                    }

                    if (!surface) {
                        const hashPath = getHashParam('path');
                        const surfaceMap = {
                            acom: 'acom',
                            ccd: 'ccd',
                            commerce: 'commerce',
                            ahome: 'adobe-home',
                            express: 'express',
                            sandbox: 'sandbox',
                            docs: 'docs',
                            nala: 'nala',
                        };
                        surface = surfaceMap[hashPath] || null;
                        if (surface) {
                            detectionMethod = 'URL hash parameter';
                            console.log(`  ✓ Method 2 (URL hash): ${surface}`);
                        } else {
                            console.log(`  ✗ Method 2 (URL hash): Failed (hashPath: ${hashPath})`);
                        }
                    }

                    if (!surface && Store.folders?.data?.value?.length > 0) {
                        const firstFolder = Store.folders.data.value[0];
                        surface = this.extractSurfaceFromPath(firstFolder);
                        if (surface) {
                            detectionMethod = 'First folder from Store.folders.data';
                            console.log(`  ✓ Method 3 (First folder): ${surface} (from ${firstFolder})`);
                        }
                    }

                    if (!surface) {
                        surface = 'acom';
                        detectionMethod = 'Default fallback';
                        console.log(`  ✓ Method 4 (Default): ${surface}`);
                    }

                    console.log(`[AI Chat] Final surface: ${surface} (via ${detectionMethod})`);

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
                            console.log('[AI Chat] Converted image query to field search: backgroundImage:*');
                        }
                    }

                    console.log('[AI Chat] MCP Params:', {
                        surface: response.mcpParams.surface,
                        locale: response.mcpParams.locale,
                        query: response.mcpParams.query,
                        limit: response.mcpParams.limit,
                    });
                }

                const messageData = {
                    role: 'assistant',
                    content: response.message,
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
            } else {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        type: response.type,
                        fragmentIds: response.fragmentIds,
                        suggestedTitle: response.suggestedTitle,
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
        const repository = document.querySelector('mas-repository');
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
            const repository = document.querySelector('mas-repository');
            if (!repository) {
                throw new Error('Repository not found');
            }

            const fragmentData = await repository.aem.sites.cf.fragments.getById(fragmentId);
            const fragment = new Fragment(fragmentData);
            const fragmentStore = new FragmentStore(fragment);
            editFragment(fragmentStore);
            showToast('Draft card opened in editor');
        } catch (error) {
            console.error('Failed to open draft in editor:', error);
            showToast(`Failed to open card: ${error.message}`, 'negative');
        }
    }

    async publishDraft(fragmentId) {
        try {
            this.isLoading = true;
            const repository = document.querySelector('mas-repository');
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
            const repository = document.querySelector('mas-repository');
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

            const repository = document.querySelector('mas-repository');
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

        const operationType = operation.type === 'mcp_operation' ? operation.mcpTool : operation.operation;
        const isBulkOperation = ['studio_bulk_update_cards', 'studio_bulk_publish_cards', 'studio_bulk_delete_cards'].includes(
            operationType,
        );

        if (isBulkOperation) {
            await this.executeBulkOperationWithProgress(operation, operationType);
        } else {
            await this.executeRegularOperation(operation, repository, operationType);
        }

        this.isLoading = false;
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

        await executeOperationWithFeedback(
            operation,
            repository,
            (res) => {
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
        );
    }

    getOperationLoadingMessage(operationType) {
        const messages = {
            studio_search_cards: 'Searching for cards...',
            search: 'Searching for cards...',
            studio_publish_card: 'Publishing card...',
            publish: 'Publishing card...',
            studio_unpublish_card: 'Unpublishing card...',
            unpublish: 'Unpublishing card...',
            studio_delete_card: 'Deleting card...',
            delete: 'Deleting card...',
            studio_copy_card: 'Copying card...',
            copy: 'Copying card...',
            studio_update_card: 'Updating card...',
            update: 'Updating card...',
            studio_get_card: 'Fetching card details...',
            get: 'Fetching card details...',
        };

        return messages[operationType] || 'Executing operation...';
    }

    handleOpenCardFromOperation(event) {
        const { fragment } = event.detail;
        const fragmentStore = new FragmentStore(fragment);
        editFragment(fragmentStore);
        showToast('Card opened in editor');
    }

    extractSurfaceFromPath(path) {
        if (!path || typeof path !== 'string') return null;

        const pathParts = path.split('/');
        const surfaceIndex = pathParts.indexOf('mas') + 1;

        if (surfaceIndex === 0 || surfaceIndex >= pathParts.length) return null;

        const pathSegment = pathParts[surfaceIndex];

        const surfaceMap = {
            acom: 'acom',
            ccd: 'ccd',
            commerce: 'commerce',
            ahome: 'adobe-home',
            express: 'express',
            sandbox: 'sandbox',
            docs: 'docs',
            nala: 'nala',
        };

        return surfaceMap[pathSegment] || null;
    }

    scrollToBottom(smooth = false) {
        const messagesContainer = this.querySelector('.chat-messages');
        if (messagesContainer) {
            const scrollOptions = smooth ? { behavior: 'smooth' } : {};

            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                ...scrollOptions,
            });

            requestAnimationFrame(() => {
                messagesContainer.scrollTo({
                    top: messagesContainer.scrollHeight,
                    ...scrollOptions,
                });
            });

            setTimeout(() => {
                messagesContainer.scrollTo({
                    top: messagesContainer.scrollHeight,
                    ...scrollOptions,
                });
            }, 300);
        }
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

    getLastOperationResult() {
        const lastOp = this.messages
            .slice()
            .reverse()
            .find((m) => m.operationResult);

        if (!lastOp) return null;

        const fragmentIds = lastOp.operationResult.results?.map((f) => f.id) || [];
        console.log('[Frontend] ===== EXTRACTED FRAGMENT IDS FROM LAST OPERATION =====');
        console.log('[Frontend] Operation type:', lastOp.operationResult.operation);
        console.log('[Frontend] Total fragment IDs:', fragmentIds.length);
        console.log('[Frontend] Fragment IDs:', fragmentIds);

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
                })),
            )
            .slice(0, limit);
    }

    extractVariant(fragment) {
        const path = fragment.path || fragment.id;
        const match = path.match(/\/([^/]+)$/);
        return match ? match[1] : 'unknown';
    }

    render() {
        return html`
            <div class="chat-page-container">
                <div class="chat-header">
                    <div class="chat-header-content">
                        <sp-icon-magic-wand size="l" class="chat-header-icon"></sp-icon-magic-wand>
                        <div class="chat-header-text">
                            <h2>Cosmocat</h2>
                            <p>What can I help you with today?</p>
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
                </div>

                <div class="chat-input">
                    <mas-chat-input @send-message=${this.handleSendMessage} .disabled=${this.isLoading}></mas-chat-input>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat', MasChat);
