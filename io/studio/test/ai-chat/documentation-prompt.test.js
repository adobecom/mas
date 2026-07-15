const { expect } = require('chai');

let buildDocumentationPrompt;

describe('ai-chat/documentation-prompt', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/docs/documentation-prompt.js');
        buildDocumentationPrompt = mod.buildDocumentationPrompt;
    });

    it('does not contradict itself about card creation', () => {
        const prompt = buildDocumentationPrompt('how do I publish a card?');
        expect(prompt).to.include('I cannot create cards');
        expect(prompt).to.not.include('You are NOT the card creation AI');
        expect(prompt).to.not.include('tell users to use the regular AI Creator');
    });

    it('keeps the no-JSON output contract for documentation answers', () => {
        const prompt = buildDocumentationPrompt('how do I publish a card?');
        expect(prompt).to.include('NEVER include JSON in documentation responses');
    });
});
