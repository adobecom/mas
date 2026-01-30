import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from './fragment-store.js';
import { PreviewFragmentStore } from './preview-fragment-store.js';

export class SourceFragmentStore extends FragmentStore {
    /** @type {PreviewFragmentStore} */
    previewStore;

    /** @type {Fragment | null} */
    parentFragment = null;

    /**
     * @param {Fragment} sourceFragment - The raw fragment data (for editing)
     * @param {PreviewFragmentStore} previewStore - The preview store (with merged parent values)
     * @param {Fragment | null} parentFragment - The parent fragment for variations
     */
    constructor(sourceFragment, previewStore, parentFragment = null) {
        super(sourceFragment);
        this.previewStore = previewStore;
        this.parentFragment = parentFragment;
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
        // For variations, restore preview with parent-merged values
        if (this.parentFragment) {
            const previewData = this.#createPreviewData(this.value, this.parentFragment);
            this.previewStore.refreshFrom(previewData);
        } else {
            this.previewStore.refreshFrom(structuredClone(this.value));
        }
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

    /**
     * Creates preview data by merging parent values into empty variation fields
     * @param {Fragment} sourceFragment
     * @param {Fragment} parentFragment
     * @returns {object}
     */
    #createPreviewData(sourceFragment, parentFragment) {
        const previewData = structuredClone(sourceFragment);

        parentFragment.fields?.forEach((parentField) => {
            const sourceField = previewData.fields?.find((f) => f.name === parentField.name);
            const sourceValues = sourceField?.values || [];

            // Check if variation should inherit from parent
            let shouldInherit = sourceValues.length === 0;

            // For [""], check if it's a multi-value field
            if (!shouldInherit && sourceValues.length === 1 && sourceValues[0] === '') {
                // For multi-value fields, [""] is explicit clear - don't inherit
                // For single-value fields, [""] is AEM's default - inherit
                const isMultipleField = sourceField?.multiple === true;
                shouldInherit = !isMultipleField;
            }

            if (shouldInherit && parentField?.values?.length > 0) {
                if (sourceField) {
                    sourceField.values = [...parentField.values];
                } else {
                    previewData.fields.push({ ...parentField });
                }
            }
        });

        return previewData;
    }
}

/**
 * Generates a source fragment for editing & a resolved fragment for the aem-fragment cache
 * @param {Fragment} fragment - The raw fragment data
 * @param {Fragment | null} parentFragment - The parent fragment for variations (optional)
 * @returns {SourceFragmentStore}
 */
export default function generateFragmentStore(fragment, parentFragment = null) {
    // Source store keeps the raw fragment data
    const sourceFragment = new Fragment(structuredClone(fragment));

    // Preview store gets parent-merged data for variations
    let previewData;
    if (parentFragment) {
        previewData = createPreviewDataWithParent(fragment, parentFragment);
    } else {
        previewData = structuredClone(fragment);
    }

    const previewStore = new PreviewFragmentStore(new Fragment(previewData));
    const sourceStore = new SourceFragmentStore(sourceFragment, previewStore, parentFragment);
    return sourceStore;
}

/**
 * Creates preview data by merging parent values into empty variation fields
 * @param {Fragment | object} sourceFragment
 * @param {Fragment} parentFragment
 * @returns {object}
 */
function createPreviewDataWithParent(sourceFragment, parentFragment) {
    const previewData = structuredClone(sourceFragment);

    parentFragment.fields?.forEach((parentField) => {
        const sourceField = previewData.fields?.find((f) => f.name === parentField.name);
        const sourceValues = sourceField?.values || [];

        // Check if variation should inherit from parent
        let shouldInherit = sourceValues.length === 0;

        // For [""], check if it's a multi-value field
        if (!shouldInherit && sourceValues.length === 1 && sourceValues[0] === '') {
            // For multi-value fields, [""] is explicit clear - don't inherit
            // For single-value fields, [""] is AEM's default - inherit
            const isMultipleField = sourceField?.multiple === true;
            shouldInherit = !isMultipleField;
        }

        if (shouldInherit && parentField?.values?.length > 0) {
            if (sourceField) {
                sourceField.values = [...parentField.values];
            } else {
                previewData.fields.push({ ...parentField });
            }
        }
    });

    return previewData;
}
