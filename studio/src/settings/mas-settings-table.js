import { LitElement, html, nothing } from 'lit';
import ReactiveController from '../reactivity/reactive-controller.js';
import { styles } from './mas-settings-table.css.js';
import { SettingsStore } from './settings-store.js';
import './mas-setting-item.js';

/**
 * Settings table component for expanded fragment settings view.
 */
export class MasSettingsTable extends LitElement {
    static styles = [styles];

    static properties = {
        loading: { type: Boolean, attribute: false },
        sortBy: { type: String, attribute: false },
        sortDirection: { type: String, attribute: false },
    };

    constructor() {
        super();
        this.loading = false;
        this.sortBy = 'label';
        this.sortDirection = 'asc';
        this.settings = SettingsStore;
        this.reactiveController = new ReactiveController(this, [
            this.settings.rows,
            this.settings.loading,
            this.settings.error,
            this.settings.expandedRowIds,
            this.settings.activeTabByRowId,
        ]);
    }

    reactiveController;

    #handleToggleExpand = (event) => {
        this.settings.toggleExpanded(event.detail.id);
    };

    #handleToggleValue = (event) => {
        this.settings.toggleSetting(event.detail.id, event.detail.checked);
    };

    #handleSort = ({ detail: { sortKey, sortDirection } }) => {
        this.sortBy = sortKey;
        this.sortDirection = sortDirection;
    };

    get sortedRows() {
        const rows = [...this.settings.rows.get()];
        const direction = this.sortDirection === 'desc' ? -1 : 1;

        return rows.sort((leftStore, rightStore) => {
            const leftValue = `${leftStore.value[this.sortBy] ?? ''}`;
            const rightValue = `${rightStore.value[this.sortBy] ?? ''}`;
            const comparison = leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' });
            if (comparison !== 0) return comparison * direction;
            return leftStore.value.id.localeCompare(rightStore.value.id);
        });
    }

    get loadingTemplate() {
        if (!this.loading && !this.settings.loading.get()) return nothing;
        return html`
            <div id="loading-state">
                <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                <p>Loading settings...</p>
            </div>
        `;
    }

    get emptyTemplate() {
        if (this.loading || this.settings.loading.get() || this.settings.error.get() || this.settings.rows.get().length > 0) return nothing;
        return html`
            <div id="empty-state">
                <svg
                    class="empty-state-icon"
                    width="96"
                    height="96"
                    viewBox="0 0 86 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        d="M48.3984 0C59.8005 0.000264534 68.9875 9.26586 69.665 20.7988C78.7519 22.271 85.5995 30.4497 85.5996 40.1807C85.5996 50.9332 77.2322 59.7998 66.7295 59.7998C66.6998 59.7998 66.6741 59.7994 66.6543 59.7988C66.6481 59.7989 66.6419 59.7998 66.6357 59.7998H13.9287C13.8424 59.7998 13.7573 59.7928 13.6738 59.7822C6.0076 59.529 1.35973e-05 52.9961 0 45.1309C0 39.0767 3.54866 33.8386 8.67188 31.6113C8.5926 30.9557 8.54883 30.2846 8.54883 29.5996C8.5489 20.4499 15.6727 12.8828 24.6406 12.8828C26.0812 12.8828 27.476 13.0831 28.8027 13.4531C32.0422 5.58222 39.5594 0 48.3984 0ZM48.3984 4C40.7472 4 34.1852 9.23211 31.9248 16.584C31.7578 17.1272 31.3675 17.5742 30.8516 17.8125C30.3357 18.0507 29.7425 18.058 29.2207 17.833C27.8047 17.2223 26.2609 16.8828 24.6406 16.8828C18.0438 16.8828 12.5489 22.4935 12.5488 29.5996C12.5488 30.5834 12.667 31.5473 12.876 32.4912C13.1046 33.5236 12.4902 34.5558 11.4736 34.8467C7.21448 36.0651 4 40.1637 4 45.1309C4.00001 51.0418 8.5235 55.6961 13.9629 55.79C14.0152 55.7909 14.0669 55.795 14.1182 55.7998H66.6016C66.6162 55.7996 66.6308 55.7978 66.6455 55.7979C66.6758 55.798 66.7022 55.7983 66.7207 55.7988C66.7264 55.799 66.7322 55.7986 66.7373 55.7988C74.8655 55.7946 81.5996 48.887 81.5996 40.1807C81.5995 31.7791 75.3213 25.0462 67.5791 24.5889C66.5068 24.5256 65.6759 23.6267 65.6973 22.5527C65.7022 22.305 65.707 22.3002 65.707 22.166C65.7069 12.0506 57.8767 4.00028 48.3984 4Z"
                        fill="currentColor"
                    />
                </svg>
                <div class="empty-state-copy">
                    <p class="empty-state-title">No settings created yet</p>
                    <p class="empty-state-description">Click the button above to begin creating a setting list.</p>
                </div>
            </div>
        `;
    }

    get tableTemplate() {
        const rows = this.sortedRows;
        if (!rows.length) return nothing;

        return html`
            <sp-table id="settings-table" size="m">
                <sp-table-head>
                    <sp-table-head-cell class="expand-column"></sp-table-head-cell>
                    <sp-table-head-cell
                        id="label-header-cell"
                        sortable
                        sort-key="label"
                        sort-direction=${this.sortDirection}
                        @sorted=${this.#handleSort}
                    >
                        Label
                    </sp-table-head-cell>
                    <sp-table-head-cell>Locale</sp-table-head-cell>
                    <sp-table-head-cell>Template</sp-table-head-cell>
                    <sp-table-head-cell>Value</sp-table-head-cell>
                    <sp-table-head-cell>Tags</sp-table-head-cell>
                    <sp-table-head-cell>Last edited by</sp-table-head-cell>
                    <sp-table-head-cell>Date and time</sp-table-head-cell>
                    <sp-table-head-cell>Status</sp-table-head-cell>
                    <sp-table-head-cell>Actions</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${rows.map(
                        (rowStore) => html`
                            <mas-setting-item
                                .store=${rowStore}
                                .expanded=${this.settings.isExpanded(rowStore.value.id)}
                                @setting-toggle-expand=${this.#handleToggleExpand}
                                @setting-toggle-value=${this.#handleToggleValue}
                            ></mas-setting-item>
                        `,
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    render() {
        return html`
            <div id="settings-content">
                ${this.tableTemplate}
                ${this.emptyTemplate}
                ${this.loadingTemplate}
            </div>
        `;
    }
}

customElements.define('mas-settings-table', MasSettingsTable);
