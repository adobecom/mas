/**
 * AI Chat Action for MAS Studio
 *
 * Adobe I/O Runtime action that handles AI-powered card creation conversations.
 * Uses Anthropic Direct API to generate merch card configurations.
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

/**
 * Get CORS headers for development
 * @returns {Object} - CORS headers
 */
function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        'Access-Control-Allow-Credentials': 'true',
    };
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
                ...getCorsHeaders(),
            },
        };
    }

    if (!(await authorize(params.__ow_headers))) {
        return {
            statusCode: 401,
            headers: {
                ...getCorsHeaders(),
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
                ...getCorsHeaders(),
            },
            body: {
                error: 'Message is required and must be a string',
            },
        };
    }

    try {
        const bedrockClient = new BedrockClient();

        const systemPrompt = determineSystemPrompt(intentHint, conversationHistory, message);

        const response = await bedrockClient.sendWithContext(conversationHistory, message, systemPrompt, context);

        if (!response.success) {
            return {
                statusCode: 500,
                headers: {
                    ...getCorsHeaders(),
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
            return {
                statusCode: 200,
                headers: {
                    ...getCorsHeaders(),
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
                    ...getCorsHeaders(),
                },
                body: {
                    type: 'card',
                    message: parsedResponse.message,
                    cardConfig: parsedResponse.cardConfig,
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
                        ...getCorsHeaders(),
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
                    ...getCorsHeaders(),
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

        return {
            statusCode: 200,
            headers: {
                ...getCorsHeaders(),
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
                ...getCorsHeaders(),
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
 * @returns {string} - System prompt
 */
function determineSystemPrompt(intentHint, conversationHistory, message) {
    if (intentHint === 'documentation') {
        return buildDocumentationPrompt(message);
    }

    if (intentHint === 'collection') {
        return COLLECTION_CREATION_SYSTEM_PROMPT;
    }

    if (intentHint === 'card') {
        return CARD_CREATION_SYSTEM_PROMPT;
    }

    const lowerMessage = message.toLowerCase();

    const documentationKeywords = [
        'what is',
        'how do i',
        'how to',
        'why',
        'where',
        'explain',
        'tell me about',
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
    ];
    const hasDocumentationKeyword = documentationKeywords.some((keyword) => lowerMessage.includes(keyword));

    const cardCreationKeywords = ['create', 'make', 'generate', 'card', 'collection'];
    const hasCardCreationKeyword = cardCreationKeywords.some((keyword) => lowerMessage.includes(keyword));

    if (hasDocumentationKeyword && !hasCardCreationKeyword) {
        return buildDocumentationPrompt(message);
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
        return CARD_CREATION_SYSTEM_PROMPT + '\n\n' + OPERATIONS_SYSTEM_PROMPT;
    }

    if (lowerMessage.includes('collection') || lowerMessage.includes('multiple cards')) {
        return COLLECTION_CREATION_SYSTEM_PROMPT;
    }

    const recentAssistantMessages = conversationHistory
        .filter((msg) => msg.role === 'assistant')
        .slice(-2)
        .map((msg) => msg.content.toLowerCase())
        .join(' ');

    if (recentAssistantMessages.includes('collection')) {
        return COLLECTION_CREATION_SYSTEM_PROMPT;
    }

    return CARD_CREATION_SYSTEM_PROMPT + '\n\n' + OPERATIONS_SYSTEM_PROMPT;
}

export { main };
