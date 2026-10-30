import { fieldValuesArePersistedExplicitEmpty } from '../../../io/www/src/fragment/utils/explicit-empty.js';
import { Fragment } from './fragment.js';

/**
 * Whether a variation field should inherit parent values in preview merge.
 * @param {Array} sourceValues
 * @param {boolean} [isMultiple]
 * @returns {boolean}
 */
export function variationFieldShouldInheritParent(sourceValues, isMultiple = false) {
    if (!sourceValues?.length) {
        return true;
    }
    if (sourceValues.every((v) => v === null || v === undefined)) {
        return true;
    }
    if (fieldValuesArePersistedExplicitEmpty(sourceValues)) {
        return false;
    }
    return sourceValues.length === 1 && sourceValues[0] === '' && !isMultiple;
}

/**
 * Fills the empty fields of preview data with the parent values (in place).
 * @param {{ fields: Array }} previewData
 * @param {{ fields?: Array }} parentFragment
 * @returns {{ fields: Array }} previewData
 */
export function mergeParentFields(previewData, parentFragment) {
    for (const parentField of parentFragment.fields ?? []) {
        if (!parentField.values?.length) continue;
        const sourceField = previewData.fields.find((field) => field.name === parentField.name);
        if (!variationFieldShouldInheritParent(sourceField?.values, sourceField?.multiple === true)) continue;
        if (sourceField) {
            sourceField.values = [...parentField.values];
        } else {
            previewData.fields.push({ ...parentField });
        }
    }
    return previewData;
}

/**
 * The fragment a card inherits its empty fields from: its merged baselines, under its locale default fragment for a
 * variation (baselines < locale default < card, like the delivery pipeline).
 * @param {Fragment | null} parentFragment
 * @param {Fragment | null} baselineParent
 * @returns {Fragment | null}
 */
export function buildInheritanceParent(parentFragment, baselineParent) {
    if (!parentFragment || !baselineParent) return parentFragment ?? baselineParent;
    return new Fragment(mergeParentFields(structuredClone({ fields: parentFragment.fields }), baselineParent));
}

/**
 * `buildInheritanceParent`, rebuilt only when the parent or the baselines change.
 * @returns {(parentFragment: Fragment | null, baselineParent: Fragment | null) => Fragment | null}
 */
export function cachedInheritanceParent() {
    let cached = {};
    return (parentFragment, baselineParent) => {
        if (cached.parentFragment !== parentFragment || cached.baselineParent !== baselineParent) {
            cached = { parentFragment, baselineParent, fragment: buildInheritanceParent(parentFragment, baselineParent) };
        }
        return cached.fragment;
    };
}
