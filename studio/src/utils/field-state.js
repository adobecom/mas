/**
 * Determines if a single item in an array field is overridden compared to parent.
 * @param {string|object} currentValue - The current item value
 * @param {Array} parentValues - The parent fragment's values for comparison
 * @param {Function} [getKey] - Optional function to extract comparison key from objects
 * @returns {'overridden' | ''}
 */
export function getItemFieldState(currentValue, parentValues = [], getKey = (v) => v) {
    if (!parentValues || parentValues.length === 0) {
        return '';
    }

    const key = getKey(currentValue);
    const parentKeys = new Set(parentValues.map(getKey));

    return parentKeys.has(key) ? '' : 'overridden';
}
