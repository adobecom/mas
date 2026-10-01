import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-grouped-selector.css.js';
import {
    handleSearchInput,
    filterBySearchQuery,
    computeSelectAllChecked,
    computeSelectAllIndeterminate,
    computeSelectionCountLabel,
} from '../utils/selectable-list.js';

/**
 * Grouped checkbox selector shared by the Translations "Selected languages" field and the
 * Promotions "Selected countries" field: a trigger that opens a modal with a search box, a
 * global select-all, and one checkbox group per `groups` entry. Snapshots `value` when the
 * modal opens so a Cancel reverts the live selection made while it was open.
 */
class MasGroupedSelector extends LitElement {
    static styles = styles;

    static properties = {
        label: { type: String },
        itemNoun: { type: String, attribute: 'item-noun' },
        groups: { type: Array },
        value: { type: Array },
        disabled: { type: Boolean },
        placeholder: { type: String },
        readOnly: { type: Boolean, attribute: 'read-only' },
        required: { type: Boolean },
        isExpanded: { type: Boolean, state: true },
        searchQuery: { type: String, state: true },
    };

    constructor() {
        super();
        this.label = 'Selected items';
        this.itemNoun = 'item';
        this.groups = [];
        this.value = [];
        this.disabled = false;
        this.placeholder = '';
        this.readOnly = false;
        this.required = false;
        this.isExpanded = false;
        this.searchQuery = '';
    }

    #snapshot = [];

    get allItems() {
        return this.groups.flatMap((group) => group.items);
    }

    get filteredGroups() {
        return this.groups
            .map((group) => ({ ...group, items: filterBySearchQuery(group.items, this.searchQuery, (item) => item.label) }))
            .filter((group) => group.items.length);
    }

    get selectAllChecked() {
        return computeSelectAllChecked(this.allItems.length, this.value.length);
    }

    get selectAllIndeterminate() {
        return computeSelectAllIndeterminate(this.allItems.length, this.value.length);
    }

    get countLabel() {
        return computeSelectionCountLabel(this.value.length, this.allItems.length, this.itemNoun);
    }

