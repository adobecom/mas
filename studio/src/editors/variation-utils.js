import { html, nothing } from 'lit';
import { Fragment } from '../aem/fragment.js';
import { toAttribute } from '../aem/tag-path-utils.js';
import { getLocaleByCode, getLocaleCode, getSurfaceLocales } from '../../../io/www/src/fragment/locales.js';
import { TAG_PROMOTION_PREFIX, VARIATION_TYPES } from '../constants.js';
import { getCtaEmphasis } from '../rte/link-variant-utils.js';

/* ---------- pure helpers ---------- */

export function isGroupedVariationFragment(fragment) {
    return Fragment.isGroupedVariationPath(fragment?.path);
}

export function effectiveIsVariation(fragment, localeDefaultFragment, isVariation) {
    return (isVariation || isGroupedVariationFragment(fragment)) && localeDefaultFragment != null;
}

export function getEffectiveFieldValue(fragment, localeDefaultFragment, isVariation, fieldName, index = 0) {
    return fragment?.getEffectiveFieldValue(fieldName, localeDefaultFragment, isVariation, index);
}

export function getEffectiveFieldValues(fragment, localeDefaultFragment, isVariation, fieldName) {
    return fragment?.getEffectiveFieldValues(fieldName, localeDefaultFragment, isVariation) ?? [];
}

export function isFieldOverridden(fragment, localeDefaultFragment, isVariation, fieldName) {
    return fragment?.isFieldOverridden(fieldName, localeDefaultFragment, isVariation) ?? false;
}

export function getFieldState(fragment, localeDefaultFragment, isVariation, fieldName) {
    return fragment?.getFieldState(fieldName, localeDefaultFragment, isVariation);
}

export function pznTagsValue(fragment) {
    const values =
        fragment?.getFieldValues?.('pznTags') || fragment?.fields?.find((field) => field.name === 'pznTags')?.values || [];
    return values.filter(Boolean).join(',');
}

export function normalizePznTagIds(value) {
    const rawValues = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
    return [
        ...new Set(
            rawValues
                .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
                .map((entry) => entry.trim())
                .filter(Boolean)
                .map((entry) => toAttribute([entry]))
                .filter(Boolean),
        ),
    ];
}

/**
 * Resolve a bare `pzn/country/<CC>` tag leaf to the surface's `<lang>_<CC>` locale so a country
 * tag previews like the equivalent locale tag (e.g. `au` → `en_AU`). Countries served in several
 * languages (e.g. `CA` → `en_CA`/`fr_CA`) resolve to `preferredLang` when it matches.
 * @param {string} [leaf] - country segment of a pzn/country tag, e.g. `au`
 * @param {string} [surface] - e.g. `acom`
 * @param {string} [preferredLang] - language to prefer for multi-language countries
 * @returns {string|null}
 */
export function countryTagLeafToLocaleCode(leaf, surface, preferredLang) {
    if (!leaf || !surface) return null;
    const country = leaf.toUpperCase();
    const matches = getSurfaceLocales(surface).filter((locale) => locale.country === country);
    if (!matches.length) return null;
    return getLocaleCode(matches.find((locale) => locale.lang === preferredLang) ?? matches[0]);
}

/**
 * Resolve a pzn tag to a preview locale code: a `pzn/locale/<xx_YY>` tag passes through, a bare
 * `pzn/country/<CC>` tag maps to the surface locale (see {@link countryTagLeafToLocaleCode}), and
 * anything else returns null. Single source of truth for every grouped-variation preview consumer.
 * @param {string} [tag] - pzn tag id or path
 * @param {string} [surface] - e.g. `acom`
 * @param {string} [preferredLang] - language to prefer for multi-language countries
 * @returns {string|null}
 */
