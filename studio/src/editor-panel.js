import { LitElement, html, css, nothing } from 'lit';
import { MasRepository } from './mas-repository.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { OPERATIONS } from './constants.js';

export default class EditorPanel extends LitElement {
    static properties = {
        source: { type: Object },
        bucket: { type: String },
        showDeleteDialog: { type: Boolean, state: true },
        showDiscardDialog: { type: Boolean, state: true },
        showEditor: { type: Boolean, state: true }, // Used to force re-rendering of the editor
    };

    static styles = css`
        sp-divider {
            margin: 16px 0;
        }

        merch-card-editor {
            display: contents;
        }

        #actions {
            display: flex;
            justify-content: end;
        }

        sp-textfield {
            width: 360px;
        }

        /* Optional: Styles for the dialog */
        sp-dialog {
            max-width: 500px;
        }
    `;

    inEdit = Store.fragments.inEdit;
    operation = Store.operation;

    reactiveController = new ReactiveController(this, [
        this.inEdit,
        this.operation,
    ]);

    #discardPromiseResolver;

    constructor() {
        super();
        this.showDeleteDialog = false;
        this.showDiscardDialog = false;
        this.showEditor = true;
        // Used to resolve the discard confirmation promise.
        this.#discardPromiseResolver = null;

        // Bind methods
        this.handleClose = this.handleClose.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.updateFragment = this.updateFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
        this.confirmDelete = this.confirmDelete.bind(this);
        this.cancelDelete = this.cancelDelete.bind(this);
        this.discardConfirmed = this.discardConfirmed.bind(this);
        this.cancelDiscard = this.cancelDiscard.bind(this);
        this.onToolbarDiscard = this.onToolbarDiscard.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.handleKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /** @type {Fragment | null} */
    get fragment() {
        return this.inEdit?.get();
    }

    updatePosition(position) {
        this.style.setProperty(
            '--editor-left',
            position === 'left' ? '0' : 'inherit',
        );
        this.style.setProperty(
            '--editor-right',
            position === 'right' ? '0' : 'inherit',
        );
        this.setAttribute('position', position);
    }

    /**
     * @param {FragmentStore} store
     * @param {number | undefined} x
     */
    async editFragment(store, x) {
        const id = store.get().id;
        const currentId = this.fragment?.id;
        if (id === currentId) return;
        const wasEmpty = !currentId;
        // If there is an existing fragment and unsaved changes,
        // prompt to discard before switching.
        if (!wasEmpty && !(await this.closeEditor())) return;
        if (x) {
            const newPosition = x > window.innerWidth / 2 ? 'left' : 'right';
            this.updatePosition(newPosition);
        }
        this.inEdit.set(store.value);
        await this.repository.refreshFragment(store);
    }

    handleKeyDown(event) {
        if (event.code === 'Escape') this.closeEditor();
        if (!event.ctrlKey) return;
        if (event.code === 'ArrowLeft' && event.shiftKey)
            this.updatePosition('left');
        if (event.code === 'ArrowRight' && event.shiftKey)
            this.updatePosition('right');
    }

    handleClose(e) {
        if (e.target === this) return;
        e.stopPropagation();
    }

    openFragmentInOdin() {
        const parent = this.fragment?.path.split('/').slice(0, -1).join('/');
        window.open(
            `https://experience.adobe.com/?repo=author-p22655-${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin${parent}?appId=aem-cf-admin&q=${this.fragment?.fragmentName}`,
            '_blank',
        );
    }

    async copyToUse() {
        // @TODO make it generic.
        const code = `<merch-card><aem-fragment fragment="${this.fragment?.id}"></aem-fragment></merch-card>`;
        try {
            await navigator.clipboard.writeText(code);
        } catch (e) {}
    }

    #updateFragmentInternal(event) {
        const fieldName = event.target.dataset.field;
        let value = event.target.value;
        this.inEdit.updateFieldInternal(fieldName, value);
    }

    updateFragment({ target, detail }) {
        const fieldName = target.dataset.field;
        let value = target.value || detail?.value || target.checked;
        value = target.multiline ? value?.split(',') : [value ?? ''];
        this.inEdit.updateField(fieldName, value);
    }

    async deleteFragment() {
        // Ask for confirmation using sp-underlay and sp-dialog
        this.showDeleteDialog = true;
    }

    async confirmDelete() {
        this.showDeleteDialog = false;
        try {
            await this.repository.deleteFragment(this.fragment);
            await this.closeEditor();
        } catch (error) {
            console.error('Error deleting fragment:', error);
        }
    }

    cancelDelete() {
        this.showDeleteDialog = false;
    }