    get #selectedLabels() {
        const labelByValue = new Map(this.allItems.map((item) => [item.value, item.label]));
        return [...this.value]
            .map((value) => labelByValue.get(value) ?? value)
            .sort()
            .join(', ');
    }

    handleSearch(e) {
        e.stopPropagation();
        this.searchQuery = handleSearchInput(e);
    }

    emitChange(value) {
        this.value = value;
        this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }));
    }

    selectAll(e) {
        e.stopPropagation();
        this.emitChange(e.target.checked ? this.allItems.map((item) => item.value) : []);
    }

    isGroupAllSelected(items) {
        return items.length > 0 && items.every((item) => this.value.includes(item.value));
    }

    isGroupIndeterminate(items) {
        const selectedCount = items.filter((item) => this.value.includes(item.value)).length;
        return selectedCount > 0 && selectedCount < items.length;
    }

    toggleGroup(items, e) {
        e.stopPropagation();
        const values = items.map((item) => item.value);
        if (this.isGroupAllSelected(items) || e.target.indeterminate) {
            this.emitChange(this.value.filter((value) => !values.includes(value)));
        } else {
            this.emitChange([...new Set([...this.value, ...values])]);
        }
    }

    toggleItem(e) {
        e.stopPropagation();
        const itemValue = e.target.getAttribute('value');
        if (e.target.checked) {
            this.emitChange([...this.value, itemValue]);
        } else {
            this.emitChange(this.value.filter((value) => value !== itemValue));
        }
    }

    #takeSnapshot = () => {
        this.#snapshot = [...this.value];
        this.searchQuery = '';
    };

    #revertToSnapshot = () => {
        this.emitChange(this.#snapshot);
    };

    #toggleExpanded = () => {
        this.isExpanded = !this.isExpanded;
    };

    renderGroup(group) {
        const allSelected = this.isGroupAllSelected(group.items);
        const indeterminate = this.isGroupIndeterminate(group.items);
        return html`
            <div class="region-card">
                <div class="region-header">
                    <sp-checkbox
                        ?checked=${allSelected}
                        ?indeterminate=${indeterminate}
                        @change=${(e) => this.toggleGroup(group.items, e)}
                    ></sp-checkbox>
                    <span class="region-name">${group.name}</span>
                </div>
                <div class="item-grid">
                    ${group.items.map(
                        (item) => html`
                            <sp-checkbox
                                value=${item.value}
                                ?checked=${this.value.includes(item.value)}
                                @change=${this.toggleItem}
                            >
                                ${item.label}
                            </sp-checkbox>
                        `,
                    )}
                </div>
            </div>
        `;
    }

    get dialogTemplate() {
        return html`
            <sp-dialog-wrapper
                class="grouped-selector-dialog"
                slot="click-content"
                headline="${this.label}"
                confirm-label="Confirm"
                cancel-label="Cancel"
                underlay
                no-divider
                @cancel=${this.#revertToSnapshot}
            >
                <div class="grouped-selector-content">
                    <div class="sticky-header">
                        <sp-search
                            placeholder="Search ${this.itemNoun}"
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
                            <span class="item-count">${this.countLabel}</span>
                        </div>
                        <sp-divider size="s"></sp-divider>
                    </div>
                    <div class="groups">
                        ${this.filteredGroups.map((group) => this.renderGroup(group))}
                        ${this.filteredGroups.length === 0
                            ? html`<p class="no-results">No ${this.itemNoun}s match your search.</p>`
                            : nothing}
                    </div>
                </div>
            </sp-dialog-wrapper>
        `;
    }

    get #requiredIcon() {
        return this.required ? html`<sp-icon-asterisk100></sp-icon-asterisk100>` : nothing;
    }

    get #disabledTemplate() {
        return html`
            <div class="form-field">
                <h2>${this.label} ${this.#requiredIcon}</h2>
                <p class="placeholder">${this.placeholder}</p>
            </div>
        `;
    }

    get #emptyStateTemplate() {
        return html`
            <div class="form-field">
                <h2>${this.label} ${this.#requiredIcon}</h2>
                ${this.readOnly
                    ? nothing
                    : html`
                          <div class="empty-state">
                              <overlay-trigger type="modal" triggered-by="click">
                                  ${this.dialogTemplate}
                                  <sp-button
                                      slot="trigger"
                                      variant="secondary"
                                      size="xl"
                                      icon-only
                                      class="ghost-button"
                                      @click=${this.#takeSnapshot}
                                  >
                                      <sp-icon-add size="xxl" slot="icon" label="Add ${this.itemNoun}s"></sp-icon-add>
                                  </sp-button>
                              </overlay-trigger>
                              <div class="label">
                                  <strong>Add ${this.itemNoun}s</strong><br />
                                  <span>Choose one or more ${this.itemNoun}s.</span>
                              </div>
                          </div>
                      `}
            </div>
        `;
    }

    get #summaryTemplate() {
        return html`
            <div class="form-field" @click=${this.#toggleExpanded}>
                <div class="summary-header">
                    <h2>${this.label} <span>(${this.value.length})</span> ${this.#requiredIcon}</h2>
                    <div>
                        ${this.readOnly
                            ? nothing
                            : html`
                                  <overlay-trigger type="modal" triggered-by="click">
                                      ${this.dialogTemplate}
                                      <sp-action-button
                                          slot="trigger"
                                          quiet
                                          @click=${(e) => {
                                              e.stopPropagation();
                                              this.#takeSnapshot();
                                          }}
                                      >
                                          <sp-icon-edit slot="icon" label="Edit ${this.itemNoun}s"></sp-icon-edit>
                                          Edit
                                      </sp-action-button>
                                  </overlay-trigger>
                              `}
                        <sp-button icon-only class="toggle-btn ghost-button">
                            <sp-icon-chevron-down
                                slot="icon"
                                label="${this.isExpanded ? 'Close' : 'Open'}"
                            ></sp-icon-chevron-down>
                        </sp-button>
                    </div>
                </div>
                ${this.isExpanded ? html`<div class="summary-list">${this.#selectedLabels}</div>` : nothing}
            </div>
        `;
    }

    render() {
        if (this.disabled) return this.#disabledTemplate;
        if (this.value.length === 0) return this.#emptyStateTemplate;
        return this.#summaryTemplate;
    }
}

customElements.define('mas-grouped-selector', MasGroupedSelector);
