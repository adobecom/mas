const { expect } = require('chai');

let inferGuidedFlowFromHistory;

const guidedStep = (flowId) => ({
    role: 'assistant',
    content: `{"type":"guided_step","flowId":"${flowId}","message":"Pick one"}`,
});
const clarification = (text) => ({ role: 'assistant', content: text });
const userTurn = (text) => ({ role: 'user', content: text });
const operationTurn = () => ({
    role: 'assistant',
    content: '{"type":"mcp_operation","mcpTool":"search_cards","mcpParams":{"surface":"acom"}}',
});

describe('ai-chat/inferGuidedFlowFromHistory', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/index.js');
        inferGuidedFlowFromHistory = mod.inferGuidedFlowFromHistory;
    });

    it('returns the flowId from the most recent assistant message', () => {
        const history = [userTurn('find cards'), guidedStep('guided_search')];
        expect(inferGuidedFlowFromHistory(history)).to.equal('guided_search');
    });

    it('keeps the flow alive when the latest assistant reply is a plain clarification', () => {
        const history = [
            userTurn('find cards'),
            guidedStep('guided_search'),
            userTurn('by product name'),
            clarification('Which product do you mean — Photoshop or Photoshop Elements?'),
        ];
        expect(inferGuidedFlowFromHistory(history)).to.equal('guided_search');
    });

    it('does not resurrect a flow that ended with a terminal operation', () => {
        const history = [
            userTurn('find cards'),
            guidedStep('guided_search'),
            userTurn('photoshop'),
            operationTurn(),
            userTurn('thanks'),
            clarification('You are welcome!'),
        ];
        expect(inferGuidedFlowFromHistory(history)).to.equal(null);
    });

    it('returns null when no assistant message carries a flowId', () => {
        const history = [userTurn('what is an OSI?'), clarification('An OSI is an offer selector id.')];
        expect(inferGuidedFlowFromHistory(history)).to.equal(null);
    });

    it('stops scanning after four flowId-less assistant messages', () => {
        const history = [
            guidedStep('guided_search'),
            userTurn('a'),
            clarification('one'),
            userTurn('b'),
            clarification('two'),
            userTurn('c'),
            clarification('three'),
            userTurn('d'),
            clarification('four'),
        ];
        expect(inferGuidedFlowFromHistory(history)).to.equal(null);
    });

    it('ignores unknown flow ids', () => {
        const history = [guidedStep('made_up_flow')];
        expect(inferGuidedFlowFromHistory(history)).to.equal(null);
    });

    it('handles empty and malformed history', () => {
        expect(inferGuidedFlowFromHistory([])).to.equal(null);
        expect(inferGuidedFlowFromHistory(null)).to.equal(null);
        expect(inferGuidedFlowFromHistory([{ role: 'assistant', content: 42 }])).to.equal(null);
    });

    it('recognizes the fenced pretty-printed serialization of a guided tool call', () => {
        const serialized = {
            role: 'assistant',
            content: `\`\`\`json\n${JSON.stringify(
                { flowId: 'release', message: 'Select one:', type: 'guided_step' },
                null,
                2,
            )}\n\`\`\``,
        };
        expect(inferGuidedFlowFromHistory([serialized])).to.equal('release');
    });

    it('treats a serialized guided mcp_operation tool call as terminal', () => {
        const serialized = {
            role: 'assistant',
            content: `\`\`\`json\n${JSON.stringify(
                { mcpTool: 'list_products', mcpParams: { searchText: 'x' }, message: 'Looking up…', type: 'mcp_operation' },
                null,
                2,
            )}\n\`\`\``,
        };
        expect(inferGuidedFlowFromHistory([serialized])).to.equal(null);
    });
});
