const { expect } = require('chai');
const sinon = require('sinon');

const PARSE_ERROR_MESSAGE = 'I had trouble formatting that response. Please try asking again.';

let main;
let BedrockClient;
let Ims;

function makeParams(overrides = {}) {
    return {
        __ow_method: 'post',
        __ow_headers: { authorization: 'Bearer test-token' },
        message: 'hello there',
        conversationHistory: [],
        RAG_ENABLED: 'false',
        ...overrides,
    };
}

function textResponse(message) {
    return { success: true, message, usage: { inputTokens: 10, outputTokens: 5 } };
}

function toolResponse(input) {
    return {
        success: true,
        message: null,
        toolUse: { name: 'emit_envelope', input },
        usage: { inputTokens: 10, outputTokens: 5 },
    };
}

describe('ai-chat/index main handler', () => {
    let sendStub;

    before(async () => {
        ({ main } = await import('../../src/ai-chat/index.js'));
        ({ BedrockClient } = await import('../../src/ai-chat/bedrock-client.js'));
        ({ Ims } = await import('@adobe/aio-lib-ims'));
    });

    beforeEach(() => {
        sinon.stub(Ims.prototype, 'validateTokenAllowList').resolves({ valid: true });
        sendStub = sinon.stub(BedrockClient.prototype, 'sendWithContext');
        sinon.stub(console, 'log');
        sinon.stub(console, 'error');
        sinon.stub(console, 'warn');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('request gating', () => {
        it('answers OPTIONS preflight with 200 and no body work', async () => {
            const result = await main({ __ow_method: 'options' });
            expect(result.statusCode).to.equal(200);
            expect(sendStub.called).to.equal(false);
        });

        it('rejects an invalid bearer token with 401', async () => {
            Ims.prototype.validateTokenAllowList.resolves({ valid: false });
            const result = await main(makeParams());
            expect(result.statusCode).to.equal(401);
            expect(result.body.error).to.include('Unauthorized');
        });

        it('rejects a missing message with 400', async () => {
            const result = await main(makeParams({ message: undefined }));
            expect(result.statusCode).to.equal(400);
            expect(result.body.error).to.include('Message is required');
        });
    });

    describe('deterministic bypasses (no LLM call)', () => {
        it('routes a bare fragment UUID straight to get_card', async () => {
            const uuid = 'F2F0A049-4B13-4592-9A1C-A0E6C962E21B';
            const result = await main(makeParams({ message: uuid }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('mcp_operation');
            expect(result.body.mcpTool).to.equal('get_card');
            expect(result.body.mcpParams.id).to.equal(uuid.toLowerCase());
            expect(result.body.envelope.intent).to.equal('get_card');
            expect(result.body.envelope.confidence).to.equal('high');
            expect(sendStub.called).to.equal(false);
        });

        it('routes a quoted title search straight to search_cards with titleSearch', async () => {
            const result = await main(makeParams({ message: 'show cards titled "Photoshop Pro plan"' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.mcpTool).to.equal('search_cards');
            expect(result.body.mcpParams.query).to.equal('Photoshop Pro plan');
            expect(result.body.mcpParams.titleSearch).to.equal(true);
            expect(result.body.envelope.intent).to.equal('search_cards');
            expect(sendStub.called).to.equal(false);
        });

        it('routes a bare 32-hex offer id to get_offer_by_id inside a release turn', async () => {
            const offerId = '0123456789abcdef0123456789ABCDEF';
            const result = await main(
                makeParams({
                    message: offerId,
                    conversationHistory: [{ role: 'user', content: 'help me create cards' }],
                }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.mcpTool).to.equal('get_offer_by_id');
            expect(result.body.mcpParams.offerId).to.equal(offerId);
            expect(result.body.envelope.intent).to.equal('get_offer_by_id');
            expect(sendStub.called).to.equal(false);
        });

        it('routes a bare arrangement slug to get_product_by_arrangement_code inside a release turn', async () => {
            const result = await main(
                makeParams({
                    message: 'phsp_direct_individual',
                    conversationHistory: [{ role: 'user', content: 'help me create cards' }],
                }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.mcpTool).to.equal('get_product_by_arrangement_code');
            expect(result.body.mcpParams.arrangementCode).to.equal('phsp_direct_individual');
            expect(sendStub.called).to.equal(false);
        });

        it('routes a bare mixed-case OSI to resolve_offer_selector inside a release turn', async () => {
            const osi = 'AbC123xYz456QrS7uVw8';
            const result = await main(
                makeParams({
                    message: osi,
                    conversationHistory: [{ role: 'user', content: 'help me create cards' }],
                }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.mcpTool).to.equal('resolve_offer_selector');
            expect(result.body.mcpParams.offerSelectorId).to.equal(osi);
            expect(sendStub.called).to.equal(false);
        });
    });

    describe('Bedrock failure', () => {
        it('returns 502 with a generic error when the model call fails', async () => {
            sendStub.resolves({ success: false, errorType: 'ThrottlingException', error: 'throttled' });
            const result = await main(makeParams({ message: 'tell me about yourself' }));
            expect(result.statusCode).to.equal(502);
            expect(result.body.error).to.equal('Failed to get AI response');
        });
    });

    describe('native envelope path', () => {
        it('returns a validated envelope response for a meta intent', async () => {
            sendStub.onCall(0).resolves(
                toolResponse({
                    intent: 'SHOW_HELP',
                    slots: {},
                    confidence: 'high',
                    missing_slots: [],
                    clarification_question: null,
                    user_message: 'Here is what I can do.',
                }),
            );
            const result = await main(makeParams({ message: 'tell me about yourself' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.envelope.intent).to.equal('SHOW_HELP');
            expect(sendStub.callCount).to.equal(1);
        });

        it('retries once with a corrective prompt when the envelope is invalid', async () => {
            sendStub.onCall(0).resolves(toolResponse({ intent: 'bogus_intent', slots: {}, confidence: 'high' }));
            sendStub.onCall(1).resolves(
                toolResponse({
                    intent: 'SHOW_HELP',
                    slots: {},
                    confidence: 'high',
                    missing_slots: [],
                    clarification_question: null,
                    user_message: 'Here is what I can do.',
                }),
            );
            const result = await main(makeParams({ message: 'tell me about yourself' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.envelope.intent).to.equal('SHOW_HELP');
            expect(sendStub.callCount).to.equal(2);
            const correctiveMessage = sendStub.secondCall.args[1];
            expect(correctiveMessage).to.include('previous envelope was invalid');
        });

        it('coerces to ASK_USER when the corrective retry also fails validation', async () => {
            sendStub.onCall(0).resolves(toolResponse({ intent: 'bogus_intent', slots: {}, confidence: 'high' }));
            sendStub.onCall(1).resolves(toolResponse({ intent: 'still_bogus', slots: {}, confidence: 'high' }));
            const result = await main(makeParams({ message: 'tell me about yourself' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.envelope.intent).to.equal('ASK_USER');
            expect(sendStub.callCount).to.equal(2);
        });

        it('hands a guided-flow intent off to the guided card-creation prompt', async () => {
            sendStub.onCall(0).resolves(
                toolResponse({
                    intent: 'release_create.start',
                    slots: {},
                    confidence: 'high',
                    missing_slots: [],
                    clarification_question: null,
                    user_message: null,
                }),
            );
            sendStub.onCall(1).resolves(textResponse('Which product is this release for? You can provide a name.'));
            const result = await main(makeParams({ message: 'tell me about yourself' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('message');
            expect(result.body.message).to.include('Which product is this release for');
            expect(sendStub.callCount).to.equal(2);
            const handoffSystemPrompt = sendStub.secondCall.args[2];
            expect(handoffSystemPrompt).to.include('GUIDED CARD CREATION FLOW');
        });
    });

    describe('text path', () => {
        it('returns plain prose as a message response', async () => {
            sendStub.resolves(textResponse('Happy to help with your cards.'));
            const result = await main(makeParams({ message: 'thanks for the info', NATIVE_ENVELOPE: 'off' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('message');
            expect(result.body.message).to.equal('Happy to help with your cards.');
            expect(sendStub.callCount).to.equal(1);
        });

        it('retries a card config once through the corrective prompt when validation fails', async () => {
            const invalidCard = '```json\n{"variant": "plans", "title": ""}\n```';
            sendStub.resolves(textResponse(invalidCard));
            const result = await main(makeParams({ message: 'make me a plans card', intentHint: 'card' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('card');
            expect(result.body.validation.valid).to.equal(false);
            expect(sendStub.callCount).to.equal(2);
        });

        it('recovers a guided_step whose strings embed unescaped quotes and arrays', async () => {
            const guidedStep = [
                '```json',
                '{"type": "guided_step", "flowId": "release", "message": "I found multiple products matching "creative cloud pro". Select one:", "productCards": [{"label": "Creative Cloud Pro", "value": "PA-1636", "segments": ["INDIVIDUAL", "TEAM"]}]}',
                '```',
            ].join('\n');
            sendStub.resolves(textResponse(guidedStep));
            const result = await main(
                makeParams({
                    message: 'creative cloud pro',
                    intentHint: 'release',
                    conversationHistory: [
                        { role: 'user', content: 'help me create cards' },
                        { role: 'assistant', content: 'Which product is this release for?' },
                    ],
                }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('guided_step');
            expect(result.body.productCards).to.have.length(1);
            expect(result.body.productCards[0].segments).to.deep.equal(['INDIVIDUAL', 'TEAM']);
        });

        it('recovers a broken guided_step through one corrective parse retry', async () => {
            sendStub.onCall(0).resolves(textResponse('```json\n{"type": guided_step broken here}\n```'));
            sendStub
                .onCall(1)
                .resolves(
                    textResponse(
                        '```json\n{"type": "guided_step", "flowId": "release", "message": "Select one:", "productCards": [{"label": "Creative Cloud Pro", "value": "PA-1636"}]}\n```',
                    ),
                );
            const result = await main(makeParams({ message: 'please continue from before' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('guided_step');
            expect(result.body.productCards).to.have.length(1);
            expect(sendStub.callCount).to.equal(2);
            const correctiveMessage = sendStub.secondCall.args[1];
            expect(correctiveMessage).to.include('could not be parsed');
        });

        it('executes an mcp_operation produced by the corrective parse retry', async () => {
            sendStub.onCall(0).resolves(textResponse('```json\n{"type": guided_step broken here}\n```'));
            sendStub
                .onCall(1)
                .resolves(
                    textResponse(
                        '```json\n{"type": "mcp_operation", "mcpTool": "list_products", "mcpParams": {"searchText": "creative cloud pro"}, "message": "Looking up creative cloud pro in the catalog..."}\n```',
                    ),
                );
            const result = await main(makeParams({ message: 'please continue from before' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('mcp_operation');
            expect(result.body.mcpTool).to.equal('list_products');
            expect(sendStub.callCount).to.equal(2);
        });

        it('retries once and still surfaces the parse-error message when the retry also fails', async () => {
            sendStub.resolves(textResponse('```json\n{"type": guided_step broken here}\n```'));
            const result = await main(makeParams({ message: 'please continue from before' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('message');
            expect(result.body.message).to.equal(PARSE_ERROR_MESSAGE);
            expect(sendStub.callCount).to.equal(2);
        });

        it('does not retry parse failures when TEXT_PARSE_RETRY is off', async () => {
            sendStub.resolves(textResponse('```json\n{"type": guided_step broken here}\n```'));
            const result = await main(makeParams({ message: 'please continue from before', TEXT_PARSE_RETRY: 'off' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.message).to.equal(PARSE_ERROR_MESSAGE);
            expect(sendStub.callCount).to.equal(1);
        });
    });

    describe('error containment', () => {
        it('turns an unexpected handler throw into a 500 with a generic body', async () => {
            const result = await main(makeParams({ conversationHistory: 42 }));
            expect(result.statusCode).to.equal(500);
            expect(result.body.error).to.equal('Internal server error');
        });
    });
});
