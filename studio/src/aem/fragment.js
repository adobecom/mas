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
        etag,
        model,
        path,
        title,
        description,
        status,
        created,
        modified,
        fields,
        tags,
        references,
    }) {
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
        this.tags = tags;
        this.fields = fields;
        this.references = references;
        this.tags = tags || [];
        this.initialValue = structuredClone(this);
    }

    get variant() {
        return this.fields.find((field) => field.name === 'variant')
            ?.values?.[0];
    }

    get fragmentName() {
        return this.path.split('/').pop();
    }

    get statusVariant() {
        if (this.hasChanges) return 'modified';
        return this.status === 'PUBLISHED' ? 'published' : 'draft';
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
}
