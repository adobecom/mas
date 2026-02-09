import { PATH_TOKENS, PZN_FOLDER, TAG_PROMOTION_PREFIX } from '../constants.js';

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
        const clonedData = structuredClone(fragmentData);
        Object.assign(this, clonedData);
        if (hasChanges === undefined) return;
        this.hasChanges = hasChanges;
    }

    refreshFrom(fragmentData) {
        this.replaceFrom(fragmentData, false);
        this.initialValue = structuredClone(fragmentData);
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

    updateField(fieldName, value) {
        const encodedValues = value.map((v) => (typeof v === 'string' ? v.normalize('NFC') : v));
        const existingField = this.getField(fieldName);
        const isTags = fieldName === 'tags';

        if (existingField) {
            const { values, multiple } = existingField;
            // Skip [] to [''] on single-value fields (RTE initialization sends [''] for empty fields).
            // For multiple:true fields, [''] is an explicit "clear" sentinel.
            if (values.length === 0 && encodedValues.length === 1 && encodedValues[0] === '' && !multiple) {
                return false;
            }
            // No change if values are identical
            if (values.length === encodedValues.length && values.every((v, i) => v === encodedValues[i])) {
                if (isTags) this.newTags = value;
                return false;
            }
            existingField.values = encodedValues;
        } else {
            // Only create new field if there's meaningful content
            if (!encodedValues.length || !encodedValues.some((v) => v?.trim?.())) {
                if (isTags) this.newTags = value;
                return false;
            }
            this.fields.push({ name: fieldName, type: 'text', values: encodedValues });
        }

        this.hasChanges = true;
        if (isTags) this.newTags = value;
        return true;
    }

    getEffectiveFieldValue(fieldName, parentFragment, isVariation, index = 0) {
        const ownValue = this.getFieldValue(fieldName, index);
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
        const isSingleEmptyString = ownValues.length === 1 && ownValues[0] === '';
        if (isSingleEmptyString) {
            const isMultipleField = ownField?.multiple === true;
            if (isMultipleField) {
                // Explicit clear for multi-value fields
                return [];
            }
            // Single-value field with [""] - inherit from parent if variation
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

        // For [""] (single empty string):
        // - For multi-value fields (multiple: true): this is explicit clear sentinel → overridden
        // - For single-value fields (multiple: false): AEM initializes empty fields this way → inherited
        const isSingleEmptyString = ownValues.length === 1 && ownValues[0] === '';
        if (isSingleEmptyString) {
            const isMultipleField = ownField?.multiple === true;
            if (!isMultipleField) {
                return 'inherited';
            }
            // For multiple fields, [""] is explicit clear - fall through to comparison
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

        // Create a new Fragment instance from a deep clone of this fragment's data
        const clonedData = JSON.parse(JSON.stringify(this));
        const prepared = new Fragment(clonedData);

        // Fields that should never be reset (they're fragment-specific, not inherited)
        const excludeFields = ['variations', 'tags', 'originalId', 'locReady'];

        for (const field of prepared.fields) {
            if (excludeFields.includes(field.name)) continue;

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
     * Lists all locale variations of the fragment. Other name: regional variations.
     * @returns {Fragment[]}
     */
    /**
     * Checks whether a path is a grouped (pzn) variation path.
     * @param {string} path
     * @returns {boolean}
     */
    static isGroupedVariationPath(path) {
        return path?.includes(`/${PZN_FOLDER}/`) ?? false;
    }

    listLocaleVariations() {
        const variationPaths = this.getVariations();
        if (!this.references?.length || !variationPaths.length) return [];

        const currentMatch = this.path.match(PATH_TOKENS);
        if (!currentMatch?.groups) {
            return [];
        }

        const { surface, parsedLocale: currentLocale, fragmentPath } = currentMatch.groups;

        return this.references.filter((reference) => {
            if (!variationPaths.includes(reference.path)) return false;

            // Exclude grouped (pzn) variations from locale variations list
            if (Fragment.isGroupedVariationPath(reference.path)) return false;

            // Exclude promo variations from locale variations list
            const isPromo = reference.tags?.some((tag) => tag.id?.startsWith(TAG_PROMOTION_PREFIX));
            if (isPromo) return false;

            const refMatch = reference.path.match(PATH_TOKENS);
            if (!refMatch?.groups) {
                return false;
            }
            const { surface: refSurface, parsedLocale: refLocale, fragmentPath: refFragmentPath } = refMatch.groups;
            return surface === refSurface && fragmentPath === refFragmentPath && currentLocale !== refLocale;
        });
    }

    /**
     * Lists all grouped (pzn) variations of the fragment.
     * Grouped variations live under a /pzn/ folder in the path.
     * @returns {Object[]}
     */
    listGroupedVariations() {
        const variationPaths = this.getVariations();
        if (!this.references?.length || !variationPaths.length) return [];

        return this.references.filter((reference) => {
            if (!variationPaths.includes(reference.path)) return false;
            return Fragment.isGroupedVariationPath(reference.path);
        });
    }

    /**
     * Gets the count of grouped (pzn) variations.
     * @returns {number}
     */
    getGroupedVariationCount() {
        return this.listGroupedVariations()?.length || 0;
    }

    /**
     * Gets the count of locale variations.
     * Locale variations are fragments with the same name but different locale paths.
     * @returns {number}
     */
    getLocaleVariationCount() {
        return this.listLocaleVariations()?.length || 0;
    }

    /**
     * Gets the count of promo variations.
     * Promo variations are identified by promotion tags on references that are also in the variations field.
     * @returns {number}
     */
    getPromoVariationCount() {
        const variationPaths = this.getVariations();
        if (!this.references?.length || !variationPaths.length) return 0;

        return this.references.filter((reference) => {
            return (
                variationPaths.includes(reference.path) &&
                reference.tags?.some((tag) => tag.id?.startsWith(TAG_PROMOTION_PREFIX))
            );
        }).length;
    }

    /**
     * Gets the total count of all variations (locale + promo + grouped).
     * @returns {number}
     */
    getTotalVariationCount() {
        return this.getLocaleVariationCount() + this.getPromoVariationCount() + this.getGroupedVariationCount();
    }
}
