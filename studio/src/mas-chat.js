import { LitElement, html, nothing } from 'lit';
import './mas-chat-message.js';
import './mas-chat-input.js';
import './mas-prompt-suggestions.js';
import './mas-operation-result.js';
import './mas-chat-session-selector.js';
import Store from './store.js';
import router from './router.js';
import {
    createFragmentFromAIConfig,
    createFragmentDataForAEM,
    enrichConfigWithMcsMnemonic,
    buildReleaseCtas,
    buildReleasePrice,
    buildReleaseTags,
} from './utils/ai-card-mapper.js';
import { shouldRequireConfirmation } from './utils/ai-operations-executor.js';
import { classifyEnvelopeIntent, renderConfirmationTemplate, META_INTENTS } from './utils/ai-chat-envelope-dispatcher.js';
import {
    getProductName,
    extractCardTitle,
    capitalize as capitalizeStr,
    mapProductToChatCard as mapProductToChatCardFn,
    getPreferredProductDescription as getPreferredProductDescriptionFn,
    isProductSelectionStep as isProductSelectionStepFn,
    isSegmentSelectionStep as isSegmentSelectionStepFn,
    getAutoSelectedSegmentOption as getAutoSelectedSegmentOptionFn,
    extractKnownSurfaceFromPath,
    composeChatRequestSignal,
    isChatRequestTimeout,
    CHAT_REQUEST_TIMEOUT_MS,
    CHAT_TIMEOUT_MESSAGE,
} from './utils/mas-chat-helpers.js';
import { classifySearchIntent, resumeWithSlot } from './utils/ai-chat-search-router.js';
import { isDeterministicSearchEnabled, recordSearchIntentTelemetry } from './utils/ai-chat-search-telemetry.js';
import { validateFragmentIds, fragmentIdGuardMessage } from './utils/fragment-id-guard.js';
import { extractFragmentIdsFromMessage, extractFragmentSummariesFromMessage } from './utils/operation-result-extractors.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { showToast, getHashParam, normalizeFragmentForCache, logError } from './utils.js';
import { TAG_MODEL_ID_MAPPING } from './constants.js';
import { AI_CHAT_BASE_URL } from './mas-chat/config.js';
import { getDamPath } from './mas-repository.js';
import { openOfferSelectorTool } from './rte/ost.js';
import sessionManager from './services/chat-session-manager.js';
import { fetchProducts, fetchProductDetail } from './services/product-api.js';
import { routerAction, nextGuidedFlowState, resolveIntentHint, guidedFlowHintForIntent } from './utils/ai-chat-flow-state.js';

const RECENT_MCS_PRODUCT_LIMIT = 6;

/**
 * Intent hints that drive multi-turn guided flows. While one of these is
 * the active flow, button clicks and free-text replies stay in the same
 * system prompt instead of being re-classified per turn — that mis-routing
 * is what made "Find Cards → By product name → Firefly pro plus" try to
 * create a card instead of searching.
 */
