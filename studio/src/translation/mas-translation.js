import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-translation.css.js';
import router from '../router.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { PAGE_NAMES, TRANSLATIONS_ALLOWED_SURFACES } from '../constants.js';
import { showToast } from '../utils.js';

class MasTranslation extends LitElement {
    static styles = styles;

    static properties = {
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        columns: { type: Set, state: true },
    };

    #searchCallback = null;

    constructor() {
        super();
        this.reactiveController = new ReactiveController(this, [
            Store.translationProjects?.list?.data,
            Store.translationProjects?.list?.loading,
        ]);
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.columns = new Set([
            { key: 'title', label: 'Translation Project' },
            {
                key: 'lastUpdatedBy',
                label: 'Last updated by',
            },
            { key: 'sentOn', label: 'Sent on' },
            { key: 'actions', label: 'Actions', align: 'right' },
        ]);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get translationProjectsData() {
        return Store.translationProjects?.list?.data?.get() || [];
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

    get translationsProjectsContent() {
        if (Store.translationProjects?.list?.loading?.get()) {
            return html`<div class="loading-container"><sp-progress-circle indeterminate size="l"></sp-progress-circle></div>`;
        }
        if (this.translationProjectsData.length) {
            return html` <sp-table emphasized .scroller=${true} class="translation-table">
                <sp-table-head>
                    ${[...this.columns].map(
                        ({ key, label, align }) => html`
                            <sp-table-head-cell
                                class=${key}
                                style="${align === 'right' ? 'text-align: right;' : ''}"
                                .sortable=${key === 'sentOn'}
                                sort-direction="asc"
                                sort-key="sentOn"
                                @sorted=${this.#sortBySentOn}
                            >
                                ${label}
                            </sp-table-head-cell>
                        `,
                    )}
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        this.translationProjectsData,
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
                                <sp-table-cell class="action-cell">
                                    <sp-action-menu size="m">
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
                                                <sp-icon-archive slot="icon"></sp-icon-archive>
                                                Archive
                                            </sp-menu-item>
                                            <sp-menu-item @click=${() => this.#deleteTranslationProject(translationProject)}>
                                                <sp-icon-delete slot="icon"></sp-icon-delete>
                                                Delete
                                            </sp-menu-item>
                                            <sp-menu-item disabled>
                                                <sp-icon-cancel slot="icon"></sp-icon-cancel>
                                                Cancel
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
            return html`<div class="translation-empty-state">No translation projects found.</div>`;
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

        this.#searchCallback = (search) => {
            const path = search?.path;
            if (path && !TRANSLATIONS_ALLOWED_SURFACES.includes(path)) {
                router.navigateToPage(PAGE_NAMES.CONTENT)();
            }
        };
        Store.search.subscribe(this.#searchCallback);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#searchCallback) {
            Store.search.unsubscribe(this.#searchCallback);
            this.#searchCallback = null;
        }
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
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
                    <h2>Translations</h2>
                    <sp-button variant="accent" class="create-button" @click=${() => this.#goToEditorNewProject()}>
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create project
                    </sp-button>
                </div>
                <div class="translation-toolbar">
                    <sp-search size="m" placeholder="Search" disabled></sp-search>
                    <div>${this.translationProjectsData.length} result(s)</div>
                </div>
                ${this.confirmDialog}
                <div class="translation-content">${this.translationsProjectsContent}</div>
            </div>
        `;
    }
}

customElements.define('mas-translation', MasTranslation);
