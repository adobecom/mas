/**
 * Canonical list of card templates/variants known to MAS Studio.
 *
 * The authoritative source is `TEMPLATE_PREVIEWS` in constants.js — every
 * variant that has a preview registered is, by definition, a real card
 * template. Deriving from that map keeps this list in sync automatically
 * when a new template is added.
 *
 * The deterministic search router and any UI affordance for template
 * matching should ask `isKnownVariant()` / `normalizeVariantName()` here
 * rather than maintain its own list. The MAS backend (`searchCards`
 * variant filter) accepts any string; this module guards UI dispatches
 * against typos and abstains for unknown templates so the LLM path can
 * handle ambiguity.
 */

import { TEMPLATE_PREVIEWS } from '../constants.js';

export const KNOWN_VARIANTS = Object.freeze(Object.keys(TEMPLATE_PREVIEWS));
const KNOWN_VARIANT_SET = new Set(KNOWN_VARIANTS);

/**
 * Check whether a candidate template/variant string is in the canonical set.
 * Comparison is case-insensitive on the lowercased canonical form.
 *
 * @param {string} candidate
 * @returns {boolean}
 */
export function isKnownVariant(candidate) {
    if (typeof candidate !== 'string') return false;
    return KNOWN_VARIANT_SET.has(candidate.trim().toLowerCase());
}

/**
 * Normalize a user-typed template name to its canonical lowercased form,
 * or return null if it doesn't match any known variant.
 *
 * Behaviors:
 *   - Trims whitespace and lowercases the input.
 *   - Accepts dash-separated multiword templates verbatim ("plans-students").
 *   - Accepts space-separated multiword input and converts to dashes
 *     ("plans students" → "plans-students").
 *   - Returns null on no match — caller should fall through to LLM rather
 *     than guess.
 *
 * @param {string} candidate
 * @returns {string|null}
 */
export function normalizeVariantName(candidate) {
    if (typeof candidate !== 'string') return null;
    const trimmed = candidate.trim().toLowerCase();
    if (!trimmed) return null;
    if (KNOWN_VARIANT_SET.has(trimmed)) return trimmed;
    const dashed = trimmed.replace(/\s+/g, '-');
    if (KNOWN_VARIANT_SET.has(dashed)) return dashed;
    return null;
}
