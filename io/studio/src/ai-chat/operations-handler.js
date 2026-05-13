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

const MAX_RESPONSE_LENGTH = 64 * 1024;

/**
 * Walk brace depth from `startIdx` (which must point at a `{`) and return the
 * substring that ends at the matching `}`, respecting string literals and
 * escapes. Returns null if the braces never balance.
 * @private
 */
function extractBalancedObject(text, startIdx) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = startIdx; i < text.length; i += 1) {
        const ch = text[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (inString) {
            if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
        } else if (ch === '{') {
            depth += 1;
        } else if (ch === '}') {
            depth -= 1;
            if (depth === 0) return text.slice(startIdx, i + 1);
        }
    }
    return null;
}

/**
 * Find a JSON object starting at any `{` in the text whose parsed form
 * satisfies the predicate. Walks each `{` candidate, extracts the balanced
 * object substring, attempts to parse it, and returns the first match.
 * @private
 */
function findJSONObject(text, predicate) {
    let cursor = 0;
    while (cursor < text.length) {
        const braceIdx = text.indexOf('{', cursor);
        if (braceIdx === -1) return null;
        const candidate = extractBalancedObject(text, braceIdx);
        if (!candidate) return null;
        try {
            const parsed = JSON.parse(candidate);
            if (predicate(parsed)) return parsed;
        } catch (error) {
            // not valid JSON at this position; advance and try the next `{`
        }
        cursor = braceIdx + 1;
    }
    return null;
}

/**
 * Parse an MCP operation request from an AI response.
 * Returns the parsed operation object or null if no MCP operation is detected.
 * Legacy `{operation: "publish"}` format is no longer supported (audit M9).
 *
 * @param {string} responseText - AI response text
 * @returns {Object|null}
 */
export function parseOperationRequest(responseText) {
    if (!responseText) return null;
    if (responseText.length > MAX_RESPONSE_LENGTH) return null;

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
        operationData = findJSONObject(responseText, (obj) => obj?.type === 'mcp_operation');
    }

    return operationData?.type === 'mcp_operation' ? operationData : null;
}

/**
 * Extract conversational text from operation response
 * @param {string} responseText - AI response
 * @returns {string} - Message without JSON
 */
export function extractOperationMessage(responseText) {
    if (!responseText) return '';
    if (responseText.length > MAX_RESPONSE_LENGTH) return '';

    let text = responseText.replace(/```json[\s\S]*?```/g, '').trim();

    let cursor = 0;
    while (cursor < text.length) {
        const braceIdx = text.indexOf('{', cursor);
        if (braceIdx === -1) break;
        const candidate = extractBalancedObject(text, braceIdx);
        if (!candidate) break;
        try {
            const parsed = JSON.parse(candidate);
            if (parsed && parsed.type === 'mcp_operation') {
                text = (text.slice(0, braceIdx) + text.slice(braceIdx + candidate.length)).trim();
                continue;
            }
        } catch (error) {
            // not JSON at this position; advance
        }
        cursor = braceIdx + 1;
    }

    return text.trim();
}

/**
 * Validate an MCP operation request from the AI.
 * Legacy operation formats are no longer supported (audit M9).
 *
 * @param {Object} operation - Operation object from AI
 * @returns {Object} - {valid: boolean, error?: string}
 */
export function validateOperation(operation) {
    if (!operation) {
        return { valid: false, error: 'No operation provided' };
    }
    if (operation.type !== 'mcp_operation') {
        return { valid: false, error: 'Only mcp_operation format is supported' };
    }
    return validateMCPOperation(operation);
}

/**
 * Common LLM-hallucinated tool aliases. These map alternate phrasings the
 * model occasionally emits — usually echoing the user's vocabulary
 * ("fragments" vs "cards") — onto the canonical MCP tool name. Keeps the
 * UX flowing instead of returning "Invalid MCP tool: ..." errors.
 */
const TOOL_NAME_ALIASES = {
    search_fragments: 'search_cards',
    find_cards: 'search_cards',
    find_fragments: 'search_cards',
    list_cards: 'search_cards',
    list_fragments: 'search_cards',
    get_fragment: 'get_card',
    publish_fragment: 'publish_card',
    unpublish_fragment: 'unpublish_card',
    update_fragment: 'update_card',
    copy_fragment: 'copy_card',
};

