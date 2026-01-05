/**
 * AI Chat Action for MAS Studio
 *
 * Adobe I/O Runtime action that handles AI-powered card creation conversations.
 * Uses AWS Bedrock with Claude Sonnet 4 to generate merch card configurations.
 *
 * Expected parameters:
 * - message: User's message
 * - conversationHistory: Array of previous messages [{role, content}]
 * - context: Optional context (current card being edited, etc.)
 */

import { Ims } from '@adobe/aio-lib-ims';
import { BedrockClient } from './bedrock-client.js';
import { CARD_CREATION_SYSTEM_PROMPT, COLLECTION_CREATION_SYSTEM_PROMPT } from './prompt-templates.js';
import { OPERATIONS_SYSTEM_PROMPT } from './operations-prompt.js';
import { buildDocumentationPrompt } from './docs/documentation-prompt.js';
import { parseAIResponse, validateCardConfig, validateCollectionConfig } from './response-parser.js';
import { handleOperation } from './operations-handler.js';
import { validateAIConfig } from './validation.js';
import { getVariantConfig } from './variant-configs.js';
import { getVariantsForSurface } from './variant-knowledge-builder.js';
import { KnowledgeClient } from './knowledge-client.js';

/**
 * Get response headers for web action
 * Note: CORS headers are handled automatically by OpenWhisk gateway for web actions
 * @returns {Object} - Response headers
 */
function getResponseHeaders() {
    return {
        'Content-Type': 'application/json',
    };
}

/**
 * Extract surface from AEM path
 * @param {string} path - AEM content path (e.g., /content/dam/mas/commerce/...)
 * @returns {string|null} - Surface name (acom, ccd, commerce, adobe-home) or null
 */
function extractSurfaceFromPath(path) {
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
    };

    return surfaceMap[pathSegment] || null;
}

/**
 * Enrich context with surface-specific and locale information
 * @param {Object} context - Original context from frontend
 * @returns {Object} - Enriched context
 */
function enrichContextWithSurface(context) {
    if (!context) return null;

    const enrichedContext = { ...context };

    if (context.currentPath) {
        const surface = extractSurfaceFromPath(context.currentPath);

        if (surface) {
            enrichedContext.surface = surface;
            enrichedContext.suggestedVariants = getVariantsForSurface(surface);
        }
    }

    if (context.currentLocale) {
        enrichedContext.locale = context.currentLocale;
    }

    return enrichedContext;
}

/**
 * Validate Adobe IMS Bearer token
 * @param {Object} headers - Request headers from __ow_headers
 * @returns {Promise<boolean>} - True if token is valid
 */
async function authorize(headers) {
    const authHeader = headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        if (token) {
            const imsValidation = await new Ims('prod').validateToken(token);
            return imsValidation.valid;
        }
    }
    return false;
}

/**
 * Create Knowledge Service client if RAG is enabled
 * @param {Object} params - Action parameters
 * @returns {KnowledgeClient|null} - Knowledge client instance or null
 */
function createKnowledgeClient(params) {
    const { RAG_ENABLED, KNOWLEDGE_SERVICE_URL } = params;

    if (RAG_ENABLED !== 'true') {
        return null;
    }

    try {
        return new KnowledgeClient(KNOWLEDGE_SERVICE_URL);
    } catch (error) {
        console.warn('Failed to create Knowledge client:', error.message);
        return null;
    }
}

/**
 * Enhance system prompt with RAG knowledge if applicable
 * @param {string} systemPrompt - Base system prompt
 * @param {string} message - User message
 * @param {KnowledgeClient|null} knowledgeClient - Knowledge service client
 * @param {boolean} isDocumentation - Whether this is a documentation query
 * @returns {Promise<string>} - Enhanced system prompt
 */
