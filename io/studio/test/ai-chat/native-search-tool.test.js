const { expect } = require('chai');

let buildEnvelopeTool;
let buildSearchTool;
let SEARCH_TOOL_NAME;
let extractToolEnvelope;

describe('ai-chat/native search tool', () => {
    before(async () => {
        ({ buildEnvelopeTool, buildSearchTool, SEARCH_TOOL_NAME } = await import('../../src/ai-chat/tool-definitions.js'));
        ({ extractToolEnvelope } = await import('../../src/ai-chat/envelope-native.js'));
    });

    describe('buildSearchTool schema', () => {
        it('exposes variant and variationType as first-class fields', () => {
            const tool = buildSearchTool();
            expect(tool.name).to.equal('emit_search');
            expect(tool.input_schema.properties).to.have.keys([
                'query',
                'titleSearch',
                'variant',
                'variationType',
                'tags',
                'surface',
                'surfaces',
                'locale',
                'osi',
                'limit',
            ]);
        });

        it('constrains variationType to the known enum', () => {
            const values = buildSearchTool().input_schema.properties.variationType.enum;
            expect(values).to.include.members(['grouped', 'promo', 'locale-variations']);
        });
    });

    describe('buildEnvelopeTool no longer routes search_cards', () => {
        it('omits search_cards from the intent enum so emit_search owns card search', () => {
            const intents = buildEnvelopeTool().input_schema.properties.intent.enum;
            expect(intents).to.not.include('search_cards');
        });
    });

    describe('extractToolEnvelope maps emit_search to a search_cards envelope', () => {
        it('wraps the typed fields as search_cards slots', () => {
            const env = extractToolEnvelope({
                success: true,
                toolUse: { name: SEARCH_TOOL_NAME, input: { variant: 'plans', variationType: 'grouped', query: 'x' } },
            });
            expect(env.intent).to.equal('search_cards');
            expect(env.slots).to.deep.equal({ variant: 'plans', variationType: 'grouped', query: 'x' });
            expect(env.confidence).to.equal('high');
        });

        it('lowercases surface and the surfaces array', () => {
            const env = extractToolEnvelope({
                success: true,
                toolUse: { name: SEARCH_TOOL_NAME, input: { surface: 'ACOM', surfaces: ['Ccd', 'EXPRESS'] } },
            });
            expect(env.slots.surface).to.equal('acom');
            expect(env.slots.surfaces).to.deep.equal(['ccd', 'express']);
        });

        it('still returns a plain emit_envelope payload unchanged', () => {
            const env = extractToolEnvelope({
                success: true,
                toolUse: { name: 'emit_envelope', input: { intent: 'get_card', slots: { id: 'x' }, confidence: 'high' } },
            });
            expect(env.intent).to.equal('get_card');
        });
    });
});
