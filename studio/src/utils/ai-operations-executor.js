/**
 * Destructive-tool gating for MCP operations requested via natural language.
 */

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
