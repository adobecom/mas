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

class MasContent extends LitElement {
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.goToFragment = this.goToFragment.bind(this);
        this.subscriptions = [];
    }

    loading = new StoreController(this, Store.fragments.list.loading);
    firstPageLoaded = new StoreController(this, Store.fragments.list.firstPageLoaded);
    fragments = new StoreController(this, Store.fragments.list.data);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);
    selection = new StoreController(this, Store.selection);
    search = new StoreController(this, Store.search);
    filters = new StoreController(this, Store.filters);

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
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Events.fragmentAdded.unsubscribe(this.goToFragment);
        Events.fragmentDeleted.unsubscribe(this.onFragmentDeleted);

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

    get renderView() {
        return html`
            <div id="render">
                ${repeat(
                    this.fragments.value.filter((fragmentStore) => {
                        const value = fragmentStore.get();
                        if (!value) return false;
                        if (fragmentStore.new) return true;
                        if (value.model?.path === CARD_MODEL_PATH && !variantValues.includes(fragmentStore.value.variant))
                            return false;
                        return true;
                    }),
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

    get tableView() {
        const fragmentStores = this.fragments.value.filter((fragmentStore) => fragmentStore.get() !== null);
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
                <sp-table-head-cell sortable class="name">Path</sp-table-head-cell>
                <sp-table-head-cell sortable class="title">Fragment Title</sp-table-head-cell>
                <sp-table-head-cell sortable class="offer-id">Offer ID</sp-table-head-cell>
                <sp-table-head-cell sortable class="offer-type">Offer Type</sp-table-head-cell>
                <sp-table-head-cell sortable class="last-modified-by">Last Modified By</sp-table-head-cell>
                <sp-table-head-cell sortable class="price">Price</sp-table-head-cell>
                <sp-table-head-cell sortable class="status">Status</sp-table-head-cell>
                <sp-table-head-cell class="actions">Actions</sp-table-head-cell>
                <sp-table-head-cell class="preview">Preview</sp-table-head-cell>
            </sp-table-head>
            <sp-table-body> ${body} </sp-table-body>
        </sp-table>`;
    }

    /** main spinner to show while loading the first page */
    get firstPageLoadingSpinner() {
        if (!this.loading.value || this.firstPageLoaded.value) return nothing;
        return html`<sp-progress-circle class="fragments" indeterminate size="l"></sp-progress-circle>`;
    }

    /** spinner to show at the bottom of the page if next page is being loaded */
    get pageLoadingSpinner() {
        if (!this.loading.value || !this.firstPageLoaded.value) return nothing;
        return html`<sp-progress-circle class="next-page" indeterminate size="l"></sp-progress-circle>`;
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
        return html`<div id="content">
                ${this.hasEmptySearchResult ? this.emptyState : view} ${this.firstPageLoadingSpinner}
            </div>
            ${this.pageLoadingSpinner}`;
    }
}

customElements.define('mas-content', MasContent);
