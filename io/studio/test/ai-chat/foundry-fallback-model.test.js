const { expect } = require('chai');
const sinon = require('sinon');

let FoundryClient;

/**
 * When a model group goes down, retrying it cannot bring it back.
 *
 * Observed 2026-09-16: every chat turn answered 502 "Failed to get AI response".
 * Calling the gateway directly, bypassing this client, gave:
 *
 *   litellm.InternalServerError: Connection error..
 *   Received Model Group=aifoundry/Qwen/Qwen-latest
 *   Available Model Group Fallbacks=None
 *
 * 500 is in RETRYABLE_STATUS_CODES, so the client dutifully retried the dead
 * group and spent its whole budget doing it. The gateway declares no fallback,
 * so the second model has to come from our side.
 *
 * A fallback is only worth asking for an upstream failure. A 400 or a 401 means
 * the request or the key is wrong, and every model will say the same thing.
 */
describe('ai-chat/foundry fallback model', () => {
    let sandbox;
    let savedRetries;
    let savedFallback;

    before(async () => {
        ({ FoundryClient } = await import('../../src/ai-chat/foundry-client.js'));
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Importing the action elsewhere in the suite loads io/studio/.env into
        // process.env, so clear what these tests set explicitly.
        savedRetries = process.env.AI_FOUNDRY_MAX_RETRIES;
        savedFallback = process.env.AI_FOUNDRY_FALLBACK_MODEL_ID;
        process.env.AI_FOUNDRY_MAX_RETRIES = '0';
        delete process.env.AI_FOUNDRY_FALLBACK_MODEL_ID;
    });

    afterEach(() => {
        sandbox.restore();
        if (savedRetries === undefined) delete process.env.AI_FOUNDRY_MAX_RETRIES;
        else process.env.AI_FOUNDRY_MAX_RETRIES = savedRetries;
        if (savedFallback === undefined) delete process.env.AI_FOUNDRY_FALLBACK_MODEL_ID;
        else process.env.AI_FOUNDRY_FALLBACK_MODEL_ID = savedFallback;
    });

    const PRIMARY = 'aifoundry/Qwen/Qwen-latest';
    const FALLBACK = 'hosted_vllm/google/gemma-4-26B-A4B-it';

    const chatResponse = () => ({
        ok: true,
        json: async () => ({
            choices: [{ message: { role: 'assistant', content: 'hello there', tool_calls: null }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 40, completion_tokens: 12 },
        }),
    });
    const errorResponse = (status) => ({ ok: false, status, text: async () => 'upstream error' });

    const client = (overrides = {}) =>
        new FoundryClient({ apiKey: 'test-key-not-real', modelId: PRIMARY, fallbackModelId: FALLBACK, ...overrides });

    const modelOf = (stub, call) => JSON.parse(stub.getCall(call).args[1].body).model;

    const send = (c) => c.sendMessage([{ role: 'user', content: 'hi' }], 'system', 64);

    it('asks the fallback model when the primary group is down', async () => {
        const fetchStub = sandbox.stub(global, 'fetch');
        fetchStub.onCall(0).resolves(errorResponse(500));
        fetchStub.onCall(1).resolves(chatResponse());

        const result = await send(client());

        expect(result.success, 'the turn should survive the outage').to.equal(true);
        expect(result.message).to.equal('hello there');
        expect(fetchStub.callCount).to.equal(2);
        expect(modelOf(fetchStub, 0)).to.equal(PRIMARY);
        expect(modelOf(fetchStub, 1), 'the retry must switch models, not repeat the dead one').to.equal(FALLBACK);
    });

    it('never asks the fallback when the primary answers', async () => {
        const fetchStub = sandbox.stub(global, 'fetch').resolves(chatResponse());

        const result = await send(client());

        expect(result.success).to.equal(true);
        expect(fetchStub.callCount, 'no extra spend on a healthy turn').to.equal(1);
        expect(modelOf(fetchStub, 0)).to.equal(PRIMARY);
    });

    it('does not fall back on a bad request, which every model would refuse', async () => {
        const fetchStub = sandbox.stub(global, 'fetch').resolves(errorResponse(400));

        const result = await send(client());

        expect(result.success).to.equal(false);
        expect(fetchStub.callCount, '400 is the caller’s fault; a second model cannot fix it').to.equal(1);
    });

    it('does not fall back on a rejected key', async () => {
        const fetchStub = sandbox.stub(global, 'fetch').resolves(errorResponse(401));

        const result = await send(client());

        expect(result.success).to.equal(false);
        expect(fetchStub.callCount).to.equal(1);
    });

    it('behaves exactly as before when no fallback is configured', async () => {
        const fetchStub = sandbox.stub(global, 'fetch').resolves(errorResponse(500));

        const result = await send(client({ fallbackModelId: null }));

        expect(result.success).to.equal(false);
        expect(result.error, 'the original failure still reaches the caller').to.be.a('string');
        expect(fetchStub.callCount, 'one model, one attempt at maxRetries=0').to.equal(1);
    });

    it('does not ask the same model twice when the fallback repeats the primary', async () => {
        const fetchStub = sandbox.stub(global, 'fetch').resolves(errorResponse(500));

        const result = await send(client({ fallbackModelId: PRIMARY }));

        expect(result.success).to.equal(false);
        expect(fetchStub.callCount, 'a duplicate fallback is not a second chance').to.equal(1);
    });

    it('reports the failure when the fallback is down too', async () => {
        const fetchStub = sandbox.stub(global, 'fetch').resolves(errorResponse(503));

        const result = await send(client());

        expect(result.success).to.equal(false);
        expect(result.error).to.be.a('string');
        expect(result, 'the internal routing flag must not leak to callers').to.not.have.property('retryable');
        expect(fetchStub.callCount, 'both models tried').to.equal(2);
    });

    it('reads the fallback from the environment when the caller passes none', async () => {
        process.env.AI_FOUNDRY_FALLBACK_MODEL_ID = FALLBACK;
        const fetchStub = sandbox.stub(global, 'fetch');
        fetchStub.onCall(0).resolves(errorResponse(500));
        fetchStub.onCall(1).resolves(chatResponse());

        const result = await send(new FoundryClient({ apiKey: 'test-key-not-real', modelId: PRIMARY }));

        expect(result.success).to.equal(true);
        expect(modelOf(fetchStub, 1)).to.equal(FALLBACK);
    });
});
