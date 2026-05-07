/**
 * Deterministic search-intent classifier for the MAS AI assistant.
 *
 * Replaces LLM tool-calling for the common, high-confidence search patterns:
 *   - Fragment ID lookup (UUID v4 shape)
 *   - OSI lookup (base64url tokens, anchored by keyword for medium confidence)
 *   - AOS offer ID lookup (32-hex token)
 *   - Title search (quoted string or "find/show cards titled X" phrasing)
 *
 * Pure module — no Lit, no Store, no DOM. Unit-testable in isolation. The
 * caller (mas-chat) is responsible for dispatching the returned operation
 * and rendering follow-up prompts.
 *
 * Side note: AEM card fragments carry only `osi`. The `offerId` is an
 * AOS-side concept resolved by `get-offer-by-id`; if the user pastes a
 * 32-hex token we still classify it as a card lookup using `osi` (it is
 * the cards that interest them, not the offer record).
 */

import { extractKnownSurfaceFromPath } from './mas-chat-helpers.js';
import { SURFACES } from '../constants.js';

const KNOWN_SURFACE_NAMES = Object.values(SURFACES).map(({ name }) => name);

const UUID_RE = /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
const OSI_RE = /\b([A-Za-z0-9_-]{7,64})\b/g;
const OFFER_ID_RE = /\b([A-Fa-f0-9]{32})\b/;
const QUOTED_TITLE_RE = /(["'])([^"']{2,80})\1/;
const TITLED_VERB_RE =
    /\b(?:find|show|get|search|search for|look up|list|give me)\s+(?:me\s+)?(?:cards?|fragments?)?\s*(?:titled|named|called|matching)\s+(.+?)(?:\s+in\s+(?:acom|commerce|ccd|sandbox|adobe-home|express|nala|acom-cc|acom-dc)|\s*$)/i;
const CONTENT_VERB_RE =
    /\b(?:find|show|get|search|search\s+for|look\s+up|list|give\s+me)\s+(?:me\s+)?(?:all\s+)?(?:cards?|fragments?)\s+(?:that\s+)?(?:contain(?:ing|s)?|with|mentioning|about|having|reference(?:s|ing)?|including)\s+(.+?)(?:\s+in\s+(?:acom|commerce|ccd|sandbox|adobe-home|express|nala|acom-cc|acom-dc)|\s*$)/i;
const SEARCH_VERB_RE = /\b(?:find|show|get|search|look up|list|give me|grab|where(?:'s|\s+is)?)\b/i;
const SEARCH_NOUN_RE = /\b(?:cards?|fragments?)\b/i;
const OSI_KEYWORD_RE = /\b(?:osi|offer\s+selector|os-id|wcs-osi)\b/i;
const OFFER_KEYWORD_RE = /\b(?:offer\s*id|offer-id)\b/i;
const ALL_LOCALES_RE = /\b(?:in|across|for|over)\s+(?:all|every|each)\s+locales?\b/i;
const LOCALE_RE = /\b(?:in|for)\s+([a-z]{2}_[A-Z]{2,4})\b/;
// Phrases that imply tag-based filtering (product code, market segment, etc.).
// We abstain on these so the LLM path can resolve the tag via list_products
// and dispatch search_cards with the canonical tag id — deterministic
// substring matching can't satisfy these queries.
const TAG_KEYWORD_RE =
    /\b(?:product\s*code|product\s*tag|arrangement\s*code|tagged(?:\s+with)?|with\s+tag|by\s+tag|market\s*segment|customer\s*segment|pa\s*code|pa-\d|with\s+.+\s+as\s+(?:the\s+)?(?:product|tag|code))\b/i;

// Phrases that imply the user wants commercial records (WCS offers from AOS),
// not AEM cards. We abstain when "offer(s)" appears WITHOUT "card(s)" or
// "fragment(s)" — that's the LLM's job (it will route to search_offers via
// the OFFERS-vs-CARDS disambiguation rule in OPERATIONS_PREAMBLE).
//
// This guards against QUOTED_TITLE_RE hijacking a query like
// `show me all offers for "Firefly Pro Plus"` into a card title search.
const OFFERS_INTENT_RE = /\boffers?\b/i;
const CARDS_INTENT_RE = /\b(?:cards?|fragments?)\b/i;

const HIGH_CONFIDENCE = 0.85;
const MEDIUM_CONFIDENCE = 0.55;

/**
 * @typedef {Object} ClassifiedIntent
 * @property {'id-lookup'|'osi-lookup'|'offer-id-lookup'|'title-search'|'content-search'|'unknown'} intent
 * @property {{ id?: string, osi?: string, offerId?: string, query?: string,
 *              surface?: string, locale?: string, titleSearch?: boolean }} slots
 * @property {number} confidence
 * @property {{ slot: 'surface', prompt: string } | null} missingSlot
 * @property {{ mcpTool: string, mcpParams: object } | null} dispatch
 */

/**
 * Classify a user message into a deterministic search intent.
 *
 * Returns one of:
 *   - `{ dispatch }` populated → caller runs the deterministic backend call.
 *   - `{ missingSlot }` populated → caller renders the follow-up prompt and
 *     stashes the result; the next turn calls `resumeWithSlot`.
 *   - neither populated, `intent: 'unknown'` → caller falls through to the
 *     existing LLM path.
 *
 * @param {string} message  raw user text
 * @param {{ currentSurface?: string|null, currentLocale?: string|null }} context
 * @returns {ClassifiedIntent}
 */
export function classifySearchIntent(message, context = {}) {
    const empty = emptyResult();
    if (!message || typeof message !== 'string') return empty;

    const trimmed = message.trim();
    if (!trimmed) return empty;

    const surface = context.currentSurface || null;
    const locale = resolveLocale(trimmed, context.currentLocale || 'en_US');

    // Abstain on tag/product-code phrasings — those need MCS resolution which
    // only the LLM path knows how to do (via list_products + tag mapping).
    if (TAG_KEYWORD_RE.test(trimmed)) {
        return empty;
    }

    // Abstain when the user mentions "offers" without "cards" — they want
    // WCS commercial records (price/term/commitment), not AEM content. The
    // LLM path has the OFFERS-vs-CARDS disambiguation rule that routes to
    // search_offers. The router can't do this deterministically because
    // resolving a product name to an arrangement_code requires list_products.
    //
    // Note: keeping the abstain narrow — "offers AND cards" stays in the
    // router because the user may actually want to search cards by an
    // offer attribute, which is a card-search.
    if (OFFERS_INTENT_RE.test(trimmed) && !CARDS_INTENT_RE.test(trimmed)) {
        return empty;
    }

    // Abstain on bare product arrangement codes (e.g. "PA-1375"). A PA code
    // is a *product* identifier, never a card OSI — letting the router fire
    // here would hijack release / create-cards flows into a fruitless OSI
    // lookup. The LLM path resolves PA codes via get_product_by_arrangement_code.
    if (/^PA-\d+$/i.test(trimmed)) {
        return empty;
    }

    const uuidMatch = trimmed.match(UUID_RE);
    if (uuidMatch) {
        if (countMatches(trimmed, new RegExp(UUID_RE.source, 'gi')) > 1) {
            return { ...empty, confidence: 0.7 };
        }
        return {
            intent: 'id-lookup',
            slots: { id: uuidMatch[1], locale },
            confidence: 0.99,
            missingSlot: null,
            dispatch: {
                mcpTool: 'get_card',
                mcpParams: { id: uuidMatch[1] },
            },
        };
    }

    const offerIdMatch = trimmed.match(OFFER_ID_RE);
    const hasOfferKeyword = OFFER_KEYWORD_RE.test(trimmed);
    if (offerIdMatch && hasOfferKeyword) {
        return buildOsiDispatch(offerIdMatch[1], surface, locale, 0.9, 'offer-id-lookup');
    }

    const osiCandidate = pickOsiCandidate(trimmed);
    const hasOsiKeyword = OSI_KEYWORD_RE.test(trimmed);
    if (osiCandidate && hasOsiKeyword) {
        return buildOsiDispatch(osiCandidate, surface, locale, 0.95, 'osi-lookup');
    }

    if (osiCandidate && looksLikeBareOsi(trimmed, osiCandidate)) {
        return buildOsiDispatch(osiCandidate, surface, locale, MEDIUM_CONFIDENCE, 'osi-lookup');
    }

    const verbMatch = trimmed.match(TITLED_VERB_RE);
    if (verbMatch) {
        const title = stripTrailingPunctuation(verbMatch[1]);
        if (title) {
            return buildTitleDispatch(title, surface, locale, 0.8);
        }
    }

    const contentMatch = trimmed.match(CONTENT_VERB_RE);
    if (contentMatch) {
        const term = stripTrailingPunctuation(contentMatch[1]);
        if (term) {
            return buildContentDispatch(term, surface, locale, 0.8);
        }
    }

    const quotedMatch = trimmed.match(QUOTED_TITLE_RE);
    if (quotedMatch && hasSearchAnchor(trimmed)) {
        const title = stripTrailingPunctuation(quotedMatch[2]);
        if (title) {
            return buildTitleDispatch(title, surface, locale, HIGH_CONFIDENCE);
        }
    }

    return empty;
}

/**
 * Re-classify when the user replies to a missing-slot follow-up.
 *
 * Currently only the surface slot can be missing. The reply is parsed as
 * a known surface name; anything else returns `unknown` so the LLM gets
 * the next shot.
 *
 * @param {string} reply
 * @param {ClassifiedIntent} pending
 * @returns {ClassifiedIntent}
 */
export function resumeWithSlot(reply, pending) {
    const empty = emptyResult();
    if (!reply || !pending?.missingSlot) return empty;

    if (pending.missingSlot.slot !== 'surface') return empty;

    const normalized = String(reply).trim().toLowerCase();
    if (!KNOWN_SURFACE_NAMES.includes(normalized)) return empty;

    const slots = { ...pending.slots, surface: normalized };
    if (pending.intent === 'content-search') {
        return buildContentDispatchFromSlots(slots, pending.confidence);
    }
    return buildTitleDispatchFromSlots(slots, pending.confidence);
}

function buildOsiDispatch(osi, surface, locale, confidence, intent) {
    const slots = { osi, locale };
    if (surface) slots.surface = surface;
    return {
        intent,
        slots,
        confidence,
        missingSlot: null,
        dispatch: {
            mcpTool: 'search_cards',
            mcpParams: surface ? { osi, surface, locale } : { osi },
        },
    };
}

function buildTitleDispatch(title, surface, locale, confidence) {
    const slots = { query: title, locale, titleSearch: true };
    if (surface) slots.surface = surface;
    if (!surface) {
        return {
            intent: 'title-search',
            slots,
            confidence,
            missingSlot: {
                slot: 'surface',
                prompt: 'Which surface should I search? acom, commerce, ccd, or sandbox?',
            },
            dispatch: null,
        };
    }
    return {
        intent: 'title-search',
        slots,
        confidence,
        missingSlot: null,
        dispatch: {
            mcpTool: 'search_cards',
            mcpParams: { query: title, surface, locale, titleSearch: true },
        },
    };
}

function buildContentDispatch(term, surface, locale, confidence) {
    const slots = { query: term, locale };
    if (surface) slots.surface = surface;
    if (!surface) {
        return {
            intent: 'content-search',
            slots,
            confidence,
            missingSlot: {
                slot: 'surface',
                prompt: 'Which surface should I search? acom, commerce, ccd, or sandbox?',
            },
            dispatch: null,
        };
    }
    return {
        intent: 'content-search',
        slots,
        confidence,
        missingSlot: null,
        dispatch: {
            mcpTool: 'search_cards',
            mcpParams: { query: term, surface, locale },
        },
    };
}

function buildContentDispatchFromSlots(slots, confidence) {
    if (!slots.surface) return emptyResult();
    return {
        intent: 'content-search',
        slots,
        confidence,
        missingSlot: null,
        dispatch: {
            mcpTool: 'search_cards',
            mcpParams: {
                query: slots.query,
                surface: slots.surface,
                locale: slots.locale || 'en_US',
            },
        },
    };
}

function buildTitleDispatchFromSlots(slots, confidence) {
    if (!slots.surface) return emptyResult();
    return {
        intent: 'title-search',
        slots,
        confidence,
        missingSlot: null,
        dispatch: {
            mcpTool: 'search_cards',
            mcpParams: {
                query: slots.query,
                surface: slots.surface,
                locale: slots.locale || 'en_US',
                titleSearch: true,
            },
        },
    };
}

function pickOsiCandidate(text) {
    OSI_RE.lastIndex = 0;
    const candidates = [];
    let match;
    while ((match = OSI_RE.exec(text)) !== null) {
        const token = match[1];
        if (token.length < 7) continue;
        if (/^\d+$/.test(token)) continue;
        if (KNOWN_SURFACE_NAMES.includes(token.toLowerCase())) continue;
        if (!/[A-Za-z]/.test(token) || !/\d/.test(token)) continue;
        candidates.push(token);
    }
    return candidates.length === 1 ? candidates[0] : null;
}

function looksLikeBareOsi(text, candidate) {
    const stripped = text.replace(candidate, '').trim();
    return stripped.length === 0;
}

function hasSearchAnchor(text) {
    return SEARCH_VERB_RE.test(text) || SEARCH_NOUN_RE.test(text);
}

function stripTrailingPunctuation(value) {
    return String(value || '')
        .trim()
        .replace(/^["'`]+|["'`?!.,;:]+$/g, '')
        .trim();
}

function countMatches(text, re) {
    return (text.match(re) || []).length;
}

function emptyResult() {
    return {
        intent: 'unknown',
        slots: {},
        confidence: 0,
        missingSlot: null,
        dispatch: null,
    };
}

/**
 * Resolve the locale slot from message wording, falling back to the user's
 * current locale.
 * - "in all locales", "across all locales" → 'all' (backend scans every locale folder)
 * - "in fr_FR" / "for de_DE"                → that explicit locale
 * - otherwise                                → currentLocale
 */
function resolveLocale(message, currentLocale) {
    if (ALL_LOCALES_RE.test(message)) return 'all';
    const match = message.match(LOCALE_RE);
    if (match) return match[1];
    return currentLocale;
}
