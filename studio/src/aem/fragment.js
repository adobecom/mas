import { getFragmentStore } from '../storeUtils.js';

export class Fragment {
    static cache;

    path = '';
    hasChanges = false;
    status = '';

    fields = [];

    selected = false;

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
        modified,
        fields,
    }) {
        this.id = id;
        this.model = model;
        this.etag = etag;
        this.path = path;
        this.name = path.split('/').pop();
        this.title = title;
        this.description = description;
        this.status = status;
        this.modified = modified;
        this.fields = fields;
    }

    get variant() {
        return this.fields.find((field) => field.name === 'variant')
            ?.values?.[0];
    }

    get fragmentName() {
        return this.path.split('/').pop();
    }

    get statusVariant() {
        if (this.hasChanges) return 'yellow';
        return this.status === 'PUBLISHED' ? 'positive' : 'info';
    }

    refreshFrom(fragmentData) {
        Object.assign(this, fragmentData);
        this.hasChanges = false;
    }

    toggleSelection(value) {
        if (value !== undefined) this.selected = value;
        else this.selected = !this.selected;
    }

    updateFieldInternal(fieldName, value) {
        this[fieldName] = value ?? '';
        this.hasChanges = true;
    }

    updateField(fieldName, value) {
        let change = false;
        this.fields
            .filter((field) => field.name === fieldName)
            .forEach((field) => {
                if (
                    field.values.length === value.length &&
                    field.values.every((v, index) => v === value[index])
                )
                    return;
                field.values = value;
                this.hasChanges = true;
                change = true;
            });
        return change;
    }
}
