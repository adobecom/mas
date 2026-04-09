/**
 * AI Operations Executor
 *
 * Executes MCP operations requested by the AI through natural language.
 * Runs in the frontend and routes operations to the MCP server via the
 * studio MCP client.
 */

import { showToast } from '../utils.js';
import { executeStudioOperation } from '../services/mcp-client.js';

/**
 * MCP tools that mutate or destroy data and must always be gated behind a
 * user confirmation step. Authorization for these operations must NEVER
 * depend on the model honoring an instruction — the client enforces the
 * gate regardless of what the backend `confirmationRequired` flag says.
 */
export const DESTRUCTIVE_TOOLS = new Set([
    'delete_card',
    'bulk_delete_cards',
    'bulk_publish_cards',
    'bulk_update_cards',
    'unpublish_card',
    'create_release_cards',
]);

/**
 * Returns true if the operation must show a confirmation gate before
 * executing. Combines the backend's signal with the local destructive-tool
 * allowlist so that a missing or false backend flag cannot bypass
 * confirmation for tools that mutate state.
 *
 * @param {string|undefined} toolName - MCP tool name
 * @param {boolean|undefined} backendConfirmationRequired - Backend's flag
 * @returns {boolean} - true if a confirmation gate must be shown
 */
export function shouldRequireConfirmation(toolName, backendConfirmationRequired) {
    if (backendConfirmationRequired) return true;
    if (typeof toolName === 'string' && DESTRUCTIVE_TOOLS.has(toolName)) return true;
    return false;
}

/**
 * Execute operation with error handling and user feedback.
 * Only `mcp_operation` is supported; legacy direct-repository operations
 * have been removed (see audit finding M9).
 *
 * @param {Object} operation - MCP operation from AI ({type: 'mcp_operation', mcpTool, mcpParams})
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @param {Object} [opts] - Options ({silent})
 */
export async function executeOperationWithFeedback(operation, onSuccess, onError, { silent = false } = {}) {
    try {
        if (!silent) showToast('Executing operation...', 'info');

        if (operation.type !== 'mcp_operation') {
            throw new Error('Unsupported operation format');
        }
        const result = await executeStudioOperation(operation.mcpTool, operation.mcpParams);

        if (result.success) {
            if (!silent) showToast(result.message, 'positive');
            if (onSuccess) {
                onSuccess(result);
            }
        }

        return result;
    } catch (error) {
        console.error('Operation execution error:', error);
        const errorMessage = error.message || 'Operation failed';
        showToast(errorMessage, 'negative');

        if (onError) {
            onError(error);
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