    /**
     * Prompts the user to confirm discarding changes.
     * Returns a Promise that resolves with true if the user confirms,
     * or false if the user cancels.
     */
    promptDiscardChanges() {
        return new Promise((resolve) => {
            this.#discardPromiseResolver = resolve;
            this.showDiscardDialog = true;
        });
    }

    /**
     * Called when the user confirms discarding changes.
     */
    discardConfirmed() {
        this.showDiscardDialog = false;
        if (this.#discardPromiseResolver) {
            this.#discardPromiseResolver(true);
            this.#discardPromiseResolver = null;
        }
    }

    /**
     * Called when the user cancels the discard confirmation.
     */
    cancelDiscard() {
        this.showDiscardDialog = false;
        if (this.#discardPromiseResolver) {
            this.#discardPromiseResolver(false);
            this.#discardPromiseResolver = null;
        }
    }

    /**
     * Handler for the toolbar “Discard” action.
     * Uses the same prompt so that the user always sees a consistent confirmation.
     */
    async onToolbarDiscard() {
        if (Store.editor.hasChanges) {
            const confirmed = await this.promptDiscardChanges();
            if (confirmed) {
                this.inEdit.discardChanges();
                this.showEditor = false;
                await this.updateComplete;
                this.showEditor = true;
            }
        }
    }

    /**
     * Closes the editor.
     * If there are unsaved changes, the user is prompted to confirm discarding them.
     * Returns a Promise that resolves to true if the editor was closed,
     * or false if the operation was canceled.
     */
    async closeEditor() {
        if (Store.editor.hasChanges) {
            const confirmed = await this.promptDiscardChanges();
            if (!confirmed) {
                return false;
            }
            // The user confirmed – discard changes.
            this.inEdit.discardChanges();
        }
        this.inEdit.set();
        return true;
    }

    get fragmentEditorToolbar() {
        return html`
            <div id="editor-toolbar">
                <sp-action-group
                    aria-label="Fragment actions"
                    role="group"
                    size="l"
                    compact
                    emphasized
                    quiet
                >
                    <sp-action-button
                        label="Move left"
                        title="Move left"
                        value="left"
                        id="move-left"
                        @click="${() => this.updatePosition('left')}"
                    >
                        <sp-icon-chevron-left
                            slot="icon"
                        ></sp-icon-chevron-left>
                        <sp-tooltip self-managed placement="bottom"
                            >Move left</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Save"
                        title="Save changes"
                        value="save"
                        ?disabled="${!Store.editor.hasChanges}"
                        @click="${this.repository.saveFragment}"
                    >
                        ${this.operation.equals(OPERATIONS.SAVE)
                            ? html`<sp-progress-circle
                                  indeterminate
                                  size="s"
                              ></sp-progress-circle>`
                            : html`<sp-icon-save-floppy
                                  slot="icon"
                              ></sp-icon-save-floppy>`}
                        <sp-tooltip self-managed placement="bottom"
                            >Save changes</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Discard"
                        title="Discard changes"
                        value="discard"
                        ?disabled="${!Store.editor.hasChanges}"
                        @click="${this.onToolbarDiscard}"
                    >
                        <sp-icon-undo slot="icon"></sp-icon-undo>
                        <sp-tooltip self-managed placement="bottom"
                            >Discard changes</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Clone"
                        value="clone"
                        @click="${this.repository.copyFragment}"
                    >
                        ${this.operation.equals(OPERATIONS.CLONE)
                            ? html`<sp-progress-circle
                                  indeterminate
                                  size="s"
                              ></sp-progress-circle>`
                            : html` <sp-icon-duplicate
                                  slot="icon"
                              ></sp-icon-duplicate>`}

                        <sp-tooltip self-managed placement="bottom"
                            >Clone</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Publish"
                        value="publish"
                        @click="${this.repository.publishFragment}"
                    >
                        ${this.operation.equals(OPERATIONS.PUBLISH)
                            ? html`<sp-progress-circle
                                  indeterminate
                                  size="s"
                              ></sp-progress-circle>`
                            : html` <sp-icon-publish-check
                                  slot="icon"
                              ></sp-icon-publish-check>`}
                        <sp-tooltip self-managed placement="bottom"
                            >Publish</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Unpublish"
                        value="unpublish"
                        @click="${this.repository.unpublishFragment}"
                        disabled
                    >
                        <sp-icon-publish-remove
                            slot="icon"
                        ></sp-icon-publish-remove>
                        <sp-tooltip self-managed placement="bottom"
                            >Unpublish</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Open in Odin"
                        value="open"
                        @click="${this.openFragmentInOdin}"
                    >
                        <sp-icon-open-in slot="icon"></sp-icon-open-in>
                        <sp-tooltip self-managed placement="bottom"
                            >Open in Odin</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Use"
                        value="use"
                        @click="${this.copyToUse}"
                    >
                        <sp-icon-code slot="icon"></sp-icon-code>
                        <sp-tooltip self-managed placement="bottom"
                            >Use</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Delete fragment"
                        value="delete"
                        @click="${this.deleteFragment}"
                    >
                        ${this.operation.equals(OPERATIONS.DELETE)
                            ? html`<sp-progress-circle
                                  indeterminate
                                  size="s"
                              ></sp-progress-circle>`
                            : html` <sp-icon-delete-outline
                                  slot="icon"
                              ></sp-icon-delete-outline>`}

                        <sp-tooltip self-managed placement="bottom"
                            >Delete fragment</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        title="Close"
                        label="Close"
                        value="close"
                        @click="${this.closeEditor}"
                    >
                        <sp-icon-close-circle
                            slot="icon"
                        ></sp-icon-close-circle>
                        <sp-tooltip self-managed placement="bottom"
                            >Close</sp-tooltip
                        >
                    </sp-action-button>
                    <sp-action-button
                        label="Move right"
                        title="Move right"
                        value="right"
                        id="move-right"
                        @click="${() => this.updatePosition('right')}"
                    >
                        <sp-icon-chevron-right
                            slot="icon"
                        ></sp-icon-chevron-right>
                        <sp-tooltip self-managed placement="bottom"
                            >Move right</sp-tooltip
                        >
                    </sp-action-button>
                </sp-action-group>
            </div>
        `;
    }

