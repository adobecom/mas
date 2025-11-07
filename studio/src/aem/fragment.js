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
        return this.status.toLowerCase();
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

    updateField(fieldName, value) {
        let change = false;
        const existingField = this.fields.find((field) => field.name === fieldName);
        
        if (existingField) {
            //handles encoding of values for characters like ✓
            const encodedValues = value.map((v) => {
                if (typeof v === 'string') {
                    return v.normalize('NFC');
                }
                return v;
            });
            if (
                existingField.values.length === encodedValues.length &&
                existingField.values.every((v, index) => v === encodedValues[index])
            )
                return change;
            existingField.values = encodedValues;
            this.hasChanges = true;
            change = true;
        } else {
            // Field doesn't exist, create it
            const encodedValues = value.map((v) => {
                if (typeof v === 'string') {
                    return v.normalize('NFC');
                }
                return v;
            });
            // Determine field type - default to 'text' for most fields
            let fieldType = 'text';
            if (fieldName === 'tags') {
                fieldType = 'tag';
            } else if (fieldName === 'locReady' || fieldName === 'showSecureLabel' || fieldName === 'showPlanType') {
                fieldType = 'boolean';
            } else if (['badge', 'trialBadge', 'prices', 'description', 'shortDescription', 'callout', 'ctas'].includes(fieldName)) {
                fieldType = 'long-text';
            }
            this.fields.push({
                name: fieldName,
                type: fieldType,
                values: encodedValues,
            });
            this.hasChanges = true;
            change = true;
        }
        if (fieldName === 'tags') this.newTags = value;
        return change;
    }
}
