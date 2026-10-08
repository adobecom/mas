const { expect } = require('chai');

let buildEnvelopeTool;
let buildSearchTool;
let SEARCH_TOOL_NAME;
let extractToolEnvelope;
let normalizeSearchSlots;
let buildPrompt;
let getIntent;
let SLOT_VALIDATORS;

describe('ai-chat/native search tool', () => {
    before(async () => {
        ({ buildEnvelopeTool, buildSearchTool, SEARCH_TOOL_NAME } = await import('../../src/ai-chat/tool-definitions.js'));
        ({ extractToolEnvelope, normalizeSearchSlots } = await import('../../src/ai-chat/envelope-native.js'));
        ({ buildPrompt } = await import('../../src/ai-chat/prompt-builder.js'));
        ({ getIntent, SLOT_VALIDATORS } = await import('../../src/ai-chat/intent-registry.js'));
    });

    describe('normalizeSearchSlots reclassifies misfilled fields', () => {
        it('moves a template name from query to variant', () => {
            expect(normalizeSearchSlots({ query: 'plans' })).to.deep.equal({ variant: 'plans' });
        });

        it('moves a template name from "<template> cards" to variant', () => {
            expect(normalizeSearchSlots({ query: 'plans cards' })).to.deep.equal({ variant: 'plans' });
        });

        it('moves a variation word out of tags into variationType', () => {
            expect(normalizeSearchSlots({ query: 'plans', tags: ['grouped'] })).to.deep.equal({
                variant: 'plans',
                variationType: 'grouped',
            });
        });

        it('turns a "grouped variations" query into variationType', () => {
            expect(normalizeSearchSlots({ query: 'grouped variations' })).to.deep.equal({ variationType: 'grouped' });
        });

        it('keeps a real mas: tag and only pulls out the variation word', () => {
            expect(normalizeSearchSlots({ tags: ['mas:product_code/phsp', 'grouped'] })).to.deep.equal({
                tags: ['mas:product_code/phsp'],
                variationType: 'grouped',
            });
        });

        it('leaves genuine free text alone', () => {
            expect(normalizeSearchSlots({ query: 'photoshop' })).to.deep.equal({ query: 'photoshop' });
        });

        it('does not override a variant the model already set', () => {
            expect(normalizeSearchSlots({ query: 'plans', variant: 'fries' })).to.deep.equal({
                query: 'plans',
                variant: 'fries',
            });
        });
    });

    describe('search_cards registry exposes variant and variationType', () => {
        it('lists variant and variationType as search_cards slots', () => {
            const intent = getIntent('search_cards');
            expect(intent.optional_slots).to.include('variant');
            expect(intent.optional_slots).to.include('variationType');
        });

        it('validates a template name as a variant', () => {
            expect(SLOT_VALIDATORS.variant('plans')).to.equal(true);
            expect(SLOT_VALIDATORS.variant('')).to.equal(false);
        });
    });

    describe('registry prompt teaches the card-search filters', () => {
        it('tells the model to call emit_search and maps grouped variations to variationType', () => {
            const prompt = buildPrompt();
            expect(prompt).to.contain('emit_search');
            expect(prompt).to.match(/variationType/);
            expect(prompt).to.match(/grouped/i);
        });
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
