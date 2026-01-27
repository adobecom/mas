/**
 * AEM Operations Handler (MCP Format)
 *
 * Detects and validates AEM operations requested by the AI.
 * This runs in Adobe I/O Runtime (serverless) and returns MCP operation
 * instructions that the frontend will execute via MCP server.
 *
 * Note: This handler does NOT execute operations. It only validates
 * and formats them for MCP execution in the frontend.
 */

/**
 * Parse operation request from AI response (supports both MCP and legacy formats)
 * @param {string} responseText - AI response text
 * @returns {Object|null} - Operation object or null
 */
export function parseOperationRequest(responseText) {
    if (!responseText) return null;

    const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    let operationData = null;

    if (jsonBlockMatch) {
        try {
            operationData = JSON.parse(jsonBlockMatch[1]);
        } catch (error) {
            console.error('Failed to parse operation JSON:', error);
        }
    }

    if (!operationData) {
        const mcpMatch = responseText.match(/\{[\s\S]*"type"\s*:\s*"mcp_operation"[\s\S]*\}/);
        if (mcpMatch) {
            try {
                operationData = JSON.parse(mcpMatch[0]);
            } catch (error) {
                console.error('Failed to parse MCP operation:', error);
            }
        }
    }

    if (!operationData) {
        const legacyMatch = responseText.match(/\{[\s\S]*"operation"\s*:\s*"[^"]+[\s\S]*\}/);
        if (legacyMatch) {
            try {
                operationData = JSON.parse(legacyMatch[0]);
            } catch (error) {
                console.error('Failed to parse legacy operation:', error);
            }
        }
    }

    if (operationData?.type === 'mcp_operation' || operationData?.operation) {
        return operationData;
    }

    return null;
}

/**
 * Extract conversational text from operation response
 * @param {string} responseText - AI response
 * @returns {string} - Message without JSON
 */
export function extractOperationMessage(responseText) {
    if (!responseText) return '';

    let text = responseText.replace(/```json[\s\S]*?```/g, '').trim();
    text = text.replace(/\{[\s\S]*"operation"\s*:\s*"[^"]+[\s\S]*\}/, '').trim();

    return text;
}

/**
 * Validate operation request (supports both MCP and legacy formats)
 * @param {Object} operation - Operation object from AI
 * @returns {Object} - {valid: boolean, error?: string}
 */
export function validateOperation(operation) {
    if (!operation) {
        return { valid: false, error: 'No operation provided' };
    }

    if (operation.type === 'mcp_operation') {
        return validateMCPOperation(operation);
    }

    return validateLegacyOperation(operation);
}

/**
 * Normalize MCP tool name by stripping the 'studio_' prefix if present
 * @param {string} toolName - Original tool name
 * @returns {string} - Normalized tool name
 */
function normalizeMCPToolName(toolName) {
    if (toolName?.startsWith('studio_')) {
        return toolName.slice(7);
    }
    return toolName;
}

/**
 * Validate MCP operation format
 * @private
 */
