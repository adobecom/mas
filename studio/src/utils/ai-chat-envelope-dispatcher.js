/**
 * Envelope-based dispatcher helpers for the MAS Studio AI Assistant.
 *
 * Stage 3.2 cutover — the ai-chat action now returns an `envelope` field on
 * every response (intent + slots + confidence + meta). This module classifies
 * the envelope into one of:
 *
 *   - `meta`            — ASK_USER / ABORT / START_OVER / SHOW_HELP / REPORT_ERROR
 *   - `mcp`             — read-only or state-changing MCP intent, with a tool_target
 *   - `guided`          — guided-step intent inside a flow (release_create.*, attach_offer, etc.)
 *   - `unknown`         — intent not in the registry → fall back to old response.type
 *
 * Intent → MCP tool mapping is held inline. For state-changing/read-only intents
 * `tool_target` equals the intent name (per intent-registry.js); the few intents
 * with no tool_target are listed explicitly in NON_MCP_INTENTS.
 *
 * The old type-based path stays in place as a safety net — if envelope dispatch
 * throws, the caller catches and re-runs the old switch.
 */

export const META_INTENTS = new Set(['ASK_USER', 'ABORT', 'START_OVER', 'SHOW_HELP', 'REPORT_ERROR']);

/**
 * Intents whose tool_target is null in the registry. These have UI-side or
 * frontend-only handlers and never dispatch an MCP tool.
 */
export const NON_MCP_INTENTS = new Set([
    'attach_offer',
    'copy_card_link',
    'open_card_editor',
    'open_ost',
    'release_create.start',
    'release_create.set_product',
    'release_create.set_commitment',
    'release_create.list_offers',
    'release_create.no_offers',
]);

/**
 * State-changing intents — these need a confirmation gate before execution.
 * Mirrors `category: 'state-changing'` entries in intent-registry.js whose
 * tool_target is an actual MCP tool.
 */
export const STATE_CHANGING_INTENTS = new Set([
    'publish_card',
    'unpublish_card',
    'update_card',
    'copy_card',
    'bulk_update_cards',
    'bulk_publish_cards',
    'create_locale_variation',
    'create_grouped_variation',
    'create_offer_selector',
    'add_cards_to_collection',
    'create_collection',
    'link_card_to_offer',
    'create_tags',
    'create_translation_project',
    'submit_translation_project',
    'release_create.confirm',
]);

/**
 * Confirmation templates for state-changing intents. Mirrors the
 * `confirmation_template` field in intent-registry.js, kept here as a small
 * subset to avoid importing the full backend registry.
 */
const CONFIRMATION_TEMPLATES = {
    publish_card: 'Publish card {{id}} to production?',
    unpublish_card: 'Unpublish card {{id}}?',
    update_card: 'Update card {{id}}?',
    copy_card: 'Duplicate card {{id}}?',
    bulk_update_cards: 'Apply update to {{fragmentIds.length}} cards?',
    bulk_publish_cards: 'Publish {{fragmentIds.length}} cards to production?',
    create_locale_variation: 'Create {{locale}} variation of card {{parentId}}?',
    create_grouped_variation: 'Create grouped variation of card {{parentId}}?',
    create_offer_selector:
        'Create offer selector for {{productArrangementCode}} ({{customerSegment}}/{{marketSegment}}, {{offerType}})?',
    add_cards_to_collection: 'Add {{cardPaths.length}} cards to collection {{id}}?',
    create_collection: 'Create collection "{{title}}" at {{parentPath}}?',
    link_card_to_offer: 'Link card {{cardId}} to offer {{offerSelectorId}}?',
    create_tags: 'Create {{tags.length}} tags?',
    create_translation_project: 'Create translation project "{{title}}" for {{targetLocales.length}} locales?',
    submit_translation_project: 'Submit translation project {{id}}?',
    release_create_confirm: 'Create {{cardConfigs.length}} release cards?',
};

/**
 * Classify the envelope's intent for dispatch routing.
 *
 * @param {object} envelope
 * @returns {'meta'|'mcp-readonly'|'mcp-state-changing'|'guided'|'unknown'}
 */
export function classifyEnvelopeIntent(envelope) {
    if (!envelope || typeof envelope.intent !== 'string') return 'unknown';
    const { intent } = envelope;
    if (META_INTENTS.has(intent)) return 'meta';
    if (intent.includes('.') || NON_MCP_INTENTS.has(intent)) return 'guided';
    if (STATE_CHANGING_INTENTS.has(intent)) return 'mcp-state-changing';
    return 'mcp-readonly';
}

/**
 * Render a confirmation template against the envelope slots.
 *
 * @param {string} intent
 * @param {object} slots
 * @returns {string|null} - rendered template, or null if no template exists
 */
export function renderConfirmationTemplate(intent, slots = {}) {
    const tpl = CONFIRMATION_TEMPLATES[intent] ?? null;
    if (!tpl) return null;
    return tpl.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
        const path = key.split('.');
        let v = slots;
        for (const p of path) {
            if (v == null) return '';
            if (p === 'length' && Array.isArray(v)) return String(v.length);
            v = v[p];
        }
        return v == null ? '' : String(v);
    });
}
