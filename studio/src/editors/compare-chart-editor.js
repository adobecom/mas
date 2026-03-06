import { LitElement, html, nothing } from 'lit';
import { Fragment } from '../aem/fragment.js';
import './compare-chart-preview.js';
import { showToast } from '../utils.js';
import {
    COMPARE_FRAGMENT_MODEL_PATH,
    COMPARE_FRAGMENT_MODEL_ID,
    COMPARE_SECTION_MODEL_PATH,
    COMPARE_SECTION_MODEL_ID,
    COMPARE_ROW_MODEL_PATH,
    COMPARE_ROW_MODEL_ID,
    COMPARE_VALUE_MODEL_PATH,
    COMPARE_VALUE_MODEL_ID,
} from '../constants.js';

const PANEL_NONE = 'none';
const PANEL_COLUMN = 'column';
const PANEL_SECTION = 'section';
const PANEL_ROW = 'row';
const PANEL_CELL = 'cell';

class CompareChartEditor extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        updateFragment: { type: Function },
        localeDefaultFragment: { type: Object, attribute: false },
        isVariation: { type: Boolean, attribute: false },
        panelMode: { type: String, state: true },
        selectedColumnIndex: { type: Number, state: true },
        selectedSectionIndex: { type: Number, state: true },
        selectedRowIndex: { type: Number, state: true },
        selectedCellIndex: { type: Number, state: true },
        columns: { type: Array, state: true },
        sections: { type: Array, state: true },
        busy: { type: Boolean, state: true },
    };

    createRenderRoot() {
        return this;
    }

    // Local cache for deep references (rows, values) that direct-hydrated doesn't return
    #localRefs = new Map();

    constructor() {
        super();
        this.panelMode = PANEL_NONE;
        this.selectedColumnIndex = -1;
        this.selectedSectionIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
        this.columns = [];
        this.sections = [];
        this.busy = false;
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    get #parentPath() {
        const path = this.fragment?.path;
        return path?.substring(0, path.lastIndexOf('/'));
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.fragmentStore) {
            this.#buildData();
        }
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore')) {
            this.#buildData();
        }
        super.update(changedProperties);
    }

    // --- Field helpers ---

    #getField(fieldName) {
        return this.fragment?.fields?.find((f) => f.name === fieldName);
    }

    #getRefFragment(path) {
        const ref = this.fragment?.references?.find((r) => r.path === path);
        if (ref) return new Fragment(ref);
        const cached = this.#localRefs.get(path);
        return cached ? new Fragment(cached) : null;
    }

    async #fetchAndCacheRef(path) {
        if (this.#localRefs.has(path)) return;
        try {
            const data = await this.repository.aem.sites.cf.fragments.getByPath(path);
            if (data) {
                this.#localRefs.set(data.path, data);
                // Also cache any direct references it has
                for (const ref of data.references || []) {
                    this.#localRefs.set(ref.path, ref);
                }
            }
        } catch {
            // Fragment may not exist or be inaccessible
        }
    }

    #getRefFieldValue(refFragment, fieldName) {
        return refFragment?.fields?.find((f) => f.name === fieldName)?.values?.[0] || '';
    }

    #getRefFieldValues(refFragment, fieldName) {
        return refFragment?.fields?.find((f) => f.name === fieldName)?.values || [];
    }

    // --- Mutation helpers (following collection editor patterns) ---

    #updateFieldValues(fieldName, values) {
        this.updateFragment({
            target: {
                multiline: true,
                dataset: { field: fieldName },
            },
            values,
        });
        this.requestUpdate();
    }

    #addReference(fragmentData) {
        const existing = this.fragment.references?.find((ref) => ref.path === fragmentData.path);
        if (!existing) {
            this.fragment.references = [...(this.fragment.references || []), fragmentData];
        }
        // Always update local cache for deep reference survival across refreshes
        this.#localRefs.set(fragmentData.path, fragmentData);
    }

    async #saveChildFragment(childFragment) {
        return this.repository.aem.sites.cf.fragments.save(childFragment);
    }

    async #refreshAndRebuild({ fromServer = false } = {}) {
        if (fromServer) {
            await this.repository.refreshFragment(this.fragmentStore);
        }
        this.#buildData();
    }

    // --- Save field on child fragment ---

    async #saveChildField(fragment, fieldName, values) {
        if (!fragment) return;
        // Update the field on the Fragment wrapper for the save call
        const field = fragment.fields?.find((f) => f.name === fieldName);
        if (field) {
            field.values = values;
        } else {
            fragment.fields = [...(fragment.fields || []), { name: fieldName, type: 'text', values }];
        }
        await this.#saveChildFragment(fragment);
        // Update both raw reference and local cache so #buildData picks up new values
        for (const source of [
            this.fragment?.references?.find((r) => r.path === fragment.path),
            this.#localRefs.get(fragment.path),
        ]) {
            if (!source) continue;
            const srcField = source.fields?.find((f) => f.name === fieldName);
            if (srcField) {
                srcField.values = values;
            } else if (source.fields) {
                source.fields.push({ name: fieldName, type: 'text', values });
            }
        }
        this.#buildData();
    }

    // --- Data building ---

    #buildData() {
        if (!this.fragment) return;

        const missingPaths = [];
        const fragmentPaths = this.#getField('fragments')?.values || [];
        const sectionPaths = this.#getField('sections')?.values || [];

        const columns = [];
        for (const path of fragmentPaths) {
            const colFragment = this.#getRefFragment(path);
            if (!colFragment) {
                columns.push({ title: 'Unknown', badge: '', fields: [], path });
                continue;
            }

            const cardRef = this.#getRefFieldValue(colFragment, 'fragment');
            const cardFragment = cardRef ? this.#getRefFragment(cardRef) : null;
            if (cardRef && !cardFragment) {
                missingPaths.push(cardRef);
            }
            const cardTitle = cardFragment
                ? this.#getRefFieldValue(cardFragment, 'cardTitle') || cardFragment.title
                : 'No card';

            columns.push({
                title: cardTitle,
                badge: this.#getRefFieldValue(colFragment, 'badge'),
                fields: this.#getRefFieldValues(colFragment, 'fields'),
                path,
                fragment: colFragment,
                cardFragment: cardFragment ? { path: cardFragment.path, title: cardFragment.title, id: cardFragment.id } : null,
            });
        }

        const sections = [];
        for (const sPath of sectionPaths) {
            const secFragment = this.#getRefFragment(sPath);
            if (!secFragment) {
                sections.push({ title: 'Unknown', rows: [], path: sPath });
                continue;
            }

            const rowPaths = this.#getRefFieldValues(secFragment, 'rows');
            const rows = [];

            for (const rPath of rowPaths) {
                const rowFragment = this.#getRefFragment(rPath);
                if (!rowFragment) {
                    missingPaths.push(rPath);
                    rows.push({ title: 'Loading...', values: [], path: rPath });
                    continue;
                }

                const valuePaths = this.#getRefFieldValues(rowFragment, 'rowValues');
                const values = [];

                for (const vPath of valuePaths) {
                    const valFragment = this.#getRefFragment(vPath);
                    if (!valFragment) {
                        missingPaths.push(vPath);
                        values.push({ valueType: '...', path: vPath });
                        continue;
                    }

                    values.push({
                        valueType: this.#getRefFieldValue(valFragment, 'valueType') || 'true',
                        path: vPath,
                        fragment: valFragment,
                    });
                }

                rows.push({
                    title: this.#getRefFieldValue(rowFragment, 'rowTitle'),
                    values,
                    path: rPath,
                    fragment: rowFragment,
                });
            }

            sections.push({
                title: this.#getRefFieldValue(secFragment, 'sectionTitle'),
                rows,
                path: sPath,
                fragment: secFragment,
            });
        }

        this.columns = columns;
        this.sections = sections;

        // Lazy-fetch missing deep references then rebuild
        if (missingPaths.length > 0) {
            this.#fetchMissingRefs(missingPaths);
        }
    }

    async #fetchMissingRefs(paths) {
        const unique = [...new Set(paths)];
        await Promise.all(unique.map((p) => this.#fetchAndCacheRef(p)));
        // Re-run sync build now that cache is populated
        // Guard against infinite loop: only rebuild if we actually fetched new data
        const stillMissing = unique.filter((p) => !this.#localRefs.has(p));
        if (stillMissing.length < unique.length) {
            this.#buildData();
        }
    }

    // --- Add operations ---

    async #addColumn() {
        if (this.busy) return;
        this.busy = true;
        try {
            const colCount = this.columns.length + 1;
            const created = await this.repository.createFragment(
                {
                    title: `Column ${colCount}`,
                    name: `column-${colCount}-${Date.now()}`,
                    modelId: COMPARE_FRAGMENT_MODEL_ID,
                    parentPath: this.#parentPath,
                    fields: [],
                },
                false,
            );
            const currentPaths = this.#getField('fragments')?.values || [];
            this.#addReference(created);
            this.#updateFieldValues('fragments', [...currentPaths, created.path]);
            this.#buildData();
            showToast('Column added.', 'positive');
        } catch (e) {
            showToast(`Failed to add column: ${e.message}`, 'negative');
        } finally {
            this.busy = false;
        }
    }

    async #addSection() {
        if (this.busy) return;
        this.busy = true;
        try {
            const secCount = this.sections.length + 1;
            const created = await this.repository.createFragment(
                {
                    title: `Section ${secCount}`,
                    name: `section-${secCount}-${Date.now()}`,
                    modelId: COMPARE_SECTION_MODEL_ID,
                    parentPath: this.#parentPath,
                    fields: [
                        {
                            name: 'sectionTitle',
                            type: 'text',
                            values: [`Section ${secCount}`],
                        },
                    ],
                },
                false,
            );
            const currentPaths = this.#getField('sections')?.values || [];
            this.#addReference(created);
            this.#updateFieldValues('sections', [...currentPaths, created.path]);
            this.#buildData();
            showToast('Section added.', 'positive');
        } catch (e) {
            showToast(`Failed to add section: ${e.message}`, 'negative');
        } finally {
            this.busy = false;
        }
    }

    async #addRow(sectionIndex) {
        if (this.busy) return;
        const section = this.sections[sectionIndex];
        if (!section?.fragment) return;

        this.busy = true;
        try {
            const numColumns = this.columns.length;
            const rowCount = section.rows.length + 1;

            // Create one compare-value fragment per column
            const valuePaths = [];
            for (let i = 0; i < numColumns; i++) {
                const valFragment = await this.repository.createFragment(
                    {
                        title: `Value ${rowCount}-${i + 1}`,
                        name: `value-${rowCount}-${i + 1}-${Date.now()}`,
                        modelId: COMPARE_VALUE_MODEL_ID,
                        parentPath: this.#parentPath,
                        fields: [
                            {
                                name: 'valueType',
                                type: 'enumeration',
                                values: ['true'],
                            },
                        ],
                    },
                    false,
                );
                this.#addReference(valFragment);
                valuePaths.push(valFragment.path);
            }

            // Create the row fragment referencing all values
            const rowFragment = await this.repository.createFragment(
                {
                    title: `Row ${rowCount}`,
                    name: `row-${rowCount}-${Date.now()}`,
                    modelId: COMPARE_ROW_MODEL_ID,
                    parentPath: this.#parentPath,
                    fields: [
                        {
                            name: 'rowTitle',
                            type: 'long-text',
                            values: [`Row ${rowCount}`],
                        },
                        {
                            name: 'rowValues',
                            type: 'content-fragment',
                            multiple: true,
                            values: valuePaths,
                        },
                    ],
                },
                false,
            );
            this.#addReference(rowFragment);

            // Update the section's rows field
            const currentRowPaths = this.#getRefFieldValues(section.fragment, 'rows');
            const updatedSection = { ...section.fragment };
            const rowsField = updatedSection.fields?.find((f) => f.name === 'rows');
            if (rowsField) {
                rowsField.values = [...currentRowPaths, rowFragment.path];
            } else {
                updatedSection.fields = [
                    ...(updatedSection.fields || []),
                    {
                        name: 'rows',
                        type: 'content-fragment',
                        multiple: true,
                        values: [rowFragment.path],
                    },
                ];
            }
            await this.#saveChildFragment(updatedSection);
            // Update the raw section reference's rows field so #buildData sees it
            const rawSecRef = this.fragment?.references?.find((r) => r.path === section.path);
            if (rawSecRef) {
                const rawRowsField = rawSecRef.fields?.find((f) => f.name === 'rows');
                if (rawRowsField) {
                    rawRowsField.values = [...currentRowPaths, rowFragment.path];
                }
            }
            this.#buildData();
            showToast('Row added.', 'positive');
        } catch (e) {
            showToast(`Failed to add row: ${e.message}`, 'negative');
        } finally {
            this.busy = false;
        }
    }

    // --- Delete operations ---

    async #deleteColumn(colIndex) {
        if (this.busy) return;
        const col = this.columns[colIndex];
        if (!col) return;

        this.busy = true;
        try {
            // Remove from parent's fragments field
            const currentPaths = this.#getField('fragments')?.values || [];
            const updatedPaths = currentPaths.filter((p) => p !== col.path);
            this.#updateFieldValues('fragments', updatedPaths);

            // Remove positional value from every row's rowValues array
            for (const section of this.sections) {
                for (const row of section.rows) {
                    if (!row.fragment || colIndex >= row.values.length) continue;
                    const valuePaths = this.#getRefFieldValues(row.fragment, 'rowValues');
                    const updatedValues = valuePaths.filter((_, i) => i !== colIndex);
                    const updatedRow = { ...row.fragment };
                    const valuesField = updatedRow.fields?.find((f) => f.name === 'rowValues');
                    if (valuesField) {
                        valuesField.values = updatedValues;
                        await this.#saveChildFragment(updatedRow);
                    }
                }
            }

            this.#buildData();
            this.panelMode = PANEL_NONE;
            this.selectedColumnIndex = -1;
            showToast('Column deleted.', 'positive');
        } catch (e) {
            showToast(`Failed to delete column: ${e.message}`, 'negative');
        } finally {
            this.busy = false;
        }
    }

    async #deleteSection(sectionIndex) {
        if (this.busy) return;
        const sec = this.sections[sectionIndex];
        if (!sec) return;

        this.busy = true;
        try {
            const currentPaths = this.#getField('sections')?.values || [];
            const updatedPaths = currentPaths.filter((p) => p !== sec.path);
            this.#updateFieldValues('sections', updatedPaths);
            this.#buildData();
            this.panelMode = PANEL_NONE;
            this.selectedSectionIndex = -1;
            showToast('Section deleted.', 'positive');
        } catch (e) {
            showToast(`Failed to delete section: ${e.message}`, 'negative');
        } finally {
            this.busy = false;
        }
    }

    async #deleteRow(sectionIndex, rowIndex) {
        if (this.busy) return;
        const section = this.sections[sectionIndex];
        const row = section?.rows?.[rowIndex];
        if (!section?.fragment || !row) return;

        this.busy = true;
        try {
            const currentRowPaths = this.#getRefFieldValues(section.fragment, 'rows');
            const updatedPaths = currentRowPaths.filter((p) => p !== row.path);
            const updatedSection = { ...section.fragment };
            const rowsField = updatedSection.fields?.find((f) => f.name === 'rows');
            if (rowsField) {
                rowsField.values = updatedPaths;
                await this.#saveChildFragment(updatedSection);
            }
            // Update the raw section reference so #buildData sees the change
            const rawSecRef = this.fragment?.references?.find((r) => r.path === section.path);
            if (rawSecRef) {
                const rawRowsField = rawSecRef.fields?.find((f) => f.name === 'rows');
                if (rawRowsField) {
                    rawRowsField.values = updatedPaths;
                }
            }
            this.#buildData();
            this.panelMode = PANEL_NONE;
            this.selectedRowIndex = -1;
            showToast('Row deleted.', 'positive');
        } catch (e) {
            showToast(`Failed to delete row: ${e.message}`, 'negative');
        } finally {
            this.busy = false;
        }
    }

    // --- Event handlers ---

    #onColumnClick(e) {
        const { columnIndex } = e.detail;
        this.panelMode = PANEL_COLUMN;
        this.selectedColumnIndex = columnIndex;
        this.selectedSectionIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
    }

    #onSectionClick(e) {
        const { sectionIndex } = e.detail;
        this.panelMode = PANEL_SECTION;
        this.selectedSectionIndex = sectionIndex;
        this.selectedColumnIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
    }

    #onRowClick(e) {
        const { sectionIndex, rowIndex } = e.detail;
        this.panelMode = PANEL_ROW;
        this.selectedSectionIndex = sectionIndex;
        this.selectedRowIndex = rowIndex;
        this.selectedColumnIndex = -1;
        this.selectedCellIndex = -1;
    }

    #onCellClick(e) {
        const { sectionIndex, rowIndex, cellIndex } = e.detail;
        this.panelMode = PANEL_CELL;
        this.selectedSectionIndex = sectionIndex;
        this.selectedRowIndex = rowIndex;
        this.selectedCellIndex = cellIndex;
        this.selectedColumnIndex = -1;
    }

    async #onAddRow(e) {
        const { sectionIndex } = e.detail;
        await this.#addRow(sectionIndex);
    }

    // --- Card reference resolution ---

    async #setCardReference(colFragment, fragmentId) {
        if (!fragmentId?.trim()) return;
        try {
            const cardData = await this.repository.aem.sites.cf.fragments.getById(fragmentId);
            if (!cardData?.path) {
                showToast('Card fragment not found', 'negative');
                return;
            }
            this.#localRefs.set(cardData.path, cardData);
            await this.#saveChildField(colFragment, 'fragment', [cardData.path]);
        } catch {
            showToast('Failed to resolve card fragment ID', 'negative');
        }
    }

    // --- Editable panels ---

    get #columnPanel() {
        const col = this.columns[this.selectedColumnIndex];
        if (!col) return nothing;

        return html`
            <div class="panel-section">
                <div class="panel-header">
                    <h3>Column: ${col.title}</h3>
                    <sp-action-button
                        size="s"
                        quiet
                        @click=${() => this.#deleteColumn(this.selectedColumnIndex)}
                        ?disabled=${this.busy}
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                        Delete
                    </sp-action-button>
                </div>

                <sp-field-label for="col-badge">Badge</sp-field-label>
                <sp-textfield
                    id="col-badge"
                    value="${col.badge || ''}"
                    placeholder="e.g. Best Offer"
                    @change=${(e) => this.#saveChildField(col.fragment, 'badge', [e.target.value])}
                ></sp-textfield>

                <sp-field-label>Card Fragment ID</sp-field-label>
                <sp-textfield
                    value="${col.cardFragment?.id || ''}"
                    placeholder="Paste card fragment ID"
                    @change=${(e) => this.#setCardReference(col.fragment, e.target.value)}
                ></sp-textfield>
                ${col.cardFragment?.title
                    ? html`<div
                          class="card-ref-info"
                          style="font-size: 12px; color: var(--spectrum-gray-600); margin-top: 4px;"
                      >
                          ${col.cardFragment.title}
                      </div>`
                    : nothing}

                <sp-field-label>Column Fields</sp-field-label>
                <div class="field-list">
                    ${['mnemonicIcon', 'cardTitle', 'prices', 'description', 'ctas'].map(
                        (fieldName) => html`
                            <sp-checkbox
                                ?checked=${col.fields.includes(fieldName)}
                                @change=${(e) => {
                                    const updated = e.target.checked
                                        ? [...col.fields, fieldName]
                                        : col.fields.filter((f) => f !== fieldName);
                                    this.#saveChildField(col.fragment, 'fields', updated);
                                }}
                            >
                                ${fieldName}
                            </sp-checkbox>
                        `,
                    )}
                </div>
            </div>
        `;
    }

    get #sectionPanel() {
        const sec = this.sections[this.selectedSectionIndex];
        if (!sec) return nothing;

        return html`
            <div class="panel-section">
                <div class="panel-header">
                    <h3>Section: ${sec.title}</h3>
                    <sp-action-button
                        size="s"
                        quiet
                        @click=${() => this.#deleteSection(this.selectedSectionIndex)}
                        ?disabled=${this.busy}
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                        Delete
                    </sp-action-button>
                </div>

                <sp-field-label for="sec-title">Section Title</sp-field-label>
                <sp-textfield
                    id="sec-title"
                    value="${sec.title || ''}"
                    @change=${(e) => this.#saveChildField(sec.fragment, 'sectionTitle', [e.target.value])}
                ></sp-textfield>

                <sp-field-label>Rows (${sec.rows.length})</sp-field-label>
                <div class="field-list">
                    ${sec.rows.map(
                        (row, i) =>
                            html`<div class="field-item">
                                ${i + 1}. ${this.#extractPlainText(row.title) || 'Untitled row'}
                            </div>`,
                    )}
                </div>

                <sp-action-button size="s" @click=${() => this.#addRow(this.selectedSectionIndex)} ?disabled=${this.busy}>
                    + Add Row
                </sp-action-button>
            </div>
        `;
    }

    get #rowPanel() {
        const sec = this.sections[this.selectedSectionIndex];
        const row = sec?.rows?.[this.selectedRowIndex];
        if (!row) return nothing;

        return html`
            <div class="panel-section">
                <div class="panel-header">
                    <h3>Row: ${this.#extractPlainText(row.title) || 'Untitled'}</h3>
                    <sp-action-button
                        size="s"
                        quiet
                        @click=${() => this.#deleteRow(this.selectedSectionIndex, this.selectedRowIndex)}
                        ?disabled=${this.busy}
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                        Delete
                    </sp-action-button>
                </div>

                <sp-field-label for="row-title">Row Title</sp-field-label>
                <sp-textfield
                    id="row-title"
                    value="${this.#extractPlainText(row.title) || ''}"
                    @change=${(e) => this.#saveChildField(row.fragment, 'rowTitle', [e.target.value])}
                ></sp-textfield>

                <sp-field-label>Values (${row.values.length})</sp-field-label>
                <div class="field-list">
                    ${row.values.map((val, i) => {
                        const colName = this.columns[i]?.title || `Column ${i + 1}`;
                        return html`<div class="field-item">${colName}: ${this.#formatValue(val)}</div>`;
                    })}
                </div>
            </div>
        `;
    }

    get #cellPanel() {
        const sec = this.sections[this.selectedSectionIndex];
        const row = sec?.rows?.[this.selectedRowIndex];
        const val = row?.values?.[this.selectedCellIndex];
        if (!val) return nothing;

        const colName = this.columns[this.selectedCellIndex]?.title || `Column ${this.selectedCellIndex + 1}`;

        return html`
            <div class="panel-section">
                <h3>Cell: ${colName}</h3>

                <sp-field-label for="cell-value">Value</sp-field-label>
                <sp-textfield
                    id="cell-value"
                    value="${val.valueType || ''}"
                    placeholder="e.g. true, Some text, 3"
                    @change=${(e) => this.#saveChildField(val.fragment, 'valueType', [e.target.value])}
                ></sp-textfield>
                <sp-help-text> "true" = checkmark, text = displayed as-is, number = displayed as-is </sp-help-text>
            </div>
        `;
    }

    #extractPlainText(htmlString) {
        if (!htmlString) return '';
        if (!htmlString.includes('<')) return htmlString;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        return doc.body.textContent || '';
    }

    #formatValue(val) {
        if (!val) return '--';
        if (val.valueType === 'true') return 'Yes';
        return val.valueType || '--';
    }

    get #sidePanel() {
        switch (this.panelMode) {
            case PANEL_COLUMN:
                return this.#columnPanel;
            case PANEL_SECTION:
                return this.#sectionPanel;
            case PANEL_ROW:
                return this.#rowPanel;
            case PANEL_CELL:
                return this.#cellPanel;
            default:
                return html`<div class="panel-section">
                    <p>Click on a column, section, row, or cell in the preview to edit it.</p>
                </div>`;
        }
    }

    render() {
        if (!this.fragment) return nothing;

        return html`
            <div class="compare-chart-editor">
                <h2>Compare Chart</h2>
                <div class="chart-summary">
                    <span>${this.columns.length} column(s)</span>
                    <span>${this.sections.length} section(s)</span>
                </div>

                <div class="chart-actions">
                    <sp-action-button size="s" @click=${() => this.#addColumn()} ?disabled=${this.busy}>
                        + Add Column
                    </sp-action-button>
                    <sp-action-button size="s" @click=${() => this.#addSection()} ?disabled=${this.busy}>
                        + Add Section
                    </sp-action-button>
                </div>

                <sp-divider size="s"></sp-divider>

                ${this.busy ? html`<sp-progress-circle size="s" indeterminate></sp-progress-circle>` : nothing}

                <compare-chart-preview
                    .columns=${this.columns}
                    .sections=${this.sections}
                    .selectedColumnIndex=${this.selectedColumnIndex}
                    .selectedSectionIndex=${this.selectedSectionIndex}
                    .selectedRowIndex=${this.selectedRowIndex}
                    .selectedCellIndex=${this.selectedCellIndex}
                    @column-click=${this.#onColumnClick}
                    @section-click=${this.#onSectionClick}
                    @row-click=${this.#onRowClick}
                    @cell-click=${this.#onCellClick}
                    @add-row=${this.#onAddRow}
                ></compare-chart-preview>

                <sp-divider size="s"></sp-divider>

                <div class="side-panel">${this.#sidePanel}</div>
            </div>
        `;
    }
}

customElements.define('compare-chart-editor', CompareChartEditor);
