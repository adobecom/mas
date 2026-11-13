import { Fragment, ICON_FIELDS } from '../aem/fragment.js';
import { FragmentStore } from './fragment-store.js';
import { PreviewFragmentStore, INHERITED_SETTINGS_FIELDS } from './preview-fragment-store.js';
import Store from '../store.js';
import { getGlobalSettingsDefaults } from '../settings/settings-store.js';
import { cachedInheritanceParent, mergeParentFields } from '../aem/variation-utils.js';
import { MERGE_CONFIG } from '../../../io/www/src/fragment/transformers/customize.js';

export class SourceFragmentStore extends FragmentStore {
    /** @type {PreviewFragmentStore} */
    previewStore;

    /** @type {Fragment | null} */
    parentFragment = null;

    /** @type {boolean} Flag to skip variation detection on next editor init (set after copy) */
    skipVariationDetection = false;

    /** @type {Fragment | null} merged baselines filling the empty fields of the preview */
    baselineParent = null;

    /** @type {string | null} variant of the baselines, deciding the arrays to merge when the card has none */
    baselineVariant = null;

    #inheritanceParent = cachedInheritanceParent();

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
        this.previewStore.set(this.#previewData(value));
    }

    /**
     * The fragment empty fields inherit from: the variation parent filled with the baselines, if any.
     * @returns {Fragment | null}
     */
    get inheritanceParent() {
        return this.#inheritanceParent(this.parentFragment, this.baselineParent);
    }

    /**
     * Preview data built from the source: empty fields filled with the variation parent, then the baselines.
     * Built from the source only, as the resolved preview no longer tells inherited fields from explicitly emptied ones.
     * @param {Fragment | object} value
     * @returns {object}
     */
    #previewData(value) {
        if (!this.parentFragment && !this.baselineParent) return value;
        if (this.parentFragment) {
            return createPreviewDataWithParent(value, this.parentFragment, this.baselineParent, this.#arraysToMerge);
        }
        return mergeParentFields(structuredClone(value), this.baselineParent, this.#arraysToMerge);
    }

    /** Array fields the card template appends to the baseline values instead of overriding them (delivery `deepMerge`). */
    get #arraysToMerge() {
        const variant =
            this.value.getFieldValue('variant') || this.parentFragment?.getFieldValue('variant') || this.baselineVariant;
        return MERGE_CONFIG[variant]?.arraysToMerge ?? [];
    }

    #previewFieldsData(names) {
        const pick = ({ fields }) => ({ fields: fields.filter((field) => names.includes(field.name)) });
        const previewData = structuredClone(pick(this.value));
        if (this.parentFragment) mergeParentFields(previewData, pick(this.parentFragment));
        if (this.baselineParent) mergeParentFields(previewData, pick(this.baselineParent), this.#arraysToMerge);
        return previewData;
    }

    #updatePreviewFields(name) {
        const names = ICON_FIELDS.has(name) ? [...ICON_FIELDS] : [name];
        const previewData = INHERITED_SETTINGS_FIELDS.has(name)
            ? this.#previewData(this.value)
            : this.#previewFieldsData(names);
        for (const fieldName of names) {
            const values = previewData.fields.find((field) => field.name === fieldName)?.values ?? [];
            this.previewStore.updateField(fieldName, values);
        }
    }

    updateField(name, value) {
        const result = this.value.updateField(name, value, this.inheritanceParent);
        if (result) {
            this.notify();
            this.#updatePreviewFields(name);
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
        this.previewStore.refreshFrom(this.#previewData(this.value));
    }

    discardChanges() {
        this.value.discardChanges();
        this.notify();
        this.previewStore.refreshFrom(this.#previewData(this.value));
    }

    resetFieldToParent(fieldName) {
        const success = this.value.resetFieldToParent(fieldName);
        if (success) {
            this.notify();
            this.previewStore.refreshFrom(this.#previewData(this.value));
        }
        return success;
    }

    resolvePreviewFragment(previewLocaleOverride) {
        if (previewLocaleOverride !== undefined) {
            this.previewStore.setPreviewLocaleOverride(previewLocaleOverride);
        }
        this.previewStore.resolveFragment();
    }

    /**
     * Sets the merged baselines the card inherits from (`null` when baselines are off or missing) and rebuilds the
     * preview from the source, so values of a previous baseline do not linger.
     * @param {Fragment | null} baselineParent
     * @param {string | null} [baselineVariant] variant of the baselines, used when the card has none
     */
    setBaselineParent(baselineParent, baselineVariant = null) {
        if (this.baselineParent === baselineParent) return;
        this.baselineParent = baselineParent;
        this.baselineVariant = baselineVariant;
        this.previewStore.refreshFrom(this.#previewData(this.value));
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
 * Creates preview data by merging parent values, then baseline values, into empty variation fields.
 * Global settings defaults only fill the settings both leave empty.
 * @param {Fragment | object} sourceFragment
 * @param {Fragment} parentFragment
 * @param {Fragment | null} [baselineParent]
 * @param {string[]} [arraysToMerge] baseline array fields the variation values are appended to
 * @returns {object}
 */
export function createPreviewDataWithParent(sourceFragment, parentFragment, baselineParent = null, arraysToMerge = []) {
    const previewData = structuredClone(sourceFragment);
    const tags = sourceFragment.fields?.find((f) => f.name === 'tags');
    if (tags) {
        const variationTags = structuredClone(tags);
        variationTags.name = 'variation_tags';
        previewData.fields.push(variationTags);
    }

    mergeParentFields(previewData, parentFragment);
    if (baselineParent) mergeParentFields(previewData, baselineParent, arraysToMerge);

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
