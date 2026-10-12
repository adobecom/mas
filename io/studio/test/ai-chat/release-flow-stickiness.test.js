const { expect } = require('chai');

let buildGuidedTools;
let extractGuidedTool;
let inferGuidedFlowFromHistory;
let GUIDED_CARD_CREATION_TOOL_PROMPT;

const toolNamed = (name) => buildGuidedTools().find((tool) => tool.name === name);

/** The assistant turn as index.js records it: the tool payload, fenced. */
const recordedTurn = (payload) => ({
    role: 'assistant',
    content: `\`\`\`json\n${JSON.stringify({ ...payload }, null, 2)}\n\`\`\``,
});

/**
 * The release flow used to lose its identity the moment it looked a product up,
 * and then loop: pick a product, get asked for the offering type without any
 * options to pick, choose an offer in OST, get shown products again, get asked
 * for the offering type again.
 *
 * Two causes, both in the tool schemas.
 *
 * 1. emit_mcp_operation carried no flowId. index.js records the tool payload as
 *    the assistant turn, so the turn after Step 2 held "mcpTool" and no flowId.
 *    inferGuidedFlowFromHistory matches that against its terminal pattern and
 *    returns null, so the flow was treated as concluded at exactly the point it
 *    was half done. Every later turn re-classified from scratch and the model,
 *    holding no flow position, guessed its step.
 *
 * 2. emit_guided_step required only flowId and message, so a step presenting
 *    choices could omit them and still validate. Step 4 rendered as a question
 *    with nothing to click.
 */
describe('ai-chat/release flow stickiness', () => {
    before(async () => {
        const tools = await import('../../src/ai-chat/guided-tool-definitions.js');
        buildGuidedTools = tools.buildGuidedTools;
        extractGuidedTool = tools.extractGuidedTool;
        ({ inferGuidedFlowFromHistory } = await import('../../src/ai-chat/index.js'));
        ({ GUIDED_CARD_CREATION_TOOL_PROMPT } = await import('../../src/ai-chat/prompt-templates.js'));
    });

    describe('the flow survives its own product lookup', () => {
        it('requires flowId on emit_mcp_operation, as it already does on emit_guided_step', () => {
            const schema = toolNamed('emit_mcp_operation').input_schema;
            expect(schema.properties).to.have.property('flowId');
            expect(schema.required).to.include('flowId');
        });

        it('recovers the flow from a lookup turn that carries flowId', () => {
            const history = [
                { role: 'user', content: 'create cards for illustrator' },
                recordedTurn({
                    type: 'mcp_operation',
                    flowId: 'release',
                    mcpTool: 'list_products',
                    mcpParams: { searchText: 'illustrator' },
                }),
            ];
            expect(inferGuidedFlowFromHistory(history)).to.equal('release');
        });

        it('still ends the flow on a lookup turn with no flowId, so termination is not broken', () => {
            const history = [
                { role: 'user', content: 'create cards for illustrator' },
                recordedTurn({ type: 'mcp_operation', mcpTool: 'list_products', mcpParams: { searchText: 'illustrator' } }),
            ];
            expect(inferGuidedFlowFromHistory(history)).to.equal(null);
        });

        it('tells the model to carry flowId through the lookup', () => {
            expect(GUIDED_CARD_CREATION_TOOL_PROMPT).to.include('emit_mcp_operation');
            expect(GUIDED_CARD_CREATION_TOOL_PROMPT).to.match(/flowId[^.]*emit_mcp_operation|emit_mcp_operation[^.]*flowId/);
        });
    });

    describe('a step that asks for a choice must offer one', () => {
        it('drops a button group carrying neither options nor an input hint', () => {
            const payload = extractGuidedTool({
                success: true,
                toolUse: {
                    name: 'emit_guided_step',
                    input: {
                        flowId: 'release',
                        message: 'What type of offering should this card feature?',
                        buttonGroup: { label: 'Offering Type' },
                    },
                },
            });
            expect(payload.message).to.include('What type of offering');
            expect(payload).to.not.have.property('buttonGroup');
        });

        it('keeps a button group that offers options', () => {
            const buttonGroup = { label: 'Offering Type', options: [{ label: 'Monthly', value: 'MONTH|MONTHLY' }] };
            const payload = extractGuidedTool({
                success: true,
                toolUse: { name: 'emit_guided_step', input: { flowId: 'release', message: 'pick', buttonGroup } },
            });
            expect(payload.buttonGroup).to.deep.equal(buttonGroup);
        });

        it('keeps a button group that only asks for typed input, as Step 1 does', () => {
            const buttonGroup = { label: 'Product', inputHint: 'Type a product name, PA code, offer ID, or OSI...' };
            const payload = extractGuidedTool({
                success: true,
                toolUse: { name: 'emit_guided_step', input: { flowId: 'release', message: 'which product?', buttonGroup } },
            });
            expect(payload.buttonGroup).to.deep.equal(buttonGroup);
        });

        it('leaves a step with no button group alone', () => {
            const payload = extractGuidedTool({
                success: true,
                toolUse: { name: 'emit_guided_step', input: { flowId: 'release', message: 'no product found' } },
            });
            expect(payload).to.not.have.property('buttonGroup');
            expect(payload.type).to.equal('guided_step');
        });
    });
});
