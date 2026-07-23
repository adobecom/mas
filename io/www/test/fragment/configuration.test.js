import { expect } from 'chai';
import sinon from 'sinon';
import { loadConfiguration, resetCache, validateApiKey } from '../../src/fragment/utils/configuration.js';
import { MockState } from './mocks/MockState.js';

const HARDCODED_PROD_WCS = {
    wcsURL: 'https://www.adobe.com/web_commerce_artifact',
    env: 'prod',
    apiKey: 'wcms-commerce-ims-ro-user-milo',
};

function makeContext(extra = {}) {
    return { state: new MockState(), debugLogs: true, ...extra };
}

describe('loadConfiguration', () => {
    beforeEach(() => resetCache());

    it('returns hardcoded prod wcs config when state has none', async () => {
        const merged = await loadConfiguration(makeContext(), 0);
        expect(merged.wcsConfiguration).to.deep.equal([HARDCODED_PROD_WCS]);
    });

    it('merges state configuration into context', async () => {
        const state = new MockState();
        await state.put('configuration', JSON.stringify({ apiKeys: ['my-test-key'], debugLogs: true }));
        const merged = await loadConfiguration(makeContext({ state }), 0);
        expect(merged.apiKeys).to.deep.equal(['my-test-key']);
        expect(merged.wcsConfiguration).to.deep.equal([HARDCODED_PROD_WCS]);
    });

    it('lets state override hardcoded prod wcs row by env', async () => {
        const state = new MockState();
        const override = { wcsURL: 'https://stage.example/wca', env: 'prod' };
        await state.put('configuration', JSON.stringify({ wcsConfiguration: [override] }));
        const merged = await loadConfiguration(makeContext({ state }), 0);
        expect(merged.wcsConfiguration).to.deep.equal([override]);
    });

    it('appends non-prod envs alongside hardcoded prod', async () => {
        const state = new MockState();
        const stage = { wcsURL: 'https://stage.example/wca', env: 'stage' };
        await state.put('configuration', JSON.stringify({ wcsConfiguration: [stage] }));
        const merged = await loadConfiguration(makeContext({ state }), 0);
        expect(merged.wcsConfiguration).to.deep.equal([HARDCODED_PROD_WCS, stage]);
    });

    it('uses the in-memory cache on subsequent calls within TTL', async () => {
        const state = new MockState();
        await state.put('configuration', JSON.stringify({ apiKeys: ['cached-key'] }));
        const getSpy = sinon.spy(state, 'get');
        await loadConfiguration(makeContext({ state }), 0);
        await loadConfiguration(makeContext({ state }), 1000);
        const configCalls = getSpy.getCalls().filter((call) => call.args[0] === 'configuration');
        expect(configCalls).to.have.length(1);
    });

    it('refreshes from state once the cache TTL expires', async () => {
        const state = new MockState();
        await state.put('configuration', JSON.stringify({ apiKeys: ['v1'] }));
        await loadConfiguration(makeContext({ state }), 0);
        await state.put('configuration', JSON.stringify({ apiKeys: ['v2'] }));
        const merged = await loadConfiguration(makeContext({ state }), 5 * 60 * 1000 + 1);
        expect(merged.apiKeys).to.deep.equal(['v2']);
    });

    it('falls back to stale cache when refresh returns null', async () => {
        const state = new MockState();
        await state.put('configuration', JSON.stringify({ apiKeys: ['v1'] }));
        await loadConfiguration(makeContext({ state }), 0);
        await state.put('configuration', 'null');
        const merged = await loadConfiguration(makeContext({ state }), 5 * 60 * 1000 + 1);
        expect(merged.apiKeys).to.deep.equal(['v1']);
    });

    it('falls back to stale cache when refresh times out', async () => {
        const state = new MockState();
        await state.put('configuration', JSON.stringify({ apiKeys: ['v1'], networkConfig: { configTimeout: 5 } }));
        await loadConfiguration(makeContext({ state }), 0);
        const originalGet = state.get.bind(state);
        sinon.stub(state, 'get').callsFake(async (key) => {
            if (key === 'configuration') await new Promise((r) => setTimeout(r, 20));
            return originalGet(key);
        });
        const merged = await loadConfiguration(makeContext({ state }), 5 * 60 * 1000 + 1);
        expect(merged.apiKeys).to.deep.equal(['v1']);
    });

    it('propagates non-timeout errors from a refresh attempt', async () => {
        const state = new MockState();
        await state.put('configuration', JSON.stringify({ apiKeys: ['v1'] }));
        await loadConfiguration(makeContext({ state }), 0);
        sinon.stub(state, 'get').rejects(new Error('boom'));
        try {
            await loadConfiguration(makeContext({ state }), 5 * 60 * 1000 + 1);
            expect.fail('expected loadConfiguration to throw');
        } catch (error) {
            expect(error.message).to.equal('boom');
        }
    });
});

describe('validateApiKey', () => {
    it('rejects an absent api_key with 400', () => {
        expect(validateApiKey({})).to.deep.equal({ statusCode: 400, message: 'missing api_key' });
    });

    it('rejects an unknown api_key with 401', () => {
        expect(validateApiKey({ api_key: 'nope' })).to.deep.equal({
            statusCode: 401,
            message: 'unauthorized api_key',
        });
    });

    it('accepts a hardcoded literal', () => {
        expect(validateApiKey({ api_key: 'wcms-commerce-ims-ro-user-milo' })).to.deep.equal({ statusCode: 200 });
    });

    it('accepts a hardcoded regex pattern (CreativeCloud versions)', () => {
        expect(validateApiKey({ api_key: 'CreativeCloud_v42_99' })).to.deep.equal({ statusCode: 200 });
    });

    it('accepts a literal added from state', () => {
        expect(validateApiKey({ api_key: 'my-test-key', apiKeys: ['my-test-key'] })).to.deep.equal({ statusCode: 200 });
    });

    it('accepts a slash-wrapped regex added from state', () => {
        expect(validateApiKey({ api_key: 'my_v3', apiKeys: ['/^my_v\\d+$/'] })).to.deep.equal({ statusCode: 200 });
    });
});
