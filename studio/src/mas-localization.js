import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-localization.css.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { MasRepository } from './mas-repository.js';
import { PAGE_NAMES } from './constants.js';
import { showToast } from './utils.js';

class MasLocalization extends LitElement {
    static styles = styles;

    static properties = {
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
    };

    constructor() {
        super();
        this.reactiveController = new ReactiveController(this, [
            Store.translationProjects?.list?.data,
            Store.translationProjects?.list?.loading,
        ]);
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
    }

    get translationProjectsData() {
        return Store.translationProjects?.list?.data?.get() || [];
    }

    get translationProjectsLoading() {
        return Store.translationProjects?.list?.loading?.get() || false;
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /**
     * Ensures the repository is available
     * @param {string} [errorMessage='Repository component not found'] - Custom error message
     * @throws {Error} If repository is not available
     * @returns {MasRepository} The repository instance
     */
    ensureRepository(errorMessage = 'Repository component not found') {
        const repository = this.repository;
        if (!repository) {
            this.error = errorMessage;
            throw new Error(errorMessage);
        }
        return repository;
    }

    async connectedCallback() {
        super.connectedCallback();

        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.LOCALIZATION) {
            Store.page.set(PAGE_NAMES.LOCALIZATION);
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

    get loadingIndicator() {
        if (!this.translationProjectsLoading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    /**
     * Renders a confirmation dialog
     * @returns {TemplateResult} - HTML template
     */
    renderConfirmDialog() {
        if (!this.confirmDialogConfig) return nothing;

        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;

        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="promotion-delete-confirm-dialog"
                    .heading=${title}
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

    /**
     * Display a dialog for confirmation
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, false if canceled
     */
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

    #handleAddTranslationProject() {
        Store.page.set(PAGE_NAMES.LOCALIZATION_EDITOR);
    }

    async #handleDeleteTranslationProject(translationProject) {
        if (this.isDialogOpen) return;
        const confirmed = await this.#showDialog(
            'Delete Translation Project',
            `Are you sure you want to delete the translation project "${translationProject.get().title}"? This action cannot be undone.`,
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'negative',
            },
        );
        if (!confirmed) return;
        try {
            Store.translationProjects.list.loading.set(true);
            showToast('Deleting translation project...');
            await this.repository.deleteFragment(translationProject, { startToast: false, endToast: false });
            const updatedTranslationProjects = this.translationProjectsData.filter(
                (p) => p.get().id !== translationProject.get().id,
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

    renderActionCell(translationProject) {
        return html`
            <sp-table-cell class="action-cell">
                <sp-action-menu size="m">
                    ${html`
                        <sp-menu-item disabled>
                            <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                            Duplicate
                        </sp-menu-item>
                        <sp-menu-item disabled>
                            <sp-icon-archive slot="icon"></sp-icon-archive>
                            Archive
                        </sp-menu-item>
                        <sp-menu-item @click=${() => this.#handleDeleteTranslationProject(translationProject)}>
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
        `;
    }

    renderTableHeader(columns) {
        return html`
            <sp-table-head>
                ${columns.map(
                    ({ key, label, align }) => html`
                        <sp-table-head-cell class=${key} style="${align === 'right' ? 'text-align: right;' : ''}">
                            ${label}
                        </sp-table-head-cell>
                    `,
                )}
            </sp-table-head>
        `;
    }

    renderTranslationProjectsTable() {
        const columns = [
            { key: 'title', label: 'Translation Project' },
            {
                key: 'lastUpdatedBy',
                label: 'Last updated by',
            },
            { key: 'sentOn', label: 'Sent on' },
            { key: 'actions', label: 'Actions', align: 'right' },
        ];
        return html`
            <sp-table emphasized .scroller=${true} class="localization-table">
                ${this.renderTableHeader(columns)}
                <sp-table-body>
                    ${repeat(
                        this.translationProjectsData,
                        (translationProject) => translationProject.get().id,
                        (translationProject) => html`
                            <sp-table-row value=${translationProject.get().path} data-id=${translationProject.get().id}>
                                <sp-table-cell>${translationProject.get().title}</sp-table-cell>
                                <sp-table-cell>${translationProject.get().modified.fullName}</sp-table-cell>
                                <sp-table-cell>TBD</sp-table-cell>
                                ${this.renderActionCell(translationProject)}
                            </sp-table-row>
                        `,
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    renderTranslationsProjects() {
        if (this.translationProjectsLoading) {
            return html`<div class="localization-loading-container">${this.loadingIndicator}</div>`;
        }
        if (this.translationProjectsData.length === 0) {
            return html`<div class="localization-empty-state">No translation projects found.</div>`;
        }
        return html`${this.renderTranslationProjectsTable()}`;
    }

    render() {
        return html`
            <div class="localization-container">
                <div class="localization-header">
                    <h2>Localization</h2>
                    <sp-button variant="accent" class="create-button" @click=${() => this.#handleAddTranslationProject()}>
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create project
                    </sp-button>
                </div>
                <div class="localization-toolbar">
                    <sp-search size="m" placeholder="Search" disabled></sp-search>
                    <div>${this.translationProjectsData.length} result(s)</div>
                </div>
                ${this.renderConfirmDialog()}
                <div class="localization-content">${this.renderTranslationsProjects()}</div>
            </div>
        `;
    }
}

customElements.define('mas-localization', MasLocalization);
