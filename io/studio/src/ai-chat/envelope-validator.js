import { SLOT_VALIDATORS, META_INTENTS, getIntent, getNextIntentsForFlowStep } from './intent-registry.js';

const ALLOWED_CONFIDENCES = new Set(['high', 'medium', 'low']);

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function operationResultFor(turn) {
    let result = turn?.operationResult;
    if (turn?.role === 'tool' && typeof turn.content === 'string' && turn.content.length <= 64 * 1024) {
        try {
            result = JSON.parse(turn.content);
        } catch {
            return null;
        }
    }
    return result?.success === true ? result : null;
}

function selectorsInFields(fields) {
    const pending = [fields];
    const values = [];
    const add = (value) => {
        if (value != null) values.push(...(Array.isArray(value) ? value : [value]));
    };
    while (pending.length) {
        const value = pending.pop();
        if (typeof value === 'string') {
            for (const match of value.matchAll(/data-wcs-osi\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`=]+))/gi))
                add(match[1] ?? match[2] ?? match[3]);
        } else if (value && typeof value === 'object') {
            add(value.osi);
            if (value.name === 'osi') add(value.values);
            pending.push(...Object.values(value));
        }
    }
    return values.flatMap((value) =>
        typeof value === 'string'
            ? value
                  .split(',')
                  .map((part) => part.trim())
                  .filter(Boolean)
            : [value],
    );
}

/**
 * Gather every fragment id the request actually saw, so a state-changing
 * envelope can be checked against them.
 *
 * A model with no real ids in front of it will invent well-formed UUIDs to
 * fill a required slot — `uuid[]` validates the shape, so nothing else
 * catches it. Sources are the structured context the frontend sends, plus
 * any id typed by the user or carried by structured operation results, which is what the
 * deterministic identifier bypasses rely on.
 *
 * @param {object} context — request context (workingSet, cards, lastOperation)
 * @param {Array} conversationHistory — prior turns
 * @param {string} message — the current user message
 * @returns {Set<string>} lowercased ids
 */
export function collectObservedIds(context = {}, conversationHistory = [], message = '') {
    const ids = new Set();
    const add = (value) => {
        if (typeof value === 'string' && value) ids.add(value.toLowerCase());
    };
    const addFromText = (text) => {
        if (typeof text !== 'string') return;
        for (const match of text.matchAll(UUID_PATTERN)) add(match[0]);
    };

    const list = (value) => (Array.isArray(value) ? value : []);

    for (const item of list(context?.workingSet)) add(typeof item === 'string' ? item : item?.id);

    const cards = Array.isArray(context?.cards) ? context.cards : context?.cards ? [context.cards] : [];
    for (const card of cards) add(typeof card === 'string' ? card : card?.id);

    for (const id of list(context?.lastOperation?.fragmentIds)) add(id);

    for (const turn of list(conversationHistory)) {
        if (turn?.role === 'user') addFromText(turn.content);
        const result = operationResultFor(turn);
        if (!result) continue;
        for (const item of [
            ...list(result.results),
            ...list(result.updatedCards),
            ...list(result.rawResult?.cards),
            ...list(result.variations),
        ]) {
            if (item?.success !== false) add(item?.card?.id ?? item?.id);
        }
        for (const id of list(result.fragmentIds)) add(id);
        add(result.fragment?.id);
        add(result.parent?.id);
        add(result.newFragmentId);
        add(result.fragmentId);
    }
    addFromText(message);

    return ids;
}

/** User text is authorized input; structured data contributes only selector fields. */
export function collectObservedSelectors(context = {}, conversationHistory = [], message = '') {
    const selectors = new Set();
    const add = (value) => {
        for (const selector of Array.isArray(value) ? value : [value]) {
            if (typeof selector !== 'string') continue;
            for (const part of selector.split(',')) if (part.trim()) selectors.add(part.trim());
        }
    };
    const addUserText = (text) => {
        if (typeof text === 'string') for (const token of text.match(/[A-Za-z0-9_-]+/g) ?? []) selectors.add(token);
    };
    const pending = [context];
    for (const turn of Array.isArray(conversationHistory) ? conversationHistory : []) {
        if (turn?.role === 'user') addUserText(turn.content);
        const result = operationResultFor(turn);
        if (result) pending.push(result);
    }
    addUserText(message);
    while (pending.length) {
        const value = pending.pop();
        if (!value || typeof value !== 'object') continue;
        add(value.osi);
        add(value.offerSelectorId);
        add(value.selector?.id);
        add(selectorsInFields(value.fields));
        for (const [key, child] of Object.entries(value)) {
            if (key !== 'fields' && child && typeof child === 'object') pending.push(child);
        }
    }
    return selectors;
}

/** Slots the registry validates as ids, so new id slots are covered as they are added. */
function idSlotsFor(registered) {
    return Object.entries(registered.slot_validators ?? {})
        .filter(([, kind]) => kind === 'uuid' || kind === 'uuid[]')
        .map(([slot]) => slot);
}

function unobservedIds(registered, slots, observedIds) {
    const unseen = [];
    for (const slot of idSlotsFor(registered)) {
        const value = slots[slot];
        if (value == null) continue;
        for (const id of Array.isArray(value) ? value : [value]) {
            if (typeof id === 'string' && !observedIds.has(id.toLowerCase())) unseen.push(id);
        }
    }
    return unseen;
}

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

    const { intent, slots = {}, confidence, clarification_question = null, user_message = null } = raw;
    if (!slots || typeof slots !== 'object' || Array.isArray(slots)) return fail('slots-invalid', 'Could you say that again?');
    if (raw.missing_slots !== undefined && !Array.isArray(raw.missing_slots))
        return fail('missing-slots-invalid', 'Could you say that again?');
    const missing_slots = [...(raw.missing_slots ?? [])];

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

    // A state-changing intent may only act on ids the request actually saw.
    // Skipped when the caller supplies no provenance, so the validator stays
    // usable on its own.
    if (!isMeta && context.observedIds && registered.category === 'state-changing') {
        const unseen = unobservedIds(registered, slots, context.observedIds);
        if (unseen.length > 0) {
            return fail('ids-not-observed', "I don't have real ids for those cards yet. Want me to search for them first?", {
                attempted: intent,
                unobserved: unseen,
            });
        }
    }

    if (intent === 'update_card' && context.observedSelectors) {
        const values = selectorsInFields(slots.fields);
        if (values.some((value) => typeof value !== 'string' || !context.observedSelectors.has(value))) {
            return fail('osi-not-observed', 'Please select or provide the offer selector before updating the card.');
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
