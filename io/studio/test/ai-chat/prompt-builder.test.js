const { expect } = require('chai');

let buildPrompt;

before(async () => {
    const mod = await import('../../src/ai-chat/prompt-builder.js');
    buildPrompt = mod.buildPrompt;
});

describe('prompt-builder', () => {
    it('emits the envelope shape contract', () => {
        const prompt = buildPrompt({});
        expect(prompt).to.include('"intent"');
        expect(prompt).to.include('"slots"');
        expect(prompt).to.include('"confidence"');
        expect(prompt).to.include('"missing_slots"');
        expect(prompt).to.include('"clarification_question"');
        expect(prompt).to.include('ASK_USER');
    });

    it('lists every registered intent name in the prompt', () => {
        const prompt = buildPrompt({});
        expect(prompt).to.include('search_cards');
        expect(prompt).to.include('bulk_update_cards');
        expect(prompt).to.include('release_create.set_commitment');
    });

    it('includes the never-invent-slots rule', () => {
        const prompt = buildPrompt({});
        const lower = prompt.toLowerCase();
        expect(lower).to.include('never');
        expect(lower).to.include('invent');
    });

    it('includes the mutation-verb-beats-noun rule', () => {
        const prompt = buildPrompt({}).toLowerCase();
        expect(prompt).to.include('mutation');
    });

    it('includes the one-intent-per-turn rule', () => {
        const prompt = buildPrompt({}).toLowerCase();
        expect(prompt).to.include('one');
        expect(prompt).to.include('intent');
        expect(prompt).to.include('per turn');
    });

    it('embeds context.flow when present', () => {
        const prompt = buildPrompt({ flow: { active: 'release_create', step: 'awaiting_commitment' } });
        expect(prompt).to.include('release_create');
        expect(prompt).to.include('awaiting_commitment');
    });

    it('lists the legal next intents when in a flow', () => {
        const prompt = buildPrompt({ flow: { active: 'release_create', step: 'awaiting_commitment' } });
        expect(prompt).to.include('release_create.set_commitment');
    });

    it('embeds context.lastOperation.fragmentIds when present', () => {
        const ids = ['0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf'];
        const prompt = buildPrompt({ lastOperation: { fragmentIds: ids, type: 'search_cards' } });
        expect(prompt).to.include(ids[0]);
    });

    it('embeds workingSet UUIDs when present', () => {
        const id = '12f26a12-118e-4367-b4d2-d8b6995bd9ab';
        const prompt = buildPrompt({ workingSet: [{ id, title: 'X' }] });
        expect(prompt).to.include(id);
    });

    it('embeds currentPath and currentLocale when present', () => {
        const prompt = buildPrompt({ currentPath: '/content/dam/mas/sandbox', currentLocale: 'en_US' });
        expect(prompt).to.include('/content/dam/mas/sandbox');
        expect(prompt).to.include('en_US');
    });

    it('returns a non-empty string for empty context', () => {
        const prompt = buildPrompt({});
        expect(prompt).to.be.a('string');
        expect(prompt.length).to.be.greaterThan(100);
    });

    it('handles null context gracefully', () => {
        const prompt = buildPrompt(null);
        expect(prompt).to.be.a('string');
        expect(prompt.length).to.be.greaterThan(100);
    });
});
