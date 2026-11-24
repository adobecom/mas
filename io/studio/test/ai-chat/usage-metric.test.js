const { expect } = require('chai');
const sinon = require('sinon');

let logUsageMetric;

describe('ai-chat/logUsageMetric', () => {
    let sandbox;

    before(async () => {
        const mod = await import('../../src/ai-chat/index.js');
        logUsageMetric = mod.logUsageMetric;
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('logs a structured usage line with model and token fields', () => {
        const logSpy = sandbox.spy(console, 'log');
        logUsageMetric(
            {
                success: true,
                usage: {
                    input_tokens: 3100,
                    output_tokens: 240,
                    cache_read_input_tokens: 2500,
                    cache_creation_input_tokens: 0,
                },
            },
            { requestId: 'req-1' },
            'us.anthropic.claude-sonnet-5',
        );

        expect(logSpy.callCount).to.equal(1);
        const line = JSON.parse(logSpy.firstCall.args[0]);
        expect(line.phase).to.equal('usage');
        expect(line.req).to.equal('req-1');
        expect(line.model).to.equal('us.anthropic.claude-sonnet-5');
        expect(line.input_tokens).to.equal(3100);
        expect(line.output_tokens).to.equal(240);
        expect(line.cache_read_input_tokens).to.equal(2500);
        expect(line.cache_creation_input_tokens).to.equal(0);
    });

    it('defaults missing cache fields to zero', () => {
        const logSpy = sandbox.spy(console, 'log');
        logUsageMetric({ success: true, usage: { input_tokens: 10, output_tokens: 5 } }, {}, 'model-x');

        const line = JSON.parse(logSpy.firstCall.args[0]);
        expect(line.cache_read_input_tokens).to.equal(0);
        expect(line.cache_creation_input_tokens).to.equal(0);
        expect(line.req).to.equal(null);
    });

    it('logs nothing when the response carried no usage data', () => {
        const logSpy = sandbox.spy(console, 'log');
        logUsageMetric({ success: false, error: 'boom' }, { requestId: 'req-2' }, 'model-x');
        logUsageMetric(null, { requestId: 'req-2' }, 'model-x');

        expect(logSpy.callCount).to.equal(0);
    });
});
