import { PATH_TOKENS, PZN_FOLDER, TAG_PROMOTION_PREFIX, MAS_PRODUCT_CODE_PREFIX } from '../constants.js';
import { isPromoVariationPath } from '../promotions/promotion-model.js';
import { getCachedTagTitle } from './tag-cache.js';
import { formatProductCodeNestedTitle, normalizeTagId } from './tag-id-utils.js';
import { isVariationPathInParentLocaleFamily } from '../../../io/www/src/fragment/locales.js';
import {
    fieldValuesArePersistedExplicitEmpty,
    isExplicitEmptyField,
    isExplicitEmptySentinel,
    parentValuesHaveContent,
    toPersistedExplicitEmptyValues,
} from '../../../io/www/src/fragment/utils/explicit-empty.js';

/**
 * Whether a variation field stores an intentional empty override (persisted `explicit_empty`).
 * @param {Array} ownValues
 * @param {Array} parentValues
 * @returns {boolean}
 */
function isExplicitEmptyVariationValue(ownValues, parentValues) {
    if (fieldValuesArePersistedExplicitEmpty(ownValues)) {
        return parentValuesHaveContent(parentValues);
    }
    return false;
}

/**
 * Maps UI empty input (`['']`) to persisted sentinel when clearing inherited variation content.
 * @param {Array} encodedValues
 * @param {Fragment|null} parentFragment
 * @param {Array} parentValues
 * @param {string} fieldName
 * @param {boolean} isMultiple
 * @returns {Array}
 */
function resolveVariationStoredValues(encodedValues, parentFragment, parentValues, fieldName, isMultiple) {
    const isSingleEmptyString = encodedValues.length === 1 && encodedValues[0] === '';
    if (!parentFragment || !isSingleEmptyString || !parentValuesHaveContent(parentValues)) {
        return encodedValues;
    }
    if (!isExplicitEmptyField(fieldName) || isMultiple) {
        return encodedValues;
    }
    return toPersistedExplicitEmptyValues();
}

export class Fragment {
    path = '';
    hasChanges = false;
    status = '';

    fields = [];

    selected = false;

    initialValue;

    /**
     * @param {*} AEM Fragment JSON object
     */
    constructor(fragment) {
        this.refreshFrom(fragment);
    }

    getField(fieldName) {
        return this.fields.find((field) => field.name === fieldName);
    }

    getFieldValues(fieldName) {
        return this.getField(fieldName)?.values || [];
    }

    getFieldValue(fieldName, index = 0) {
        return this.getFieldValues(fieldName)?.[index];
    }

    isValueEmpty(values) {
        return values.length === 0 || values.every((v) => v === '' || v === null || v === undefined);
    }

    get variant() {
        return this.getFieldValue('variant');
    }

    get fragmentName() {
        return this.path.split('/').pop();
    }

    get statusVariant() {
        return this.status?.toLowerCase();
    }

    getTagTitle(id) {
        const tags = this.tags.filter((tag) => tag.id.includes(id));
        return tags[0]?.title;
    }

