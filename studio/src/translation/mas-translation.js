import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-translation.css.js';
import router from '../router.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { PAGE_NAMES } from '../constants.js';
import { showToast } from '../utils.js';

const translationSkeletonRow = () =>
    html`<sp-table-row class="skeleton-row">
        <sp-table-cell class="title"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="lastUpdatedBy"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="sentOn"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="status"><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
        <sp-table-cell class="actions"></sp-table-cell>
    </sp-table-row>`;

const STATUS_MAP = {
    QUEUED: { label: 'Pending', variant: 'neutral' },
    RUNNING: { label: 'In progress', variant: 'notice' },
    ASYNC_PROCESSING: { label: 'Sent for translation', variant: 'info' },
    FAILED: { label: 'Failed', variant: 'negative' },
    COMPLETED: { label: 'Completed', variant: 'positive' },
};

class MasTranslation extends LitElement {
    static styles = styles;

    static properties = {
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        columns: { type: Set, state: true },
        searchQuery: { type: String, state: true },
        sortDirection: { type: String, state: true },
    };

    constructor() {
        super();
        this.reactiveController = new ReactiveController(this, [
            Store.translationProjects?.list?.data,
            Store.translationProjects?.list?.loading,
        ]);
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.searchQuery = '';
        this.sortDirection = 'desc';
        this.columns = new Set([
            { key: 'title', label: 'Project' },
            { key: 'lastUpdatedBy', label: 'Last modified by' },
            { key: 'sentOn', label: 'Sent on', sortable: true },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: 'Actions' },
        ]);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get translationProjectsData() {
        return Store.translationProjects?.list?.data?.get() || [];
    }

    get filteredTranslationProjectsData() {
        const data = this.translationProjectsData;
        const query = this.searchQuery?.trim().toLowerCase();
        if (!query) return data;
        return data.filter((p) => (p.get().title || '').toLowerCase().includes(query));
    }

