/**
 * Native Anthropic tool definitions for the guided release/card-creation flow.
 *
 * The guided flow historically asked the model to hand-write fenced JSON in
 * prose, which broke whenever catalog copy carried unescaped quotes (the
 * "creative cloud pro" incident). One tool per response type with
 * tool_choice "any" makes Bedrock validate the payload against a schema:
 * the model picks the response type by picking the tool, and malformed JSON
 * becomes structurally impossible. Schemas constrain syntax, not domain —
 * payload-carrying objects stay open (additionalProperties) so the existing
 * downstream validators (handleOperation, validateAIConfig) remain the
 * semantic gate. Rollback: NATIVE_GUIDED=off.
 */

export const GUIDED_TOOL_CHOICE = { type: 'any' };

const GUIDED_TOOL_TYPES = {
    emit_guided_step: 'guided_step',
    emit_mcp_operation: 'mcp_operation',
    emit_release_confirmation: 'release_confirmation',
    emit_release_cards: 'release_cards',
    emit_open_ost: 'open_ost',
};

export function buildGuidedTools() {
    return [
        {
            name: 'emit_guided_step',
            description:
                'Render an interactive guided-flow step: a question with a button group, product preview cards, ' +
                'or a plain flow message. Use this for every step that needs user input and for plain-text replies ' +
                'inside the flow (e.g. "product not found"). When your message presents product matches, ' +
                'productCards is MANDATORY — include one entry per product from the lookup result; a match ' +
                'announcement without productCards leaves the user with nothing to select.',
            input_schema: {
                type: 'object',
                properties: {
                    flowId: {
                        type: 'string',
                        enum: ['release'],
                        description: 'Always "release" — keeps the conversation sticky to the release flow.',
                    },
                    message: { type: 'string', description: 'User-visible text for this step.' },
                    buttonGroup: {
                        type: 'object',
                        properties: {
                            label: { type: 'string' },
                            inputHint: { type: 'string' },
                            options: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        label: { type: 'string' },
                                        value: { type: 'string' },
                                    },
                                    required: ['label', 'value'],
                                    additionalProperties: true,
                                },
                            },
                        },
                        additionalProperties: true,
                    },
                    productCards: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string' },
                                value: { type: 'string' },
                                arrangement_code: { type: 'string' },
                                product_code: { type: 'string' },
                                product_family: { type: 'string' },
                                segments: { type: 'array', items: { type: 'string' } },
                                icon: { type: 'string' },
                            },
                            required: ['label', 'value'],
                            additionalProperties: true,
                        },
                    },
                },
                required: ['flowId', 'message'],
            },
        },
        {
            name: 'emit_mcp_operation',
            description:
                'Run a catalog/offer lookup (list_products, get_offer_by_id, resolve_offer_selector) as part of ' +
                'the flow. The message is shown to the user while the operation runs.',
            input_schema: {
                type: 'object',
                properties: {
                    mcpTool: { type: 'string', description: 'The MCP tool name, e.g. list_products.' },
                    mcpParams: { type: 'object', additionalProperties: true },
                    message: { type: 'string', description: 'Progress text shown while the tool runs.' },
                    confirmationRequired: { type: 'boolean' },
                },
                required: ['mcpTool', 'mcpParams', 'message'],
            },
        },
        {
            name: 'emit_release_confirmation',
            description: 'Present the confirmation summary of all release selections before card generation.',
            input_schema: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    confirmationSummary: {
                        type: 'object',
                        properties: {
                            product: { type: 'object', additionalProperties: true },
                            variant: { type: ['string', 'null'] },
                            offeringType: { type: 'object', additionalProperties: true },
                            osi: { type: 'string' },
                            trialOsi: { type: ['string', 'null'] },
                            locale: { type: 'string' },
                        },
                        additionalProperties: true,
                    },
                },
                required: ['message', 'confirmationSummary'],
            },
        },
        {
            name: 'emit_release_cards',
            description:
                'Generate the release cards after the user confirms. Emit only variant per card config — the ' +
                'studio injects every other field from MCS and the selected offers.',
            input_schema: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    parentPath: { type: 'string' },
                    cardConfigs: {
                        type: 'array',
                        items: { type: 'object', additionalProperties: true },
                    },
                },
                required: ['message', 'cardConfigs'],
            },
        },
        {
            name: 'emit_open_ost',
            description: 'Open the Offer Selector Tool so the user can pick base and trial offers.',
            input_schema: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    searchParams: { type: 'object', additionalProperties: true },
                },
                required: ['message', 'searchParams'],
            },
        },
    ];
}

/**
 * Convert a guided tool call into the legacy text-path payload shape.
 * The tool name owns the type field; the schema-validated input carries
 * everything else. Returns null when the response is not a guided tool call.
 */
export function extractGuidedTool(response) {
    if (!response?.success || !response.toolUse) return null;
    const type = GUIDED_TOOL_TYPES[response.toolUse.name];
    if (!type) return null;
    const input = response.toolUse.input && typeof response.toolUse.input === 'object' ? response.toolUse.input : {};
    return { ...input, type };
}
