import { LitElement, html, css, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { sortFieldsByGroup } from './compare-chart-fields.js';

const EVENT_COLUMN_CLICK = 'column-click';
const EVENT_SECTION_CLICK = 'section-click';
const EVENT_ROW_CLICK = 'row-click';
const EVENT_CELL_CLICK = 'cell-click';
const EVENT_ADD_ROW = 'add-row';
const EVENT_SECTION_TITLE_CHANGE = 'section-title-change';
const EVENT_ROW_TITLE_CHANGE = 'row-title-change';

class CompareChartPreview extends LitElement {
    static properties = {
        columns: { type: Array, attribute: false },
        sections: { type: Array, attribute: false },
        selectedColumnIndex: { type: Number, attribute: false },
        selectedSectionIndex: { type: Number, attribute: false },
        selectedRowIndex: { type: Number, attribute: false },
        selectedCellIndex: { type: Number, attribute: false },
        editingSectionIndex: { type: Number, state: true },
        editingRowIndex: { type: Number, state: true },
    };

    static styles = css`
        :host {
            display: block;
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            table-layout: fixed;
        }

        th,
        td {
            border: 1px solid var(--spectrum-global-color-gray-300, #dadada);
            padding: 8px 12px;
            text-align: center;
            vertical-align: middle;
            cursor: pointer;
            transition: background 0.15s;
        }

        th {
            background: var(--spectrum-global-color-gray-200, #f0f0f0);
            font-weight: 600;
            font-size: 12px;
        }

        th:hover,
        td:hover {
            background: var(--spectrum-global-color-blue-100, #e8f0fe);
        }

        th.selected,
        td.selected {
            outline: 2px solid var(--spectrum-global-color-blue-500, #1473e6);
            outline-offset: -2px;
            background: var(--spectrum-global-color-blue-100, #e8f0fe);
        }

        .section-row td {
            background: var(--spectrum-global-color-gray-100, #f5f5f5);
            font-weight: 700;
            text-align: left;
            font-size: 13px;
            cursor: text;
        }

        .section-row td:hover,
        .row-label:hover {
            text-decoration: underline dashed var(--spectrum-global-color-gray-500, #929292);
            text-underline-offset: 3px;
        }

        .row-label {
            text-align: left;
            font-weight: 500;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: text;
        }

        .inline-edit-input {
            all: unset;
            width: 100%;
            font: inherit;
            background: var(--spectrum-global-color-blue-100, #e8f0fe);
            border-bottom: 2px solid var(--spectrum-global-color-blue-500, #1473e6);
        }

        .badge {
            display: inline-block;
            background: var(--spectrum-global-color-blue-500, #1473e6);
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 4px;
        }

        .column-header {
            min-width: 100px;
            position: relative;
        }

        .column-config-affordance {
            display: contents;
        }

        .column-gear-icon {
            display: none;
            position: absolute;
            top: 4px;
            right: 4px;
            font-size: 10px;
            opacity: 0.5;
            line-height: 1;
        }

        .column-header:hover .column-gear-icon,
        .column-header.selected .column-gear-icon {
            display: block;
        }

        .column-title {
            font-weight: 700;
            font-size: 13px;
        }

        .column-subtitle {
            font-size: 11px;
            color: var(--spectrum-global-color-gray-700, #6e6e6e);
        }

        .column-field {
            font-size: 11px;
            color: var(--spectrum-global-color-gray-700, #6e6e6e);
            font-weight: 400;
            line-height: 1.3;
        }

        .column-field-icon {
            display: flex;
            justify-content: center;
            gap: 4px;
        }

        .column-field-icon img {
            width: 24px;
            height: 24px;
        }

        .checkmark::before {
            content: '\\2713';
            color: var(--spectrum-global-color-green-600, #12805c);
            font-weight: 700;
        }

        .crossmark::before {
            content: '\\2715';
            color: var(--spectrum-global-color-gray-800, #4b4b4b);
            font-weight: 700;
        }

        .empty-cell {
            color: var(--spectrum-global-color-gray-400, #b3b3b3);
        }

        .empty-state {
            padding: 32px;
            text-align: center;
            color: var(--spectrum-global-color-gray-600, #6e6e6e);
        }

        .add-row-row td {
            border: none;
            padding: 4px 12px;
        }
    `;

    constructor() {
        super();
        this.columns = [];
        this.sections = [];
        this.selectedColumnIndex = -1;
        this.selectedSectionIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
        this.editingSectionIndex = -1;
        this.editingRowIndex = -1;
    }

    #dispatch(eventName, detail) {
        this.dispatchEvent(
            new CustomEvent(eventName, {
                detail,
                bubbles: true,
                composed: true,
            }),
        );
    }

    #onColumnClick(colIndex, event) {
        const anchorRect = event.currentTarget.getBoundingClientRect();
        this.#dispatch(EVENT_COLUMN_CLICK, { columnIndex: colIndex, anchorRect });
    }

    #onSectionClick(sectionIndex, event) {
        const anchorRect = event.currentTarget.getBoundingClientRect();
        this.#dispatch(EVENT_SECTION_CLICK, { sectionIndex, anchorRect });
    }

    #onRowClick(sectionIndex, rowIndex, event) {
        const anchorRect = event.currentTarget.getBoundingClientRect();
        this.#dispatch(EVENT_ROW_CLICK, { sectionIndex, rowIndex, anchorRect });
    }

    #onCellClick(sectionIndex, rowIndex, cellIndex, event) {
        const anchorRect = event.currentTarget.getBoundingClientRect();
        this.#dispatch(EVENT_CELL_CLICK, { sectionIndex, rowIndex, cellIndex, anchorRect });
    }

    #onAddRow(sectionIndex) {
        this.#dispatch(EVENT_ADD_ROW, { sectionIndex });
    }

    #onSectionDblClick(sIdx) {
        this.editingSectionIndex = sIdx;
        this.editingRowIndex = -1;
    }

    #onRowDblClick(sIdx, rIdx) {
        this.editingSectionIndex = sIdx;
        this.editingRowIndex = rIdx;
    }

    #commitSectionTitle(sIdx, inputEl) {
        if (this.editingSectionIndex === -1) return;
        this.#dispatch(EVENT_SECTION_TITLE_CHANGE, {
            sectionIndex: sIdx,
            value: inputEl.value,
        });
        this.#cancelEdit();
    }

    #commitRowTitle(sIdx, rIdx, inputEl) {
        if (this.editingSectionIndex === -1) return;
        this.#dispatch(EVENT_ROW_TITLE_CHANGE, {
            sectionIndex: sIdx,
            rowIndex: rIdx,
            value: inputEl.value,
        });
        this.#cancelEdit();
    }

    #cancelEdit() {
        this.editingSectionIndex = -1;
        this.editingRowIndex = -1;
    }

    #onEditKeydown(e, commitFn) {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitFn();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.#cancelEdit();
        }
    }

    updated() {
        if (this.editingSectionIndex === -1) return;
        const input = this.renderRoot?.querySelector('.inline-edit-input');
        if (input) {
            input.focus();
            input.select();
        }
    }

    #extractPlainText(htmlString) {
        if (!htmlString) return '';
        if (!htmlString.includes('<')) return htmlString;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        return doc.body.textContent || '';
    }

    #renderCellValue(value) {
        if (!value?.valueType) return html`<span class="empty-cell">--</span>`;

        if (value.valueType === 'true') return html`<span class="checkmark"></span>`;
        if (value.valueType === 'false') return html`<span class="crossmark"></span>`;

        return html`${value.valueType}`;
    }

    #renderColumnFieldPreview(fieldName, cardFieldData) {
        const value = cardFieldData?.[fieldName];
        if (value === undefined || value === null || value === '') return nothing;
        if (fieldName === 'mnemonicIcon') {
            const urls = Array.isArray(value) ? value : [value];
            return html`<div class="column-field-icon">
                ${urls.filter(Boolean).map((url) => html`<img src="${url}" alt="" />`)}
            </div>`;
        }
        if (fieldName === 'cardTitle') {
            const text = typeof value === 'object' ? value.value || '' : String(value);
            return html`<div class="column-title">${this.#extractPlainText(text)}</div>`;
        }
        const isHtml = typeof value === 'object' && value.mimeType === 'text/html';
        const raw = isHtml ? value.value || '' : String(value);
        if (!raw) return nothing;
        if (isHtml) {
            return html`<div class="column-field">${unsafeHTML(raw)}</div>`;
        }
        return html`<div class="column-field">${this.#extractPlainText(raw)}</div>`;
    }

    /** Groups fields by semantic category to match autoblock rendering order. */
    #groupFields(fields) {
        return sortFieldsByGroup(fields);
    }

    #renderColumnHeader(column, colIndex) {
        const isSelected = this.selectedColumnIndex === colIndex;
        const selectedFields = column.fields || [];
        const cardFieldData = column.cardFieldData || {};
        const hasFieldData = Object.keys(cardFieldData).length > 0;
        const grouped = this.#groupFields(selectedFields);

        return html`
            <th class="column-header ${isSelected ? 'selected' : ''}" @click=${(e) => this.#onColumnClick(colIndex, e)}>
                <div class="column-config-affordance">
                    ${hasFieldData && grouped.length
                        ? grouped.map((f) => this.#renderColumnFieldPreview(f, cardFieldData))
                        : html`<div class="column-title">${column.title || `Column ${colIndex + 1}`}</div>`}
                    ${column.badge ? html`<div class="badge">${column.badge}</div>` : nothing}
                </div>
                <div class="column-gear-icon">⚙</div>
            </th>
        `;
    }

    render() {
        if (!this.columns?.length && !this.sections?.length) {
            return html`<div class="empty-state">No data to display. Add columns and sections to build the chart.</div>`;
        }

        const numColumns = this.columns?.length || 0;

        return html`
            <table>
                <thead>
                    <tr>
                        <th></th>
                        ${(this.columns || []).map((col, i) => this.#renderColumnHeader(col, i))}
                    </tr>
                </thead>
                <tbody>
                    ${(this.sections || []).map(
                        (section, sIdx) => html`
                            <tr class="section-row">
                                <td
                                    colspan="${numColumns + 1}"
                                    class="${this.selectedSectionIndex === sIdx && this.selectedRowIndex === -1
                                        ? 'selected'
                                        : ''}"
                                    @click=${(e) => this.#onSectionClick(sIdx, e)}
                                    @dblclick=${(e) => {
                                        e.stopPropagation();
                                        this.#onSectionDblClick(sIdx);
                                    }}
                                >
                                    ${this.editingSectionIndex === sIdx && this.editingRowIndex === -1
                                        ? html`<input
                                              class="inline-edit-input"
                                              .value=${section.title || ''}
                                              @blur=${(e) => this.#commitSectionTitle(sIdx, e.target)}
                                              @keydown=${(e) =>
                                                  this.#onEditKeydown(e, () => this.#commitSectionTitle(sIdx, e.target))}
                                              @click=${(e) => e.stopPropagation()}
                                          />`
                                        : section.title}
                                </td>
                            </tr>
                            ${(section.rows || []).map(
                                (row, rIdx) => html`
                                    <tr>
                                        <td
                                            class="row-label ${this.selectedSectionIndex === sIdx &&
                                            this.selectedRowIndex === rIdx &&
                                            this.selectedCellIndex === -1
                                                ? 'selected'
                                                : ''}"
                                            @click=${(e) => this.#onRowClick(sIdx, rIdx, e)}
                                            @dblclick=${(e) => {
                                                e.stopPropagation();
                                                this.#onRowDblClick(sIdx, rIdx);
                                            }}
                                        >
                                            ${this.editingSectionIndex === sIdx && this.editingRowIndex === rIdx
                                                ? html`<input
                                                      class="inline-edit-input"
                                                      .value=${this.#extractPlainText(row.title)}
                                                      @blur=${(e) => this.#commitRowTitle(sIdx, rIdx, e.target)}
                                                      @keydown=${(e) =>
                                                          this.#onEditKeydown(e, () =>
                                                              this.#commitRowTitle(sIdx, rIdx, e.target),
                                                          )}
                                                      @click=${(e) => e.stopPropagation()}
                                                  />`
                                                : this.#extractPlainText(row.title)}
                                        </td>
                                        ${(row.values || []).map(
                                            (val, cIdx) => html`
                                                <td
                                                    class="${this.selectedSectionIndex === sIdx &&
                                                    this.selectedRowIndex === rIdx &&
                                                    this.selectedCellIndex === cIdx
                                                        ? 'selected'
                                                        : ''}"
                                                    @click=${(e) => this.#onCellClick(sIdx, rIdx, cIdx, e)}
                                                >
                                                    ${this.#renderCellValue(val)}
                                                </td>
                                            `,
                                        )}
                                        ${Array.from({
                                            length: Math.max(0, numColumns - (row.values?.length || 0)),
                                        }).map((_, offset) => {
                                            const cIdx = (row.values?.length || 0) + offset;
                                            const isSelected =
                                                this.selectedSectionIndex === sIdx &&
                                                this.selectedRowIndex === rIdx &&
                                                this.selectedCellIndex === cIdx;
                                            return html`
                                                <td
                                                    class="empty-cell ${isSelected ? 'selected' : ''}"
                                                    @click=${(e) => this.#onCellClick(sIdx, rIdx, cIdx, e)}
                                                >
                                                    --
                                                </td>
                                            `;
                                        })}
                                    </tr>
                                `,
                            )}
                            <tr class="add-row-row">
                                <td colspan="${numColumns + 1}">
                                    <sp-action-button size="s" quiet @click=${() => this.#onAddRow(sIdx)}>
                                        <sp-icon-add slot="icon"></sp-icon-add>
                                        Add Row
                                    </sp-action-button>
                                </td>
                            </tr>
                        `,
                    )}
                </tbody>
            </table>
        `;
    }
}

customElements.define('compare-chart-preview', CompareChartPreview);
