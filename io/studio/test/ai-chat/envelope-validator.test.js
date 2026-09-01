const { expect } = require('chai');

let validateEnvelope;
let collectObservedIds;

const UUID = '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf';
const UUID2 = '12f26a12-118e-4367-b4d2-d8b6995bd9ab';

describe('envelope-validator', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/envelope-validator.js');
        validateEnvelope = mod.validateEnvelope;
        collectObservedIds = mod.collectObservedIds;
    });

    describe('valid envelopes', () => {
        it('passes a well-formed search_cards envelope', () => {
            const r = validateEnvelope({
                intent: 'search_cards',
                slots: { query: 'firefly', surface: 'sandbox' },
                confidence: 'high',
            });
            expect(r.ok).to.equal(true);
            expect(r.envelope.intent).to.equal('search_cards');
        });

        it('passes a well-formed bulk_update_cards envelope with UUID array', () => {
            const r = validateEnvelope({
                intent: 'bulk_update_cards',
                slots: { fragmentIds: [UUID, UUID2] },
                confidence: 'high',
            });
            expect(r.ok).to.equal(true);
        });

        it('passes ASK_USER without slot checks', () => {
            const r = validateEnvelope({
                intent: 'ASK_USER',
                slots: {},
                confidence: 'low',
                clarification_question: 'Which cards?',
            });
            expect(r.ok).to.equal(true);
        });
    });

    describe('coerces to ASK_USER on structural failures', () => {
        it('non-object input', () => {
            const r = validateEnvelope(null);
            expect(r.ok).to.equal(false);
            expect(r.coerced.intent).to.equal('ASK_USER');
        });

        it('missing intent string', () => {
            const r = validateEnvelope({ confidence: 'high' });
            expect(r.ok).to.equal(false);
            expect(r.reason).to.equal('intent-missing');
        });

        it('unknown intent name', () => {
            const r = validateEnvelope({ intent: 'do_a_barrel_roll', slots: {}, confidence: 'high' });
            expect(r.ok).to.equal(false);
            expect(r.reason).to.equal('intent-not-in-registry');
        });

        it('bad confidence value', () => {
            const r = validateEnvelope({ intent: 'search_cards', slots: {}, confidence: 'maybe' });
            expect(r.ok).to.equal(false);
            expect(r.reason).to.equal('bad-confidence');
        });
    });

    describe('slot validation', () => {
        it('rejects slug-style fragmentIds', () => {
            const r = validateEnvelope({
                intent: 'bulk_update_cards',
                slots: { fragmentIds: ['firefly-essentials-plans'] },
                confidence: 'high',
            });
            expect(r.ok).to.equal(false);
            expect(r.reason).to.equal('slot-invalid');
        });

        it('puts missing required slots into missing_slots OR coerces to ASK_USER', () => {
            const r = validateEnvelope({ intent: 'bulk_update_cards', slots: {}, confidence: 'high' });
            if (r.ok) {
                expect(r.envelope.missing_slots).to.include('fragmentIds');
            } else {
                expect(r.coerced.intent).to.equal('ASK_USER');
            }
        });
    });

    describe('flow legality', () => {
        it('rejects out-of-flow intent during release_create', () => {
            const r = validateEnvelope(
                { intent: 'search_cards', slots: { query: 'x' }, confidence: 'high' },
                { flow: { active: 'release_create', step: 'awaiting_commitment' } },
            );
            expect(r.ok).to.equal(false);
            expect(r.reason).to.equal('flow-step-illegal');
        });

        it('accepts legal next intent during release_create', () => {
            const r = validateEnvelope(
                { intent: 'release_create.set_commitment', slots: { commitment: 'YEAR', term: 'MONTHLY' }, confidence: 'high' },
                { flow: { active: 'release_create', step: 'awaiting_commitment' } },
            );
            expect(r.ok).to.equal(true);
        });

        it('accepts ABORT at any flow step', () => {
            const r = validateEnvelope(
                { intent: 'ABORT', slots: {}, confidence: 'high' },
                { flow: { active: 'release_create', step: 'awaiting_commitment' } },
            );
            expect(r.ok).to.equal(true);
        });
    });

    describe('id provenance guard', () => {
        const FAKE = '61111111-1111-4111-8111-111111111111';

        it('rejects a state-changing envelope whose ids were never observed', () => {
            const r = validateEnvelope(
                { intent: 'bulk_update_cards', slots: { fragmentIds: [FAKE] }, confidence: 'high' },
                { observedIds: collectObservedIds({ workingSet: [] }, [], 'update both of them') },
            );

            expect(r.ok).to.equal(false);
            expect(r.reason).to.equal('ids-not-observed');
            expect(r.coerced.clarification_question).to.match(/search/i);
        });

        it('accepts ids that appear in the working set', () => {
            const r = validateEnvelope(
                { intent: 'bulk_update_cards', slots: { fragmentIds: [UUID] }, confidence: 'high' },
                { observedIds: collectObservedIds({ workingSet: [{ id: UUID }] }, [], 'update both') },
            );

            expect(r.ok).to.equal(true);
        });

        it('accepts an id the user pasted in the current message', () => {
            const r = validateEnvelope(
                { intent: 'bulk_publish_cards', slots: { fragmentIds: [UUID] }, confidence: 'high' },
                { observedIds: collectObservedIds({}, [], `publish ${UUID}`) },
            );

            expect(r.ok).to.equal(true);
        });

        it('accepts ids the assistant surfaced in an earlier turn', () => {
            const history = [{ role: 'assistant', content: `I found one card: ${UUID2}` }];
            const r = validateEnvelope(
                { intent: 'bulk_publish_cards', slots: { fragmentIds: [UUID2] }, confidence: 'high' },
                { observedIds: collectObservedIds({}, history, 'publish it') },
            );

            expect(r.ok).to.equal(true);
        });

        it('accepts ids carried by the last operation', () => {
            const r = validateEnvelope(
                { intent: 'bulk_publish_cards', slots: { fragmentIds: [UUID] }, confidence: 'high' },
                { observedIds: collectObservedIds({ lastOperation: { fragmentIds: [UUID] } }, [], 'publish them') },
            );

            expect(r.ok).to.equal(true);
        });

        it('matches ids case-insensitively', () => {
            const r = validateEnvelope(
                { intent: 'bulk_publish_cards', slots: { fragmentIds: [UUID.toUpperCase()] }, confidence: 'high' },
                { observedIds: collectObservedIds({ workingSet: [{ id: UUID }] }, [], 'publish') },
            );

            expect(r.ok).to.equal(true);
        });

        it('leaves read-only intents alone, where a wrong id merely returns nothing', () => {
            const r = validateEnvelope(
                { intent: 'get_card', slots: { id: FAKE }, confidence: 'high' },
                { observedIds: collectObservedIds({}, [], 'show me that card') },
            );

            expect(r.ok).to.equal(true);
        });

        it('tolerates malformed context and history without throwing', () => {
            const bad = () => collectObservedIds({ workingSet: 'nope', lastOperation: { fragmentIds: 7 } }, 'nope', null);

            expect(bad).to.not.throw();
            expect(bad().size).to.equal(0);
        });

        it('stays inert when the caller supplies no provenance', () => {
            const r = validateEnvelope({
                intent: 'bulk_update_cards',
                slots: { fragmentIds: [FAKE] },
                confidence: 'high',
            });

            expect(r.ok).to.equal(true);
        });
    });
});
