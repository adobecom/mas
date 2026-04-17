import { expect } from 'chai';
import sinon from 'sinon';
import { getFragment, setupFragmentMocks, EXPECTED_BODY } from './pipeline.test.js';
import { resetCache } from '../../src/fragment/pipeline.js';
import { clearSettingsCache } from '../../src/fragment/transformers/settings.js';
import { MockState } from './mocks/MockState.js';

let fetchStub;

describe('pipeline configuration caching', () => {
    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
        resetCache();
        clearSettingsCache();
    });

    afterEach(() => {
        fetchStub.restore();
        if (typeof performance !== 'undefined' && performance.now?.restore) {
            performance.now.restore();
        }
    });

    it('should cache configuration and reuse it on subsequent requests', async () => {
        let performanceStub;
        let stateGetSpy;
        try {
            setupFragmentMocks(fetchStub, {
                id: 'some-en-us-fragment',
                path: 'someFragment',
                fields: {
                    description: 'corps',
                    cta: '{{buy-now}}',
                },
            });

            const state = new MockState();
            await state.put('configuration', JSON.stringify({ debugLogs: true }));
            stateGetSpy = sinon.spy(state, 'get');

            const result1 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });
            expect(result1.statusCode).to.equal(200);

            const result2 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });
            expect(result2.statusCode).to.equal(200);
            expect(result1.body).to.deep.equal(result2.body);

            let configCalls = stateGetSpy.getCalls().filter((call) => call.args[0] === 'configuration');
            expect(configCalls).to.have.length(1);

            performanceStub = sinon.stub(performance, 'now');
            performanceStub.returns(5 * 60 * 1000 + 5000);

            setupFragmentMocks(fetchStub, {
                id: 'some-en-us-fragment',
                path: 'someFragment',
                fields: {
                    description: 'corps',
                    cta: '{{buy-now}}',
                },
            });

            const result3 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });
            expect(result3.statusCode).to.equal(200);

            configCalls = stateGetSpy.getCalls().filter((call) => call.args[0] === 'configuration');
            expect(configCalls).to.have.length(2);
        } finally {
            if (performanceStub?.restore) performanceStub.restore();
            if (stateGetSpy?.restore) stateGetSpy.restore();
        }
    });

    it('should use stale cache when configuration refresh times out', async () => {
        const performanceStub = sinon.stub(performance, 'now');
        let stateGetStub;
        try {
            setupFragmentMocks(fetchStub, {
                id: 'some-en-us-fragment',
                path: 'someFragment',
            });

            const state = new MockState();
            await state.put('configuration', JSON.stringify({ debugLogs: true }));

            const originalGet = state.get.bind(state);
            stateGetStub = sinon.stub(state, 'get');
            stateGetStub.callsFake(async (key) => {
                if (key === 'configuration') {
                    await new Promise((resolve) => setTimeout(resolve, 250));
                }
                return originalGet(key);
            });

            const result1 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });
            expect(result1.statusCode).to.equal(200);
            let configCalls = stateGetStub.getCalls().filter((call) => call.args[0] === 'configuration');
            expect(configCalls).to.have.length(1);

            performanceStub.returns(5 * 60 * 1000 + 1000);

            setupFragmentMocks(fetchStub, {
                id: 'some-en-us-fragment',
                path: 'someFragment',
            });

            const result2 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });

            expect(result2.statusCode).to.equal(200);
            configCalls = stateGetStub.getCalls().filter((call) => call.args[0] === 'configuration');
            expect(configCalls).to.have.length(2);
        } finally {
            performanceStub.restore();
            if (stateGetStub?.restore) stateGetStub.restore();
        }
    });

    it('should respect configTimeout from networkConfig', async () => {
        if (performance.now.restore) performance.now.restore();
        const performanceStub = sinon.stub(performance, 'now');
        let stateGetStub;
        try {
            performanceStub.returns(0);
            setupFragmentMocks(fetchStub, {
                id: 'some-en-us-fragment',
                path: 'someFragment',
            });

            const state = new MockState();
            await state.put('configuration', '{"networkConfig":{"configTimeout": 5}}');

            const originalGet = state.get.bind(state);
            stateGetStub = sinon.stub(state, 'get');
            stateGetStub.callsFake(async (key) => {
                if (key === 'configuration') {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                }
                return originalGet(key);
            });

            const result1 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });
            expect(result1.statusCode).to.equal(200);
            let configCalls = stateGetStub.getCalls().filter((call) => call.args[0] === 'configuration');
            expect(configCalls).to.have.length(1);

            performanceStub.returns(5 * 60 * 1000 + 5000);

            setupFragmentMocks(fetchStub, {
                id: 'some-en-us-fragment',
                path: 'someFragment',
            });

            const result2 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });

            expect(result2.statusCode).to.equal(200);
            configCalls = stateGetStub.getCalls().filter((call) => call.args[0] === 'configuration');
            expect(configCalls).to.have.length(2);
        } finally {
            performanceStub.restore();
            if (stateGetStub?.restore) stateGetStub.restore();
        }
    });

    it('should use stale cache when configuration refresh returns null', async () => {
        const performanceStub = sinon.stub(performance, 'now');
        try {
            setupFragmentMocks(fetchStub, {
                id: 'some-en-us-fragment',
                path: 'someFragment',
            });

            const state = new MockState();
            await state.put('configuration', JSON.stringify({ debugLogs: true }));

            const result1 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });
            expect(result1.statusCode).to.equal(200);

            performanceStub.returns(5 * 60 * 1000 + 5000);
            await state.put('configuration', 'null');

            setupFragmentMocks(fetchStub, {
                id: 'some-en-us-fragment',
                path: 'someFragment',
            });

            const result2 = await getFragment({
                id: 'some-en-us-fragment',
                state,
                locale: 'fr_FR',
            });

            expect(result2.statusCode).to.equal(200);
            expect(result2.body).to.deep.include(EXPECTED_BODY);
        } finally {
            performanceStub.restore();
        }
    });
});
