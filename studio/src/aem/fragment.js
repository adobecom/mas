import { EVENT_FRAGMENT_CHANGE } from '../events.js';
import { debounce } from '../utils/debounce.js';

function notifyChanges(details = {}) {
    document.dispatchEvent(
        new CustomEvent(EVENT_FRAGMENT_CHANGE, {
            detail: { fragment: this, ...details },
        }),
    );
}

const notifyChangesDebounced = debounce(notifyChanges, 300);
export class Fragment {
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
        tags,
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
        this.tags = tags;
        this.fields = fields;
        this.updateOriginal(false);
    }

    #notify = notifyChanges;
    #notifySlow = notifyChangesDebounced;

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

    updateOriginal(notify = true) {
        this.original = null; // clear draft
        this.original = JSON.parse(JSON.stringify(this));
        if (notify) this.#notify(notify);
    }

    refreshFrom(fragmentData, notify = false) {
        Object.assign(this, fragmentData);
        this.hasChanges = false;
        this.updateOriginal(notify);
    }

    discardChanges() {
        this.refreshFrom(this.original, true);
    }

    toggleSelection(value) {
        if (value !== undefined) this.selected = value;
        else this.selected = !this.selected;
        this.#notify({ selection: true });
    }

    updateFieldInternal(fieldName, value) {
        this[fieldName] = value ?? '';
        this.hasChanges = true;
        this.#notifySlow();
    }

    getField(fieldName) {
        return this.fields.find((field) => field.name === fieldName);
    }

    updateField(fieldName, value) {
        let change = false;
        const field = this.getField(fieldName);
        if (
            field.values.length === value.length &&
            field.values.every((v, index) => v === value[index])
        )
            return;
        field.values = value;
        this.hasChanges = true;
        change = true;
        this.#notifySlow();
    }
}
