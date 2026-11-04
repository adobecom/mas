import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import styles from './mas-baselines.css.js';
import { BASELINE_CREATE_TYPE } from '../constants.js';
import Store from '../store.js';
import router from '../router.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { extractLocaleFromPath, showToast } from '../utils.js';
import { filterBySearchQuery, handleSearchInput } from '../common/utils/selectable-list.js';
import { renderEditorLink, renderRowLinkOverlay } from '../common/utils/editor-link.js';
import { renderFragmentStatusCell } from '../common/utils/render-utils.js';
import { renderSkeletonRows, untrackPendingProject } from '../common/utils/project-list-utils.js';
import { closePreview, openPreview } from '../mas-card-preview.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { getBaselineInfo } from './baseline-model.js';
import '../mas-create-dialog.js';

const COLUMNS = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'productCode', label: 'Product code' },
    { key: 'productArrangementCode', label: 'Product arrangement code' },
    { key: 'marketSegment', label: 'Market segment' },
    { key: 'template', label: 'Template' },
    { key: 'status', label: 'Status' },
    { key: 'lastModifiedBy', label: 'Last modified by' },
    { key: 'actions', label: 'Actions' },
    { key: 'preview', label: 'Preview' },
];

const SEARCHABLE_KEYS = ['productCode', 'productArrangementCode', 'marketSegment', 'template', 'title'];

const PREVIEW_POSITION = { left: '50%', transform: 'translate(-50%, -50%)' };

class MasBaselines extends LitElement {
    static styles = styles;

    static properties = {
        createDialogOpen: { state: true },
        searchQuery: { state: true },
        sortDirection: { state: true },
    };

    constructor() {
        super();
        this.createDialogOpen = false;
        this.searchQuery = '';
        this.sortDirection = 'asc';
        this.rows = [];
        this.reactiveController = new ReactiveController(this, [Store.baselines.list.data, Store.baselines.list.loading]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        closePreview();
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    willUpdate() {
        const rows = Store.baselines.list.data.get().map((store) => {
            const fragment = store.get();
            return {
                store,
                fragment,
                ...getBaselineInfo(fragment),
                title: fragment.title ?? '',
                status: fragment.status ?? '',
                lastModifiedBy: fragment.modified?.fullName ?? '',
            };
        });
        const filtered = filterBySearchQuery(rows, this.searchQuery.trim(), (row) =>
            SEARCHABLE_KEYS.map((key) => row[key]).join(' '),
        );
        this.rows = filtered.sort(this.#compareTitles);
    }

    #compareTitles = (a, b) => {
        const order = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        return this.sortDirection === 'desc' ? -order : order;
    };

    #handleSort({ detail: { sortDirection } }) {
        this.sortDirection = sortDirection;
    }

    #editBaseline(fragment) {
        router.navigateToFragmentEditor(fragment.id, { locale: extractLocaleFromPath(fragment.path) });
    }

    async #deleteBaseline({ store, fragment, productArrangementCode, marketSegment }) {
        const confirmed = await confirmation({
            title: 'Delete baseline',
            content: `Are you sure you want to delete the ${productArrangementCode} (${marketSegment}) baseline? This action cannot be undone.`,
            variant: 'confirmation',
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;
        const deleted = await this.repository.deleteFragment(fragment, { startToast: false, endToast: false });
        if (!deleted) return;
        untrackPendingProject(Store.baselines.list.data, store.id);
        Store.baselines.list.data.set((list) => list.filter((item) => item !== store));
        showToast('Baseline successfully deleted.', 'positive');
    }

    get #tableHead() {
        return html`<sp-table-head @sorted=${this.#handleSort}>
            ${COLUMNS.map(
                ({ key, label, sortable }) =>
                    html`<sp-table-head-cell
                        class=${key}
                        ?sortable=${sortable}
                        sort-key=${key}
                        sort-direction=${sortable ? this.sortDirection : nothing}
                        >${label}</sp-table-head-cell
                    >`,
            )}
        </sp-table-head>`;
    }

    #renderRow(row) {
        const { fragment, title, productCode, productArrangementCode, marketSegment, template, status, lastModifiedBy } = row;
        return html`<sp-table-row value=${fragment.path} data-id=${fragment.id} @dblclick=${() => this.#editBaseline(fragment)}>
            ${renderRowLinkOverlay(fragment)}
            <sp-table-cell class="title">
                <overlay-trigger triggered-by="hover">
                    <div slot="trigger" class="title-clamp">${renderEditorLink(fragment, title || '—')}</div>
                    <sp-tooltip slot="hover-content" placement="bottom">${title || '—'}</sp-tooltip>
                </overlay-trigger>
            </sp-table-cell>
            <sp-table-cell class="productCode">${productCode}</sp-table-cell>
            <sp-table-cell class="productArrangementCode">${productArrangementCode}</sp-table-cell>
            <sp-table-cell class="marketSegment">${marketSegment}</sp-table-cell>
            <sp-table-cell class="template">${template}</sp-table-cell>
            ${renderFragmentStatusCell(status) || html`<sp-table-cell class="status"></sp-table-cell>`}
            <sp-table-cell class="lastModifiedBy">${lastModifiedBy}</sp-table-cell>
            <sp-table-cell class="actions action-cell">
                <sp-action-menu size="m" label="Actions">
                    <sp-menu-item @click=${() => this.#editBaseline(fragment)}>
                        <sp-icon-edit slot="icon"></sp-icon-edit>
                        Edit
                    </sp-menu-item>
                    <sp-menu-item @click=${() => this.#deleteBaseline(row)}>
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                        Delete
                    </sp-menu-item>
                </sp-action-menu>
            </sp-table-cell>
            <sp-table-cell
                class="preview"
                @mouseover=${() => openPreview(fragment.id, PREVIEW_POSITION)}
                @mouseout=${closePreview}
            >
                <sp-icon-preview label="Preview baseline"></sp-icon-preview>
            </sp-table-cell>
        </sp-table-row>`;
    }

    get #tableBody() {
        if (Store.baselines.list.loading.get() && !this.rows.length) return renderSkeletonRows(COLUMNS.length);
        return repeat(
            this.rows,
            ({ store }) => store.id,
            (row) => this.#renderRow(row),
        );
    }

    get #content() {
        if (!Store.baselines.list.loading.get() && !this.rows.length) {
            return html`<div class="baselines-empty-state">No baselines found.</div>`;
        }
        return html`<sp-table emphasized class="item-table">
            ${this.#tableHead}
            <sp-table-body>${this.#tableBody}</sp-table-body>
        </sp-table>`;
    }

    render() {
        return html`<div class="page-container list-page">
            <div class="baselines-header">
                <h1>Baselines</h1>
                <sp-button variant="accent" @click=${() => (this.createDialogOpen = true)}>
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Create Baseline
                </sp-button>
            </div>
            <sp-divider size="s"></sp-divider>
            <div class="baselines-toolbar">
                <sp-search
                    size="m"
                    placeholder="Search"
                    .value=${this.searchQuery}
                    @input=${(event) => (this.searchQuery = handleSearchInput(event))}
                    @submit=${(event) => event.preventDefault()}
                ></sp-search>
                <div>${this.rows.length} result(s)</div>
            </div>
            ${this.#content}
            ${this.createDialogOpen
                ? html`<mas-create-dialog
                      type=${BASELINE_CREATE_TYPE}
                      @close=${() => (this.createDialogOpen = false)}
                  ></mas-create-dialog>`
                : nothing}
        </div>`;
    }
}

customElements.define('mas-baselines', MasBaselines);
