/**
 * Chat Dispatcher Service
 *
 * Owns response routing, operation execution, and context enrichment.
 * The MasChat UI component delegates orchestration here and only handles rendering.
 */

import { executeStudioOperation, executeStudioOperationWithProgress } from './mcp-client.js';
import { executeOperationWithFeedback } from '../utils/ai-operations-executor.js';
import { saveDraftToAEM } from './aem-operations.js';
import { showToast, extractTitleText } from '../utils.js';
import Store from '../store.js';
import { SURFACE_MAP } from '../constants.js';
import { getHashParam } from '../utils.js';

const PREVIEW_OPERATIONS = new Set(['preview_bulk_update', 'preview_bulk_publish', 'preview_bulk_delete']);
const BULK_OPERATIONS = new Set(['bulk_update_cards', 'bulk_publish_cards', 'bulk_delete_cards']);
const EXECUTION_TOOL_MAP = {
    preview_bulk_update: 'bulk_update_cards',
    preview_bulk_publish: 'bulk_publish_cards',
    preview_bulk_delete: 'bulk_delete_cards',
};

const LOADING_MESSAGES = {
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
};

export function getOperationLoadingMessage(operationType) {
    return LOADING_MESSAGES[operationType] || 'Executing operation...';
}

export function extractSurfaceFromPath(path) {
    if (!path || typeof path !== 'string') return null;

    const pathParts = path.split('/');
    const surfaceIndex = pathParts.indexOf('mas') + 1;

    if (surfaceIndex === 0 || surfaceIndex >= pathParts.length) return null;

    const pathSegment = pathParts[surfaceIndex];
    return SURFACE_MAP[pathSegment] || null;
}

export function extractVariant(fragment) {
    const path = fragment.path || fragment.id;
    const match = path.match(/\/([^/]+)$/);
    return match ? match[1] : 'unknown';
}

