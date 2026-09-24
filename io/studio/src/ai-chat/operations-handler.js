/**
 * AEM Operations Handler (operation format)
 *
 * Detects and validates AEM operations requested by the AI.
 * This runs in Adobe I/O Runtime (serverless) and returns operation
 * instructions that the frontend will execute via operations service.
 *
 * Note: This handler does NOT execute operations. It only validates
 * and formats them for execution in the frontend.
 */

import { getIntent, isStateChanging, INTENTS, SLOT_VALIDATORS } from './intent-registry.js';

/**
 * operation allowlist, derived from the intent registry so the two can never
 * drift — every registered tool_target is a valid prose-path operation.
 */
const VALID_OPERATIONS = new Set(INTENTS.map((intent) => intent.tool_target).filter(Boolean));

const MAX_RESPONSE_LENGTH = 64 * 1024;

/**
 * Tools that must always be confirmed but have no registry intent entry
 * (they are created through guided flows rather than direct envelopes).
 */
const FORCED_CONFIRMATION_TOOLS = new Set(['create_release_cards']);

/**
 * Confirmation is a server decision derived from the intent registry —
 * never trust the model-emitted confirmationRequired flag to opt out.
 */
function requiresServerConfirmation(operationName) {
    return FORCED_CONFIRMATION_TOOLS.has(operationName) || isStateChanging(operationName);
}

function validateParamValues(operationName, operationParams) {
    const registered = getIntent(operationName);
    if (!registered) return { valid: true };
    for (const [param, value] of Object.entries(operationParams)) {
        const validator = SLOT_VALIDATORS[registered.slot_validators?.[param]];
        if (validator && value != null && !validator(value)) {
            return { valid: false, error: `Invalid value for operationParams.${param}` };
        }
    }
    return { valid: true };
}

/**
 * Walk brace depth from `startIdx` (which must point at a `{`) and return the
 * substring that ends at the matching `}`, respecting string literals and
 * escapes. Returns null if the braces never balance.
 * Shared with response-parser.js so both parsers extract JSON the same way.
 */
