const { expect } = require('chai');

let buildDocumentationPrompt;

describe('ai-chat/documentation-prompt', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/docs/documentation-prompt.js');
        buildDocumentationPrompt = mod.buildDocumentationPrompt;
    });

    it('derives supported actions from the registry instead of promising unsupported operations', async () => {
        const prompt = buildDocumentationPrompt('how do I publish a card?');
        const { INTENTS } = await import('../../src/ai-chat/intent-registry.js');
        for (const intent of INTENTS.filter((entry) => entry.tool_target)) {
            expect(prompt).to.include(`${intent.name}: ${intent.description}`);
        }
        expect(prompt).to.not.include('Publish / unpublish / update / delete');
        expect(prompt).to.include('Do not promise operations absent from');
    });

    it('requires retrieved documentation and does not carry a second support guide', () => {
        const prompt = buildDocumentationPrompt();
        expect(prompt).to.include('If no relevant documentation is supplied');
        expect(prompt).to.include('Do not invent support channels');
        expect(prompt).to.not.include('#merch-at-scale');
        expect(prompt).to.not.include('#project-odin-stakeholders');
        expect(prompt).to.not.include('aio app deploy');
    });

    it('keeps the no-JSON output contract for documentation answers', () => {
        const prompt = buildDocumentationPrompt('how do I publish a card?');
        expect(prompt).to.include('NEVER include JSON in documentation responses');
    });
});
