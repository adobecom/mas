const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FRAGMENT_ID_PARAMS = ['id', 'cardId', 'fragmentId'];
const FRAGMENT_IDS_PARAMS = ['fragmentIds', 'ids', 'cardIds'];

const TOOLS_REQUIRING_FRAGMENT_ID = new Set([
    'get_card',
    'publish_card',
    'unpublish_card',
    'update_card',
    'copy_card',
    'link_card_to_offer',
    'validate_card_offer',
    'get_variations',
    'list_variation_locales',
    'get_variation_parent',
    'get_card_with_variations',
    'create_locale_variation',
    'create_grouped_variation',
    'bulk_update_cards',
    'bulk_publish_cards',
    'preview_bulk_update',
    'preview_bulk_publish',
    'list_context_cards',
    'add_cards_to_collection',
]);

export function isValidFragmentId(value) {
    return typeof value === 'string' && UUID_RE.test(value);
}

export function validateFragmentIds(mcpTool, mcpParams) {
    if (!TOOLS_REQUIRING_FRAGMENT_ID.has(mcpTool)) return { ok: true };
    if (!mcpParams || typeof mcpParams !== 'object') return { ok: true };

    const invalid = [];

    for (const key of FRAGMENT_ID_PARAMS) {
        const value = mcpParams[key];
        if (value === undefined || value === null) continue;
        if (!isValidFragmentId(value)) invalid.push(value);
    }

    for (const key of FRAGMENT_IDS_PARAMS) {
        const value = mcpParams[key];
        if (!Array.isArray(value)) continue;
        for (const item of value) {
            if (!isValidFragmentId(item)) invalid.push(item);
        }
    }

    if (invalid.length === 0) return { ok: true };
    return { ok: false, invalid };
}

export function fragmentIdGuardMessage(invalid) {
    const sample = invalid
        .slice(0, 3)
        .map((v) => `"${v}"`)
        .join(', ');
    const suffix = invalid.length > 3 ? `, +${invalid.length - 3} more` : '';
    return `I can't run that — the card IDs I have (${sample}${suffix}) aren't valid fragment IDs. Please search for the cards first (e.g. \`find cards titled X\`) and then ask me to update them.`;
}
