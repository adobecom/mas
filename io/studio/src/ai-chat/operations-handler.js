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
 * Validate MCP operation format
 * @private
 */
function validateMCPOperation(operation) {
    if (!operation.mcpTool) {
        return { valid: false, error: 'mcpTool is required for MCP operations' };
    }

    const validMCPTools = [
        'studio_publish_card',
        'studio_unpublish_card',
        'studio_get_card',
        'studio_search_cards',
        'studio_delete_card',
        'studio_copy_card',
        'studio_update_card',
    ];

    if (!validMCPTools.includes(operation.mcpTool)) {
        return { valid: false, error: `Invalid MCP tool: ${operation.mcpTool}` };
    }

    if (!operation.mcpParams || typeof operation.mcpParams !== 'object') {
        return { valid: false, error: 'mcpParams object is required for MCP operations' };
    }

    switch (operation.mcpTool) {
        case 'studio_publish_card':
        case 'studio_unpublish_card':
        case 'studio_get_card':
        case 'studio_delete_card':
        case 'studio_copy_card':
        case 'studio_update_card':
            if (!operation.mcpParams.id) {
                return { valid: false, error: `${operation.mcpTool} requires mcpParams.id` };
            }
            break;

        case 'studio_search_cards':
            if (!operation.mcpParams.surface) {
                return {
                    valid: false,
                    error: 'studio_search_cards requires mcpParams.surface (commerce, acom, ccd, or adobe-home)',
                };
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
            confirmationRequired: operation.confirmationRequired || operation.mcpTool === 'studio_delete_card',
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
