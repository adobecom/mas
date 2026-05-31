/**
 * Persisted sentinel for variation fields intentionally cleared to empty.
 * Keep in sync with io/www/src/fragment/utils/explicit-empty.js
 */
export const EXPLICIT_EMPTY_SENTINEL = 'explicit_empty';

/**
 * @param {*} value
 * @returns {boolean}
 */
export function isExplicitEmptySentinel(value) {
    return value === EXPLICIT_EMPTY_SENTINEL;
}

/**
 * @param {Array|undefined} values
 * @returns {boolean}
 */
export function fieldValuesArePersistedExplicitEmpty(values) {
    return (
        Array.isArray(values) &&
        values.length === 1 &&
        isExplicitEmptySentinel(values[0])
    );
}

/**
 * Maps author field values for hydrate when explicit_empty is still present on cached rows.
 * @param {boolean} multiple
 * @param {Array|undefined} values
 * @returns {*|Array}
 */
export function authorFieldValueForHydrate(multiple, values = []) {
    if (fieldValuesArePersistedExplicitEmpty(values)) {
        return multiple ? [] : '';
    }

    if (multiple) {
        return values.map((value) =>
            isExplicitEmptySentinel(value) ? '' : value,
        );
    }

    const singleValue = values[0];
    return isExplicitEmptySentinel(singleValue) ? '' : singleValue;
}
