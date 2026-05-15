/**
 * MCP Client Service
 *
 * Handles communication with the MAS MCP Server for executing operations.
 * This client sends tool execution requests to the MCP server via HTTP.
 */

import { MCP_SERVER_URL } from '../mas-chat/config.js';

/**
 * Execute an MCP tool on the MCP server
 * @param {string} toolName - Name of the MCP tool (e.g., 'publish_card')
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} - Tool execution result
 */
export async function executeMCPTool(toolName, params) {
    try {
        const accessToken = sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
        if (typeof accessToken !== 'string' || accessToken.length === 0) {
            throw new Error('Not authenticated: missing IMS access token');
        }
        let aemBaseUrl = document.querySelector('meta[name="aem-base-url"]')?.getAttribute('content');
        if (aemBaseUrl?.includes('localhost')) {
            aemBaseUrl = document.querySelector('meta[name="aem-author-url"]')?.getAttribute('content') || aemBaseUrl;
        }

        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-gw-ims-org-id': window.adobeIMS?.adobeIdData?.imsOrg || '',
            'x-api-key': window.adobeIMS?.adobeIdData?.client_id || '',
        };

        const requestBody = {
            ...params,
            _aemBaseUrl: aemBaseUrl,
        };

        const ACTION_NAME_OVERRIDES = {
            get_variations: 'get-fragment-variations',
        };
        const isLocal = MCP_SERVER_URL.includes('localhost');
        const actionName = ACTION_NAME_OVERRIDES[toolName] ?? toolName.replace(/_/g, '-');
        const endpoint = isLocal ? `${MCP_SERVER_URL}/tools/${toolName}` : `${MCP_SERVER_URL}/${actionName}`;

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
        return initialResult;
    }

    const { jobId } = initialResult;
    const maxDuration = 5 * 60 * 1000;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const poll = async () => {
            if (Date.now() - startTime > maxDuration) {
                reject(new Error(`Job ${jobId} timed out after ${maxDuration / 1000}s`));
                return;
            }
            try {
                const statusResult = await executeMCPTool('get_job_status', { jobId });

                if (onProgress) {
                    onProgress(statusResult);
                }

                if (statusResult.status === 'completed') {
                    resolve({
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
                    });
                } else if (statusResult.status === 'failed') {
                    reject(new Error(statusResult.error || 'Job failed'));
                } else {
                    setTimeout(poll, pollInterval);
                }
            } catch (error) {
                reject(error);
            }
        };
        setTimeout(poll, pollInterval);
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
        case 'publish_card': {
            const id = result.id || result.card?.id || mcpParams.id;
            const title = result.title || result.card?.title || '';
            return {
                success: true,
                operation: 'publish',
                fragmentId: id,
                fragmentTitle: title,
                fragmentPath: result.path || result.card?.path,
                message: title ? `✓ "${title}" has been published to production.` : '✓ Card published to production.',
                deepLink: result.deepLink,
            };
        }

        case 'unpublish_card': {
            const id = result.id || result.card?.id || mcpParams.id;
            const title = result.title || result.card?.title || '';
            return {
                success: true,
                operation: 'unpublish',
                fragmentId: id,
                fragmentTitle: title,
                fragmentPath: result.path || result.card?.path,
                message: title ? `✓ "${title}" has been unpublished.` : '✓ Card unpublished.',
                deepLink: result.deepLink,
            };
        }

        case 'get_card': {
            const fragment = result.card || null;
            const title = fragment?.title || '';
            return {
                success: true,
                operation: 'get',
                fragment,
                message: fragment ? `Found "${title}"` : 'Card not found',
                deepLink: result.deepLink,
            };
        }

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

        case 'copy_card': {
            const newCard = result.newCard || result.card || {};
            const title = newCard.title || '';
            return {
                success: true,
                operation: 'copy',
                originalId: mcpParams.id,
                newFragmentId: newCard.id,
                newFragmentTitle: title,
                newFragmentPath: newCard.path,
                message: title ? `✓ Created copy: "${title}"` : '✓ Card copied.',
                deepLink: result.deepLink,
            };
        }

        case 'update_card': {
            const id = result.id || result.card?.id || mcpParams.id;
            const title = result.title || result.card?.title || '';
            return {
                success: true,
                operation: 'update',
                fragmentId: id,
                fragmentTitle: title,
                updatedFields: Object.keys(mcpParams.updates || {}),
                message: title ? `✓ Updated "${title}"` : '✓ Card updated.',
                deepLink: result.deepLink,
            };
        }

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

        case 'preview_bulk_update':
            return {
                success: true,
                operation: 'preview_bulk_update',
                previews: result.previews || [],
                summary: result.summary || { willUpdate: 0, noChanges: 0, errors: 0 },
                message: result.message || `Preview: ${result.summary?.willUpdate || 0} cards will be updated`,
            };

        case 'preview_bulk_publish': {
            const action = result.action || mcpParams.action || 'publish';
            return {
                success: true,
                operation: 'preview_bulk_publish',
                action,
                previews: result.previews || [],
                summary: result.summary || { willChange: 0, alreadyInState: 0, errors: 0 },
                message: result.message || `Preview: ${result.summary?.willChange || 0} cards will be ${action}ed`,
            };
        }

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

        case 'get_product_by_arrangement_code': {
            const product = result.product || null;
            return {
                success: true,
                operation: 'get_product_by_arrangement_code',
                product,
                arrangementCode: result.arrangementCode || mcpParams.arrangementCode,
                message:
                    result.message || (product ? `Found product for ${mcpParams.arrangementCode}` : 'No MCS product match.'),
                rawResult: result,
            };
        }

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

        case 'search_offers': {
            const offers = Array.isArray(result.offers) ? result.offers : [];
            const filterParts = [];
            if (mcpParams.productArrangementCode) filterParts.push(`product ${mcpParams.productArrangementCode}`);
            if (mcpParams.customerSegment) filterParts.push(mcpParams.customerSegment);
            if (mcpParams.marketSegment) filterParts.push(mcpParams.marketSegment);
            if (mcpParams.offerType) filterParts.push(mcpParams.offerType);
            if (mcpParams.commitment) filterParts.push(mcpParams.commitment);
            if (mcpParams.term) filterParts.push(mcpParams.term);
            const filterDesc = filterParts.length ? ` for ${filterParts.join(' / ')}` : '';
            const fallbackMessage =
                offers.length > 0
                    ? `Found ${offers.length} offer${offers.length !== 1 ? 's' : ''}${filterDesc}`
                    : `No offers found${filterDesc}. Try widening your filters or browse cards in Studio.`;
            return {
                success: true,
                operation: 'search_offers',
                offers,
                count: offers.length,
                studioLinks: result.studioLinks,
                message: result.message || fallbackMessage,
                rawResult: result,
            };
        }

        case 'get_offer_by_id': {
            const offer = result.offer || null;
            return {
                success: true,
                operation: 'get_offer_by_id',
                offer,
                studioLinks: result.studioLinks,
                message: result.message || (offer ? `Found offer ${offer.offerId || mcpParams.offerId}` : 'Offer not found'),
                rawResult: result,
            };
        }

        case 'list_products':
        case 'search_products': {
            const products = Array.isArray(result.products) ? result.products : [];
            return {
                success: true,
                operation: mcpTool,
                products,
                count: products.length,
                message:
                    result.message ||
                    `Found ${products.length} product${products.length !== 1 ? 's' : ''}${products.length === 0 ? ' matching your search' : ''}`,
                rawResult: result,
            };
        }

        default: {
            console.warn(
                `executeStudioOperation: no explicit mapping for MCP tool "${mcpTool}" — using generic wrapper. Add a case to keep the {success, message, results} contract consistent.`,
            );
            let items = Array.isArray(result.results) ? result.results : [];
            if (items.length === 0 && Array.isArray(result.cards)) {
                items = result.cards.map((c) => (c && typeof c === 'object' && c.card ? c.card : c)).filter(Boolean);
            }
            const fallbackMessage =
                result.message ||
                `${mcpTool.replace(/_/g, ' ')} completed${items.length > 0 ? ` — ${items.length} result${items.length !== 1 ? 's' : ''}` : ''}.`;
            return {
                success: true,
                operation: mcpTool,
                message: fallbackMessage,
                results: items,
                count: items.length,
                rawResult: result,
            };
        }
    }
}
