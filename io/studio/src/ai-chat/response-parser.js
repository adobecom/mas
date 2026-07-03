/**
 * AI Response Parser
 *
 * Parses Claude's responses to extract structured card configurations
 * and handles conversational responses.
 */

import { extractBalancedObject } from './operations-handler.js';

const PARSE_ERROR_MESSAGE = 'I had trouble formatting that response. Please try asking again.';

const UNRECOGNIZED_RESPONSE_MESSAGE = "I couldn't turn that into an action. Could you rephrase your request?";

const CARD_HINT_KEYS = ['variant', 'title', 'fields', 'size'];

/**
 * JSON strings must not contain raw newlines, carriage returns, or tabs.
 * Claude occasionally emits JSON with literal newlines inside the "message"
 * field, which makes JSON.parse throw. Walk the candidate once, escape
 * raw control chars that appear INSIDE double-quoted string literals, and
 * leave whitespace between tokens untouched.
 */
function normalizeJsonString(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < raw.length; i += 1) {
        const ch = raw[i];
        if (inString) {
            if (escaped) {
                out += ch;
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                out += ch;
                escaped = true;
                continue;
            }
            if (ch === '"') {
                out += ch;
                inString = false;
                continue;
            }
            if (ch === '\n') {
                out += '\\n';
                continue;
            }
            if (ch === '\r') {
                out += '\\r';
                continue;
            }
            if (ch === '\t') {
                out += '\\t';
                continue;
            }
            out += ch;
        } else {
            out += ch;
            if (ch === '"') inString = true;
        }
    }
    return out;
}

/**
 * The model sometimes double-escapes control characters inside JSON string
 * values (writing \\n in the JSON source), so the parsed string carries a
 * literal backslash-n instead of a newline — often mixed with correctly
 * escaped breaks in the same message. Literal backslash-n is never
 * legitimate content in these user-facing messages, so any occurrence
 * signals double escaping and all escape sequences are unescaped.
 */
export function normalizeEscapedText(text) {
    if (typeof text !== 'string' || !text.includes('\\n')) return text;
    return text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
}

function tryParse(candidate) {
    try {
        return JSON.parse(candidate);
    } catch (e1) {
        try {
            return JSON.parse(normalizeJsonString(candidate));
        } catch (e2) {
            return null;
        }
    }
}

/**
 * Extract JSON from AI response
 * Claude may wrap JSON in markdown code blocks or include explanatory text
 * @param {string} responseText - Raw AI response
 * @returns {Object|null} - Parsed JSON or null if not found
 */
export function extractJSON(responseText) {
    if (!responseText) return null;

    const jsonBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
        const parsed = tryParse(jsonBlockMatch[1]);
        if (parsed) return parsed;
        console.error('Failed to parse JSON from code block');
    }

    let cursor = 0;
    while (cursor < responseText.length) {
        const braceIdx = responseText.indexOf('{', cursor);
        if (braceIdx === -1) return null;
        const candidate = extractBalancedObject(responseText, braceIdx);
        if (!candidate) return null;
        const parsed = tryParse(candidate);
        if (parsed && typeof parsed === 'object') return parsed;
        cursor = braceIdx + 1;
    }

    return null;
}

/**
 * Extract conversational text from AI response
 * Returns text before/after JSON, cleaned up
 * @param {string} responseText - Raw AI response
 * @returns {string} - Conversational text
 */
export function extractConversationalText(responseText) {
    if (!responseText) return '';

    let text = responseText.replace(/```json[\s\S]*?```/g, '').trim();

    let cursor = 0;
    while (cursor < text.length) {
        const braceIdx = text.indexOf('{', cursor);
        if (braceIdx === -1) break;
        const candidate = extractBalancedObject(text, braceIdx);
        if (candidate && tryParse(candidate)) {
            text = text.slice(0, braceIdx) + text.slice(braceIdx + candidate.length);
            cursor = braceIdx;
        } else {
            cursor = braceIdx + 1;
        }
    }

    return text.trim();
}

/**
 * Detect responses that attempted to emit JSON but failed to parse —
 * a code fence with an opening brace, or a bare object with key/value shape.
 * Used to avoid echoing broken JSON back to the user.
 */