export function extractBalancedObject(text, startIdx) {
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
 * Parse an operation request from an AI response.
 * Returns the parsed operation object or null if no operation is detected.
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
        operationData = findJSONObject(responseText, (obj) => obj?.type === 'studio_operation');
    }

    return operationData?.type === 'studio_operation' ? operationData : null;
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
            if (parsed && parsed.type === 'studio_operation') {
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
 * Validate an operation request from the AI.
 * Legacy operation formats are no longer supported (audit M9).
 *
 * @param {Object} operation - Operation object from AI
 * @returns {Object} - {valid: boolean, error?: string}
 */
export function validateOperation(operation) {
    if (!operation) {
        return { valid: false, error: 'No operation provided' };
    }
    if (operation.type !== 'studio_operation') {
        return { valid: false, error: 'Only studio_operation format is supported' };
    }
    return validateStudioOperation(operation);
}

/**
 * Common LLM-hallucinated tool aliases. These map alternate phrasings the
 * model occasionally emits — usually echoing the user's vocabulary
 * ("fragments" vs "cards") — onto the canonical operation name. Keeps the
 * UX flowing instead of returning "Invalid operation: ..." errors.
 */
const TOOL_NAME_ALIASES = {
    search_fragments: 'search_cards',
    find_cards: 'search_cards',
    find_fragments: 'search_cards',
    list_cards: 'search_cards',
    list_fragments: 'search_cards',
    get_fragment: 'get_card',
    publish_fragment: 'publish_card',
    update_fragment: 'update_card',
    copy_fragment: 'copy_card',
};

/**
 * Normalize operation name by stripping the 'studio_' prefix if present and
 * applying common aliases for LLM hallucinations.
 * @param {string} toolName - Original tool name
 * @returns {string} - Normalized tool name
 */
function normalizeOperationName(toolName) {
    if (!toolName) return toolName;
    let normalized = toolName.startsWith('studio_') ? toolName.slice(7) : toolName;
    if (TOOL_NAME_ALIASES[normalized]) {
        normalized = TOOL_NAME_ALIASES[normalized];
    }
    return normalized;
}

/**
 * Validate operation format
 * @private
 */
function validateStudioOperation(operation) {
    if (!operation.operationName) {
        return { valid: false, error: 'operationName is required for operations' };
    }

    operation.operationName = normalizeOperationName(operation.operationName);

    if (!VALID_OPERATIONS.has(operation.operationName)) {
        return { valid: false, error: `Invalid operation: ${operation.operationName}` };
    }

    if (!operation.operationParams || typeof operation.operationParams !== 'object') {
        return { valid: false, error: 'operationParams object is required for operations' };
    }

    switch (operation.operationName) {
        case 'publish_card':
        case 'get_card':
        case 'copy_card':
        case 'update_card':
            if (!operation.operationParams.id) {
                return { valid: false, error: `${operation.operationName} requires operationParams.id` };
            }
            break;

        case 'search_cards':
            if (!operation.operationParams.surface && !operation.operationParams.osi && !operation.operationParams.titleSearch) {
                return {
                    valid: false,
                    error:
                        operation.operationParams.query || operation.operationParams.tags?.length
                            ? 'search_cards with query or tags requires a surface. Please navigate to a surface folder (ACOM, CCD, Commerce, Sandbox, etc.) before searching by keyword or title.'
                            : 'search_cards requires either operationParams.surface or operationParams.osi',
                };
            }
            break;

        case 'get_variations':
            if (!operation.operationParams.id) {
                return { valid: false, error: 'get_variations requires operationParams.id' };
            }
            break;

        case 'resolve_offer_selector':
            if (!operation.operationParams.offerSelectorId) {
                return { valid: false, error: 'resolve_offer_selector requires operationParams.offerSelectorId' };
            }
            break;

        case 'get_offer_by_id':
            if (!operation.operationParams.offerId) {
                return { valid: false, error: 'get_offer_by_id requires operationParams.offerId' };
            }
            break;

        case 'search_offers':
            break;

        case 'list_products':
            break;

        case 'get_product_by_arrangement_code':
            if (!operation.operationParams.arrangementCode) {
                return {
                    valid: false,
                    error: 'get_product_by_arrangement_code requires operationParams.arrangementCode',
                };
            }
            break;

        case 'create_release_cards':
            if (!operation.operationParams.arrangement_code) {
                return { valid: false, error: 'create_release_cards requires operationParams.arrangement_code' };
            }
            if (!Array.isArray(operation.operationParams.variants) || operation.operationParams.variants.length === 0) {
                return { valid: false, error: 'create_release_cards requires operationParams.variants array' };
            }
            if (!operation.operationParams.parentPath) {
                return { valid: false, error: 'create_release_cards requires operationParams.parentPath' };
            }
            break;

        case 'create_tags':
            if (!operation.operationParams.tags || !Array.isArray(operation.operationParams.tags)) {
                return { valid: false, error: 'create_tags requires operationParams.tags array' };
            }
            break;

        case 'create_offer_selector':
            if (!operation.operationParams.productArrangementCode) {
                return { valid: false, error: 'create_offer_selector requires operationParams.productArrangementCode' };
            }
            break;

        // The bulk tools that used to share this arm are gone. list_context_cards
        // is the one surviving operation that takes an id array, and it needs the
        // same check: an absent or empty array renders nothing and reads as a bug.
        case 'list_context_cards':
            if (!operation.operationParams.fragmentIds || !Array.isArray(operation.operationParams.fragmentIds)) {
                return { valid: false, error: `${operation.operationName} requires operationParams.fragmentIds array` };
            }
            if (operation.operationParams.fragmentIds.length === 0) {
                return { valid: false, error: `${operation.operationName} requires at least one fragment ID` };
            }
            break;
    }

    return validateParamValues(operation.operationName, operation.operationParams);
}

/**
 * Process operation request
 * This prepares the operation for frontend execution
 * @param {Object} operation - Parsed operation
 * @param {string} message - AI message
 * @returns {Object} - Operation response
 */
function processOperation(operation, message) {
    const validation = validateOperation(operation);

    if (!validation.valid) {
        return {
            type: 'error',
            message: `Operation validation failed: ${validation.error}`,
        };
    }

    return {
        type: 'studio_operation',
        // A guided flow labels its turns so the client can tell a release
        // lookup from an ordinary one. Rebuilding the operation from a fixed
        // field list used to drop it here, and a free-text start never marks
        // the conversation as a release any other way, so the lookup was
        // dispatched as ordinary and the products were rendered twice.
        ...(operation.flowId ? { flowId: operation.flowId } : {}),
        operationName: operation.operationName,
        operationParams: operation.operationParams,
        message: message || operation.message || `Executing ${operation.operationName} operation...`,
        confirmationRequired: requiresServerConfirmation(operation.operationName) || operation.confirmationRequired || false,
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

    if (enrichedContext && operation.operationName === 'search_cards') {
        if (enrichedContext.surface && !operation.operationParams.surface) {
            operation.operationParams.surface = enrichedContext.surface;
        }
        if (enrichedContext.locale && !operation.operationParams.locale) {
            operation.operationParams.locale = enrichedContext.locale;
        }
    }

    const message = extractOperationMessage(responseText);
    return processOperation(operation, message);
}

/**
 * The product arrangement code the conversation has already settled on.
 *
 * AOS does not filter by offer id, so get_offer_by_id is only a real lookup
 * when it carries the product. The guided prompt asks the model to send it and
 * the model does not reliably do so, which surfaces as "was not in the
 * unfiltered results" on an offer the user just picked. By the time an offer is
 * being resolved the conversation already names the product, so read it from
 * there instead of depending on the model to remember.
 *
 * Scans newest first: a user who changes product mid-flow must not be resolved
 * against the earlier one.
 */
export function resolveArrangementCodeFromHistory(conversationHistory) {
    if (!Array.isArray(conversationHistory)) return null;
    const pattern = /arrangement_code["']?\s*[:=]\s*["']?([A-Za-z0-9_-]+)/i;
    for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
        const content = conversationHistory[i]?.content;
        if (typeof content !== 'string') continue;
        const match = content.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * The product arrangement code the client already holds.
 *
 * OST-first is the one flow the history scan above cannot serve. The user hands
 * over an offer without ever picking a product, so nothing in the conversation
 * names one: working out which product the offer belongs to is the request
 * itself. The scan returns null and the lookup goes out bare.
 *
 * The client knows all along. OST hands the whole offer back and mas-chat-input
 * sends it as context.offer, which carries product_arrangement_code. Read it
 * from there rather than from a transcript that cannot contain it.
 */
export function resolveArrangementCodeFromContext(context) {
    const offer = context?.offer;
    if (!offer) return null;
    const code = offer.product_arrangement_code || offer.arrangementCode || offer.productArrangementCode;
    return typeof code === 'string' && code ? code : null;
}

/**
 * The offer in context only speaks for the offer actually being looked up. A
 * leftover one from an earlier step would otherwise relabel this lookup and
 * filter AOS to the wrong arrangement, which is worse than not filtering.
 */
function contextArrangementCodeFor(context, offerId) {
    const contextOfferId = context?.offer?.offer_id || context?.offer?.id;
    if (offerId && contextOfferId && String(contextOfferId).toUpperCase() !== String(offerId).toUpperCase()) {
        return null;
    }
    return resolveArrangementCodeFromContext(context);
}

/**
 * Fill in the arrangement code for an offer lookup that left it out.
 *
 * The client first, the transcript second: on an OST-first flow the transcript
 * cannot name the product, because resolving the offer to its product is the
 * request. The offer payload carries it either way, and it describes the offer
 * being looked up rather than whatever was mentioned earlier.
 */
export function withResolvedArrangementCode(operation, conversationHistory, context = null) {
    if (operation?.operationName !== 'get_offer_by_id') return operation;
    if (operation.operationParams?.arrangementCode) return operation;
    const arrangementCode =
        contextArrangementCodeFor(context, operation.operationParams?.offerId) ||
        resolveArrangementCodeFromHistory(conversationHistory);
    if (!arrangementCode) return operation;
    return { ...operation, operationParams: { ...operation.operationParams, arrangementCode } };
}
