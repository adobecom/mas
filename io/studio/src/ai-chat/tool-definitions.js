/**
 * Native Anthropic tool definitions for the ai-chat action.
 *
 * The intent registry is the single source of truth for the assistant's
 * surface: the envelope tool schema is generated from it, so adding an
 * intent to the registry automatically extends the tool enum. The model is
 * forced to call this tool every turn (tool_choice), which makes the
 * envelope schema-guaranteed tool arguments instead of regex-parsed JSON.
 */

import { INTENTS, META_INTENTS } from './intent-registry.js';

export const ENVELOPE_TOOL_NAME = 'emit_envelope';

export const ENVELOPE_TOOL_CHOICE = { type: 'tool', name: ENVELOPE_TOOL_NAME };

export function buildEnvelopeTool() {
    const intentNames = [...INTENTS.map((intent) => intent.name), ...META_INTENTS];
    return {
        name: ENVELOPE_TOOL_NAME,
        description:
            'Return your routing decision for this turn as an intent envelope. Call exactly once per turn. ' +
            'Pick the single registered intent that matches the user request; use ASK_USER for clarifications, ' +
            'answers to questions, and anything that is not an operation.',
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