function looksLikeAttemptedJson(responseText) {
    if (/```(?:json)?/.test(responseText) && responseText.includes('{')) return true;
    return /\{\s*"[^"]+"\s*:/.test(responseText);
}

/**
 * Parse AI response into structured format
 * @param {string} responseText - Raw AI response from Claude
 * @returns {Object} - {type, message, cardConfig, collectionConfig, fragmentIds}
 */
export function parseAIResponse(responseText) {
    const cardConfig = extractJSON(responseText);
    const conversationalText = extractConversationalText(responseText);

    if (typeof cardConfig?.message === 'string') {
        cardConfig.message = normalizeEscapedText(cardConfig.message);
    }

    if (cardConfig) {
        if (cardConfig.type === 'collection-selection') {
            return {
                type: 'collection-selection',
                message:
                    conversationalText ||
                    cardConfig.message ||
                    "I'll help you create a collection. Click the button below to select cards from your existing cards.",
            };
        }

        if (cardConfig.type === 'collection-preview') {
            return {
                type: 'collection-preview',
                message: conversationalText || cardConfig.message || 'Preview collection',
                fragmentIds: cardConfig.fragmentIds || [],
                suggestedTitle: cardConfig.suggestedTitle || null,
            };
        }

        if (cardConfig.type === 'collection') {
            return {
                type: 'collection',
                message: conversationalText || "Here's your collection:",
                collectionConfig: cardConfig,
            };
        }

        if (cardConfig.type === 'guided_step') {
            return {
                type: 'guided_step',
                message: conversationalText || cardConfig.message || 'Please make a selection:',
                buttonGroup: cardConfig.buttonGroup || null,
                productCards: cardConfig.productCards || null,
            };
        }

        if (cardConfig.type === 'release_confirmation') {
            return {
                type: 'release_confirmation',
                message: conversationalText || cardConfig.message || "Here's what I'll create:",
                confirmationSummary: cardConfig.confirmationSummary || null,
            };
        }

        if (cardConfig.type === 'release_cards') {
            return {
                type: 'release_cards',
                message: conversationalText || cardConfig.message || 'Creating release cards...',
                parentPath: cardConfig.parentPath || null,
                cardConfigs: Array.isArray(cardConfig.cardConfigs) ? cardConfig.cardConfigs : [],
            };
        }

        if (cardConfig.type === 'open_ost') {
            return {
                type: 'open_ost',
                message: conversationalText || cardConfig.message || 'Opening the Offer Selector Tool...',
                searchParams: cardConfig.searchParams || null,
            };
        }

        if (typeof cardConfig.intent === 'string' && (cardConfig.user_message || cardConfig.clarification_question)) {
            return {
                type: 'message',
                message: normalizeEscapedText(cardConfig.user_message || cardConfig.clarification_question),
            };
        }

        if (CARD_HINT_KEYS.some((key) => cardConfig[key] !== undefined)) {
            return {
                type: 'card',
                message: conversationalText || "Here's your card:",
                cardConfig,
            };
        }

        return {
            type: 'message',
            message: conversationalText || cardConfig.message || UNRECOGNIZED_RESPONSE_MESSAGE,
        };
    }

    if (looksLikeAttemptedJson(responseText)) {
        console.error('AI response contained unparseable JSON:', responseText.slice(0, 500));
        return {
            type: 'message',
            message: PARSE_ERROR_MESSAGE,
            parseError: true,
        };
    }

    return {
        type: 'message',
        message: responseText,
    };
}

/**
 * Validate that card config has required structure
 * @param {Object} cardConfig - Parsed card configuration
 * @returns {Object} - {valid: boolean, error?: string}
 */
export function validateCardConfig(cardConfig) {
    if (!cardConfig) {
        return { valid: false, error: 'No card configuration provided' };
    }

    if (!cardConfig.variant) {
        return { valid: false, error: 'Card must specify a variant' };
    }

    if (typeof cardConfig !== 'object') {
        return { valid: false, error: 'Card configuration must be an object' };
    }

    return { valid: true };
}

/**
 * Validate that collection config has required structure
 * @param {Object} collectionConfig - Parsed collection configuration
 * @returns {Object} - {valid: boolean, error?: string}
 */
export function validateCollectionConfig(collectionConfig) {
    if (!collectionConfig) {
        return { valid: false, error: 'No collection configuration provided' };
    }

    if (collectionConfig.type !== 'collection') {
        return { valid: false, error: 'Collection must have type: "collection"' };
    }

    if (!Array.isArray(collectionConfig.cards) || collectionConfig.cards.length === 0) {
        return { valid: false, error: 'Collection must have at least one card' };
    }

    for (const card of collectionConfig.cards) {
        const cardValidation = validateCardConfig(card);
        if (!cardValidation.valid) {
            return { valid: false, error: `Invalid card in collection: ${cardValidation.error}` };
        }
    }

    return { valid: true };
}