    get confirmDialog() {
        if (!this.confirmDialogConfig) return nothing;
        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;
        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="promotion-delete-confirm-dialog"
                    .headline=${title}
                    .variant=${variant || 'negative'}
                    .confirmLabel=${confirmText}
                    .cancelLabel=${cancelText}
                    @confirm=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onConfirm && onConfirm();
                    }}
                    @cancel=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onCancel && onCancel();
                    }}
                >
                    <div>${message}</div>
                </sp-dialog-wrapper>
            </div>
        `;
    }

    get translationProjectsTableHead() {
        const sortDownSvg = html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            role="img"
            fill="currentColor"
            aria-label="Sort descending"
        >
            <path
                d="m18.28027,13.21973c-.29297-.29297-.76758-.29297-1.06055,0l-1.21973,1.21973V3.75c0-.41406-.33594-.75-.75-.75s-.75.33594-.75.75v10.68945l-1.21973-1.21973c-.29297-.29297-.76758-.29297-1.06055,0s-.29297.76758,0,1.06055l2.5,2.5c.06909.06909.15186.12354.24341.16162s.18896.05811.28687.05811.19531-.02002.28687-.05811.17432-.09253.24341-.16162l2.5-2.5c.29297-.29297.29297-.76758,0-1.06055Z"
            />
            <path d="m7.25,14.5H2.75c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h4.5c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z" />
            <path d="m9.25,10.5H2.75c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h6.5c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z" />
            <path d="m11.25,6.5H2.75c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h8.5c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z" />
        </svg>`;
        const sortUpSvg = html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            role="img"
            fill="currentColor"
            aria-label="Sort ascending"
            style="transform: scaleY(-1)"
        >
            <path
                d="m18.28027,13.21973c-.29297-.29297-.76758-.29297-1.06055,0l-1.21973,1.21973V3.75c0-.41406-.33594-.75-.75-.75s-.75.33594-.75.75v10.68945l-1.21973-1.21973c-.29297-.29297-.76758-.29297-1.06055,0s-.29297.76758,0,1.06055l2.5,2.5c.06909.06909.15186.12354.24341.16162s.18896.05811.28687.05811.19531-.02002.28687-.05811.17432-.09253.24341-.16162l2.5-2.5c.29297-.29297.29297-.76758,0-1.06055Z"
            />
            <path d="m7.25,14.5H2.75c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h4.5c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z" />
            <path d="m9.25,10.5H2.75c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h6.5c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z" />
            <path d="m11.25,6.5H2.75c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h8.5c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z" />
        </svg>`;
        return html`<sp-table-head>
            ${[...this.columns].map(
                ({ key, label, align, sortable }) => html`
                    <sp-table-head-cell
                        class="${key}${align === 'right' ? ' align-right' : ''}${sortable ? ' sortable' : ''}"
                        @click=${sortable ? () => this.#toggleSort(key) : null}
                        @sorted=${sortable ? this.#sortBySentOn : null}
                    >
                        ${sortable
                            ? html`<span class="sort-icon">${this.sortDirection === 'asc' ? sortUpSvg : sortDownSvg}</span>`
                            : nothing}
                        ${label}
                    </sp-table-head-cell>
                `,
            )}
        </sp-table-head>`;
    }

    get translationsProjectsContent() {
        const isLoading = Store.translationProjects?.list?.loading?.get();
        const data = this.filteredTranslationProjectsData;
        if (isLoading && !this.translationProjectsData.length) {
            return html` <sp-table emphasized .scroller=${true} class="item-table">
                ${this.translationProjectsTableHead}
                <sp-table-body> ${Array.from({ length: 5 }, translationSkeletonRow)} </sp-table-body>
            </sp-table>`;
        }
        if (data.length) {
            return html` <sp-table emphasized .scroller=${true} class="item-table">
                ${this.translationProjectsTableHead}
                <sp-table-body>
                    ${repeat(
                        data,
                        (translationProject) => translationProject.get().id,
                        (translationProject) => html`
                            <sp-table-row
                                @dblclick=${() => this.#goToEditorExistingProject(translationProject)}
                                value=${translationProject.get().path}
                                data-id=${translationProject.get().id}
                            >
                                <sp-table-cell>${translationProject.get().title}</sp-table-cell>
                                <sp-table-cell>${translationProject.get().modified.fullName}</sp-table-cell>
                                <sp-table-cell>${this.#formatSubmissionDate(translationProject)}</sp-table-cell>
                                <sp-table-cell>${this.#renderProjectStatus(translationProject)}</sp-table-cell>
                                <sp-table-cell class="action-cell">
                                    <sp-action-menu size="m" placement="bottom-end" quiet>
                                        ${html`
                                            <sp-menu-item @click=${() => this.#goToEditorExistingProject(translationProject)}>
                                                <sp-icon-edit slot="icon"></sp-icon-edit>
                                                Edit
                                            </sp-menu-item>
                                            <sp-menu-item disabled>
                                                <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                                                Duplicate
                                            </sp-menu-item>
                                            <sp-menu-item disabled>
                                                <sp-icon-cancel slot="icon"></sp-icon-cancel>
                                                Cancel
                                            </sp-menu-item>
                                            <sp-menu-item disabled>
                                                <sp-icon-archive slot="icon"></sp-icon-archive>
                                                Archive
                                            </sp-menu-item>
                                            <sp-menu-item @click=${() => this.#deleteTranslationProject(translationProject)}>
                                                <sp-icon-delete slot="icon"></sp-icon-delete>
                                                Delete
                                            </sp-menu-item>
                                        `}
                                    </sp-action-menu>
                                </sp-table-cell>
                            </sp-table-row>
                        `,
                    )}
                </sp-table-body>
            </sp-table>`;
        } else {
            const emptyMessage = this.searchQuery?.trim()
                ? 'No translation projects match your search.'
                : 'No translation projects found.';
            return html`<div class="translation-empty-state">${emptyMessage}</div>`;
        }
    }

    async connectedCallback() {
        super.connectedCallback();

        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.TRANSLATIONS) {
            router.navigateToPage(PAGE_NAMES.TRANSLATIONS)();
        }

        const masRepository = this.repository;
        if (!masRepository) {
            this.error = 'Repository component not found';
            return;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    async #showDialog(title, message, options = {}) {
        if (this.isDialogOpen) return false;

        this.isDialogOpen = true;
        const { confirmText = 'OK', cancelText = 'Cancel', variant = 'primary' } = options;

        return new Promise((resolve) => {
            this.confirmDialogConfig = {
                title,
                message,
                confirmText,
                cancelText,
                variant,
                onConfirm: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                },
            };
        });
    }

    #goToEditorNewProject() {
        Store.translationProjects.inEdit.set(null);
        Store.translationProjects.translationProjectId.set('');
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
        Store.translationProjects.targetLocales.set([]);
        Store.translationProjects.showSelected.set(false);
        router.navigateToPage(PAGE_NAMES.TRANSLATION_EDITOR)();
    }

    #goToEditorExistingProject(translationProject) {
        Store.translationProjects.inEdit.set(translationProject);
        Store.translationProjects.translationProjectId.set(translationProject.get().id);
        router.navigateToPage(PAGE_NAMES.TRANSLATION_EDITOR)();
    }

    async #deleteTranslationProject(translationProject) {
        if (this.isDialogOpen) return;
        const confirmed = await this.#showDialog(
            'Delete Translation Project',
            `Are you sure you want to delete the translation project "${translationProject.get().title}"? This action cannot be undone.`,
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'confirmation',
            },
        );
        if (!confirmed) return;
        try {
            Store.translationProjects.list.loading.set(true);
            showToast('Deleting translation project...');
            await this.repository.deleteFragment(translationProject, { startToast: false, endToast: false });
            const updatedTranslationProjects = this.translationProjectsData.filter(
                (project) => project.get().id !== translationProject.get().id,
            );
            Store.translationProjects.list.data.set(updatedTranslationProjects);
            showToast('Translation project successfully deleted.', 'positive');
        } catch (error) {
            console.error('Error deleting translation project:', error);
            showToast('Failed to delete translation project.', 'negative');
        } finally {
            Store.translationProjects.list.loading.set(false);
        }
    }

    #formatSubmissionDate(translationProject) {
        const date = translationProject.get().getFieldValue('submissionDate');
        if (!date) return '–';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
        });
    }

    #renderProjectStatus(translationProject) {
        const status = translationProject.get().getFieldValue('status');
        const mapped = STATUS_MAP[status];
        if (!mapped) return html`<span class="empty-cell">–</span>`;
        return html`<sp-status-light size="s" variant=${mapped.variant}>${mapped.label}</sp-status-light>`;
    }

    #toggleSort(key) {
        if (key !== 'sentOn') return;
        const next = this.sortDirection === 'desc' ? 'asc' : 'desc';
        this.sortDirection = next;
        this.#sortBySentOn({ detail: { sortKey: key, sortDirection: next } });
    }

    #sortBySentOn({ detail: { sortKey, sortDirection } }) {
        const translationProjects = [...this.translationProjectsData].sort((a, b) => {
            const dateA = a.get().getFieldValue('submissionDate');
            const dateB = b.get().getFieldValue('submissionDate');
            if (!dateA && !dateB) return 0;
            if (!dateA) return sortDirection === 'desc' ? 1 : -1;
            if (!dateB) return sortDirection === 'desc' ? -1 : 1;
            const timestampA = new Date(dateA).getTime();
            const timestampB = new Date(dateB).getTime();
            if (sortDirection === 'desc') return timestampB - timestampA;
            return timestampA - timestampB;
        });
        Store.translationProjects.list.data.set(translationProjects);
    }

    render() {
        return html`
            <div class="translation-container">
                <div class="translation-header">
                    <h2>Translation</h2>
                    <sp-button variant="accent" class="create-button" @click=${() => this.#goToEditorNewProject()}>
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create project
                    </sp-button>
                </div>
                <sp-divider size="m" class="translation-header-divider"></sp-divider>
                <div class="translation-toolbar">
                    <sp-search
                        size="m"
                        placeholder="Search"
                        .value=${this.searchQuery}
                        @input=${(e) => (this.searchQuery = e.target.value)}
                        @change=${(e) => (this.searchQuery = e.target.value)}
                    ></sp-search>
                    <div class="result-count">
                        <span class="result-count-number">${this.filteredTranslationProjectsData.length}</span>
                        <span class="result-count-label">result(s)</span>
                    </div>
                </div>
                ${this.confirmDialog}
                <div class="translation-content">${this.translationsProjectsContent}</div>
            </div>
        `;
    }
}

customElements.define('mas-translation', MasTranslation);
