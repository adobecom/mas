/**
 * Native-envelope resolution for the ai-chat action.
 *
 * When the model is forced to call the emit_envelope tool, the envelope
 * arrives as schema-validated tool arguments instead of JSON embedded in
 * prose. These helpers extract that envelope from a Foundry response and
 * map a validated envelope onto the response body shape the frontend
 * dispatcher already consumes. The intent registry stays the single source
 * of truth: tool targets and confirmation requirements come from it, never
 * from the model.
 */

import { getIntent, isStateChanging, META_INTENTS } from './intent-registry.js';
import { ENVELOPE_TOOL_NAME, SEARCH_TOOL_NAME } from './tool-definitions.js';
import { normalizeEscapedText } from './response-parser.js';
import { getVariantConfig } from './variant-configs.js';

const GENERIC_CLARIFICATION = 'Could you clarify what you would like me to do?';

// Words the model uses for a variation kind, mapped to the variationType enum.
const VARIATION_TYPE_ALIASES = {
    grouped: 'grouped',
    pzn: 'grouped',
    personalization: 'grouped',
    personalized: 'grouped',
    promo: 'promo',
    promotion: 'promo',
    promotional: 'promo',
    regional: 'locale-variations',
    locale: 'locale-variations',
    'locale-variations': 'locale-variations',
    'default-locale-only': 'default-locale-only',
    'variations-only': 'variations-only',
};

/** The variationType a token denotes, tolerating a trailing "variation(s)". */
function variationTypeFrom(token) {
    if (typeof token !== 'string') return null;
    const stripped = token
        .trim()
        .toLowerCase()
        .replace(/\s+variations?$/, '')
        .trim();
    return VARIATION_TYPE_ALIASES[stripped] ?? null;
}

/**
 * Reclassify an emit_search payload the model misfilled. Qwen reliably picks the
 * search tool but drops a template name into `query` and a variation kind into
 * `tags` or `query` instead of the typed `variant` / `variationType` fields. A
 * real tag is mas:-namespaced and a template is a known variant, so each misplaced
 * value is recognizable and moved to the field the search action actually reads.
 * Conservative: only exact, known values move; genuine free text is left alone.
 */
export function normalizeSearchSlots(slots) {
    if (!slots || typeof slots !== 'object') return slots;
    const next = { ...slots };

    // A bare variation word in tags is a misfill — real tags carry a `mas:` prefix.
    if (Array.isArray(next.tags)) {
        const realTags = [];
        for (const tag of next.tags) {
            const variationType = typeof tag === 'string' && !tag.includes(':') ? variationTypeFrom(tag) : null;
            if (variationType) {
                if (!next.variationType) next.variationType = variationType;
            } else {
                realTags.push(tag);
            }
        }
        if (realTags.length) next.tags = realTags;
        else delete next.tags;
    }

    // "grouped variations" as the whole query is a variationType, not free text.
    if (!next.variationType && typeof next.query === 'string') {
        const variationType = variationTypeFrom(next.query);
        if (variationType) {
            next.variationType = variationType;
            delete next.query;
        }
    }

    // A query that is exactly a known template name belongs in `variant`.
    if (!next.variant && typeof next.query === 'string') {
        const query = next.query.trim().toLowerCase();
        const candidate = query.replace(/\s+(?:template|cards?)$/, '').trim();
        const name = getVariantConfig(query) ? query : getVariantConfig(candidate) ? candidate : null;
        if (name) {
            next.variant = name;
            delete next.query;
        }
    }

    return next;
}

export function normalizeEnvelopeText(envelope) {
    if (!envelope) return envelope;
    const normalized = { ...envelope };
    for (const key of ['user_message', 'clarification_question']) {
        if (typeof normalized[key] === 'string') {
            normalized[key] = normalizeEscapedText(normalized[key]);
        }
    }
    return normalized;
}

export function extractToolEnvelope(response) {
    if (!response?.success || !response.toolUse) return null;
    // The typed search tool is sugar for a search_cards envelope: the model
    // fills first-class fields, which we route through the same path. Surfaces
    // are canonicalized to lowercase so getSurfacePath resolves them (the
    // envelope path does not pass through the operations-handler normalizer).
    if (response.toolUse.name === SEARCH_TOOL_NAME) {
        const slots = normalizeSearchSlots({ ...(response.toolUse.input ?? {}) });
        if (typeof slots.surface === 'string') slots.surface = slots.surface.trim().toLowerCase();
        if (Array.isArray(slots.surfaces)) {
            slots.surfaces = slots.surfaces.filter((s) => typeof s === 'string').map((s) => s.trim().toLowerCase());
        }
        return { intent: 'search_cards', slots, confidence: 'high' };
    }
    if (response.toolUse.name !== ENVELOPE_TOOL_NAME) return null;
    return response.toolUse.input ?? null;
}

export function buildEnvelopeResponseBody(envelope) {
    const intentDef = getIntent(envelope.intent);
    const isMeta = META_INTENTS.includes(envelope.intent);
    const needsClarification = Boolean(envelope.clarification_question) || (envelope.missing_slots?.length ?? 0) > 0;

    if (!isMeta && intentDef?.tool_target && !needsClarification) {
        return {
            type: 'studio_operation',
            operationName: intentDef.tool_target,
            operationParams: envelope.slots ?? {},
            message: normalizeEscapedText(envelope.user_message) || '',
            confirmationRequired: isStateChanging(envelope.intent),
        };
    }

    return {
        type: 'message',
        message:
            normalizeEscapedText(envelope.user_message) ||
            normalizeEscapedText(envelope.clarification_question) ||
            GENERIC_CLARIFICATION,
    };
}
