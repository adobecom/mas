/**
 * MCP Client Service
 *
 * Handles communication with the MAS MCP Server for executing operations.
 * This client sends tool execution requests to the MCP server via HTTP.
 */

import { MCP_SERVER_URL } from '../constants.js';

/**
 * Map MCP tool name to Runtime action name
 * @param {string} toolName - MCP tool name (e.g., 'studio_publish_card')
 * @returns {string} - Runtime action name (e.g., 'publish-card')
 */
function mapToolNameToActionName(toolName) {
    return toolName.replace('studio_', '').replace(/_/g, '-');
}

/**
 * Execute an MCP tool on the MCP server
 * @param {string} toolName - Name of the MCP tool (e.g., 'studio_publish_card')
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} - Tool execution result
 */
export async function executeMCPTool(toolName, params) {
    console.log('[MCP Client] executeMCPTool called:', toolName, params);
    try {
        const accessToken =
            sessionStorage.getItem('masAccessToken') ??
            window.adobeIMS?.getAccessToken()?.token ??
            window.adobeid?.authorize?.();
        const aemBaseUrl = document.querySelector('meta[name="aem-base-url"]')?.getAttribute('content');

        console.log('[MCP Client] Access token:', accessToken ? 'EXISTS' : 'MISSING');
        console.log('[MCP Client] AEM Base URL:', aemBaseUrl);

        const headers = {
            'Content-Type': 'application/json',
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
            headers['x-gw-ims-org-id'] = '9E1005A551ED61CA0A490D45';
            headers['x-api-key'] = window.adobeIMS?.adobeIdData?.client_id || '';
            console.log('[MCP Client] Added Authorization header');
        } else {
            console.warn('[MCP Client] No access token available!');
        }

        const requestBody = {
            ...params,
            _aemBaseUrl: aemBaseUrl,
        };

        const isLocalhost = window.location.hostname === 'localhost';
        const endpoint = isLocalhost
            ? `${MCP_SERVER_URL}/tools/${toolName}`
            : `${MCP_SERVER_URL}/${mapToolNameToActionName(toolName)}`;

        console.log('[MCP Client] Endpoint:', endpoint);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `MCP server returned ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`MCP tool execution failed (${toolName}):`, error);
        throw new Error(`Failed to execute ${toolName}: ${error.message}`);
    }
}

/**
 * Execute studio operation via MCP
 * Maps MCP tool results to the format expected by the Studio UI
 * @param {string} mcpTool - MCP tool name
 * @param {Object} mcpParams - MCP tool parameters
 * @returns {Promise<Object>} - Standardized operation result
 */
export async function executeStudioOperation(mcpTool, mcpParams) {
    const result = await executeMCPTool(mcpTool, mcpParams);

    switch (mcpTool) {
        case 'studio_publish_card':
            return {
                success: true,
                operation: 'publish',
                fragmentId: result.id,
                fragmentTitle: result.title,
                fragmentPath: result.path,
                message: `✓ "${result.title}" has been published to production.`,
                deepLink: result.deepLink,
            };

        case 'studio_unpublish_card':
            return {
                success: true,
                operation: 'unpublish',
                fragmentId: result.id,
                fragmentTitle: result.title,
                fragmentPath: result.path,
                message: `✓ "${result.title}" has been unpublished.`,
                deepLink: result.deepLink,
            };

        case 'studio_get_card':
            return {
                success: true,
                operation: 'get',
                fragment: result.fragment,
                message: `Found "${result.fragment.title}"`,
                deepLink: result.deepLink,
            };

        case 'studio_search_cards':
            return {
                success: true,
                operation: 'search',
                results: result.results,
                count: result.results.length,
                message: `Found ${result.results.length} card${result.results.length !== 1 ? 's' : ''}`,
            };

        case 'studio_delete_card':
            return {
                success: true,
                operation: 'delete',
                fragmentId: result.id,
                fragmentTitle: result.title,
                message: `✓ "${result.title}" has been deleted.`,
            };

        case 'studio_copy_card':
            return {
                success: true,
                operation: 'copy',
                originalId: mcpParams.id,
                newFragmentId: result.newCard.id,
                newFragmentTitle: result.newCard.title,
                newFragmentPath: result.newCard.path,
                message: `✓ Created copy: "${result.newCard.title}"`,
                deepLink: result.deepLink,
            };

        case 'studio_update_card':
            return {
                success: true,
                operation: 'update',
                fragmentId: result.id,
                fragmentTitle: result.title,
                updatedFields: Object.keys(mcpParams.updates || {}),
                message: `✓ Updated "${result.title}"`,
                deepLink: result.deepLink,
            };

        case 'studio_bulk_update_cards':
            return {
                success: true,
                operation: 'bulk_update',
                total: result.total,
                successCount: result.successCount,
                failureCount: result.failureCount,
                successful: result.successful,
                failed: result.failed,
                message: result.message || `✓ Updated ${result.successCount} of ${result.total} cards`,
            };

        case 'studio_bulk_publish_cards':
            return {
                success: true,
                operation: 'bulk_publish',
                total: result.total,
                successCount: result.successCount,
                failureCount: result.failureCount,
                successful: result.successful,
                failed: result.failed,
                message: result.message || `✓ Published ${result.successCount} of ${result.total} cards`,
            };

        case 'studio_bulk_delete_cards':
            return {
                success: true,
                operation: 'bulk_delete',
                total: result.total,
                successCount: result.successCount,
                failureCount: result.failureCount,
                successful: result.successful,
                failed: result.failed,
                message: result.message || `✓ Deleted ${result.successCount} of ${result.total} cards`,
            };

        default:
            return {
                success: true,
                operation: 'unknown',
                message: 'Operation completed',
                rawResult: result,
            };
    }
}
