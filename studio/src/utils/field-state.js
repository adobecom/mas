/**
 * Determines if a single item in an array field is overridden compared to parent (set-based).
 * Use for unordered collections like tags where position doesn't matter.
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

/**
 * Determines if an item at a specific index differs from parent (index-based).
 * Use for ordered collections like mnemonics where position matters.
 * @param {string} currentValue - The current item value
 * @param {Array} parentValues - The parent fragment's values for comparison
 * @param {number} index - The index to compare at
 * @returns {'overridden' | ''}
 */
export function getItemFieldStateByIndex(currentValue, parentValues = [], index) {
    if (!parentValues || parentValues.length === 0) return '';
    if (!currentValue) return '';
    if (index >= parentValues.length) return 'overridden';
    return currentValue === parentValues[index] ? '' : 'overridden';
}
