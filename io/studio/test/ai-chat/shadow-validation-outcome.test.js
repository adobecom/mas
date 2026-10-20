const { expect } = require('chai');

let shadowValidationOutcome;

/**
 * Every healthy guided turn logged {"phase":"shadow-validation","ok":false,
 * "reason":"intent-missing"}. Nothing was wrong: guided payloads carry a type,
 * not an intent, so the envelope validator correctly declines them — that is
 * the guard which stops a coerced ASK_USER envelope hijacking a guided reply.
 *
 * But a log line saying ok:false on every successful turn is noise that will
 * mislead whoever reads these next, and it buries the failures that do matter.
 * The outcome now separates "this was not an envelope" from "an envelope failed
 * to validate", so the second is greppable.
 */
describe('ai-chat/shadow validation outcome', () => {
    before(async () => {
        ({ shadowValidationOutcome } = await import('../../src/ai-chat/index.js'));
    });

    it('reports a valid envelope', () => {
        expect(shadowValidationOutcome({ ok: true, envelope: { intent: 'search_cards' } })).to.equal('valid');
    });

    it('does not call a guided payload a failure', () => {
        // A guided_step has no intent field at all. That is the design, not a fault.
        expect(shadowValidationOutcome({ ok: false, reason: 'intent-missing' })).to.equal('not-an-envelope');
    });

    it('still reports a real validation failure', () => {
        expect(shadowValidationOutcome({ ok: false, reason: 'unknown-intent' })).to.equal('invalid');
        expect(shadowValidationOutcome({ ok: false, reason: 'illegal-in-flow' })).to.equal('invalid');
    });

    it('treats a missing validation as no outcome rather than a failure', () => {
        expect(shadowValidationOutcome(null)).to.equal(null);
        expect(shadowValidationOutcome(undefined)).to.equal(null);
    });
});
