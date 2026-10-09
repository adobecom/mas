import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-region-picker.css.js';
import { groupByRegion } from '../../locales.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import {
    handleSearchInput,
    filterBySearchQuery,
    computeSelectAllChecked,
    computeSelectAllIndeterminate,
    computeSelectionCountLabel,
} from '../utils/selectable-list.js';

class MasRegionPicker extends LitElement {
    static styles = styles;

    static properties = {
        items: { type: Array, attribute: false },
        store: { type: Object, attribute: false },
        searchQuery: { type: String, state: true },
        noun: { type: String },
        nounPlural: { type: String, attribute: 'noun-plural' },
        searchPlaceholder: { type: String, attribute: 'search-placeholder' },
    };

    constructor() {
        super();
        this.items = [];
        this.store = null;
        this.searchQuery = '';
        this.noun = 'item';
        this.searchPlaceholder = 'Search';
        this.sortedItems = [];
        this.storeController = new ReactiveController(this, []);
    }

    willUpdate(changed) {
        if (changed.has('store')) {
            this.storeController.updateStores([this.store].filter(Boolean));
        }
        if (changed.has('items')) {
            this.sortedItems = [...(this.items ?? [])].sort((a, b) => a.value.localeCompare(b.value));
        }
    }

    get selected() {
        return this.store?.value ?? [];
    }

    get filteredItems() {
        return filterBySearchQuery(this.sortedItems, this.searchQuery, (item) => item.value);
    }

    handleSearch(e) {
        this.searchQuery = handleSearchInput(e);
    }

    get selectAllChecked() {
        return computeSelectAllChecked(this.sortedItems.length, this.selected.length);
    }

    get selectAllIndeterminate() {
        return computeSelectAllIndeterminate(this.sortedItems.length, this.selected.length);
    }

    get countLabel() {
        return computeSelectionCountLabel(this.selected.length, this.sortedItems.length, this.noun, this.nounPlural);
    }

    get groupedItems() {
        return groupByRegion(this.filteredItems, (item) => item.country);
    }

    selectAll(e) {
        this.store.set(e.target.checked ? this.sortedItems.map((item) => item.value) : []);
    }

    toggleRegion(regionItems, e) {
        const values = regionItems.map((item) => item.value);
        const allSelected = values.every((value) => this.selected.includes(value));
        if (allSelected || e.target.indeterminate) {
            this.store.set(this.selected.filter((value) => !values.includes(value)));
        } else {
            this.store.set([...new Set([...this.selected, ...values])]);
        }
    }

    toggleItem(e) {
        e.stopPropagation();
        const value = e.target.textContent.trim();
        if (e.target.checked) {
            this.store.set([...this.selected, value]);
        } else {
            this.store.set(this.selected.filter((selected) => selected !== value));
        }
    }

    isRegionAllSelected(items) {
        return items.every((item) => this.selected.includes(item.value));
    }

    isRegionIndeterminate(items) {
        const selected = items.filter((item) => this.selected.includes(item.value));
        return selected.length > 0 && selected.length < items.length;
    }

    renderItemGrid(items) {
        const columns = 4;
        const colSize = Math.ceil(items.length / columns);
        const cols = Array.from({ length: columns }, (_, i) => items.slice(i * colSize, (i + 1) * colSize));
        return html`
            <div class="locale-grid">
                ${cols.map(
                    (col) => html`
                        <div class="locale-col">
                            ${col.map(
                                (item) => html`
                                    <sp-checkbox ?checked=${this.selected.includes(item.value)} @change=${this.toggleItem}>
                                        ${item.value}
                                    </sp-checkbox>
                                `,
                            )}
                        </div>
                    `,
                )}
            </div>
        `;
    }

    renderRegion(group) {
        return html`
            <div class="region-card">
                <div class="region-header">
                    <sp-checkbox
                        ?checked=${this.isRegionAllSelected(group.items)}
                        ?indeterminate=${this.isRegionIndeterminate(group.items)}
                        @change=${(e) => this.toggleRegion(group.items, e)}
                    ></sp-checkbox>
                    <span class="region-name">${group.name}</span>
                </div>
                ${this.renderItemGrid(group.items)}
            </div>
        `;
    }

    render() {
        return html`
            <div class="select-lang-content">
                <div class="sticky-header">
                    <sp-search
                        placeholder=${this.searchPlaceholder}
                        .value=${this.searchQuery}
                        @input=${this.handleSearch}
                        @change=${this.handleSearch}
                    ></sp-search>
                    <div class="select-all-row">
                        <sp-checkbox
                            ?checked=${this.selectAllChecked}
                            ?indeterminate=${this.selectAllIndeterminate}
                            @change=${this.selectAll}
                        >
                            Select all
                        </sp-checkbox>
                        <span class="locale-count">${this.countLabel}</span>
                    </div>
                    <sp-divider size="s"></sp-divider>
                </div>
                <div class="regions">
                    ${this.groupedItems.map((group) => this.renderRegion(group))}
                    ${this.groupedItems.length === 0 ? html`<p class="no-results">No results match your search.</p>` : nothing}
                </div>
            </div>
        `;
    }
}

customElements.define('mas-region-picker', MasRegionPicker);
