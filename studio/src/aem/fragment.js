import { PATH_TOKENS, TAG_PROMOTION_PREFIX } from '../constants.js';
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
    constructor({
        id,
        dictionary,
        etag,
        fields,
        model,
        path,
        title,
        description,
        status,
        created,
        modified,
        placeholders,
        priceLiterals,
        published,
        references,
        settings,
        tags,
    }) {
        this.model = model;
        this.description = description;
        this.dictionary = dictionary;
        this.etag = etag;
        this.fields = fields;
        this.id = id;
        this.initialValue = structuredClone(this);
        this.status = status;
        this.created = created;
        this.modified = modified;
        this.name = path?.split('/')?.pop();
        this.path = path;
        this.placeholders = placeholders || {};
        this.priceLiterals = priceLiterals || {};
        this.published = published;
        this.references = references;
        this.settings = settings || {};
        this.tags = tags || [];
        this.title = title;
    }

    get variant() {
        return this.fields.find((field) => field.name === 'variant')?.values?.[0];
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

    refreshFrom(fragmentData) {
        Object.assign(this, fragmentData);
        this.initialValue = structuredClone(this);
        this.hasChanges = false;
    }

    /**
     * Updates the fragment entirely while preserving the initial value & hasChange status if not specified
     * @param {object} fragmentData
     * @param {Boolean | undefined} hasChanges
     */
    replaceFrom(fragmentData, hasChanges) {
        Object.assign(this, fragmentData);
        if (hasChanges === undefined) return;
        this.hasChanges = hasChanges;
    }

    discardChanges() {
        if (!this.hasChanges) return;
        Object.assign(this, this.initialValue);
        this.initialValue = structuredClone(this);
        this.hasChanges = false;
    }

    updateFieldInternal(fieldName, value) {
        this[fieldName] = value ?? '';
        this.hasChanges = true;
    }

    getField(fieldName) {
        return this.fields.find((field) => field.name === fieldName);
    }

    getFieldValue(fieldName, index = 0) {
        return this.fields.find((field) => field.name === fieldName)?.values?.[index];
    }

    getVariations() {
        const variationsField = this.fields.find((field) => field.name === 'variations');
        return variationsField?.values || [];
    }

    hasVariations() {
        const variations = this.getVariations();
        return variations.length > 0;
    }

    updateField(fieldName, value) {
        let change = false;
        const encodedValues = value.map((v) => {
            if (typeof v === 'string') {
                return v.normalize('NFC');
            }
            return v;
        });

        const existingField = this.fields.find((field) => field.name === fieldName);

        if (existingField) {
            if (
                existingField.values.length === encodedValues.length &&
                existingField.values.every((v, index) => v === encodedValues[index])
            ) {
                if (fieldName === 'tags') this.newTags = value;
                return change;
            }
            existingField.values = encodedValues;
            this.hasChanges = true;
            change = true;
        } else if (encodedValues.length > 0 && encodedValues.some((v) => v !== '')) {
            this.fields.push({
                name: fieldName,
                type: 'text',
                values: encodedValues,
            });
            this.hasChanges = true;
            change = true;
        }

        if (fieldName === 'tags') this.newTags = value;
        return change;
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
        if (ownField && ownField.values && ownField.values.length > 0) {
            return ownField.values;
        }
        if (!parentFragment || !isVariation) {
            return ownField?.values || [];
        }
        const parentField = parentFragment.getField(fieldName);
        return parentField?.values || [];
    }

    getFieldState(fieldName, parentFragment, isVariation) {
        if (!isVariation || !parentFragment) {
            return 'no-parent';
        }
        const ownField = this.getField(fieldName);
        const parentField = parentFragment.getField(fieldName);

        const ownValues = ownField?.values || [];
        const parentValues = parentField?.values || [];

        const isEffectivelyEmpty = (values) =>
            values.length === 0 || values.every((v) => v === '' || v === null || v === undefined);

        const ownIsEmpty = isEffectivelyEmpty(ownValues);
        const parentIsEmpty = isEffectivelyEmpty(parentValues);

        if (ownIsEmpty && parentIsEmpty) {
            return 'inherited';
        }
        if (ownIsEmpty) {
            return 'inherited';
        }

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
     * @returns {Fragment[] | undefined}
     */
    listLocaleVariations() {
        const variationPaths = this.getVariations();
        if (!this.references?.length || !variationPaths.length) return undefined;

        const currentMatch = this.path.match(PATH_TOKENS);
        if (!currentMatch?.groups) {
            return undefined;
        }

        const { surface, parsedLocale: currentLocale, fragmentPath } = currentMatch.groups;

        const result = this.references.filter((reference) => {
            if (!variationPaths.includes(reference.path)) return false;

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

        return result.length > 0 ? result : undefined;
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
     * Gets the total count of all variations (locale + promo).
     * @returns {number}
     */
    getTotalVariationCount() {
        return this.getLocaleVariationCount() + this.getPromoVariationCount();
    }
}
