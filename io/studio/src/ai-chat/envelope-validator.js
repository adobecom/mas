import { INTENTS, FLOWS, SLOT_VALIDATORS, META_INTENTS, getIntent, getNextIntentsForFlowStep } from './intent-registry.js';

const ALLOWED_CONFIDENCES = new Set(['high', 'medium', 'low']);

/**
 * Validate and coerce an LLM envelope.
 *
 * Returns `{ ok: true, envelope }` if the envelope is structurally valid AND
 * legal under the current flow state. Returns `{ ok: false, reason, coerced }`
 * if not — `coerced` is an ASK_USER envelope that the dispatcher can render
 * directly so the user always sees a sensible response.
 *
 * @param {object} raw     — parsed JSON from the LLM
 * @param {object} context — request context, must include `flow` (may be null)
 * @returns {{ok: boolean, envelope?: object, reason?: string, coerced?: object}}
 */
export function validateEnvelope(raw, context = {}) {
    if (!raw || typeof raw !== 'object') {
        return fail('not-an-object', 'I had trouble understanding the response. Could you rephrase?');
    }

    const { intent, slots = {}, confidence, missing_slots = [], clarification_question = null, user_message = null } = raw;

    if (typeof intent !== 'string') return fail('intent-missing', 'Could you say that again?');
    if (!ALLOWED_CONFIDENCES.has(confidence)) return fail('bad-confidence', 'Could you say that again?');

    const isMeta = META_INTENTS.includes(intent);
    const registered = getIntent(intent);
    if (!isMeta && !registered) {
        return fail('intent-not-in-registry', `I don't support "${intent}" yet. Try rephrasing.`, { attempted: intent });
    }

    if (!isMeta) {
        for (const slot of registered.required_slots) {
            if (!(slot in slots) || slots[slot] === null || slots[slot] === undefined) {
                missing_slots.push(slot);
            } else {
                const validatorKey = registered.slot_validators[slot];
                const validator = SLOT_VALIDATORS[validatorKey];
                if (validator && !validator(slots[slot])) {
                    return fail(
                        'slot-invalid',
                        `The value for "${slot}" doesn't look right. Could you search for that first?`,
                        { slot, value: slots[slot] },
                    );
                }
            }
        }
        for (const [slot, value] of Object.entries(slots)) {
            if (registered.required_slots.includes(slot)) continue;
            if (!registered.optional_slots.includes(slot)) continue;
            const validatorKey = registered.slot_validators[slot];
            const validator = SLOT_VALIDATORS[validatorKey];
            if (validator && value != null && !validator(value)) {
                return fail('slot-invalid', `The value for "${slot}" doesn't look right.`, { slot, value });
            }
        }
    }

    if (context.flow?.active) {
        const legal = getNextIntentsForFlowStep(context.flow.active, context.flow.step) || [];
        const allowed = new Set([...legal, ...META_INTENTS]);
        if (!allowed.has(intent)) {
            return fail('flow-step-illegal', `You're in the middle of ${context.flow.active}. Continue, or cancel?`, {
                flow: context.flow,
                attempted: intent,
            });
        }
    }

    return {
        ok: true,
        envelope: { intent, slots, confidence, missing_slots, clarification_question, user_message },
    };
}

function fail(reason, friendlyMessage, extra = {}) {
    return {
        ok: false,
        reason,
        coerced: {
            intent: 'ASK_USER',
            slots: {},
            confidence: 'low',
            missing_slots: [],
            clarification_question: friendlyMessage,
            user_message: null,
            debug: { reason, ...extra },
        },
    };
}
