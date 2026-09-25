const { expect } = require('chai');

let resolveRequestId;
let logUsageMetric;

/**
 * Fetching an activation's logs returns the turn's trace, but two of the lines
 * came back with "req": null — phase "usage" and phase "shadow-validation".
 * Those two helpers read params.requestId, while main derives the id as
 * params.requestId ?? __OW_ACTIVATION_ID and keeps it in a local. The helpers
 * never saw it, so the token counts and the envelope validation result could
 * not be correlated with the turn that produced them.
 */
describe('ai-chat/every log line carries the request id', () => {
    let originalEnv;
    let lines;
    let originalLog;

    before(async () => {
        ({ resolveRequestId, logUsageMetric } = await import('../../src/ai-chat/index.js'));
    });

    beforeEach(() => {
        originalEnv = process.env.__OW_ACTIVATION_ID;
        lines = [];
        originalLog = console.log;
        console.log = (line) => lines.push(line);
    });

    afterEach(() => {
        console.log = originalLog;
        if (originalEnv === undefined) delete process.env.__OW_ACTIVATION_ID;
        else process.env.__OW_ACTIVATION_ID = originalEnv;
    });

    describe('resolveRequestId', () => {
        it('prefers an id passed in params', () => {
            process.env.__OW_ACTIVATION_ID = 'from-env';
            expect(resolveRequestId({ requestId: 'from-params' })).to.equal('from-params');
        });

        it('falls back to the activation id, which is what actually identifies the turn', () => {
            process.env.__OW_ACTIVATION_ID = 'act-123';
            expect(resolveRequestId({})).to.equal('act-123');
            expect(resolveRequestId(undefined)).to.equal('act-123');
        });

        it('returns null when there is genuinely no id', () => {
            delete process.env.__OW_ACTIVATION_ID;
            expect(resolveRequestId({})).to.equal(null);
        });
    });

    describe('logUsageMetric', () => {
        it('stamps the turn on the token counts', () => {
            process.env.__OW_ACTIVATION_ID = 'act-123';

            logUsageMetric({ usage: { input_tokens: 10, output_tokens: 2 } }, {}, 'model-x');

            const entry = JSON.parse(lines.at(-1));
            expect(entry.phase).to.equal('usage');
            expect(entry.req, 'token spend must be attributable to a turn').to.equal('act-123');
            expect(entry.input_tokens).to.equal(10);
        });

        it('logs nothing when there is no usage to report', () => {
            logUsageMetric({}, {}, 'model-x');
            expect(lines).to.have.lengthOf(0);
        });
    });
});
