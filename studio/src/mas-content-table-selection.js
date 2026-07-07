const NESTED_VARIATION_CHECKBOX_SELECTOR = 'mas-fragment-variations mas-fragment-table.nested-fragment sp-table-checkbox-cell';
const NESTED_VARIATION_ROW_SELECTOR = 'mas-fragment-variations mas-fragment-table.nested-fragment sp-table-row';

export function getParentFragmentIds(fragmentStores) {
    const ids = new Set();
    fragmentStores.forEach((fragmentStore) => {
        const fragment = fragmentStore.get();
        if (fragment?.id) ids.add(fragment.id);
    });
    return ids;
}

export function getParentRowSelection(fragmentStores, selection) {
    const parentIds = getParentFragmentIds(fragmentStores);
    return selection.filter((id) => parentIds.has(id));
}

export function mergeParentTableSelection(selectedSet, fragmentStores, currentSelection) {
    const parentIds = getParentFragmentIds(fragmentStores);
    const parentSelected = Array.from(selectedSet).filter((id) => id && parentIds.has(id));
    const variationSelected = currentSelection.filter((id) => !parentIds.has(id));
    return [...parentSelected, ...variationSelected];
}

export function stripNestedVariationSelectControls(root) {
    const checkboxCells = root.querySelectorAll(NESTED_VARIATION_CHECKBOX_SELECTOR);
    const rows = root.querySelectorAll(NESTED_VARIATION_ROW_SELECTOR);
    const needsStrip =
        checkboxCells.length > 0 ||
        [...rows].some(
            (row) => row.selected || row.selectable || row.hasAttribute('selected') || row.hasAttribute('aria-selected'),
        );

    if (!needsStrip) return false;

    checkboxCells.forEach((cell) => cell.remove());
    rows.forEach((row) => {
        row.selected = false;
        row.selectable = false;
        row.removeAttribute('selected');
        row.removeAttribute('aria-selected');
    });
    return true;
}
