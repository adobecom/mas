const { expect } = require('chai');

let buildGuidedTools;
let extractGuidedTool;
let GUIDED_TOOL_CHOICE;

const EXPECTED_TOOL_NAMES = [
    'emit_guided_step',
    'emit_mcp_operation',
    'emit_release_confirmation',
    'emit_release_cards',
    'emit_open_ost',
];

describe('ai-chat/guided-tool-definitions', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/guided-tool-definitions.js');
        buildGuidedTools = mod.buildGuidedTools;
        extractGuidedTool = mod.extractGuidedTool;
        GUIDED_TOOL_CHOICE = mod.GUIDED_TOOL_CHOICE;
    });

    describe('buildGuidedTools', () => {
        it('defines one tool per guided response type', () => {
            const tools = buildGuidedTools();
            expect(tools.map((tool) => tool.name)).to.deep.equal(EXPECTED_TOOL_NAMES);
        });

        it('gives every tool a top-level object input schema with a required message', () => {
            for (const tool of buildGuidedTools()) {
                expect(tool.input_schema.type).to.equal('object');
                expect(tool.input_schema.required).to.include('message');
                expect(tool.description).to.be.a('string').and.to.have.length.greaterThan(0);
            }
        });

        it('requires mcpTool and mcpParams on emit_mcp_operation', () => {
            const operationTool = buildGuidedTools().find((tool) => tool.name === 'emit_mcp_operation');
            expect(operationTool.input_schema.required).to.include.members(['mcpTool', 'mcpParams']);
        });

        it('keeps payload-carrying objects open so downstream validation stays the semantic gate', () => {
            const tools = buildGuidedTools();
            const releaseCards = tools.find((tool) => tool.name === 'emit_release_cards');
            expect(releaseCards.input_schema.properties.cardConfigs.items.additionalProperties).to.equal(true);
            const operation = tools.find((tool) => tool.name === 'emit_mcp_operation');
            expect(operation.input_schema.properties.mcpParams.additionalProperties).to.equal(true);
        });

        it('returns byte-identical definitions on every call for prompt-cache stability', () => {
            expect(buildGuidedTools()).to.deep.equal(buildGuidedTools());
        });
    });

    describe('GUIDED_TOOL_CHOICE', () => {
        it('forces a tool call while letting the model pick the response type', () => {
            expect(GUIDED_TOOL_CHOICE).to.deep.equal({ type: 'any' });
        });
    });

    describe('extractGuidedTool', () => {
        it('maps each guided tool name to its legacy response type', () => {
            const expectations = {
                emit_guided_step: 'guided_step',
                emit_mcp_operation: 'mcp_operation',
                emit_release_confirmation: 'release_confirmation',
                emit_release_cards: 'release_cards',
                emit_open_ost: 'open_ost',
            };
            for (const [name, type] of Object.entries(expectations)) {
                const extracted = extractGuidedTool({
                    success: true,
                    toolUse: { name, input: { message: 'hello' } },
                });
                expect(extracted.type).to.equal(type);
                expect(extracted.message).to.equal('hello');
            }
        });

        it('spreads the tool input and lets the tool name own the type field', () => {
            const extracted = extractGuidedTool({
                success: true,
                toolUse: {
                    name: 'emit_guided_step',
                    input: {
                        type: 'something_else',
                        flowId: 'release',
                        message: 'Select one:',
                        productCards: [{ label: 'CC Pro', value: 'PA-1636', segments: ['INDIVIDUAL', 'TEAM'] }],
                    },
                },
            });
            expect(extracted.type).to.equal('guided_step');
            expect(extracted.flowId).to.equal('release');
            expect(extracted.productCards[0].segments).to.deep.equal(['INDIVIDUAL', 'TEAM']);
        });

        it('returns null for an unknown tool, a missing toolUse, and a failed response', () => {
            expect(
                extractGuidedTool({ success: true, toolUse: { name: 'emit_envelope', input: { intent: 'get_card' } } }),
            ).to.equal(null);
            expect(extractGuidedTool({ success: true, message: 'plain text', toolUse: null })).to.equal(null);
            expect(extractGuidedTool({ success: false, toolUse: { name: 'emit_guided_step', input: {} } })).to.equal(null);
            expect(extractGuidedTool(null)).to.equal(null);
        });
    });
});