    getCurrentTagTitle(id) {
        const fieldTagValues = this.getField('tags')?.values;
        const rawTagIds = this.newTags ?? (fieldTagValues?.length ? fieldTagValues : null) ?? this.tags ?? [];
        const tagIds = rawTagIds.map(normalizeTagId).filter(Boolean);

        const matchingIds = tagIds.filter((tagId) => tagId.includes(id));
        if (!matchingIds.length) return undefined;

        const matchingId = [...matchingIds].sort((a, b) => b.length - a.length)[0];
        const tags = Array.isArray(this.tags) ? this.tags : [];

        const exactTag = tags.find((tag) => normalizeTagId(tag) === matchingId);
        const cachedTitle = getCachedTagTitle(matchingId);
        const fallbackTag = tags.find((tag) => {
            const tagId = normalizeTagId(tag);
            return tagId && (tagId.includes(matchingId) || matchingId.includes(tagId));
        });

        const title = exactTag?.title || cachedTitle || fallbackTag?.title;

        if (id === MAS_PRODUCT_CODE_PREFIX) {
            const nestedTitle = formatProductCodeNestedTitle(title, matchingId);
            if (nestedTitle) return nestedTitle;
        }

        if (title) return title;

        const fallback = matchingId.split('/').filter(Boolean).pop();
        return fallback
            ?.split(/[-_]/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    get locale() {
        const match = this.path.match(PATH_TOKENS);
        return match?.groups?.parsedLocale || '';
    }

    /**
     * Updates the fragment entirely while preserving the initial value & hasChange status if not specified
     * @param {object} fragmentData
     * @param {Boolean | undefined} hasChanges
     */
    replaceFrom(fragmentData, hasChanges) {
        const { offerData, groupedVariations, ...cloneableData } = fragmentData ?? {};
        const clonedData = structuredClone(cloneableData);
        Object.assign(this, clonedData);
        if (hasChanges === undefined) return;
        this.hasChanges = hasChanges;
    }

    refreshFrom(fragmentData) {
        this.replaceFrom(fragmentData, false);
        const { offerData, groupedVariations, ...cloneableData } = fragmentData ?? {};
        this.initialValue = structuredClone(cloneableData);
        this.newTags = undefined;
    }

    discardChanges() {
        if (!this.hasChanges) return;
        this.newTags = undefined;
        this.replaceFrom(this.initialValue, false);
    }

    updateFieldInternal(fieldName, value) {
        this[fieldName] = value ?? '';
        this.hasChanges = true;
    }

    getVariations() {
        return this.getFieldValues('variations') || [];
    }

    hasVariations() {
        const variations = this.getVariations();
        return variations.length > 0;
    }

    /**
     * Updates a field's values.
     * For variations: if values match parent exactly, resets to inherited state.
     * @param {string} fieldName - The field name to update
     * @param {Array} value - The new values
     * @param {Fragment|null} [parentFragment] - The parent fragment (for variations)
     * @returns {boolean|'reset'} - true if updated, false if no change, 'reset' if reset to parent
     */
    updateField(fieldName, value, parentFragment = null) {
        const existingField = this.getField(fieldName);
        const isTags = fieldName === 'tags';
        const parentField = parentFragment?.getField(fieldName);
        const isMultiple = parentField?.multiple === true || existingField?.multiple === true;
        const parentValues = parentField?.values || [];

        let encodedValues = value.map((entry) => (typeof entry === 'string' ? entry.normalize('NFC') : entry));
        encodedValues = resolveVariationStoredValues(encodedValues, parentFragment, parentValues, fieldName, isMultiple);
        if (!isExplicitEmptyField(fieldName)) {
            if (fieldValuesArePersistedExplicitEmpty(encodedValues)) {
                encodedValues = isMultiple ? [] : [''];
            } else {
                encodedValues = encodedValues.map((v) => (isExplicitEmptySentinel(v) ? '' : v));
            }
        }

        const isSingleEmptyString = encodedValues.length === 1 && encodedValues[0] === '';
        const allowVariationInheritEmptyWrite =
            parentFragment &&
            isExplicitEmptyField(fieldName) &&
            isSingleEmptyString &&
            !isMultiple &&
            parentValuesHaveContent(parentValues);

        // For variations: if values match parent exactly, reset to inherited state
        if (parentFragment) {
            const valuesMatchParent =
                encodedValues.length === parentValues.length && encodedValues.every((v, i) => v === parentValues[i]);

            if (valuesMatchParent) {
                // Reset field if it exists, or just confirm it should stay inherited
                this.resetFieldToParent(fieldName);
                return 'reset';
            }
        }

        const allowPersistedEmptyClear = fieldValuesArePersistedExplicitEmpty(encodedValues);

        if (existingField) {
            const { values } = existingField;
            if (
                values.length === 0 &&
                isSingleEmptyString &&
                !isMultiple &&
                !allowPersistedEmptyClear &&
                !allowVariationInheritEmptyWrite
            ) {
                return false;
            }
            // No change if values are identical
            if (values.length === encodedValues.length && values.every((v, i) => v === encodedValues[i])) {
                if (isTags) this.newTags = value;
                return false;
            }
            existingField.values = encodedValues;
            // Inherit multiple from parent field if not already set
            if (parentField?.multiple && !existingField.multiple) {
                existingField.multiple = true;
            }
        } else {
            // Only create new field if there's meaningful content
            // Exception: [''] is allowed as explicit clear sentinel for multi-value fields
            const hasContent =
                encodedValues.length && encodedValues.some((entry) => !isExplicitEmptySentinel(entry) && entry?.trim?.());
            // For a single-value field, [''] means 'inherit', and ['explicit_empty'] means 'overwritten' (intentionally cleared, don't inherit).
            // For a multi-value field [] (an empty list) means 'inherit', and [''] means 'overwritten'
            const allowMultiEmptyClear = isMultiple && isSingleEmptyString;
            if (!hasContent && !allowPersistedEmptyClear && !allowVariationInheritEmptyWrite && !allowMultiEmptyClear) {
                if (isTags) this.newTags = value;
                return false;
            }
            const newField = {
                name: fieldName,
                type: parentField?.type || (isTags ? 'tag' : 'text'),
                values: encodedValues,
            };
            // Inherit multiple from parent field
            if (parentField?.multiple) newField.multiple = true;
            if (isTags) newField.multiple = true;
            this.fields.push(newField);
        }

        this.hasChanges = true;
        if (isTags) this.newTags = value;
        return true;
    }

    getEffectiveFieldValue(fieldName, parentFragment, isVariation, index = 0) {
        const ownValue = this.getFieldValue(fieldName, index);
        if (isExplicitEmptyField(fieldName) && isExplicitEmptySentinel(ownValue)) {
            return '';
        }
        if (ownValue !== undefined && ownValue !== null && ownValue !== '') {
            return ownValue;
        }
        if (!parentFragment || !isVariation) {
            return ownValue;
        }
        return parentFragment.getFieldValue(fieldName, index);
    }

    getEffectiveFieldValues(fieldName, parentFragment, isVariation) {
        const ownField = this.getField(fieldName);
        const ownValues = ownField?.values || [];

        // [] (empty array) = inherit from parent if variation
        if (ownValues.length === 0) {
            if (!parentFragment || !isVariation) {
                return [];
            }
            const parentField = parentFragment.getField(fieldName);
            return parentField?.values || [];
        }

        // For [""] (single empty string):
        // - For multi-value fields (multiple: true): explicit clear sentinel → return empty array
        // - For single-value fields (multiple: false): AEM initializes empty fields this way → inherit from parent
        if (isExplicitEmptyField(fieldName) && fieldValuesArePersistedExplicitEmpty(ownValues)) {
            const isMultipleField = ownField?.multiple === true;
            if (isMultipleField || !parentFragment || !isVariation) {
                return [];
            }
            const parentValues = parentFragment.getFieldValues(fieldName) || [];
            return isExplicitEmptyVariationValue(ownValues, parentValues) ? [''] : [];
        }

        const isSingleEmptyString = ownValues.length === 1 && ownValues[0] === '';
        if (isSingleEmptyString) {
            // Multi-value fields use [''] as an explicit clear sentinel → resolve to empty.
            if (ownField?.multiple === true) {
                return [];
            }
            if (!parentFragment || !isVariation) {
                return [];
            }
            const parentField = parentFragment.getField(fieldName);
            return parentField?.values || [];
        }

        // Has actual values - return them
        return ownValues;
    }

    getFieldState(fieldName, parentFragment, isVariation) {
        if (!isVariation || !parentFragment) {
            return 'no-parent';
        }
        const ownField = this.getField(fieldName);
        const ownValues = ownField?.values || [];
        const parentValues = parentFragment.getFieldValues(fieldName) || [];

        // [] (empty array) = inherited
        if (ownValues.length === 0) {
            return 'inherited';
        }

        if (isExplicitEmptyField(fieldName) && fieldValuesArePersistedExplicitEmpty(ownValues)) {
            const isMultipleField = ownField?.multiple === true;
            if (isMultipleField) {
                return 'overridden';
            }
            return isExplicitEmptyVariationValue(ownValues, parentValues) ? 'overridden' : 'inherited';
        }

        const isSingleEmptyString = ownValues.length === 1 && ownValues[0] === '';
        if (isSingleEmptyString) {
            // Multi-value fields use [''] as an explicit clear sentinel → treated as an override.
            return ownField?.multiple === true ? 'overridden' : 'inherited';
        }

        // Has actual values - compare with parent
        const normalizeForComparison = (v) => {
            if (v === null || v === undefined) return '';
            if (typeof v === 'string') {
                return v
                    .normalize('NFC')
                    .trim()
                    .replace(/\s+role="[^"]*"/g, '')
                    .replace(/\s+aria-level="[^"]*"/g, '');
            }
            return String(v);
        };

        const areEqual =
            ownValues.length === parentValues.length &&
            ownValues.every((v, i) => normalizeForComparison(v) === normalizeForComparison(parentValues[i]));

        return areEqual ? 'same-as-parent' : 'overridden';
    }

    isFieldOverridden(fieldName, parentFragment, isVariation) {
        return this.getFieldState(fieldName, parentFragment, isVariation) === 'overridden';
    }

    /**
     * Prepares a variation fragment for saving by resetting fields that match parent values.
     * This ensures we don't save inherited values as explicit overrides.
     * @param {Fragment} parentFragment - The parent fragment to compare against
     * @returns {Fragment} A clone of this fragment with inherited fields reset to []
     */
    prepareVariationForSave(parentFragment) {
        if (!parentFragment) return this;

        // Create a new Fragment instance from this fragment's data (constructor handles cloning)
        const prepared = new Fragment(this);

        // Fields that should never be reset (they're fragment-specific, not inherited)
        const excludeFields = ['variations', 'tags', 'originalId', 'locReady', 'compatVersion'];

        for (const field of prepared.fields) {
            if (excludeFields.includes(field.name)) continue;

            if (isExplicitEmptyField(field.name) && fieldValuesArePersistedExplicitEmpty(field.values)) {
                continue;
            }

            const fieldState = this.getFieldState(field.name, parentFragment, true);

            // If field is inherited or same-as-parent, reset to empty array
            // Only keep values that are truly overridden (different from parent)
            if (fieldState === 'inherited' || fieldState === 'same-as-parent') {
                field.values = [];
            }
        }

        return prepared;
    }

    resetFieldToParent(fieldName) {
        const fieldIndex = this.fields.findIndex((field) => field.name === fieldName);
        if (fieldIndex !== -1) {
            this.fields.splice(fieldIndex, 1);
            this.hasChanges = true;
            return true;
        }
        return false;
    }

    /**
     * Checks whether a path is a grouped (pzn) variation path.
     * @param {string} path
     * @returns {boolean}
     */
    static isGroupedVariationPath(path) {
        return path?.includes(`/${PZN_FOLDER}/`) ?? false;
    }

    /**
     * Categorizes all variation references in a single pass into locale, promo, and grouped buckets.
     * Each variation is classified into exactly one category (grouped > promo > locale).
     * @returns {{ locale: Object[], promo: Object[], grouped: Object[] }}
     */
    #categorizeVariations() {
        const variationPaths = this.getVariations();
        const references = this.references || [];
        if (!variationPaths.length && !references.length) {
            return { locale: [], promo: [], grouped: [] };
        }

        const referencesByPath = new Map(references.map((ref) => [ref.path, ref]));

        const currentMatch = this.path.match(PATH_TOKENS);
        const { surface, parsedLocale: currentLocale, fragmentPath } = currentMatch?.groups || {};

        const locale = [];
        const promo = [];
        const grouped = [];
        const promoPaths = new Set();

        for (const path of variationPaths) {
            const reference = referencesByPath.get(path);
            if (!reference) continue;

            if (Fragment.isGroupedVariationPath(path)) {
                if (isVariationPathInParentLocaleFamily(surface, currentLocale, path)) {
                    grouped.push(reference);
                }
                continue;
            }

            if (isPromoVariationPath(path)) {
                promo.push(reference);
                promoPaths.add(path);
                continue;
            }

            const isPromo = reference.tags?.some((t) => t.id?.startsWith(TAG_PROMOTION_PREFIX));
            if (isPromo) {
                promo.push(reference);
                promoPaths.add(path);
                continue;
            }

            if (surface && currentLocale && fragmentPath) {
                const refMatch = path.match(PATH_TOKENS);
                if (refMatch?.groups) {
                    const r = refMatch.groups;
                    if (
                        r.surface === surface &&
                        r.fragmentPath === fragmentPath &&
                        r.parsedLocale !== currentLocale &&
                        isVariationPathInParentLocaleFamily(surface, currentLocale, path)
                    ) {
                        locale.push(reference);
                    }
                }
            }
        }

        for (const reference of references) {
            if (!isPromoVariationPath(reference.path) || promoPaths.has(reference.path)) continue;
            promo.push(reference);
            promoPaths.add(reference.path);
        }

        return { locale, promo, grouped };
    }

    /**
     * Lists all locale variations of the fragment (regional variations).
     * @returns {Object[]}
     */
    listLocaleVariations() {
        return this.#categorizeVariations().locale;
    }

    /**
     * Lists all grouped (pzn) variations of the fragment.
     * @returns {Object[]}
     */
    listGroupedVariations() {
        return this.#categorizeVariations().grouped;
    }

    /**
     * Lists all promo variations of the fragment.
     * @returns {Object[]}
     */
    listPromoVariations() {
        return this.#categorizeVariations().promo;
    }

    /**
     * Gets the count of grouped (pzn) variations.
     * @returns {number}
     */
    getGroupedVariationCount() {
        return this.#categorizeVariations().grouped.length;
    }

    /**
     * Gets the count of locale variations.
     * @returns {number}
     */
    getLocaleVariationCount() {
        return this.#categorizeVariations().locale.length;
    }

    /**
     * Gets the count of promo variations.
     * @returns {number}
     */
    getPromoVariationCount() {
        return this.#categorizeVariations().promo.length;
    }

    /**
     * Gets the total count of all variations (locale + promo + grouped).
     * @returns {number}
     */
    getTotalVariationCount() {
        const { locale, promo, grouped } = this.#categorizeVariations();
        return locale.length + promo.length + grouped.length;
    }
}
