let activeItemsSelectionStore = null;

/**
 * @param {{ allowUnset?: boolean }} [options] If "allowUnset" is true, returns null when no slice is bound instead of throwing.
 * @returns {object|null}
 */
export function getItemsSelectionStore(options) {
    if (activeItemsSelectionStore == null) {
        if (options?.allowUnset) {
            return null;
        }
        throw new Error('Items selection store not set.');
    }
    return activeItemsSelectionStore;
}

/**
 * @param {object|null} slice
 */
export function setItemsSelectionStore(slice) {
    activeItemsSelectionStore = slice;
}
