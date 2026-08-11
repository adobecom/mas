let activeItemsSelectionStore = null;
const ownershipStack = [];

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
 * Test-only. Forces the active store and forgets all ownership bookkeeping, so any
 * outstanding push/pop tokens become no-ops. Production code must use
 * pushItemsSelectionStore/popItemsSelectionStore instead, which is what keeps
 * ownership correct when editors mount/unmount out of order.
 * @param {object|null} slice
 */
export function setItemsSelectionStore(slice) {
    ownershipStack.length = 0;
    activeItemsSelectionStore = slice;
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
    activeItemsSelectionStore = slice;
    return token;
}

/**
 * Releases ownership claimed via pushItemsSelectionStore. Only restores the active
 * store when the released owner's slice is still the currently active one — if
 * something else (another owner, or a direct setItemsSelectionStore call) has since
 * taken over, that claim is left untouched and this owner is just removed from the
 * stack's bookkeeping.
 * @param {symbol} token
 */
export function popItemsSelectionStore(token) {
    const index = ownershipStack.findIndex((entry) => entry.token === token);
    if (index === -1) return;
    const wasTopmost = index === ownershipStack.length - 1;
    const wasActive = ownershipStack[index].slice === activeItemsSelectionStore;
    ownershipStack.splice(index, 1);
    if (wasActive) {
        const next = ownershipStack[ownershipStack.length - 1];
        activeItemsSelectionStore = next ? next.slice : null;
    }
    if (!wasTopmost) {
        console.warn(
            'popItemsSelectionStore: released owner was not the topmost claim. ' +
                'This indicates two owners overlapped out of stack order — check for a ' +
                'connect-before-disconnect race between editors.',
        );
    }
}