export function normalizePznTagToLocaleCode(tag, surface, preferredLang) {
    const leaf = tag?.split('/').pop()?.trim();
    if (getLocaleByCode(leaf)) return leaf;
    return countryTagLeafToLocaleCode(leaf, surface, preferredLang);
}

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Emphasis tag for a parsed CTA anchor: prefers a real <strong>/<em> wrapper - how headless CTAs
 *  store bold/italic (see rte-field.js's #marksForHeadlessVariant), so Milo can map it to the
 *  context-appropriate button style - falling back to the variant-class heuristic for CTAs
 *  authored under the older class-driven button-style system (see {@link getCtaEmphasis}). */
function ctaEmphasisTag(a) {
    const parentTag = a.parentElement?.tagName;
    if (parentTag === 'STRONG') return 'strong';
    if (parentTag === 'EM') return 'em';
    const emphasis = getCtaEmphasis(a.getAttribute('class') || '');
    return emphasis === 'bold' ? 'strong' : emphasis === 'italic' ? 'em' : null;
}

/** Parses CTA HTML and returns an array of `{ text, href, key, className, formattedText }` objects,
 *  one per anchor. Uses a <template> element so checkout-link custom elements are never upgraded and
 *  their attributes (href, data-key, data-wcs-osi, …) are preserved exactly as stored.
 *  `formattedText` mirrors `text` but wrapped in `<strong>`/`<em>` per {@link ctaEmphasisTag}, for
 *  callers (e.g. Copy Field) that want to preserve the CTA's visual weight outside the editor. */
export function parseCtas(html) {
    if (!html || typeof html !== 'string') return [];
    const template = document.createElement('template');
    template.innerHTML = html;
    return [...template.content.querySelectorAll('a')]
        .map((a) => {
            const text = a.textContent.trim();
            const tag = ctaEmphasisTag(a);
            const escaped = escapeHtml(text);
            return {
                text,
                href: a.getAttribute('href') || '',
                key: a.getAttribute('data-key'),
                className: a.getAttribute('class') || '',
                formattedText: tag ? `<${tag}>${escaped}</${tag}>` : escaped,
            };
        })
        .filter(({ text, href }) => text || href);
}

/** Reference-key problems in a list of parsed CTAs (see {@link parseCtas}): anchors missing a
 *  `data-key`, and keys shared by more than one anchor. Both break `cta[<key>]` references. */
export function getCtaKeyIssues(ctas = []) {
    const counts = new Map();
    let missingCount = 0;
    for (const { key } of ctas) {
        if (!key) {
            missingCount += 1;
            continue;
        }
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const duplicateKeys = [...counts.entries()].filter(([, n]) => n > 1).map(([key]) => key);
    return { missingCount, duplicateKeys, hasIssues: missingCount > 0 || duplicateKeys.length > 0 };
}

/** Human-readable summary of {@link getCtaKeyIssues} counts, e.g. "2 without a reference key, 1 duplicated". */
export function summarizeCtaKeyIssues({ missingCount = 0, duplicateKeys = [] } = {}) {
    const parts = [];
    if (missingCount) parts.push(`${missingCount} without a reference key`);
    if (duplicateKeys.length) parts.push(`${duplicateKeys.length} duplicated`);
    return parts.join(', ');
}

export function listLocaleVariations(fragment) {
    return fragment?.listLocaleVariations?.() || [];
}

export function listPromotionVariations(fragment) {
    if (fragment?.listPromotionVariations) return fragment.listPromotionVariations();
    const variationPaths = fragment?.getVariations?.() || [];
    const references = fragment?.references || [];
    if (!variationPaths.length || !references.length) return [];

    const referencesByPath = new Map(references.map((ref) => [ref.path, ref]));
    return variationPaths
        .filter((path) => !Fragment.isGroupedVariationPath(path))
        .map((path) => referencesByPath.get(path))
        .filter((ref) => ref?.tags?.some((tag) => tag.id?.startsWith(TAG_PROMOTION_PREFIX)));
}

export function listGroupedVariations(fragment) {
    return fragment?.listGroupedVariations?.() || [];
}

export const VARIATION_TABS = [
    { id: 'locale', label: VARIATION_TYPES.LOCALE, list: listLocaleVariations },
    { id: 'promotion', label: 'Promotion', list: listPromotionVariations },
    { id: 'grouped', label: VARIATION_TYPES.GROUPED, list: listGroupedVariations },
];

export function getVariationTabItems(fragment, tabId) {
    return VARIATION_TABS.find((tab) => tab.id === tabId)?.list(fragment) || [];
}

export function hasAnyVariationTabItems(fragment) {
    return VARIATION_TABS.some((tab) => tab.list(fragment).length > 0);
}

export function getGroupedVariationTagsValue(variationFragment) {
    return pznTagsValue(variationFragment);
}

export function getPromotionCode(variationFragment) {
    return variationFragment?.fields?.find((field) => field.name === 'promoCode')?.values?.[0] || '';
}

export function getTagsFieldState({ fragment, localeDefaultFragment, isVariation }) {
    if (!effectiveIsVariation(fragment, localeDefaultFragment, isVariation)) return 'no-parent';
    const ownTags = (fragment.newTags || fragment.tags.map((t) => t.id)).slice().sort().join(',');
    const parentTags =
        localeDefaultFragment?.tags
            .map((t) => t.id)
            .sort()
            .join(',') || '';
    if (!ownTags && !parentTags) return 'inherited';
    if (!ownTags) return 'inherited';
    return ownTags === parentTags ? 'same-as-parent' : 'overridden';
}

/* ---------- render helpers ---------- */

export function renderOverrideIndicatorLink(onReset) {
    return html`
        <div class="field-status-indicator">
            <sp-icon-unlink class="field-status-icon"></sp-icon-unlink>
            <span class="field-status-label">Overridden.</span>
            <a
                href="#"
                class="field-status-restore-link"
                @click=${(event) => {
                    event.preventDefault();
                    onReset?.();
                }}
                ><span class="field-status-restore-link-prefix" aria-hidden="true">Overridden. </span>
                <span class="field-status-restore-link-text">Click to restore.</span></a
            >
        </div>
    `;
}

export function renderInheritedIndicatorLink(onOverride) {
    return html`
        <div class="field-status-indicator">
            <sp-icon-link class="field-status-icon field-status-inherited-link"></sp-icon-link>
            <a
                href="#"
                class="field-status-restore-link"
                @click=${(event) => {
                    event.preventDefault();
                    onOverride?.();
                }}
                >Click to override.</a
            >
        </div>
    `;
}

export function renderFieldStatusIndicator({ state, onReset, onOverride }) {
    if (state === 'overridden' || state === 'same-as-parent') return renderOverrideIndicatorLink(onReset);
    if (state === 'inherited') return renderInheritedIndicatorLink(onOverride);
    return nothing;
}

export function renderTagsStatusIndicator({ state, onReset }) {
    if (state !== 'overridden') return nothing;
    return renderOverrideIndicatorLink(onReset);
}

export function renderGroupedVariationTagsTemplate({ fragment, readonly, onChange }) {
    if (!isGroupedVariationFragment(fragment)) return nothing;
    return html`
        <sp-field-group id="grouped-variation-tags">
            <sp-field-label>Grouped variation tags</sp-field-label>
            <aem-tag-picker-field
                selection="checkbox-tags"
                display-value
                ?readonly=${readonly}
                label="Locale tags"
                namespace="/content/cq:tags/mas"
                top="locale,pzn"
                multiple
                value="${pznTagsValue(fragment)}"
                @change=${onChange}
            ></aem-tag-picker-field>
        </sp-field-group>
    `;
}

/**
 * Wraps an `aem-tag-picker-field` change event into the normalized
 * pznTags array and updates the given fragment store.
 */
export function handlePznTagsChange(fragmentStore, event) {
    if (!fragmentStore) return;
    const normalized = normalizePznTagIds(event.target.value);
    fragmentStore.updateField('pznTags', normalized);
}
