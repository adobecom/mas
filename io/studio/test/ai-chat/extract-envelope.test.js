const { expect } = require('chai');

let tryExtractEnvelopeFromLLMText;

describe('ai-chat/index tryExtractEnvelopeFromLLMText', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/index.js');
        tryExtractEnvelopeFromLLMText = mod.tryExtractEnvelopeFromLLMText;
    });

    it('parses a fenced guided_step envelope instead of coercing it to ASK_USER prose', () => {
        const text = [
            '```json',
            '{',
            '    "type": "guided_step",',
            '    "message": "Which product is this release for? Provide any of:',
            '',
            '- Product name (e.g. "Photoshop", "Creative Cloud Pro")',
            '- Arrangement code (e.g. "PA-1636")",',
            '    "buttonGroup": { "label": "Product" }',
            '}',
            '```',
        ].join('\n');
        const result = tryExtractEnvelopeFromLLMText(text);
        expect(result.type).to.equal('guided_step');
        expect(result.intent).to.equal(undefined);
        expect(result.buttonGroup).to.deep.equal({ label: 'Product' });
    });

    it('still coerces genuine conversational prose into an ASK_USER envelope', () => {
        const result = tryExtractEnvelopeFromLLMText('Sure, happy to help with that!');
        expect(result.intent).to.equal('ASK_USER');
        expect(result.user_message).to.equal('Sure, happy to help with that!');
    });

    it('returns null for empty input', () => {
        expect(tryExtractEnvelopeFromLLMText('')).to.equal(null);
        expect(tryExtractEnvelopeFromLLMText(null)).to.equal(null);
    });
});
