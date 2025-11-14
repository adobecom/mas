import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import styles from './mas-placeholders.css.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import './mas-placeholders-creation-modal.js';
import './mas-placeholders-item.js';
import Events from '../events.js';
import { MasRepository } from '../mas-repository.js';
import '../mas-selection-panel.js';
import { showToast } from '../utils.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { FragmentStore } from '../reactivity/fragment-store.js';

class MasPlaceholders extends LitElement {
    static styles = styles;

    static properties = {
        internalPlaceholders: { type: Array, state: true },
        editing: { type: Boolean, state: true },
        activeDropdown: { type: String, state: true },
        showCreationModal: { type: Boolean, state: true },
        selects: { type: String, state: true },
        pending: { type: Boolean, state: true },
        error: { type: String, state: true },
    };

    constructor() {
        super();

        this.internalPlaceholders = [];
        this.editing = null;
        this.activeDropdown = null;
        this.showCreationModal = false;
        this.selects = undefined;
        this.pending = false;

        this.updateSort = this.updateSort.bind(this);
        this.sortAndFilter = this.sortAndFilter.bind(this);
        this.toggleEditing = this.toggleEditing.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.toggleCreationModal = this.toggleCreationModal.bind(this);
        this.onDeleted = this.onDeleted.bind(this);
        this.onBulkDelete = this.onBulkDelete.bind(this);
        this.updatePending = this.updatePending.bind(this);
    }