function validateMCPOperation(operation) {
    if (!operation.mcpTool) {
        return { valid: false, error: 'mcpTool is required for MCP operations' };
    }

    operation.mcpTool = normalizeMCPToolName(operation.mcpTool);

    const validMCPTools = [
        'publish_card',
        'unpublish_card',
        'get_card',
        'search_cards',
        'delete_card',
        'copy_card',
        'update_card',
        'bulk_update_cards',
        'bulk_publish_cards',
        'bulk_delete_cards',
        'preview_bulk_update',
        'preview_bulk_publish',
        'preview_bulk_delete',
        'get_variations',
        'resolve_offer_selector',
        'get_offer_by_id',
        'search_offers',
    ];

    if (!validMCPTools.includes(operation.mcpTool)) {
        return { valid: false, error: `Invalid MCP tool: ${operation.mcpTool}` };
    }

    if (!operation.mcpParams || typeof operation.mcpParams !== 'object') {
        return { valid: false, error: 'mcpParams object is required for MCP operations' };
    }

    switch (operation.mcpTool) {
        case 'publish_card':
        case 'unpublish_card':
        case 'get_card':
        case 'delete_card':
        case 'copy_card':
        case 'update_card':
            if (!operation.mcpParams.id) {
                return { valid: false, error: `${operation.mcpTool} requires mcpParams.id` };
            }
            break;

        case 'search_cards':
            break;

        case 'get_variations':
            if (!operation.mcpParams.id) {
                return { valid: false, error: 'get_variations requires mcpParams.id' };
            }
            break;

        case 'resolve_offer_selector':
            if (!operation.mcpParams.offerSelectorId) {
                return { valid: false, error: 'resolve_offer_selector requires mcpParams.offerSelectorId' };
            }
            break;

        case 'get_offer_by_id':
            if (!operation.mcpParams.offerId) {
                return { valid: false, error: 'get_offer_by_id requires mcpParams.offerId' };
            }
            break;

        case 'search_offers':
            break;

        case 'bulk_update_cards':
        case 'bulk_publish_cards':
        case 'bulk_delete_cards':
        case 'preview_bulk_update':
        case 'preview_bulk_publish':
        case 'preview_bulk_delete':
            if (!operation.mcpParams.fragmentIds || !Array.isArray(operation.mcpParams.fragmentIds)) {
                return { valid: false, error: `${operation.mcpTool} requires mcpParams.fragmentIds array` };
            }
            if (operation.mcpParams.fragmentIds.length === 0) {
                return { valid: false, error: `${operation.mcpTool} requires at least one fragment ID` };
            }
            break;
    }

    return { valid: true };
}

/**
 * Validate legacy operation format (for backward compatibility)
 * @private
 */
function validateLegacyOperation(operation) {
    if (!operation.operation) {
        return { valid: false, error: 'Operation type is required' };
    }

    const validOperations = ['publish', 'get', 'search', 'delete', 'copy', 'update'];
    if (!validOperations.includes(operation.operation)) {
        return { valid: false, error: `Invalid operation type: ${operation.operation}` };
    }

    switch (operation.operation) {
        case 'publish':
        case 'get':
        case 'delete':
        case 'copy':
            if (!operation.fragmentId) {
                return { valid: false, error: 'fragmentId is required for this operation' };
            }
            break;

        case 'search':
            if (!operation.params) {
                return { valid: false, error: 'params object is required for search operation' };
            }
            break;

        case 'update':
            if (!operation.fragmentId || !operation.updates) {
                return { valid: false, error: 'fragmentId and updates are required for update operation' };
            }
            break;
    }

    return { valid: true };
}

/**
 * Process operation request
 * This prepares the operation for frontend execution
 * @param {Object} operation - Parsed operation
 * @param {string} message - AI message
 * @returns {Object} - Operation response
 */
export function processOperation(operation, message) {
    const validation = validateOperation(operation);

    if (!validation.valid) {
        return {
            type: 'error',
            message: `Operation validation failed: ${validation.error}`,
        };
    }

    if (operation.type === 'mcp_operation') {
        return {
            type: 'mcp_operation',
            mcpTool: operation.mcpTool,
            mcpParams: operation.mcpParams,
            message: message || operation.message || `Executing ${operation.mcpTool} operation...`,
            confirmationRequired: operation.confirmationRequired || operation.mcpTool === 'delete_card',
        };
    }

    return {
        type: 'operation',
        operation: operation.operation,
        data: operation,
        message: message || operation.message || `Executing ${operation.operation} operation...`,
        confirmationRequired: operation.confirmationRequired || operation.operation === 'delete',
    };
}

/**
 * Main handler - detects and processes operations from AI response
 * @param {string} responseText - AI response
 * @returns {Object|null} - Processed operation or null if not an operation
 */
export function handleOperation(responseText) {
    const operation = parseOperationRequest(responseText);

    if (!operation) {
        return null;
    }

    const message = extractOperationMessage(responseText);
    return processOperation(operation, message);
}