/**
 * Normalize MCP tool name by stripping the 'studio_' prefix if present and
 * applying common aliases for LLM hallucinations.
 * @param {string} toolName - Original tool name
 * @returns {string} - Normalized tool name
 */
function normalizeMCPToolName(toolName) {
    if (!toolName) return toolName;
    let normalized = toolName.startsWith('studio_') ? toolName.slice(7) : toolName;
    if (TOOL_NAME_ALIASES[normalized]) {
        normalized = TOOL_NAME_ALIASES[normalized];
    }
    return normalized;
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
        'copy_card',
        'update_card',
        'bulk_update_cards',
        'bulk_publish_cards',
        'preview_bulk_update',
        'preview_bulk_publish',
        'get_variations',
        'resolve_offer_selector',
        'get_offer_by_id',
        'search_offers',
        'list_products',
        'get_product_by_arrangement_code',
        'create_release_cards',
        'create_tags',
        'create_offer_selector',
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
        case 'copy_card':
        case 'update_card':
            if (!operation.mcpParams.id) {
                return { valid: false, error: `${operation.mcpTool} requires mcpParams.id` };
            }
            break;

        case 'search_cards':
            if (!operation.mcpParams.surface && !operation.mcpParams.osi && !operation.mcpParams.titleSearch) {
                return {
                    valid: false,
                    error:
                        operation.mcpParams.query || operation.mcpParams.tags?.length
                            ? 'search_cards with query or tags requires a surface. Please navigate to a surface folder (ACOM, CCD, Commerce, Sandbox, etc.) before searching by keyword or title.'
                            : 'search_cards requires either mcpParams.surface or mcpParams.osi',
                };
            }
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

        case 'list_products':
            break;

        case 'get_product_by_arrangement_code':
            if (!operation.mcpParams.arrangementCode) {
                return {
                    valid: false,
                    error: 'get_product_by_arrangement_code requires mcpParams.arrangementCode',
                };
            }
            break;

        case 'create_release_cards':
            if (!operation.mcpParams.arrangement_code) {
                return { valid: false, error: 'create_release_cards requires mcpParams.arrangement_code' };
            }
            if (!Array.isArray(operation.mcpParams.variants) || operation.mcpParams.variants.length === 0) {
                return { valid: false, error: 'create_release_cards requires mcpParams.variants array' };
            }
            if (!operation.mcpParams.parentPath) {
                return { valid: false, error: 'create_release_cards requires mcpParams.parentPath' };
            }
            break;

        case 'create_tags':
            if (!operation.mcpParams.tags || !Array.isArray(operation.mcpParams.tags)) {
                return { valid: false, error: 'create_tags requires mcpParams.tags array' };
            }
            break;

        case 'create_offer_selector':
            if (!operation.mcpParams.productArrangementCode) {
                return { valid: false, error: 'create_offer_selector requires mcpParams.productArrangementCode' };
            }
            break;

        case 'bulk_update_cards':
        case 'bulk_publish_cards':
        case 'preview_bulk_update':
        case 'preview_bulk_publish':
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
        type: 'mcp_operation',
        mcpTool: operation.mcpTool,
        mcpParams: operation.mcpParams,
        message: message || operation.message || `Executing ${operation.mcpTool} operation...`,
        confirmationRequired: operation.confirmationRequired || false,
    };
}

/**
 * Main handler - detects and processes operations from AI response
 * @param {string} responseText - AI response
 * @param {Object} [enrichedContext] - Optional context for surface/locale injection before validation
 * @returns {Object|null} - Processed operation or null if not an operation
 */
export function handleOperation(responseText, enrichedContext) {
    const operation = parseOperationRequest(responseText);

    if (!operation) {
        return null;
    }

    if (enrichedContext && operation.mcpTool === 'search_cards') {
        if (enrichedContext.surface && !operation.mcpParams.surface) {
            operation.mcpParams.surface = enrichedContext.surface;
        }
        if (enrichedContext.locale && !operation.mcpParams.locale) {
            operation.mcpParams.locale = enrichedContext.locale;
        }
    }

    const message = extractOperationMessage(responseText);
    return processOperation(operation, message);
}
