import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactivity/store-controller.js';
import { VARIANTS } from './editors/variant-picker.js';
import Store from './store.js';
import './mas-fragment.js';
import Events from './events.js';
import { CARD_MODEL_PATH } from './constants.js';

const variantValues = VARIANTS.map((v) => v.value);

export const cardSkeleton = () =>
    html`<div class="render-fragment-placeholder">
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
    }

    loading = new StoreController(this, Store.fragments.list.loading);
    firstPageLoaded = new StoreController(this, Store.fragments.list.firstPageLoaded);
    fragments = new StoreController(this, Store.fragments.list.data);
    hasMore = new StoreController(this, Store.fragments.list.hasMore);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);
    selection = new StoreController(this, Store.selection);

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
            { rootMargin: '200px' },
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Events.fragmentAdded.unsubscribe(this.goToFragment);
        Events.fragmentDeleted.unsubscribe(this.onFragmentDeleted);
        this.scrollObserver?.disconnect();

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
        if (!this.firstPageLoaded.value) {
            return html`<div id="render">${Array.from({ length: 8 }, cardSkeleton)}</div>`;
        }
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
                    <sp-table-head-cell class="price">Price</sp-table-head-cell>
                    <sp-table-head-cell class="status">Status</sp-table-head-cell>
                    <sp-table-head-cell class="actions">Actions</sp-table-head-cell>
                    <sp-table-head-cell class="preview">Preview</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body> ${Array.from({ length: 8 }, tableSkeletonRow)} </sp-table-body>
            </sp-table>`;
        }
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
            <sp-table-body>
                ${repeat(
                    this.fragments.value.filter((fragmentStore) => fragmentStore.get() !== null),
                    (fragmentStore) => fragmentStore.get().path,
                    (fragmentStore) => html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`,
                )}
                ${this.tableLoadingSkeletons}
            </sp-table-body>
        </sp-table>`;
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
        const sentinel = this.querySelector('.scroll-sentinel');
        if (sentinel && sentinel !== this.observedSentinel) {
            this.scrollObserver?.disconnect();
            this.scrollObserver?.observe(sentinel);
            this.observedSentinel = sentinel;
        } else if (!sentinel) {
            this.scrollObserver?.disconnect();
            this.observedSentinel = null;
        }
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
        return html`<div id="content">${view}</div>
            ${this.hasMore.value ? html`<div class="scroll-sentinel"></div>` : nothing} ${this.pageLoadingSkeletons}`;
    }
}

customElements.define('mas-content', MasContent);