    get deleteConfirmationDialog() {
        if (!this.showDeleteDialog) return nothing;
        return html`
            <sp-underlay open @click="${this.cancelDelete}"></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                @sp-dialog-confirm="${this.confirmDelete}"
                @sp-dialog-dismiss="${this.cancelDelete}"
            >
                <h1 slot="heading">Confirm Deletion</h1>
                <p>
                    Are you sure you want to delete this fragment? This action
                    cannot be undone.
                </p>
                <sp-button
                    slot="button"
                    variant="secondary"
                    @click="${this.cancelDelete}"
                >
                    Cancel
                </sp-button>
                <sp-button
                    slot="button"
                    variant="accent"
                    @click="${this.confirmDelete}"
                >
                    Delete
                </sp-button>
            </sp-dialog>
        `;
    }

    get discardConfirmationDialog() {
        if (!this.showDiscardDialog) return nothing;
        return html`
            <sp-underlay open @click="${this.cancelDiscard}"></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                @sp-dialog-confirm="${this.discardConfirmed}"
                @sp-dialog-dismiss="${this.cancelDiscard}"
            >
                <h1 slot="heading">Confirm Discard</h1>
                <p>
                    Are you sure you want to discard changes? This action cannot
                    be undone.
                </p>
                <sp-button
                    slot="button"
                    variant="secondary"
                    @click="${this.cancelDiscard}"
                >
                    Cancel
                </sp-button>
                <sp-button
                    slot="button"
                    variant="accent"
                    id="btnDiscard"
                    @click="${this.discardConfirmed}"
                >
                    Discard
                </sp-button>
            </sp-dialog>
        `;
    }

    get fragmentEditor() {
        return html`
            ${this.fragment
                ? html`
                      <p>Fragment details (not shown on the card)</p>
                      <sp-field-label for="fragment-title"
                          >Fragment Title</sp-field-label
                      >
                      <sp-textfield
                          placeholder="Enter fragment title"
                          id="fragment-title"
                          data-field="title"
                          value="${this.fragment.title}"
                          @input=${this.#updateFragmentInternal}
                      ></sp-textfield>
                      <sp-field-label for="fragment-description"
                          >Fragment Description</sp-field-label
                      >
                      <sp-textfield
                          placeholder="Enter fragment description"
                          id="fragment-description"
                          data-field="description"
                          multiline
                          value="${this.fragment.description}"
                          @input=${this.#updateFragmentInternal}
                      ></sp-textfield>
                  `
                : nothing}
        `;
    }

    render() {
        if (!this.fragment) return nothing;
        if (this.inEdit.loading)
            return html`<sp-progress-circle
                indeterminate
                size="l"
            ></sp-progress-circle>`;
        return html`
            <div id="editor">
                ${this.fragmentEditorToolbar}
                <p>${this.fragment.path}</p>
                ${this.showEditor
                    ? html` <merch-card-editor
                          .fragment=${this.fragment}
                          .fragmentStore=${this.inEdit}
                          .updateFragment=${this.updateFragment}
                      ></merch-card-editor>`
                    : nothing}
                <sp-divider size="s"></sp-divider>
                ${this.fragmentEditor} ${this.deleteConfirmationDialog}
                ${this.discardConfirmationDialog}
            </div>
        `;
    }
}

customElements.define('editor-panel', EditorPanel);