export function extractOsi(fragment) {
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

export function getLastOperationResult(messages) {
    const lastOp = messages
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

export function getRecentFragments(messages, limit = 50) {
    return messages
        .filter((m) => m.operationResult?.results)
        .slice(-3)
        .flatMap((m) =>
            m.operationResult.results.map((f) => ({
                id: f.id,
                title: f.title || f.cardTitle,
                variant: extractVariant(f),
                osi: extractOsi(f),
            })),
        )
        .slice(0, limit);
}

export function buildEnrichedContext(context, messages) {
    const currentPath = Store.search?.value?.path || getHashParam('path');
    return {
        ...context,
        currentPath: currentPath ? `/content/dam/mas/${currentPath}` : null,
        currentLocale: Store.filters?.value?.locale || 'en_US',
        lastOperation: getLastOperationResult(messages),
        workingSet: getRecentFragments(messages),
    };
}

export function injectSearchContext(response) {
    if (response.type !== 'mcp_operation' || response.mcpTool !== 'search_cards') return;

    let surface = null;

    if (Store.search?.value?.path) {
        surface = extractSurfaceFromPath(Store.search.value.path);
    }

    if (!surface) {
        const hashPath = getHashParam('path');
        surface = SURFACE_MAP[hashPath] || null;
    }

    if (!surface && Store.folders?.data?.value?.length > 0) {
        const firstFolder = Store.folders.data.value[0];
        surface = extractSurfaceFromPath(firstFolder);
    }

    if (!surface) {
        surface = 'acom';
    }

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

/**
 * Route an AI response to the appropriate handler.
 * Returns message objects to add to the chat.
 * @param {Object} response - Parsed AI response
 * @returns {Object} - { messages: Array, executeOp: Object|null }
 */
export function routeResponse(response) {
    if (response.type === 'operation' || response.type === 'mcp_operation') {
        injectSearchContext(response);

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

        const operationToExecute = response.confirmationRequired
            ? null
            : response.type === 'mcp_operation'
              ? { type: 'mcp_operation', mcpTool: response.mcpTool, mcpParams: response.mcpParams }
              : response.data;

        return { messages: [messageData], executeOp: operationToExecute };
    }

    if (response.type === 'card') {
        return {
            messages: [
                {
                    role: 'assistant',
                    content: response.message,
                    isCreatingDraft: true,
                    validation: response.validation,
                    timestamp: Date.now(),
                },
            ],
            executeOp: null,
            cardConfig: response.cardConfig,
        };
    }

    if (response.type === 'collection') {
        return {
            messages: [
                {
                    role: 'assistant',
                    content: response.message,
                    collectionConfig: response.collectionConfig,
                    validation: response.validation,
                    timestamp: Date.now(),
                },
            ],
            executeOp: null,
        };
    }

    return {
        messages: [
            {
                role: 'assistant',
                content: response.message,
                type: response.type,
                sources: response.sources || [],
                fragmentIds: response.fragmentIds,
                suggestedTitle: response.suggestedTitle,
                timestamp: Date.now(),
            },
        ],
        executeOp: null,
    };
}

/**
 * Create a draft card from AI config and return updated message.
 * @param {Object} cardConfig - AI card configuration
 * @param {Object} originalMessage - The "creating draft" message to replace
 * @returns {Object} - { message, error }
 */
export async function createDraft(cardConfig, originalMessage) {
    try {
        const draftFragment = await saveDraftToAEM(cardConfig);
        showToast(`Draft card "${draftFragment.title}" created`, 'positive');
        return {
            message: {
                role: 'assistant',
                content: originalMessage.content,
                fragmentId: draftFragment.id,
                fragmentPath: draftFragment.path,
                fragmentTitle: draftFragment.title,
                fragmentStatus: draftFragment.status,
                validation: originalMessage.validation,
                timestamp: Date.now(),
            },
        };
    } catch (error) {
        console.error('Failed to create draft:', error);
        showToast(`Failed to create draft: ${error.message}`, 'negative');
        return {
            message: {
                role: 'error',
                content: `Failed to create draft card: ${error.message}. You can try regenerating the card.`,
                timestamp: Date.now(),
            },
        };
    }
}

/**
 * Categorize and execute an operation.
 * @param {Object} operation - Operation to execute
 * @param {Object} callbacks - { onMessages, onUpdateMessage, onProgress }
 */
export async function dispatchOperation(operation, callbacks) {
    const operationType = operation.type === 'mcp_operation' ? operation.mcpTool : operation.operation;

    if (PREVIEW_OPERATIONS.has(operationType)) {
        await executePreview(operation, operationType, callbacks);
    } else if (BULK_OPERATIONS.has(operationType)) {
        await executeBulk(operation, operationType, callbacks);
    } else {
        await executeRegular(operation, operationType, callbacks);
    }
}

async function executePreview(operation, operationType, { onMessages }) {
    try {
        const previewData = await executeStudioOperation(operation.mcpTool, operation.mcpParams);
        onMessages([
            {
                role: 'assistant',
                content: 'Preview generated. Please review the changes and approve or cancel.',
                previewData,
                previewOperation: operationType,
                previewParams: operation.mcpParams,
                timestamp: Date.now(),
            },
        ]);
    } catch (error) {
        console.error('Preview operation error:', error);
        onMessages([
            {
                role: 'error',
                content: `Failed to generate preview: ${error.message}`,
                timestamp: Date.now(),
            },
        ]);
        showToast(`Failed to generate preview: ${error.message}`, 'negative');
    }
}

async function executeBulk(operation, operationType, { onAddLoadingMessage, onUpdateMessage }) {
    const messageId = Date.now();
    const loadingMessage = {
        role: 'assistant',
        content: getOperationLoadingMessage(operationType),
        operationLoading: true,
        operationType,
        progress: { current: 0, total: operation.mcpParams.fragmentIds?.length || 0 },
        timestamp: Date.now(),
        messageId,
    };

    onAddLoadingMessage(loadingMessage);

    try {
        const result = await executeStudioOperationWithProgress(operation.mcpTool, operation.mcpParams, (statusUpdate) => {
            onUpdateMessage(messageId, {
                content: `Processing ${statusUpdate.completed}/${statusUpdate.total} cards...`,
                progress: {
                    current: statusUpdate.completed,
                    total: statusUpdate.total,
                    percentage: statusUpdate.percentage,
                    successful: statusUpdate.successCount,
                    failed: statusUpdate.failureCount,
                },
            });
        });

        onUpdateMessage(messageId, {
            role: 'assistant',
            content: result.message,
            operationResult: result,
            operationType,
            operationLoading: false,
            timestamp: Date.now(),
        });

        showToast(result.message, 'positive');
    } catch (error) {
        console.error('Bulk operation error:', error);
        onUpdateMessage(messageId, {
            role: 'error',
            content: `Operation failed: ${error.message}`,
            operationLoading: false,
            timestamp: Date.now(),
        });
        showToast(error.message, 'negative');
    }
}

async function executeRegular(operation, operationType, { onAddLoadingMessage, onReplaceLoadingMessage }) {
    const loadingMessage = {
        role: 'assistant',
        content: getOperationLoadingMessage(operationType),
        operationLoading: true,
        operationType,
        timestamp: Date.now(),
    };

    onAddLoadingMessage(loadingMessage);

    const repository = document.querySelector('mas-repository');
    await executeOperationWithFeedback(
        operation,
        repository,
        (res) => {
            onReplaceLoadingMessage(loadingMessage, {
                role: 'assistant',
                content: res.message,
                operationResult: res,
                operationType,
                operationLoading: false,
                timestamp: Date.now(),
            });
        },
        (error) => {
            onReplaceLoadingMessage(loadingMessage, {
                role: 'error',
                content: `Operation failed: ${error.message}`,
                operationLoading: false,
                timestamp: Date.now(),
            });
        },
    );
}

/**
 * Resolve a preview approval into an execution operation.
 * @param {string} previewOperation - The preview operation type
 * @param {Object} previewParams - The preview params to reuse
 * @returns {Object|null} - Execution operation or null if unknown
 */
export function resolvePreviewApproval(previewOperation, previewParams) {
    const executionTool = EXECUTION_TOOL_MAP[previewOperation];
    if (!executionTool) return null;

    return {
        type: 'mcp_operation',
        mcpTool: executionTool,
        mcpParams: previewParams,
    };
}
