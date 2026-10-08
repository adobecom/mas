/**
 * Native tool definitions for the ai-chat action.
 *
 * The intent registry is the single source of truth for the assistant's
 * surface: the envelope tool schema is generated from it, so adding an
 * intent to the registry automatically extends the tool enum. The model is
 * forced to call this tool every turn (tool_choice), which makes the
 * envelope schema-guaranteed tool arguments instead of regex-parsed JSON.
 */

import { INTENTS, META_INTENTS } from './intent-registry.js';

export const ENVELOPE_TOOL_NAME = 'emit_envelope';
export const SEARCH_TOOL_NAME = 'emit_search';

export const ENVELOPE_TOOL_CHOICE = { type: 'tool', name: ENVELOPE_TOOL_NAME };

/** Offer the envelope + typed search tools and let the model pick one. */
export const ROUTING_TOOL_CHOICE = { type: 'any' };

export function buildEnvelopeTool() {
    // Card search has its own typed tool (emit_search). Keeping search_cards out
    // of the envelope enum forces the model to the typed schema for any card
    // search, so a template or variation type can never land in a freeform slot.
    const intentNames = [...INTENTS.map((intent) => intent.name).filter((name) => name !== 'search_cards'), ...META_INTENTS];
    return {
        name: ENVELOPE_TOOL_NAME,
        description:
            'Return your routing decision for this turn as an intent envelope. Call exactly once per turn. ' +
            'Pick the single registered intent that matches the user request; use ASK_USER for clarifications, ' +
            'answers to questions, and anything that is not an operation. ' +
            'To find, list, show, or count cards or fragments, do NOT use this tool — call emit_search.',
        input_schema: {
            type: 'object',
            properties: {
                intent: {
                    type: 'string',
                    enum: intentNames,
                    description: 'One registered intent or meta intent from the system prompt.',
                },
                slots: {
                    type: 'object',
                    description:
                        'Slot values for the chosen intent, using the exact slot names and value types from the system prompt. ' +
                        'Only include values the user actually provided — never invent slot values. ' +
                        'Example: a title search is slots {"query": "<title text>", "titleSearch": true} — titleSearch is a boolean flag, never the title text.',
                },
                confidence: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Confidence in this routing decision.',
                },
                missing_slots: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Required slots the user has not provided yet.',
                },
                clarification_question: {
                    type: ['string', 'null'],
                    description:
                        'The single specific question to ask when required slots are missing or the request is ambiguous.',
                },
                user_message: {
                    type: ['string', 'null'],
                    description: 'Conversational reply shown to the user — documentation answers, confirmations, help text.',
                },
            },
            required: ['intent', 'slots', 'confidence'],
        },
    };
}

/**
 * Typed card-search tool. The model fills first-class fields (template,
 * variationType, query, tags, surface) instead of a freeform slots object, so
 * it stops dropping a template name or variation type into the free-text query
 * or giving up on a combined filter. Maps to the search_cards operation via
 * extractToolEnvelope.
 */
export function buildSearchTool() {
    return {
        name: SEARCH_TOOL_NAME,
        description:
            'Search the card/fragment catalog. Use for ANY request to find, list, show, or count cards or fragments — ' +
            'always call this tool for such a request; never answer that a filter is unavailable, and never ask the ' +
            'user to clarify just because a filter looks advanced. Fill ONLY the fields the user implies and combine ' +
            'them freely. Never put a template name, variation type, product name, or tag into `query` (query is free ' +
            'text matched against a card title/content only). Examples: ' +
            '"find all plans cards" → {variant:"plans"}; ' +
            '"cards that have grouped variations" → {variationType:"grouped"}; ' +
            '"plans cards with grouped variations" → {variant:"plans", variationType:"grouped"}; ' +
            '"promo variations in ccd" → {variationType:"promo", surface:"ccd"}; ' +
            '"cards titled Acrobat" → {query:"Acrobat", titleSearch:true}; ' +
            '"catalog cards for photoshop" → first list_products "photoshop", then {variant:"catalog", tags:["mas:product_code/<code>"]}.',
        input_schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description:
                        'Free text to match in a card title/content. Omit when the user filters by template, variation, or tag.',
                },
                titleSearch: {
                    type: 'boolean',
                    description: 'true to match `query` against card TITLES specifically (e.g. "cards titled X").',
                },
                variant: {
                    type: 'string',
                    description:
                        'Card TEMPLATE, lowercased canonical name (e.g. "plans", "plans-students", "catalog", "fries", ' +
                        '"ccd-suggested"). The user may call it template, variant, or type. Never pass it as a tag.',
                },
                variationType: {
                    type: 'string',
                    enum: ['all', 'default-locale-only', 'variations-only', 'grouped', 'promo', 'locale-variations'],
                    description:
                        'Filter to cards that HAVE a kind of variation. "grouped"/"pzn"/"personalization" → grouped; ' +
                        '"promo" → promo; "regional"/"locale" → locale-variations. Omit for an ordinary search.',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Canonical mas: tag IDs. Resolve a product name via list_products first — never guess a tag.',
                },
                surface: {
                    type: 'string',
                    description:
                        'A single surface (acom, ccd, commerce, sandbox, adobe-home, express, nala), or "all" to search ' +
                        'every surface the user may access. Omit to use the current surface.',
                },
                surfaces: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                        'A named set of surfaces to search across, e.g. ["acom","ccd"]. Omit unless the user names several.',
                },
                locale: { type: 'string', description: 'Locale like en_US. Omit to use the current locale.' },
                osi: { type: 'string', description: 'An offer selector id, to find the card(s) that reference it.' },
                limit: { type: 'integer', description: 'Max results to return.' },
            },
        },
    };
}
