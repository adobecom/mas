const ownershipStack = [];

/**
 * @param {{ allowUnset?: boolean }} [options] If "allowUnset" is true, returns null when no slice is bound instead of throwing.
 * @returns {object|null}
 */
export function getItemsSelectionStore(options) {
    const top = ownershipStack[ownershipStack.length - 1];
    const slice = top ? top.slice : null;
    if (slice == null) {
        if (options?.allowUnset) {
            return null;
        }
        throw new Error('Items selection store not set.');
    }
    return slice;
}

/**
 * Test-only. Forgets all ownership bookkeeping, so any outstanding push/pop tokens
 * become no-ops, then claims the stack with a single owner for the given slice.
 * Production code must use pushItemsSelectionStore/popItemsSelectionStore instead,
 * which is what keeps ownership correct when editors mount/unmount out of order.
 * @param {object|null} slice
 */
export function setItemsSelectionStore(slice) {
    ownershipStack.length = 0;
    ownershipStack.push({ token: Symbol('items-selection-store-owner'), slice });
}

/**
 * Claims the active items selection store, tracking ownership on a stack so that
 * overlapping owners (e.g. one editor mounting before another unmounts) restore
 * correctly regardless of disconnect order.
 * @param {object} slice
 * @returns {symbol} Opaque token to pass to popItemsSelectionStore.
 */
export function pushItemsSelectionStore(slice) {
    const token = Symbol('items-selection-store-owner');
    ownershipStack.push({ token, slice });
    return token;
}

/**
 * Releases ownership claimed via pushItemsSelectionStore. The active store is always
 * whatever is now topmost on the stack once this owner is removed.
 * @param {symbol} token
 */
export function popItemsSelectionStore(token) {
    const index = ownershipStack.findIndex((entry) => entry.token === token);
    if (index === -1) return;
    const wasTopmost = index === ownershipStack.length - 1;
    ownershipStack.splice(index, 1);
    if (!wasTopmost) {
        console.warn(
            'popItemsSelectionStore: released owner was not the topmost claim. ' +
                'This indicates two owners overlapped out of stack order — check for a ' +
                'connect-before-disconnect race between editors.',
        );
    }
}
