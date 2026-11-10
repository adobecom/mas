const { expect } = require('chai');
const sinon = require('sinon');

const PARSE_ERROR_MESSAGE = 'I had trouble formatting that response. Please try asking again.';

let main;
let isGuidedToolMiss;
let guidedToolMissFallback;
let FoundryClient;
let Ims;
let LocalKnowledgeRetriever;

function makeParams(overrides = {}) {
    return {
        __ow_method: 'post',
        __ow_headers: { authorization: 'Bearer test-token' },
        message: 'hello there',
        conversationHistory: [],
        RAG_ENABLED: 'false',
        // The Foundry client is constructed before any request path runs (even the
        // no-LLM bypasses), so main() needs a key or the constructor throws a 500.
        // The send is stubbed in every test, so the value is never used — this only
        // keeps the suite hermetic on a runner that has no .env.
        AI_FOUNDRY_API_KEY: 'test-key-not-real',
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
        ({ main, isGuidedToolMiss, guidedToolMissFallback } = await import('../../src/ai-chat/index.js'));
        ({ FoundryClient } = await import('../../src/ai-chat/foundry-client.js'));
        ({ Ims } = await import('@adobe/aio-lib-ims'));
        ({ LocalKnowledgeRetriever } = await import('../../src/ai-chat/knowledge-retriever.js'));
    });

    beforeEach(() => {
        sinon.stub(Ims.prototype, 'validateTokenAllowList').resolves({ valid: true });
        sendStub = sinon.stub(FoundryClient.prototype, 'sendWithContext');
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
            expect(result.body.type).to.equal('studio_operation');
            expect(result.body.operationName).to.equal('get_card');
            expect(result.body.operationParams.id).to.equal(uuid.toLowerCase());
            expect(result.body.envelope.intent).to.equal('get_card');
            expect(result.body.envelope.confidence).to.equal('high');
            expect(sendStub.called).to.equal(false);
        });

        it('routes a bare 32-hex offer id to get_offer_by_id inside a release turn', async () => {
            const offerId = '0123456789abcdef0123456789ABCDEF';
            const result = await main(
                makeParams({
                    message: offerId,
                    conversationHistory: [
                        { role: 'user', content: 'help me create cards' },
                        { role: 'assistant', content: 'Which product is this release for?' },
                    ],
                }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.operationName).to.equal('get_offer_by_id');
            expect(result.body.operationParams.offerId).to.equal(offerId);
            expect(result.body.envelope.intent).to.equal('get_offer_by_id');
            expect(sendStub.called).to.equal(false);
        });

        it('routes a bare arrangement slug to get_product_by_arrangement_code inside a release turn', async () => {
            const result = await main(
                makeParams({
                    message: 'phsp_direct_individual',
                    conversationHistory: [
                        { role: 'user', content: 'help me create cards' },
                        { role: 'assistant', content: 'Which product is this release for?' },
                    ],
                }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.operationName).to.equal('get_product_by_arrangement_code');
            expect(result.body.operationParams.arrangementCode).to.equal('phsp_direct_individual');
            expect(sendStub.called).to.equal(false);
        });

        it('falls through to the model when the bypass envelope is illegal for the active flow', async () => {
            sendStub.resolves(textResponse('Let me help with the current flow instead.'));
            const result = await main(
                makeParams({
                    message: 'f2f0a049-4b13-4592-9a1c-a0e6c962e21b',
                    context: { flow: { active: 'release_create', step: 'confirming' } },
                }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.operationName).to.equal(undefined);
            expect(sendStub.called).to.equal(true);
            const bypassLine = console.log.args
                .map((args) => args[0])
                .filter((arg) => typeof arg === 'string')
                .find((arg) => arg.includes('"phase":"bypass-validation-failed"'));
            expect(bypassLine).to.be.a('string');
        });

        it('routes a bare mixed-case OSI to resolve_offer_selector inside a release turn', async () => {
            const osi = 'AbC123xYz456QrS7uVw8';
            const result = await main(
                makeParams({
                    message: osi,
                    conversationHistory: [
                        { role: 'user', content: 'help me create cards' },
                        { role: 'assistant', content: 'Which product is this release for?' },
                    ],
                }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.operationName).to.equal('resolve_offer_selector');
            expect(result.body.operationParams.offerSelectorId).to.equal(osi);
            expect(sendStub.called).to.equal(false);
        });
    });

    describe('Adobe AI Foundry failure', () => {
        it('returns 502 with a generic error when the model call fails', async () => {
            sendStub.resolves({ success: false, errorType: 'ThrottlingException', error: 'throttled' });
            const result = await main(makeParams({ message: 'tell me about yourself' }));
            expect(result.statusCode).to.equal(502);
            expect(result.body.error).to.equal('Failed to get AI response');
        });

        it('carries the requestId and errorType in the 502 body', async () => {
            sendStub.resolves({ success: false, errorType: 'ThrottlingException', error: 'throttled' });
            const result = await main(makeParams({ message: 'tell me about yourself', requestId: 'req-1' }));
            expect(result.body.requestId).to.equal('req-1');
            expect(result.body.errorType).to.equal('ThrottlingException');
        });

        it('falls back to the activation id when no requestId param is given', async () => {
            process.env.__OW_ACTIVATION_ID = 'activation-42';
            try {
                sendStub.resolves({ success: false, errorType: 'ThrottlingException', error: 'throttled' });
                const result = await main(makeParams({ message: 'tell me about yourself' }));
                expect(result.body.requestId).to.equal('activation-42');
            } finally {
                delete process.env.__OW_ACTIVATION_ID;
            }
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

        it('captures the rejected envelope payload when both validations fail', async () => {
            sendStub.onCall(0).resolves(toolResponse({ intent: 'bogus_intent', slots: {}, confidence: 'high' }));
            sendStub.onCall(1).resolves(toolResponse({ intent: 'still_bogus', slots: {}, confidence: 'high' }));
            await main(makeParams({ message: 'tell me about yourself', requestId: 'req-env' }));
            const parseFailureLine = console.log.args
                .map((args) => args[0])
                .filter((arg) => typeof arg === 'string')
                .find((arg) => arg.includes('"phase":"parse-failure"'));
            expect(parseFailureLine).to.be.a('string');
            const logged = JSON.parse(parseFailureLine);
            expect(logged.req).to.equal('req-env');
            expect(logged.raw).to.include('still_bogus');
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

        it('executes an studio_operation produced by the corrective parse retry', async () => {
            sendStub.onCall(0).resolves(textResponse('```json\n{"type": guided_step broken here}\n```'));
            sendStub
                .onCall(1)
                .resolves(
                    textResponse(
                        '```json\n{"type": "studio_operation", "operationName": "list_products", "operationParams": {"searchText": "creative cloud pro"}, "message": "Looking up creative cloud pro in the catalog..."}\n```',
                    ),
                );
            const result = await main(makeParams({ message: 'please continue from before' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('studio_operation');
            expect(result.body.operationName).to.equal('list_products');
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

        it('captures the raw model output and requestId when the parse retry also fails', async () => {
            const brokenText = '```json\n{"type": guided_step broken here}\n```';
            sendStub.resolves(textResponse(brokenText));
            const result = await main(makeParams({ message: 'please continue from before', requestId: 'req-9' }));
            expect(result.body.requestId).to.equal('req-9');
            const parseFailureLine = console.log.args
                .map((args) => args[0])
                .filter((arg) => typeof arg === 'string')
                .find((arg) => arg.includes('"phase":"parse-failure"'));
            expect(parseFailureLine).to.be.a('string');
            const logged = JSON.parse(parseFailureLine);
            expect(logged.req).to.equal('req-9');
            expect(logged.raw).to.include('guided_step broken here');
            expect(logged.retried).to.equal(true);
            expect(logged.recovered).to.equal(false);
        });
    });

    describe('dead-end operation recovery', () => {
        for (const nativeGuided of ['on', 'off']) {
            it(`returns the retry operation through the ${nativeGuided === 'on' ? 'native' : 'text'} guided path`, async () => {
                const step = { type: 'guided_step', flowId: 'release', message: 'Let me look that up.' };
                const operation = {
                    type: 'studio_operation',
                    flowId: 'release',
                    operationName: 'list_products',
                    operationParams: { searchText: 'creative cloud pro' },
                    message: 'Looking up the product.',
                };
                if (nativeGuided === 'on') {
                    sendStub.onCall(0).resolves({ ...textResponse(''), toolUse: { name: 'emit_guided_step', input: step } });
                    sendStub
                        .onCall(1)
                        .resolves({ ...textResponse(''), toolUse: { name: 'emit_studio_operation', input: operation } });
                } else {
                    sendStub.onCall(0).resolves(textResponse(JSON.stringify(step)));
                    sendStub.onCall(1).resolves(textResponse(JSON.stringify(operation)));
                }

                const result = await main(
                    makeParams({
                        message: 'create cards for creative cloud pro',
                        intentHint: 'release',
                        NATIVE_GUIDED: nativeGuided,
                    }),
                );

                expect(result.body).to.include({ type: 'studio_operation', flowId: 'release', operationName: 'list_products' });
                expect(result.body.operationParams).to.deep.equal({ searchText: 'creative cloud pro' });
                expect(sendStub.callCount).to.equal(2);
            });
        }

        it('validates an operation returned by the dead-end retry', async () => {
            sendStub.onCall(0).resolves(
                textResponse(
                    JSON.stringify({
                        type: 'guided_step',
                        flowId: 'release',
                        message: 'Let me look that up.',
                    }),
                ),
            );
            sendStub.onCall(1).resolves(
                textResponse(
                    JSON.stringify({
                        type: 'studio_operation',
                        flowId: 'release',
                        operationName: 'unsupported_tool',
                        operationParams: {},
                        message: 'Running.',
                    }),
                ),
            );

            const result = await main(makeParams({ message: 'create cards', intentHint: 'release', NATIVE_GUIDED: 'off' }));

            expect(result.body.type).to.equal('error');
            expect(result.body.message).to.include('Invalid operation');
        });
    });

    describe('native guided tools (release flow)', () => {
        function guidedToolResponse(name, input) {
            return {
                success: true,
                message: '',
                toolUse: { name, input },
                usage: { inputTokens: 10, outputTokens: 5 },
            };
        }

        it('answers a release turn through a guided tool and renders it as a guided_step', async () => {
            sendStub.resolves(
                guidedToolResponse('emit_guided_step', {
                    flowId: 'release',
                    message: 'I found multiple products matching "creative cloud pro". Select one:',
                    productCards: [
                        { label: 'Creative Cloud Pro', value: 'ccpro_direct_indirect', segments: ['INDIVIDUAL', 'TEAM'] },
                    ],
                }),
            );
            const result = await main(makeParams({ message: 'creative cloud pro', intentHint: 'release' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('guided_step');
            expect(result.body.productCards[0].segments).to.deep.equal(['INDIVIDUAL', 'TEAM']);
            const sendOptions = sendStub.firstCall.args[5];
            expect(sendOptions.toolChoice).to.deep.equal({ type: 'any' });
            expect(sendOptions.tools.map((tool) => tool.name)).to.include('emit_guided_step');
            const historyTail = result.body.conversationHistory.at(-1);
            expect(historyTail.role).to.equal('assistant');
            expect(historyTail.content).to.include('"flowId": "release"');
            expect(historyTail.content).to.include('```json');
        });

        it('executes an studio_operation emitted through a guided tool', async () => {
            sendStub.resolves(
                guidedToolResponse('emit_studio_operation', {
                    operationName: 'list_products',
                    operationParams: { searchText: 'creative cloud pro' },
                    message: 'Looking up creative cloud pro in the catalog...',
                }),
            );
            const result = await main(makeParams({ message: 'creative cloud pro', intentHint: 'release' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('studio_operation');
            expect(result.body.operationName).to.equal('list_products');
            expect(result.body.operationParams.searchText).to.equal('creative cloud pro');
        });

        it('stays on the plain text path when NATIVE_GUIDED is off', async () => {
            sendStub.resolves(
                textResponse('```json\n{"type": "guided_step", "message": "Select one:", "productCards": []}\n```'),
            );
            const result = await main(
                makeParams({ message: 'creative cloud pro', intentHint: 'release', NATIVE_GUIDED: 'off' }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('guided_step');
            const sendOptions = sendStub.firstCall.args[5];
            expect(sendOptions?.tools).to.equal(undefined);
        });

        it('recovers through the parse retry when the model calls an unknown tool', async () => {
            sendStub.onCall(0).resolves(guidedToolResponse('emit_envelope', { intent: 'get_card', slots: {} }));
            sendStub
                .onCall(1)
                .resolves(
                    textResponse(
                        '```json\n{"type": "guided_step", "message": "Select one:", "productCards": [{"label": "Creative Cloud Pro", "value": "PA-1636"}]}\n```',
                    ),
                );
            const result = await main(makeParams({ message: 'creative cloud pro', intentHint: 'release' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('guided_step');
            expect(sendStub.callCount).to.equal(2);
        });

        it('hands an envelope-classified release intent off to the guided tools', async () => {
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
            sendStub.onCall(1).resolves(
                guidedToolResponse('emit_guided_step', {
                    flowId: 'release',
                    message: 'Which product is this release for?',
                    buttonGroup: { label: 'Product', inputHint: 'Type a product name...' },
                }),
            );
            const result = await main(makeParams({ message: 'tell me about yourself' }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('guided_step');
            expect(result.body.message).to.include('Which product is this release for');
            const handoffOptions = sendStub.secondCall.args[5];
            expect(handoffOptions.toolChoice).to.deep.equal({ type: 'any' });
        });
    });

    describe('error containment', () => {
        it('turns an unexpected handler throw into a 500 with a generic body', async () => {
            const result = await main(makeParams({ conversationHistory: 42 }));
            expect(result.statusCode).to.equal(500);
            expect(result.body.error).to.equal('Internal server error');
        });

        it('includes the requestId in the 500 body without leaking the error detail', async () => {
            const result = await main(makeParams({ conversationHistory: 42, requestId: 'req-500' }));
            expect(result.statusCode).to.equal(500);
            expect(result.body.requestId).to.equal('req-500');
            expect(JSON.stringify(result.body)).to.not.include('is not iterable');
        });
    });

    describe('guided-tool miss recovery (release flow)', () => {
        const reasoning =
            "The user is asking to create cards but hasn't specified a product. This is Step 1 of the guided flow. I need to emit the guided_step JSON for product selection.";
        const releaseParams = () =>
            makeParams({ message: 'Help me create cards', intentHint: 'release', conversationHistory: [] });
        const guidedStepTool = (input) => ({
            success: true,
            message: null,
            toolUse: { name: 'emit_guided_step', input },
            usage: { inputTokens: 10, outputTokens: 5 },
        });
        const leaks = (text) => /I need to emit|guided_step JSON|the user is asking/i.test(text || '');

        it('never surfaces the model reasoning when it answers in prose in a guided turn', async () => {
            sendStub.resolves(textResponse(reasoning));
            const result = await main(releaseParams());
            expect(result.statusCode).to.equal(200);
            expect(leaks(result.body.message)).to.equal(false);
        });

        it('retries with the tool forced and uses the recovered guided_step', async () => {
            sendStub.onCall(0).resolves(textResponse(reasoning));
            sendStub.onCall(1).resolves(
                guidedStepTool({
                    flowId: 'release',
                    message: 'Which product is this release for?',
                    buttonGroup: { label: 'Product', inputHint: 'Type a product name' },
                }),
            );
            const result = await main(releaseParams());
            expect(result.body.type).to.equal('guided_step');
            expect(result.body.message).to.match(/which product/i);
            expect(leaks(result.body.message)).to.equal(false);
        });

        it('after a repeated miss, returns a safe actionable product-selection step, not prose', async () => {
            sendStub.resolves(textResponse(reasoning));
            const result = await main(releaseParams());
            expect(result.body.type).to.equal('guided_step');
            expect(result.body.buttonGroup?.inputHint || result.body.buttonGroup?.options?.length).to.be.ok;
            expect(leaks(result.body.message)).to.equal(false);
        });

        it('leaves a legitimate guided tool call untouched', async () => {
            sendStub.onCall(0).resolves(
                guidedStepTool({
                    flowId: 'release',
                    message: 'Which product is this release for?',
                    buttonGroup: { label: 'Product', inputHint: 'Type a product name' },
                }),
            );
            const result = await main(releaseParams());
            expect(result.body.type).to.equal('guided_step');
            expect(result.body.message).to.match(/which product/i);
        });
    });

    describe('isGuidedToolMiss / guidedToolMissFallback', () => {
        it('flags an internal-reasoning prose response with no tool call as a miss', () => {
            const reasoning = 'The user is asking to create cards. I need to emit the guided_step JSON.';
            expect(isGuidedToolMiss({ success: true, message: reasoning, toolUse: null })).to.equal(true);
        });

        it('does not flag a plain user-facing prose question as a miss', () => {
            expect(isGuidedToolMiss({ success: true, message: 'Which product is this release for?', toolUse: null })).to.equal(
                false,
            );
        });

        it('does not flag a tool-call response as a miss', () => {
            expect(
                isGuidedToolMiss({ success: true, message: null, toolUse: { name: 'emit_guided_step', input: {} } }),
            ).to.equal(false);
        });

        it('builds a non-dead-end guided_step fallback carrying no model reasoning', () => {
            const step = guidedToolMissFallback();
            expect(step.type).to.equal('guided_step');
            expect(step.buttonGroup?.inputHint || step.buttonGroup?.options?.length).to.be.ok;
        });
    });

    describe('native search tool (emit_search)', () => {
        const searchTool = (input) => ({
            success: true,
            message: null,
            toolUse: { name: 'emit_search', input },
            usage: { inputTokens: 1, outputTokens: 1 },
        });

        it('maps an emit_search call into a search_cards operation with the typed filters', async () => {
            sendStub.resolves(searchTool({ variant: 'plans', variationType: 'grouped', surface: 'acom' }));
            const result = await main(
                makeParams({ message: 'show me cards with template "plans" that have grouped variations' }),
            );
            expect(result.statusCode).to.equal(200);
            expect(result.body.type).to.equal('studio_operation');
            expect(result.body.operationName).to.equal('search_cards');
            expect(result.body.operationParams.variant).to.equal('plans');
            expect(result.body.operationParams.variationType).to.equal('grouped');
            expect(result.body.operationParams.surface).to.equal('acom');
        });

        it('lowercases the surface the model echoed in the user casing', async () => {
            sendStub.resolves(searchTool({ query: 'photoshop', surface: 'ACOM' }));
            const result = await main(makeParams({ message: 'find photoshop cards' }));
            expect(result.body.operationName).to.equal('search_cards');
            expect(result.body.operationParams.surface).to.equal('acom');
        });

        it('reclassifies a misfilled search (template in query, variation in tags) into typed fields', async () => {
            sendStub.resolves(searchTool({ query: 'plans', tags: ['grouped'] }));
            const result = await main(
                makeParams({ message: 'show me cards with template "plans" that have grouped variations' }),
            );
            expect(result.body.operationName).to.equal('search_cards');
            expect(result.body.operationParams.variant).to.equal('plans');
            expect(result.body.operationParams.variationType).to.equal('grouped');
            expect(result.body.operationParams.query).to.equal(undefined);
            expect(result.body.operationParams.tags).to.equal(undefined);
        });
    });

    describe('ASK_MASA hand-off', () => {
        const askMasa = () => toolResponse({ intent: 'ASK_MASA', slots: {}, confidence: 'high' });
        const REPORTED_ID = 'a1fa2428-341b-4f19-af8a-012068726fb0';
        const modelPicks = (intent, slots) => toolResponse({ intent, slots, confidence: 'high', user_message: null });
        const writeUp =
            'I created this placeholder with a key inside it. The key is an RTE placeholder with a link. The paragraph tag around it breaks the sentence. As can be seen in this fragment: https://odin.adobe.com/adobe/sites/merch/mas/preview/a1fa2428-341b-4f19-af8a-012068726fb0';

        it('never hands card search to MASA', async () => {
            sendStub.resolves({
                success: true,
                message: null,
                toolUse: { name: 'emit_search', input: { query: 'photoshop', surface: 'acom' } },
                usage: { inputTokens: 1, outputTokens: 1 },
            });
            const messages = [
                'find photoshop cards in acom',
                'show me plans cards for en_US',
                '0123456789abcdef0123456789ABCDEF',
                'F2F0A049-4B13-4592-9A1C-A0E6C962E21B',
                'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdE',
            ];
            for (const message of messages) {
                const result = await main(makeParams({ message, masa: true }));
                expect(result.body.envelope?.intent, message).to.not.equal('ASK_MASA');
            }
        });

        it('returns ASK_MASA without an answer when the model hands off', async () => {
            sendStub.resolves(askMasa());
            const result = await main(makeParams({ message: 'why is my price wrong in Milo?', masa: true }));
            expect(result.statusCode).to.equal(200);
            expect(result.body.envelope.intent).to.equal('ASK_MASA');
            expect(result.body.message || '').to.equal('');
        });

        it('offers ASK_MASA to the model only when the request carries masa', async () => {
            sendStub.resolves(askMasa());
            await main(makeParams({ message: 'why is my price wrong in Milo?', masa: true }));
            const offered = sendStub.firstCall.args[5].tools[0].input_schema.properties.intent.enum;
            expect(offered).to.include('ASK_MASA');
        });

        it('does not turn a troubleshooting question into a title search', async () => {
            sendStub.resolves(modelPicks('get_card', { id: REPORTED_ID }));
            const message =
                'I created a group variation for FR so that the merch card has a green "recommended" banner. The mas fragment has returned from loc and I have published the Fr English and the Fr French mas fragments. I can see the changes on preview ( https://main--da-cc--adobecom.aem.page/fr/creativecloud/photography ) but not on live (using the same browser just another tab) https://www.adobe.com/fr/creativecloud/photography.html . Here is the FR fragment https://mas.adobe.com/studio.html#content-type=merch-card&page=content&path=acom-cc&query=e2b050a0-d726-4961-8956-0c73f849cbe4 fragment id 6c830ea6-9996-4743-8d44-87b197835b4f Please let me know what I\'m missing so that the offer appears on France';
            const result = await main(makeParams({ message, masa: true }));
            expect(sendStub.called).to.equal(true);
            expect(result.body.operationName).to.equal(undefined);
            expect(result.body.envelope.intent).to.equal('ASK_MASA');
            const offered = sendStub.firstCall.args[5].tools[0].input_schema.properties.intent.enum;
            expect(offered).to.include('ASK_MASA');
        });

        it('hands a write-up to MASA when the model picks get_card', async () => {
            sendStub.resolves(modelPicks('get_card', { id: REPORTED_ID }));
            const result = await main(makeParams({ message: writeUp, masa: true }));
            expect(result.body.envelope.intent).to.equal('ASK_MASA');
            expect(result.body.operationName).to.equal(undefined);
        });

        it('records ASK_MASA in the returned envelope for a guarded write-up', async () => {
            sendStub.resolves(modelPicks('get_card', { id: REPORTED_ID }));
            const result = await main(makeParams({ message: writeUp, masa: true }));
            expect(result.body.envelope).to.deep.include({ intent: 'ASK_MASA', slots: {}, user_message: null });
            const recorded = result.body.conversationHistory.at(-1);
            expect(recorded.role).to.equal('assistant');
            expect(JSON.parse(recorded.content).intent).to.equal('ASK_MASA');
        });

        it('hands a write-up to MASA when the model calls emit_search', async () => {
            sendStub.resolves({
                success: true,
                message: null,
                toolUse: { name: 'emit_search', input: { query: 'placeholder', surface: 'acom' } },
                usage: { inputTokens: 1, outputTokens: 1 },
            });
            const result = await main(makeParams({ message: writeUp, masa: true }));
            expect(result.body.envelope.intent).to.equal('ASK_MASA');
        });

        it('hands a long single-sentence report to MASA', async () => {
            sendStub.resolves(modelPicks('get_card', { id: REPORTED_ID }));
            const message = `${'the card shows the wrong thing '.repeat(7)}${REPORTED_ID}`;
            const result = await main(makeParams({ message, masa: true }));
            expect(result.body.envelope.intent).to.equal('ASK_MASA');
        });

        it('logs the write-up guard', async () => {
            sendStub.resolves(modelPicks('get_card', { id: REPORTED_ID }));
            await main(makeParams({ message: writeUp, masa: true }));
            const logged = console.log.getCalls().some((call) => String(call.args[0]).includes('masa-write-up-guard'));
            expect(logged).to.equal(true);
        });

        it('keeps a guided flow step and its hand-off for a write-up', async () => {
            sendStub.onCall(0).resolves(modelPicks('release_create.list_offers', {}));
            sendStub.onCall(1).resolves(textResponse('Which offers should the cards use?'));
            const result = await main(makeParams({ message: writeUp, masa: true }));
            expect(result.body.envelope?.intent).to.not.equal('ASK_MASA');
            expect(result.body.message).to.include('Which offers should the cards use?');
            expect(sendStub.secondCall.args[2]).to.include('GUIDED CARD CREATION FLOW');
        });

        it('keeps the model get_card for a write-up when the request did not offer MASA', async () => {
            sendStub.resolves(modelPicks('get_card', { id: REPORTED_ID }));
            const result = await main(makeParams({ message: writeUp }));
            expect(result.body.envelope.intent).to.equal('get_card');
            expect(result.body.operationName).to.equal('get_card');
        });

        it('keeps a short pasted-link lookup on get_card', async () => {
            sendStub.resolves(modelPicks('get_card', { id: REPORTED_ID }));
            const message = `show me this card https://mas.adobe.com/studio.html#content-type=merch-card&page=content&path=acom&query=${REPORTED_ID}`;
            const result = await main(makeParams({ message, masa: true }));
            expect(result.body.envelope.intent).to.equal('get_card');
        });

        it('keeps a short question-shaped search on search_cards', async () => {
            sendStub.resolves(modelPicks('search_cards', { query: 'Photoshop', surface: 'acom' }));
            const result = await main(makeParams({ message: 'Can you find Photoshop cards in acom?', masa: true }));
            expect(result.body.envelope.intent).to.equal('search_cards');
        });

        it('leaves a state-changing intent in a multi-sentence message unchanged', async () => {
            sendStub.resolves(modelPicks('update_card', { id: REPORTED_ID, fields: { title: 'New' } }));
            const message = `Please update card ${REPORTED_ID}. Set the title to New.`;
            const result = await main(makeParams({ message, masa: true }));
            expect(result.body.envelope.intent).to.equal('update_card');
            expect(result.body.confirmationRequired).to.equal(true);
        });

        it('keeps search_cards for a multi-sentence message that starts with a lookup verb', async () => {
            sendStub.resolves(modelPicks('search_cards', { query: 'plans', surface: 'acom' }));
            const message = 'Show me plans cards in acom. Only the grouped ones.';
            const result = await main(makeParams({ message, masa: true }));
            expect(result.body.envelope.intent).to.equal('search_cards');
        });

        it('treats a leading lookup verb case-insensitively', async () => {
            sendStub.resolves(modelPicks('search_cards', { query: 'plans', surface: 'acom' }));
            const message = 'FIND plans cards in acom. Only the grouped ones.';
            const result = await main(makeParams({ message, masa: true }));
            expect(result.body.envelope.intent).to.equal('search_cards');
        });

        it('leaves quoted text with a colon to the model', async () => {
            sendStub.resolves(textResponse('Searching.'));
            const result = await main(makeParams({ message: 'find cards with "Plans: Individual"', masa: true }));
            expect(sendStub.called).to.equal(true);
            expect(result.body.operationName).to.equal(undefined);
        });

        it('drops a model ASK_MASA when the request did not offer MASA', async () => {
            sendStub.resolves(askMasa());
            const result = await main(makeParams({ message: 'why is my price wrong in Milo?' }));
            expect(result.body.envelope?.intent).to.not.equal('ASK_MASA');
            expect(sendStub.callCount).to.equal(2);
        });
    });

    describe('knowledge retrieval', () => {
        const question = 'why is my price wrong in Milo?';
        const withRetrieval = (overrides) => makeParams({ message: question, RAG_ENABLED: undefined, ...overrides });
        let queryStub;

        beforeEach(() => {
            queryStub = sinon
                .stub(LocalKnowledgeRetriever.prototype, 'queryWithSources')
                .resolves({ context: 'Prices come from the offer.', sources: [] });
            sendStub.resolves(textResponse('Here is the answer.'));
        });

        it('sends no knowledge with a question MASA can take', async () => {
            await main(withRetrieval({ masa: true }));
            expect(sendStub.firstCall.args[3]).to.not.have.property('ragContext');
        });

        it('sends knowledge with the same question when MASA is not offered', async () => {
            await main(withRetrieval({ masa: false }));
            expect(sendStub.firstCall.args[3].ragContext).to.include('Prices come from the offer.');
        });

        it('sends knowledge with a guided Help question, which never reaches MASA', async () => {
            await main(withRetrieval({ masa: true, intentHint: 'guided_help' }));
            expect(sendStub.firstCall.args[3].ragContext).to.include('Prices come from the offer.');
        });
    });
});

/**
 * One earlier "release" mention used to put every later turn of the conversation on the
 * release prompt, which kept it off the native envelope path where ASK_MASA is offered.
 * A release is now recognised from the current message, the guided Step 1 question,
 * the active flow or the flow recorded in the history, never from an old user turn.
 */
describe('ai-chat/index release intent routing', () => {
    let sendStub;

    const offeredIntents = () =>
        sendStub.firstCall.args[5].tools?.find((tool) => tool.name === 'emit_envelope')?.input_schema.properties.intent.enum;
    const finishedFlow = [
        { role: 'user', content: 'create cards for photoshop' },
        {
            role: 'assistant',
            content: '```json\n{"type": "release_cards", "cardConfigs": [{"title": "Photoshop"}]}\n```',
        },
    ];

    before(async () => {
        ({ main } = await import('../../src/ai-chat/index.js'));
        ({ FoundryClient } = await import('../../src/ai-chat/foundry-client.js'));
        ({ Ims } = await import('@adobe/aio-lib-ims'));
    });

    beforeEach(() => {
        sinon.stub(Ims.prototype, 'validateTokenAllowList').resolves({ valid: true });
        sendStub = sinon.stub(FoundryClient.prototype, 'sendWithContext').resolves(textResponse('Okay.'));
        sinon.stub(console, 'log');
        sinon.stub(console, 'error');
        sinon.stub(console, 'warn');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('offers ASK_MASA on a troubleshooting turn after a finished release flow', async () => {
        await main(
            makeParams({
                message:
                    'The generative-credits placeholder is RTE, so its p tag breaks the sentence of the placeholder around it',
                conversationHistory: finishedFlow,
                masa: true,
            }),
        );
        expect(offeredIntents()).to.include('ASK_MASA');
        expect(sendStub.firstCall.args[2]).to.not.include('GUIDED CARD CREATION FLOW');
    });

    it('offers ASK_MASA when an earlier turn merely mentioned a release', async () => {
        await main(
            makeParams({
                message: 'find photoshop cards',
                conversationHistory: [
                    { role: 'user', content: 'what is a release?' },
                    { role: 'assistant', content: 'A release is a set of cards for a new product.' },
                ],
                masa: true,
            }),
        );
        expect(offeredIntents()).to.include('ASK_MASA');
        expect(sendStub.firstCall.args[2]).to.not.include('GUIDED CARD CREATION FLOW');
    });

    it('keeps the turn after the Step 1 question on the release flow', async () => {
        const result = await main(
            makeParams({
                message: 'PA-1375',
                conversationHistory: [
                    { role: 'user', content: 'what is a release?' },
                    { role: 'assistant', content: 'Which product is this release for?' },
                ],
                masa: true,
            }),
        );
        expect(result.body.operationName).to.equal('get_product_by_arrangement_code');
        expect(sendStub.called).to.equal(false);
    });

    it('keeps a turn of the active flow on the guided path', async () => {
        await main(
            makeParams({
                message: 'monthly',
                context: { flow: { active: 'release_create', step: 'offering' } },
                conversationHistory: [{ role: 'user', content: 'create cards for photoshop' }],
                masa: true,
            }),
        );
        expect(offeredIntents()).to.equal(undefined);
    });

    it('keeps a mid-flow turn recorded in the history on the release prompt', async () => {
        await main(
            makeParams({
                message: 'monthly',
                conversationHistory: [
                    { role: 'user', content: 'create cards for photoshop' },
                    {
                        role: 'assistant',
                        content: '```json\n{"type": "guided_step", "flowId": "release", "message": "Offering type?"}\n```',
                    },
                ],
                masa: true,
            }),
        );
        expect(offeredIntents()).to.equal(undefined);
        expect(sendStub.firstCall.args[2]).to.include('GUIDED CARD CREATION FLOW');
    });

    it('keeps the bare-identifier shortcut on a later step recorded only in the history', async () => {
        const result = await main(
            makeParams({
                message: 'PA-1375',
                conversationHistory: [
                    { role: 'user', content: 'what is a release?' },
                    {
                        role: 'assistant',
                        content: '```json\n{"type": "guided_step", "flowId": "release", "message": "Offering type?"}\n```',
                    },
                ],
            }),
        );
        expect(result.body.operationName).to.equal('get_product_by_arrangement_code');
        expect(sendStub.called).to.equal(false);
    });

    it('keeps the bare-identifier shortcut when the client sends the release intent hint', async () => {
        const result = await main(makeParams({ message: 'PA-1375', intentHint: 'release' }));
        expect(result.body.operationName).to.equal('get_product_by_arrangement_code');
        expect(sendStub.called).to.equal(false);
    });

    it('selects the release path when the current message carries a keyword', async () => {
        await main(makeParams({ message: 'create cards for photoshop', masa: true }));
        expect(offeredIntents()).to.equal(undefined);
        expect(sendStub.firstCall.args[2]).to.include('GUIDED CARD CREATION FLOW');
    });
});
