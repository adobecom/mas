import { LitElement, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ColumnResizeController, columnResizeStyles } from '../common/column-resize-controller.js';
import Store from '../store.js';
import { styles } from './mas-bulk-edit-editor.css.js';
import StoreController from '../reactivity/store-controller.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { Fragment } from '../aem/fragment.js';
import router from '../router.js';
import {
    BULK_EDIT_PROJECT_MODEL_ID,
    BULK_EDIT_STATUS,
    EDITABLE_FRAGMENT_MODEL_IDS,
    ROOT_PATH,
    PAGE_NAMES,
    QUICK_ACTION,
} from '../constants.js';
import { showToast, getAemSearchTerm } from '../utils.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { getFromFragmentCache, MasRepository } from '../mas-repository.js';
import { getSearchSurface, trackPendingProject, untrackPendingProject } from '../common/utils/project-list-utils.js';
import {
    SEARCH_FIELDS,
    buildSearchRow,
    findSearchRows,
    highlightSearchText,
    loadSearchVariations,
} from './bulk-edit-search.js';
import { VARIATION_TABS } from '../editors/variation-utils.js';
import { fragmentIsPromoVariation } from '../promotions/promotion-model.js';
import { renderCopyableValue } from '../common/utils/render-utils.js';
import {
    buildBulkEditProjectPayload,
    buildBulkEditConfigurationFields,
    isBulkEditProjectTitleTaken,
    isValidBulkEditProjectTitle,
    loadBulkEditProjects,
} from './bulk-edit-repository.js';
import { SAVE_SVG, DELETE_SVG } from '../bulk-publish/bulk-publish-icons.js';
import '../bulk-publish/mas-bulk-publish-delete-dialog.js';
import '../mas-quick-actions.js';
import './mas-bulk-edit-filters.js';

const TITLE_TAKEN_MESSAGE = 'A project with this title already exists.';
const RESULT_COLUMNS = [
    { value: 'offer', label: 'Offer' },
    { value: 'fragmentTitle', label: 'Fragment title' },
    { value: 'offerId', label: 'Offer ID' },
    { value: 'badge', label: 'Badge' },
    { value: 'ctas', label: 'Button label' },
    { value: 'callout', label: 'Callout text' },
    { value: 'fragmentDescription', label: 'Fragment description' },
    { value: 'promoText', label: 'Promo text' },
    { value: 'subtitle', label: 'Subtitle' },
    { value: 'tags', label: 'Tags' },
    { value: 'offerType', label: 'Offer type' },
    { value: 'description', label: 'Production description' },
    { value: 'status', label: 'Status' },
];

class MasBulkEditEditor extends LitElement {
    static styles = [
        styles,
        columnResizeStyles(
            RESULT_COLUMNS.map(({ value }) => ({ key: value })),
            { match: 'class' },
        ),
    ];

    columnResize = new ColumnResizeController(this);

    static properties = {
        projectTitle: { state: true },
        hasChanges: { state: true },
        loading: { state: true },
        loadFailed: { state: true },
        saving: { state: true },
        saveDialogOpen: { state: true },
        deleteDialogOpen: { state: true },
        findText: { state: true },
        replaceText: { state: true },
        searchFields: { state: true },
        matchCase: { state: true },
        searchResults: { state: true },
        searchedQuery: { state: true },
        searching: { state: true },
        hasMoreResults: { state: true },
        fragmentsFailed: { state: true },
        expandedRows: { state: true },
        variationStates: { state: true },
        selectedFragments: { state: true },
        resultFilters: { state: true },
    };

    inEdit = new StoreController(this, Store.bulkEditProjects.inEdit);
    projects = new StoreController(this, Store.bulkEditProjects.list.data);
    searchContext = new StoreController(this, Store.search);
    filters = new StoreController(this, Store.filters);

