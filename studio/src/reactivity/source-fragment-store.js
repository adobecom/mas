import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from './fragment-store.js';
import { PreviewFragmentStore, INHERITED_SETTINGS_FIELDS } from './preview-fragment-store.js';
import Store from '../store.js';
import { getGlobalSettingsDefaults } from '../settings/settings-store.js';
import { variationFieldShouldInheritParent } from '../aem/variation-utils.js';

export class SourceFragmentStore extends FragmentStore {
    /** @type {PreviewFragmentStore} */
    previewStore;

    /** @type {Fragment | null} */
    parentFragment = null;

    /** @type {boolean} Flag to skip variation detection on next editor init (set after copy) */
    skipVariationDetection = false;

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
        if (this.parentFragment) {
            const previewData = createPreviewDataWithParent(value, this.parentFragment);
            this.previewStore.set(previewData);
        } else {
            this.previewStore.set(value);
        }
    }

    updateField(name, value) {
        const result = this.value.updateField(name, value, this.parentFragment);
        if (result) {
            this.notify();
            this.previewStore.updateField(name, value);
        }
        return result;
    }

    updateFieldInternal(name, value) {
        this.value.updateFieldInternal(name, value);
        this.notify();
        this.previewStore.updateFieldInternal(name, value);
    }

    refreshFrom(value) {
        this.value.refreshFrom(value);
        this.notify();
        // For variations, restore preview with parent-merged values
        if (this.parentFragment) {
            const previewData = createPreviewDataWithParent(this.value, this.parentFragment);
            this.previewStore.refreshFrom(previewData);
        } else {
            this.previewStore.refreshFrom(structuredClone(value));
        }
    }

    discardChanges() {
        this.value.discardChanges();
        this.notify();
        // For variations, restore preview with parent-merged values
        if (this.parentFragment) {
            const previewData = createPreviewDataWithParent(this.value, this.parentFragment);
            this.previewStore.refreshFrom(previewData);
        } else {
            this.previewStore.refreshFrom(structuredClone(this.value));
        }
    }

    resetFieldToParent(fieldName) {
        const success = this.value.resetFieldToParent(fieldName);
        if (success) {
            this.notify();
            if (this.parentFragment) {
                const parentValues = this.parentFragment.getField(fieldName)?.values ?? [];
                this.previewStore.updateField(fieldName, parentValues);
            } else {
                this.previewStore.refreshFrom(structuredClone(this.value));
            }
        }
        return success;
    }

    resolvePreviewFragment(previewLocaleOverride) {
        if (previewLocaleOverride !== undefined) {
            this.previewStore.setPreviewLocaleOverride(previewLocaleOverride);
        }
        this.previewStore.resolveFragment();
    }

    refreshAemFragment() {
        /* Source fragments aren't linked to the aem-fragment cache */
    }
}

/**
 * Generates a source fragment for editing & a resolved fragment for the aem-fragment cache
 * @param {Fragment} fragment - The raw fragment data
 * @param {Fragment | null} parentFragment - The parent fragment for variations (optional)
 * @returns {SourceFragmentStore}
 */
export default function generateFragmentStore(fragment, parentFragment = null, options = {}) {
    // Source store keeps the raw fragment data
    const sourceData = structuredClone(fragment);
    const sourceFragment = new Fragment(sourceData);

    // Preview store gets parent-merged data for variations
    let previewData;
    if (parentFragment) {
        previewData = createPreviewDataWithParent(sourceData, parentFragment);
    } else {
        previewData = structuredClone(sourceData);
    }

    const previewStore = new PreviewFragmentStore(new Fragment(previewData), undefined, options);
    const sourceStore = new SourceFragmentStore(sourceFragment, previewStore, parentFragment);
    return sourceStore;
}

/**
 * Creates preview data by merging parent values into empty variation fields
 * @param {Fragment | object} sourceFragment
 * @param {Fragment} parentFragment
 * @returns {object}
 */
export function createPreviewDataWithParent(sourceFragment, parentFragment) {
    const previewData = structuredClone(sourceFragment);

    parentFragment.fields?.forEach((parentField) => {
        const sourceField = previewData.fields?.find((f) => f.name === parentField.name);
        const sourceValues = sourceField?.values || [];

        const shouldInherit = variationFieldShouldInheritParent(sourceValues, sourceField?.multiple === true);

        if (shouldInherit && parentField?.values?.length > 0) {
            if (sourceField) {
                sourceField.values = [...parentField.values];
            } else {
                previewData.fields.push({ ...parentField });
            }
        }
    });

    const settingsRows = Store.settings.rows.get?.();
    if (parentFragment && Array.isArray(settingsRows) && settingsRows.length > 0) {
        const defaults = getGlobalSettingsDefaults(parentFragment, settingsRows);
        for (const fieldName of INHERITED_SETTINGS_FIELDS) {
            const previewField = previewData.fields?.find((f) => f.name === fieldName);
            const previewVals = previewField?.values ?? [];

            if (previewVals.length > 0) {
                continue;
            }

            const fallback = defaults[fieldName];
            if (fallback === undefined || fallback === null || fallback === '') {
                continue;
            }

            if (previewField) {
                previewField.values = [fallback];
            } else {
                previewData.fields.push({
                    name: fieldName,
                    values: [fallback],
                    multiple: false,
                    type: 'text',
                });
            }
        }
    }

    return previewData;
}
