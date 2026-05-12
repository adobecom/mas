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
import { normalizeVariantName } from './known-variants.js';

const KNOWN_SURFACE_NAMES = Object.values(SURFACES).map(({ name }) => name);

const UUID_RE = /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
const OSI_RE = /\b([A-Za-z0-9_-]{7,64})\b/g;
const OFFER_ID_RE = /\b([A-Fa-f0-9]{32})\b/;
const QUOTED_TITLE_RE = /(["'])([^"']{2,80})\1/;
const TITLED_VERB_RE =
    /\b(?:find|show|get|search|search for|look up|list|give me)\s+(?:me\s+|all\s+)?(?:cards?|fragments?)?\s*(?:(?:with\s+)?(?:fragment\s+)?(?:title|titled|named|called|matching|name))\s+(.+?)(?:\s+in\s+(?:acom|commerce|ccd|sandbox|adobe-home|express|nala|acom-cc|acom-dc)|\s+in\s+all\s+locales?|\s+across\s+all\s+locales?|\s*$)/i;
const CONTENT_VERB_RE =
    /\b(?:find|show|get|search|search\s+for|look\s+up|list|give\s+me)\s+(?:me\s+)?(?:all\s+)?(?:cards?|fragments?)\s+(?:that\s+)?(?:contain(?:ing|s)?|with|mentioning|about|having|reference(?:s|ing)?|including)\s+(.+?)(?:\s+in\s+(?:acom|commerce|ccd|sandbox|adobe-home|express|nala|acom-cc|acom-dc)|\s*$)/i;
// Words the user types when they want content matches (not titles). When any
// of these appear, the QUOTED_TITLE path must NOT win — it would otherwise
// hijack "usages of 'X'" into a title-only search that finds zero cards.
const CONTENT_SIGNAL_RE =
    /\b(?:usages?\s+of|instances?\s+of|occurrences?\s+of|references?\s+to|mentions?\s+of|appearances?\s+of|cards?\s+that\s+(?:mention|reference|contain|use)|fragments?\s+that\s+(?:mention|reference|contain|use))\b/i;
// Quoted phrase preceded by a content-signal verb → content search. Mirror
// the title-quoted shape but capture the phrase for use as a free-text query.
const CONTENT_QUOTED_RE =
    /\b(?:usages?\s+of|instances?\s+of|occurrences?\s+of|references?\s+to|mentions?\s+of|appearances?\s+of)\s+["']([^"']{2,120})["']/i;
const SEARCH_VERB_RE = /\b(?:find|show|get|search|look up|list|give me|grab|where(?:'s|\s+is)?)\b/i;
const SEARCH_NOUN_RE = /\b(?:cards?|fragments?)\b/i;

// Template / variant / type anchors. Each pattern captures the candidate
// variant token (which is then validated via normalizeVariantName — typos
// abstain back to the LLM). Two shapes are accepted:
//   1. anchor-before:  "template plans", "variant fries", "of type plans"
//   2. anchor-after:   "plans template", "plans-students variant"
// Trailing "in <surface>" is stripped from anchor-before captures.
const TEMPLATE_BEFORE_RE =
    /\b(?:template|variant|type|templates|variants|types)\s+([A-Za-z][A-Za-z0-9-]{0,40}(?:\s+[A-Za-z][A-Za-z0-9-]{0,40})?)(?:\s+(?:in|for)\s+(?:acom|commerce|ccd|sandbox|adobe-home|express|nala|acom-cc|acom-dc)|\s*$|\s+template|\s+variant|\s+type|\s+cards?|\s+fragments?)/i;
const TEMPLATE_AFTER_RE = /\b([A-Za-z][A-Za-z0-9-]{0,40})\s+(?:template|variant|type)s?\b/i;
const OSI_KEYWORD_RE = /\b(?:osi|offer\s+selector|os-id|wcs-osi)\b/i;
const OFFER_KEYWORD_RE = /\b(?:offer\s*id|offer-id)\b/i;
// Anchor words that signal the user wants the *variation graph* of a UUID,
// not just the card itself. Same UUID + this anchor → get_variations.
const VARIATIONS_ANCHOR_RE =
    /\b(?:variations?\s+of|variations?\s+from|grouped\s+variations?|from\s+parent|child(?:ren)?\s+of)\b/i;
const ALL_LOCALES_RE = /\b(?:in|across|for|over)\s+(?:all|every|each)\s+locales?\b/i;
const LOCALE_RE = /\b(?:in|for)\s+([a-z]{2}_[A-Z]{2,4})\b/;
// Trailing "in <surface>" / "for <surface>" so the user can override the
// folder-picker's currentSurface inline. Lowercased + matched against
// KNOWN_SURFACE_NAMES; anything else is left to existing logic.
// The trailing-punctuation class accepts the common end-of-sentence chars
// users type ('.', '?', '!', '"', "'", ',', ';', ':') in any combination
// plus trailing whitespace.
const TRAILING_SURFACE_RE = /\b(?:in|for)\s+([A-Za-z][A-Za-z-]+)\b[\s.!?"',;:]*$/i;
// Phrases that signal advanced query semantics the router cannot model
// safely (field-scoped search, exclusion, sorting, date ranges, top-N).
// The router CAN dispatch a search, but the user's actual intent is
// nuanced enough that dispatching a simplified version would silently
// return wrong results. Instead we abstain so the LLM can ask a
// clarifying question or compose a richer dispatch.
//
// Each clause here = a class of bug we'd otherwise be patching one-by-one:
//   - 'in the X field'        : field-scoped search
//   - 'only in description'   : same, alternate phrasing
//   - 'but not X' / 'excluding': boolean exclusion
//   - 'where X is Y'          : structured filter
//   - 'newer than' / 'before' : date-range
//   - 'first N' / 'last N'    : ordering + limit
//   - 'sort(ed) by'           : ordering
//   - 'group(ed) by'          : aggregation
// Field-scope phrasings — match "in description", "in the description",
// "in the description field", "in the title", "in the body", "in CTAs",
// "within a card's description", etc. The router can't deterministically
// execute field-scoped search; abstain so the LLM can either dispatch a
// clean all-field search or ask.
const FIELD_SCOPE_PHRASE = String.raw`(?:in|within)\s+(?:(?:a|the|some)\s+(?:cards?(?:'s|s')?\s+|fragments?(?:'s|s')?\s+)?)?(?:description|title|body|cta\s*s?|name|tag\s*s?)(?:\s+field)?`;
const COMPLEX_SCOPE_RE = new RegExp(
    String.raw`\b${FIELD_SCOPE_PHRASE}\b|\bin\s+the\s+\w+\s+field\b|\bonly\s+in\s+\w+|\bexcluding\b|\bbut\s+not\s+\w|\bwhere\s+\w+\s+(?:is|equals?|matches)\b|\bnewer\s+than\b|\bolder\s+than\b|\bbefore\s+\d|\bafter\s+\d|\bfirst\s+\d+\s+(?:cards?|fragments?)|\blast\s+\d+\s+(?:cards?|fragments?)|\bsort(?:ed)?\s+by\s+\w|\bgroup(?:ed)?\s+by\s+\w`,
    'i',
);

// Phrases that imply tag-based filtering or product-catalog lookups
// (product code, market segment, etc.). We abstain on these so the LLM
// path can resolve them via list_products / get_product_by_arrangement_code
// — deterministic substring matching can't satisfy these queries.
//
// All "code"-style anchors accept singular and plural to catch "PA codes",
// "product codes", "arrangement codes" etc. The trailing `\b` is dropped on
// these tokens so a plural 's' counts as part of the match.
const TAG_KEYWORD_RE =
    /\b(?:product\s*codes?|product\s*tags?|arrangement\s*codes?|tagged(?:\s+with)?|with\s+tags?|by\s+tags?|market\s*segments?|customer\s*segments?|pa\s*codes?|pa-\d|with\s+.+\s+as\s+(?:the\s+)?(?:product|tag|code)|as\s+(?:a\s+|the\s+)?(?:grouped\s+variation\s+)?tags?\b|as\s+(?:a\s+|the\s+)?grouped\s+variation\b)/i;

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

    // Abstain on complex query phrasings (field scope, exclusions, sorting,
    // date ranges, top-N). Dispatching a simplified version would silently
    // return wrong results. The LLM path is paid to either (a) compose a
    // richer dispatch, or (b) ask the user a clarifying question.
    if (COMPLEX_SCOPE_RE.test(trimmed)) {
        return empty;
    }

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
        // UUID + variation anchor → variation graph lookup, not a single card.
        if (VARIATIONS_ANCHOR_RE.test(trimmed)) {
            return {
                intent: 'variations-lookup',
                slots: { id: uuidMatch[1], locale },
                confidence: 0.99,
                missingSlot: null,
                dispatch: {
                    mcpTool: 'get_variations',
                    mcpParams: { id: uuidMatch[1] },
                },
            };
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

    // Template/variant detection runs BEFORE content-search. CONTENT_VERB_RE
    // matches "find cards with X" — and "X" can be "Plans template", which
    // would silently get dispatched as a full-text query instead of a
    // template filter. pickVariantCandidate only returns canonical names
    // (typos abstain), so it's safe to run before generic content matching.
    const variantToken = pickVariantCandidate(trimmed);
    if (variantToken) {
        const canonical = normalizeVariantName(variantToken);
        // An explicit "in <surface>" / "for <surface>" at the end overrides
        // the folder-picker's current surface — the user is telling us where
        // to look, regardless of where they're standing.
        const overrideSurface = extractTrailingSurface(trimmed) || surface;
        return buildVariantDispatch(canonical, overrideSurface, locale, HIGH_CONFIDENCE);
    }

    // Quoted phrase preceded by a content-signal verb ("usages of 'X'",
    // "occurrences of 'X'") — dispatch as content-search BEFORE the generic
    // QUOTED_TITLE path can hijack it into a title-only search. This is the
    // structural fix for "Find all usages of 'get 20+ apps'" returning zero
    // results because the query was wrongly post-filtered on title.
    const contentQuoted = trimmed.match(CONTENT_QUOTED_RE);
    if (contentQuoted) {
        const term = stripTrailingPunctuation(contentQuoted[1]);
        if (term) {
            return buildContentDispatch(term, surface, locale, HIGH_CONFIDENCE);
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
    // QUOTED_TITLE only fires when there's NO content-search signal. A
    // message like 'usages of "X"' has a quoted phrase but the user wants
    // content matches, not titles — let the LLM (or the CONTENT_QUOTED
    // path above) handle it instead.
    if (quotedMatch && hasSearchAnchor(trimmed) && !CONTENT_SIGNAL_RE.test(trimmed)) {
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
    if (pending.intent === 'variant-search') {
        return buildVariantDispatchFromSlots(slots, pending.confidence);
    }
    return buildTitleDispatchFromSlots(slots, pending.confidence);
}

/**
 * Sanity gate for captured query strings. The regex-based content and title
 * detectors can leak garbage when phrasing exceeds their assumed shape — a
 * dangling close-quote, a stop-word stack, an "in" leftover from a scope
 * qualifier. The gate (a) strips harmless noise (stray quotes), and (b)
 * abstains entirely on patterns that signal the user wants advanced
 * semantics we don't model.
 *
 * Returns the cleaned query string if it's safe, or null if the dispatch
 * should be aborted. The builders treat null as "abstain → emptyResult".
 */
function sanitizeQuery(rawQuery) {
    if (typeof rawQuery !== 'string') return null;
    let q = rawQuery.trim();
    if (!q) return null;
    // Strip stray quotes/backticks anywhere in the string. Quoted phrases
    // are handled by the EXACT_PHRASE detection elsewhere; for content and
    // title captures the quotes are just noise.
    q = q.replace(/[`"']/g, '').trim();
    if (!q) return null;
    // Starts with a stop-word → capture started at the wrong token
    if (/^(?:and|or|but|the|with|in|of|to|for|from|by|at)\b/i.test(q)) return null;
    // Contains a scope-qualifier leftover (e.g. "photoshop in the description").
    // Abstain so the LLM clarifies or composes a richer dispatch. Uses the
    // same field-scope detector as COMPLEX_SCOPE_RE — defense in depth.
    if (new RegExp(String.raw`\b${FIELD_SCOPE_PHRASE}\b|\bonly\s+in\s+\w+`, 'i').test(q)) return null;
    return q;
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
    const cleaned = sanitizeQuery(title);
    if (!cleaned) return emptyResult();
    const slots = { query: cleaned, locale, titleSearch: true };
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
            mcpParams: { query: cleaned, surface, locale, titleSearch: true },
        },
    };
}

function buildContentDispatch(term, surface, locale, confidence) {
    const cleaned = sanitizeQuery(term);
    if (!cleaned) return emptyResult();
    const slots = { query: cleaned, locale };
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
            mcpParams: { query: cleaned, surface, locale },
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

function buildVariantDispatch(variant, surface, locale, confidence) {
    const slots = { variant, locale };
    if (surface) slots.surface = surface;
    if (!surface) {
        return {
            intent: 'variant-search',
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
        intent: 'variant-search',
        slots,
        confidence,
        missingSlot: null,
        dispatch: {
            mcpTool: 'search_cards',
            mcpParams: { variant, surface, locale },
        },
    };
}

function buildVariantDispatchFromSlots(slots, confidence) {
    if (!slots.surface) return emptyResult();
    return {
        intent: 'variant-search',
        slots,
        confidence,
        missingSlot: null,
        dispatch: {
            mcpTool: 'search_cards',
            mcpParams: {
                variant: slots.variant,
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

/**
 * Pick a single variant token from a message that contains a template/variant/type
 * anchor word. Two shapes are tried; the picker returns the first candidate
 * whose normalized form is a known canonical variant. This is what disambiguates
 * "show me Plans template cards" — anchor-before matches "template cards"
 * (and "cards" is unknown), so we fall through to anchor-after which captures
 * "Plans" (which normalizes to a known canonical name).
 *
 * Returns the raw captured token (caller normalizes via normalizeVariantName).
 * Returns null when neither shape yields a known variant — the LLM path can
 * then handle complex compositions (e.g. "plans templates for Photoshop").
 */
function pickVariantCandidate(text) {
    const before = text.match(TEMPLATE_BEFORE_RE);
    if (before && before[1]) {
        const beforeToken = stripTrailingPunctuation(before[1]);
        if (normalizeVariantName(beforeToken)) {
            return beforeToken;
        }
    }
    const after = text.match(TEMPLATE_AFTER_RE);
    if (after && after[1]) {
        const afterToken = stripTrailingPunctuation(after[1]);
        if (normalizeVariantName(afterToken)) {
            return afterToken;
        }
    }
    return null;
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

/**
 * Extract an inline "in <surface>" / "for <surface>" override at the trailing
 * end of the message. Returns the canonical surface name (lowercased) or
 * null when no recognized surface appears.
 *
 * Currently called only from the variant-search path. Other detectors strip
 * trailing surfaces from their captures but don't yet honor the override —
 * keep this scoped until we have a single unified surface-resolution pass.
 */
function extractTrailingSurface(message) {
    const match = message.match(TRAILING_SURFACE_RE);
    if (!match) return null;
    const candidate = match[1].toLowerCase();
    return KNOWN_SURFACE_NAMES.includes(candidate) ? candidate : null;
}
