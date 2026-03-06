import { LitElement, html, nothing } from 'lit';
import { lastNestedRowIcon, nestedRowIcon, overrideNestedRowIcon, settingsEmptyStateIcon } from '../icons.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import Store from '../store.js';
import { toPascalCase } from '../utils.js';
import { tableStyles } from './mas-settings-table.css.js';
import { DELETE_BLOCKED_STATUSES } from './settings-store.js';

/**
 * Settings table component for expanded fragment settings view.
 */
export class MasSettingsTable extends LitElement {
    static styles = [tableStyles];

    static properties = {
        sortBy: { type: String, attribute: false },
        sortDirection: { type: String, attribute: false },
    };

    #columnNames = ['expand', 'label', 'locale', 'template', 'value', 'tags', 'editor', 'datetime', 'status', 'actions'];

    #columnSyncFrame = 0;

    #observedTable = null;

    #resizeObserver = new ResizeObserver(() => {
        this.#scheduleColumnWidthSync();
    });

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

    firstUpdated() {
        this.#observeTable();
        this.#scheduleColumnWidthSync();
    }

    updated() {
        this.#observeTable();
        this.#scheduleColumnWidthSync();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        cancelAnimationFrame(this.#columnSyncFrame);
        this.#resizeObserver.disconnect();
    }

    #dispatchEvent(type, detail) {
        this.dispatchEvent(
            new CustomEvent(type, {
                detail,
                bubbles: true,
                composed: true,
            }),
        );
    }

    #observeTable() {
        const table = this.renderRoot.querySelector('#settings-table');
        if (table === this.#observedTable) return;
        if (this.#observedTable) this.#resizeObserver.unobserve(this.#observedTable);
        this.#observedTable = table;
        if (table) this.#resizeObserver.observe(table);
    }

    #scheduleColumnWidthSync() {
        cancelAnimationFrame(this.#columnSyncFrame);
        this.#columnSyncFrame = requestAnimationFrame(() => {
            this.#columnSyncFrame = 0;
            this.#syncColumnWidths();
        });
    }

    #syncColumnWidths() {
        for (const columnName of this.#columnNames) {
            const cells = this.renderRoot.querySelectorAll(`[data-column="${columnName}"]`);
            const width = Math.max(...[...cells].map((cell) => Math.ceil(cell.getBoundingClientRect().width)), 0);
            if (!width) continue;

            const propertyName = `--cell-${columnName}-width`;
            const nextValue = `${width}px`;
            if (this.style.getPropertyValue(propertyName).trim() === nextValue) continue;
            this.style.setProperty(propertyName, nextValue);
        }
    }

    #handleToggleExpand = (event) => {
        this.settings.toggleExpanded(event.currentTarget.dataset.rowId);
    };

    #handleToggleValue = (event) => {
        this.settings.toggleSetting(event.currentTarget.dataset.rowId, event.currentTarget.checked);
    };

    #handleSort = ({ detail: { sortKey, sortDirection } }) => {
        this.sortBy = sortKey;
        this.sortDirection = sortDirection;
    };

    #handleAddOverride = (event) => {
        this.#dispatchEvent('setting-add-override', { id: event.currentTarget.dataset.rowId });
    };

    #handleAction = (event) => {
        const { action, rowId } = event.currentTarget.dataset;
        this.#dispatchEvent(action, { id: rowId });
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

    #formatDateParts(dateString = '') {
        if (!dateString) return { date: '-', time: '' };
        const parsedDate = new Date(dateString);
        if (Number.isNaN(parsedDate.getTime())) return { date: dateString, time: '' };
        return {
            date: parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
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

    #formatStatus(status = '') {
        if (!status) return '-';
        return status
            .toLowerCase()
            .split('_')
            .map((segment) => toPascalCase(segment))
            .join(' ');
    }

    #statusVariant(status = '') {
        switch (status) {
            case 'PUBLISHED':
                return 'positive';
            case 'DRAFT':
                return 'info';
            case 'MODIFIED':
                return 'yellow';
            case 'UNPUBLISHED':
                return 'neutral';
            default:
                return 'neutral';
        }
    }

    #localeSummary(locales = []) {
        if (!locales.length) return { primary: 'All', extraCount: 0 };
        const [primary, ...rest] = locales;
        return {
            primary,
            extraCount: rest.length,
        };
    }

    #templateSummary(templateIds = [], templateSummary = '') {
        const summary = templateSummary || this.settings.formatTemplateSummary(templateIds);
        return summary === 'All templates selected' ? 'All' : summary || 'All';
    }

    #valueText(record) {
        if (record.valueType === 'text' || record.valueType === 'richText') {
            return this.#normalizeDisplayValue(record.value);
        }
        return record.label || this.#normalizeDisplayValue(record.value);
    }

    #countTagTemplate(count) {
        if (!count) return nothing;
        return html`<sp-tag size="s" class="summary-count-tag">${`+${count}`}</sp-tag>`;
    }

    #labelInfoTemplate(description = '') {
        if (!description) return nothing;

        return html`
            <overlay-trigger placement="top">
                <sp-icon-info class="label-info-icon"></sp-icon-info>
                <sp-tooltip slot="hover-content" placement="top">${description}</sp-tooltip>
            </overlay-trigger>
        `;
    }

    #localeCellTemplate(locales = []) {
        const { primary, extraCount } = this.#localeSummary(locales);

        return html`
            <div class="summary-content">
                <span class="summary-text">${primary}</span>
                ${this.#countTagTemplate(extraCount)}
            </div>
        `;
    }

    #templateCellTemplate(record) {
        return html`<span class="cell-text" title=${this.#templateSummary(record.templateIds, record.templateSummary)}
            >${this.#templateSummary(record.templateIds, record.templateSummary)}</span
        >`;
    }

    #tagsCellTemplate(tags = []) {
        const normalizedTags = this.#normalizeTags(tags);

        if (!normalizedTags.length) return html`<span class="summary-text">All</span>`;

        const [firstTag, ...rest] = normalizedTags;
        return html`
            <div class="summary-content">
                <sp-tag size="s">${firstTag}</sp-tag>
                ${this.#countTagTemplate(rest.length)}
            </div>
        `;
    }

    #labelCellTemplate(record, { nested = false } = {}) {
        return html`
            <div class="label-content ${nested ? 'is-nested' : ''}">
                <div class="label-copy">
                    <span class="setting-label-text" title=${record.label || '-'}>${record.label || '-'}</span>
                </div>
                ${nested ? nothing : this.#labelInfoTemplate(record.description || '')}
            </div>
        `;
    }

    #valueCellTemplate(record, { rowId, overrideId = '' } = {}) {
        const showToggle = record.valueType !== 'text' && record.valueType !== 'richText';
        const checked = Boolean(record.booleanValue);

        return html`
            <div class="value-content">
                ${showToggle
                    ? html`
                          <sp-switch
                              size="m"
                              data-row-id=${rowId}
                              data-override-id=${overrideId}
                              .checked=${checked}
                              @change=${overrideId ? this.#handleToggleOverrideValue : this.#handleToggleValue}
                          ></sp-switch>
                      `
                    : nothing}
                <span class="value-text" title=${this.#valueText(record)}>${this.#valueText(record)}</span>
            </div>
        `;
    }

    #dateCellTemplate(dateString = '') {
        const { date, time } = this.#formatDateParts(dateString);

        return html`
            <div class="date-content">
                <span>${time ? `${date},` : date}</span>
                ${time ? html`<span>${time}</span>` : nothing}
            </div>
        `;
    }

    #statusCellTemplate(status = '') {
        return html`
            <div class="status-content">
                <sp-status-light size="s" variant=${this.#statusVariant(status)}></sp-status-light>
                <span>${this.#formatStatus(status)}</span>
            </div>
        `;
    }

    #actionsCellTemplate({ rowId, overrideId = '', status }) {
        const canDelete = !DELETE_BLOCKED_STATUSES.includes(status);
        const canUnpublishOverride = Boolean(overrideId) && ['PUBLISHED', 'MODIFIED'].includes(status);

        return html`
            <sp-action-menu class="row-actions-menu" quiet size="m" placement="bottom-end">
                <sp-icon-more slot="icon"></sp-icon-more>
                <sp-menu-item
                    data-action="setting-edit"
                    data-row-id=${rowId}
                    data-override-id=${overrideId}
                    @click=${overrideId ? this.#handleOverrideAction : this.#handleAction}
                >
                    <sp-icon-edit slot="icon"></sp-icon-edit>
                    Edit setting
                </sp-menu-item>
                ${canUnpublishOverride
                    ? html`
                          <sp-menu-item
                              data-action="setting-unpublish"
                              data-row-id=${rowId}
                              data-override-id=${overrideId}
                              @click=${this.#handleOverrideAction}
                          >
                              <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
                              Unpublish
                          </sp-menu-item>
                      `
                    : nothing}
                ${canDelete
                    ? html`
                          <sp-menu-item
                              data-action="setting-delete"
                              data-row-id=${rowId}
                              data-override-id=${overrideId}
                              @click=${overrideId ? this.#handleOverrideAction : this.#handleAction}
                          >
                              <sp-icon-delete slot="icon"></sp-icon-delete>
                              Delete
                          </sp-menu-item>
                      `
                    : nothing}
            </sp-action-menu>
        `;
    }

    #topLevelRowTemplate(renderedRow) {
        const { row, expanded } = renderedRow;

        return html`
            <sp-table-row value=${row.id} class="mas-setting-row ${expanded ? 'is-expanded' : ''}">
                <sp-table-cell class="expand-column" data-column="expand">
                    <sp-action-button
                        quiet
                        class="expand-button"
                        data-row-id=${row.id}
                        aria-label=${expanded ? 'Collapse row' : 'Expand row'}
                        @click=${this.#handleToggleExpand}
                    >
                        ${expanded
                            ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-right slot="icon"></sp-icon-chevron-right>`}
                    </sp-action-button>
                </sp-table-cell>
                <sp-table-cell class="label-column" data-column="label">${this.#labelCellTemplate(row)}</sp-table-cell>
                <sp-table-cell class="locale-column" data-column="locale"
                    >${this.#localeCellTemplate(row.locales)}</sp-table-cell
                >
                <sp-table-cell class="template-column" data-column="template">${this.#templateCellTemplate(row)}</sp-table-cell>
                <sp-table-cell class="value-column" data-column="value"
                    >${this.#valueCellTemplate(row, { rowId: row.id })}</sp-table-cell
                >
                <sp-table-cell class="tags-column" data-column="tags">${this.#tagsCellTemplate(row.tags)}</sp-table-cell>
                <sp-table-cell class="editor-column" data-column="editor"
                    ><span class="cell-text">${row.modifiedBy || '-'}</span></sp-table-cell
                >
                <sp-table-cell class="datetime-column" data-column="datetime"
                    >${this.#dateCellTemplate(row.modifiedAt)}</sp-table-cell
                >
                <sp-table-cell class="status-column" data-column="status"
                    >${this.#statusCellTemplate(row.status)}</sp-table-cell
                >
                <sp-table-cell class="actions-column actions-cell" data-column="actions">
                    ${this.#actionsCellTemplate({ rowId: row.id, status: row.status })}
                </sp-table-cell>
            </sp-table-row>
        `;
    }

    #overrideRowTemplate(renderedRow, override, index) {
        const isLast = index === renderedRow.overrides.length - 1;
        const connectorIcon = isLast ? lastNestedRowIcon : nestedRowIcon;

        return html`
            <div class="override-row">
                <div class="override-connector-cell">
                    <span class="override-connector-icon ${isLast ? 'is-last' : ''}">${connectorIcon}</span>
                </div>
                <div class="override-content-row ${isLast ? 'is-last' : ''} ${index === 0 ? 'is-first' : ''}">
                    <div class="override-cell label-column override-label-column">
                        ${this.#labelCellTemplate(override, { nested: true })}
                    </div>
                    <div class="override-cell locale-column">${this.#localeCellTemplate(override.locales)}</div>
                    <div class="override-cell template-column">
                        <span class="cell-text" title=${this.#templateSummary(override.templateIds, override.template)}
                            >${this.#templateSummary(override.templateIds, override.template)}</span
                        >
                    </div>
                    <div class="override-cell value-column">
                        ${this.#valueCellTemplate(override, {
                            rowId: renderedRow.row.id,
                            overrideId: override.id,
                        })}
                    </div>
                    <div class="override-cell tags-column">${this.#tagsCellTemplate(override.tags)}</div>
                    <div class="override-cell editor-column"><span class="cell-text">${override.modifiedBy || '-'}</span></div>
                    <div class="override-cell datetime-column">${this.#dateCellTemplate(override.modifiedAt)}</div>
                    <div class="override-cell status-column">${this.#statusCellTemplate(override.status)}</div>
                    <div class="override-cell actions-column actions-cell">
                        ${this.#actionsCellTemplate({
                            rowId: renderedRow.row.id,
                            overrideId: override.id,
                            status: override.status,
                        })}
                    </div>
                </div>
            </div>
        `;
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
                <sp-table-cell class="expand-column override-panel-hidden"></sp-table-cell>
                <sp-table-cell class="override-panel-content">
                    <div class="override-panel-toolbar">
                        <sp-action-button size="m" data-row-id=${renderedRow.row.id} @click=${this.#handleAddOverride}>
                            <sp-icon-add slot="icon"></sp-icon-add>
                            Add override
                        </sp-action-button>
                    </div>
                    ${hasOverrides
                        ? html`
                              <span class="override-trunk-icon">${overrideNestedRowIcon}</span>
                              <div class="override-rows">
                                  ${renderedRow.overrides.map((override, index) =>
                                      this.#overrideRowTemplate(renderedRow, override, index),
                                  )}
                              </div>
                          `
                        : nothing}
                </sp-table-cell>
            </sp-table-row>
        `;
    }

    get loadingTemplate() {
        if (!this.settings.loading.get()) return nothing;
        return html`
            <div id="loading-state">
                <sp-progress-circle indeterminate size="l"></sp-progress-circle>
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
        if (this.settings.loading.get() || this.settings.error.get() || this.#renderedRows.length > 0) return nothing;
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
                    <sp-table-head-cell class="expand-column" data-column="expand"></sp-table-head-cell>
                    <sp-table-head-cell
                        class="label-column"
                        data-column="label"
                        id="label-header-cell"
                        sortable
                        sort-key="label"
                        sort-direction=${this.sortDirection}
                        @sorted=${this.#handleSort}
                    >
                        Label
                    </sp-table-head-cell>
                    <sp-table-head-cell class="locale-column" data-column="locale">Locale</sp-table-head-cell>
                    <sp-table-head-cell class="template-column" data-column="template">Template</sp-table-head-cell>
                    <sp-table-head-cell class="value-column" data-column="value">Value</sp-table-head-cell>
                    <sp-table-head-cell class="tags-column" data-column="tags">Tags</sp-table-head-cell>
                    <sp-table-head-cell class="editor-column" data-column="editor">Last edited by</sp-table-head-cell>
                    <sp-table-head-cell class="datetime-column" data-column="datetime">Date and time</sp-table-head-cell>
                    <sp-table-head-cell class="status-column" data-column="status">Status</sp-table-head-cell>
                    <sp-table-head-cell class="actions-column" data-column="actions">Actions</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${rows.length
                        ? rows.map(
                              (renderedRow) => html`
                                  ${this.#topLevelRowTemplate(renderedRow)} ${this.overridePanelTemplate(renderedRow)}
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
