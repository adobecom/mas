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
    constructor({ id, etag, model, path, title, description, status, created, modified, published, fields, tags, references }) {
        this.id = id;
        this.model = model;
        this.etag = etag;
        this.path = path;
        this.name = path?.split('/')?.pop();
        this.title = title;
        this.description = description;
        this.status = status;
        this.created = created;
        this.modified = modified;
        this.published = published;
        this.tags = tags;
        this.fields = fields;
        this.references = references;
        this.tags = tags || [];
        this.initialValue = structuredClone(this);
    }

    get variant() {
        return this.fields.find((field) => field.name === 'variant')?.values?.[0];
    }

    get fragmentName() {
        return this.path.split('/').pop();
    }

    get statusVariant() {
        return this.status?.toLowerCase() || 'draft';
    }

    getTagTitle(id) {
        const tags = this.tags.filter((tag) => tag.id.includes(id));
        return tags[0]?.title;
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

    getOriginalIdField() {
        return this.fields.find((field) => field.name === 'originalId');
    }

    isVariation() {
        const originalIdField = this.getOriginalIdField();
        const originalId = originalIdField?.values?.[0];
        return !!originalId && originalId !== this.id;
    }

    getParentId() {
        const originalIdField = this.getOriginalIdField();
        return originalIdField?.values?.[0] || null;
    }

    updateField(fieldName, value) {
        let change = false;
        this.fields
            .filter((field) => field.name === fieldName)
            .forEach((field) => {
                //handles encoding of values for characters like ✓
                const encodedValues = value.map((v) => {
                    if (typeof v === 'string') {
                        return v.normalize('NFC');
                    }
                    return v;
                });
                if (
                    field.values.length === encodedValues.length &&
                    field.values.every((v, index) => v === encodedValues[index])
                )
                    return;
                field.values = encodedValues;
                this.hasChanges = true;
                change = true;
            });
        if (fieldName === 'tags') this.newTags = value;
        return change;
    }

    getEffectiveFieldValue(fieldName, parentFragment, index = 0) {
        const ownValue = this.getFieldValue(fieldName, index);
        if (ownValue !== undefined && ownValue !== null && ownValue !== '') {
            return ownValue;
        }
        if (!parentFragment || !this.isVariation()) {
            return ownValue;
        }
        return parentFragment.getFieldValue(fieldName, index);
    }

    getEffectiveFieldValues(fieldName, parentFragment) {
        const ownField = this.getField(fieldName);
        if (ownField && ownField.values && ownField.values.length > 0) {
            return ownField.values;
        }
        if (!parentFragment || !this.isVariation()) {
            return ownField?.values || [];
        }
        const parentField = parentFragment.getField(fieldName);
        return parentField?.values || [];
    }

    getFieldState(fieldName, parentFragment) {
        if (!this.isVariation() || !parentFragment) {
            return 'no-parent';
        }
        const ownField = this.getField(fieldName);
        if (!ownField || !ownField.values || ownField.values.length === 0) {
            return 'inherited';
        }
        const parentField = parentFragment.getField(fieldName);
        if (!parentField || !parentField.values) {
            return 'overridden';
        }
        const areEqual =
            ownField.values.length === parentField.values.length &&
            ownField.values.every((v, i) => v === parentField.values[i]);
        return areEqual ? 'same-as-parent' : 'overridden';
    }
}