    reactiveController = new ReactiveController(this, [
        Store.filters,
        Store.folders.data,
        Store.folders.loaded,
        Store.placeholders?.list?.data,
        Store.placeholders?.list?.loading,
        Store.placeholders.index,
        Store.placeholders.list.loading,
        Store.placeholders.selection,
        Store.search,
    ]);
    filterAndSortReactiveController = new ReactiveController(
        this,
        [Store.placeholders.list.data, Store.placeholders.search, Store.sort],
        this.sortAndFilter,
    );

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.handleClickOutside);
        Events.fragmentDeleted.subscribe(this.onDeleted);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this.handleClickOutside);
        Events.fragmentDeleted.unsubscribe(this.onDeleted);
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (!changedProperties.has('pending')) return;
        const checkboxes = this.shadowRoot.querySelectorAll('sp-table-checkbox-cell');
        checkboxes.forEach((checkbox) => {
            if (this.pending) checkbox.setAttribute('disabled', '');
            else checkbox.removeAttribute('disabled');
        });
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /** @type {FragmentStore[]} */
    get placeholders() {
        return Store.placeholders.list.data.get();
    }

    get locale() {
        return Store.filters.get().locale;
    }

    get loading() {
        return Store.placeholders.list.loading.get();
    }

    get totalPlaceholders() {
        if (this.loading) return '';
        return this.placeholders.length;
    }

    get selection() {
        return Store.placeholders.selection.get();
    }

    get searchTerm() {
        return Store.placeholders.search.get();
    }

    get sortBy() {
        return Store.sort.get().sortBy;
    }

    get sortDirection() {
        return Store.sort.get().sortDirection;
    }

    // #region Handlers

    updateSearch(event) {
        Store.placeholders.search.set(event.target.value);
        this.refresh();
    }

    updateSort(field) {
        if (this.sortBy === field) {
            Store.sort.set((prev) => ({
                ...prev,
                sortDirection: this.sortDirection === 'asc' ? 'desc' : 'asc',
            }));
        } else {
            Store.sort.set({ sortBy: field, sortDirection: 'asc' });
        }
    }

    sortAndFilter() {
        // Filter
        /** @type {FragmentStore[]} */
        let filtered = this.placeholders;
        if (this.searchTerm) {
            const removeFromSelection = [];
            filtered = this.placeholders.filter((placeholderStore) => {
                const placeholder = placeholderStore.get();
                const query = this.searchTerm.toLowerCase();
                const key = placeholder.key?.toLowerCase() || '';
                const value = placeholder.value?.toLowerCase() || '';
                const matches = key.includes(query) || value.includes(query);
                if (!matches) {
                    if (this.selection.includes(placeholder.key)) removeFromSelection.push(placeholder.key);
                }
                return matches;
            });
            if (removeFromSelection.length > 0) {
                Store.placeholders.selection.set((prev) => prev.filter((key) => !removeFromSelection.includes(key)));
            }
        }

        // Sort
        const sorted = filtered.sort((aStore, bStore) => {
            const a = aStore.get();
            const b = bStore.get();
            const aValue = a[this.sortBy] || '';
            const bValue = b[this.sortBy] || '';
            const comparison = aValue.localeCompare(bValue);
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        if (sorted.length === 0) this.selects = undefined;
        this.internalPlaceholders = sorted;
        this.refresh();
    }

    updateSelection(event) {
        Store.placeholders.selection.set(Array.from(event.target.selectedSet));
    }

    toggleDropdown(key, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (this.activeDropdown === key) this.activeDropdown = null;
        else this.activeDropdown = key;
    }

    handleClickOutside(event) {
        if (
            this.activeDropdown &&
            !event.target.closest('.dropdown-menu') &&
            !event.target.closest('.action-menu-button') &&
            !event.target.closest('.dropdown-item')
        ) {
            this.activeDropdown = null;
        }
    }

    toggleEditing(key, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (this.editing === key) this.editing = null;
        else this.editing = key;
    }

    toggleCreationModal() {
        this.showCreationModal = !this.showCreationModal;
    }

    onSave() {
        this.refresh();
    }

    async onDeleted(placeholder) {
        Store.placeholders.list.data.set((prev) =>
            prev.filter((placeholderStore) => placeholderStore.get().id !== placeholder.id),
        );
        if (this.selection.includes(placeholder.key)) {
            if (this.selection.length === 1) this.handleSelectionPanelClose();
            else {
                Store.placeholders.selection.set((prev) => prev.filter((key) => key !== placeholder.key));
                this.refresh();
            }
        }
        showToast(`Placeholder ${placeholder.key} successfully deleted.`, 'positive');
        this.pending = false;
    }

    async onBulkDelete(keys) {
        const confirmed = await confirmation({
            title: 'Delete placeholder(s)',
            content: `Are you sure you want to delete ${keys.length} placeholder(s)? This action cannot be undone.`,
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;

        const fragments = this.placeholders
            .filter((placeholderStore) => {
                return keys.includes(placeholderStore.get().key);
            })
            .map((placeholderStore) => placeholderStore.get());

        this.pending = true;
        showToast('Deleting placeholders...');

        await this.repository.removeFromIndexFragment(fragments);
        await this.repository.bulkDeleteFragments(fragments, {
            startToast: false,
            endToast: false,
        });

        this.pending = false;
        showToast('Successfully deleted placeholders', 'positive');
        this.handleSelectionPanelClose();
    }

    handleSelectionPanelClose() {
        Store.placeholders.selection.set([]);
        this.refresh();
    }

    updatePending(value) {
        this.pending = value;
    }

    // #endregion

    /**
     * This is needed because selection checkboxes are lost on filtering
     * Whenever some filtering happens (rows are added/removed) this needs to be called
     */
    async refresh() {
        if (this.internalPlaceholders.length === 0) return;
        this.selects = undefined;
        await this.updateComplete;
        this.selects = 'multiple';
    }

    render() {
        return html`
            <div class="placeholders-container">
                <div class="placeholders-header">
                    <div class="header-left">
                        <mas-locale-picker
                            @locale-changed=${(event) =>
                                Store.filters.set((prev) => ({
                                    ...prev,
                                    locale: event.detail.locale,
                                }))}
                            .value=${this.locale}
                        ></mas-locale-picker>
                    </div>
                    <sp-button variant="primary" @click=${this.toggleCreationModal} class="create-button">
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create New Placeholder
                    </sp-button>
                </div>

                ${this.renderError()}

                <div class="search-filters-container">
                    <div class="placeholders-title">
                        <h2>Total Placeholders: ${this.totalPlaceholders}</h2>
                    </div>
                    <div class="filters-container">
                        <sp-search
                            size="m"
                            placeholder="Search by key or value"
                            @input=${this.updateSearch}
                            value=${this.searchTerm}
                        ></sp-search>
                    </div>
                </div>

                <div class="placeholders-content">${this.loadingIndicator()}${this.renderTable()}</div>

                ${this.showCreationModal
                    ? html`<mas-placeholders-creation-modal
                          .onClose=${this.toggleCreationModal}
                          @save=${this.onSave}
                      ></mas-placeholders-creation-modal>`
                    : ''}
            </div>
            <mas-selection-panel
                ?open=${this.selection.length > 0}
                .selectionStore=${Store.placeholders.selection}
                .onDelete=${this.onBulkDelete}
                @close=${this.handleSelectionPanelClose}
            ></mas-selection-panel>
        `;
    }

    loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle class="loading-indicator" indeterminate size="l"></sp-progress-circle>`;
    }

    // #region Table

    renderTable() {
        const columns = [
            { key: 'key', label: 'Key', sortable: true },
            {
                key: 'value',
                label: 'Value',
                sortable: true,
                style: 'min-width: 300px;',
            },
            { key: 'status', label: 'Status', sortable: true, priority: true },
            { key: 'locale', label: 'Locale', sortable: true, align: 'right' },
            {
                key: 'updatedBy',
                label: 'Updated by',
                sortable: true,
                align: 'right',
            },
            {
                key: 'updatedAt',
                label: 'Date & Time',
                sortable: true,
                align: 'right',
            },
            { key: 'action', label: 'Action', align: 'right' },
        ];

        return html`
            <sp-table
                emphasized
                scroller
                selects=${this.selects}
                selected=${JSON.stringify(this.selection)}
                class="placeholders-table"
                @change=${this.updateSelection}
                ?disabled=${true}
            >
                <sp-table-head>
                    ${columns.map(
                        ({ key, label, sortable, align }) => html`
                            <sp-table-head-cell
                                class="${key} ${align === 'right' ? 'align-right' : ''}"
                                ?sortable=${sortable}
                                @click=${sortable ? () => this.updateSort(key) : undefined}
                            >
                                ${label}
                            </sp-table-head-cell>
                        `,
                    )}
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        this.internalPlaceholders,
                        (placeholderStore) => placeholderStore.get().key,
                        (placeholderStore) => {
                            const placeholder = placeholderStore.get();
                            return html`
                                <mas-placeholders-item
                                    key=${placeholder.key}
                                    .placeholderStore=${placeholderStore}
                                    .editing=${this.editing === placeholder.key}
                                    .disabled=${this.pending}
                                    .activeDropdown=${this.activeDropdown === placeholder.key}
                                    .toggleEditing=${this.toggleEditing}
                                    .toggleDropdown=${this.toggleDropdown}
                                    .updatePending=${this.updatePending}
                                ></mas-placeholders-item>
                            `;
                        },
                    )}
                    ${this.internalPlaceholders.length === 0 && !this.loading
                        ? html`<p class="no-placeholders-label">No placeholders found</p>`
                        : nothing}
                </sp-table-body>
            </sp-table>
        `;
    }

    // #endregion

    renderError() {
        if (!this.error) return nothing;

        return html`
            <div class="error-message">
                <sp-icon-alert></sp-icon-alert>
                <span>${this.error}</span>
            </div>
        `;
    }
}

customElements.define('mas-placeholders', MasPlaceholders);
