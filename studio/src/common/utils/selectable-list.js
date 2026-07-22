/**
 * Shared building blocks for search + select-all + indeterminate-checkbox list UIs
 * (e.g. mas-promo-variation-geos, mas-translation-languages).
 */

/**
 * Adds the search-box wiring shared by list-selector components (search query state,
 * input handler, substring filter). Host component still owns its own `searchQuery`
 * reactive property declaration and initial value.
 * @param {typeof import('lit').LitElement} Base
 */
export const SearchableListMixin = (Base) =>
    class extends Base {
        handleSearch(e) {
            this.searchQuery = e.target.value;
        }

        /**
         * @param {Array} items
         * @param {(item: any) => string} getSearchableText
         * @returns {Array}
         */
        filterBySearchQuery(items, getSearchableText) {
            if (!this.searchQuery) return items;
            const query = this.searchQuery.toLowerCase();
            return items.filter((item) => getSearchableText(item).toLowerCase().includes(query));
        }
    };

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
