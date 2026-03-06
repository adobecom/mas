import { LitElement, html, css, nothing } from 'lit';

const EVENT_COLUMN_CLICK = 'column-click';
const EVENT_SECTION_CLICK = 'section-click';
const EVENT_ROW_CLICK = 'row-click';
const EVENT_CELL_CLICK = 'cell-click';
const EVENT_ADD_ROW = 'add-row';

class CompareChartPreview extends LitElement {
    static properties = {
        columns: { type: Array, attribute: false },
        sections: { type: Array, attribute: false },
        selectedColumnIndex: { type: Number, attribute: false },
        selectedSectionIndex: { type: Number, attribute: false },
        selectedRowIndex: { type: Number, attribute: false },
        selectedCellIndex: { type: Number, attribute: false },
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
        }

        .row-label {
            text-align: left;
            font-weight: 500;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
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
        }

        .column-title {
            font-weight: 700;
            font-size: 13px;
        }

        .column-subtitle {
            font-size: 11px;
            color: var(--spectrum-global-color-gray-700, #6e6e6e);
        }

        .checkmark::before {
            content: '\\2713';
            color: var(--spectrum-global-color-green-600, #12805c);
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
            text-align: left;
            padding: 4px 12px;
            cursor: default;
        }

        .add-row-row td:hover {
            background: transparent;
        }

        .add-row-btn {
            cursor: pointer;
            font-size: 12px;
            color: var(--spectrum-global-color-blue-500, #1473e6);
            background: none;
            border: 1px dashed var(--spectrum-global-color-gray-400, #b3b3b3);
            border-radius: 4px;
            padding: 4px 10px;
        }

        .add-row-btn:hover {
            background: var(--spectrum-global-color-blue-100, #e8f0fe);
            border-color: var(--spectrum-global-color-blue-500, #1473e6);
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

    #onColumnClick(colIndex) {
        this.#dispatch(EVENT_COLUMN_CLICK, { columnIndex: colIndex });
    }

    #onSectionClick(sectionIndex) {
        this.#dispatch(EVENT_SECTION_CLICK, { sectionIndex });
    }

    #onRowClick(sectionIndex, rowIndex) {
        this.#dispatch(EVENT_ROW_CLICK, { sectionIndex, rowIndex });
    }

    #onCellClick(sectionIndex, rowIndex, cellIndex) {
        this.#dispatch(EVENT_CELL_CLICK, { sectionIndex, rowIndex, cellIndex });
    }

    #onAddRow(sectionIndex) {
        this.#dispatch(EVENT_ADD_ROW, { sectionIndex });
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

        return html`${value.valueType}`;
    }

    #renderColumnHeader(column, colIndex) {
        const isSelected = this.selectedColumnIndex === colIndex;
        return html`
            <th class="column-header ${isSelected ? 'selected' : ''}" @click=${() => this.#onColumnClick(colIndex)}>
                <div class="column-title">${column.title || `Column ${colIndex + 1}`}</div>
                ${column.badge ? html`<div class="badge">${column.badge}</div>` : nothing}
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
                                    @click=${() => this.#onSectionClick(sIdx)}
                                >
                                    ${section.title || `Section ${sIdx + 1}`}
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
                                            @click=${() => this.#onRowClick(sIdx, rIdx)}
                                        >
                                            ${this.#extractPlainText(row.title)}
                                        </td>
                                        ${(row.values || []).map(
                                            (val, cIdx) => html`
                                                <td
                                                    class="${this.selectedSectionIndex === sIdx &&
                                                    this.selectedRowIndex === rIdx &&
                                                    this.selectedCellIndex === cIdx
                                                        ? 'selected'
                                                        : ''}"
                                                    @click=${() => this.#onCellClick(sIdx, rIdx, cIdx)}
                                                >
                                                    ${this.#renderCellValue(val)}
                                                </td>
                                            `,
                                        )}
                                        ${Array.from({
                                            length: Math.max(0, numColumns - (row.values?.length || 0)),
                                        }).map(() => html`<td class="empty-cell">--</td>`)}
                                    </tr>
                                `,
                            )}
                            <tr class="add-row-row">
                                <td colspan="${numColumns + 1}">
                                    <button class="add-row-btn" @click=${() => this.#onAddRow(sIdx)}>+ Add Row</button>
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
