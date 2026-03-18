import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
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
        popoverAnchorRect: { type: Object, state: true },
        columnModalOpen: { type: Boolean, state: true },
    };

    createRenderRoot() {
        return this;
    }

    // Local cache for deep references (rows, values) that direct-hydrated doesn't return
    #localRefs = new Map();
    #resolvedCardIdsByPath = new Map();
    /** @type {Map<string, string[]>} column path → stable display order of all field names */
    #fieldDisplayOrders = new Map();
    #cardPickerSearchTimer;
    #cardSearchRequestId = 0;
    #previewHydrationRequestId = 0;
    #popoverOutsideHandler = null;
    #onKeydown = null;
    #popoverAnchorElement = null;
    #scrollHandler = null;

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
        this.popoverAnchorRect = null;
        this.columnModalOpen = false;
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
        this.#onKeydown = (e) => {
            if (e.key === 'Escape') {
                if (this.columnModalOpen) {
                    this.#closeColumnModal();
                } else if (this.panelMode !== PANEL_NONE) {
                    this.#dismissPopover();
                }
            }
        };
        document.addEventListener('keydown', this.#onKeydown);
    }

    disconnectedCallback() {
        clearTimeout(this.#cardPickerSearchTimer);
        this.#removePopoverOutsideListener();
        if (this.#onKeydown) document.removeEventListener('keydown', this.#onKeydown);
        super.disconnectedCallback();
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore')) {
            this.#fieldDisplayOrders.clear();
            this.#buildData();
        }
        super.update(changedProperties);
    }

    updated(changedProperties) {
        if (
            changedProperties.has('columns') ||
            changedProperties.has('selectedColumnIndex') ||
            changedProperties.has('panelMode') ||
            changedProperties.has('columnPreviewOpen') ||
            changedProperties.has('columnModalOpen')
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
        const draggedField = col.fields[this.draggingFieldIndex];
        const targetField = col.fields[index];
        const updated = [...col.fields];
        const [dragged] = updated.splice(this.draggingFieldIndex, 1);
        updated.splice(index, 0, dragged);
        // Keep display order in sync with drag reorder
        const displayOrder = this.#fieldDisplayOrders.get(col.path);
        if (displayOrder) {
            const newOrder = [...displayOrder];
            const fromIdx = newOrder.indexOf(draggedField);
            const toIdx = newOrder.indexOf(targetField);
            newOrder.splice(fromIdx, 1);
            newOrder.splice(toIdx, 0, draggedField);
            this.#fieldDisplayOrders.set(col.path, newOrder);
        }
        this.draggingFieldIndex = undefined;
        this.#saveChildField(col.fragment, 'fields', sortFieldsByGroup(updated));
    }

    #fieldDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggingFieldIndex = undefined;
    }

    /** Toggle a column field on/off, preserving stable display order. */
    #toggleField(col, fieldName, isSelected, selectedSet, displayOrder) {
        const updated = isSelected
            ? col.fields.filter((f) => f !== fieldName)
            : displayOrder.filter((f) => selectedSet.has(f) || f === fieldName);
        this.#saveChildField(col.fragment, 'fields', updated);
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

    #getFieldDisplayOrder(col) {
        const key = col.path;
        if (!this.#fieldDisplayOrders.has(key)) {
            const selectedSet = new Set(col.fields);
            const order = ['title', 'price', 'desc'].flatMap((group) => {
                const selected = col.fields.filter((f) => getFieldGroup(f) === group);
                const unselected = COLUMN_FIELD_OPTIONS.filter((f) => getFieldGroup(f) === group && !selectedSet.has(f));
                return [...selected, ...unselected];
            });
            this.#fieldDisplayOrders.set(key, order);
        }
        return this.#fieldDisplayOrders.get(key);
    }

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
        const { columnIndex, anchorRect, anchorElement } = e.detail;
        if (this.selectedColumnIndex !== columnIndex) {
            this.#closeCardPicker();
        }
        this.panelMode = PANEL_COLUMN;
        this.selectedColumnIndex = columnIndex;
        this.selectedSectionIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
        this.cellEditorType = '';
        this.popoverAnchorRect = anchorRect || null;
        this.#popoverAnchorElement = anchorElement || null;
        this.#attachScrollListener();
        this.#attachPopoverOutsideListener();
    }

    #onSectionClick(e) {
        const { sectionIndex, anchorRect, anchorElement } = e.detail;
        this.#closeCardPicker();
        this.panelMode = PANEL_SECTION;
        this.selectedSectionIndex = sectionIndex;
        this.selectedColumnIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
        this.cellEditorType = '';
        this.popoverAnchorRect = anchorRect || null;
        this.#popoverAnchorElement = anchorElement || null;
        this.#attachScrollListener();
        this.#attachPopoverOutsideListener();
    }

    #onRowClick(e) {
        const { sectionIndex, rowIndex, anchorRect, anchorElement } = e.detail;
        this.#closeCardPicker();
        this.panelMode = PANEL_ROW;
        this.selectedSectionIndex = sectionIndex;
        this.selectedRowIndex = rowIndex;
        this.selectedColumnIndex = -1;
        this.selectedCellIndex = -1;
        this.cellEditorType = '';
        this.popoverAnchorRect = anchorRect || null;
        this.#popoverAnchorElement = anchorElement || null;
        this.#attachScrollListener();
        this.#attachPopoverOutsideListener();
    }

    #onCellClick(e) {
        const { sectionIndex, rowIndex, cellIndex, anchorRect, anchorElement } = e.detail;
        this.#closeCardPicker();
        this.panelMode = PANEL_CELL;
        this.selectedSectionIndex = sectionIndex;
        this.selectedRowIndex = rowIndex;
        this.selectedCellIndex = cellIndex;
        this.selectedColumnIndex = -1;
        const row = this.sections[sectionIndex]?.rows?.[rowIndex];
        const rawValue = row?.values?.[cellIndex]?.valueType || '';
        this.cellEditorType = this.#getCellTypeFromValue(rawValue);
        this.popoverAnchorRect = anchorRect || null;
        this.#popoverAnchorElement = anchorElement || null;
        this.#attachScrollListener();
        this.#attachPopoverOutsideListener();
    }

    #dismissPopover() {
        this.#removePopoverOutsideListener();
        this.#removeScrollListener();
        this.#popoverAnchorElement = null;
        this.panelMode = PANEL_NONE;
        this.popoverAnchorRect = null;
        this.selectedColumnIndex = -1;
        this.selectedSectionIndex = -1;
        this.selectedRowIndex = -1;
        this.selectedCellIndex = -1;
        this.cellEditorType = '';
    }

    #attachScrollListener() {
        this.#removeScrollListener();
        const panel = this.closest('.main-container');
        if (!panel || !this.#popoverAnchorElement) return;
        this.#scrollHandler = () => {
            this.popoverAnchorRect = this.#popoverAnchorElement.getBoundingClientRect();
        };
        panel.addEventListener('scroll', this.#scrollHandler, { passive: true });
    }

    #removeScrollListener() {
        if (this.#scrollHandler) {
            const panel = this.closest('.main-container');
            panel?.removeEventListener('scroll', this.#scrollHandler);
            this.#scrollHandler = null;
        }
    }

    #attachPopoverOutsideListener() {
        this.#removePopoverOutsideListener();
        // Use rAF so the triggering click doesn't immediately dismiss
        requestAnimationFrame(() => {
            this.#popoverOutsideHandler = (mouseEvent) => {
                const popover = this.querySelector('.chart-context-popover');
                const preview = this.querySelector('compare-chart-preview');
                if (!popover) return;
                const target = mouseEvent.target;
                if (popover.contains(target)) return;
                // Clicks on the preview table are handled by the cell/column/row/section click events
                if (preview && (target === preview || preview.contains(target))) return;
                this.#dismissPopover();
            };
            document.addEventListener('mousedown', this.#popoverOutsideHandler);
        });
    }

    #removePopoverOutsideListener() {
        if (this.#popoverOutsideHandler) {
            document.removeEventListener('mousedown', this.#popoverOutsideHandler);
            this.#popoverOutsideHandler = null;
        }
    }

    #openColumnModal() {
        this.columnModalOpen = true;
        this.#removePopoverOutsideListener();
    }

    #closeColumnModal() {
        this.columnModalOpen = false;
        this.columnPreviewOpen = false;
        this.#closeCardPicker();
        // Re-attach outside listener when modal closes if column is still selected
        if (this.panelMode === PANEL_COLUMN && this.popoverAnchorRect) {
            this.#attachPopoverOutsideListener();
        }
    }

    #popoverStyle(anchorRect) {
        if (!anchorRect) return '';
        const popoverWidth = 320;
        const margin = 8;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let top = anchorRect.bottom + margin;
        let left = anchorRect.left;
        // Clamp to viewport bottom — always stay below anchor, never flip above
        top = Math.min(top, viewportHeight - margin);
        // Clamp horizontally
        left = Math.max(margin, Math.min(left, viewportWidth - popoverWidth - margin));
        return `top: ${top}px; left: ${left}px;`;
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
            showToast('Card assigned to column.', 'positive');
        }
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

    get #columnPopover() {
        const col = this.columns[this.selectedColumnIndex];
        if (!col) return nothing;
        const hasSelectedCard = Boolean(col.cardFragment?.path || col.cardFragment?.id);
        return html`
            <div class="popover-header">
                <span class="popover-title">Column</span>
                <div class="popover-header-actions">
                    <sp-action-button
                        size="s"
                        quiet
                        @click=${() => this.#deleteColumn(this.selectedColumnIndex)}
                        ?disabled=${this.busy}
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                    </sp-action-button>
                    <sp-action-button size="s" quiet @click=${() => this.#dismissPopover()}>✕</sp-action-button>
                </div>
            </div>
            <div class="popover-divider"></div>
            <div class="popover-field-stack">
                <sp-field-label size="s" for="pop-col-badge">Badge</sp-field-label>
                <sp-textfield
                    id="pop-col-badge"
                    size="s"
                    value="${col.badge || ''}"
                    placeholder="e.g. Best Offer"
                    @change=${(e) => this.#saveChildField(col.fragment, 'badge', [e.target.value])}
                ></sp-textfield>
            </div>
            <div class="popover-divider"></div>
            <div class="popover-field-stack">
                <sp-field-label size="s">Card</sp-field-label>
                <div class="popover-card-row">
                    <span class="popover-card-name">${hasSelectedCard ? col.cardFragment.title : 'No card linked'}</span>
                    <sp-action-button size="s" quiet @click=${() => this.#openColumnModal()}> Configure ▸ </sp-action-button>
                </div>
            </div>
        `;
    }

    get #sectionPopover() {
        const sec = this.sections[this.selectedSectionIndex];
        if (!sec) return nothing;
        return html`
            <div class="popover-header">
                <div class="popover-header-text">
                    <span class="popover-title">Section</span>
                    <span class="popover-subtitle">${sec.title || 'Untitled section'}</span>
                </div>
                <div class="popover-header-actions">
                    <sp-action-button
                        size="s"
                        quiet
                        @click=${() => this.#deleteSection(this.selectedSectionIndex)}
                        ?disabled=${this.busy}
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                    </sp-action-button>
                    <sp-action-button size="s" quiet @click=${() => this.#dismissPopover()}>✕</sp-action-button>
                </div>
            </div>
            <div class="popover-divider"></div>
            <div class="popover-field-stack">
                <sp-field-label size="s" for="pop-sec-title">Title</sp-field-label>
                <sp-textfield
                    id="pop-sec-title"
                    size="s"
                    value="${sec.title || ''}"
                    @change=${(e) => this.#saveChildField(sec.fragment, 'sectionTitle', [e.target.value])}
                ></sp-textfield>
            </div>
        `;
    }

    get #rowPopover() {
        const sec = this.sections[this.selectedSectionIndex];
        const row = sec?.rows?.[this.selectedRowIndex];
        if (!row) return nothing;
        const rowTitle = this.#extractPlainText(row.title) || '';
        const secTitle = sec.title || 'Untitled section';
        return html`
            <div class="popover-header">
                <div class="popover-header-text">
                    <span class="popover-title">Row</span>
                    <span class="popover-subtitle">${secTitle}</span>
                </div>
                <div class="popover-header-actions">
                    <sp-action-button
                        size="s"
                        quiet
                        @click=${() => this.#deleteRow(this.selectedSectionIndex, this.selectedRowIndex)}
                        ?disabled=${this.busy}
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                    </sp-action-button>
                    <sp-action-button size="s" quiet @click=${() => this.#dismissPopover()}>✕</sp-action-button>
                </div>
            </div>
            <div class="popover-divider"></div>
            <div class="popover-field-stack">
                <sp-field-label size="s" for="pop-row-title">Title</sp-field-label>
                <sp-textfield
                    id="pop-row-title"
                    size="s"
                    value="${rowTitle}"
                    @change=${(e) => this.#saveChildField(row.fragment, 'rowTitle', [e.target.value])}
                ></sp-textfield>
            </div>
        `;
    }

    get #cellPopover() {
        const sec = this.sections[this.selectedSectionIndex];
        const row = sec?.rows?.[this.selectedRowIndex];
        if (!row) return nothing;
        const val = row.values?.[this.selectedCellIndex];
        const rawValue = val?.valueType || '';
        const cellType = this.cellEditorType || this.#getCellTypeFromValue(rawValue);
        const colName = this.columns[this.selectedCellIndex]?.title || `Column ${this.selectedCellIndex + 1}`;
        const rowTitle = this.#extractPlainText(row.title) || 'Untitled';

        return html`
            <div class="popover-header">
                <div class="popover-header-text">
                    <span class="popover-title">${colName}</span>
                    <span class="popover-subtitle">${rowTitle}</span>
                </div>
                <sp-action-button size="s" quiet @click=${() => this.#dismissPopover()}>✕</sp-action-button>
            </div>
            <div class="popover-divider"></div>
            <div class="popover-field-stack">
                <sp-field-label size="s" for="pop-cell-type">Value type</sp-field-label>
                <sp-picker
                    id="pop-cell-type"
                    size="s"
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
                ${cellType === CELL_TYPE_EMPTY ? html`<p class="popover-hint">Renders as "—" in the chart.</p>` : nothing}
            </div>
            ${cellType === CELL_TYPE_BOOLEAN
                ? html`
                      <sp-checkbox
                          ?checked=${rawValue === 'true'}
                          @change=${(e) => this.#saveSelectedCellValue(e.target.checked ? 'true' : 'false')}
                          ?disabled=${this.busy}
                      >
                          Show checkmark
                      </sp-checkbox>
                  `
                : nothing}
            ${cellType === CELL_TYPE_TEXT
                ? html`
                      <sp-textfield
                          size="s"
                          value="${rawValue}"
                          placeholder="e.g. 100 GB, Included"
                          @change=${(e) => this.#saveSelectedCellValue(e.target.value)}
                          ?disabled=${this.busy}
                      ></sp-textfield>
                  `
                : nothing}
        `;
    }

    get #contextualPopover() {
        let content;
        switch (this.panelMode) {
            case PANEL_COLUMN:
                content = this.#columnPopover;
                break;
            case PANEL_SECTION:
                content = this.#sectionPopover;
                break;
            case PANEL_ROW:
                content = this.#rowPopover;
                break;
            case PANEL_CELL:
                content = this.#cellPopover;
                break;
            default:
                return nothing;
        }
        return html`
            <div
                class="chart-context-popover"
                style="${this.#popoverStyle(this.popoverAnchorRect)}"
                @click=${(e) => e.stopPropagation()}
            >
                ${content}
            </div>
        `;
    }

    get #columnConfigModal() {
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
        const allFieldsSorted = this.#getFieldDisplayOrder(col);

        return html`
            <div
                class="chart-modal-backdrop"
                @mousedown=${(e) => {
                    if (e.target === e.currentTarget) this.#closeColumnModal();
                }}
            >
                <div class="chart-modal" role="dialog" aria-modal="true" aria-label="Configure Column">
                    <div class="modal-header">
                        <h3 class="modal-title">Configure Column: ${col.title}</h3>
                        <sp-action-button size="s" quiet @click=${() => this.#closeColumnModal()}>✕</sp-action-button>
                    </div>

                    <!-- Display Fields + Badge: what appears in this column header -->
                    <section class="modal-section">
                        <h4 class="modal-section-title">Display Fields</h4>
                        <div class="column-fields-sortable">
                            ${allFieldsSorted.map((fieldName, index) => {
                                const isSelected = selectedSet.has(fieldName);
                                const fieldIndex = isSelected ? col.fields.indexOf(fieldName) : -1;
                                return html`
                                    ${index > 0 && getFieldGroup(fieldName) !== getFieldGroup(allFieldsSorted[index - 1])
                                        ? html`<div class="column-fields-group-divider"></div>`
                                        : nothing}
                                    ${keyed(
                                        fieldName,
                                        html`<label
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
                                            <span class="column-field-drag-handle" aria-hidden="true"
                                                >${isSelected ? '⠿' : ''}</span
                                            >
                                            <input
                                                type="checkbox"
                                                .checked=${isSelected}
                                                @change=${() =>
                                                    this.#toggleField(col, fieldName, isSelected, selectedSet, allFieldsSorted)}
                                            />
                                            <span class="column-field-label">${columnFieldLabel(fieldName)}</span>
                                        </label>`,
                                    )}
                                `;
                            })}
                        </div>
                        <div class="modal-badge-row">
                            <sp-field-label size="s" for="modal-col-badge">Badge</sp-field-label>
                            <sp-textfield
                                id="modal-col-badge"
                                size="s"
                                value="${col.badge || ''}"
                                placeholder="e.g. Best Offer"
                                @change=${(e) => this.#saveChildField(col.fragment, 'badge', [e.target.value])}
                            ></sp-textfield>
                        </div>
                    </section>

                    <!-- Card: browse + manual ID entry unified -->
                    <section class="modal-section">
                        <h4 class="modal-section-title">Card</h4>

                        ${hasSelectedCard
                            ? html`
                                  <div class="modal-card-chip">
                                      <div class="modal-card-chip-info">
                                          <span class="modal-card-chip-title">${col.cardFragment.title}</span>
                                          <span class="modal-card-chip-id">${selectedCardId}</span>
                                      </div>
                                      <div class="modal-card-chip-actions">
                                          <sp-action-button
                                              size="s"
                                              quiet
                                              @click=${() => this.#openSelectedCardEditor(col.cardFragment)}
                                              >Open ↗</sp-action-button
                                          >
                                          <sp-action-button
                                              size="s"
                                              quiet
                                              @click=${() =>
                                                  isPickerOpen ? this.#closeCardPicker() : this.#openCardPicker(col.path)}
                                              >${isPickerOpen ? 'Close' : 'Change'}</sp-action-button
                                          >
                                      </div>
                                  </div>
                              `
                            : html`
                                  <div class="modal-card-empty">
                                      <span>No card assigned.</span>
                                      <sp-action-button
                                          size="s"
                                          quiet
                                          @click=${() =>
                                              isPickerOpen ? this.#closeCardPicker() : this.#openCardPicker(col.path)}
                                          >${isPickerOpen ? 'Close' : 'Browse Cards'}</sp-action-button
                                      >
                                  </div>
                              `}
                        ${isPickerOpen
                            ? html`
                                  <div class="card-picker-panel">
                                      <sp-search
                                          label="Search cards"
                                          placeholder="Search cards in this surface and locale"
                                          .value=${this.cardPickerQuery}
                                          @input=${this.#onCardPickerInput}
                                      ></sp-search>
                                      <div class="card-picker-scope">Scope: ${scope.path || 'Unknown scope.'}</div>
                                      ${this.cardPickerLoading
                                          ? html`<div class="card-picker-loading">
                                                <sp-progress-circle size="s" indeterminate></sp-progress-circle>
                                            </div>`
                                          : nothing}
                                      ${this.cardPickerError
                                          ? html`<sp-help-text variant="negative">${this.cardPickerError}</sp-help-text>`
                                          : nothing}
                                      ${!trimmedQuery
                                          ? html`<div class="card-picker-section-title">Recent cards</div>`
                                          : nothing}
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

                        <div class="modal-manual-id">
                            <sp-field-label size="s" for="modal-col-card-id">Or enter ID</sp-field-label>
                            <sp-textfield
                                id="modal-col-card-id"
                                size="s"
                                value="${col.cardFragment?.id || ''}"
                                placeholder="Paste fragment ID"
                                @change=${(e) => this.#setCardReference(col.fragment, e.target.value)}
                            ></sp-textfield>
                        </div>
                    </section>

                    <details
                        class="modal-preview-disclosure"
                        open
                        @toggle=${(e) => {
                            this.columnPreviewOpen = e.target.open;
                        }}
                    >
                        <summary class="modal-preview-summary">Card Preview</summary>
                        <div class="modal-preview-body">
                            ${this.columnPreviewOpen
                                ? (() => {
                                      if (!hasSelectedCard) {
                                          return html`<div class="column-preview-empty">
                                              Select a card to preview it here.
                                          </div>`;
                                      }
                                      return html`
                                          <div
                                              id="column-preview-card"
                                              class="column-preview-card ${this.columnPreviewStatus === 'loading'
                                                  ? 'is-loading'
                                                  : ''}"
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
                                                        >${this.columnPreviewError ||
                                                        'Unable to render selected card preview.'}</sp-help-text
                                                    >`
                                                  : nothing}
                                          </div>
                                      `;
                                  })()
                                : nothing}
                        </div>
                    </details>

                    <div class="modal-footer">
                        <sp-action-button
                            size="s"
                            class="modal-delete-btn"
                            @click=${() => {
                                this.#closeColumnModal();
                                this.#deleteColumn(this.selectedColumnIndex);
                            }}
                            ?disabled=${this.busy}
                        >
                            <sp-icon-delete slot="icon"></sp-icon-delete>
                            Delete Column
                        </sp-action-button>
                        <sp-button variant="accent" @click=${() => this.#closeColumnModal()}>Done</sp-button>
                    </div>
                </div>
            </div>
        `;
    }

    #renderVariantCheckboxes() {
        const blockName = this.#getField('blockName')?.values?.[0] || 'Comparison Table';
        if (blockName !== 'Table') return nothing;
        const selected = this.#getField('selectedVariantNames')?.values || [];
        const options = ['merch', 'highlight', 'sticky', 'collapse', 'm-heading-icon', 'pricing-bottom', 'header-left'];
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
                    border: 1px solid var(--spectrum-gray-300, #dadada);
                    border-radius: 6px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .compare-chart-editor .column-field-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: var(--spectrum-gray-50, #fafafa);
                    cursor: pointer;
                    font-size: 13px;
                    color: var(--spectrum-gray-800);
                    transition: background 0.15s;
                    border-bottom: 1px solid var(--spectrum-gray-200, #e3e3e3);
                    width: 100%;
                    box-sizing: border-box;
                }

                .compare-chart-editor .column-field-row:last-child {
                    border-bottom: none;
                }

                .compare-chart-editor .column-field-row:hover {
                    background: var(--spectrum-gray-100, #f0f0f0);
                }

                .compare-chart-editor .column-field-row.selected {
                    font-weight: 500;
                    cursor: grab;
                }

                .compare-chart-editor .column-field-row.dragging {
                    opacity: 0.4;
                }

                .compare-chart-editor .column-field-row.dragover {
                    outline: 2px dashed var(--spectrum-blue-500, #1473e6);
                    outline-offset: -2px;
                }

                .compare-chart-editor .column-field-row input[type='checkbox'] {
                    margin: 0;
                    cursor: pointer;
                    accent-color: var(--spectrum-blue-900, #0d66d0);
                    flex-shrink: 0;
                }

                .compare-chart-editor .column-field-drag-handle {
                    width: 14px;
                    flex-shrink: 0;
                    color: var(--spectrum-gray-400, #b3b3b3);
                    font-size: 14px;
                    line-height: 1;
                    user-select: none;
                }

                .compare-chart-editor .column-field-row .column-field-label {
                    flex: 1;
                    user-select: none;
                }

                .compare-chart-editor .column-fields-group-divider {
                    height: 0;
                    border-top: 1px solid var(--spectrum-gray-300, #dadada);
                    margin: 4px 12px;
                }

                /* Badge row inline below fields list */
                .compare-chart-editor .modal-badge-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 4px;
                }

                .compare-chart-editor .modal-badge-row sp-field-label {
                    flex-shrink: 0;
                    margin: 0;
                    color: var(--spectrum-gray-700);
                    font-size: 12px;
                }

                .compare-chart-editor .modal-badge-row sp-textfield {
                    flex: 1;
                }

                /* Card chip — selected card display */
                .compare-chart-editor .modal-card-chip {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: var(--spectrum-gray-75, #f5f5f5);
                    border-radius: 6px;
                    border: 1px solid var(--spectrum-gray-200, #e3e3e3);
                }

                .compare-chart-editor .modal-card-chip-info {
                    flex: 1;
                    min-width: 0;
                    display: grid;
                    gap: 2px;
                }

                .compare-chart-editor .modal-card-chip-title {
                    font-weight: 600;
                    font-size: 13px;
                    color: var(--spectrum-gray-900);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .compare-chart-editor .modal-card-chip-id {
                    font-size: 11px;
                    color: var(--spectrum-gray-600, #6e6e6e);
                    font-family: monospace;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .compare-chart-editor .modal-card-chip-actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }

                /* Empty card state */
                .compare-chart-editor .modal-card-empty {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    font-size: 13px;
                    color: var(--spectrum-gray-600, #6e6e6e);
                    padding: 10px 12px;
                    background: var(--spectrum-gray-75, #f5f5f5);
                    border-radius: 6px;
                    border: 1px solid var(--spectrum-gray-200, #e3e3e3);
                }

                /* Manual ID row */
                .compare-chart-editor .modal-manual-id {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 4px;
                }

                .compare-chart-editor .modal-manual-id sp-field-label {
                    flex-shrink: 0;
                    margin: 0;
                    color: var(--spectrum-gray-600, #6e6e6e);
                    font-size: 12px;
                }

                .compare-chart-editor .modal-manual-id sp-textfield {
                    flex: 1;
                }

                .compare-chart-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .compare-chart-editor .chart-toolbar {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                    padding: 16px 20px;
                    background: var(--spectrum-white, #fff);
                    border-radius: 12px;
                    box-shadow: 0 2px 8px 0 rgb(0 0 0 / 16%);
                    align-self: center;
                    box-sizing: border-box;
                }

                .compare-chart-editor .chart-toolbar-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .compare-chart-editor .chart-toolbar-top h2 {
                    margin: 0;
                }

                .compare-chart-editor .chart-toolbar-config {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .compare-chart-editor .chart-preview-panel {
                    min-width: 0;
                    width: 100%;
                    overflow: auto;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px 0 rgb(0 0 0 / 16%);
                    background: var(--spectrum-white, #fff);
                    padding: 16px 20px;
                    align-self: center;
                    box-sizing: border-box;
                }

                @media (min-width: 1400px) {
                    .compare-chart-editor .chart-preview-panel,
                    .compare-chart-editor .chart-toolbar {
                        max-width: 65%;
                    }
                }

                @media (min-width: 1800px) {
                    .compare-chart-editor .chart-preview-panel,
                    .compare-chart-editor .chart-toolbar {
                        max-width: 60%;
                    }
                }

                /* Contextual floating popover */
                .chart-context-popover {
                    position: fixed;
                    z-index: 1000;
                    background: var(--spectrum-white, #fff);
                    border-radius: 8px;
                    box-shadow: 0 4px 20px 0 rgb(0 0 0 / 28%);
                    padding: 14px 16px;
                    min-width: 240px;
                    max-width: 320px;
                    display: grid;
                    gap: 8px;
                    border: 1px solid var(--spectrum-gray-200, #e3e3e3);
                    max-height: calc(100vh - 16px);
                    overflow-y: auto;
                }

                .chart-context-popover .popover-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }

                .chart-context-popover .popover-title {
                    font-weight: 700;
                    font-size: 13px;
                    color: var(--spectrum-gray-900);
                }

                .chart-context-popover .popover-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-left: auto;
                }

                .chart-context-popover .popover-field-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .chart-context-popover .popover-field-row sp-field-label {
                    flex-shrink: 0;
                    margin: 0;
                }

                .chart-context-popover .popover-field-row sp-textfield,
                .chart-context-popover .popover-field-row sp-picker {
                    flex: 1;
                }

                .chart-context-popover .popover-card-row {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .chart-context-popover .popover-card-name {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--spectrum-gray-800);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .chart-context-popover .popover-header-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                    flex: 1;
                }

                .chart-context-popover .popover-subtitle {
                    font-size: 11px;
                    color: var(--spectrum-gray-600);
                    font-weight: 400;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .chart-context-popover .popover-divider {
                    height: 1px;
                    background: var(--spectrum-gray-200, #e3e3e3);
                    margin: 2px -16px;
                }

                .chart-context-popover .popover-field-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .chart-context-popover .popover-field-stack sp-picker,
                .chart-context-popover .popover-field-stack sp-textfield {
                    width: 100%;
                }

                .chart-context-popover .popover-hint {
                    margin: 0;
                    padding: 0;
                    font-size: 12px;
                    color: var(--spectrum-gray-600);
                }

                /* Column config modal */
                .chart-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 1001;
                    background: rgb(0 0 0 / 50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                }

                .chart-modal {
                    background: var(--spectrum-white, #fff);
                    border-radius: 12px;
                    padding: 24px;
                    width: min(600px, 100%);
                    max-height: 90vh;
                    overflow-y: auto;
                    display: grid;
                    gap: 20px;
                    box-shadow: 0 8px 32px 0 rgb(0 0 0 / 32%);
                }

                .chart-modal .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }

                .chart-modal .modal-title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                }

                .chart-modal .modal-section {
                    display: grid;
                    gap: 10px;
                    padding-top: 16px;
                    border-top: 1px solid var(--spectrum-gray-200, #e3e3e3);
                }

                .chart-modal .modal-section-title {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--spectrum-gray-900);
                }

                .chart-modal .modal-preview-disclosure {
                    border-top: 1px solid var(--spectrum-gray-200, #e3e3e3);
                    padding-top: 16px;
                }

                .chart-modal .modal-preview-summary {
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    color: var(--spectrum-blue-600, #1473e6);
                    user-select: none;
                }

                .chart-modal .modal-preview-body {
                    margin-top: 12px;
                }

                .chart-modal .modal-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 8px;
                    border-top: 1px solid var(--spectrum-gray-200, #e3e3e3);
                    margin-top: 4px;
                }

                .chart-modal .modal-delete-btn {
                    color: var(--spectrum-red-600, #d7373f);
                }
            </style>
        `;
    }

    render() {
        if (!this.fragment) return nothing;

        return html`
            ${this.#styles}
            <div class="compare-chart-editor">
                <div class="chart-toolbar">
                    <div class="chart-toolbar-top">
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
                            ${this.busy ? html`<sp-progress-circle size="s" indeterminate></sp-progress-circle>` : nothing}
                        </div>
                    </div>
                    <div class="chart-toolbar-config">
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
                <div class="chart-preview-panel">
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
                ${this.columnModalOpen ? this.#columnConfigModal : nothing}
            </div>
            ${this.panelMode !== PANEL_NONE && this.popoverAnchorRect ? this.#contextualPopover : nothing}
        `;
    }
}

customElements.define('compare-chart-editor', CompareChartEditor);