    #abortController = null;
    #searchCursor = null;
    #surface = null;
    #locale = null;
    #savedConfiguration;
    displayRows = [];
    selectableRows = [];
    selectedDisplayedCount = 0;
    constructor() {
        super();
        this.projectTitle = '';
        this.hasChanges = false;
        this.loading = false;
        this.loadFailed = false;
        this.saving = false;
        this.saveDialogOpen = false;
        this.deleteDialogOpen = false;
        this.findText = '';
        this.replaceText = '';
        this.searchFields = SEARCH_FIELDS.map(({ value }) => value);
        this.matchCase = false;
        this.searchResults = [];
        this.searchedQuery = '';
        this.searching = false;
        this.hasMoreResults = false;
        this.fragmentsFailed = false;
        this.expandedRows = new Set();
        this.variationStates = new Map();
        this.selectedFragments = new Map();
        this.resultFilters = { tagPaths: {}, tags: [], statuses: [], locales: null };
        this.#savedConfiguration = JSON.stringify(this.configurationFields);
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    get project() {
        return this.inEdit.value;
    }

    get isNewProject() {
        return !this.project;
    }

    async connectedCallback() {
        super.connectedCallback();
        this.#abortController = new AbortController();
        this.#surface = getSearchSurface(this.searchContext.value?.path);
        const { signal } = this.#abortController;
        const projectId = Store.bulkEditProjects.projectId.get();
        if (!projectId) {
            Store.bulkEditProjects.inEdit.set(null);
            return;
        }
        this.loading = true;
        try {
            const fragment = (await getFromFragmentCache(projectId)) ?? (await this.repository.getFragmentById(projectId));
            if (signal.aborted) return;
            if (fragment.model?.id !== BULK_EDIT_PROJECT_MODEL_ID)
                throw new Error(`Fragment ${projectId} is not a bulk edit project`);
            const store = new FragmentStore(new Fragment(fragment));
            Store.bulkEditProjects.inEdit.set(store);
            this.projectTitle = store.get().getFieldValue('title') ?? '';
            const project = store.get();
            this.findText = project.getFieldValue('searchTerm') ?? '';
            this.replaceText = project.getFieldValue('replaceTerm') ?? '';
            this.searchFields = project.getField('fieldNames')?.values ?? this.searchFields;
            const items = JSON.parse(project.getFieldValue('items') || '{}');
            this.matchCase = items.matchCase ?? false;
            this.resultFilters = items.resultFilters ?? this.resultFilters;
            this.selectedFragments = new Map((items.selection ?? []).map((fragment) => [fragment.id, fragment]));
            this.#savedConfiguration = JSON.stringify(this.configurationFields);
            this.loading = false;
            await this.updateComplete;
            if (!signal.aborted) await this.searchFragments();
        } catch (err) {
            if (signal.aborted) return;
            console.error('Failed to load bulk edit project:', err);
            this.loadFailed = true;
        } finally {
            if (!signal.aborted) this.loading = false;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#abortController?.abort();
        this.resetSearch();
        this.selectedFragments = new Map();
        Store.bulkEditProjects.inEdit.set(null);
    }

    willUpdate(changed) {
        const surface = getSearchSurface(this.searchContext.value?.path);
        const surfaceChanged = this.#surface !== null && surface !== this.#surface;
        const locale = this.filters.value.locale;
        const localeChanged = this.#locale !== null && locale !== this.#locale;
        this.#surface = surface;
        this.#locale = locale;
        if (surfaceChanged || localeChanged || changed.has('findText')) this.resetSearch();
        else if (this.#searchCursor && (changed.has('searchFields') || changed.has('matchCase'))) {
            this.#searchCursor.pauseAutoLoad = true;
            this.filterSearchResults();
        }
        if (surfaceChanged) {
            this.updateSelection(new Map());
            this.resultFilters = { tagPaths: {}, tags: [], statuses: [], locales: null };
        }
        if (
            ['findText', 'replaceText', 'searchFields', 'matchCase', 'resultFilters', 'selectedFragments'].some((key) =>
                changed.has(key),
            )
        ) {
            this.hasChanges = JSON.stringify(this.configurationFields) !== this.#savedConfiguration;
        }
        if (
            changed.has('searchResults') ||
            changed.has('expandedRows') ||
            changed.has('variationStates') ||
            changed.has('resultFilters')
        ) {
            this.displayRows = [];
            for (const row of this.searchResults) {
                this.displayRows.push(row);
                if (!this.expandedRows.has(row.id)) continue;
                const state = this.variationStates.get(row.id);
                this.displayRows.push({ id: `variations:${row.id}`, kind: 'variations', parent: row, state });
                if (state?.rows) {
                    const selectedLocales = this.resultFilters.locales;
                    const variations =
                        selectedLocales === null
                            ? state.rows[state.tab]
                            : state.rows[state.tab].filter((variation) =>
                                  variation.localeCodes.some((locale) => selectedLocales.includes(locale)),
                              );
                    this.displayRows[this.displayRows.length - 1].empty = !variations.length;
                    for (const [index, variation] of variations.entries()) {
                        this.displayRows.push({
                            ...variation,
                            variationClass: `variation-cell${index === 0 ? ' variation-first' : ''}${
                                index === variations.length - 1 ? ' variation-last' : ''
                            }`,
                        });
                    }
                }
            }
            this.selectableRows = this.displayRows.filter((row) => row.kind !== 'variations');
        }
        this.selectedDisplayedCount = this.selectableRows.filter((row) => this.selectedFragments.has(row.id)).length;
    }

    resetSearch() {
        this.#searchCursor?.controller.abort();
        this.#searchCursor = null;
        this.searchResults = [];
        this.searchedQuery = '';
        this.searching = false;
        this.hasMoreResults = false;
        this.fragmentsFailed = false;
        for (const state of this.variationStates.values()) state.controller.abort();
        this.variationStates = new Map();
        this.expandedRows = new Set();
    }

    async handleFindSubmit(event) {
        event.preventDefault();
        this.findText = event.target.value;
        await this.updateComplete;
        return this.searchFragments();
    }

    async searchFragments() {
        this.resetSearch();
        const query = this.findText.trim();
        if (!query) return;
        const controller = new AbortController();
        const cursor = {
            controller,
            query,
            pauseAutoLoad: false,
            rows: new Map(),
            iterator: this.repository.searchFragmentPages(
                {
                    path: `${ROOT_PATH}/${this.#surface}/${this.#locale}`,
                    modelIds: EDITABLE_FRAGMENT_MODEL_IDS,
                    query: getAemSearchTerm(query),
                    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                    ...(this.resultFilters.tags.length ? { tags: this.resultFilters.tags } : {}),
                    ...(this.resultFilters.statuses.length ? { status: this.resultFilters.statuses } : {}),
                },
                50,
                controller,
            ),
        };
        this.#searchCursor = cursor;
        this.searchedQuery = query;
        this.hasMoreResults = true;
        await this.loadNextSearchPage();
    }

    filterSearchResults() {
        const cursor = this.#searchCursor;
        const rows = [...cursor.rows.values()];
        const literalFilter = !this.searchEverywhere || this.matchCase || /\s/.test(cursor.query);
        this.searchResults = literalFilter ? findSearchRows(rows, cursor.query, this.searchFields, this.matchCase) : rows;
    }

    async loadNextSearchPage() {
        const cursor = this.#searchCursor;
        if (!cursor || this.searching || !this.hasMoreResults || this.fragmentsFailed) return;
        cursor.pauseAutoLoad = false;
        this.searching = true;
        const targetCount = this.searchResults.length + MasRepository.MIN_FILTERED_PAGE_RESULTS;
        try {
            for (let round = 0; round < MasRepository.MAX_REFILL_ROUNDS; round++) {
                const page = await cursor.iterator.next();
                if (this.#searchCursor !== cursor) return;
                if (page.done) {
                    this.hasMoreResults = false;
                    break;
                }
                const rows = page.value
                    .filter((fragment) => !Fragment.isHiddenFromSearch(fragment.path) && !fragmentIsPromoVariation(fragment))
                    .map(buildSearchRow);
                for (const row of rows) {
                    cursor.rows.set(row.id, row);
                }
                this.filterSearchResults();
                if (cursor.pauseAutoLoad || !this.searchFields.length || this.searchResults.length >= targetCount) break;
            }
        } catch (error) {
            if (this.#searchCursor !== cursor) return;
            this.fragmentsFailed = true;
            this.repository.processError(error, 'Could not load fragments for text search.');
        } finally {
            if (this.#searchCursor === cursor) this.searching = false;
        }
    }

    handleSearchRangeChange(event) {
        if (!this.#searchCursor?.pauseAutoLoad && event.last >= this.displayRows.length - 5) {
            this.loadNextSearchPage();
        }
    }

    handleResultFiltersChange(event) {
        const next = event.detail;
        const searchChanged =
            next.tags.join(',') !== this.resultFilters.tags.join(',') ||
            next.statuses.join(',') !== this.resultFilters.statuses.join(',');
        this.resultFilters = next;
        if (searchChanged && this.searchedQuery) this.searchFragments();
    }

    retrySearch() {
        return this.searchFragments();
    }

    async toggleVariations(row) {
        const expanded = new Set(this.expandedRows);
        if (expanded.has(row.id)) {
            expanded.delete(row.id);
            this.expandedRows = expanded;
            return;
        }
        expanded.add(row.id);
        this.expandedRows = expanded;
        if (!this.variationStates.has(row.id)) await this.loadVariations(row);
    }

    async loadVariations(row) {
        this.variationStates.get(row.id)?.controller.abort();
        const state = { controller: new AbortController(), tab: 'locale', loading: true, rows: null, error: false };
        this.variationStates = new Map(this.variationStates).set(row.id, state);
        try {
            const rows = await loadSearchVariations(row, this.repository, state.controller);
            if (state.controller.signal.aborted) return;
            state.rows = rows;
        } catch (error) {
            if (state.controller.signal.aborted) return;
            state.error = true;
            this.repository.processError(error, 'Could not load fragment variations.');
        } finally {
            if (!state.controller.signal.aborted) {
                state.loading = false;
                this.variationStates = new Map(this.variationStates);
            }
        }
    }

    handleVariationTabChange(event, row) {
        const state = this.variationStates.get(row.id);
        state.tab = event.target.selected;
        this.variationStates = new Map(this.variationStates);
    }

    updateSelection(selection) {
        this.selectedFragments = selection;
        this.dispatchEvent(
            new CustomEvent('fragment-selection-change', {
                detail: { fragments: [...selection.values()] },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleFragmentSelection(event, row) {
        const selection = new Map(this.selectedFragments);
        if (event.target.checked) selection.set(row.id, row.fragment);
        else selection.delete(row.id);
        this.updateSelection(selection);
    }

    handleSelectAll(event) {
        const selection = new Map(this.selectedFragments);
        for (const row of this.selectableRows) {
            if (event.target.checked) selection.set(row.id, row.fragment);
            else selection.delete(row.id);
        }
        this.updateSelection(selection);
    }

    handleTitleInput(event) {
        this.projectTitle = event.target.value;
        this.hasChanges = true;
    }

    get configurationFields() {
        return buildBulkEditConfigurationFields(this);
    }

    openSaveDialog() {
        if (this.saving || !this.hasChanges) return;
        this.projectTitle = this.project?.get().getFieldValue('title') ?? '';
        this.saveDialogOpen = true;
    }

    closeSaveDialog() {
        this.saveDialogOpen = false;
    }

    get titleError() {
        const title = this.projectTitle.trim();
        if (!isValidBulkEditProjectTitle(title)) {
            return 'Title must follow the format [project title]-MWPW|DOTCOM-[Jira number], e.g. Spring sale-DOTCOM-123456.';
        }
        if (isBulkEditProjectTitleTaken(title, this.project?.get().id)) return TITLE_TAKEN_MESSAGE;
        return null;
    }

    async save() {
        if (this.saving || this.titleError) return;
        const { signal } = this.#abortController;
        const configurationFields = this.configurationFields;
        const savedConfiguration = JSON.stringify(configurationFields);
        const project = this.project;
        this.saving = true;
        try {
            const title = this.projectTitle.trim();
            const loaded = await loadBulkEditProjects(this.repository, this.#abortController);
            if (!loaded) return;
            if (isBulkEditProjectTitleTaken(title, this.project?.get().id)) {
                showToast(TITLE_TAKEN_MESSAGE, 'negative');
                return;
            }
            if (this.isNewProject) {
                const raw = await this.repository.createFragment(
                    buildBulkEditProjectPayload({ title, status: BULK_EDIT_STATUS.DRAFT, configurationFields }),
                    false,
                );
                if (!raw) return;
                const store = new FragmentStore(new Fragment(raw));
                trackPendingProject(Store.bulkEditProjects.list.data, store);
                if (signal.aborted) {
                    showToast(`Project "${title}" was created.`, 'positive');
                    return;
                }
                Store.bulkEditProjects.inEdit.set(store);
                Store.bulkEditProjects.projectId.set(raw.id);
            } else {
                const draft = new FragmentStore(new Fragment(project.get().initialValue));
                const fields = [{ name: 'title', type: 'text', values: [title] }, ...configurationFields];
                const names = new Set(fields.map(({ name }) => name));
                draft.get().title = title;
                draft.get().fields = [...draft.get().fields.filter(({ name }) => !names.has(name)), ...fields];
                const saved = await this.repository.saveFragment(draft, {
                    withToast: false,
                    refetchEtag: false,
                    errorMessage: 'Failed to save the project.',
                });
                if (!saved || signal.aborted) return;
                const savedProject = { ...draft.get() };
                delete savedProject.initialValue;
                project.refreshFrom(savedProject);
                for (const listed of Store.bulkEditProjects.list.data.get()) {
                    if (listed.id === project.id && listed !== project) listed.refreshFrom(savedProject);
                }
                Store.bulkEditProjects.inEdit.notify();
                Store.bulkEditProjects.list.data.notify();
            }
            this.projectTitle = title;
            this.#savedConfiguration = savedConfiguration;
            this.hasChanges = JSON.stringify(this.configurationFields) !== savedConfiguration;
            this.saveDialogOpen = false;
            showToast('Project saved successfully.', 'positive');
        } catch (err) {
            console.error('Failed to save bulk edit project:', err);
            const isConflict = err.message?.includes(': 409');
            showToast(isConflict ? TITLE_TAKEN_MESSAGE : 'Failed to save the project.', 'negative');
        } finally {
            this.saving = false;
        }
    }

    async handleDeleteConfirmed() {
        this.deleteDialogOpen = false;
        if (!this.isNewProject) {
            const ok = await this.repository.deleteFragment(this.project.get());
            if (!ok) return;
            untrackPendingProject(Store.bulkEditProjects.list.data, this.project.id);
        }
        this.hasChanges = false;
        Store.bulkEditProjects.projectId.set(null);
        router.navigateToPage(PAGE_NAMES.BULK_EDIT)();
    }

    async promptDiscardChanges() {
        if (!this.hasChanges) return true;
        return confirmation({
            title: 'Unsaved changes',
            content: 'You have unsaved changes. Leave anyway?',
            confirmLabel: 'Discard',
            cancelLabel: 'Stay',
            variant: 'confirmation',
        });
    }

    get deleteDialog() {
        if (!this.deleteDialogOpen) return nothing;
        return html`<mas-bulk-publish-delete-dialog
            open
            .projectTitle=${this.project?.get().getFieldValue('title') || 'Untitled project'}
            @delete-confirmed=${this.handleDeleteConfirmed}
            @delete-cancelled=${() => (this.deleteDialogOpen = false)}
        ></mas-bulk-publish-delete-dialog>`;
    }

    get disabledActions() {
        const disabled = new Set();
        if (this.saving || !this.hasChanges || this.saveDialogOpen) disabled.add(QUICK_ACTION.SAVE);
        if (this.saving || this.isNewProject) disabled.add(QUICK_ACTION.DELETE);
        return disabled;
    }

    get loadErrorView() {
        return html`<div class="card" data-testid="load-error">
            <p>This project could not be loaded. It may have been deleted or the link is invalid.</p>
            <sp-button
                variant="secondary"
                @click=${() => {
                    Store.bulkEditProjects.projectId.set(null);
                    router.navigateToPage(PAGE_NAMES.BULK_EDIT)();
                }}
                >Back to projects</sp-button
            >
        </div>`;
    }

    get searchEverywhere() {
        return this.searchFields.length === SEARCH_FIELDS.length;
    }

    get searchInLabel() {
        if (this.searchEverywhere) return 'Everywhere';
        if (!this.searchFields.length) return 'Select fields';
        if (this.searchFields.length === 1) return SEARCH_FIELDS.find(({ value }) => value === this.searchFields[0]).label;
        return `${this.searchFields.length} fields selected`;
    }

    handleEverywhereChange(event) {
        this.searchFields = event.target.checked ? SEARCH_FIELDS.map(({ value }) => value) : [];
    }

    handleSearchFieldChange(event, value) {
        const selected = new Set(this.searchFields);
        if (event.target.checked) selected.add(value);
        else selected.delete(value);
        this.searchFields = [...selected];
    }

    get searchInTemplate() {
        return html`
            <overlay-trigger placement="bottom-start" offset="4" class="search-in-dropdown">
                <sp-action-button id="search-in" slot="trigger" dir="rtl" label="Search in">
                    ${this.searchInLabel}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>
                <sp-popover slot="click-content" class="search-in-popover">
                    <sp-checkbox
                        data-testid="search-everywhere"
                        .checked=${this.searchEverywhere}
                        @change=${this.handleEverywhereChange}
                        >Everywhere</sp-checkbox
                    >
                    <sp-divider size="s"></sp-divider>
                    <sp-field-group vertical aria-label="Search fields">
                        ${SEARCH_FIELDS.map(
                            ({ value, label }) => html`
                                <sp-checkbox
                                    value=${value}
                                    .checked=${this.searchFields.includes(value)}
                                    @change=${(event) => this.handleSearchFieldChange(event, value)}
                                    >${label}</sp-checkbox
                                >
                            `,
                        )}
                    </sp-field-group>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    get searchForm() {
        return html`
            <div class="search-row">
                <div class="field">
                    <sp-field-label for="find-text">Find</sp-field-label>
                    <sp-search
                        id="find-text"
                        label="Find"
                        size="m"
                        placeholder="Enter word or phrase"
                        .value=${this.findText}
                        @input=${(event) => (this.findText = event.target.value)}
                        @change=${(event) => {
                            if (!event.target.value) this.findText = '';
                        }}
                        @submit=${this.handleFindSubmit}
                    ></sp-search>
                    <sp-checkbox .checked=${this.matchCase} @change=${(event) => (this.matchCase = event.target.checked)}
                        >Match case</sp-checkbox
                    >
                </div>
                <div class="field">
                    <sp-field-label for="search-in">Search in</sp-field-label>
                    ${this.searchInTemplate}
                </div>
                <span class="replace-arrow" aria-hidden="true">&#8594;</span>
                <div class="field">
                    <sp-field-label for="replace-text">Replace</sp-field-label>
                    <sp-textfield
                        id="replace-text"
                        placeholder="Enter word or phrase"
                        .value=${this.replaceText}
                        @input=${(event) => (this.replaceText = event.target.value)}
                    ></sp-textfield>
                </div>
                <div class="file-actions">
                    <sp-field-label aria-hidden="true">File actions</sp-field-label>
                    <sp-button-group>
                        <sp-button variant="secondary" disabled>
                            <sp-icon-download slot="icon"></sp-icon-download>
                            Download report
                        </sp-button>
                        <sp-button variant="secondary" disabled>
                            <sp-icon-upload-to-cloud slot="icon"></sp-icon-upload-to-cloud>
                            Upload file
                        </sp-button>
                    </sp-button-group>
                </div>
            </div>
            ${this.searchedQuery
                ? html`<mas-bulk-edit-filters
                      .surface=${this.#surface}
                      .value=${this.resultFilters}
                      @filters-change=${this.handleResultFiltersChange}
                  ></mas-bulk-edit-filters>`
                : nothing}
            <sp-help-text class="preview-notice">
                Press Enter in Find to search ${this.filters.value.locale}. Expand an offer to select its Locale, Promotion, or
                Grouped variations. Enter Replace text to preview changes in the selected Search in fields. Save preserves your
                search settings, filters, and selections; it does not change fragment content. File actions are not available
                yet.
            </sp-help-text>
        `;
    }

    get fragmentsTable() {
        return html`
            <section class="fragments-table ${this.searchResults.length ? 'has-results' : ''}" aria-label="Fragments">
                <div class="results-scroll">
                    ${this.searchResults.length
                        ? html`<sp-table
                              class="item-table search-results"
                              style=${styleMap(this.columnResize.tableStyle())}
                              data-resized-columns=${ifDefined(this.columnResize.resizedColumns)}
                              .items=${this.displayRows}
                              .itemValue=${(row) => (row.parentId ? `${row.parentId}:${row.id}` : row.id)}
                              .renderItem=${(row) => this.renderSearchItem(row)}
                              @rangeChanged=${this.handleSearchRangeChange}
                          >
                              ${this.fragmentTableHead}
                          </sp-table>`
                        : html`<sp-table
                              class="item-table"
                              style=${styleMap(this.columnResize.tableStyle())}
                              data-resized-columns=${ifDefined(this.columnResize.resizedColumns)}
                          >
                              ${this.fragmentTableHead}
                              <sp-table-body></sp-table-body>
                          </sp-table>`}
                </div>
                ${this.searchResults.length
                    ? html`<p class="search-result-count" role="status">
                          ${this.searchResults.length} result(s)${this.hasMoreResults ? ' loaded' : ''}
                      </p>`
                    : nothing}
                ${this.selectedFragments.size
                    ? html`<div class="selection-summary" role="status">
                          <span>${this.selectedFragments.size} selected</span>
                          <sp-action-button quiet @click=${() => this.updateSelection(new Map())}
                              >Clear selection</sp-action-button
                          >
                      </div>`
                    : nothing}
                ${!this.searchResults.length || this.searching || this.fragmentsFailed ? this.searchState : nothing}
                ${this.hasMoreResults && !this.searching && !this.fragmentsFailed
                    ? html`<div class="search-pagination">
                          <sp-button variant="secondary" @click=${this.loadNextSearchPage}>Load more</sp-button>
                      </div>`
                    : nothing}
            </section>
        `;
    }

    get fragmentTableHead() {
        return html`<sp-table-head>
            <sp-table-head-cell class="result-cell expansion"></sp-table-head-cell>
            <sp-table-head-cell class="result-cell selection">
                <sp-checkbox
                    aria-label="Select all displayed fragments"
                    ?disabled=${!this.selectableRows.length}
                    .checked=${!!this.selectableRows.length && this.selectedDisplayedCount === this.selectableRows.length}
                    .indeterminate=${this.selectedDisplayedCount > 0 &&
                    this.selectedDisplayedCount < this.selectableRows.length}
                    @change=${this.handleSelectAll}
                ></sp-checkbox>
            </sp-table-head-cell>
            ${RESULT_COLUMNS.map(
                ({ value, label }) => html`
                    <sp-table-head-cell class="result-cell ${value}"
                        >${label} ${this.columnResize.handle(value, label)}</sp-table-head-cell
                    >
                `,
            )}
        </sp-table-head>`;
    }

    renderSearchItem(row) {
        if (row.kind !== 'variations') return this.renderSearchRow(row);
        const { state, parent } = row;
        const empty = row.empty;
        return html`<sp-table-cell class="variation-controls ${empty ? 'has-empty-variations' : ''}">
            <div class="variation-toolbar">
                <sp-tabs
                    quiet
                    .selected=${state?.tab ?? 'locale'}
                    @change=${(event) => this.handleVariationTabChange(event, parent)}
                    aria-label="Variations of ${parent.text.fragmentTitle}"
                >
                    ${VARIATION_TABS.map(({ id, label }) => html`<sp-tab value=${id} label=${label}>${label}</sp-tab>`)}
                </sp-tabs>
                ${state?.loading
                    ? html`<sp-progress-circle size="s" indeterminate label="Loading variations"></sp-progress-circle>`
                    : state?.error
                      ? html`<span role="alert">Could not load variations.</span>
                            <sp-action-button @click=${() => this.loadVariations(parent)}>Retry</sp-action-button>`
                      : nothing}
            </div>
            ${empty ? html`<p class="variation-empty" role="status">No ${state.tab} variations found.</p>` : nothing}
        </sp-table-cell>`;
    }

    renderSearchRow(row) {
        return html`
            <sp-table-cell class="result-cell expansion ${row.variationClass ?? ''}">
                ${row.parentId
                    ? nothing
                    : html`<sp-action-button
                          quiet
                          label="${this.expandedRows.has(row.id) ? 'Collapse' : 'Expand'} variations of ${row.text
                              .fragmentTitle}"
                          aria-expanded=${this.expandedRows.has(row.id)}
                          @click=${() => this.toggleVariations(row)}
                      >
                          ${this.expandedRows.has(row.id)
                              ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                              : html`<sp-icon-chevron-right slot="icon"></sp-icon-chevron-right>`}
                      </sp-action-button>`}
            </sp-table-cell>
            <sp-table-cell class="result-cell selection ${row.variationClass ?? ''}" data-fragment-id=${row.id}>
                <sp-checkbox
                    aria-label="Select ${row.parentId ? 'variation' : 'fragment'} ${row.text.fragmentTitle}"
                    .checked=${this.selectedFragments.has(row.id)}
                    @change=${(event) => this.handleFragmentSelection(event, row)}
                ></sp-checkbox>
            </sp-table-cell>
            ${RESULT_COLUMNS.map(({ value }) => {
                const text = row.text[value] ?? row[value] ?? '';
                return html`<sp-table-cell
                    class="result-cell ${value} ${value === 'offerId' ? 'offer-id' : ''} ${row.variationClass ?? ''}"
                    title=${text}
                >
                    ${value === 'offer' && row.icon ? html`<img class="mnemonic-icon" src=${row.icon} alt="" />` : nothing}
                    ${value === 'offerId'
                        ? text
                            ? renderCopyableValue(this, text, {
                                  ariaLabel: 'Copy Offer ID',
                                  successMessage: 'Offer ID copied to clipboard',
                                  errorMessage: 'Failed to copy Offer ID',
                              })
                            : nothing
                        : html`<span class="title-clamp">
                              ${this.searchFields.includes(value)
                                  ? highlightSearchText(text, this.searchedQuery, this.matchCase, this.replaceText)
                                  : text}
                          </span>`}
                </sp-table-cell>`;
            })}
        `;
    }

    get searchState() {
        if (this.fragmentsFailed) {
            return html`<div class="search-message" role="alert">
                <p>Could not load fragments for text search.</p>
                <sp-button variant="secondary" @click=${this.retrySearch}>Retry</sp-button>
            </div>`;
        }
        if (this.searching) {
            return html`<div class="search-message" role="status">
                <sp-progress-circle label="Searching fragments" indeterminate></sp-progress-circle>
                <p>Searching fragments...</p>
            </div>`;
        }
        let heading = 'No search queries entered yet';
        let description = 'Enter a word or phrase in Find to search fragments.';
        if (this.findText.trim() && !this.searchFields.length) {
            heading = 'No search fields selected';
            description = 'Select Everywhere or one or more fields in Search in.';
        } else if (this.findText.trim() && !this.searchedQuery) {
            heading = 'Press Enter to find fragments';
            description = 'Search starts when you press Enter in Find.';
        } else if (this.searchedQuery) {
            heading = this.hasMoreResults ? 'No matches in loaded pages' : 'No matching fragments';
            description = this.hasMoreResults
                ? 'Load more to continue searching.'
                : 'Try different text or select more search fields.';
        }
        return html`<sp-illustrated-message>
            <sp-icon-cloud size="xxl"></sp-icon-cloud>
            <h2 slot="heading">${heading}</h2>
            <p slot="description">${description}</p>
        </sp-illustrated-message>`;
    }

    get saveDialog() {
        if (!this.saveDialogOpen) return nothing;
        return html`
            <sp-overlay
                type="modal"
                open
                @keydown=${(event) => {
                    if (this.saving && event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }}
                @sp-closed=${(event) => {
                    if (event.target === event.currentTarget) this.closeSaveDialog();
                }}
            >
                <sp-dialog-wrapper headline="Save edits" underlay no-divider size="m">
                    <div class="label-row">
                        <sp-field-label for="project-title">Title</sp-field-label>
                        <sp-action-button quiet label="Project name format" data-testid="title-info">
                            <sp-icon-info slot="icon"></sp-icon-info>
                            <sp-tooltip self-managed placement="top"
                                >Format: [project title]-MWPW|DOTCOM-[Jira number]</sp-tooltip
                            >
                        </sp-action-button>
                    </div>
                    <sp-textfield
                        id="project-title"
                        data-testid="title-input"
                        placeholder="Project title-MWPW-123456"
                        .value=${this.projectTitle}
                        ?disabled=${this.saving}
                        ?invalid=${!!this.projectTitle && !!this.titleError}
                        @input=${this.handleTitleInput}
                        @keydown=${(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                this.save();
                            }
                        }}
                        autofocus
                    >
                        <sp-help-text slot="negative-help-text" data-testid="title-error">${this.titleError}</sp-help-text>
                    </sp-textfield>
                    <sp-button-group class="save-dialog-actions">
                        <sp-button variant="secondary" ?disabled=${this.saving} @click=${this.closeSaveDialog}
                            >Cancel</sp-button
                        >
                        <sp-button
                            data-testid="confirm-save"
                            variant="accent"
                            ?disabled=${this.saving || !!this.titleError}
                            @click=${this.save}
                            >${this.saving ? 'Saving...' : 'Save'}</sp-button
                        >
                    </sp-button-group>
                </sp-dialog-wrapper>
            </sp-overlay>
        `;
    }

    render() {
        if (this.loading) return html`<sp-progress-circle label="Loading project" indeterminate></sp-progress-circle>`;
        if (this.loadFailed) return this.loadErrorView;
        return html`
            <sp-action-button quiet class="back-link" @click=${() => router.navigateToPage(PAGE_NAMES.BULK_EDIT)()}>
                &#8592; All find and replace projects
            </sp-action-button>
            <header>
                <h1>${this.isNewProject ? 'Create new find and replace project' : 'Edit find and replace project'}</h1>
                <sp-status-light variant="neutral">${this.project?.get().getFieldValue('status') || 'Draft'}</sp-status-light>
            </header>
            <div class="card">${this.searchForm}</div>
            ${this.fragmentsTable}
            <mas-quick-actions
                drag-handle-style="bar"
                .actions=${[QUICK_ACTION.SAVE, QUICK_ACTION.DELETE]}
                .iconOverrides=${{
                    [QUICK_ACTION.SAVE]: { icon: SAVE_SVG, title: 'Save' },
                    [QUICK_ACTION.DELETE]: { icon: DELETE_SVG, title: 'Delete', className: 'delete-action' },
                }}
                .disabled=${this.disabledActions}
                @save=${this.openSaveDialog}
                @delete=${() => (this.deleteDialogOpen = true)}
            ></mas-quick-actions>
            ${this.deleteDialog} ${this.saveDialog}
        `;
    }
}

customElements.define('mas-bulk-edit-editor', MasBulkEditEditor);
