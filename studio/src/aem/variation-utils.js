import { fieldValuesArePersistedExplicitEmpty } from '../../../io/www/src/fragment/utils/explicit-empty.js';

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
