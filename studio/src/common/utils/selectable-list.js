/**
 * Shared building blocks for search + select-all + indeterminate-checkbox list UIs
 * (e.g. mas-promo-variation-geos, mas-translation-languages).
 */

/**
 * Extracts the new search query value from a search input/change event.
 * @param {Event} e
 * @returns {string}
 */
export function handleSearchInput(e) {
    return e.target.value;
}

/**
 * Filters items by a case-insensitive substring match against extracted searchable text.
 * @param {Array} items
 * @param {string} searchQuery
 * @param {(item: any) => string} getSearchableText
 * @returns {Array}
 */
export function filterBySearchQuery(items, searchQuery, getSearchableText) {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => getSearchableText(item).toLowerCase().includes(query));
}

/**
 * @param {number} selectableCount
 * @param {number} selectedCount
 * @returns {boolean}
 */
export function computeSelectAllChecked(selectableCount, selectedCount) {
    return selectableCount > 0 && selectedCount === selectableCount;
}

/**
 * @param {number} selectableCount
 * @param {number} selectedCount
 * @returns {boolean}
 */
export function computeSelectAllIndeterminate(selectableCount, selectedCount) {
    return selectedCount > 0 && selectedCount < selectableCount;
}

/**
 * Formats a "N <noun> selected" / "N <noun>" label, singularizing correctly at 1.
 * @param {number} selectedCount
 * @param {number} totalCount
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
export function computeSelectionCountLabel(selectedCount, totalCount, singular, plural = `${singular}s`) {
    if (selectedCount) return `${selectedCount} ${selectedCount === 1 ? singular : plural} selected`;
    return `${totalCount} ${totalCount === 1 ? singular : plural}`;
}
