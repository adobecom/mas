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
