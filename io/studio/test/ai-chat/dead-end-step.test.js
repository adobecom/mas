const { expect } = require('chai');

let isDeadEndGuidedStep;
let withDeadEndRecovery;

/**
 * The model keeps describing an action instead of taking it: "Let me look up
 * that product in the catalog first", "open the Offer Selector Tool and pick
 * one". Those arrive as a guided_step carrying a sentence and nothing else, so
 * there is no operation to run and no control to press, and the flow stops
 * where it stands. Three separate reports today.
 *
 * The tool schema permits it — emit_guided_step requires only flowId and
 * message — and three prompt rules asking the model not to have each held for a
 * while and then failed. So detect it instead: a release turn that offers the
 * user nothing to do is a dead end regardless of how it was worded, and the
 * caller retries once and then attaches a control so the flow cannot strand.
 */
describe('ai-chat/dead-end guided step', () => {
    before(async () => {
        ({ isDeadEndGuidedStep, withDeadEndRecovery } = await import('../../src/ai-chat/response-parser.js'));
    });

    const step = (extra) => ({ type: 'guided_step', flowId: 'release', message: 'Let me look that up first.', ...extra });

    describe('detection', () => {
        it('flags a step that only narrates', () => {
            expect(isDeadEndGuidedStep(step())).to.equal(true);
        });

        it('accepts a step offering options', () => {
            expect(
                isDeadEndGuidedStep(
                    step({ buttonGroup: { label: 'Offering Type', options: [{ label: 'Monthly', value: 'M' }] } }),
                ),
            ).to.equal(false);
        });

        it('accepts a step asking the user to type, as Step 1 does', () => {
            expect(
                isDeadEndGuidedStep(step({ buttonGroup: { label: 'Product', inputHint: 'Type a product name...' } })),
            ).to.equal(false);
        });

        it('accepts a step showing products to pick from', () => {
            expect(isDeadEndGuidedStep(step({ productCards: [{ label: 'Firefly', value: 'PA-1930' }] }))).to.equal(false);
        });

        it('flags a button group with neither options nor a hint', () => {
            expect(isDeadEndGuidedStep(step({ buttonGroup: { label: 'Offering Type' } }))).to.equal(true);
        });

        it('leaves every other response type alone', () => {
            expect(isDeadEndGuidedStep({ type: 'mcp_operation', mcpTool: 'list_products' })).to.equal(false);
            expect(isDeadEndGuidedStep({ type: 'release_confirmation', confirmationSummary: {} })).to.equal(false);
            expect(isDeadEndGuidedStep({ type: 'open_ost', searchParams: {} })).to.equal(false);
            expect(isDeadEndGuidedStep(null)).to.equal(false);
        });
    });

    describe('recovery, for when the retry narrates too', () => {
        it('attaches a control so the user is never left with nothing', () => {
            const recovered = withDeadEndRecovery(step());

            expect(recovered.buttonGroup.options.length, 'something to press').to.be.greaterThan(0);
            expect(recovered.message, 'the model’s own words are kept').to.include('Let me look that up first.');
        });

        it('offers a way onward and a way out', () => {
            const values = withDeadEndRecovery(step()).buttonGroup.options.map((o) => o.value);

            expect(values).to.include('release_continue');
            expect(values).to.include('release_cancel');
        });

        it('does not touch a step that was already actionable', () => {
            const good = step({ productCards: [{ label: 'Firefly', value: 'PA-1930' }] });

            expect(withDeadEndRecovery(good)).to.deep.equal(good);
        });
    });
});
