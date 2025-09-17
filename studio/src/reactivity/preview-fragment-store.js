import Store, { placeholdersDict } from '../store.js';
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
        if (this.isCollection) return;

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
            dictionary: placeholdersDict.value,
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
