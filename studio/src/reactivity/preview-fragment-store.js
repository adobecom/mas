import Store from '../store.js';
import { FragmentStore } from './fragment-store.js';
import { previewStudioFragment } from 'fragment-client';

export class PreviewFragmentStore extends FragmentStore {
    /**
     * @param {Fragment} initialValue
     * @param {(value: any) => any} validator
     */
    constructor(initialValue, validator) {
        super(initialValue, validator);
        this.resolveFragment();
    }

    set(value) {
        /* IMPORTANT! This store's value should NOT be re-assigned!
           We generally get here from the source store's "set" function, but there, the value
           that is passed is actually the underlying value of the source store, which is DIFFERENT from
           the underlying value of this store - which again should not change, only use replaceFrom/
           refreshFrom to keep the object reference, rather than (in this case) "super.set(value)"
        */
        this.value.replaceFrom(value, true);
        this.resolveFragment();
    }

    updateField(name, value) {
        this.value.updateField(name, value);
        this.resolveFragment();
    }

    updateFieldInternal(name, value) {
        this.value.updateFieldInternal(name, value);
        this.resolveFragment();
    }

    refreshFrom(value) {
        this.value.refreshFrom(value);
        this.resolveFragment();
    }

    discardChanges() {
        this.value.discardChanges();
        this.resolveFragment();
    }

    resolveFragment() {
        if (this.isCollection || !Store.placeholders.preview.value) return;

        this.getResolvedFragment().then((result) => {
            this.replaceFrom(result);
        });
    }

    async getResolvedFragment() {
        /* Transform fields to publish */
        const body = structuredClone(this.value);
        const originalFields = body.fields;
        body.fields = {};
        for (const field of originalFields) {
            body.fields[field.name] = field.multiple ? field.values : field.values[0];
        }

        const context = {
            locale: Store.filters.value.locale,
            surface: Store.search.value.path,
            dictionary: Store.placeholders.preview.value,
        };
        const result = await previewStudioFragment(body, context);

        /* Transform fields back to author */
        for (const field of originalFields) {
            const resolvedField = result.fields[field.name];
            field.values = field.multiple ? resolvedField : [resolvedField];
        }
        result.fields = originalFields;
        return result;
    }

    replaceFrom(value) {
        this.value.replaceFrom(value);
        this.notify();
        this.refreshAemFragment();
    }
}
