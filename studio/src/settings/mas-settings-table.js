import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { settingsEmptyStateIcon } from '../icons.js';
import { tableStyles } from './mas-settings-table.css.js';
import './mas-setting-item.js';

/**
 * Settings table component for expanded fragment settings view.
 */
export class MasSettingsTable extends LitElement {
    static styles = [tableStyles];

    static properties = {
        sortBy: { type: String, attribute: false },
        sortDirection: { type: String, attribute: false },
    };

    #renderedRows = [];

    constructor() {
        super();
        this.sortBy = 'label';
        this.sortDirection = 'asc';
        this.settings = Store.settings;
        this.reactiveController = new ReactiveController(this, [
            this.settings.rows,
            this.settings.loading,
            this.settings.error,
            this.settings.expandedRowIds,
            this.settings.activeTabByRowId,
        ]);
    }

    reactiveController;

    #dispatchEvent(type, detail) {
        this.dispatchEvent(
            new CustomEvent(type, {
                detail,
                bubbles: true,
                composed: true,
            }),
        );
    }

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

    #handleAddOverride = (event) => {
        this.#dispatchEvent('setting-add-override', { id: event.currentTarget.dataset.rowId });
    };

    #handleOverrideAction = (event) => {
        const { action, rowId, overrideId } = event.currentTarget.dataset;
        this.#dispatchEvent(action, {
            id: overrideId,
            parentId: rowId,
            isOverride: true,
        });
    };

    #handleToggleOverrideValue = (event) => {
        const { rowId, overrideId } = event.currentTarget.dataset;
        this.settings.toggleOverride(rowId, overrideId, event.currentTarget.checked);
    };

    #formatOverrideLocales(locales = []) {
        if (!locales.length) return '-';
        return locales.join(', ');
    }

    #normalizeDisplayValue(value) {
        if (value === true) return 'On';
        if (value === false) return 'Off';
        if (`${value}` === '' || `${value}` === 'undefined') return '-';
        return `${value}`;
    }

    #normalizeTags(tags = []) {
        if (!tags.length) return [];
        return tags.map((tag) => tag?.title || tag?.id || `${tag}`);
    }

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

    willUpdate() {
        this.#renderedRows = this.sortedRows.map((rowStore) => {
            const row = rowStore.value;
            const overrides = row.overrides || [];
            return {
                key: row.id,
                store: rowStore,
                row,
                expanded: this.settings.isExpanded(row.id),
                overrides,
            };
        });
    }

    overridePanelTemplate(renderedRow) {
        if (!renderedRow.expanded) return nothing;
        const hasOverrides = renderedRow.overrides.length > 0;

        return html`
            <sp-table-row class="override-panel-row" value=${`${renderedRow.row.id}:overrides`}>
                <sp-table-cell class="expand-column"></sp-table-cell>
                <sp-table-cell class="override-panel-content">
                    <div class="override-panel-toolbar">
                        <sp-action-button size="m" data-row-id=${renderedRow.row.id} @click=${this.#handleAddOverride}>
                            <sp-icon-add slot="icon"></sp-icon-add>
                            Add override
                        </sp-action-button>
                    </div>
                    ${hasOverrides
                        ? html`
                              <sp-table class="override-table" size="m">
                                  <sp-table-head>
                                      <sp-table-head-cell class="override-locale-column">Locale</sp-table-head-cell>
                                      <sp-table-head-cell class="override-template-column">Template</sp-table-head-cell>
                                      <sp-table-head-cell>Local value</sp-table-head-cell>
                                      <sp-table-head-cell class="override-tags-column">Tag</sp-table-head-cell>
                                      <sp-table-head-cell class="override-actions-column">Actions</sp-table-head-cell>
                                  </sp-table-head>
                                  <sp-table-body>
                                      ${renderedRow.overrides.map((override) => {
                                          const tags = this.#normalizeTags(override.tags || []);
                                          return html`
                                              <sp-table-row class="override-table-row" value=${override.id}>
                                                  <sp-table-cell class="override-locale-column">
                                                      ${this.#formatOverrideLocales(override.locales)}
                                                  </sp-table-cell>
                                                  <sp-table-cell class="override-template-column">
                                                      ${this.settings.formatTemplateSummary(override.templateIds)}
                                                  </sp-table-cell>
                                                  <sp-table-cell class="override-value-cell">
                                                      <sp-switch
                                                          size="m"
                                                          data-row-id=${renderedRow.row.id}
                                                          data-override-id=${override.id}
                                                          .checked=${Boolean(override.booleanValue)}
                                                          @change=${this.#handleToggleOverrideValue}
                                                      ></sp-switch>
                                                      <span>${this.#normalizeDisplayValue(override.value)}</span>
                                                  </sp-table-cell>
                                                  <sp-table-cell class="override-tags-cell override-tags-column">
                                                      ${tags.length
                                                          ? tags.map((tag) => html`<sp-tag size="s">${tag}</sp-tag>`)
                                                          : '-'}
                                                  </sp-table-cell>
                                                  <sp-table-cell class="override-actions-cell override-actions-column">
                                                      <sp-action-menu quiet size="m" placement="bottom-end">
                                                          <sp-icon-more slot="icon"></sp-icon-more>
                                                          <sp-menu-item
                                                              data-action="setting-edit"
                                                              data-row-id=${renderedRow.row.id}
                                                              data-override-id=${override.id}
                                                              @click=${this.#handleOverrideAction}
                                                          >
                                                              <sp-icon-edit slot="icon"></sp-icon-edit>
                                                              Edit setting
                                                          </sp-menu-item>
                                                          <sp-menu-item
                                                              data-action="setting-delete"
                                                              data-row-id=${renderedRow.row.id}
                                                              data-override-id=${override.id}
                                                              @click=${this.#handleOverrideAction}
                                                          >
                                                              <sp-icon-delete slot="icon"></sp-icon-delete>
                                                              Delete
                                                          </sp-menu-item>
                                                      </sp-action-menu>
                                                  </sp-table-cell>
                                              </sp-table-row>
                                          `;
                                      })}
                                  </sp-table-body>
                              </sp-table>
                          `
                        : nothing}
                </sp-table-cell>
            </sp-table-row>
        `;
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

    get emptyStateContentTemplate() {
        return html`
            <div id="empty-state">
                ${settingsEmptyStateIcon}
                <div class="empty-state-copy">
                    <p class="empty-state-title">No settings created yet</p>
                    <p class="empty-state-description">Click the button above to begin creating a setting list.</p>
                </div>
            </div>
        `;
    }

    get emptyStateRowTemplate() {
        if (this.settings.loading.get() || this.settings.error.get() || this.#renderedRows.length > 0)
            return nothing;
        return html`
            <sp-table-row class="empty-state-row" value="empty-state">
                <sp-table-cell class="expand-column"></sp-table-cell>
                <sp-table-cell class="empty-state-content">${this.emptyStateContentTemplate}</sp-table-cell>
            </sp-table-row>
        `;
    }

    get tableTemplate() {
        const rows = this.#renderedRows;

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
                <sp-table-body
                    @setting-toggle-expand=${this.#handleToggleExpand}
                    @setting-toggle-value=${this.#handleToggleValue}
                >
                    ${rows.length
                        ? rows.map(
                              (renderedRow) => html`
                                  <mas-setting-item
                                      .store=${renderedRow.store}
                                      .expanded=${renderedRow.expanded}
                                  ></mas-setting-item>
                                  ${this.overridePanelTemplate(renderedRow)}
                              `,
                          )
                        : nothing}
                    ${this.emptyStateRowTemplate}
                </sp-table-body>
            </sp-table>
        `;
    }

    render() {
        return html` <div id="settings-content">${this.tableTemplate} ${this.loadingTemplate}</div> `;
    }
}

customElements.define('mas-settings-table', MasSettingsTable);
