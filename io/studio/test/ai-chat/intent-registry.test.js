const { expect } = require('chai');

let INTENTS;
let FLOWS;
let SLOT_VALIDATORS;
let META_INTENTS;
let getIntent;
let getFlow;
let getNextIntentsForFlowStep;
let isStateChanging;

describe('intent-registry', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/intent-registry.js');
        INTENTS = mod.INTENTS;
        FLOWS = mod.FLOWS;
        SLOT_VALIDATORS = mod.SLOT_VALIDATORS;
        META_INTENTS = mod.META_INTENTS;
        getIntent = mod.getIntent;
        getFlow = mod.getFlow;
        getNextIntentsForFlowStep = mod.getNextIntentsForFlowStep;
        isStateChanging = mod.isStateChanging;
    });

    describe('schema integrity', () => {
        it('exposes INTENTS as an array', () => {
            expect(INTENTS).to.be.an('array');
        });

        it('exposes FLOWS as an array', () => {
            expect(FLOWS).to.be.an('array');
        });

        it('exposes META_INTENTS with the expected entries', () => {
            expect(META_INTENTS).to.include.members(['ASK_USER', 'ABORT', 'START_OVER', 'SHOW_HELP', 'REPORT_ERROR']);
        });

        it('exposes SLOT_VALIDATORS for uuid, uuid[], string, osi, offerId, surface, locale, paCode, boolean', () => {
            const keys = Object.keys(SLOT_VALIDATORS);
            expect(keys).to.include.members([
                'uuid',
                'uuid[]',
                'string',
                'osi',
                'offerId',
                'surface',
                'locale',
                'paCode',
                'boolean',
            ]);
        });
    });

    describe('validators behave correctly', () => {
        it('uuid validator accepts canonical lowercase UUIDs', () => {
            expect(SLOT_VALIDATORS.uuid('0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf')).to.equal(true);
        });

        it('uuid validator rejects slug-style strings', () => {
            expect(SLOT_VALIDATORS.uuid('firefly-essentials-plans')).to.equal(false);
        });

        it('uuid[] validator rejects empty arrays', () => {
            expect(SLOT_VALIDATORS['uuid[]']([])).to.equal(false);
        });

        it('osi validator accepts realistic OSI shapes', () => {
            expect(SLOT_VALIDATORS.osi('r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8')).to.equal(true);
        });

        it('surface validator rejects unknown surfaces', () => {
            expect(SLOT_VALIDATORS.surface('unknown')).to.equal(false);
            expect(SLOT_VALIDATORS.surface('sandbox')).to.equal(true);
        });
    });

    describe('lookup helpers', () => {
        it('getIntent returns null for unknown name', () => {
            expect(getIntent('does-not-exist')).to.equal(null);
        });

        it('getFlow returns null for unknown name', () => {
            expect(getFlow('does-not-exist')).to.equal(null);
        });

        it('getNextIntentsForFlowStep returns null for unknown flow', () => {
            expect(getNextIntentsForFlowStep('does-not-exist', 'any')).to.equal(null);
        });

        it('isStateChanging returns false for unknown intent', () => {
            expect(isStateChanging('does-not-exist')).to.equal(false);
        });
    });
});
