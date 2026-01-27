/**
 * MCP Client Service
 *
 * Handles communication with the MAS MCP Server for executing operations.
 * This client sends tool execution requests to the MCP server via HTTP.
 */

import { MCP_SERVER_URL } from '../constants.js';

/**
 * Execute an MCP tool on the MCP server
 * @param {string} toolName - Name of the MCP tool (e.g., 'publish_card')
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

        const endpoint = `${MCP_SERVER_URL}/tools/${toolName}`;

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
 * Execute studio operation with progress tracking
 * Polls for job status updates and calls progress callback
 * @param {string} mcpTool - MCP tool name (must be a bulk operation)
 * @param {Object} mcpParams - MCP tool parameters
 * @param {Function} onProgress - Callback function called with progress updates
 * @param {number} pollInterval - Poll interval in milliseconds (default: 1500)
 * @returns {Promise<Object>} - Final operation result
 */
export async function executeStudioOperationWithProgress(mcpTool, mcpParams, onProgress, pollInterval = 1500) {
    const initialResult = await executeMCPTool(mcpTool, mcpParams);

    if (!initialResult.jobId) {
        console.warn('[MCP Client] No jobId in response, returning result directly');
        return initialResult;
    }

    const { jobId } = initialResult;
    console.log('[MCP Client] Started job:', jobId, 'polling every', pollInterval, 'ms');

    return new Promise((resolve, reject) => {
        const poll = setInterval(async () => {
            try {
                const statusResult = await executeMCPTool('get_job_status', { jobId });
                console.log('[MCP Client] Job status:', statusResult.status, statusResult.completed, '/', statusResult.total);

                if (onProgress) {
                    onProgress(statusResult);
                }

                if (statusResult.status === 'completed') {
                    clearInterval(poll);
                    const finalResult = {
                        success: true,
                        operation: statusResult.type,
                        total: statusResult.total,
                        successCount: statusResult.successCount,
                        failureCount: statusResult.failureCount,
                        successful: statusResult.successful,
                        failed: statusResult.failed,
                        skipped: statusResult.skipped,
                        skippedCount: statusResult.skippedCount,
                        message:
                            statusResult.message ||
                            `✓ Completed ${statusResult.successCount} of ${statusResult.total} operations`,
                        updatedCards: statusResult.updatedCards || [],
                        previewLimit: statusResult.previewLimit || 0,
                    };
                    resolve(finalResult);
                } else if (statusResult.status === 'failed') {
                    clearInterval(poll);
                    reject(new Error(statusResult.error || 'Job failed'));
                }
            } catch (error) {
                clearInterval(poll);
                console.error('[MCP Client] Polling error:', error);
                reject(error);
            }
        }, pollInterval);
    });
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
        case 'publish_card':
            return {
                success: true,
                operation: 'publish',
                fragmentId: result.id,
                fragmentTitle: result.title,
                fragmentPath: result.path,
                message: `✓ "${result.title}" has been published to production.`,
                deepLink: result.deepLink,
            };

        case 'unpublish_card':
            return {
                success: true,
                operation: 'unpublish',
                fragmentId: result.id,
                fragmentTitle: result.title,
                fragmentPath: result.path,
                message: `✓ "${result.title}" has been unpublished.`,
                deepLink: result.deepLink,
            };

        case 'get_card':
            return {
                success: true,
                operation: 'get',
                fragment: result.card,
                message: `Found "${result.card.title}"`,
                deepLink: result.deepLink,
            };

        case 'search_cards': {
            const cards = result.results || result.cards || [];
            return {
                success: true,
                operation: 'search',
                results: cards,
                count: cards.length,
                message: `Found ${cards.length} card${cards.length !== 1 ? 's' : ''}`,
            };
        }

        case 'delete_card':
            return {
                success: true,
                operation: 'delete',
                fragmentId: result.id,
                fragmentTitle: result.title,
                message: `✓ "${result.title}" has been deleted.`,
            };

        case 'copy_card':
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

        case 'update_card':
            return {
                success: true,
                operation: 'update',
                fragmentId: result.id,
                fragmentTitle: result.title,
                updatedFields: Object.keys(mcpParams.updates || {}),
                message: `✓ Updated "${result.title}"`,
                deepLink: result.deepLink,
            };

        case 'bulk_update_cards':
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

        case 'bulk_publish_cards':
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

        case 'bulk_delete_cards':
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

        case 'preview_bulk_update':
            return {
                success: true,
                operation: 'preview_bulk_update',
                previews: result.previews || [],
                summary: result.summary || { willUpdate: 0, noChanges: 0, errors: 0 },
                message: result.message || `Preview: ${result.summary?.willUpdate || 0} cards will be updated`,
            };

        case 'preview_bulk_publish':
            return {
                success: true,
                operation: 'preview_bulk_publish',
                action: result.action,
                previews: result.previews || [],
                summary: result.summary || { willChange: 0, alreadyInState: 0, errors: 0 },
                message: result.message || `Preview: ${result.summary?.willChange || 0} cards will be ${result.action}ed`,
            };

        case 'preview_bulk_delete':
            return {
                success: true,
                operation: 'preview_bulk_delete',
                previews: result.previews || [],
                summary: result.summary || { willDelete: 0, notFound: 0, errors: 0 },
                message: result.message || `Preview: ${result.summary?.willDelete || 0} cards will be deleted`,
            };

        case 'get_variations':
            return {
                success: true,
                operation: 'get_variations',
                parent: result.parent,
                variations: result.variations || [],
                count: result.count || 0,
                isVariation: result.isVariation,
                fragment: result.fragment,
                message: result.message,
            };

        case 'resolve_offer_selector':
            return {
                success: true,
                operation: 'resolve_offer_selector',
                offerSelectorId: result.offerSelectorId,
                offers: result.offers || [],
                checkoutUrl: result.checkoutUrl,
                studioLinks: result.studioLinks,
            };

        case 'list_context_cards': {
            const cards = result.results || [];
            return {
                success: true,
                operation: 'search',
                results: cards,
                count: cards.length,
                message: result.message || `Showing ${cards.length} card${cards.length !== 1 ? 's' : ''}`,
            };
        }

        default:
            return {
                success: true,
                operation: 'unknown',
                message: 'Operation completed',
                rawResult: result,
            };
    }
}
