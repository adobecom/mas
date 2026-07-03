/**
 * Native-envelope resolution for the ai-chat action.
 *
 * When the model is forced to call the emit_envelope tool, the envelope
 * arrives as schema-validated tool arguments instead of JSON embedded in
 * prose. These helpers extract that envelope from a Bedrock response and
 * map a validated envelope onto the response body shape the frontend
 * dispatcher already consumes. The intent registry stays the single source
 * of truth: tool targets and confirmation requirements come from it, never
 * from the model.
 */

import { getIntent, isStateChanging, META_INTENTS } from './intent-registry.js';
import { ENVELOPE_TOOL_NAME } from './tool-definitions.js';
import { normalizeEscapedText } from './response-parser.js';

const GENERIC_CLARIFICATION = 'Could you clarify what you would like me to do?';

export function normalizeEnvelopeText(envelope) {
    if (!envelope) return envelope;
    const normalized = { ...envelope };
    for (const key of ['user_message', 'clarification_question']) {
        if (typeof normalized[key] === 'string') {
            normalized[key] = normalizeEscapedText(normalized[key]);
        }
    }
    return normalized;
}

export function extractToolEnvelope(response) {
    if (!response?.success) return null;
    if (!response.toolUse || response.toolUse.name !== ENVELOPE_TOOL_NAME) return null;
    return response.toolUse.input ?? null;
}

export function buildEnvelopeResponseBody(envelope) {
    const intentDef = getIntent(envelope.intent);
    const isMeta = META_INTENTS.includes(envelope.intent);
    const needsClarification = Boolean(envelope.clarification_question) || (envelope.missing_slots?.length ?? 0) > 0;

    if (!isMeta && intentDef?.tool_target && !needsClarification) {
        return {
            type: 'mcp_operation',
            mcpTool: intentDef.tool_target,
            mcpParams: envelope.slots ?? {},
            message: normalizeEscapedText(envelope.user_message) || '',
            confirmationRequired: isStateChanging(envelope.intent),
        };
    }

    return {
        type: 'message',
        message:
            normalizeEscapedText(envelope.user_message) ||
            normalizeEscapedText(envelope.clarification_question) ||
            GENERIC_CLARIFICATION,
    };
}
