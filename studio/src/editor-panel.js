import { LitElement, html, css, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import { MasRepository } from './mas-repository.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import Store from './store.js';

export default class EditorPanel extends LitElement {
    static properties = {
        loading: { state: true, attribute: true },
        refreshing: { state: true, attribute: true },
        source: { type: Object },
        bucket: { type: String },
        disabled: { state: true, attribute: true },
        hasChanges: { state: true, attribute: true },
        showToast: { type: Function },
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
    `;

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.disabled = false;
        this.refreshing = false;
        this.hasChanges = false;
        this.loading = false;
        this.discardChanges = this.discardChanges.bind(this);
        this.refresh = this.refresh.bind(this);
        this.close = this.close.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
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

    fragmentStoreController = new StoreController(this, Store.fragments.inEdit);

    /** @type {FragmentStore | null} */
    get fragmentStore() {
        if (!this.fragmentStoreController.value) return null;
        return this.fragmentStoreController.value;
    }

    /** @type {Fragment | null} */
    get fragment() {
        if (!this.fragmentStore) return null;
        return this.fragmentStore.get();
    }

    /**
     * @returns {boolean} Whether or not the editor was closed
     */
    close() {
        if (!this.fragmentStore) return true;
        if (this.hasChanges && !window.confirm('Discard all current changes?'))
            return false;
        if (this.hasChanges) this.discardChanges();
        Store.fragments.inEdit.set(null);
        return true;
    }

    discardChanges(refresh = true) {
        if (!this.hasChanges) return;
        this.fragmentStore.discardChanges();
        this.hasChanges = false;
        if (refresh) this.refresh();
    }

    aemAction(action, reset = false) {
        return async function () {
            this.disabled = true;
            const ok = await action();
            if (ok && reset) this.hasChanges = false;
            this.disabled = false;
        };
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
        if (x) {
            const newPosition = x > window.innerWidth / 2 ? 'left' : 'right';
            this.updatePosition(newPosition);
        }
        const id = store.get().id;
        const currentId = this.fragmentStore?.get().id;
        if (id === currentId) return;
        const wasEmpty = !currentId;
        if (
            !wasEmpty &&
            this.hasChanges &&
            !window.confirm('Discard all current changes?')
        )
            return;
        this.discardChanges(false);
        this.loading = true;
        await this.repository.refreshFragment(store);
        this.loading = false;
        Store.fragments.inEdit.set(store);
        if (!wasEmpty) this.refresh();
    }

    async refresh() {
        this.refreshing = true;
        await this.updateComplete;
        this.refreshing = false;
    }

    get refreshed() {
        return (async () => {
            if (!this.refreshing) return Promise.resolve();
            while (this.refreshing) {
                await this.updateComplete;
            }
        })();
    }

    handleKeyDown(event) {
        if (event.code === 'Escape') this.close();
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
        //@TODO make it generic.
        const code = `<merch-card><aem-fragment fragment="${this.fragment?.id}"></aem-fragment></merch-card>`;
        try {
            await navigator.clipboard.writeText(code);
            this.showToast('Code copied to clipboard', 'positive');
        } catch (e) {
            this.showToast('Failed to copy code to clipboard', 'negative');
        }
    }

    #updateFragmentInternal(event) {
        const fieldName = event.target.dataset.field;
        let value = event.target.value;
        this.fragmentStore.updateFieldInternal(fieldName, value);
        this.hasChanges = true;
    }

    updateFragment(event) {
        const fieldName = event.target.dataset.field;
        let value = event.target.value || event.detail?.value;
        value = event.target.multiline ? value?.split(',') : [value ?? ''];
        this.fragmentStore.updateField(fieldName, value);
        this.hasChanges = true;
    }

    get fragmentEditorToolbar() {
        return html`<div id="editor-toolbar">
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
                    <sp-icon-chevron-left slot="icon"></sp-icon-chevron-left>
                    <sp-tooltip self-managed placement="bottom"
                        >Move left</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Save"
                    title="Save changes"
                    value="save"
                    @click="${this.aemAction(
                        this.repository.saveFragment,
                        true,
                    )}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
                    <sp-tooltip self-managed placement="bottom"
                        >Save changes</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Discard"
                    title="Discard changes"
                    value="discard"
                    @click="${this.discardChanges}"
                    ?disabled=${this.disabled || !this.hasChanges}
                >
                    <sp-icon-undo slot="icon"></sp-icon-undo>
                    <sp-tooltip self-managed placement="bottom"
                        >Discard changes</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Clone"
                    value="clone"
                    @click="${this.aemAction(this.repository.copyFragment)}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                    <sp-tooltip self-managed placement="bottom"
                        >Clone</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Publish"
                    value="publish"
                    @click="${this.aemAction(this.repository.publishFragment)}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                    <sp-tooltip self-managed placement="bottom"
                        >Publish</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Unpublish"
                    value="unpublish"
                    @click="${this.aemAction(
                        this.repository.unpublishFragment,
                    )}"
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
                    ?disabled=${this.disabled}
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
                    ?disabled=${this.disabled}
                >
                    <sp-icon-code slot="icon"></sp-icon-code>
                    <sp-tooltip self-managed placement="bottom">Use</sp-tooltip>
                </sp-action-button>
                <sp-action-button
                    label="Delete fragment"
                    value="delete"
                    @click="${this.aemAction(this.repository.deleteFragment)}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-delete-outline
                        slot="icon"
                    ></sp-icon-delete-outline>
                    <sp-tooltip self-managed placement="bottom"
                        >Delete fragment</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    title="Close"
                    label="Close"
                    value="close"
                    @click="${this.close}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-close-circle slot="icon"></sp-icon-close-circle>
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
                    <sp-icon-chevron-right slot="icon"></sp-icon-chevron-right>
                    <sp-tooltip self-managed placement="bottom"
                        >Move right</sp-tooltip
                    >
                </sp-action-button>
            </sp-action-group>
        </div>`;
    }

    get fragmentEditor() {
        return html`
            ${this.fragment
                ? html`
                      ${this.fragmentEditorToolbar}
                      <p>${this.fragment.path}</p>
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
                          ?disabled=${this.disabled}
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
                          ?disabled=${this.disabled}
                      ></sp-textfield>
                  `
                : nothing}
        `;
    }

    render() {
        if (this.loading)
            return html`
                <sp-progress-circle indeterminate size="l"></sp-progress-circle>
            `;

        if (this.refreshing || !this.fragment) return nothing;

        return html`<div id="editor">
            ${this.fragmentEditor} ${this.selectFragmentDialog}
            <sp-divider size="s"></sp-divider>
            <merch-card-editor
                .fragment=${this.fragment}
                .disabled=${this.disabled}
                .hasChanges=${this.hasChanges}
            >
            </merch-card-editor>
        </div>`;
    }
}

customElements.define('editor-panel', EditorPanel);

/**
 * @returns {EditorPanel}
 */
export function getEditorPanel() {
    return document.querySelector('editor-panel');
}

/**
 * @param {FragmentStore} store
 * @param {number | undefined} x - The clientX value of the mouse event (used for positioning - optional)
 */
export async function editFragment(store, x) {
    const editor = getEditorPanel();
    editor.editFragment(store, x);
}
