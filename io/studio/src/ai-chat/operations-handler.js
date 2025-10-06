/**
 * AEM Operations Handler
 *
 * Executes AEM operations requested by the AI.
 * This runs in Adobe I/O Runtime (serverless) so it returns operation
 * instructions that the frontend will execute.
 */

/**
 * Parse operation request from AI response
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
        const jsonMatch = responseText.match(/\{[\s\S]*"operation"\s*:\s*"[^"]+[\s\S]*\}/);
        if (jsonMatch) {
            try {
                operationData = JSON.parse(jsonMatch[0]);
            } catch (error) {
                console.error('Failed to parse operation object:', error);
            }
        }
    }

    if (operationData?.operation) {
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
 * Validate operation request
 * @param {Object} operation - Operation object from AI
 * @returns {Object} - {valid: boolean, error?: string}
 */
export function validateOperation(operation) {
    if (!operation) {
        return { valid: false, error: 'No operation provided' };
    }

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
