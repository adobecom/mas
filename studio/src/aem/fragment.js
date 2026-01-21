import { PATH_TOKENS } from '../constants.js';

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

    refreshFrom(fragmentData) {
        this.newTags = undefined;
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
        this.newTags = undefined;
        Object.assign(this, this.initialValue);
        this.initialValue = structuredClone(this);
        this.hasChanges = false;
    }

    updateFieldInternal(fieldName, value) {
        this[fieldName] = value ?? '';
        this.hasChanges = true;
    }

    getVariations() {
        return this.getFieldValue('variations') || [];
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

        const existingField = this.getField(fieldName);

        if (existingField) {
            if (this.isValueEmpty(existingField.values) && this.isValueEmpty(value)) {
                return change;
            }
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
        const ownValues = this.getFieldValues(fieldName) || [];
        const parentValues = parentFragment.getFieldValues(fieldName) || [];

        const ownIsEmpty = this.isValueEmpty(ownValues);

        if (ownIsEmpty && this.isValueEmpty(parentValues)) {
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
     * @returns {Fragment[]}
     */
    listLocaleVariations() {
        const currentMatch = this.path.match(PATH_TOKENS);
        if (!currentMatch?.groups) {
            return [];
        }

        const { surface, parsedLocale: currentLocale, fragmentPath } = currentMatch.groups;

        return this.references?.filter((reference) => {
            const refMatch = reference.path.match(PATH_TOKENS);
            if (!refMatch?.groups) {
                return false;
            }
            const { surface: refSurface, parsedLocale: refLocale, fragmentPath: refFragmentPath } = refMatch.groups;
            return surface === refSurface && fragmentPath === refFragmentPath && currentLocale !== refLocale;
        });
    }
}
