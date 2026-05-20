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

    describe('coverage', () => {
        it('every state-changing intent has a confirmation template', () => {
            const violators = INTENTS.filter((i) => i.category === 'state-changing' && !i.confirmation_template);
            expect(violators.map((i) => i.name)).to.deep.equal([]);
        });

        it('every intent name is unique', () => {
            const names = INTENTS.map((i) => i.name);
            expect(new Set(names).size).to.equal(names.length);
        });

        it('every slot validator key referenced by an intent exists in SLOT_VALIDATORS', () => {
            for (const intent of INTENTS) {
                for (const validatorKey of Object.values(intent.slot_validators)) {
                    expect(
                        Object.keys(SLOT_VALIDATORS),
                        `intent ${intent.name} references unknown validator ${validatorKey}`,
                    ).to.include(validatorKey);
                }
            }
        });

        it('every required slot has a validator', () => {
            for (const intent of INTENTS) {
                for (const slot of intent.required_slots) {
                    expect(intent.slot_validators[slot], `intent ${intent.name} required slot ${slot} has no validator`).to
                        .exist;
                }
            }
        });

        it('every flow step name is unique within its flow', () => {
            for (const flow of FLOWS) {
                const stepNames = flow.steps.map((s) => s.name);
                expect(new Set(stepNames).size, `flow ${flow.name} has duplicate step names`).to.equal(stepNames.length);
            }
        });

        it("every intent named in a flow step's next_intents exists in the registry or is a meta intent", () => {
            const allNames = new Set([...INTENTS.map((i) => i.name), ...META_INTENTS]);
            for (const flow of FLOWS) {
                for (const step of flow.steps) {
                    for (const next of step.next_intents) {
                        expect(
                            Array.from(allNames),
                            `flow ${flow.name}/${step.name} references unknown intent ${next}`,
                        ).to.include(next);
                    }
                }
            }
        });
    });
});
