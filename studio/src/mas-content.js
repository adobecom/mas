import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactivity/store-controller.js';
import { VARIANTS } from './editors/variant-picker.js';
import Store from './store.js';
import { isUUID } from './utils.js';
import './mas-fragment.js';
import Events from './events.js';
import { CARD_MODEL_PATH } from './constants.js';
import { fragmentHasPersonalizationTag, isPznCountryTagId, PZN_TAG_ID_PREFIX } from './common/utils/personalization-utils.js';

const variantValues = VARIANTS.map((v) => v.value);

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
        <sp-table-cell class="offer-id"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="offer-type"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="last-modified-by"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="price"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="status"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="actions"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="preview"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
    </sp-table-row>`;
class MasContent extends LitElement {
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

    loading = new StoreController(this, Store.fragments.list.loading);
    firstPageLoaded = new StoreController(this, Store.fragments.list.firstPageLoaded);
    fragments = new StoreController(this, Store.fragments.list.data);
    hasMore = new StoreController(this, Store.fragments.list.hasMore);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);
    selection = new StoreController(this, Store.selection);
    search = new StoreController(this, Store.search);
    filters = new StoreController(this, Store.filters);
    sort = new StoreController(this, Store.sort);

    connectedCallback() {
        super.connectedCallback();
        Events.fragmentAdded.subscribe(this.goToFragment);
        Events.fragmentDeleted.subscribe(this.onFragmentDeleted);

        this.subscriptions.push(
            Store.fragments.list.data.subscribe(() => {
                this.requestUpdate();
            }),
        );

        this.subscriptions.push(
            Store.filters.subscribe(() => {
                this.requestUpdate();
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
            if (value.model?.path === CARD_MODEL_PATH && !variantValues.includes(fragmentStore.value.variant)) return false;
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

    updateTableSelection(event) {
        Store.selection.set(Array.from(event.target.selectedSet));
    }

    /** @param {import('./reactivity/fragment-store.js').FragmentStore[]} fragmentStores */
    /** Non-country mas:pzn tag ids selected in the filter panel (narrow the Personalization group only). */
    #getSelectedPersonalizationTagIds() {
        const raw = Store.filters.get().tags;
        if (!raw || typeof raw !== 'string') return [];
        return raw
            .split(',')
            .map((t) => t.trim())
            .filter((id) => id.startsWith(PZN_TAG_ID_PREFIX) && !isPznCountryTagId(id));
    }

    /** When no PZN tags are checked, all personalization-tagged rows appear; otherwise OR match on selected ids. */
    #fragmentMatchesPznCheckboxFilter(frag, selectedPznIds) {
        if (!fragmentHasPersonalizationTag(frag)) return false;
        if (!selectedPznIds.length) return true;
        const fragTagIds = new Set((frag.tags || []).map((t) => t.id).filter(Boolean));
        return selectedPznIds.some((id) => fragTagIds.has(id));
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

    #handleSort({ detail: { sortKey, sortDirection } }) {
        Store.sort.set({ sortBy: sortKey, sortDirection });
    }

    get #sortedFragmentStores() {
        const { sortBy, sortDirection } = this.sort.value ?? {};
        const stores = this.fragments.value.filter((fs) => fs.get() !== null);
        if (!sortBy) return stores;
        return [...stores].sort((aStore, bStore) => {
            const a = aStore.get();
            const b = bStore.get();
            if (sortBy === 'modifiedAt') {
                const aVal = new Date(a.modified?.at || 0).getTime();
                const bVal = new Date(b.modified?.at || 0).getTime();
                const diff = aVal - bVal;
                return sortDirection === 'desc' ? -diff : diff;
            }
            const aVal = (a[sortBy] ?? '').toString();
            const bVal = (b[sortBy] ?? '').toString();
            const cmp = aVal.localeCompare(bVal);
            return sortDirection === 'desc' ? -cmp : cmp;
        });
    }

    get tableView() {
        if (!this.firstPageLoaded.value) {
            return html`<sp-table emphasized scroller>
                <sp-table-head>
                    <sp-table-head-cell class="expand-cell"></sp-table-head-cell>
                    <sp-table-head-cell class="name">Path</sp-table-head-cell>
                    <sp-table-head-cell class="title">Fragment Title</sp-table-head-cell>
                    <sp-table-head-cell class="offer-id">Offer ID</sp-table-head-cell>
                    <sp-table-head-cell class="offer-type">Offer Type</sp-table-head-cell>
                    <sp-table-head-cell class="last-modified-by">Last Modified By</sp-table-head-cell>
                    <sp-table-head-cell class="last-modified">Last Modified</sp-table-head-cell>
                    <sp-table-head-cell class="price">Price</sp-table-head-cell>
                    <sp-table-head-cell class="status">Status</sp-table-head-cell>
                    <sp-table-head-cell class="actions">Actions</sp-table-head-cell>
                    <sp-table-head-cell class="preview">Preview</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body> ${Array.from({ length: 8 }, tableSkeletonRow)} </sp-table-body>
            </sp-table>`;
        }
        const fragmentStores = this.#sortedFragmentStores;
        const personalizationOn = Store.filters.get().personalizationFilterEnabled === true;
        const body = personalizationOn
            ? this.#renderTableBodyGrouped(fragmentStores)
            : repeat(
                  fragmentStores,
                  (fragmentStore) => fragmentStore.get().path,
                  (fragmentStore) => html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`,
              );

        return html`<sp-table
                emphasized
                scroller
                selects=${this.selecting.value ? 'multiple' : undefined}
                selected=${JSON.stringify(this.selection.value)}
                @change=${this.updateTableSelection}
            >
                <sp-table-head>
                    <sp-table-head-cell class="expand-cell"></sp-table-head-cell>
                    <sp-table-head-cell class="name">Path</sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        sort-key="title"
                        sort-direction=${this.sort.value?.sortBy === 'title' ? this.sort.value.sortDirection : undefined}
                        class="title"
                        @sorted=${this.#handleSort}
                        >Fragment Title</sp-table-head-cell
                    >
                    <sp-table-head-cell class="offer-id">Offer ID</sp-table-head-cell>
                    <sp-table-head-cell class="offer-type">Offer Type</sp-table-head-cell>
                    <sp-table-head-cell class="last-modified-by">Last Modified By</sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        sort-key="modifiedAt"
                        sort-direction=${this.sort.value?.sortBy === 'modifiedAt' ? this.sort.value.sortDirection : undefined}
                        class="last-modified"
                        @sorted=${this.#handleSort}
                        >Last Modified</sp-table-head-cell
                    >
                    <sp-table-head-cell class="price">Price</sp-table-head-cell>
                    <sp-table-head-cell class="status">Status</sp-table-head-cell>
                    <sp-table-head-cell class="actions">Actions</sp-table-head-cell>
                    <sp-table-head-cell class="preview">Preview</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body> ${body} ${this.tableLoadingSkeletons} </sp-table-body>
            </sp-table>
            ${fragmentStores.length === 0 ? this.emptyState : nothing}`;
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
            this.scrollObserver?.observe(sentinel);
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
        return html`<div id="content">${this.hasEmptySearchResult ? this.emptyState : view}</div>
            ${this.hasMore.value ? html`<div class="scroll-sentinel"></div>` : nothing} ${this.pageLoadingSkeletons}`;
    }
}

customElements.define('mas-content', MasContent);
