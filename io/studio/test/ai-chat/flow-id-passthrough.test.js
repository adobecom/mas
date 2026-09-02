const { expect } = require('chai');

let handleOperation;

const fenced = (payload) => `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``;

/**
 * The release flow tells the client which flow a turn belongs to by putting
 * flowId on the payload, and emit_mcp_operation makes it required. The client
 * needs it because a free-text start ("Create cards for firefly standard")
 * never runs handlePromptSelected, so nothing else ever marks the conversation
 * as a release: the lookup is then dispatched as an ordinary one, renders the
 * products eagerly AND asks the model to continue, and the same product is
 * drawn twice.
 *
 * Measured on the branch page before this fix, the response bodies the client
 * received were:
 *
 *   { type: 'mcp_operation', mcpTool: 'list_products' }   <- no flowId
 *   { type: 'guided_step' }                               <- no flowId
 *
 * The model did emit it. handleOperation rebuilds the operation from a fixed
 * field list and dropped it on the way out.
 */
describe('ai-chat/flowId reaches the client', () => {
    before(async () => {
        ({ handleOperation } = await import('../../src/ai-chat/operations-handler.js'));
    });

    it('keeps flowId on a release lookup', () => {
        const result = handleOperation(
            fenced({
                type: 'mcp_operation',
                flowId: 'release',
                mcpTool: 'list_products',
                mcpParams: { searchText: 'firefly standard' },
                message: 'Looking up firefly standard in the catalog...',
            }),
        );

        expect(result).to.not.equal(null);
        expect(result.type).to.equal('mcp_operation');
        expect(result.flowId, 'the client cannot recognise a release lookup without this').to.equal('release');
    });

    it('leaves flowId off an operation that carries none', () => {
        const result = handleOperation(
            fenced({
                type: 'mcp_operation',
                mcpTool: 'search_cards',
                mcpParams: { query: 'photoshop' },
                message: 'Searching...',
            }),
        );

        expect(result).to.not.equal(null);
        expect(result.flowId, 'an ordinary lookup must not be labelled a flow').to.equal(undefined);
    });

    it('does not invent a flow from an unknown flowId', () => {
        const result = handleOperation(
            fenced({
                type: 'mcp_operation',
                flowId: 'not_a_real_flow',
                mcpTool: 'search_cards',
                mcpParams: { query: 'photoshop' },
                message: 'Searching...',
            }),
        );

        // Passing it through is fine — the client validates against its own
        // known-flow list — but it must not be coerced into a real flow.
        expect(result.flowId).to.not.equal('release');
    });
});

describe('ai-chat/flowIdField', () => {
    let flowIdField;

    before(async () => {
        ({ flowIdField } = await import('../../src/ai-chat/response-parser.js'));
    });

    it('carries a real flow id', () => {
        expect(flowIdField({ type: 'guided_step', flowId: 'release' })).to.deep.equal({ flowId: 'release' });
    });

    it('adds nothing when the payload carries no flow', () => {
        expect(flowIdField({ type: 'guided_step' })).to.deep.equal({});
        expect(flowIdField({ type: 'guided_step', flowId: '' })).to.deep.equal({});
        expect(flowIdField(null)).to.deep.equal({});
    });

    it('ignores a non-string flow id rather than shipping it', () => {
        expect(flowIdField({ flowId: 42 })).to.deep.equal({});
        expect(flowIdField({ flowId: { id: 'release' } })).to.deep.equal({});
    });
});

describe('ai-chat/parseAIResponse keeps the flow id', () => {
    let parseAIResponse;

    before(async () => {
        ({ parseAIResponse } = await import('../../src/ai-chat/response-parser.js'));
    });

    const fencedStep = (payload) => `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``;

    it('keeps it on a guided step, the first of three rebuilds that dropped it', () => {
        const parsed = parseAIResponse(
            fencedStep({
                type: 'guided_step',
                flowId: 'release',
                message: 'What type of offering should this card feature?',
                buttonGroup: { label: 'Offering Type', options: [{ label: 'Monthly', value: 'MONTH|MONTHLY' }] },
            }),
        );

        expect(parsed.type).to.equal('guided_step');
        expect(parsed.flowId, 'without this the next turn cannot tell it is mid-flow').to.equal('release');
        expect(parsed.buttonGroup.options).to.have.lengthOf(1);
    });

    it('keeps it when the flow opens the offer selector', () => {
        const parsed = parseAIResponse(
            fencedStep({
                type: 'open_ost',
                flowId: 'release',
                message: 'Opening the Offer Selector Tool',
                searchParams: { arrangement_code: 'PA-1930' },
            }),
        );

        expect(parsed.flowId).to.equal('release');
    });

    it('adds nothing when the model sent no flow', () => {
        const parsed = parseAIResponse(fencedStep({ type: 'guided_step', message: 'pick one' }));

        expect(parsed.flowId).to.equal(undefined);
    });
});
