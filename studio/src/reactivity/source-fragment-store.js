import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from './fragment-store.js';
import { PreviewFragmentStore } from './preview-fragment-store.js';

export class SourceFragmentStore extends FragmentStore {
    /** @type {PreviewFragmentStore} */
    previewStore;

    /**
     * @param {PreviewFragmentStore} previewStore
     * @param {(value: any) => any} validator
     */
    constructor(previewStore, validator) {
        const initialValue = new Fragment(structuredClone(previewStore.value));
        super(initialValue, validator);
        this.previewStore = previewStore;
    }

    set(value) {
        super.set(value);
        this.previewStore.set(value);
    }

    updateField(name, value) {
        this.value.updateField(name, value);
        this.notify();
        this.previewStore.updateField(name, value);
    }

    updateFieldInternal(name, value) {
        this.value.updateFieldInternal(name, value);
        this.notify();
        this.previewStore.updateFieldInternal(name, value);
    }

    refreshFrom(value) {
        this.value.refreshFrom(value);
        this.notify();
        this.previewStore.refreshFrom(structuredClone(value));
    }

    discardChanges() {
        this.value.discardChanges();
        this.notify();
        this.previewStore.discardChanges();
    }

    resolvePreviewFragment() {
        this.previewStore.resolveFragment();
    }

    refreshAemFragment() {
        /* Source fragments aren't linked to the aem-fragment cache */
    }
}

/**
 * Generates a source fragment for editing & a resolved fragment for the aem-fragment cache
 * @param {Fragment} initialValue
 * @returns {SourceFragmentStore}
 */
export default function generateFragmentStore(initialValue) {
    const previewStore = new PreviewFragmentStore(initialValue);
    previewStore.resolveFragment();
    const sourceStore = new SourceFragmentStore(previewStore);
    return sourceStore;
}
