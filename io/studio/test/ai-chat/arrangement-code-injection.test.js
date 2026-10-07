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

describe('ai-chat/arrangement code injection — envelope shape', () => {
    let withResolvedArrangementCode;

    before(async () => {
        ({ withResolvedArrangementCode } = await import('../../src/ai-chat/operations-handler.js'));
    });

    it('fills an envelope-built lookup too, since that path skips handleOperation', () => {
        // buildEnvelopeResponseBody produces the same shape from envelope.slots.
        const envelopeBody = {
            type: 'mcp_operation',
            mcpTool: 'get_offer_by_id',
            mcpParams: { offerId: 'F5B3D59867BC5B6020EFA0763C3AE92A' },
            message: 'Resolving offer...',
            confirmationRequired: false,
        };
        const history = [{ role: 'user', content: 'Selected product: Adobe Firefly Standard (arrangement_code: PA-1930)' }];

        const filled = withResolvedArrangementCode(envelopeBody, history);

        expect(filled.mcpParams.arrangementCode).to.equal('PA-1930');
        expect(filled.message, 'the rest of the body survives').to.equal('Resolving offer...');
    });
});

/**
 * The flow the history scan cannot serve.
 *
 * On OST-first the user hands over an offer without ever picking a product, so
 * nothing in the conversation names one: working out which product the offer
 * belongs to is the request itself. The scan returns null, get_offer_by_id goes
 * out bare, and AOS answers with an unfiltered page. Reported as:
 *
 *   Failed to execute get_offer_by_id: AOS does not filter by offer id, and
 *   A4508ECDB04ABC04D36761D73E06EC5D was not in the unfiltered results.
 *
 * The client held the answer the whole time. OST hands the whole offer back and
 * mas-chat-input sends it as context.offer, carrying product_arrangement_code.
 */
describe('ai-chat/arrangement code injection — the OST-first flow', () => {
    let resolveArrangementCodeFromContext;
    let withResolvedArrangementCode;

    before(async () => {
        ({ resolveArrangementCodeFromContext, withResolvedArrangementCode } = await import(
            '../../src/ai-chat/operations-handler.js'
        ));
    });

    const OFFER_ID = 'A4508ECDB04ABC04D36761D73E06EC5D';
    const ostOffer = { offer_id: OFFER_ID, product_arrangement_code: 'PA-1930', commitment: 'YEAR', term: 'MONTHLY' };
    // The whole transcript on an OST-first turn. It names no product.
    const ostHistory = [{ role: 'user', content: `Offer ID: ${OFFER_ID}` }];

    it('takes the product from the offer OST handed back', () => {
        expect(resolveArrangementCodeFromContext({ offer: ostOffer })).to.equal('PA-1930');
    });

    it('reads the camelCase spellings the payload also uses', () => {
        expect(resolveArrangementCodeFromContext({ offer: { arrangementCode: 'PA-2244' } })).to.equal('PA-2244');
        expect(resolveArrangementCodeFromContext({ offer: { productArrangementCode: 'PA-77' } })).to.equal('PA-77');
    });

    it('finds nothing when there is no offer to read', () => {
        expect(resolveArrangementCodeFromContext(null)).to.equal(null);
        expect(resolveArrangementCodeFromContext({})).to.equal(null);
        expect(resolveArrangementCodeFromContext({ offer: {} })).to.equal(null);
        expect(resolveArrangementCodeFromContext({ offer: { product_arrangement_code: '' } })).to.equal(null);
    });

    it('fills the lookup the transcript cannot answer', () => {
        const operation = { type: 'mcp_operation', mcpTool: 'get_offer_by_id', mcpParams: { offerId: OFFER_ID } };

        const filled = withResolvedArrangementCode(operation, ostHistory, { offer: ostOffer });

        expect(filled.mcpParams.arrangementCode, 'the turn that reported "not in the unfiltered results"').to.equal('PA-1930');
        expect(filled.mcpParams.offerId).to.equal(OFFER_ID);
    });

    it('prefers the offer just picked over a product named earlier', () => {
        // The user picked this offer seconds ago; a product named earlier in the
        // conversation is older, and the lookup is for this offer.
        const history = [{ role: 'user', content: 'Selected product: Photoshop (arrangement_code: PA-2244)' }];
        const operation = { type: 'mcp_operation', mcpTool: 'get_offer_by_id', mcpParams: { offerId: OFFER_ID } };

        expect(withResolvedArrangementCode(operation, history, { offer: ostOffer }).mcpParams.arrangementCode).to.equal(
            'PA-1930',
        );
    });

    it('ignores an offer that is not the one being looked up', () => {
        // A leftover offer from an earlier step must not relabel this lookup:
        // its product would filter AOS to the wrong arrangement entirely.
        const stale = { offer_id: 'DEADBEEFDEADBEEFDEADBEEFDEADBEEF', product_arrangement_code: 'PA-9999' };
        const history = [{ role: 'user', content: 'Selected product: Photoshop (arrangement_code: PA-2244)' }];
        const operation = { type: 'mcp_operation', mcpTool: 'get_offer_by_id', mcpParams: { offerId: OFFER_ID } };

        expect(
            withResolvedArrangementCode(operation, history, { offer: stale }).mcpParams.arrangementCode,
            'falls back to the transcript',
        ).to.equal('PA-2244');
    });

    it('leaves a code the model sent itself alone', () => {
        const operation = {
            type: 'mcp_operation',
            mcpTool: 'get_offer_by_id',
            mcpParams: { offerId: OFFER_ID, arrangementCode: 'PA-1111' },
        };

        expect(withResolvedArrangementCode(operation, ostHistory, { offer: ostOffer }).mcpParams.arrangementCode).to.equal(
            'PA-1111',
        );
    });

    it('still reads the transcript when no context comes with the turn', () => {
        // Every other flow keeps working: context is optional.
        const operation = { type: 'mcp_operation', mcpTool: 'get_offer_by_id', mcpParams: { offerId: OFFER_ID } };
        const history = [{ role: 'user', content: 'Selected product: Adobe Firefly Standard (arrangement_code: PA-1930)' }];

        expect(withResolvedArrangementCode(operation, history).mcpParams.arrangementCode).to.equal('PA-1930');
        expect(withResolvedArrangementCode(operation, history, null).mcpParams.arrangementCode).to.equal('PA-1930');
    });
});
