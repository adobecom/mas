import { EVENT_CHANGE } from '../events.js';

export class Fragment {
    path = '';
    hasChanges = false;
    status = '';

    fields = [];

    selected = false;

    /**
     * @param {*} AEM Fragment JSON object
     * @param {*} eventTarget DOM element to dispatch events from
     */
    constructor(
        { id, etag, model, path, title, description, status, modified, fields },
        eventTarget,
    ) {
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
        this.eventTarget = eventTarget; /** can be null and set after on save */
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

    refreshFrom(fragmentData) {
        Object.assign(this, fragmentData);
        this.hasChanges = false;
        this.notify();
    }

    notify() {
        this.eventTarget.dispatchEvent(
            new CustomEvent(EVENT_CHANGE, { detail: this }),
        );
    }

    toggleSelection(value) {
        if (value !== undefined) this.selected = value;
        else this.selected = !this.selected;
        this.notify();
    }

    updateFieldInternal(fieldName, value) {
        this[fieldName] = value ?? '';
        this.hasChanges = true;
        this.notify();
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
        this.notify();
        return change;
    }
}
