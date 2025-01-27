import { LitElement, html, css, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import { MasRepository } from './mas-repository.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import Store from './store.js';
import Events from './events.js';

export default class EditorPanel extends LitElement {
    static properties = {
        loading: { state: true },
        source: { type: Object },
        bucket: { type: String },
        disabled: { type: Boolean },
        showToast: { type: Function },
        discarded: { type: Boolean, state: true },
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

    fragmentStoreController = new StoreController(this, Store.fragments.inEdit);

    constructor() {
        super();
        this.disabled = false;
        this.loading = false;
        this.discarded = false;
        this.handleClose = this.handleClose.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.updateFragment = this.updateFragment.bind(this);
        this.changesDiscarded = this.changesDiscarded.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.handleKeyDown);
        Events.changesDiscarded.subscribe(this.changesDiscarded);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.handleKeyDown);
        Events.changesDiscarded.unsubscribe(this.changesDiscarded);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /** @type {FragmentStore | null} */
    get fragmentStore() {
        if (this.discarded) return null;
        if (!this.fragmentStoreController.store) return null;
        return this.fragmentStoreController.store;
    }

    /** @type {Fragment | null} */
    get fragment() {
        if (!this.fragmentStore?.value) return null;
        return this.fragmentStore.value;
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
        if (!wasEmpty && !Store.editor.close()) return;
        if (x) {
            const newPosition = x > window.innerWidth / 2 ? 'left' : 'right';
            this.updatePosition(newPosition);
        }
        this.loading = true;
        Store.fragments.inEdit.set(store.value);
        await this.repository.refreshFragment(store);
        this.loading = false;
    }

    async changesDiscarded() {
        this.discarded = true;
        this.requestUpdate();
        await this.updateComplete;
        this.discarded = false;
    }

    handleKeyDown(event) {
        if (event.code === 'Escape') Store.editor.close();
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
    }

    updateFragment(event) {
        const fieldName = event.target.dataset.field;
        let value = event.target.value || event.detail?.value;
        value = event.target.multiline ? value?.split(',') : [value ?? ''];
        this.fragmentStore.updateField(fieldName, value);
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
                    @click="${this.repository.saveFragment}"
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
                    @click="${Store.editor.discardChanges}"
                    ?disabled=${this.disabled || !Store.editor.hasChanges}
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
                    @click="${this.repository.publishFragment}"
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
                    @click="${this.repository.deleteFragment}"
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
                    @click="${Store.editor.close}"
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

        if (!this.fragment) return nothing;

        return html`<div id="editor">
            ${this.fragmentEditorToolbar}
            <p>${this.fragment.path}</p>
            <merch-card-editor
                .fragment=${this.fragment}
                .disabled=${this.disabled}
                .fragmentStore=${this.fragmentStore}
                .updateFragment=${this.updateFragment}
            ></merch-card-editor>
            }
            <sp-divider size="s"></sp-divider>
            ${this.fragmentEditor}
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
