const { expect } = require('chai');

let resolveArrangementCodeFromHistory;
let withResolvedArrangementCode;

/**
 * get_offer_by_id needs the product arrangement code, because AOS does not
 * filter by offer id and the lookup is otherwise a scan of an unfiltered page.
 * The guided prompt asks the model to send it. The model does not reliably do
 * so, and the flow then fails with "was not in the unfiltered results".
 *
 * The server does not have to ask. By the time an offer is being resolved the
 * conversation already contains the product the user picked, so take it from
 * there and stop depending on the model to remember.
 */
describe('ai-chat/arrangement code injection', () => {
    before(async () => {
        ({ resolveArrangementCodeFromHistory, withResolvedArrangementCode } = await import(
            '../../src/ai-chat/operations-handler.js'
        ));
    });

    const history = [
        { role: 'user', content: 'Create cards for firefly standard' },
        {
            role: 'assistant',
            content: '{"type":"mcp_operation","mcpTool":"list_products","mcpParams":{"searchText":"firefly standard"}}',
        },
        { role: 'user', content: 'Selected product: Adobe Firefly Standard (arrangement_code: PA-1930)' },
        { role: 'user', content: 'Offer ID: F5B3D59867BC5B6020EFA0763C3AE92A' },
    ];

    it('finds the product the user picked', () => {
        expect(resolveArrangementCodeFromHistory(history)).to.equal('PA-1930');
    });

    it('prefers the most recent product when the user changed their mind', () => {
        const switched = [...history, { role: 'user', content: 'Selected product: Photoshop (arrangement_code: PA-2244)' }];
        expect(resolveArrangementCodeFromHistory(switched)).to.equal('PA-2244');
    });

    it('reads the underscore form the catalog also uses', () => {
        const underscored = [
            { role: 'user', content: 'Selected product: Illustrator (arrangement_code: ilst_direct_individual)' },
        ];
        expect(resolveArrangementCodeFromHistory(underscored)).to.equal('ilst_direct_individual');
    });

    it('finds nothing when no product has been chosen', () => {
        expect(resolveArrangementCodeFromHistory([{ role: 'user', content: 'hello' }])).to.equal(null);
        expect(resolveArrangementCodeFromHistory([])).to.equal(null);
        expect(resolveArrangementCodeFromHistory(null)).to.equal(null);
    });

    it('fills the code in when the model left it out', () => {
        const operation = {
            type: 'mcp_operation',
            mcpTool: 'get_offer_by_id',
            mcpParams: { offerId: 'F5B3D59867BC5B6020EFA0763C3AE92A' },
        };

        const filled = withResolvedArrangementCode(operation, history);

        expect(filled.mcpParams.arrangementCode).to.equal('PA-1930');
        expect(filled.mcpParams.offerId).to.equal('F5B3D59867BC5B6020EFA0763C3AE92A');
    });

    it('leaves the model’s own value alone when it did send one', () => {
        const operation = {
            type: 'mcp_operation',
            mcpTool: 'get_offer_by_id',
            mcpParams: { offerId: 'X', arrangementCode: 'PA-9999' },
        };

        expect(withResolvedArrangementCode(operation, history).mcpParams.arrangementCode).to.equal('PA-9999');
    });

    it('touches nothing else', () => {
        const operation = { type: 'mcp_operation', mcpTool: 'list_products', mcpParams: { searchText: 'firefly' } };

        expect(withResolvedArrangementCode(operation, history)).to.deep.equal(operation);
    });
});
