const { expect } = require('chai');

let sumUsage;

describe('ai-chat/sumUsage', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/bedrock-client.js');
        sumUsage = mod.sumUsage;
    });

    it('sums the token fields Bedrock actually returns', () => {
        const first = { input_tokens: 30, output_tokens: 574 };
        const second = { input_tokens: 33, output_tokens: 541 };

        expect(sumUsage(first, second)).to.deep.equal({
            input_tokens: 63,
            output_tokens: 1115,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
        });
    });

    it('preserves cache counters across a retry merge', () => {
        const first = {
            input_tokens: 30,
            output_tokens: 574,
            cache_read_input_tokens: 5396,
            cache_creation_input_tokens: 2297,
        };
        const second = {
            input_tokens: 33,
            output_tokens: 541,
            cache_read_input_tokens: 5396,
            cache_creation_input_tokens: 2334,
        };

        const merged = sumUsage(first, second);

        expect(merged.cache_read_input_tokens).to.equal(10792);
        expect(merged.cache_creation_input_tokens).to.equal(4631);
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
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
        });
    });
});
