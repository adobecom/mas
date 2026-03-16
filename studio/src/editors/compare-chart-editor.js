import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { live } from 'lit/directives/live.js';
import { Fragment } from '../aem/fragment.js';
import './compare-chart-preview.js';
import router from '../router.js';
import { showToast, extractLocaleFromPath, extractSurfaceFromPath, camelToTitle } from '../utils.js';
import {
    CARD_MODEL_ID,
    CARD_MODEL_PATH,
    COMPARE_FRAGMENT_MODEL_PATH,
    COMPARE_FRAGMENT_MODEL_ID,
    COMPARE_SECTION_MODEL_PATH,
    COMPARE_SECTION_MODEL_ID,
    COMPARE_ROW_MODEL_PATH,
    COMPARE_ROW_MODEL_ID,
    COMPARE_VALUE_MODEL_PATH,
    COMPARE_VALUE_MODEL_ID,
} from '../constants.js';
import { getFieldGroup, sortFieldsByGroup } from './compare-chart-fields.js';

const PANEL_NONE = 'none';
const PANEL_COLUMN = 'column';
const PANEL_SECTION = 'section';
const PANEL_ROW = 'row';
const PANEL_CELL = 'cell';
const CELL_TYPE_EMPTY = 'empty';
const CELL_TYPE_BOOLEAN = 'boolean';
const CELL_TYPE_TEXT = 'text';
const CARD_PICKER_DEBOUNCE_MS = 250;
const CARD_PICKER_RESULTS_LIMIT = 20;
const CARD_RECENTS_MAX = 8;
const CARD_PREVIEW_TIMEOUT_MS = 12000;
const COLUMN_FIELD_OPTIONS = ['mnemonicIcon', 'cardTitle', 'prices', 'description', 'ctas'];
const COLUMN_FIELD_LABEL_OVERRIDES = { ctas: 'CTAs' };
const columnFieldLabel = (name) => COLUMN_FIELD_LABEL_OVERRIDES[name] || camelToTitle(name);

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
        cellEditorType: { type: String, state: true },
        columns: { type: Array, state: true },
        sections: { type: Array, state: true },
        busy: { type: Boolean, state: true },
        cardPickerOpen: { type: Boolean, state: true },
        cardPickerQuery: { type: String, state: true },
        cardPickerResults: { type: Array, state: true },
        cardPickerRecents: { type: Array, state: true },
        cardPickerLoading: { type: Boolean, state: true },
        cardPickerError: { type: String, state: true },
        cardPickerColumnPath: { type: String, state: true },
        columnPreviewOpen: { type: Boolean, state: true },
        columnPreviewStatus: { type: String, state: true },
        columnPreviewError: { type: String, state: true },
        columnPreviewCardId: { type: String, state: true },
        columnPreviewResolvedCardId: { type: String, state: true },
        draggingFieldIndex: { type: Number, state: true },
    };

    createRenderRoot() {
        return this;
    }

    // Local cache for deep references (rows, values) that direct-hydrated doesn't return
    #localRefs = new Map();
    #resolvedCardIdsByPath = new Map();
    #cardPickerSearchTimer;
    #cardSearchRequestId = 0;
    #previewHydrationRequestId = 0;

    constructor() {
        super();
        this.panelMode = PANEL_NONE;
        this.selectedColumnIndex = -1;
        this.selectedSectionIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
        this.cellEditorType = '';
        this.columns = [];
        this.sections = [];
        this.busy = false;
        this.cardPickerOpen = false;
        this.cardPickerQuery = '';
        this.cardPickerResults = [];
        this.cardPickerRecents = [];
        this.cardPickerLoading = false;
        this.cardPickerError = '';
        this.cardPickerColumnPath = '';
        this.columnPreviewOpen = true;
        this.columnPreviewStatus = 'idle';
        this.columnPreviewError = '';
        this.columnPreviewCardId = '';
        this.columnPreviewResolvedCardId = '';
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

    disconnectedCallback() {
        clearTimeout(this.#cardPickerSearchTimer);
        super.disconnectedCallback();
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore')) {
            this.#buildData();
        }
        super.update(changedProperties);
    }

    updated(changedProperties) {
        if (
            changedProperties.has('columns') ||
            changedProperties.has('selectedColumnIndex') ||
            changedProperties.has('panelMode') ||
            changedProperties.has('columnPreviewOpen')
        ) {
            this.#syncColumnPreviewHydration();
        }
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

    // --- Column field drag-and-drop reorder ---

    #fieldDragStart(e, index) {
        this.draggingFieldIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    #fieldDragOver(e, col, index) {
        if (this.draggingFieldIndex == null || this.draggingFieldIndex === index) return;
        const sourceGroup = getFieldGroup(col.fields[this.draggingFieldIndex]);
        const targetGroup = getFieldGroup(col.fields[index]);
        if (sourceGroup !== targetGroup) return;
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    #fieldDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    #fieldDrop(e, col, index) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        if (this.draggingFieldIndex === index || this.draggingFieldIndex == null) return;
        const sourceGroup = getFieldGroup(col.fields[this.draggingFieldIndex]);
        const targetGroup = getFieldGroup(col.fields[index]);
        if (sourceGroup !== targetGroup) return;
        const updated = [...col.fields];
        const [dragged] = updated.splice(this.draggingFieldIndex, 1);
        updated.splice(index, 0, dragged);
        this.draggingFieldIndex = undefined;
        this.#saveChildField(col.fragment, 'fields', sortFieldsByGroup(updated));
    }

    #fieldDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggingFieldIndex = undefined;
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

    async #ensureCellValueFragment(sectionIndex, rowIndex, cellIndex, initialValue = '') {
        const section = this.sections[sectionIndex];
        const row = section?.rows?.[rowIndex];
        if (!row?.fragment) return null;

        const existingValue = row.values?.[cellIndex];
        if (existingValue?.fragment) return existingValue.fragment;

        const valuePaths = [...this.#getRefFieldValues(row.fragment, 'rowValues')];
        for (let i = valuePaths.length; i <= cellIndex; i++) {
            const valueFragment = await this.repository.createFragment(
                {
                    title: `Value ${rowIndex + 1}-${i + 1}`,
                    name: `value-${rowIndex + 1}-${i + 1}-${Date.now()}`,
                    modelId: COMPARE_VALUE_MODEL_ID,
                    parentPath: this.#parentPath,
                    fields: [
                        {
                            name: 'valueType',
                            type: 'enumeration',
                            values: [i === cellIndex ? initialValue : ''],
                        },
                    ],
                },
                false,
            );
            this.#addReference(valueFragment);
            valuePaths.push(valueFragment.path);
        }

        const updatedRow = { ...row.fragment };
        const valuesField = updatedRow.fields?.find((f) => f.name === 'rowValues');
        if (valuesField) {
            valuesField.values = valuePaths;
        } else {
            updatedRow.fields = [
                ...(updatedRow.fields || []),
                {
                    name: 'rowValues',
                    type: 'content-fragment',
                    multiple: true,
                    values: valuePaths,
                },
            ];
        }
        await this.#saveChildFragment(updatedRow);

        for (const source of [
            row.fragment,
            this.fragment?.references?.find((r) => r.path === row.path),
            this.#localRefs.get(row.path),
        ]) {
            if (!source) continue;
            const sourceValuesField = source.fields?.find((f) => f.name === 'rowValues');
            if (sourceValuesField) {
                sourceValuesField.values = valuePaths;
            } else if (source.fields) {
                source.fields.push({
                    name: 'rowValues',
                    type: 'content-fragment',
                    multiple: true,
                    values: valuePaths,
                });
            }
        }

        this.#buildData();

        return this.#getRefFragment(valuePaths[cellIndex]);
    }

    async #saveCellValue(sectionIndex, rowIndex, cellIndex, value) {
        const section = this.sections[sectionIndex];
        const row = section?.rows?.[rowIndex];
        if (!row) return;

        try {
            const currentValue = row.values?.[cellIndex];
            if (currentValue?.fragment) {
                await this.#saveChildField(currentValue.fragment, 'valueType', [value]);
                return;
            }

            const createdValue = await this.#ensureCellValueFragment(sectionIndex, rowIndex, cellIndex, value);
            if (!createdValue) {
                showToast('Unable to create the missing cell value.', 'negative');
            }
        } catch (e) {
            showToast(`Failed to update cell value: ${e.message}`, 'negative');
        }
    }

    #getCellTypeFromValue(rawValue) {
        if (rawValue === 'true' || rawValue === 'false') return CELL_TYPE_BOOLEAN;
        if (rawValue) return CELL_TYPE_TEXT;
        return CELL_TYPE_EMPTY;
    }

    #getCanonicalValueForType(cellType, currentValue) {
        if (cellType === CELL_TYPE_EMPTY) return '';
        if (cellType === CELL_TYPE_BOOLEAN) {
            if (currentValue === 'true' || currentValue === 'false') return currentValue;
            return 'false';
        }
        if (cellType === CELL_TYPE_TEXT) {
            if (currentValue === 'true' || currentValue === 'false') return '';
            return currentValue || '';
        }
        return currentValue || '';
    }

    async #saveSelectedCellValue(value) {
        await this.#saveCellValue(this.selectedSectionIndex, this.selectedRowIndex, this.selectedCellIndex, value);
    }

    async #onCellTypeChange(nextType, currentValue) {
        this.cellEditorType = nextType;
        const canonical = this.#getCanonicalValueForType(nextType, currentValue);
        await this.#saveSelectedCellValue(canonical);
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

            const cardFieldData = {};
            if (cardFragment) {
                for (const f of cardFragment.fields || []) {
                    if (f.mimeType === 'text/html') {
                        cardFieldData[f.name] = { mimeType: 'text/html', value: f.values?.[0] ?? '' };
                    } else {
                        cardFieldData[f.name] = f.values?.[0] ?? '';
                    }
                }
            }

            columns.push({
                title: cardTitle,
                badge: this.#getRefFieldValue(colFragment, 'badge'),
                fields: sortFieldsByGroup(this.#getRefFieldValues(colFragment, 'fields')),
                cardFieldData,
                path,
                fragment: colFragment,
                cardFragment: cardFragment ? { path: cardFragment.path, title: cardTitle, id: cardFragment.id } : null,
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
                        valueType: this.#getRefFieldValue(valFragment, 'valueType'),
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
                    fields: [
                        {
                            name: 'fields',
                            type: 'text',
                            multiple: true,
                            values: ['cardTitle'],
                        },
                    ],
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
        if (this.selectedColumnIndex !== columnIndex) {
            this.#closeCardPicker();
        }
        this.columnPreviewOpen = true;
        this.panelMode = PANEL_COLUMN;
        this.selectedColumnIndex = columnIndex;
        this.selectedSectionIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
        this.cellEditorType = '';
    }

    #onSectionClick(e) {
        const { sectionIndex } = e.detail;
        this.#closeCardPicker();
        this.panelMode = PANEL_SECTION;
        this.selectedSectionIndex = sectionIndex;
        this.selectedColumnIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
        this.cellEditorType = '';
    }

    #onRowClick(e) {
        const { sectionIndex, rowIndex } = e.detail;
        this.#closeCardPicker();
        this.panelMode = PANEL_ROW;
        this.selectedSectionIndex = sectionIndex;
        this.selectedRowIndex = rowIndex;
        this.selectedColumnIndex = -1;
        this.selectedCellIndex = -1;
        this.cellEditorType = '';
    }

    #onCellClick(e) {
        const { sectionIndex, rowIndex, cellIndex } = e.detail;
        this.#closeCardPicker();
        this.panelMode = PANEL_CELL;
        this.selectedSectionIndex = sectionIndex;
        this.selectedRowIndex = rowIndex;
        this.selectedCellIndex = cellIndex;
        this.selectedColumnIndex = -1;
        const row = this.sections[sectionIndex]?.rows?.[rowIndex];
        const rawValue = row?.values?.[cellIndex]?.valueType || '';
        this.cellEditorType = this.#getCellTypeFromValue(rawValue);
    }

    async #onAddRow(e) {
        const { sectionIndex } = e.detail;
        await this.#addRow(sectionIndex);
    }

    #onSectionTitleChange(e) {
        const { sectionIndex, value } = e.detail;
        const sec = this.sections?.[sectionIndex];
        if (sec?.fragment) {
            this.#saveChildField(sec.fragment, 'sectionTitle', [value]);
        }
    }

    #onRowTitleChange(e) {
        const { sectionIndex, rowIndex, value } = e.detail;
        const row = this.sections?.[sectionIndex]?.rows?.[rowIndex];
        if (row?.fragment) {
            this.#saveChildField(row.fragment, 'rowTitle', [value]);
        }
    }

    // --- Card reference resolution ---

    #getEditorScope() {
        const fragmentPath = this.fragment?.path;
        const surface = extractSurfaceFromPath(fragmentPath);
        const locale = extractLocaleFromPath(fragmentPath);
        return {
            surface,
            locale,
            path: surface && locale ? `/content/dam/mas/${surface}/${locale}` : '',
        };
    }

    #isPathInEditorScope(path) {
        const { surface, locale } = this.#getEditorScope();
        if (!surface || !locale) return false;
        return extractSurfaceFromPath(path) === surface && extractLocaleFromPath(path) === locale;
    }

    #isCardModel(fragmentData) {
        if (!fragmentData?.model) return false;
        return fragmentData.model.path === CARD_MODEL_PATH || fragmentData.model.id === CARD_MODEL_ID;
    }

    #readFieldValue(fragmentData, fieldName) {
        if (typeof fragmentData?.getFieldValue === 'function') {
            return fragmentData.getFieldValue(fieldName) || '';
        }
        return fragmentData?.fields?.find((field) => field.name === fieldName)?.values?.[0] || '';
    }

    #toCardSummary(fragmentData) {
        const title =
            this.#readFieldValue(fragmentData, 'cardTitle') || fragmentData?.title || fragmentData?.name || 'Untitled card';
        return {
            id: fragmentData?.id,
            path: fragmentData?.path,
            title,
            variant: this.#readFieldValue(fragmentData, 'variant'),
            status: fragmentData?.status || '',
            fields: fragmentData?.fields || [],
            model: fragmentData?.model,
        };
    }

    async #primeAemFragmentCache(fragmentData, aliasId = '') {
        if (!fragmentData?.id) return;
        try {
            await customElements.whenDefined('aem-fragment');
            const cache = document.createElement('aem-fragment').cache;
            const cacheData = structuredClone(fragmentData);

            // aem-fragment cache supports alias lookup through fields.originalId.
            cacheData.fields ??= [];
            if (aliasId && aliasId !== cacheData.id) {
                cacheData.fields.originalId = aliasId;
            }

            cache.add(cacheData);
        } catch {
            // Ignore cache priming failures; preview will fall back to network.
        }
    }

    async #resolveCardIdByPath(path, fallbackId = '') {
        if (!path) return fallbackId || '';
        const cachedId = this.#resolvedCardIdsByPath.get(path);
        if (cachedId) return cachedId;

        try {
            const cardData = await this.repository.aem.sites.cf.fragments.getByPath(path);
            if (!cardData?.id) return fallbackId || '';
            this.#localRefs.set(cardData.path, cardData);
            this.#resolvedCardIdsByPath.set(path, cardData.id);

            // Keep in-memory references aligned with canonical ID so subsequent panel renders stay consistent.
            const existingRef = this.fragment?.references?.find((ref) => ref.path === path);
            if (existingRef) {
                existingRef.id = cardData.id;
            }
            const cachedRef = this.#localRefs.get(path);
            if (cachedRef) {
                cachedRef.id = cardData.id;
            }

            await this.#primeAemFragmentCache(cardData, fallbackId);
            return cardData.id;
        } catch {
            return fallbackId || '';
        }
    }

    #validateCardCandidate(cardData) {
        if (!cardData?.id || !cardData?.path) {
            return { valid: false, message: 'Card fragment not found.' };
        }
        if (!this.#isCardModel(cardData)) {
            return { valid: false, message: 'Only card fragments can be assigned to compare chart columns.' };
        }
        if (!this.#isPathInEditorScope(cardData.path)) {
            return { valid: false, message: 'Card is outside the current surface/locale scope and cannot be assigned.' };
        }
        return { valid: true };
    }

    #getCardRecentsStorageKey() {
        const { surface, locale } = this.#getEditorScope();
        if (!surface || !locale) return '';
        return `compare-chart-card-recents:${surface}:${locale}`;
    }

    #readRecentCardIds() {
        const key = this.#getCardRecentsStorageKey();
        if (!key) return [];
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    }

    #writeRecentCardIds(ids) {
        const key = this.#getCardRecentsStorageKey();
        if (!key) return;
        try {
            localStorage.setItem(key, JSON.stringify(ids));
        } catch {
            // Ignore storage errors in authoring UI.
        }
    }

    #pushRecentCardId(cardId) {
        if (!cardId) return;
        const deduped = [cardId, ...this.#readRecentCardIds().filter((id) => id !== cardId)].slice(0, CARD_RECENTS_MAX);
        this.#writeRecentCardIds(deduped);
    }

    async #loadCardRecents() {
        const recentIds = this.#readRecentCardIds();
        if (!recentIds.length) {
            this.cardPickerRecents = [];
            return;
        }
        const resolved = await Promise.all(
            recentIds.map(async (id) => {
                try {
                    const cardData = await this.repository.aem.sites.cf.fragments.getById(id);
                    const validation = this.#validateCardCandidate(cardData);
                    if (!validation.valid) return null;
                    this.#localRefs.set(cardData.path, cardData);
                    return this.#toCardSummary(cardData);
                } catch {
                    return null;
                }
            }),
        );
        const valid = resolved.filter(Boolean);
        if (valid.length !== recentIds.length) {
            this.#writeRecentCardIds(valid.map((item) => item.id));
        }
        this.cardPickerRecents = valid;
    }

    async #searchCards(query) {
        const requestId = ++this.#cardSearchRequestId;
        const trimmed = query.trim();
        if (!trimmed) {
            this.cardPickerResults = [];
            this.cardPickerLoading = false;
            this.cardPickerError = '';
            await this.#loadCardRecents();
            return;
        }

        const { path } = this.#getEditorScope();
        if (!path) {
            this.cardPickerError = 'Unable to determine compare chart scope for card lookup.';
            this.cardPickerLoading = false;
            this.cardPickerResults = [];
            return;
        }

        this.cardPickerLoading = true;
        this.cardPickerError = '';
        try {
            const fragments = await this.repository.searchFragmentList(
                {
                    path,
                    query: trimmed,
                    modelIds: [CARD_MODEL_ID],
                },
                CARD_PICKER_RESULTS_LIMIT,
            );
            if (requestId !== this.#cardSearchRequestId) return;
            this.cardPickerResults = fragments
                .map((fragment) => this.#toCardSummary(fragment))
                .filter((item) => item.id && item.path && this.#isPathInEditorScope(item.path));
        } catch (e) {
            if (requestId !== this.#cardSearchRequestId) return;
            this.cardPickerError = `Card search failed: ${e.message}`;
            this.cardPickerResults = [];
        } finally {
            if (requestId === this.#cardSearchRequestId) {
                this.cardPickerLoading = false;
            }
        }
    }

    #queueCardSearch(query) {
        this.cardPickerQuery = query;
        clearTimeout(this.#cardPickerSearchTimer);
        this.#cardPickerSearchTimer = setTimeout(() => {
            this.#searchCards(query);
        }, CARD_PICKER_DEBOUNCE_MS);
    }

    async #openCardPicker(columnPath) {
        this.cardPickerOpen = true;
        this.cardPickerColumnPath = columnPath;
        this.cardPickerError = '';
        this.cardPickerResults = [];
        this.cardPickerQuery = '';
        await this.#loadCardRecents();
    }

    #closeCardPicker() {
        this.cardPickerOpen = false;
        this.cardPickerColumnPath = '';
        this.cardPickerLoading = false;
        this.cardPickerError = '';
        this.cardPickerResults = [];
        this.cardPickerQuery = '';
        clearTimeout(this.#cardPickerSearchTimer);
    }

    #onCardPickerInput(e) {
        this.#queueCardSearch(e.target.value || '');
    }

    async #assignCardReference(colFragment, cardData) {
        if (!cardData?.id) {
            showToast('Card fragment not found.', 'negative');
            return false;
        }

        let resolvedCard = cardData;
        try {
            const latestCard = await this.repository.aem.sites.cf.fragments.getById(cardData.id);
            if (latestCard) {
                resolvedCard = latestCard;
            }
        } catch {
            showToast('Failed to resolve card fragment ID.', 'negative');
            return false;
        }

        const validation = this.#validateCardCandidate(resolvedCard);
        if (!validation.valid) {
            showToast(validation.message, 'negative');
            return false;
        }

        this.#localRefs.set(resolvedCard.path, resolvedCard);
        this.#resolvedCardIdsByPath.set(resolvedCard.path, resolvedCard.id);
        await this.#primeAemFragmentCache(resolvedCard);
        const selectedFields = [...this.#getRefFieldValues(colFragment, 'fields')];
        await this.#saveChildField(colFragment, 'fragment', [resolvedCard.path]);

        const availableFields = new Set((resolvedCard.fields || []).map((field) => field.name));
        const missingFields = selectedFields.filter((fieldName) => !availableFields.has(fieldName));
        if (missingFields.length) {
            const compatibleFields = selectedFields.filter((fieldName) => availableFields.has(fieldName));
            await this.#saveChildField(colFragment, 'fields', compatibleFields);
            showToast(`Removed unavailable column fields: ${missingFields.join(', ')}`, 'info');
        }

        this.columnPreviewOpen = true;
        this.#pushRecentCardId(resolvedCard.id);
        await this.#loadCardRecents();
        return true;
    }

    async #setCardReference(colFragment, fragmentId) {
        if (!fragmentId?.trim()) return;
        try {
            const cardData = await this.repository.aem.sites.cf.fragments.getById(fragmentId);
            await this.#assignCardReference(colFragment, cardData);
        } catch {
            showToast('Failed to resolve card fragment ID.', 'negative');
        }
    }

    async #selectCardFromPicker(colFragment, cardSummary) {
        const assigned = await this.#assignCardReference(colFragment, cardSummary);
        if (assigned) {
            this.#closeCardPicker();
            this.columnPreviewOpen = true;
            showToast('Card assigned to column.', 'positive');
        }
    }

    #onColumnPreviewToggle(e) {
        this.columnPreviewOpen = e.currentTarget.open;
    }

    #getSelectedColumnCardReference() {
        if (this.panelMode !== PANEL_COLUMN || this.selectedColumnIndex < 0) {
            return { id: '', path: '' };
        }
        const cardFragment = this.columns[this.selectedColumnIndex]?.cardFragment;
        return {
            id: cardFragment?.id || '',
            path: cardFragment?.path || '',
        };
    }

    async #syncColumnPreviewHydration() {
        const selected = this.#getSelectedColumnCardReference();
        const cardPath = selected?.path || '';
        const fallbackCardId = selected?.id || '';
        const cardKey = `${cardPath}:${fallbackCardId}`;
        if (!this.columnPreviewOpen) return;

        if (!cardPath && !fallbackCardId) {
            this.columnPreviewStatus = 'empty';
            this.columnPreviewError = '';
            this.columnPreviewCardId = '';
            this.columnPreviewResolvedCardId = '';
            return;
        }

        if (this.columnPreviewCardId === cardKey && this.columnPreviewStatus === 'ready') {
            return;
        }

        this.columnPreviewStatus = 'loading';
        this.columnPreviewError = '';
        this.columnPreviewCardId = cardKey;
        this.columnPreviewResolvedCardId = '';

        const requestId = ++this.#previewHydrationRequestId;
        const resolvedCardId = await this.#resolveCardIdByPath(cardPath, fallbackCardId);
        if (requestId !== this.#previewHydrationRequestId) return;
        if (!resolvedCardId) {
            this.columnPreviewStatus = 'error';
            this.columnPreviewError = 'Selected card cannot be resolved by path.';
            return;
        }
        this.columnPreviewResolvedCardId = resolvedCardId;

        await this.updateComplete;
        if (requestId !== this.#previewHydrationRequestId) return;

        const previewCard = this.querySelector('#column-preview-card merch-card');
        const previewFragment = previewCard?.querySelector('aem-fragment');
        if (!previewCard || !previewFragment) {
            if (requestId === this.#previewHydrationRequestId) {
                this.columnPreviewStatus = 'error';
                this.columnPreviewError = 'Preview container did not mount correctly.';
            }
            return;
        }

        try {
            const previewReady = (async () => {
                await previewFragment.updateComplete;
                await previewCard.checkReady();
            })();
            await Promise.race([
                previewReady,
                new Promise((_, reject) => {
                    setTimeout(
                        () => reject(new Error(`Card preview timed out after ${CARD_PREVIEW_TIMEOUT_MS / 1000}s.`)),
                        CARD_PREVIEW_TIMEOUT_MS,
                    );
                }),
            ]);
            if (previewCard.failed || previewFragment.classList.contains('error')) {
                throw new Error('Card preview failed to hydrate.');
            }
            if (requestId !== this.#previewHydrationRequestId) return;
            this.columnPreviewStatus = 'ready';
            this.columnPreviewError = '';
        } catch (e) {
            if (requestId !== this.#previewHydrationRequestId) return;
            this.columnPreviewStatus = 'error';
            this.columnPreviewError = e?.message || 'Unable to render selected card preview.';
        }
    }

    #buildFragmentEditorUrl(fragmentId) {
        const targetUrl = new URL(window.location.href);
        const currentHash = targetUrl.hash?.startsWith('#') ? targetUrl.hash.slice(1) : targetUrl.hash;
        const params = new URLSearchParams(currentHash || '');
        params.set('page', 'fragment-editor');
        params.set('fragmentId', fragmentId);
        params.delete('query');
        targetUrl.hash = params.toString();
        return targetUrl.toString();
    }

    async #openSelectedCardEditor(cardData) {
        const cardPath = cardData?.path || '';
        const fallbackCardId = cardData?.id || '';
        const cardId = await this.#resolveCardIdByPath(cardPath, fallbackCardId);
        if (!cardId) {
            showToast('Failed to resolve selected card ID.', 'negative');
            return;
        }

        const fragmentEditorUrl = this.#buildFragmentEditorUrl(cardId);
        let tab;
        try {
            tab = window.open(fragmentEditorUrl, '_blank', 'noopener,noreferrer');
        } catch {
            tab = null;
        }
        if (!tab) {
            await router.navigateToFragmentEditor(cardId);
        }
    }

    // --- Editable panels ---

    get #columnPanel() {
        const col = this.columns[this.selectedColumnIndex];
        if (!col) return nothing;
        const scope = this.#getEditorScope();
        const isPickerOpen = this.cardPickerOpen && this.cardPickerColumnPath === col.path;
        const trimmedQuery = this.cardPickerQuery.trim();
        const pickerItems = trimmedQuery ? this.cardPickerResults : this.cardPickerRecents;
        const hasSelectedCard = Boolean(col.cardFragment?.path || col.cardFragment?.id);
        const selectedCardId = this.columnPreviewResolvedCardId || col.cardFragment?.id || '';
        const previewFragmentId = this.columnPreviewResolvedCardId || '';
        const selectedSet = new Set(col.fields);
        // Build unified list respecting user's drag order for selected fields.
        // For each group: selected fields in col.fields order, then unselected in default order.
        const allFieldsSorted = ['title', 'price', 'desc'].flatMap((group) => {
            const selected = col.fields.filter((f) => getFieldGroup(f) === group);
            const unselected = COLUMN_FIELD_OPTIONS.filter((f) => getFieldGroup(f) === group && !selectedSet.has(f));
            return [...selected, ...unselected];
        });

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

                <section id="column-fields-block" class="column-panel-block column-fields-block">
                    <h4 class="column-block-title">Column Fields</h4>
                    <div class="column-fields-sortable">
                        ${allFieldsSorted.map((fieldName, index) => {
                            const isSelected = selectedSet.has(fieldName);
                            const fieldIndex = isSelected ? col.fields.indexOf(fieldName) : -1;
                            return html`
                                ${index > 0 && getFieldGroup(fieldName) !== getFieldGroup(allFieldsSorted[index - 1])
                                    ? html`<div class="column-fields-group-divider"></div>`
                                    : nothing}
                                <label
                                    class="column-field-row ${isSelected ? 'selected' : ''} ${isSelected &&
                                    this.draggingFieldIndex === fieldIndex
                                        ? 'dragging'
                                        : ''}"
                                    draggable="${isSelected}"
                                    @dragstart=${isSelected ? (e) => this.#fieldDragStart(e, fieldIndex) : nothing}
                                    @dragover=${isSelected ? (e) => this.#fieldDragOver(e, col, fieldIndex) : nothing}
                                    @dragleave=${isSelected ? (e) => this.#fieldDragLeave(e) : nothing}
                                    @drop=${isSelected ? (e) => this.#fieldDrop(e, col, fieldIndex) : nothing}
                                    @dragend=${isSelected ? (e) => this.#fieldDragEnd(e) : nothing}
                                >
                                    <input
                                        type="checkbox"
                                        .checked=${live(isSelected)}
                                        @change=${() => {
                                            const updated = isSelected
                                                ? sortFieldsByGroup(col.fields.filter((f) => f !== fieldName))
                                                : sortFieldsByGroup([...col.fields, fieldName]);
                                            this.#saveChildField(col.fragment, 'fields', updated);
                                        }}
                                    />
                                    <span class="column-field-label">${columnFieldLabel(fieldName)}</span>
                                </label>
                            `;
                        })}
                    </div>
                </section>

                <div class="badge-field">
                    <sp-field-label for="col-badge">Badge</sp-field-label>
                    <sp-textfield
                        id="col-badge"
                        value="${col.badge || ''}"
                        placeholder="e.g. Best Offer"
                        @change=${(e) => this.#saveChildField(col.fragment, 'badge', [e.target.value])}
                    ></sp-textfield>
                </div>

                <section class="column-card-source-section">
                    <h4 class="column-block-title">Card Source</h4>

                    <div class="card-action-row">
                        <sp-button
                            id="browse-cards-btn"
                            size="s"
                            variant="accent"
                            @click=${() => (isPickerOpen ? this.#closeCardPicker() : this.#openCardPicker(col.path))}
                        >
                            ${isPickerOpen ? 'Close Browser' : 'Browse Cards'}
                        </sp-button>
                        <sp-action-button
                            id="open-card-btn"
                            size="s"
                            quiet
                            ?disabled=${!hasSelectedCard}
                            @click=${() => this.#openSelectedCardEditor(col.cardFragment)}
                        >
                            Open card
                        </sp-action-button>
                    </div>

                    <div class="card-meta">
                        ${hasSelectedCard
                            ? html`
                                  <div class="card-meta-title">${col.cardFragment.title}</div>
                                  <div>ID: ${selectedCardId}</div>
                                  <div class="card-meta-path">${col.cardFragment.path}</div>
                              `
                            : html`<div>No card selected yet. Use Browse Cards to assign one in-scope.</div>`}
                    </div>

                    ${isPickerOpen
                        ? html`
                              <div id="card-picker-popover" class="card-picker-panel">
                                  <sp-search
                                      id="card-picker-search"
                                      label="Search cards"
                                      placeholder="Search cards in this surface and locale"
                                      .value=${this.cardPickerQuery}
                                      @input=${this.#onCardPickerInput}
                                  ></sp-search>
                                  <div class="card-picker-scope">
                                      Scope: ${scope.path || 'Unknown scope. Picker cannot search until scope is resolved.'}
                                  </div>
                                  ${this.cardPickerLoading
                                      ? html`<div class="card-picker-loading">
                                            <sp-progress-circle size="s" indeterminate></sp-progress-circle>
                                        </div>`
                                      : nothing}
                                  ${this.cardPickerError
                                      ? html`<sp-help-text variant="negative">${this.cardPickerError}</sp-help-text>`
                                      : nothing}
                                  ${!trimmedQuery ? html`<div class="card-picker-section-title">Recent cards</div>` : nothing}
                                  ${!this.cardPickerLoading
                                      ? html`
                                            <div class="card-picker-results">
                                                ${pickerItems.map(
                                                    (card) => html`
                                                        <button
                                                            type="button"
                                                            class="card-picker-item"
                                                            @click=${() => this.#selectCardFromPicker(col.fragment, card)}
                                                        >
                                                            <div class="card-picker-item-title">${card.title}</div>
                                                            <div class="card-picker-item-meta">
                                                                ${card.variant ? `Variant: ${card.variant} • ` : ''}ID:
                                                                ${card.id}
                                                            </div>
                                                            <div class="card-picker-item-path">${card.path}</div>
                                                        </button>
                                                    `,
                                                )}
                                                ${!pickerItems.length
                                                    ? html`<sp-help-text
                                                          >${trimmedQuery
                                                              ? 'No matching cards in this surface/locale.'
                                                              : 'No recent cards yet. Search to browse cards.'}</sp-help-text
                                                      >`
                                                    : nothing}
                                            </div>
                                        `
                                      : nothing}
                              </div>
                          `
                        : nothing}
                </section>

                <section class="column-manual-fallback-section">
                    <h4 class="column-block-title">Manual Fallback</h4>
                    <sp-field-label for="col-card-id">Paste ID</sp-field-label>
                    <sp-textfield
                        id="col-card-id"
                        value="${col.cardFragment?.id || ''}"
                        placeholder="Paste card fragment ID"
                        @change=${(e) => this.#setCardReference(col.fragment, e.target.value)}
                    ></sp-textfield>
                    <sp-help-text>Only in-scope card IDs are accepted. Non-card IDs are blocked.</sp-help-text>
                </section>

                <section class="column-card-preview-section">
                    <h4 class="column-block-title">Card Preview</h4>
                    ${(() => {
                        const hasSelectedCard = Boolean(col.cardFragment?.path || col.cardFragment?.id);
                        const previewFragmentId = this.columnPreviewResolvedCardId || '';
                        if (!hasSelectedCard) {
                            return html`<div class="column-preview-empty">Select a card to preview it here.</div>`;
                        }
                        return html`
                            <div
                                id="column-preview-card"
                                class="column-preview-card ${this.columnPreviewStatus === 'loading' ? 'is-loading' : ''}"
                            >
                                ${previewFragmentId
                                    ? keyed(
                                          previewFragmentId,
                                          html`
                                              <merch-card>
                                                  <aem-fragment
                                                      author
                                                      ims
                                                      loading="eager"
                                                      fragment="${previewFragmentId}"
                                                  ></aem-fragment>
                                              </merch-card>
                                          `,
                                      )
                                    : nothing}
                                ${this.columnPreviewStatus === 'loading'
                                    ? html`
                                          <div class="column-preview-loading">
                                              <sp-progress-circle size="m" indeterminate></sp-progress-circle>
                                          </div>
                                      `
                                    : nothing}
                                ${this.columnPreviewStatus === 'error'
                                    ? html`<sp-help-text variant="negative"
                                          >${this.columnPreviewError || 'Unable to render selected card preview.'}</sp-help-text
                                      >`
                                    : nothing}
                            </div>
                        `;
                    })()}
                </section>
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
                <div class="row-list">
                    ${sec.rows.map(
                        (row, i) =>
                            html`<div
                                class="row-list-item"
                                @click=${() => {
                                    this.selectedRowIndex = i;
                                    this.panelMode = 'row';
                                }}
                            >
                                <span class="row-list-index">${i + 1}</span>
                                <span class="row-list-title">${this.#extractPlainText(row.title) || 'Untitled row'}</span>
                                <sp-icon-chevron-right class="row-list-chevron"></sp-icon-chevron-right>
                            </div>`,
                    )}
                </div>

                <sp-action-button size="s" quiet @click=${() => this.#addRow(this.selectedSectionIndex)} ?disabled=${this.busy}>
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Add Row
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
                <div class="row-list">
                    ${row.values.map((val, i) => {
                        const colName = this.columns[i]?.title || `Column ${i + 1}`;
                        return html`<div
                            class="row-list-item"
                            @click=${() => {
                                this.selectedCellIndex = i;
                                this.panelMode = 'cell';
                            }}
                        >
                            <span class="row-list-title"><strong>${colName}:</strong> ${this.#formatValue(val)}</span>
                            <sp-icon-chevron-right class="row-list-chevron"></sp-icon-chevron-right>
                        </div>`;
                    })}
                </div>
            </div>
        `;
    }

    get #cellPanel() {
        const sec = this.sections[this.selectedSectionIndex];
        const row = sec?.rows?.[this.selectedRowIndex];
        if (!row) return nothing;
        const val = row.values?.[this.selectedCellIndex];
        const rawValue = val?.valueType || '';
        const cellType = this.cellEditorType || this.#getCellTypeFromValue(rawValue);
        const colName = this.columns[this.selectedCellIndex]?.title || `Column ${this.selectedCellIndex + 1}`;

        const rowTitle = this.#extractPlainText(row.title) || 'Untitled';
        return html`
            <div class="panel-section">
                <div class="panel-header">
                    <h3>Cell: ${colName}</h3>
                </div>

                <div class="cell-context">
                    <span class="cell-context-label">Row</span>
                    <span class="cell-context-value">${rowTitle}</span>
                </div>

                <div class="cell-form">
                    <sp-field-label for="cell-type">Cell Type</sp-field-label>
                    <sp-picker
                        id="cell-type"
                        value="${cellType}"
                        @change=${(e) => this.#onCellTypeChange(e.target.value, rawValue)}
                        ?disabled=${this.busy}
                    >
                        <sp-menu>
                            <sp-menu-item value="${CELL_TYPE_EMPTY}">No value</sp-menu-item>
                            <sp-menu-item value="${CELL_TYPE_BOOLEAN}">Boolean</sp-menu-item>
                            <sp-menu-item value="${CELL_TYPE_TEXT}">Text</sp-menu-item>
                        </sp-menu>
                    </sp-picker>

                    ${cellType === CELL_TYPE_BOOLEAN
                        ? html`
                              <div class="cell-boolean-group">
                                  <sp-checkbox
                                      ?checked=${rawValue === 'true'}
                                      @change=${(e) => this.#saveSelectedCellValue(e.target.checked ? 'true' : 'false')}
                                      ?disabled=${this.busy}
                                  >
                                      Show checkmark
                                  </sp-checkbox>
                                  <sp-help-text>Checked = ✓ checkmark, unchecked = ✗ cross.</sp-help-text>
                              </div>
                          `
                        : nothing}
                    ${cellType === CELL_TYPE_TEXT
                        ? html`
                              <sp-field-label for="cell-text-value">Text value</sp-field-label>
                              <sp-textfield
                                  id="cell-text-value"
                                  value="${rawValue}"
                                  placeholder="e.g. 100 GB, Included"
                                  @change=${(e) => this.#saveSelectedCellValue(e.target.value)}
                                  ?disabled=${this.busy}
                              ></sp-textfield>
                          `
                        : nothing}
                    ${cellType === CELL_TYPE_EMPTY
                        ? html`<sp-help-text>This cell will render as "—" (empty dash).</sp-help-text>`
                        : nothing}
                </div>
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
        if (val.valueType === 'false') return 'No';
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
                return html`<div class="chart-empty-state">
                    <p>Click on a column, section, row, or cell in the table to edit it.</p>
                </div>`;
        }
    }

    #renderVariantCheckboxes() {
        const blockName = this.#getField('blockName')?.values?.[0] || 'Comparison Table';
        if (blockName !== 'Table') return nothing;
        const selected = this.#getField('selectedVariantNames')?.values || [];
        const options = ['merch', 'highlight', 'sticky', 'collapse', 'm-heading-icon'];
        return html`
            <div class="variant-checkboxes">
                ${options.map(
                    (opt) => html`
                        <sp-checkbox
                            size="s"
                            ?checked=${selected.includes(opt)}
                            @change=${(e) => {
                                const updated = e.target.checked ? [...selected, opt] : selected.filter((v) => v !== opt);
                                this.#updateFieldValues('selectedVariantNames', updated);
                            }}
                            >${opt}</sp-checkbox
                        >
                    `,
                )}
            </div>
        `;
    }

    get #styles() {
        return html`
            <style>
                /* Neutralize parent .section card — compare-chart manages its own two-card layout */
                .section:has(.compare-chart-editor) {
                    background: transparent;
                    border: none;
                    border-radius: 0;
                    box-shadow: none;
                    padding: 0;
                }

                .compare-chart-editor .chart-header {
                    display: grid;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .compare-chart-editor .chart-header-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .compare-chart-editor .chart-header-top h2 {
                    margin: 0;
                }

                .compare-chart-editor .chart-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .compare-chart-editor .chart-count {
                    font-size: 13px;
                    color: var(--spectrum-gray-700);
                    font-weight: 600;
                }

                .compare-chart-editor .chart-count-separator {
                    color: var(--spectrum-gray-400);
                }

                .compare-chart-editor .chart-header-config {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .compare-chart-editor .variant-checkboxes {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-left: 8px;
                    padding-left: 12px;
                    border-left: 1px solid var(--spectrum-gray-300);
                }

                .compare-chart-editor .row-list {
                    display: grid;
                    gap: 2px;
                    border: 1px solid var(--spectrum-gray-300);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .compare-chart-editor .row-list-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    background: var(--spectrum-gray-50);
                    cursor: pointer;
                    transition: background 0.15s;
                }

                .compare-chart-editor .row-list-item:hover {
                    background: var(--spectrum-gray-100);
                }

                .compare-chart-editor .row-list-index {
                    color: var(--spectrum-gray-500);
                    font-size: 12px;
                    font-weight: 600;
                    min-width: 18px;
                }

                .compare-chart-editor .row-list-title {
                    flex: 1;
                    font-size: 13px;
                }

                .compare-chart-editor .row-list-chevron {
                    color: var(--spectrum-gray-400);
                    width: 12px;
                    height: 12px;
                }

                .compare-chart-editor .cell-context {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: var(--spectrum-gray-75);
                    border-radius: 4px;
                    font-size: 13px;
                }

                .compare-chart-editor .cell-context-label {
                    color: var(--spectrum-gray-600);
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                }

                .compare-chart-editor .cell-context-value {
                    color: var(--spectrum-gray-800);
                }

                .compare-chart-editor .cell-form {
                    display: grid;
                    gap: 8px;
                }

                .compare-chart-editor .cell-boolean-group {
                    display: grid;
                    gap: 4px;
                }

                .compare-chart-editor .panel-section {
                    display: grid;
                    gap: 12px;
                }

                .compare-chart-editor .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }

                .compare-chart-editor .panel-header h3 {
                    margin: 0;
                }

                .compare-chart-editor .badge-field {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .compare-chart-editor .badge-field sp-field-label {
                    margin: 0;
                    flex-shrink: 0;
                }

                .compare-chart-editor .badge-field sp-textfield {
                    flex: 1;
                }

                .compare-chart-editor .column-panel-block {
                    border: none;
                    background: transparent;
                    border-radius: 0;
                    padding: 0;
                    display: grid;
                    gap: 8px;
                }

                .compare-chart-editor .column-block-title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--spectrum-gray-900);
                }

                .compare-chart-editor .column-card-source-section,
                .compare-chart-editor .column-manual-fallback-section {
                    display: grid;
                    gap: 8px;
                }

                .compare-chart-editor .panel-section > .badge-field,
                .compare-chart-editor .panel-section > .column-card-source-section,
                .compare-chart-editor .panel-section > .column-manual-fallback-section {
                    padding-top: 16px;
                    border-top: 1px solid var(--spectrum-gray-200);
                }

                .compare-chart-editor .column-card-preview-section {
                    display: grid;
                    gap: 10px;
                    padding-top: 16px;
                    border-top: 1px solid var(--spectrum-gray-200);
                }

                .compare-chart-editor .card-action-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                }

                .compare-chart-editor .card-meta {
                    font-size: 12px;
                    color: var(--spectrum-gray-700);
                    display: grid;
                    gap: 2px;
                }

                .compare-chart-editor .card-meta-title {
                    font-weight: 700;
                    color: var(--spectrum-gray-900);
                }

                .compare-chart-editor .card-meta-path {
                    word-break: break-word;
                }

                .compare-chart-editor .card-picker-panel {
                    padding: 10px;
                    border: 1px solid var(--spectrum-gray-300);
                    border-radius: 8px;
                    background: var(--spectrum-gray-50);
                    display: grid;
                    gap: 8px;
                    max-width: 100%;
                }

                .compare-chart-editor .card-picker-panel sp-search {
                    width: 100%;
                }

                .compare-chart-editor .card-picker-scope {
                    font-size: 11px;
                    color: var(--spectrum-gray-700);
                }

                .compare-chart-editor .card-picker-loading {
                    display: flex;
                    justify-content: center;
                }

                .compare-chart-editor .card-picker-section-title {
                    font-size: 12px;
                    color: var(--spectrum-gray-700);
                    font-weight: 600;
                }

                .compare-chart-editor .card-picker-results {
                    display: grid;
                    gap: 6px;
                    max-height: 280px;
                    overflow: auto;
                    padding-right: 2px;
                }

                .compare-chart-editor .card-picker-item {
                    text-align: left;
                    border: 1px solid var(--spectrum-gray-300);
                    background: var(--spectrum-gray-50);
                    border-radius: 6px;
                    padding: 8px;
                    cursor: pointer;
                    display: grid;
                    gap: 2px;
                }

                .compare-chart-editor .card-picker-item:hover {
                    border-color: var(--spectrum-blue-500);
                    background: var(--spectrum-blue-75);
                }

                .compare-chart-editor .card-picker-item-title {
                    font-weight: 700;
                    color: var(--spectrum-gray-900);
                }

                .compare-chart-editor .card-picker-item-meta {
                    font-size: 12px;
                    color: var(--spectrum-gray-700);
                }

                .compare-chart-editor .card-picker-item-path {
                    font-size: 11px;
                    color: var(--spectrum-gray-600);
                    word-break: break-word;
                }

                .compare-chart-editor .column-preview-card {
                    max-width: 360px;
                    min-height: 220px;
                    position: relative;
                }

                .compare-chart-editor .column-preview-empty {
                    font-size: 12px;
                    color: var(--spectrum-gray-700);
                }

                .compare-chart-editor .column-preview-card merch-card {
                    display: block;
                }

                .compare-chart-editor .column-preview-card.is-loading merch-card {
                    visibility: hidden;
                }

                .compare-chart-editor .column-preview-loading {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .compare-chart-editor .column-fields-sortable {
                    border: 1px solid var(--spectrum-gray-300);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .compare-chart-editor .column-field-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 7px 12px;
                    background: var(--spectrum-gray-50);
                    cursor: pointer;
                    font-size: 13px;
                    color: var(--spectrum-gray-800);
                    transition: background 0.15s;
                    border-bottom: 1px solid var(--spectrum-gray-200);
                }

                .compare-chart-editor .column-field-row:last-child {
                    border-bottom: none;
                }

                .compare-chart-editor .column-field-row:hover {
                    background: var(--spectrum-gray-100);
                }

                .compare-chart-editor .column-field-row.selected {
                    font-weight: 500;
                    cursor: grab;
                }

                .compare-chart-editor .column-field-row.dragging {
                    opacity: 0.4;
                }

                .compare-chart-editor .column-field-row.dragover {
                    outline: 2px dashed var(--spectrum-blue-500);
                    outline-offset: -2px;
                }

                .compare-chart-editor .column-field-row input[type='checkbox'] {
                    margin: 0;
                    cursor: pointer;
                    accent-color: var(--spectrum-blue-900);
                }

                .compare-chart-editor .column-field-row .column-field-label {
                    flex: 1;
                    user-select: none;
                }

                .compare-chart-editor .column-fields-group-divider {
                    border-top: 1px solid var(--spectrum-gray-400);
                    margin: 4px 0;
                }

                .compare-chart-editor .chart-workspace {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    align-items: start;
                }

                .compare-chart-editor .chart-editor-panel {
                    min-width: 0;
                    max-height: calc(100vh - 220px);
                    overflow-y: auto;
                    background: var(--spectrum-white, #fff);
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.16);
                }

                .compare-chart-editor .chart-preview-panel {
                    position: sticky;
                    top: 16px;
                    min-width: 0;
                    max-height: calc(100vh - 220px);
                    overflow: auto;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.16);
                    background: var(--spectrum-white, #fff);
                    padding: 16px;
                }

                .compare-chart-editor .chart-empty-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                    color: var(--spectrum-gray-600);
                    font-size: 14px;
                    text-align: center;
                }

                @media (max-width: 1100px) {
                    .compare-chart-editor .chart-workspace {
                        grid-template-columns: 1fr;
                    }

                    .compare-chart-editor .chart-preview-panel {
                        position: relative;
                        max-height: none;
                        order: -1;
                    }

                    .compare-chart-editor .chart-editor-panel {
                        max-height: none;
                        overflow-y: visible;
                    }

                    .compare-chart-editor .column-preview-card {
                        max-width: 100%;
                    }
                }
            </style>
        `;
    }

    render() {
        if (!this.fragment) return nothing;

        return html`
            ${this.#styles}
            <div class="compare-chart-editor">
                <div class="chart-workspace">
                    <div class="chart-editor-panel">
                        <div class="chart-header">
                            <div class="chart-header-top">
                                <h2>Compare Chart</h2>
                                <div class="chart-header-actions">
                                    <span class="chart-count"
                                        >${this.columns.length} column${this.columns.length !== 1 ? 's' : ''}</span
                                    >
                                    <span class="chart-count-separator">·</span>
                                    <span class="chart-count"
                                        >${this.sections.length} section${this.sections.length !== 1 ? 's' : ''}</span
                                    >
                                    <sp-action-group size="s" compact quiet>
                                        <sp-action-button @click=${() => this.#addColumn()} ?disabled=${this.busy}>
                                            <sp-icon-add slot="icon"></sp-icon-add>
                                            Add Column
                                        </sp-action-button>
                                        <sp-action-button @click=${() => this.#addSection()} ?disabled=${this.busy}>
                                            <sp-icon-add slot="icon"></sp-icon-add>
                                            Add Section
                                        </sp-action-button>
                                    </sp-action-group>
                                </div>
                            </div>
                            <div class="chart-header-config">
                                <sp-field-label size="s">Block</sp-field-label>
                                <sp-picker
                                    size="s"
                                    label="Block Name"
                                    value="${this.#getField('blockName')?.values?.[0] || 'Comparison Table'}"
                                    @change=${(e) => this.#updateFieldValues('blockName', [e.target.value])}
                                >
                                    <sp-menu-item value="Comparison Table">Comparison Table</sp-menu-item>
                                    <sp-menu-item value="Table">Table</sp-menu-item>
                                </sp-picker>
                                ${this.#renderVariantCheckboxes()}
                            </div>
                        </div>
                        <sp-divider size="s"></sp-divider>
                        ${this.#sidePanel}
                    </div>
                    <div class="chart-preview-panel">
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
                            @section-title-change=${this.#onSectionTitleChange}
                            @row-title-change=${this.#onRowTitleChange}
                        ></compare-chart-preview>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('compare-chart-editor', CompareChartEditor);
