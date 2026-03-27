/**
 * AI Response Parser
 *
 * Parses Claude's responses to extract structured card configurations
 * and handles conversational responses.
 */

/**
 * Extract JSON from AI response
 * Claude may wrap JSON in markdown code blocks or include explanatory text
 * @param {string} responseText - Raw AI response
 * @returns {Object|null} - Parsed JSON or null if not found
 */
export function extractJSON(responseText) {
    if (!responseText) return null;

    const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
        try {
            return JSON.parse(jsonBlockMatch[1]);
        } catch (error) {
            console.error('Failed to parse JSON from code block:', error);
        }
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

    text = text.replace(/\{[\s\S]*\}/, '').trim();

    return text;
}

/**
 * Parse AI response into structured format
 * @param {string} responseText - Raw AI response from Claude
 * @returns {Object} - {type, message, cardConfig, collectionConfig, fragmentIds}
 */
export function parseAIResponse(responseText) {
    const cardConfig = extractJSON(responseText);
    const conversationalText = extractConversationalText(responseText);

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

        return {
            type: 'card',
            message: conversationalText || "Here's your card:",
            cardConfig,
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
