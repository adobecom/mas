const { expect } = require('chai');

let buildEnvelopeTool;
let ENVELOPE_TOOL_NAME;
let ENVELOPE_TOOL_CHOICE;
let INTENTS;
let META_INTENTS;

describe('ai-chat/tool-definitions', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/tool-definitions.js');
        buildEnvelopeTool = mod.buildEnvelopeTool;
        ENVELOPE_TOOL_NAME = mod.ENVELOPE_TOOL_NAME;
        ENVELOPE_TOOL_CHOICE = mod.ENVELOPE_TOOL_CHOICE;
        const registry = await import('../../src/ai-chat/intent-registry.js');
        INTENTS = registry.INTENTS;
        META_INTENTS = registry.META_INTENTS;
    });

    it('names the tool and matches the forced tool choice', () => {
        const tool = buildEnvelopeTool();
        expect(tool.name).to.equal(ENVELOPE_TOOL_NAME);
        expect(ENVELOPE_TOOL_CHOICE).to.deep.equal({ type: 'tool', name: tool.name });
    });

    it('enumerates every registered intent and meta intent', () => {
        const tool = buildEnvelopeTool();
        const enumValues = tool.input_schema.properties.intent.enum;
        expect(enumValues).to.have.length(INTENTS.length + META_INTENTS.length);
        expect(enumValues).to.include('search_cards');
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
});
