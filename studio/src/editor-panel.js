import { LitElement, html, css, nothing } from 'lit';
import { MasRepository } from './mas-repository.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import {
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    EVENT_KEYDOWN,
    OPERATIONS,
} from './constants.js';
import Events from './events.js';
import { VARIANTS } from './editors/variant-picker.js';

const MODEL_WEB_COMPONENT_MAPPING = {
    [CARD_MODEL_PATH]: 'merch-card',
    [COLLECTION_MODEL_PATH]: 'merch-card-collection',
};

const MODELS_NEEDING_MASK = [CARD_MODEL_PATH];
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

    reactiveController = new ReactiveController(this);

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
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /** @type {Fragment | null} */
    get fragment() {
        return this.fragmentStore?.get();
    }

    get fragmentStore() {
        return this.inEdit.get();
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

    needsMask(fragment) {
        return MODELS_NEEDING_MASK.includes(fragment.model.path);
    }

    maskOtherFragments(currentId) {
        document.querySelector('.main-container')?.classList.add('mask');
        document
            .querySelector(`[data-id="${currentId}"]`)
            ?.classList.add('editing-fragment');
    }

    unmaskOtherFragments() {
        // Remove mask when editor closes
        document.querySelector('.mask')?.classList.remove('mask');
        document
            .querySelector('.editing-fragment')
            ?.classList.remove('editing-fragment');
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
        if (Number.isInteger(x)) {
            const newPosition = x > window.innerWidth / 2 ? 'left' : 'right';
            this.updatePosition(newPosition);
        }
        await this.repository.refreshFragment(store);
        this.inEdit.set(store);
        this.reactiveController.updateStores([
            this.inEdit,
            store,
            this.operation,
        ]);
        if (this.needsMask(store.get(id))) {
            this.maskOtherFragments(id);
        }
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

    getFragmentPartsToUse() {
        let fragmentParts = '';
        let title = '';
        const surface = Store.search.value.path?.toUpperCase();
        switch (this.fragment?.model?.path) {
            case CARD_MODEL_PATH:
                const props =  {
                        cardTitle: this.fragment?.getField('cardTitle')?.values[0],
                        variantCode: this.fragment?.getField('variant')?.values[0],
                        marketSegment: this.fragment?.getTagTitle('market_segment'),
                        customerSegment: this.fragment?.getTagTitle('customer_segment'),
                        product: this.fragment?.getTagTitle('mas:product/'),
                    };

                    VARIANTS.forEach((variant) => {
                        if (variant.value === props.variantCode) {
                            props.variantLabel = variant.label;
                    }
                });
                const buildPart = ((part) => { 
                    if(part) return ` / ${part}`;
                    return '';
                });
                fragmentParts = `${surface}${buildPart(props.variantLabel)}${buildPart(props.customerSegment)}${buildPart(props.marketSegment)}${buildPart(props.product)} / ${this.fragment.fragmentName}`;
                title = props.cardTitle;
                break;  
            case COLLECTION_MODEL_PATH:
                title = this.fragment?.title;
                fragmentParts = `${surface} / ${title}`;
                break;
        }
        return {fragmentParts, title};
    }

    showNegativeAlert() {
        Events.toast.emit({
            variant: 'negative',
            content: 'Failed to copy code to clipboard',
        });
    }

    generateCodeToUse() {
        const {fragmentParts, title} = this.getFragmentPartsToUse();
        const webComponentName =
            MODEL_WEB_COMPONENT_MAPPING[this.fragment?.model?.path];
        if (!webComponentName) {
            this.showNegativeAlert();
            return [];
        }

        const code = `<${webComponentName}><aem-fragment fragment="${this.fragment?.id}" title="${title}"></aem-fragment></${webComponentName}>`;
        const authorPath = `${webComponentName}: ${fragmentParts}`;
        const richText = `
                <a href="https://mas.adobe.com/studio.html#page=${Store.page.value}&path=${Store.search.value.path}&query=${this.fragment?.id}">
                    ${authorPath}
                </a>
            `;
        return [code, richText, authorPath];
    }

    async copyToUse() {
        const [code, richText] = this.generateCodeToUse();
        if (!code || !richText) return;

        try {
            await navigator.clipboard.write([
                /* global ClipboardItem */
                new ClipboardItem({
                    'text/plain': new Blob([code], { type: 'text/plain' }),
                    'text/html': new Blob([richText], { type: 'text/html' }),
                }),
            ]);
            Events.toast.emit({
                variant: 'positive',
                content: 'Code copied to clipboard',
            });
        } catch (e) {
            this.showNegativeAlert();
        }
    }

    #updateFragmentInternal(event) {
        const fieldName = event.target.dataset.field;
        let value = event.target.value;
        this.fragmentStore.updateFieldInternal(fieldName, value);
    }

    updateFragment({ target, detail, values }) {
        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }
        this.fragmentStore.updateField(fieldName, value);
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
            this.fragmentStore.discardChanges();
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
     * Handler for the toolbar "Discard" action.
     * Uses the same prompt so that the user always sees a consistent confirmation.
     */
    async onToolbarDiscard() {
        if (Store.editor.hasChanges) {
            const confirmed = await this.promptDiscardChanges();
            if (confirmed) {
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
        }
        this.unmaskOtherFragments();
        this.inEdit.set();
        return true;
    }

    #handleLocReady() {
        const value = !this.fragment.getField('locReady').values[0];
        this.fragmentStore.updateField('locReady', [value]);
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
                      >
                      </sp-textfield>
                      <sp-field-label for="fragment-locready"
                          >Send to translation?</sp-field-label
                      >
                      <sp-switch
                          ?checked="${this.fragment.getField('locReady')
                              ?.values[0]}"
                          @click="${this.#handleLocReady}"
                      >
                      </sp-switch>
                  `
                : nothing}
        `;
    }

    render() {
        if (!this.fragment) return nothing;
        if (this.fragment.loading)
            return html`<sp-progress-circle
                indeterminate
                size="l"
            ></sp-progress-circle>`;

        let editor = nothing;
        if (this.showEditor) {
            switch (this.fragment.model.path) {
                case CARD_MODEL_PATH:
                    editor = html` <merch-card-editor
                        .fragmentStore=${this.fragmentStore}
                        .updateFragment=${this.updateFragment}
                    ></merch-card-editor>`;
                    break;
                case COLLECTION_MODEL_PATH:
                    editor = html` <merch-card-collection-editor
                        .fragmentStore=${this.fragmentStore}
                        .updateFragment=${this.updateFragment}
                    ></merch-card-collection-editor>`;
                    break;
            }
        }
        return html`
            <div id="editor">
                ${this.fragmentEditorToolbar}
                <sp-divider size="s"></sp-divider>
                <div>
                    <p>${this.generateCodeToUse()[2]}</p>
                </div>
                <sp-divider size="s"></sp-divider>
                ${editor}
                <sp-divider size="s"></sp-divider>
                ${this.fragmentEditor} ${this.deleteConfirmationDialog}
                ${this.discardConfirmationDialog}
            </div>
        `;
    }
}

customElements.define('editor-panel', EditorPanel);