async function enhanceWithRAG(systemPrompt, message, knowledgeClient, isDocumentation) {
    if (!knowledgeClient || !isDocumentation) {
        return systemPrompt;
    }

    try {
        const knowledgeContext = await knowledgeClient.queryAsContext(message, {
            topK: 3,
            minScore: 0.7,
        });

        if (knowledgeContext) {
            console.log('[RAG] Retrieved relevant knowledge for query');
            return `${systemPrompt}\n\n${knowledgeContext}`;
        }
    } catch (error) {
        console.warn('[RAG] Failed to retrieve knowledge:', error.message);
    }

    return systemPrompt;
}

/**
 * Main action handler
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} - Action response
 */
async function main(params) {
    console.log('AI Chat Action called with method:', params.__ow_method);

    if (params.__ow_method?.toLowerCase() === 'options') {
        console.log('Handling OPTIONS preflight request');
        return {
            statusCode: 200,
            headers: {
                ...getResponseHeaders(),
            },
        };
    }

    if (!(await authorize(params.__ow_headers))) {
        return {
            statusCode: 401,
            headers: {
                ...getResponseHeaders(),
            },
            body: {
                error: 'Unauthorized: Bearer token is missing or invalid',
            },
        };
    }

    const { message, conversationHistory = [], context = null, intentHint = null } = params;

    if (!message || typeof message !== 'string') {
        return {
            statusCode: 400,
            headers: {
                ...getResponseHeaders(),
            },
            body: {
                error: 'Message is required and must be a string',
            },
        };
    }

    try {
        const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, BEDROCK_MODEL_ID } = params;

        const bedrockClient = new BedrockClient({
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
            region: AWS_REGION,
            modelId: BEDROCK_MODEL_ID,
        });

        const knowledgeClient = createKnowledgeClient(params);
        const { prompt: basePrompt, isDocumentation } = determineSystemPromptWithMeta(intentHint, conversationHistory, message);
        const systemPrompt = await enhanceWithRAG(basePrompt, message, knowledgeClient, isDocumentation);

        const enrichedContext = enrichContextWithSurface(context);

        console.log('[Backend] ===== ENRICHED CONTEXT SENT TO AI =====');
        console.log('[Backend] Has lastOperation:', !!enrichedContext?.lastOperation);
        if (enrichedContext?.lastOperation) {
            console.log('[Backend] Last operation type:', enrichedContext.lastOperation.type);
            console.log('[Backend] Fragment IDs count:', enrichedContext.lastOperation.fragmentIds?.length || 0);
            console.log('[Backend] Fragment IDs:', enrichedContext.lastOperation.fragmentIds);
        }
        console.log('[Backend] Surface:', enrichedContext?.surface);
        console.log('[Backend] Locale:', enrichedContext?.locale);
        console.log('[Backend] Current path:', enrichedContext?.currentPath);
        console.log('[Backend] Working set size:', enrichedContext?.workingSet?.length || 0);

        const response = await bedrockClient.sendWithContext(conversationHistory, message, systemPrompt, enrichedContext);

        if (!response.success) {
            return {
                statusCode: 500,
                headers: {
                    ...getResponseHeaders(),
                },
                body: {
                    error: 'Failed to get AI response',
                    details: response.error,
                    errorType: response.errorType,
                },
            };
        }

        const operationResult = handleOperation(response.message);

        if (operationResult) {
            if (operationResult.type === 'mcp_operation') {
                if (operationResult.mcpTool === 'studio_search_cards' && enrichedContext) {
                    if (enrichedContext.surface && !operationResult.mcpParams.surface) {
                        operationResult.mcpParams.surface = enrichedContext.surface;
                    }
                    if (enrichedContext.locale && !operationResult.mcpParams.locale) {
                        operationResult.mcpParams.locale = enrichedContext.locale;
                    }
                }

                return {
                    statusCode: 200,
                    headers: {
                        ...getResponseHeaders(),
                    },
                    body: {
                        type: 'mcp_operation',
                        mcpTool: operationResult.mcpTool,
                        mcpParams: operationResult.mcpParams,
                        message: operationResult.message,
                        confirmationRequired: operationResult.confirmationRequired,
                        usage: response.usage,
                        conversationHistory: [
                            ...conversationHistory,
                            { role: 'user', content: message },
                            { role: 'assistant', content: response.message },
                        ],
                    },
                };
            }

            return {
                statusCode: 200,
                headers: {
                    ...getResponseHeaders(),
                },
                body: {
                    ...operationResult,
                    usage: response.usage,
                    conversationHistory: [
                        ...conversationHistory,
                        { role: 'user', content: message },
                        { role: 'assistant', content: response.message },
                    ],
                },
            };
        }

        const parsedResponse = parseAIResponse(response.message);

        if (parsedResponse.type === 'card' && parsedResponse.cardConfig) {
            const variantConfig = getVariantConfig(parsedResponse.cardConfig.variant);
            const validation = validateAIConfig(parsedResponse.cardConfig, variantConfig);

            return {
                statusCode: 200,
                headers: {
                    ...getResponseHeaders(),
                },
                body: {
                    type: 'card',
                    message: parsedResponse.message,
                    cardConfig: parsedResponse.cardConfig,
                    isDocumentation,
                    validation: {
                        valid: validation.valid,
                        errors: validation.errors,
                        warnings: validation.warnings,
                    },
                    usage: response.usage,
                    conversationHistory: [
                        ...conversationHistory,
                        { role: 'user', content: message },
                        { role: 'assistant', content: response.message },
                    ],
                },
            };
        }

        if (parsedResponse.type === 'collection' && parsedResponse.collectionConfig) {
            const collectionValidation = validateCollectionConfig(parsedResponse.collectionConfig);

            if (!collectionValidation.valid) {
                return {
                    statusCode: 200,
                    headers: {
                        ...getResponseHeaders(),
                    },
                    body: {
                        type: 'error',
                        message: collectionValidation.error,
                        usage: response.usage,
                    },
                };
            }

            const cardValidations = parsedResponse.collectionConfig.cards.map((card) => {
                const variantConfig = getVariantConfig(card.variant);
                return validateAIConfig(card, variantConfig);
            });

            return {
                statusCode: 200,
                headers: {
                    ...getResponseHeaders(),
                },
                body: {
                    type: 'collection',
                    message: parsedResponse.message,
                    collectionConfig: parsedResponse.collectionConfig,
                    validation: {
                        valid: cardValidations.every((v) => v.valid),
                        cardValidations,
                    },
                    usage: response.usage,
                    conversationHistory: [
                        ...conversationHistory,
                        { role: 'user', content: message },
                        { role: 'assistant', content: response.message },
                    ],
                },
            };
        }

        if (parsedResponse.type === 'collection-selection') {
            return {
                statusCode: 200,
                headers: {
                    ...getResponseHeaders(),
                },
                body: {
                    type: 'collection-selection',
                    message: parsedResponse.message,
                    usage: response.usage,
                    conversationHistory: [
                        ...conversationHistory,
                        { role: 'user', content: message },
                        { role: 'assistant', content: response.message },
                    ],
                },
            };
        }

        if (parsedResponse.type === 'collection-preview') {
            return {
                statusCode: 200,
                headers: {
                    ...getResponseHeaders(),
                },
                body: {
                    type: 'collection-preview',
                    message: parsedResponse.message,
                    fragmentIds: parsedResponse.fragmentIds,
                    suggestedTitle: parsedResponse.suggestedTitle,
                    usage: response.usage,
                    conversationHistory: [
                        ...conversationHistory,
                        { role: 'user', content: message },
                        { role: 'assistant', content: response.message },
                    ],
                },
            };
        }

        return {
            statusCode: 200,
            headers: {
                ...getResponseHeaders(),
            },
            body: {
                type: 'message',
                message: parsedResponse.message,
                usage: response.usage,
                conversationHistory: [
                    ...conversationHistory,
                    { role: 'user', content: message },
                    { role: 'assistant', content: response.message },
                ],
            },
        };
    } catch (error) {
        console.error('AI Chat Action Error:', error);
        return {
            statusCode: 500,
            headers: {
                ...getResponseHeaders(),
            },
            body: {
                error: 'Internal server error',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
        };
    }
}