const GUIDED_FLOW_HINTS = new Set(['guided_search', 'guided_offer_search', 'guided_help', 'release', 'collection']);

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
        this.selectedReleaseTrialOffer = null;
        this.selectedReleaseTrialOsi = null;
        this.trialCtaAsked = false;
        this.pendingSearchIntent = null;
        this.activeGuidedFlow = null;
        this.guidedFlowTurns = 0;
    }

    #repositoryEl = null;

    get repository() {
        return (this.#repositoryEl ??= document.querySelector('mas-repository'));
    }

    get selectedProductName() {
        return getProductName(this.selectedReleaseProduct);
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
        this.abortController = new AbortController();
        this.loadActiveSession();
        this.addEventListener('cards-selected', this.handleCardsSelected);
        this.addEventListener('create-collection-from-preview', this.handleCreateCollectionFromPreview);
        this.addEventListener('prompt-selected', this.handlePromptSelected);
        this.addEventListener('operation-action', this.handleOperationAction);
        this.addEventListener('open-card', this.handleOpenCardFromOperation);
        this.addEventListener('session-changed', this.handleSessionChanged);
        this.addEventListener('approve-preview', this.handleApprovePreview);
        this.addEventListener('cancel-preview', this.handleCancelPreview);
        this.addEventListener('button-selected', this.handleButtonSelected);
        this.addEventListener('confirmation-action', this.handleConfirmationAction);
        this.addEventListener('chat-feedback', this.handleChatFeedback);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.abortController?.abort();
        this.abortController = null;
        this.saveCurrentSession();
        this.removeEventListener('cards-selected', this.handleCardsSelected);
        this.removeEventListener('create-collection-from-preview', this.handleCreateCollectionFromPreview);
        this.removeEventListener('prompt-selected', this.handlePromptSelected);
        this.removeEventListener('operation-action', this.handleOperationAction);
        this.removeEventListener('open-card', this.handleOpenCardFromOperation);
        this.removeEventListener('session-changed', this.handleSessionChanged);
        this.removeEventListener('approve-preview', this.handleApprovePreview);
        this.removeEventListener('cancel-preview', this.handleCancelPreview);
        this.removeEventListener('button-selected', this.handleButtonSelected);
        this.removeEventListener('confirmation-action', this.handleConfirmationAction);
        this.removeEventListener('chat-feedback', this.handleChatFeedback);
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
            messages: this.messages.map((message) => {
                const persisted = { ...message };
                delete persisted.fresh;
                return persisted;
            }),
            conversationHistory: this.conversationHistory,
        });

        this.maybeUpgradeSessionTitle(session);
    }

    maybeUpgradeSessionTitle(session) {
        if (!session || session.titleGenerated) return;

        const firstUserMessage = this.messages.find((m) => m.role === 'user');
        const firstAssistantMessage = this.messages.find(
            (m) => m.role === 'assistant' && typeof m.content === 'string' && m.content.trim(),
        );
        if (!firstUserMessage || !firstAssistantMessage) return;

        const sessionId = this.currentSessionId;
        this.requestSessionTitle(firstUserMessage.content, firstAssistantMessage.content)
            .then((title) => {
                if (!title) return;
                sessionManager.renameSession(sessionId, title);
                sessionManager.updateSession(sessionId, { titleGenerated: true });
            })
            .catch((error) => {
                console.warn('Session title generation failed, keeping fallback name:', error.message);
            });
    }

    async requestSessionTitle(userMessage, assistantMessage) {
        const response = await this.callAIChatAction({
            requestType: 'title',
            userMessage,
            assistantMessage,
        });
        return typeof response?.title === 'string' ? response.title.trim() : null;
    }

    async handleChatFeedback(event) {
        const { rating, messageId, content, timestamp } = event.detail || {};
        if (!rating) return;

        this.saveCurrentSession();
        showToast(rating === 'up' ? 'Thanks for the feedback!' : 'Thanks — we will use this to improve.', 'positive');

        try {
            await this.callAIChatAction({
                requestType: 'feedback',
                rating,
                messageId,
                sessionId: this.currentSessionId,
                content,
                timestamp,
            });
        } catch (error) {
            console.warn('Feedback submission failed:', error.message);
        }
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

    addWelcomeMessage() {
        this.messages = [];
        this.showWelcomeScreen = true;
        this.showPromptSuggestions = true;
        this.recentReleaseProductsPromise = null;
        this.selectedReleaseProduct = null;
        this.selectedReleaseOffer = null;
        this.selectedReleaseOsi = null;
        this.selectedReleaseTrialOffer = null;
        this.selectedReleaseTrialOsi = null;
        this.trialCtaAsked = false;
        this.pendingSearchIntent = null;
        this.activeGuidedFlow = null;
        this.guidedFlowTurns = 0;
    }

    handlePromptSelected(event) {
        const { prompt, intentHint } = event.detail;
        this.showPromptSuggestions = false;
        this.showWelcomeScreen = false;
        if (intentHint && GUIDED_FLOW_HINTS.has(intentHint)) {
            this.activeGuidedFlow = intentHint;
            this.guidedFlowTurns = 0;
        }
        this.handleSendMessage({ detail: { message: prompt, context: { intentHint } } });
    }

    handleButtonSelected(event) {
        const { value, label, product } = event.detail;
        const messageIndex = this.messages.findLastIndex(
            (m) => m.role === 'assistant' && m.buttonGroup && !m.buttonGroup.selectedValue,
        );
        const answeredGroupLabel = messageIndex !== -1 ? this.messages[messageIndex].buttonGroup.label : null;
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
        if (answeredGroupLabel === 'Trial CTA') {
            if (value === 'trial-yes') {
                const offer = this.selectedReleaseOffer || {};
                const searchParams = {
                    arrangement_code: offer.product_arrangement_code || offer.arrangementCode || null,
                    commitment: offer.commitment || null,
                    term: offer.term || null,
                    customerSegment: offer.customer_segment || offer.customerSegment || null,
                    mode: 'plans-base-and-trial',
                };
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: 'Opening the Offer Selector Tool — please pick a free-trial offer.',
                        openOst: true,
                        ostSearchParams: searchParams,
                        timestamp: Date.now(),
                        fresh: true,
                    },
                ];
            } else {
                this.handleSendMessage({
                    detail: {
                        message: `Using the already-selected offer as the base offer (no trial offer). osi: ${this.selectedReleaseOsi}. Skip Step 5 and proceed directly to Step 6 (release confirmation summary).`,
                        context: {
                            hidden: true,
                            osi: this.selectedReleaseOsi,
                            offer: this.selectedReleaseOffer,
                        },
                    },
                });
            }
            return;
        }
        const arrangementCode = product?.arrangement_code || product?.arrangementCode;
        if (arrangementCode) {
            this.selectedReleaseProduct = product;
            // Product is already resolved — signal to the backend to skip
            // re-lookup (Step 2) and advance to Offering Type (Step 4).
            // Without this, the AI re-runs list_products on the label and
            // renders a duplicate product card list.
            this.handleSendMessage({
                detail: {
                    message: `Selected product: ${label} (arrangement_code: ${arrangementCode}). Proceed to Step 4 (Offering Type Selection).`,
                    context: {
                        selectedProduct: {
                            arrangement_code: arrangementCode,
                            name: product.name || label,
                            product_code: product.product_code,
                            product_family: product.product_family,
                            customer_segment: product.customer_segment,
                            segments: product.segments,
                        },
                    },
                },
            });
            return;
        }
        // The user sees the friendly `label` in their message bubble; the
        // backend gets the rich `value` (e.g. "search-by-product") so it can
        // route without needing to natural-language-parse a terse label.
        // If the value differs from the label, we ship label as the displayed
        // message and value as a hidden routing tag in context.
        const flowContext = this.activeGuidedFlow ? { intentHint: this.activeGuidedFlow } : {};
        if (value && value !== label) {
            flowContext.buttonValue = value;
        }
        this.handleSendMessage({ detail: { message: label, context: flowContext } });
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
                    context: {
                        selectedVariants,
                        osi: this.selectedReleaseOsi,
                        trialOsi: this.selectedReleaseTrialOsi,
                    },
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

        if (context?.osi) {
            this.messages = this.messages.map((msg) => (msg.openOst ? { ...msg, ostConfirmed: true } : msg));
        }

        const userMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now(),
        };

        if (context?.hidden) {
            userMessage.hidden = true;
        }

        if (context?.osi) {
            userMessage.osi = context.osi;
            this.selectedReleaseOsi = context.osi;
        }
        if (context?.trialOsi) {
            userMessage.trialOsi = context.trialOsi;
            this.selectedReleaseTrialOsi = context.trialOsi;
        }
        if (context?.offer) {
            userMessage.offer = context.offer;
            this.selectedReleaseOffer = context.offer;
        }
        if (context?.trialOffer) {
            userMessage.trialOffer = context.trialOffer;
            this.selectedReleaseTrialOffer = context.trialOffer;
        }

        this.messages = [...this.messages, { ...userMessage, fresh: true }];

        this.isLoading = true;
        this.error = null;

        // Inside a guided flow the flow's LLM prompt stays the canonical
        // interpreter — e.g., a release-flow turn that types "PA-1375" means
        // "this is the product I'm answering with", not "look up an OSI".
        // The router therefore only fires mid-flow for unambiguous lookups
        // (confidence >= 0.9, e.g. a pasted UUID), which double as the
        // user's escape hatch out of a drifting flow.
        if (isDeterministicSearchEnabled() && !context?.skipDeterministicRouter) {
            const handled = await this.tryDeterministicSearch(message);
            if (handled) {
                if (this.activeGuidedFlow) {
                    this.activeGuidedFlow = null;
                    this.guidedFlowTurns = 0;
                }
                this.isLoading = false;
                return;
            }
        }

        try {
            const currentPath = Store.search?.value?.path || getHashParam('path');
            const enrichedContext = {
                ...context,
                currentPath: currentPath ? `/content/dam/mas/${currentPath}` : null,
                currentLocale: Store.filters?.value?.locale || 'en_US',
                lastOperation: this.getLastOperationResult(),
                workingSet: this.getRecentFragments(),
            };

            // When the user clicked a button menu, the displayed message is
            // the friendly label but the model needs the rich routing value
            // to disambiguate. Send a combined string that contains both so
            // the model can pattern-match on the value while the user
            // bubble stays human-readable.
            const messageForBackend = enrichedContext.buttonValue
                ? `${message} (selection: ${enrichedContext.buttonValue})`
                : message;

            const response = await this.callAIChatAction({
                message: messageForBackend,
                conversationHistory: this.conversationHistory,
                context: enrichedContext,
                intentHint: resolveIntentHint(enrichedContext.intentHint, this.activeGuidedFlow),
            });

            // Envelope-first dispatcher (Stage 3.2). When the backend
            // returned an envelope (always, since Stage 3.1), prefer it
            // over the legacy `response.type` switch. If the envelope path
            // throws or chooses to defer, fall back to the old switch
            // below so a one-release-cycle rollback is always available.
            const envelopeHandled = await this.tryDispatchEnvelope(response, message);
            if (envelopeHandled) {
                if (response.conversationHistory) {
                    this.conversationHistory = response.conversationHistory;
                }
                return;
            }

            // Update guided-flow bookkeeping from the response type: terminal
            // types (operation, card creation, plain message) end the flow,
            // non-terminal turns count toward the cap so a drifting flow can
            // never trap the user indefinitely.
            if (response?.type) {
                const flowState = nextGuidedFlowState(
                    { flow: this.activeGuidedFlow, turns: this.guidedFlowTurns },
                    response.type,
                );
                this.activeGuidedFlow = flowState.flow;
                this.guidedFlowTurns = flowState.turns;
            }

            if (response.type === 'operation' || response.type === 'mcp_operation') {
                recordSearchIntentTelemetry({
                    source: 'llm',
                    intent: response.type === 'mcp_operation' ? response.mcpTool : response.operation,
                    confidence: 1,
                    tool: response.type === 'mcp_operation' ? response.mcpTool : response.operation,
                });
                if (response.type === 'mcp_operation' && response.mcpTool === 'search_cards') {
                    this.autoInjectSearchCardsContext(response.mcpParams);
                }

                const requiresConfirmation = shouldRequireConfirmation(response.mcpTool, response.confirmationRequired);
                const messageData = {
                    role: 'assistant',
                    content: response.message || 'Processing your request...',
                    confirmationRequired: requiresConfirmation,
                    timestamp: Date.now(),
                    fresh: true,
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

                if (!requiresConfirmation) {
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
                        fresh: true,
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
                    logError('Failed to create draft', error);
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
                        fresh: true,
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
                const offeringStep = guidedStep.buttonGroup?.label === 'Offering Type';
                const pa = this.selectedReleaseProduct?.arrangement_code || this.selectedReleaseProduct?.arrangementCode;
                const attachOst =
                    offeringStep && pa
                        ? { openOst: true, ostSearchParams: { arrangement_code: pa, mode: 'plans-base-and-trial' } }
                        : {};
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: guidedStep.message,
                        buttonGroup: guidedStep.buttonGroup,
                        productCards: guidedStep.productCards,
                        timestamp: Date.now(),
                        fresh: true,
                        ...attachOst,
                    },
                ];
                // Single-match preview is informational — auto-advance past
                // it so the user doesn't have to click "Select" just to
                // confirm the one product we already resolved for them.
                // Release flow is active when either:
                //  - the user arrived via an OST offer (selectedReleaseOffer)
                //  - the assistant asked "Which product is this release for"
                const cards = guidedStep.productCards;
                const releaseFlowPrompt = this.messages.some(
                    (m) => m.role === 'assistant' && m.content?.includes('Which product is this release for'),
                );
                const inReleaseFlow = this.selectedReleaseOffer || this.selectedReleaseOsi || releaseFlowPrompt;
                if (Array.isArray(cards) && cards.length === 1 && inReleaseFlow) {
                    const only = cards[0];
                    this.selectedReleaseProduct = {
                        arrangement_code: only.arrangement_code || only.value,
                        name: only.label,
                        icon: only.icon,
                    };
                    const lastIndex = this.messages.length - 1;
                    const lastMessage = this.messages[lastIndex];
                    if (lastMessage?.productCards) {
                        this.messages = [
                            ...this.messages.slice(0, lastIndex),
                            { ...lastMessage, productCardsSelectedValue: only.value ?? only.arrangement_code },
                        ];
                    }
                    await this.handleSendMessage({
                        detail: {
                            message: `Selected product: ${only.label} (arrangement_code: ${only.arrangement_code || only.value})`,
                            context: { hidden: true, selectedProduct: this.selectedReleaseProduct },
                        },
                    });
                }
            } else if (response.type === 'open_ost') {
                // When the user already provided an offer (via OST "Use" at
                // the start of the release flow), skip the base-offer pick
                // step but still give them the option to add a free-trial
                // CTA. Ask with a yes/no button group; the handler on the
                // click routes to OST (yes) or to the confirmation summary
                // (no). trialCtaAsked guards against asking twice.
                if (this.selectedReleaseOffer && this.selectedReleaseOsi && !this.trialCtaAsked) {
                    this.trialCtaAsked = true;
                    this.messages = [
                        ...this.messages,
                        {
                            role: 'assistant',
                            content: 'Would you like to add a free-trial CTA to this card?',
                            buttonGroup: {
                                label: 'Trial CTA',
                                options: [
                                    { label: 'Yes, pick a trial offer', value: 'trial-yes' },
                                    { label: 'No, skip', value: 'trial-no' },
                                ],
                            },
                            timestamp: Date.now(),
                            fresh: true,
                        },
                    ];
                    return;
                }
                const searchParams = { ...response.searchParams };
                const backendMode = response.searchParams?.mode;
                const msg = response.message || '';
                let mode = backendMode;
                if (!mode) {
                    if (response.searchParams?.expectedOffers === 2 || /base.*trial|trial.*base|try.?buy/i.test(msg)) {
                        mode = 'plans-base-and-trial';
                    } else if (/\bbundle\b|soft.?bundle/i.test(msg)) {
                        mode = 'plans-bundle';
                    } else if (/\bconsult\b|contact.?sales/i.test(msg)) {
                        mode = 'plans-consult';
                    }
                }
                if (mode) searchParams.mode = mode;
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        openOst: true,
                        ostSearchParams: searchParams,
                        timestamp: Date.now(),
                        fresh: true,
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
                        fresh: true,
                    },
                ];
            } else if (response.type === 'release_cards') {
                await this.handleReleaseCardsResponse(response);
            } else {
                const prevAssistant = [...this.messages].reverse().find((m) => m.role === 'assistant');
                if (response.type === 'message' && prevAssistant?.buttonGroup?.label === 'Product') {
                    await this.recoverProductLookup(message);
                } else {
                    this.messages = [
                        ...this.messages,
                        {
                            role: 'assistant',
                            content: response.message || 'I processed your request but have nothing further to add.',
                            type: response.type,
                            fragmentIds: response.fragmentIds,
                            suggestedTitle: response.suggestedTitle,
                            timestamp: Date.now(),
                            fresh: true,
                        },
                    ];
                }
            }

            if (response.type !== 'operation' && response.type !== 'mcp_operation') {
                this.conversationHistory = response.conversationHistory || [];
            }
        } catch (error) {
            logError('Chat error', error);
            this.error = error.message;
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Sorry, I encountered an error: ${error.message}`,
                    timestamp: Date.now(),
                    fresh: true,
                },
            ];
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Envelope-first dispatcher (Stage 3.2).
     *
     * Reads `response.envelope` and routes meta / read-only / state-changing
     * intents directly. Returns true when handled (caller skips the legacy
     * `response.type` switch). Returns false when the envelope is absent OR
     * the intent should be handled by the existing type-based switch (guided
     * steps, release_confirmation, release_cards, draft card creation —
     * these have rich UI integrations that still live in the old switch).
     *
     * Any exception inside this method is logged and we return false so the
     * old path runs as a safety net.
     */
    async tryDispatchEnvelope(response, originalMessage) {
        if (!response || typeof response !== 'object') return false;
        const envelope = response.envelope;
        if (!envelope || typeof envelope !== 'object' || typeof envelope.intent !== 'string') {
            return false;
        }
        try {
            const flowHint = guidedFlowHintForIntent(envelope.intent);
            if (flowHint) {
                this.activeGuidedFlow = flowHint;
                this.guidedFlowTurns = 0;
            }

            const category = classifyEnvelopeIntent(envelope);

            if (category === 'meta') {
                return this.dispatchMetaEnvelope(envelope);
            }

            if (envelope.clarification_question || envelope.missing_slots?.length) {
                const text =
                    envelope.clarification_question || `I need a bit more information: ${envelope.missing_slots.join(', ')}.`;
                this.messages = [...this.messages, { role: 'assistant', content: text, timestamp: Date.now(), fresh: true }];
                return true;
            }

            if (category === 'guided') {
                // Guided-step intents still flow through the legacy
                // response.type path (guided_step / release_confirmation /
                // release_cards / open_ost), which carries the rich UI
                // payloads (buttonGroup, productCards, confirmationSummary,
                // cardConfigs). Let the old switch handle it.
                return false;
            }

            if (category === 'unknown') {
                return false;
            }

            const mcpTool = envelope.intent;
            const mcpParams = envelope.slots ?? {};
            const requiresConfirmation = category === 'mcp-state-changing' || shouldRequireConfirmation(mcpTool, false);

            if (mcpTool === 'search_cards') {
                this.autoInjectSearchCardsContext(mcpParams);
            }

            recordSearchIntentTelemetry({
                source: 'envelope',
                intent: mcpTool,
                confidence: 1,
                tool: mcpTool,
            });

            const messageContent =
                envelope.user_message ||
                response.message ||
                (requiresConfirmation
                    ? renderConfirmationTemplate(mcpTool, mcpParams) || 'Confirm this action?'
                    : 'Processing your request...');

            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: messageContent,
                    confirmationRequired: requiresConfirmation,
                    mcpOperation: { mcpTool, mcpParams },
                    operationType: 'mcp_operation',
                    timestamp: Date.now(),
                    fresh: true,
                },
            ];

            if (!requiresConfirmation) {
                await this.executeOperation({
                    type: 'mcp_operation',
                    mcpTool,
                    mcpParams,
                });
            }

            if (this.activeGuidedFlow) {
                this.activeGuidedFlow = null;
                this.guidedFlowTurns = 0;
            }

            return true;
        } catch (err) {
            logError('Envelope dispatch failed; falling back to legacy switch', err);
            return false;
        }
    }

    /**
     * Handle meta intents (ASK_USER / ABORT / START_OVER / SHOW_HELP /
     * REPORT_ERROR). Returns true — meta is always terminal for the turn.
     */
    dispatchMetaEnvelope(envelope) {
        const { intent } = envelope;

        if (intent === 'ASK_USER') {
            const text =
                envelope.clarification_question || envelope.user_message || 'Could you clarify what you would like me to do?';
            this.messages = [...this.messages, { role: 'assistant', content: text, timestamp: Date.now(), fresh: true }];
            return true;
        }

        if (intent === 'ABORT') {
            this.activeGuidedFlow = null;
            this.guidedFlowTurns = 0;
            this.pendingSearchIntent = null;
            this.selectedReleaseProduct = null;
            this.selectedReleaseOffer = null;
            this.selectedReleaseOsi = null;
            this.selectedReleaseTrialOffer = null;
            this.selectedReleaseTrialOsi = null;
            this.trialCtaAsked = false;
            const text = envelope.user_message || 'Cancelled. What would you like to do next?';
            this.messages = [...this.messages, { role: 'assistant', content: text, timestamp: Date.now(), fresh: true }];
            return true;
        }

        if (intent === 'START_OVER') {
            this.activeGuidedFlow = null;
            this.guidedFlowTurns = 0;
            this.pendingSearchIntent = null;
            this.selectedReleaseProduct = null;
            this.selectedReleaseOffer = null;
            this.selectedReleaseOsi = null;
            this.selectedReleaseTrialOffer = null;
            this.selectedReleaseTrialOsi = null;
            this.trialCtaAsked = false;
            this.messages = [];
            this.conversationHistory = [];
            const text = envelope.user_message || 'Starting fresh. How can I help?';
            this.messages = [{ role: 'assistant', content: text, timestamp: Date.now() }];
            return true;
        }

        if (intent === 'SHOW_HELP') {
            const text = envelope.user_message || 'Here are some things I can help with.';
            this.messages = [...this.messages, { role: 'assistant', content: text, timestamp: Date.now(), fresh: true }];
            return true;
        }

        if (intent === 'REPORT_ERROR') {
            const text = envelope.user_message || envelope.slots?.message || 'An error occurred.';
            this.messages = [...this.messages, { role: 'error', content: text, timestamp: Date.now(), fresh: true }];
            return true;
        }

        // Should never reach here — META_INTENTS set is closed. Defer to old path.
        if (META_INTENTS.has(intent)) return true;
        return false;
    }

    /**
     * Run the deterministic search-intent classifier ahead of the LLM call.
     *
     * Returns true if the router fully handled the message (either dispatched
     * a backend operation or rendered a missing-slot follow-up), so the caller
     * can skip the LLM round-trip entirely. Returns false to let the LLM path
     * run as a fallback for genuinely fuzzy queries.
     */
    async tryDeterministicSearch(message) {
        const currentSurface =
            extractKnownSurfaceFromPath(Store.search?.value?.path) || extractKnownSurfaceFromPath(getHashParam('path'));
        const currentLocale = Store.filters?.value?.locale || 'en_US';

        const classified = this.pendingSearchIntent
            ? resumeWithSlot(message, this.pendingSearchIntent)
            : classifySearchIntent(message, { currentSurface, currentLocale });

        recordSearchIntentTelemetry({
            source: 'router',
            intent: classified.intent,
            confidence: classified.confidence,
            tool: classified.dispatch?.mcpTool || null,
        });

        const action = routerAction(classified, this.activeGuidedFlow);

        if (action === 'prompt-slot') {
            this.pendingSearchIntent = classified;
            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: classified.missingSlot.prompt,
                    timestamp: Date.now(),
                    fresh: true,
                },
            ];
            return true;
        }

        if (action === 'dispatch') {
            this.pendingSearchIntent = null;
            await this.executeOperation({
                type: 'mcp_operation',
                mcpTool: classified.dispatch.mcpTool,
                mcpParams: classified.dispatch.mcpParams,
            });
            this.attachSearchDisplayContext(classified);
            this.maybeOfferSearchPivots(classified);
            return true;
        }

        if (this.pendingSearchIntent) {
            this.pendingSearchIntent = null;
        }
        return false;
    }

    /**
     * Attach surface / locale / query slots to the latest operation message
     * so the unified search-result render can compose a "View all in Studio →"
     * deep link. Used after the deterministic router fires; the LLM-routed
     * path lacks this context — its "View all" button is omitted in that case.
     */
    attachSearchDisplayContext(classified) {
        const lastIndex = this.messages.length - 1;
        const last = this.messages[lastIndex];
        if (!last?.operationResult) return;
        const surfaceFromSlots = classified.slots?.surface || null;
        const localeFromSlots = classified.slots?.locale || 'en_US';
        const queryFromSlots =
            classified.slots?.query || classified.slots?.osi || classified.slots?.id || classified.slots?.variant || null;
        this.messages = [
            ...this.messages.slice(0, lastIndex),
            {
                ...last,
                operationDisplayContext: {
                    surface: surfaceFromSlots,
                    locale: localeFromSlots,
                    query: queryFromSlots,
                },
            },
        ];
    }

    /**
     * After a deterministic search dispatch, append a friendly pivot when the
     * lookup returned no results. Avoids the silent dead-end users hit today.
     */
    maybeOfferSearchPivots(classified) {
        const lastMessage = this.messages[this.messages.length - 1];
        const result = lastMessage?.operationResult;
        if (!result) return;

        // Pick the right "did we get nothing back?" predicate per intent.
        // Different MCP tools return results under different fields:
        //   - get_card           → result.fragment
        //   - get_variations     → result.variations
        //   - search_cards       → result.results
        // Treating them uniformly (always reading result.results) makes
        // the pivot fire spuriously after a successful variations lookup.
        const isEmptyByIntent = () => {
            if (classified.intent === 'id-lookup') return !result.fragment;
            if (classified.intent === 'variations-lookup') return (result.variations?.length ?? 0) === 0;
            return (result.results?.length ?? 0) === 0;
        };
        if (!isEmptyByIntent()) return;

        const surface = classified.slots?.surface;
        const lookupValue =
            classified.slots?.id || classified.slots?.osi || classified.slots?.query || classified.slots?.variant;

        const lines = [];
        if (classified.intent === 'id-lookup') {
            lines.push(`No card found with ID \`${lookupValue}\`.`);
        } else if (classified.intent === 'variations-lookup') {
            lines.push(`No variations found for fragment \`${lookupValue}\`.`);
        } else if (classified.intent === 'osi-lookup' || classified.intent === 'offer-id-lookup') {
            lines.push(`No cards found using OSI \`${lookupValue}\`${surface ? ` in ${surface}` : ''}.`);
        } else if (classified.intent === 'content-search') {
            lines.push(`No cards contain "${lookupValue}"${surface ? ` in ${surface}` : ''}.`);
        } else if (classified.intent === 'variant-search') {
            lines.push(`No cards with template \`${lookupValue}\`${surface ? ` in ${surface}` : ''}.`);
        } else {
            lines.push(`No cards matched "${lookupValue}"${surface ? ` in ${surface}` : ''}.`);
        }
        if (classified.intent === 'variations-lookup') {
            lines.push(
                `Either this fragment has no grouped variations, or the ID is incorrect. Open the parent in Studio to confirm.`,
            );
        } else if (classified.intent === 'variant-search' && surface) {
            // The template exists in the catalog (router validated it) but
            // this surface has no cards using it. Most useful next step is
            // to try other surfaces, not change query phrasing.
            lines.push(
                `That template isn't used in **${surface}**. Try \`acom\`, \`commerce\`, or \`ccd\` — or add \`in <surface>\` to your message to override.`,
            );
        } else if (surface) {
            lines.push(`You can search by title or content in **${surface}**, or browse the **${surface}** folder in Studio.`);
        } else {
            lines.push('You can search by title, content, or paste a fragment ID, OSI, or offer ID.');
        }

        this.messages = [
            ...this.messages,
            {
                role: 'assistant',
                content: lines.join('\n\n'),
                timestamp: Date.now(),
                fresh: true,
            },
        ];
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

        let response;
        try {
            response = await fetch(actionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessTokenObj.token}`,
                    'x-api-key': window.adobeIMS?.adobeIdData?.client_id || '',
                },
                body: JSON.stringify(params),
                signal: composeChatRequestSignal(CHAT_REQUEST_TIMEOUT_MS, this.abortController?.signal),
            });
        } catch (error) {
            if (isChatRequestTimeout(error)) {
                throw new Error(CHAT_TIMEOUT_MESSAGE);
            }
            throw error;
        }

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
        const { action, config, fragmentId } = event.detail;

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
            const enrichedConfig = await enrichConfigWithMcsMnemonic(cardConfig, this.selectedReleaseProduct);
            const fragment = createFragmentFromAIConfig(enrichedConfig, enrichedConfig.variant, {
                title: this.extractTitle(enrichedConfig),
            });

            const fragmentStore = new FragmentStore(fragment);
            const storeFragments = Store.fragments.list.data.get();
            if (!storeFragments.find((s) => s.get()?.id === fragment.id)) {
                Store.fragments.list.data.set((prev) => [fragmentStore, ...prev]);
            }

            await router.navigateToFragmentEditor(fragment.id);
            showToast('Card opened in editor');
        } catch (error) {
            logError('Failed to open in editor', error);
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

            const enrichedConfig = await enrichConfigWithMcsMnemonic(cardConfig, this.selectedReleaseProduct);
            const title = this.extractTitle(enrichedConfig);
            const fragmentData = createFragmentDataForAEM(enrichedConfig, enrichedConfig.variant, {
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
                    fresh: true,
                },
            ];
        } catch (error) {
            logError('Failed to save to AEM', error);
            showToast(`Failed to save card: ${error.message}`, 'negative');
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to save: ${error.message}`,
                    timestamp: Date.now(),
                    fresh: true,
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

    async saveDraftToAEM(cardConfig, options = {}) {
        const repository = this.repository;
        if (!repository) {
            throw new Error('Repository not found');
        }

        const title = options.title || this.extractTitle(cardConfig);
        const uniqueName = options.name || this.generateUniqueFragmentName(title);
        const parentPath =
            options.parentPath || `${getDamPath(Store.search.value.path)}/${Store.filters.value.locale || 'en_US'}`;

        let enrichedConfig = { ...cardConfig };

        // Studio is the sole author of all release card content. OSI values come
        // unconditionally from chat state; all visible fields are built deterministically
        // from MCS data and OST-faithful builders — the AI only supplies the variant.
        enrichedConfig.osi = this.selectedReleaseOsi;
        enrichedConfig.trialOsi = this.selectedReleaseTrialOsi;

        enrichedConfig = await enrichConfigWithMcsMnemonic(enrichedConfig, this.selectedReleaseProduct);

        const isCatalog = enrichedConfig.variant === 'catalog';
        const isPlans =
            enrichedConfig.variant === 'plans' ||
            enrichedConfig.variant === 'plans-students' ||
            enrichedConfig.variant === 'plans-education';

        enrichedConfig.ctas = buildReleaseCtas(enrichedConfig.osi, enrichedConfig.trialOsi, {
            includeTrial: !isPlans,
            buyNowLabel: isPlans ? 'Select' : 'Buy now',
        });

        if (enrichedConfig.osi && !isCatalog) {
            enrichedConfig.prices = buildReleasePrice(enrichedConfig.osi);
        }

        const mcsDescription = this.getPreferredProductDescription(this.selectedReleaseProduct);
        if (mcsDescription) {
            enrichedConfig.description = mcsDescription;
        }

        const mcsName = this.selectedProductName;
        if (mcsName) {
            enrichedConfig.title = `<h3 slot="heading-xs">${mcsName}</h3>`;
        }

        const fragmentData = createFragmentDataForAEM(enrichedConfig, enrichedConfig.variant, {
            title,
            name: uniqueName,
            parentPath,
            tags: buildReleaseTags(this.selectedReleaseProduct),
        });

        const newFragment = await repository.aem.sites.cf.fragments.create(fragmentData);

        const AemFragmentElement = customElements.get('aem-fragment');
        if (AemFragmentElement && newFragment) {
            AemFragmentElement.cache.add(normalizeFragmentForCache(newFragment));
        }

        return newFragment;
    }

    async handleReleaseCardsResponse(response) {
        const cardConfigs = Array.isArray(response.cardConfigs) ? response.cardConfigs : [];
        if (cardConfigs.length === 0) {
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: 'No card configurations were provided for the release.',
                    timestamp: Date.now(),
                    fresh: true,
                },
            ];
            return;
        }

        const productName = this.selectedProductName || this.extractTitle(cardConfigs[0]) || '';

        const placeholderIndex = this.messages.length;
        this.messages = [
            ...this.messages,
            {
                role: 'assistant',
                content:
                    response.message || `Creating ${cardConfigs.length} release card${cardConfigs.length !== 1 ? 's' : ''}...`,
                operationLoading: true,
                operationType: 'create_release_cards',
                timestamp: Date.now(),
                fresh: true,
            },
        ];

        const parentPath =
            response.parentPath || `${getDamPath(Store.search.value.path)}/${Store.filters.value.locale || 'en_US'}`;

        const RELEASE_FIELDS_TO_STRIP = [
            'subtitle',
            'badge',
            'prices',
            'description',
            'title',
            'mnemonics',
            'ctas',
            'osi',
            'trialOsi',
        ];
        const results = [];
        for (const cardConfig of cardConfigs) {
            const strippedConfig = { ...cardConfig };
            for (const field of RELEASE_FIELDS_TO_STRIP) delete strippedConfig[field];
            const title = `${productName || this.extractTitle(strippedConfig)} - ${
                strippedConfig.variant?.charAt(0).toUpperCase() + strippedConfig.variant?.slice(1)
            }`;
            try {
                const newFragment = await this.saveDraftToAEM(strippedConfig, {
                    title,
                    parentPath,
                });
                results.push({
                    success: true,
                    card: {
                        id: newFragment.id,
                        title: newFragment.title,
                        path: newFragment.path,
                        variant: cardConfig.variant,
                        fragmentData: newFragment,
                    },
                });
            } catch (error) {
                logError('Failed to create release card', error);
                results.push({
                    success: false,
                    card: { title, variant: cardConfig.variant },
                    error: error.message,
                });
            }
        }

        const successCount = results.filter((r) => r.success).length;
        const operationResult = {
            success: successCount === results.length,
            rawResult: {
                cards: results,
                product: { name: productName },
            },
        };

        this.messages = [
            ...this.messages.slice(0, placeholderIndex),
            {
                role: 'assistant',
                content:
                    response.message ||
                    `Created ${successCount} of ${results.length} release card${results.length !== 1 ? 's' : ''}.`,
                operationType: 'create_release_cards',
                operationResult,
                timestamp: Date.now(),
            },
            ...this.messages.slice(placeholderIndex + 1),
        ];

        if (successCount === results.length) {
            showToast(`Created ${successCount} release card${successCount !== 1 ? 's' : ''}`, 'positive');
        } else {
            showToast(`Created ${successCount} of ${results.length} release cards`, 'negative');
        }
    }

    async openDraftInEditor(fragmentId) {
        try {
            await router.navigateToFragmentEditor(fragmentId);
            showToast('Draft card opened in editor');
        } catch (error) {
            logError('Failed to open draft in editor', error);
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
                    fresh: true,
                },
            ];
        } catch (error) {
            logError('Failed to publish draft', error);
            showToast(`Failed to publish: ${error.message}`, 'negative');
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
                const enrichedConfig = await enrichConfigWithMcsMnemonic(cardConfig, this.selectedReleaseProduct);
                const fragmentData = createFragmentDataForAEM(enrichedConfig, enrichedConfig.variant, {
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
                    fresh: true,
                },
            ];
        } catch (error) {
            logError('Failed to save collection to AEM', error);
            showToast(`Failed to save collection: ${error.message}`, 'negative');
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to save collection: ${error.message}`,
                    timestamp: Date.now(),
                    fresh: true,
                },
            ];
        } finally {
            this.isLoading = false;
        }
    }

    extractTitle(cardConfig) {
        return extractCardTitle(cardConfig);
    }

    capitalize(str) {
        return capitalizeStr(str);
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
                    fresh: true,
                },
            ];

            showToast('Collection created successfully!', 'positive');
        } catch (error) {
            logError('Failed to create collection', error);
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to create collection: ${error.message}`,
                    timestamp: Date.now(),
                    fresh: true,
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
                    fresh: true,
                },
            ];
        }
    }

    async executeOperation(operation) {
        this.isLoading = true;

        const operationType = operation.mcpTool;

        const validation = validateFragmentIds(operationType, operation.mcpParams);
        if (!validation.ok) {
            const content = fragmentIdGuardMessage(validation.invalid);
            this.messages = [...this.messages, { role: 'error', content, timestamp: Date.now(), fresh: true }];
            showToast(content, 'negative');
            this.isLoading = false;
            return;
        }

        const isPreviewOperation = ['preview_bulk_update', 'preview_bulk_publish'].includes(operationType);
        const isBulkOperation = ['bulk_update_cards', 'bulk_publish_cards'].includes(operationType);

        if (isPreviewOperation) {
            await this.executePreviewOperation(operation, operationType);
        } else if (isBulkOperation) {
            await this.executeBulkOperationWithProgress(operation, operationType);
        } else {
            await this.executeRegularOperation(operation, operationType);
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
                    fresh: true,
                },
            ];
        } catch (error) {
            logError('Preview operation error', error);
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to generate preview: ${error.message}`,
                    timestamp: Date.now(),
                    fresh: true,
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
                fresh: true,
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
                fresh: true,
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
            fresh: true,
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
            logError('Bulk operation error', error);
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

    async executeRegularOperation(operation, operationType) {
        const loadingMessage = this.getOperationLoadingMessage(operationType);

        const loadingMessageObj = {
            role: 'assistant',
            content: loadingMessage,
            operationLoading: true,
            operationType,
            timestamp: Date.now(),
            fresh: true,
        };

        this.messages = [...this.messages, loadingMessageObj];

        let operationResult = null;
        const silent = operationType === 'list_products';

        try {
            if (!silent) showToast('Executing operation...', 'info');
            if (operation.type !== 'mcp_operation') {
                throw new Error('Unsupported operation format');
            }
            const { executeStudioOperation } = await import('./services/mcp-client.js');
            operationResult = await executeStudioOperation(operation.mcpTool, operation.mcpParams);

            if (operationResult?.success && !silent) {
                showToast(operationResult.message, 'positive');
            }

            this.messages = this.messages.map((msg) =>
                msg === loadingMessageObj
                    ? {
                          role: 'assistant',
                          content: operationResult.message,
                          operationResult,
                          operationType,
                          operationLoading: false,
                          timestamp: Date.now(),
                      }
                    : msg,
            );
        } catch (error) {
            const isGetCardNotFound = operationType === 'get_card' && /not found|404/i.test(error?.message || '');
            if (isGetCardNotFound) {
                operationResult = {
                    success: true,
                    operation: 'get',
                    fragment: null,
                    message: 'Card not found',
                };
                this.messages = this.messages.map((msg) =>
                    msg === loadingMessageObj
                        ? {
                              role: 'assistant',
                              content: operationResult.message,
                              operationResult,
                              operationType,
                              operationLoading: false,
                              timestamp: Date.now(),
                          }
                        : msg,
                );
            } else {
                logError('Operation execution error', error);
                showToast(error.message || 'Operation failed', 'negative');
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
            }
        }

        if (operationType === 'list_products' && operationResult?.success) {
            this.messages = this.messages.filter((msg) => msg.operationResult !== operationResult);
            await this.continueWithMCPResult('list_products', operationResult.rawResult);
        }

        // After get_offer_by_id or resolve_offer_selector succeed, the release
        // flow resolves the product deterministically: we take the
        // product_arrangement_code from AOS and look it up by exact key in the
        // MCS product cache via get_product_by_arrangement_code. The LLM is
        // not re-involved here — it has hallucinated a different arrangement
        // code in the past, producing the wrong product.
        if (operationType === 'get_offer_by_id' && operationResult?.success) {
            const pa = operationResult.rawResult?.offer?.product_arrangement_code;
            if (pa) {
                this.messages = this.messages.filter((msg) => msg.operationResult !== operationResult);
                await this.resolveReleaseProductByArrangementCode(pa);
            }
        }
        if (operationType === 'resolve_offer_selector' && operationResult?.success) {
            const pa =
                operationResult.rawResult?.selector?.product_arrangement_code ||
                operationResult.rawResult?.offers?.[0]?.product_arrangement_code;
            if (pa) {
                this.messages = this.messages.filter((msg) => msg.operationResult !== operationResult);
                await this.resolveReleaseProductByArrangementCode(pa);
            }
        }
        if (operationType === 'get_product_by_arrangement_code' && operationResult?.success) {
            this.messages = this.messages.filter((msg) => msg.operationResult !== operationResult);
            await this.handleResolvedReleaseProduct(operationResult);
        }
    }

    async resolveReleaseProductByArrangementCode(arrangementCode) {
        await this.executeOperation({
            type: 'mcp_operation',
            mcpTool: 'get_product_by_arrangement_code',
            mcpParams: { arrangementCode },
        });
    }

    async handleResolvedReleaseProduct(operationResult) {
        const product = operationResult.product;
        const arrangementCode = operationResult.arrangementCode;

        if (!product) {
            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `No MCS product found for arrangement code \`${arrangementCode}\`. Pick a different offer or proceed with a minimal card.`,
                    buttonGroup: {
                        label: 'Release Recovery',
                        options: [
                            { label: 'Pick a different offer', value: 'release_pick_different_offer' },
                            { label: 'Cancel release flow', value: 'release_cancel' },
                        ],
                    },
                    timestamp: Date.now(),
                    fresh: true,
                },
            ];
            return;
        }

        const copy = product.copy || {};
        const assets = product.assets || {};
        const productCards = [
            {
                label: copy.name || product.name || arrangementCode,
                value: product.arrangement_code || arrangementCode,
                arrangement_code: product.arrangement_code || arrangementCode,
                product_code: product.product_code,
                icon: assets.icons?.svg || product.icon,
            },
        ];

        this.selectedReleaseProduct = {
            arrangement_code: product.arrangement_code || arrangementCode,
            name: copy.name || product.name || arrangementCode,
            icon: assets.icons?.svg || product.icon,
        };

        this.messages = [
            ...this.messages,
            {
                role: 'assistant',
                content: 'Found your product:',
                productCards,
                productCardsSelectedValue: productCards[0].value,
                timestamp: Date.now(),
                fresh: true,
            },
        ];

        await this.handleSendMessage({
            detail: {
                message: `Selected product: ${productCards[0].label} (arrangement_code: ${productCards[0].arrangement_code})`,
                context: { hidden: true, selectedProduct: this.selectedReleaseProduct },
            },
        });
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

        const toolResultMessage = `[MCS product data retrieved via ${tool}]\n${summary}${products.length > 20 ? `\n...and ${products.length - 20} more` : ''}`;

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
                intentHint: resolveIntentHint(null, this.activeGuidedFlow),
            });

            this.conversationHistory = response.conversationHistory || [];

            if (response.type === 'operation' || response.type === 'mcp_operation') {
                if (response.type === 'mcp_operation' && response.mcpTool === 'search_cards') {
                    this.autoInjectSearchCardsContext(response.mcpParams);
                }
                const requiresConfirmation = shouldRequireConfirmation(response.mcpTool, response.confirmationRequired);
                const messageData = {
                    role: 'assistant',
                    content: response.message,
                    confirmationRequired: requiresConfirmation,
                    timestamp: Date.now(),
                    fresh: true,
                };
                if (response.type === 'mcp_operation') {
                    messageData.mcpOperation = { mcpTool: response.mcpTool, mcpParams: response.mcpParams };
                    messageData.operationType = 'mcp_operation';
                }
                this.messages = [...this.messages, messageData];
                if (!requiresConfirmation) {
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
                const offeringStep = guidedStep.buttonGroup?.label === 'Offering Type';
                const pa = this.selectedReleaseProduct?.arrangement_code || this.selectedReleaseProduct?.arrangementCode;
                const attachOst =
                    offeringStep && pa
                        ? { openOst: true, ostSearchParams: { arrangement_code: pa, mode: 'plans-base-and-trial' } }
                        : {};
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: guidedStep.message,
                        buttonGroup: guidedStep.buttonGroup,
                        productCards: guidedStep.productCards,
                        timestamp: Date.now(),
                        fresh: true,
                        ...attachOst,
                    },
                ];
                // Single-match preview → auto-advance to Step 4.
                {
                    const cards = guidedStep.productCards;
                    const releaseFlowPrompt = this.messages.some(
                        (m) => m.role === 'assistant' && m.content?.includes('Which product is this release for'),
                    );
                    const inReleaseFlow = this.selectedReleaseOffer || this.selectedReleaseOsi || releaseFlowPrompt;
                    if (Array.isArray(cards) && cards.length === 1 && inReleaseFlow) {
                        const only = cards[0];
                        this.selectedReleaseProduct = {
                            arrangement_code: only.arrangement_code || only.value,
                            name: only.label,
                            icon: only.icon,
                        };
                        const lastIndex = this.messages.length - 1;
                        const lastMessage = this.messages[lastIndex];
                        if (lastMessage?.productCards) {
                            this.messages = [
                                ...this.messages.slice(0, lastIndex),
                                { ...lastMessage, productCardsSelectedValue: only.value ?? only.arrangement_code },
                            ];
                        }
                        await this.handleSendMessage({
                            detail: {
                                message: `Selected product: ${only.label} (arrangement_code: ${only.arrangement_code || only.value})`,
                                context: { hidden: true, selectedProduct: this.selectedReleaseProduct },
                            },
                        });
                    }
                }
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
                        fresh: true,
                    },
                ];
            } else if (response.type === 'release_cards') {
                await this.handleReleaseCardsResponse(response);
            } else {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: response.message,
                        type: response.type,
                        timestamp: Date.now(),
                        fresh: true,
                    },
                ];
            }
        } catch (error) {
            logError('Continue with MCP result error', error);
            this.messages = [
                ...this.messages,
                {
                    role: 'error',
                    content: `Failed to process product data: ${error.message}`,
                    timestamp: Date.now(),
                    fresh: true,
                },
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
        return extractKnownSurfaceFromPath(path);
    }

    /**
     * Auto-inject context into a search_cards mcpParams object: the surface
     * from the current path (default acom), the locale from the locale picker,
     * and the backgroundImage query rewrite when the user is asking about
     * cards with images. OSI lookups skip surface injection because the
     * deterministic OSI path doesn't need it.
     *
     * Used by both the direct LLM-response path and the chained
     * continueWithMCPResult path so the second hop in two-step flows
     * (list_products → search_cards) doesn't drop surface.
     */
    autoInjectSearchCardsContext(mcpParams) {
        if (!mcpParams || typeof mcpParams !== 'object') return;
        if (!mcpParams.osi && !mcpParams.surface) {
            const surface =
                this.extractSurfaceFromPath(Store.search?.value?.path) ||
                this.extractSurfaceFromPath(getHashParam('path')) ||
                'acom';
            mcpParams.surface = surface;
            if (mcpParams.locale !== 'all' && !mcpParams.locale) {
                mcpParams.locale = Store.filters?.value?.locale || 'en_US';
            }
        }

        if (mcpParams.query) {
            const query = mcpParams.query.toLowerCase();
            const imagePatterns = [
                /\b(with|has|have|containing|that have)\s+(background\s*)?(image|images|backgroundimage)\b/i,
                /\bbackground\s*image\b/i,
                /\bhas\s+image\b/i,
            ];
            const isImageQuery = imagePatterns.some((pattern) => pattern.test(query));
            if (isImageQuery && !query.includes('backgroundimage:')) {
                mcpParams.query = 'backgroundImage:*';
            }
        }
    }

    async enrichGuidedStepWithRecentProducts(response) {
        return response;
    }

    async recoverProductLookup(searchText) {
        try {
            const result = await fetchProducts({ searchText }).catch(() => ({ products: [] }));
            const products = (result.products || []).map((p) => this.mapProductToChatCard(p));
            if (products.length) {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: `Found ${products.length} product(s) matching "${searchText}". Pick one to continue.`,
                        buttonGroup: {
                            label: 'Product',
                            inputHint: 'Or type a product name to search...',
                        },
                        productCards: products,
                        timestamp: Date.now(),
                        fresh: true,
                    },
                ];
            } else {
                this.messages = [
                    ...this.messages,
                    {
                        role: 'assistant',
                        content: `No products found matching "${searchText}". Please try a different name or check the spelling.`,
                        timestamp: Date.now(),
                        fresh: true,
                    },
                ];
            }
        } catch {
            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    content: `Couldn't look up "${searchText}" right now. Please try again.`,
                    timestamp: Date.now(),
                    fresh: true,
                },
            ];
        }
    }

    async enrichReleaseConfirmationSummary(summary) {
        // Cache for a per-call fetched detail so the fallback block below can
        // reuse it instead of refetching the same arrangement_code.
        let fetchedRaw = null;

        if (!this.selectedReleaseProduct) {
            const arrangementCode = summary?.product?.arrangement_code || summary?.product?.arrangementCode;
            if (arrangementCode) {
                const cached = this.recentReleaseProductsCache.find((p) => (p.arrangement_code || p.value) === arrangementCode);
                if (cached) {
                    this.selectedReleaseProduct = cached;
                } else {
                    try {
                        const detail = await fetchProductDetail(arrangementCode);
                        fetchedRaw = detail?.product || detail;
                        if (fetchedRaw) {
                            this.selectedReleaseProduct = this.mapProductToChatCard(fetchedRaw);
                        }
                    } catch {
                        // best-effort — leave selectedReleaseProduct null
                    }
                }
            }
        }

        let description = this.getPreferredProductDescription(this.selectedReleaseProduct);

        // The bulk product list (ost-products-read) omits description for some products.
        // Fall back to the per-product detail endpoint which always includes full MCS copy.
        if (!description) {
            if (fetchedRaw) {
                description = this.getPreferredProductDescription(fetchedRaw, fetchedRaw.copy);
                if (description && this.selectedReleaseProduct) {
                    this.selectedReleaseProduct = { ...this.selectedReleaseProduct, description };
                }
            } else {
                const arrangementCode =
                    this.selectedReleaseProduct?.arrangement_code ||
                    this.selectedReleaseProduct?.value ||
                    summary?.product?.arrangement_code ||
                    summary?.product?.arrangementCode;
                if (arrangementCode) {
                    try {
                        const detail = await fetchProductDetail(arrangementCode);
                        const raw = detail?.product || detail;
                        if (raw) {
                            description = this.getPreferredProductDescription(raw, raw.copy);
                            if (description && this.selectedReleaseProduct) {
                                this.selectedReleaseProduct = { ...this.selectedReleaseProduct, description };
                            }
                        }
                    } catch {
                        // best-effort
                    }
                }
            }
        }

        const segment = this.getPreferredReleaseSegment(summary);
        return {
            ...summary,
            product: {
                ...(this.selectedReleaseProduct || {}),
                ...(summary?.product || {}),
                description,
            },
            segment,
        };
    }

    isProductSelectionStep(response) {
        return isProductSelectionStepFn(response);
    }

    isSegmentSelectionStep(response) {
        return isSegmentSelectionStepFn(response);
    }

    getAutoSelectedSegmentOption(response, offer) {
        return getAutoSelectedSegmentOptionFn(response, offer);
    }

    async getRecentReleaseProducts() {
        if (!this.recentReleaseProductsPromise) {
            this.recentReleaseProductsPromise = this.loadRecentReleaseProducts()
                .then((products) => {
                    this.recentReleaseProductsCache = products;
                    return products;
                })
                .catch((error) => {
                    logError('Failed to load recent MCS products for AI chat', error);
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
        return mapProductToChatCardFn(product);
    }

    getPreferredProductDescription(...sources) {
        return getPreferredProductDescriptionFn(...sources);
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

        const fragmentIds = extractFragmentIdsFromMessage(lastOp);

        return {
            type: lastOp.operationResult.operation || lastOp.operationType || null,
            fragmentIds,
            count: lastOp.operationResult.count || fragmentIds.length,
            timestamp: lastOp.timestamp,
        };
    }

    getRecentFragments(limit = 10) {
        return this.messages
            .filter((m) => m.operationResult)
            .slice(-3)
            .flatMap((m) => extractFragmentSummariesFromMessage(m, this))
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
                        <p class="chat-disclaimer">
                            AI can make mistakes. Verify results before publishing or making bulk changes.
                        </p>
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
                        ${this.messages
                            .filter((message) => !message.hidden)
                            .map(
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
                                  <div class="typing-indicator-row">
                                      <div class="message-avatar">✦</div>
                                      <div class="typing-indicator">
                                          <div class="typing-dot"></div>
                                          <div class="typing-dot"></div>
                                          <div class="typing-dot"></div>
                                      </div>
                                  </div>
                              `
                            : nothing}
                    </div>
                </div>

                <div class="chat-input">
                    <mas-chat-input @send-message=${this.handleSendMessage} .disabled=${this.isLoading}></mas-chat-input>
                    <p class="chat-disclaimer">
                        AI can make mistakes. Verify results before publishing or making bulk changes.
                    </p>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat', MasChat);
