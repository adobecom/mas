import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ColumnResizeController, columnResizeStyles } from './common/column-resize-controller.js';
import StoreController from './reactivity/store-controller.js';
import { RECOGNIZED_VARIANT_NAMES } from './editors/variant-picker.js';
import Store from './store.js';
import { isUUID } from './utils.js';
import './mas-fragment.js';
import Events from './events.js';
import { CARD_MODEL_PATH } from './constants.js';
import {
    fragmentHasPersonalizationTag,
    getFragmentNonCountryPznTagIds,
    isPznCountryTagId,
    PZN_TAG_ID_PREFIX,
} from './common/utils/personalization-utils.js';
import {
    getParentRowSelection,
    mergeParentTableSelection,
    stripNestedVariationSelectControls,
} from './mas-content-table-selection.js';

export const cardSkeleton = () =>
    html`<div class="render-fragment-placeholder" aria-busy="true">
        <div class="skeleton-element skeleton-title"></div>
        <div class="skeleton-element skeleton-body"></div>
        <div class="skeleton-element skeleton-footer"></div>
    </div>`;

const tableSkeletonRow = () =>
    html`<sp-table-row class="skeleton-row">
        <sp-table-cell class="expand-cell"></sp-table-cell>
        <sp-table-cell class="name"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="title"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="wf-status"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="offer-id"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="offer-type"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="last-modified-by"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="price"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="status"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="actions"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="preview"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
    </sp-table-row>`;