/**
 * Determine which system prompt to use based on conversation context
 * @param {string} intentHint - Optional hint ('card', 'collection', or 'documentation')
 * @param {Array} conversationHistory - Previous messages
 * @param {string} message - Current user message
 * @returns {Object} - { prompt: string, isDocumentation: boolean }
 */
function determineSystemPromptWithMeta(intentHint, conversationHistory, message) {
    if (intentHint === 'documentation') {
        return { prompt: buildDocumentationPrompt(message), isDocumentation: true };
    }

    if (intentHint === 'collection') {
        return { prompt: COLLECTION_CREATION_SYSTEM_PROMPT, isDocumentation: false };
    }

    if (intentHint === 'card') {
        return { prompt: CARD_CREATION_SYSTEM_PROMPT, isDocumentation: false };
    }

    const lowerMessage = message.toLowerCase();

    const documentationKeywords = [
        'what is',
        'what are',
        "what's",
        'how do i',
        'how do',
        'how to',
        'how does',
        'why',
        'where',
        'when',
        'which',
        'explain',
        'tell me about',
        'describe',
        'odin',
        'freyja',
        'wcs',
        'aos',
        'setup',
        'install',
        'deploy',
        'error',
        'issue',
        'problem',
        'troubleshoot',
        'debug',
        'support',
        'help',
        'documentation',
        'docs',
        'guide',
        'version',
        'history',
        'restore',
        'variation',
        'locale',
        'regional',
        'inherit',
        'override',
    ];
    const hasDocumentationKeyword = documentationKeywords.some((keyword) => lowerMessage.includes(keyword));

    const isQuestion =
        lowerMessage.trim().endsWith('?') || /^(what|how|why|where|when|which|who|can|does|is|are)\b/i.test(lowerMessage);

    const cardCreationKeywords = ['create', 'make', 'generate'];
    const hasCardCreationKeyword = cardCreationKeywords.some((keyword) => lowerMessage.includes(keyword));

    if ((hasDocumentationKeyword || isQuestion) && !hasCardCreationKeyword) {
        return { prompt: buildDocumentationPrompt(message), isDocumentation: true };
    }

    const operationKeywords = [
        'publish',
        'get',
        'find',
        'search',
        'delete',
        'remove',
        'copy',
        'duplicate',
        'update',
        'show me',
        'fetch',
    ];
    const hasOperationKeyword = operationKeywords.some((keyword) => lowerMessage.includes(keyword));

    if (hasOperationKeyword) {
        return { prompt: `${CARD_CREATION_SYSTEM_PROMPT}\n\n${OPERATIONS_SYSTEM_PROMPT}`, isDocumentation: false };
    }

    if (lowerMessage.includes('collection') || lowerMessage.includes('multiple cards')) {
        return { prompt: COLLECTION_CREATION_SYSTEM_PROMPT, isDocumentation: false };
    }

    const recentAssistantMessages = conversationHistory
        .filter((msg) => msg.role === 'assistant')
        .slice(-2)
        .map((msg) => msg.content.toLowerCase())
        .join(' ');

    if (recentAssistantMessages.includes('collection')) {
        return { prompt: COLLECTION_CREATION_SYSTEM_PROMPT, isDocumentation: false };
    }

    return { prompt: `${CARD_CREATION_SYSTEM_PROMPT}\n\n${OPERATIONS_SYSTEM_PROMPT}`, isDocumentation: false };
}

export { main };
