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
        const clonedValue = structuredClone(previewStore.value);
        const initialValue = new Fragment(clonedValue);
        super(initialValue, validator);
        this.previewStore = previewStore;
        this.captureEssentialProps(clonedValue);
        this.restoreEssentialProps();
    }

    set(value) {
        this.captureEssentialProps(value);
        super.set(value);
        this.restoreEssentialProps();
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
        this.captureEssentialProps(value);
        this.value.refreshFrom(value);
        this.restoreEssentialProps();
        const clonedValue = structuredClone(value);
        this.notify();
        this.previewStore.refreshFrom(clonedValue);
    }

    discardChanges() {
        this.value.discardChanges();
        this.notify();
        this.previewStore.refreshFrom(structuredClone(this.value));
    }

    resetFieldToParent(fieldName, parentValues = []) {
        const success = this.value.resetFieldToParent(fieldName);
        if (success) {
            this.notify();
            this.previewStore.updateFieldWithParentValue(fieldName, parentValues);
        }
        return success;
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
 * @param {{ skipAutoResolve?: boolean }} options
 * @returns {SourceFragmentStore}
 */
export default function generateFragmentStore(initialValue, options = {}) {
    const previewStore = new PreviewFragmentStore(initialValue, undefined, options);
    const sourceStore = new SourceFragmentStore(previewStore);
    return sourceStore;
}
