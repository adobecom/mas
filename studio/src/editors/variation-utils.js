import { html, nothing } from 'lit';
import { Fragment } from '../aem/fragment.js';
import { toAttribute } from '../aem/tag-path-utils.js';
import { getLocaleByCode } from '../../../io/www/src/fragment/locales.js';
import { TAG_PROMOTION_PREFIX, VARIATION_TYPES } from '../constants.js';

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

function normalizeGroupedPreviewLocaleCode(tagValue) {
    const localeCode = tagValue?.split('/').pop()?.trim();
    return getLocaleByCode(localeCode) ? localeCode : null;
}

export function groupedPreviewLocales(fragment) {
    if (!isGroupedVariationFragment(fragment)) return [];
    const tags = fragment?.getFieldValues?.('pznTags') || [];
    const localeCodes = [...new Set(tags.map(normalizeGroupedPreviewLocaleCode).filter(Boolean))];
    return localeCodes.map((code) => {
        const locale = getLocaleByCode(code);
        return {
            code,
            lang: locale.lang,
            country: locale.country,
            label: `${locale.country} (${locale.lang.toUpperCase()})`,
        };
    });
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
