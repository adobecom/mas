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

export const INTENTS = [
    // ===== Card CRUD =====
    {
        name: 'get_card',
        category: 'read-only',
        description: 'Fetch a single card by UUID.',
        required_slots: ['id'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'get_card',
        confirmation_template: null,
    },
    {
        name: 'search_cards',
        category: 'read-only',
        description: 'Search the AEM Content Fragment catalog for cards.',
        required_slots: [],
        optional_slots: ['query', 'titleSearch', 'surface', 'locale', 'tags', 'osi', 'limit', 'offset'],
        slot_validators: {
            query: 'string',
            titleSearch: 'boolean',
            surface: 'surface',
            locale: 'locale',
            tags: 'string[]',
            osi: 'osi',
        },
        tool_target: 'search_cards',
        confirmation_template: null,
    },
    {
        name: 'publish_card',
        category: 'state-changing',
        description: 'Publish a single card to production.',
        required_slots: ['id'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'publish_card',
        confirmation_template: 'Publish card {{id}} to production?',
    },
    {
        name: 'unpublish_card',
        category: 'state-changing',
        description: 'Unpublish a single card.',
        required_slots: ['id'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'unpublish_card',
        confirmation_template: 'Unpublish card {{id}}?',
    },
    {
        name: 'update_card',
        category: 'state-changing',
        description: 'Update fields of a single card.',
        required_slots: ['id', 'updates'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'update_card',
        confirmation_template: 'Update card {{id}}?',
    },
    {
        name: 'delete_card',
        category: 'state-changing',
        description: 'Permanently delete a card.',
        required_slots: ['id'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'delete_card',
        confirmation_template: 'PERMANENTLY delete card {{id}}? This cannot be undone.',
    },
    {
        name: 'copy_card',
        category: 'state-changing',
        description: 'Duplicate a card.',
        required_slots: ['id'],
        optional_slots: ['parentPath', 'title'],
        slot_validators: { id: 'uuid', parentPath: 'string', title: 'string' },
        tool_target: 'copy_card',
        confirmation_template: 'Duplicate card {{id}}?',
    },
    // ===== Bulk operations =====
    {
        name: 'bulk_update_cards',
        category: 'state-changing',
        description: 'Update fields across multiple cards in a single job.',
        required_slots: ['fragmentIds'],
        optional_slots: ['updates', 'textReplacements'],
        slot_validators: { fragmentIds: 'uuid[]' },
        tool_target: 'bulk_update_cards',
        confirmation_template: 'Apply update to {{fragmentIds.length}} cards?',
    },
    {
        name: 'bulk_publish_cards',
        category: 'state-changing',
        description: 'Publish multiple cards.',
        required_slots: ['fragmentIds'],
        optional_slots: ['action'],
        slot_validators: { fragmentIds: 'uuid[]' },
        tool_target: 'bulk_publish_cards',
        confirmation_template: 'Publish {{fragmentIds.length}} cards to production?',
    },
    {
        name: 'bulk_delete_cards',
        category: 'state-changing',
        description: 'Permanently delete multiple cards.',
        required_slots: ['fragmentIds'],
        optional_slots: [],
        slot_validators: { fragmentIds: 'uuid[]' },
        tool_target: 'bulk_delete_cards',
        confirmation_template: 'PERMANENTLY delete {{fragmentIds.length}} cards? This cannot be undone.',
    },
    {
        name: 'preview_bulk_update',
        category: 'read-only',
        description: 'Show what would change before running a bulk update.',
        required_slots: ['fragmentIds'],
        optional_slots: ['updates', 'textReplacements'],
        slot_validators: { fragmentIds: 'uuid[]' },
        tool_target: 'preview_bulk_update',
        confirmation_template: null,
    },
    {
        name: 'preview_bulk_publish',
        category: 'read-only',
        description: 'Show what would change before publishing multiple cards.',
        required_slots: ['fragmentIds'],
        optional_slots: ['action'],
        slot_validators: { fragmentIds: 'uuid[]' },
        tool_target: 'preview_bulk_publish',
        confirmation_template: null,
    },
    {
        name: 'preview_bulk_delete',
        category: 'read-only',
        description: 'Show what would be deleted before running a bulk delete.',
        required_slots: ['fragmentIds'],
        optional_slots: [],
        slot_validators: { fragmentIds: 'uuid[]' },
        tool_target: 'preview_bulk_delete',
        confirmation_template: null,
    },
    // ===== Variations =====
    {
        name: 'get_variations',
        category: 'read-only',
        description: 'Return the variation graph for a fragment.',
        required_slots: ['id'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'get_variations',
        confirmation_template: null,
    },
    {
        name: 'create_locale_variation',
        category: 'state-changing',
        description: 'Create a new locale variation of an existing fragment.',
        required_slots: ['parentId', 'locale'],
        optional_slots: ['title'],
        slot_validators: { parentId: 'uuid', locale: 'locale', title: 'string' },
        tool_target: 'create_locale_variation',
        confirmation_template: 'Create {{locale}} variation of card {{parentId}}?',
    },
    {
        name: 'create_grouped_variation',
        category: 'state-changing',
        description: 'Create a grouped (pzn) variation under a parent fragment.',
        required_slots: ['parentId'],
        optional_slots: ['title', 'tags'],
        slot_validators: { parentId: 'uuid', title: 'string', tags: 'string[]' },
        tool_target: 'create_grouped_variation',
        confirmation_template: 'Create grouped variation of card {{parentId}}?',
    },
    {
        name: 'get_card_with_variations',
        category: 'read-only',
        description: 'Return a card plus its full variation tree.',
        required_slots: ['id'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'get_card_with_variations',
        confirmation_template: null,
    },
    {
        name: 'list_variation_locales',
        category: 'read-only',
        description: 'List the locales for which a card has variations.',
        required_slots: ['id'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'list_variation_locales',
        confirmation_template: null,
    },
    {
        name: 'get_variation_parent',
        category: 'read-only',
        description: 'Return the parent fragment of a variation.',
        required_slots: ['id'],
        optional_slots: [],
        slot_validators: { id: 'uuid' },
        tool_target: 'get_variation_parent',
        confirmation_template: null,
    },
];

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
