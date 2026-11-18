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
 * Fills the empty fields of preview data with the parent values (in place). Fields listed in `arraysToMerge` keep their
 * own values after the parent ones, as `deepMerge` of the `customize` transformer does.
 * @param {{ fields: Array }} previewData
 * @param {{ fields?: Array }} parentFragment
 * @param {string[]} [arraysToMerge]
 * @returns {{ fields: Array }} previewData
 */
export function mergeParentFields(previewData, parentFragment, arraysToMerge = []) {
    for (const parentField of parentFragment.fields ?? []) {
        if (!parentField.values?.length) continue;
        const sourceField = previewData.fields.find((field) => field.name === parentField.name);
        if (!variationFieldShouldInheritParent(sourceField?.values, sourceField?.multiple === true)) {
            if (arraysToMerge.includes(parentField.name)) sourceField.values = [...parentField.values, ...sourceField.values];
            continue;
        }
        if (sourceField) {
            sourceField.values = [...parentField.values];
        } else {
            previewData.fields.push({ ...parentField });
        }
    }
    return previewData;
}
