const { expect } = require('chai');
const sinon = require('sinon');
const id = '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf';
let envelope;
let operations;
let parser;
let main;
let FoundryClient;
let Ims;
describe('model validation regressions', () => {
    before(async () => {
        envelope = await import('../../src/ai-chat/envelope-validator.js');
        operations = await import('../../src/ai-chat/operations-handler.js');
        parser = await import('../../src/ai-chat/response-parser.js');
        ({ main } = await import('../../src/ai-chat/index.js'));
        ({ FoundryClient } = await import('../../src/ai-chat/foundry-client.js'));
        ({ Ims } = await import('@adobe/aio-lib-ims'));
    });
    for (const slots of [null, 7, 'slots', []]) {
        it(`coerces malformed slots ${JSON.stringify(slots)}`, () => {
            expect(envelope.validateEnvelope({ intent: 'publish_card', confidence: 'high', slots }).coerced.intent).to.equal(
                'ASK_USER',
            );
        });
    }
    for (const missing_slots of [null, 7, 'missing', {}]) {
        it(`coerces malformed missing_slots ${JSON.stringify(missing_slots)}`, () => {
            expect(
                envelope.validateEnvelope({ intent: 'publish_card', confidence: 'high', slots: {}, missing_slots }).coerced
                    .intent,
            ).to.equal('ASK_USER');
        });
    }
    it('does not mutate missing_slots', () => {
        const missing_slots = [];
        envelope.validateEnvelope({ intent: 'publish_card', confidence: 'high', slots: {}, missing_slots });
        expect(missing_slots).to.deep.equal([]);
    });
    it('does not trust assistant narrative ids', () => {
        expect(envelope.collectObservedIds({}, [{ role: 'assistant', content: `Found ${id}` }]).has(id)).to.equal(false);
    });
    it('preserves successful structured tool results', () => {
        expect(
            envelope
                .collectObservedIds({}, [{ role: 'assistant', operationResult: { success: true, results: [{ id }] } }])
                .has(id),
        ).to.equal(true);
    });
    it('rejects nested invented OSI', () => {
        expect(
            envelope.validateEnvelope(
                { intent: 'update_card', confidence: 'high', slots: { id, fields: { osi: 'inventedOsi12345' } } },
                { observedIds: new Set([id]), observedSelectors: new Set() },
            ).ok,
        ).to.equal(false);
    });
    it('rejects a nested OSI that is only a substring of an observed selector', () => {
        expect(
            envelope.validateEnvelope(
                { intent: 'update_card', confidence: 'high', slots: { id, fields: { osi: 'inventedOsi12345' } } },
                { observedIds: new Set([id]), observedSelectors: new Set(['inventedOsi123456789']) },
            ).ok,
        ).to.equal(false);
    });
    it('preserves fragment ids from tool-role JSON results', () => {
        expect(
            envelope
                .collectObservedIds({}, [{ role: 'tool', content: JSON.stringify({ success: true, results: [{ id }] }) }])
                .has(id),
        ).to.equal(true);
    });
    it('rejects invented OSI in unquoted HTML attributes', () => {
        expect(
            envelope.validateEnvelope(
                {
                    intent: 'update_card',
                    confidence: 'high',
                    slots: { id, fields: { description: '<span data-wcs-osi=inventedOsi12345>price</span>' } },
                },
                { observedIds: new Set([id]), observedSelectors: new Set() },
            ).ok,
        ).to.equal(false);
    });
    for (const osi of ['', 'selectorOne,selectorTwo']) {
        it(`permits clear or observed bundle ${JSON.stringify(osi)}`, () => {
            expect(
                envelope.validateEnvelope(
                    { intent: 'update_card', confidence: 'high', slots: { id, fields: { osi } } },
                    { observedIds: new Set([id]), observedSelectors: new Set(['selectorOne', 'selectorTwo']) },
                ).ok,
            ).to.equal(true);
        });
    }
    it('permits observed HTML bundles', () => {
        expect(
            envelope.validateEnvelope(
                {
                    intent: 'update_card',
                    confidence: 'high',
                    slots: { id, fields: { description: '<span data-wcs-osi="selectorOne,selectorTwo">price</span>' } },
                },
                { observedIds: new Set([id]), observedSelectors: new Set(['selectorOne', 'selectorTwo']) },
            ).ok,
        ).to.equal(true);
    });
    for (const result of [
        { success: true, operation: 'copy', newFragmentId: id, originalId: 'original', message: 'Copied' },
        { success: true, operation: 'publish', fragmentId: id, message: 'Published' },
        { success: true, operation: 'update', fragmentId: id, updatedFields: ['title'], message: 'Updated' },
        { success: true, operation: 'get_variations', parent: { id }, variations: [], fragment: null },
        { success: true, operation: 'get_variations', parent: null, variations: [{ id }], fragment: null },
    ]) {
        it(`preserves frontend ${result.operation} result ${JSON.stringify(result)}`, () => {
            expect(envelope.collectObservedIds({}, [{ role: 'assistant', operationResult: result }]).has(id)).to.equal(true);
        });
    }
    for (const separator of [',', ',\n']) {
        it(`rejects a bundle containing one unobserved selector separated by ${JSON.stringify(separator)}`, () => {
            expect(
                envelope.validateEnvelope(
                    {
                        intent: 'update_card',
                        confidence: 'high',
                        slots: {
                            id,
                            fields: {
                                description: `<span data-wcs-osi="selectorOne${separator}unobservedSelector">price</span>`,
                            },
                        },
                    },
                    { observedIds: new Set([id]), observedSelectors: new Set(['selectorOne']) },
                ).ok,
            ).to.equal(false);
        });
    }
    it('ignores selector-looking miscellaneous prose and failed tool results', () => {
        const history = [
            {
                role: 'assistant',
                operationResult: {
                    success: true,
                    message: 'narrativeSelector',
                    misc: { note: 'miscSelector' },
                    results: [{ id, title: 'titleSelector' }],
                },
            },
            { role: 'tool', content: JSON.stringify({ success: false, offerSelectorId: 'failedSelector' }) },
        ];
        expect(envelope.collectObservedSelectors({}, history).size).to.equal(0);
    });
    it('collects selectors from structured result fields and user input', () => {
        const result = {
            success: true,
            operation: 'search',
            results: [
                {
                    id,
                    fields: [
                        { name: 'osi', values: ['selectorOne'] },
                        { name: 'description', values: ['<span data-wcs-osi="selectorTwo,selectorThree">price</span>'] },
                    ],
                },
            ],
        };
        expect([
            ...envelope.collectObservedSelectors({}, [{ role: 'assistant', operationResult: result }], 'use selectorFour'),
        ]).to.include.members(['selectorOne', 'selectorTwo', 'selectorThree', 'selectorFour']);
    });
    it('rejects non-string operation names', () => {
        expect(
            operations.validateOperation({ type: 'studio_operation', operationName: 7, operationParams: {} }).valid,
        ).to.equal(false);
    });
    it('rejects array operation params', () => {
        expect(
            operations.validateOperation({ type: 'studio_operation', operationName: 'search_offers', operationParams: [] })
                .valid,
        ).to.equal(false);
    });
    it('guards search injection before dereferencing params', () => {
        expect(
            operations.handleOperation(
                JSON.stringify({ type: 'studio_operation', operationName: 'search_cards', operationParams: null }),
                { surface: 'acom' },
            ).type,
        ).to.equal('error');
    });
    it('caps JSON extraction input', () => {
        expect(parser.extractJSON(JSON.stringify({ message: 'a'.repeat(65536) }))).to.equal(null);
    });
    it('removes unlabelled JSON fences from prose', () => {
        expect(parser.extractConversationalText('Hello\n```\n{"message":"ok"}\n```')).to.equal('Hello');
    });
    describe('main handler', () => {
        let send;
        beforeEach(() => {
            sinon.stub(Ims.prototype, 'validateTokenAllowList').resolves({ valid: true });
            send = sinon.stub(FoundryClient.prototype, 'sendWithContext');
            sinon.stub(console, 'log');
            sinon.stub(console, 'error');
            sinon.stub(console, 'warn');
        });
        afterEach(() => sinon.restore());
        const params = {
            __ow_method: 'post',
            __ow_headers: { authorization: 'Bearer test-token' },
            message: 'change that card',
            conversationHistory: [],
            RAG_ENABLED: 'false',
            ENVELOPE_MODE: 'off',
            AI_FOUNDRY_API_KEY: 'test-key-not-real',
        };
        it('returns ASK_USER for malformed text envelope containers', async () => {
            send.resolves({
                success: true,
                message: JSON.stringify({
                    intent: 'publish_card',
                    slots: null,
                    confidence: 'high',
                    user_message: 'Publishing',
                }),
                usage: { inputTokens: 10, outputTokens: 5 },
            });
            const result = await main(params);
            expect(result.body.envelope?.intent).to.equal('ASK_USER');
        });
        it('coerces malformed native envelope slots after retry', async () => {
            send.resolves({
                success: true,
                message: null,
                toolUse: { name: 'emit_envelope', input: { intent: 'publish_card', slots: null, confidence: 'high' } },
                usage: { inputTokens: 10, outputTokens: 5 },
            });
            const result = await main({ ...params, ENVELOPE_MODE: undefined, message: 'tell me about yourself' });
            expect(result.statusCode).to.equal(200);
            expect(result.body.envelope.intent).to.equal('ASK_USER');
        });
        it('keeps selected-card prose updates with a user-provided OSI and confirmation', async () => {
            send.resolves({
                success: true,
                message: JSON.stringify({
                    type: 'studio_operation',
                    operationName: 'update_card',
                    operationParams: { id, fields: { osi: 'selectedOsi12345' } },
                    confirmationRequired: false,
                }),
                usage: { inputTokens: 10, outputTokens: 5 },
            });
            const result = await main({ ...params, message: 'set offer to selectedOsi12345', context: { cards: [{ id }] } });
            expect(result.body.operationName).to.equal('update_card');
            expect(result.body.confirmationRequired).to.equal(true);
        });
        it('keeps publish targets from structured tool results', async () => {
            send.resolves({
                success: true,
                message: JSON.stringify({ type: 'studio_operation', operationName: 'publish_card', operationParams: { id } }),
                usage: { inputTokens: 10, outputTokens: 5 },
            });
            const result = await main({
                ...params,
                conversationHistory: [{ role: 'assistant', operationResult: { success: true, results: [{ id }] } }],
            });
            expect(result.body.operationName).to.equal('publish_card');
            expect(result.body.confirmationRequired).to.equal(true);
        });
        it('accepts an OSI from a successful tool-role JSON result', async () => {
            send.resolves({
                success: true,
                message: JSON.stringify({
                    type: 'studio_operation',
                    operationName: 'update_card',
                    operationParams: { id, fields: { osi: 'selectedOsi12345' } },
                }),
                usage: { inputTokens: 10, outputTokens: 5 },
            });
            const result = await main({
                ...params,
                context: { cards: [{ id }] },
                conversationHistory: [
                    { role: 'tool', content: JSON.stringify({ success: true, selector: { id: 'selectedOsi12345' } }) },
                ],
            });
            expect(result.body.operationName).to.equal('update_card');
        });
        for (const source of ['message', 'title']) {
            it(`rejects selector provenance only in structured result ${source}`, async () => {
                send.resolves({
                    success: true,
                    message: JSON.stringify({
                        type: 'studio_operation',
                        operationName: 'update_card',
                        operationParams: { id, fields: { osi: 'inventedOsi12345' } },
                    }),
                    usage: { inputTokens: 10, outputTokens: 5 },
                });
                const operationResult = {
                    success: true,
                    operation: 'search',
                    results: source === 'title' ? [{ id, title: 'inventedOsi12345' }] : [],
                    message: source === 'message' ? 'No results; try inventedOsi12345' : 'Found',
                };
                const result = await main({
                    ...params,
                    context: { cards: [{ id }] },
                    conversationHistory: [{ role: 'assistant', operationResult }],
                });
                expect(result.body.operationName).to.equal(undefined);
            });
        }
        for (const osi of ['', 'selectorOne,selectorTwo']) {
            it(`preserves clear or bundle through main ${JSON.stringify(osi)}`, async () => {
                send.resolves({
                    success: true,
                    message: JSON.stringify({
                        type: 'studio_operation',
                        operationName: 'update_card',
                        operationParams: { id, fields: { osi } },
                    }),
                    usage: { inputTokens: 10, outputTokens: 5 },
                });
                const result = await main({
                    ...params,
                    message: 'use selectorOne and selectorTwo',
                    context: { cards: [{ id }] },
                });
                expect(result.body.operationName).to.equal('update_card');
                expect(result.body.operationParams.fields.osi).to.equal(osi);
                expect(result.body.confirmationRequired).to.equal(true);
            });
        }
        it('publishes a copied card from the frontend newFragmentId result', async () => {
            send.resolves({
                success: true,
                message: JSON.stringify({ type: 'studio_operation', operationName: 'publish_card', operationParams: { id } }),
                usage: { inputTokens: 10, outputTokens: 5 },
            });
            const result = await main({
                ...params,
                conversationHistory: [
                    {
                        role: 'assistant',
                        operationResult: {
                            success: true,
                            operation: 'copy',
                            newFragmentId: id,
                            newFragmentTitle: 'Copy',
                            message: 'Created copy',
                        },
                    },
                ],
            });
            expect(result.body.operationName).to.equal('publish_card');
            expect(result.body.confirmationRequired).to.equal(true);
        });
        it('accepts an exact OSI from structured selected offer context', async () => {
            send.resolves({
                success: true,
                message: JSON.stringify({
                    type: 'studio_operation',
                    operationName: 'update_card',
                    operationParams: { id, fields: { description: '<span data-wcs-osi="selectedOsi12345">price</span>' } },
                }),
                usage: { inputTokens: 10, outputTokens: 5 },
            });
            const result = await main({ ...params, context: { cards: [{ id }], offer: { osi: 'selectedOsi12345' } } });
            expect(result.body.operationName).to.equal('update_card');
        });
        for (const payload of [
            { type: 'studio_operation', operationName: 'publish_card', operationParams: { id } },
            { intent: 'publish_card', slots: { id }, confidence: 'high', user_message: 'Publishing' },
            {
                type: 'studio_operation',
                operationName: 'update_card',
                operationParams: { id, fields: { osi: 'inventedOsi12345' } },
            },
            {
                type: 'studio_operation',
                operationName: 'update_card',
                operationParams: { id, fields: { description: '<span data-wcs-osi="inventedOsi12345">price</span>' } },
            },
        ]) {
            it(`blocks invented provenance in ${JSON.stringify(payload)}`, async () => {
                send.resolves({ success: true, message: JSON.stringify(payload), usage: { inputTokens: 10, outputTokens: 5 } });
                const result = await main({
                    ...params,
                    context: payload.operationName === 'update_card' ? { cards: [{ id }] } : {},
                });
                expect(result.statusCode).to.equal(200);
                expect(result.body.operationName).to.equal(undefined);
                expect(result.body.envelope?.intent).to.not.equal('publish_card');
            });
        }
    });
});