const CONTENT_TABLE_COLUMNS = [
    { key: 'name', label: 'Path' },
    { key: 'title', label: 'Fragment Title' },
    { key: 'wf-status', label: 'Workflow Status' },
    { key: 'offer-id', label: 'Offer ID' },
    { key: 'offer-type', label: 'Offer Type' },
    { key: 'last-modified-by', label: 'Last Modified By' },
    { key: 'price', label: 'Price' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
    { key: 'preview', label: 'Preview' },
];

const SORTABLE_COLUMNS = new Set(['name', 'title', 'offer-id', 'offer-type', 'last-modified-by', 'price', 'status']);

const CONTENT_TABLE_RESIZE_CSS = columnResizeStyles(CONTENT_TABLE_COLUMNS, { match: 'class' }).cssText;

class MasContent extends LitElement {
    columnResize = new ColumnResizeController(this);

    static properties = {
        tableSelects: { type: String, state: true },
    };

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.goToFragment = this.goToFragment.bind(this);
        this.subscriptions = [];
        this.observedSentinel = null;
        this.wasLoading = false;
    }

    #handleTableSelectionRefresh = () => {
        if (Store.selecting.get() && !this.loading.value && this.firstPageLoaded.value) {
            void this.refreshTableSelection();
        }
    };

    #refreshInProgress = false;
    #fragmentsChangedWhileSelecting = false;
    #filtersChangedWhileSelecting = false;
    #refreshSelectionGeneration = 0;

    loading = new StoreController(this, Store.fragments.list.loading);
    firstPageLoaded = new StoreController(this, Store.fragments.list.firstPageLoaded);
    fragments = new StoreController(this, Store.fragments.list.data);
    hasMore = new StoreController(this, Store.fragments.list.hasMore);
    renderMode = new StoreController(this, Store.renderMode);
    selection = new StoreController(this, Store.selection);
    search = new StoreController(this, Store.search);
    filters = new StoreController(this, Store.filters);

    connectedCallback() {
        super.connectedCallback();
        Events.fragmentAdded.subscribe(this.goToFragment);
        Events.fragmentDeleted.subscribe(this.onFragmentDeleted);
        this.addEventListener('table-selection-refresh', this.#handleTableSelectionRefresh);

        this.subscriptions.push(
            Store.fragments.list.data.subscribe(() => {
                if (Store.selecting.get()) this.#fragmentsChangedWhileSelecting = true;
            }),
        );

        this.subscriptions.push(
            Store.filters.subscribe(() => {
                if (Store.selecting.get()) this.#filtersChangedWhileSelecting = true;
            }),
        );

        this.subscriptions.push(
            Store.selecting.subscribe((selecting) => {
                this.tableSelects = selecting ? 'multiple' : undefined;
                this.#fragmentsChangedWhileSelecting = false;
                this.#filtersChangedWhileSelecting = false;
                if (selecting) {
                    void this.updateComplete.then(() => stripNestedVariationSelectControls(this));
                }
            }),
        );

        this.scrollObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && this.hasMore.value && !this.loading.value) {
                    document.querySelector('mas-repository')?.loadNextPage();
                }
            },
            { root: this.closest('.main-container'), rootMargin: '200px' },
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Events.fragmentAdded.unsubscribe(this.goToFragment);
        Events.fragmentDeleted.unsubscribe(this.onFragmentDeleted);
        this.removeEventListener('table-selection-refresh', this.#handleTableSelectionRefresh);
        this.scrollObserver?.disconnect();
        this.observedSentinel = null;
        this.wasLoading = false;

        if (this.subscriptions && this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => {
                if (subscription) {
                    subscription.unsubscribe();
                }
            });
        }
        this.subscriptions = [];
    }

    onFragmentDeleted(fragment) {
        Store.fragments.list.data.set((prev) => {
            const result = [...prev];
            const index = result.findIndex((fragmentStore) => fragmentStore.get().id === fragment.id);
            if (index !== -1) {
                result.splice(index, 1);
            }
            return result;
        });
        Store.fragments.inEdit.set(null);
    }

    async goToFragment(id, skipUpdate = false) {
        if (!skipUpdate) await this.updateComplete;

        const fragmentElement = document.querySelector(`.mas-fragment[data-id="${id}"]`);
        if (!fragmentElement) return;

        fragmentElement.scrollIntoView({ behavior: 'smooth' });
    }

    get emptyState() {
        return html`<sp-illustrated-message
            heading="No items match your search"
            description="Try adjusting your search or filters to find what you're looking for."
        >
            <sp-icon-cloud></sp-icon-cloud>
        </sp-illustrated-message>`;
    }

    get renderView() {
        if (!this.firstPageLoaded.value) {
            return html`<div id="render">${Array.from({ length: 8 }, cardSkeleton)}</div>`;
        }
        const visibleFragments = this.fragments.value.filter((fragmentStore) => {
            const value = fragmentStore.get();
            if (!value) return false;
            if (fragmentStore.new) return true;
            if (value.model?.path === CARD_MODEL_PATH && !RECOGNIZED_VARIANT_NAMES.has(fragmentStore.value.variant))
                return false;
            return true;
        });
        if (visibleFragments.length === 0) {
            return html`<div id="render">${this.emptyState}</div>`;
        }
        return html`
            <div id="render">
                ${repeat(
                    visibleFragments,
                    (fragmentStore) => fragmentStore.get()?.path || fragmentStore.id || Math.random(),
                    (fragmentStore) => html`<mas-fragment .fragmentStore=${fragmentStore} view="render"></mas-fragment>`,
                )}
            </div>
        `;
    }

    get parentRowSelection() {
        return getParentRowSelection(this.fragments.value, this.selection.value);
    }

    updateTableSelection(event) {
        if (this.#refreshInProgress) return;
        if (event.target !== event.currentTarget) return;

        Store.selection.set(mergeParentTableSelection(event.target.selectedSet, this.fragments.value, this.selection.value));
    }

    /**
     * Re-applies sp-table checkbox cells after rows are added or removed.
     * Spectrum sp-table only injects checkboxes when `selects` toggles.
     */
    async refreshTableSelection() {
        if (!Store.selecting.get()) {
            this.tableSelects = undefined;
            return;
        }
        if (this.loading.value || !this.firstPageLoaded.value || this.#refreshInProgress) return;

        const generation = ++this.#refreshSelectionGeneration;
        this.#refreshInProgress = true;
        try {
            this.tableSelects = undefined;
            await this.updateComplete;
            if (generation !== this.#refreshSelectionGeneration || !Store.selecting.get()) return;
            if (this.loading.value || !this.firstPageLoaded.value) return;

            this.tableSelects = 'multiple';
            await this.updateComplete;
            stripNestedVariationSelectControls(this);
        } finally {
            this.#refreshInProgress = false;
        }
    }

    #maybeRefreshTableSelection(loadingJustCompleted) {
        if (!Store.selecting.get() || this.loading.value || !this.firstPageLoaded.value) return;
        if (!loadingJustCompleted && !this.#fragmentsChangedWhileSelecting && !this.#filtersChangedWhileSelecting) return;
        this.#fragmentsChangedWhileSelecting = false;
        this.#filtersChangedWhileSelecting = false;
        void this.refreshTableSelection();
    }

    /** Non-country mas:pzn tag ids selected in the filter panel (narrow the Personalization group only). */
    #getSelectedPersonalizationTagIds() {
        const raw = Store.filters.get().tags;
        if (!raw || typeof raw !== 'string') return [];
        return raw
            .split(',')
            .map((t) => t.trim())
            .filter((id) => id.startsWith(PZN_TAG_ID_PREFIX) && !isPznCountryTagId(id));
    }

    /** When no PZN tags are checked, all personalization-tagged rows appear; otherwise OR match on selected ids (same tag sources as fragmentHasPersonalizationTag). */
    #fragmentMatchesPznCheckboxFilter(frag, selectedPznIds) {
        const fragPznIds = getFragmentNonCountryPznTagIds(frag);
        if (fragPznIds.size === 0) return false;
        if (!selectedPznIds.length) return true;
        return selectedPznIds.some((id) => fragPznIds.has(id));
    }

    #renderTableBodyGrouped(fragmentStores) {
        const selectedPzn = this.#getSelectedPersonalizationTagIds();
        const personalization = [];
        const other = [];
        for (const fs of fragmentStores) {
            const frag = fs.get?.() ?? fs.value;
            if (this.#fragmentMatchesPznCheckboxFilter(frag, selectedPzn)) {
                personalization.push(fs);
            } else if (!fragmentHasPersonalizationTag(frag)) {
                other.push(fs);
            }
        }
        return html`
            <sp-table-row class="fragment-group-header">
                <sp-table-cell class="fragment-group-header-cell">
                    Personalization fragments (${personalization.length})
                </sp-table-cell>
            </sp-table-row>
            ${repeat(
                personalization,
                (fragmentStore) => fragmentStore.get().path,
                (fragmentStore) => html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`,
            )}
            <sp-table-row class="fragment-group-header">
                <sp-table-cell class="fragment-group-header-cell">All other fragments (${other.length})</sp-table-cell>
            </sp-table-row>
            ${repeat(
                other,
                (fragmentStore) => fragmentStore.get().path,
                (fragmentStore) => html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`,
            )}
        `;
    }

    #tableHead(sortable) {
        return html`<sp-table-head>
            <sp-table-head-cell class="expand-cell"></sp-table-head-cell>
            ${CONTENT_TABLE_COLUMNS.map(
                ({ key, label }) =>
                    html`<sp-table-head-cell ?sortable=${sortable && SORTABLE_COLUMNS.has(key)} class=${key}>
                        ${label} ${this.columnResize.handle(key, label)}
                    </sp-table-head-cell>`,
            )}
        </sp-table-head>`;
    }

    get tableView() {
        if (!this.firstPageLoaded.value) {
            return html`<sp-table
                emphasized
                scroller
                style=${styleMap(this.columnResize.tableStyle())}
                data-resized-columns=${ifDefined(this.columnResize.resizedColumns)}
            >
                ${this.#tableHead(false)}
                <sp-table-body> ${Array.from({ length: 8 }, tableSkeletonRow)} </sp-table-body>
            </sp-table>`;
        }
        const visibleFragments = this.fragments.value.filter((fragmentStore) => fragmentStore.get() !== null);
        const personalizationOn = Store.filters.get().personalizationFilterEnabled === true;
        const body = personalizationOn
            ? this.#renderTableBodyGrouped(visibleFragments)
            : repeat(
                  visibleFragments,
                  (fragmentStore) => fragmentStore.get().path,
                  (fragmentStore) => html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`,
              );

        return html`<sp-table
                emphasized
                scroller
                style=${styleMap(this.columnResize.tableStyle())}
                data-resized-columns=${ifDefined(this.columnResize.resizedColumns)}
                selects=${this.tableSelects}
                selected=${JSON.stringify(this.parentRowSelection)}
                @change=${this.updateTableSelection}
            >
                ${this.#tableHead(true)}
                <sp-table-body> ${body} ${this.tableLoadingSkeletons} </sp-table-body>
            </sp-table>
            ${visibleFragments.length === 0 ? this.emptyState : nothing}`;
    }

    get tableLoadingSkeletons() {
        if (!this.loading.value || !this.firstPageLoaded.value) return nothing;
        return html`${Array.from({ length: 4 }, tableSkeletonRow)}`;
    }

    get pageLoadingSkeletons() {
        if (!this.loading.value || !this.firstPageLoaded.value) return nothing;
        if (this.renderMode.value === 'table') return nothing;
        return html`<div id="render" class="next-page-skeletons">${Array.from({ length: 4 }, cardSkeleton)}</div>`;
    }

    updated() {
        const loadingJustCompleted = this.wasLoading && !this.loading.value;
        this.wasLoading = this.loading.value;

        if (Store.selecting.get() && !this.loading.value && this.firstPageLoaded.value) {
            this.#maybeRefreshTableSelection(loadingJustCompleted);
        }

        const sentinel = this.querySelector('.scroll-sentinel');
        if (sentinel && sentinel !== this.observedSentinel) {
            this.scrollObserver?.disconnect();
            this.scrollObserver?.observe(sentinel);
            this.observedSentinel = sentinel;
        } else if (!sentinel) {
            this.scrollObserver?.disconnect();
            this.observedSentinel = null;
        } else if (loadingJustCompleted && this.hasMore.value) {
            this.scrollObserver?.unobserve(sentinel);
            requestAnimationFrame(() => this.scrollObserver?.observe(sentinel));
        }
    }

    get hasResolvedCurrentSearch() {
        const dataStore = Store.fragments.list.data;
        return (
            dataStore.getMeta('path') === this.search.value.path &&
            dataStore.getMeta('query') === this.search.value.query &&
            dataStore.getMeta('locale') === this.filters.value.locale
        );
    }

    get hasEmptySearchResult() {
        return (
            !this.loading.value &&
            Boolean(this.search.value.query) &&
            this.fragments.value.length === 0 &&
            this.hasResolvedCurrentSearch
        );
    }

    get emptyStateTitle() {
        return isUUID(this.search.value.query) ? 'No fragment found' : 'No fragments found';
    }

    get emptyStateDescription() {
        const locale = this.filters.value.locale;
        const query = this.search.value.query;
        if (isUUID(query)) {
            return `No fragment with ID "${query}" exists in the ${locale} locale.`;
        }
        return `No fragments match "${query}" in the ${locale} locale.`;
    }

    get emptyState() {
        if (!this.hasEmptySearchResult) return nothing;
        return html`<div class="content-empty-state" role="status" aria-live="polite">
            <sp-icon-info class="content-empty-state-icon"></sp-icon-info>
            <p class="content-empty-state-title">${this.emptyStateTitle}</p>
            <p class="content-empty-state-description">${this.emptyStateDescription}</p>
        </div>`;
    }

    render() {
        let view = nothing;
        switch (this.renderMode.value) {
            case 'render':
                view = this.renderView;
                break;
            case 'table':
                view = this.tableView;
                break;
            default:
                view = this.renderView;
        }
        const resizeStyles =
            this.renderMode.value === 'table'
                ? html`<style>
                      ${CONTENT_TABLE_RESIZE_CSS}
                  </style>`
                : nothing;
        return html`${resizeStyles}
            <div id="content">${this.hasEmptySearchResult ? this.emptyState : view}</div>
            ${this.hasMore.value ? html`<div class="scroll-sentinel"></div>` : nothing} ${this.pageLoadingSkeletons}`;
    }
}

customElements.define('mas-content', MasContent);
