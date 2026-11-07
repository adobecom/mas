const { expect } = require('chai');

let buildEnvelopeTool;
let ENVELOPE_TOOL_NAME;
let ENVELOPE_TOOL_CHOICE;
let INTENTS;
let getMetaIntents;

describe('ai-chat/tool-definitions', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/tool-definitions.js');
        buildEnvelopeTool = mod.buildEnvelopeTool;
        ENVELOPE_TOOL_NAME = mod.ENVELOPE_TOOL_NAME;
        ENVELOPE_TOOL_CHOICE = mod.ENVELOPE_TOOL_CHOICE;
        const registry = await import('../../src/ai-chat/intent-registry.js');
        INTENTS = registry.INTENTS;
        getMetaIntents = registry.getMetaIntents;
    });

    it('names the tool and matches the forced tool choice', () => {
        const tool = buildEnvelopeTool();
        expect(tool.name).to.equal(ENVELOPE_TOOL_NAME);
        expect(ENVELOPE_TOOL_CHOICE).to.deep.equal({ type: 'tool', name: tool.name });
    });

    it('enumerates every registered intent and meta intent except search_cards', () => {
        const tool = buildEnvelopeTool();
        const enumValues = tool.input_schema.properties.intent.enum;
        // search_cards is excluded (the typed emit_search tool owns card search).
        expect(enumValues).to.have.length(INTENTS.length - 1 + getMetaIntents().length);
        expect(enumValues).to.not.include('search_cards');
        expect(enumValues).to.include('release_create.set_commitment');
        expect(enumValues).to.include('ASK_USER');
        expect(enumValues).to.include('ABORT');
    });

    it('requires intent, slots, and confidence', () => {
        const tool = buildEnvelopeTool();
        expect(tool.input_schema.required).to.have.members(['intent', 'slots', 'confidence']);
        expect(tool.input_schema.properties.slots.type).to.equal('object');
    });

    it('uses the categorical confidence scale the envelope validator enforces', () => {
        const tool = buildEnvelopeTool();
        expect(tool.input_schema.properties.confidence.enum).to.have.members(['high', 'medium', 'low']);
    });

    it('exposes clarification and user-message channels', () => {
        const tool = buildEnvelopeTool();
        expect(tool.input_schema.properties.clarification_question).to.exist;
        expect(tool.input_schema.properties.user_message).to.exist;
        expect(tool.input_schema.properties.missing_slots.items.type).to.equal('string');
    });

    it('is byte-stable across calls so the request prefix stays cacheable', () => {
        expect(JSON.stringify(buildEnvelopeTool())).to.equal(JSON.stringify(buildEnvelopeTool()));
    });

    it('offers ASK_MASA only when MASA is available', () => {
        const without = buildEnvelopeTool().input_schema.properties.intent.enum;
        expect(without).to.not.include('ASK_MASA');
        const withMasa = buildEnvelopeTool({ masa: true });
        expect(withMasa.input_schema.properties.intent.enum).to.include('ASK_MASA');
        expect(withMasa.description).to.include('ASK_MASA');
        expect(buildEnvelopeTool().description).to.not.include('ASK_MASA');
    });

    it('treats a problem report as a troubleshooting question when MASA is available', () => {
        const sentence =
            'A message that reports a problem (what the user did and what went wrong) is a troubleshooting question even without a question mark; links or IDs in it are evidence for MASA, not a request to fetch them.';
        expect(buildEnvelopeTool({ masa: true }).description).to.include(sentence);
        expect(buildEnvelopeTool().description).to.not.include(sentence);
    });

    it('does not offer ASK_USER for answers to questions when MASA is available', () => {
        const { description } = buildEnvelopeTool({ masa: true });
        expect(description).to.not.include('answers to questions');
        expect(description).to.include('use ASK_USER for clarifications and off-topic replies');
    });

    it('does not invite documentation answers in user_message when MASA is available', () => {
        const { user_message: userMessage } = buildEnvelopeTool({ masa: true }).input_schema.properties;
        expect(userMessage.description).to.not.include('documentation answers');
        expect(buildEnvelopeTool().input_schema.properties.user_message.description).to.include('documentation answers');
    });

    it('keeps ASK_USER for answers to questions when MASA is not offered', () => {
        expect(buildEnvelopeTool().description).to.include(
            'use ASK_USER for clarifications, answers to questions, and anything that is not an operation.',
        );
        expect(JSON.stringify(buildEnvelopeTool({ masa: false }))).to.equal(JSON.stringify(buildEnvelopeTool()));
    });
});
