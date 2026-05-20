/**
 * Intent registry — single source of truth for what the AI Assistant can do.
 *
 * Every intent the assistant supports is declared here. The envelope validator,
 * the prompt builder, the frontend dispatcher, and the eval harness all read
 * from this file. Do not add intents elsewhere; add them here.
 *
 * Schema per entry:
 *   name                  string  — unique identifier, snake_case, dot-namespaced for flow steps
 *   category              string  — 'state-changing' | 'read-only' | 'guided-step' | 'meta'
 *   description           string  — one-sentence what-it-does, used in the LLM prompt
 *   required_slots        string[]
 *   optional_slots        string[]
 *   slot_validators       object  — slot name → validator key from SLOT_VALIDATORS
 *   tool_target           string|null — MCP tool to invoke, or null for non-MCP intents
 *   confirmation_template string|null — Mustache-style; required if category === 'state-changing'
 */

export const INTENTS = [];

/**
 * Multi-step flows are declared separately. Each flow has a name and an
 * ordered list of steps; each step lists the legal next intent names.
 */
export const FLOWS = [];

/**
 * Slot validators. Each validator is a pure function (value) => boolean.
 * Keep this list short and reuse keys across intents.
 */
export const SLOT_VALIDATORS = {
    uuid: (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    'uuid[]': (v) => Array.isArray(v) && v.length > 0 && v.every((x) => SLOT_VALIDATORS.uuid(x)),
    string: (v) => typeof v === 'string' && v.length > 0,
    'string[]': (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
    osi: (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{7,64}$/.test(v),
    offerId: (v) => typeof v === 'string' && /^[A-Fa-f0-9]{32}$/.test(v),
    surface: (v) => ['acom', 'commerce', 'ccd', 'sandbox', 'adobe-home', 'express', 'nala'].includes(v),
    locale: (v) => typeof v === 'string' && /^[a-z]{2}_[A-Z]{2,4}$/.test(v),
    paCode: (v) => typeof v === 'string' && /^PA-?\d+$/.test(v),
    boolean: (v) => typeof v === 'boolean',
};

/** Meta intents that exist outside any flow and may fire at any time. */
export const META_INTENTS = ['ASK_USER', 'ABORT', 'START_OVER', 'SHOW_HELP', 'REPORT_ERROR'];

export function getIntent(name) {
    return INTENTS.find((i) => i.name === name) || null;
}

export function getFlow(name) {
    return FLOWS.find((f) => f.name === name) || null;
}

export function getNextIntentsForFlowStep(flowName, stepName) {
    const flow = getFlow(flowName);
    if (!flow) return null;
    const step = flow.steps.find((s) => s.name === stepName);
    return step ? step.next_intents : null;
}

export function isStateChanging(intentName) {
    const intent = getIntent(intentName);
    return intent?.category === 'state-changing';
}
