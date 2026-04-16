import Store from '../store.js';

let activeItemsSelectionStore = Store.translationProjects;

export function getItemsSelectionStore() {
    return activeItemsSelectionStore;
}

/**
 * @param {typeof Store.translationProjects} slice
 */
export function setItemsSelectionStore(slice) {
    activeItemsSelectionStore = slice;
}
