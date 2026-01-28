import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-placeholder-picker.css.js';
import './mas-selected-items.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { Fragment } from '../aem/fragment.js';
import { FRAGMENT_STATUS } from '../constants.js';

class MasPlaceholderPicker extends LitElement {
    static styles = styles;

    static properties = {
        error: { type: String, state: true },
        selectedInTable: { type: Array, state: true },
    };

    #placeholders = [];
    #placeholdersSubscription;

    connectedCallback() {
        super.connectedCallback();
        this.selectedInTable = [];
        this.repository.loadPlaceholders();
        this.placeholdersStoreController = new ReactiveController(this, [Store.translationProjects.placeholders]);

        this.#placeholdersSubscription = Store.placeholders.list.data.subscribe(() => {
            this.resetPlaceholders();
            const placeholdersByPath = new Map(
                this.#placeholders.map((data) => {
                    const placeholder = new Fragment(data);
                    return [
                        placeholder.path,
                        {
                            title: placeholder.getFieldValue('key'),
                            description: 'placeholder',
                            path: placeholder.path,
                        },
                    ];
                }),
            );
            Store.translationProjects.placeholdersByPaths.set(placeholdersByPath);
            this.selectedInTable = Store.translationProjects.placeholders.value;
            this.requestUpdate();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#placeholdersSubscription?.();
    }

    /** @type {import('../mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    handleSearchInput(e) {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.resetPlaceholders();
        if (this.searchQuery) {
            this.#placeholders = this.#placeholders.filter((item) => {
                return item.key.toLowerCase().includes(this.searchQuery) || item.value.toLowerCase().includes(this.searchQuery);
            });
        }
        this.requestUpdate();
    }

    resetPlaceholders() {
        this.#placeholders = Store.placeholders.list.data.get().map((storeItem) => storeItem.get());
    }

    get nbResults() {
        return this.#placeholders.length;
    }

    get placeholders() {
        return this.#placeholders;
    }

    get loadingIndicator() {
        if (!Store.placeholders.list.loading.value) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    updateSelected({ target: { selected } }) {
        this.selectedInTable = selected;
        const currentSelected = Store.translationProjects.placeholders.value;
        const withoutUnselected = currentSelected.filter((path) => selected.includes(path));
        const newSelected = new Set([...withoutUnselected, ...selected]);
        Store.translationProjects.placeholders.set(Array.from(newSelected));
    }

    removeItem({ detail: { path } }) {
        if (!path) return;
        const newSelected = this.selectedInTable.filter((selectedId) => selectedId !== path);
        if (newSelected.length === 0) {
            this.shadowRoot.querySelector(`sp-table-row[value="${path}"]`)?.click();
        }
        this.selectedInTable = newSelected;
        Store.translationProjects.placeholders.set(newSelected);
    }

    renderStatus(status) {
        if (!status) return nothing;
        let statusClass = '';
        if (status === FRAGMENT_STATUS.PUBLISHED) {
            statusClass = 'green';
        } else if (status === FRAGMENT_STATUS.MODIFIED) {
            statusClass = 'blue';
        }
        return html`<sp-table-cell class="status-cell">
            <div class="status-dot ${statusClass}"></div>
            ${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}
        </sp-table-cell>`;
    }

    render() {
        return html`<div class="search">
                <sp-search size="m" placeholder="Search" @input=${this.handleSearchInput}></sp-search>
                <div>${this.nbResults} result(s)</div>
            </div>
            <div class="container">
                ${Store.placeholders.list.loading.value
                    ? html`<div class="loading-container">${this.loadingIndicator}</div>`
                    : html`<sp-table
                          emphasized
                          selects="multiple"
                          .selected=${this.selectedInTable}
                          @change=${this.updateSelected}
                      >
                          <sp-table-head>
                              <sp-table-head-cell>Key</sp-table-head-cell>
                              <sp-table-head-cell>Value</sp-table-head-cell>
                              <sp-table-head-cell>Status</sp-table-head-cell>
                          </sp-table-head>
                          <sp-table-body>
                              ${repeat(
                                  this.placeholders,
                                  (placeholder) => placeholder.path,
                                  (placeholder) =>
                                      html`<sp-table-row value=${placeholder.path}>
                                          <sp-table-cell>${placeholder.key}</sp-table-cell>
                                          <sp-table-cell>${placeholder.value}</sp-table-cell>
                                          ${this.renderStatus(placeholder.status, html)}
                                      </sp-table-row>`,
                              )}
                          </sp-table-body>
                      </sp-table>`}
                <mas-selected-items @remove=${this.removeItem}></mas-selected-items>
            </div>`;
    }
}

customElements.define('mas-placeholder-picker', MasPlaceholderPicker);
