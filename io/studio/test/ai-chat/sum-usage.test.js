const { expect } = require('chai');

let sumUsage;

describe('ai-chat/sumUsage', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/foundry-client.js');
        sumUsage = mod.sumUsage;
    });

    it('sums the token fields Adobe AI Foundry actually returns', () => {
        const first = { input_tokens: 30, output_tokens: 574 };
        const second = { input_tokens: 33, output_tokens: 541 };

        expect(sumUsage(first, second)).to.deep.equal({
            input_tokens: 63,
            output_tokens: 1115,
        });
    });

    it('does not emit cache counters, which Foundry has no equivalent for', () => {
        const merged = sumUsage({ input_tokens: 30 }, { input_tokens: 33 });

        expect(merged).to.not.have.property('cache_read_input_tokens');
        expect(merged).to.not.have.property('cache_creation_input_tokens');
    });

    it('does not emit camelCase keys that no caller reads', () => {
        const merged = sumUsage({ input_tokens: 30 }, { input_tokens: 33 });

        expect(merged).to.not.have.property('inputTokens');
        expect(merged).to.not.have.property('outputTokens');
    });

    it('treats missing usage objects as zero rather than NaN', () => {
        expect(sumUsage(undefined, undefined)).to.deep.equal({
            input_tokens: 0,
            output_tokens: 0,
        });
    });
});
