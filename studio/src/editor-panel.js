import { html, LitElement, css, nothing } from 'lit';
import { EVENT_CLOSE, EVENT_FRAGMENT_CHANGE, EVENT_SAVE } from './events.js';

class EditorPanel extends LitElement {
    static properties = {
        showToast: { type: Function },
        fragment: { type: Object },
        source: { type: Object },
        bucket: { type: String },
    };

    static styles = css`
        :host {
            position: fixed;
            bottom: 0;
            top: 0;
            left: var(--editor-left);
            right: var(--editor-right);
            height: 100vh;
            width: 440px;
            background-color: var(--spectrum-white);
            padding: 20px;
            overflow-y: auto;
            box-sizing: border-box;
            box-shadow: 0 2px 6px 8px rgb(0 0 0 / 10%);
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

    constructor() {
        super();
        this.handleFragmentChange = this.handleFragmentChange.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener(EVENT_CLOSE, this.handleClose);
        document.addEventListener(
            EVENT_FRAGMENT_CHANGE,
            this.handleFragmentChange,
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener(EVENT_CLOSE, this.handleClose);
        document.removeEventListener(
            EVENT_FRAGMENT_CHANGE,
            this.handleFragmentChange,
        );
    }

    handleFragmentChange(e) {
        if (e.detail?.fragment === this.fragment) {
            this.requestUpdate();
        }
    }

    handleClose(e) {
        if (e.target === this) return;
        e.stopPropagation();
    }

    async saveFragment() {
        this.showToast('Saving fragment...');
        try {
            await this.source?.saveFragment();
            this.dispatchEvent(new CustomEvent(EVENT_SAVE));
            this.showToast('Fragment saved', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be saved', 'negative');
        }
    }

    async discardChanges() {
        const fragment = this.fragment;
        fragment.discardChanges();
        this.fragment = null; // this is needed to force a re-render
        this.requestUpdate();
        await this.updateComplete;
        this.fragment = fragment;
    }

    async publishFragment() {
        this.showToast('Publishing fragment...');
        try {
            await this.source?.publishFragment();
            this.showToast('Fragment published', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be published', 'negative');
        }
    }

    openFragmentInOdin() {
        const parent = this.fragment?.path.split('/').slice(0, -1).join('/');
        window.open(
            `https://experience.adobe.com/?repo=author-p22655-${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin${parent}?appId=aem-cf-admin&q=${this.fragment?.fragmentName}`,
            '_blank',
        );
    }

    async unpublishFragment() {
        this.showToast('Unpublishing fragment...');
        try {
            await this.source?.unpublishFragment();
            this.showToast('Fragment unpublished', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be unpublished', 'negative');
        }
    }

    async deleteFragment() {
        if (confirm('Are you sure you want to delete this fragment?')) {
            try {
                await this.source?.deleteFragment();
                this.showToast('Fragment deleted', 'positive');
            } catch (e) {
                this.showToast('Fragment could not be deleted', 'negative');
            }
        }
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

    async copyFragment() {
        this.showToast('Cloning fragment...');
        try {
            await this.source?.copyFragment();
            this.showToast('Fragment cloned', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be cloned', 'negative');
        }
    }

    updateFragmentInternal(e) {
        const fieldName = e.target.dataset.field;
        let value = e.target.value;
        this.fragment.updateFieldInternal(fieldName, value);
    }

    updateFragment({ detail: e }) {
        if (!this.fragment) return;
        const fieldName = e.target.dataset.field;
        let value = e.target.value || e.detail?.value;
        value = e.target.multiline ? value?.split(',') : [value ?? ''];
        this.fragment.updateField(fieldName, value);
    }

    get fragmentEditorToolbar() {
        return html`<div id="actions" slot="heading">
            <sp-action-group
                aria-label="Fragment actions"
                role="group"
                size="l"
                compact
                emphasized
                quiet
            >
                <sp-action-button
                    label="Save changes"
                    ?disabled=${!this.fragment.hasChanges}
                    @click="${this.saveFragment}"
                >
                    <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
                    <sp-tooltip self-managed placement="bottom"
                        >Save changes</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Discard changes"
                    id="btnDiscard"
                    ?disabled=${!this.fragment.hasChanges}
                    @click="${this.discardChanges}"
                >
                    <sp-icon-undo slot="icon"></sp-icon-undo>
                    <sp-tooltip self-managed placement="bottom"
                        >Discard changes</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button label="Clone" @click="${this.copyFragment}">
                    <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                    <sp-tooltip self-managed placement="bottom"
                        >Clone</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Publish"
                    @click="${this.publishFragment}"
                >
                    <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                    <sp-tooltip self-managed placement="bottom"
                        >Publish</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Unpublish"
                    @click="${this.unpublishFragment}"
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
                    @click="${this.openFragmentInOdin}"
                >
                    <sp-icon-open-in slot="icon"></sp-icon-open-in>
                    <sp-tooltip self-managed placement="bottom"
                        >Open in Odin</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button label="Use" @click="${this.copyToUse}">
                    <sp-icon-code slot="icon"></sp-icon-code>
                    <sp-tooltip self-managed placement="bottom">Use</sp-tooltip>
                </sp-action-button>
                <sp-action-button
                    label="Delete fragment"
                    @click="${this.deleteFragment}"
                >
                    <sp-icon-delete-outline
                        slot="icon"
                    ></sp-icon-delete-outline>
                    <sp-tooltip self-managed placement="bottom"
                        >Delete fragment</sp-tooltip
                    >
                </sp-action-button>
            </sp-action-group>
            <sp-divider vertical></sp-divider>
            <sp-action-group size="l" quiet>
                <sp-action-button
                    label="Close"
                    @click="${() =>
                        this.dispatchEvent(new CustomEvent(EVENT_CLOSE))}"
                >
                    <sp-icon-close-circle slot="icon"></sp-icon-close-circle>
                    <sp-tooltip self-managed placement="bottom"
                        >Close</sp-tooltip
                    >
                </sp-action-button>
            </sp-action-group>
        </div>`;
    }

    get merchCardEditorElement() {
        return this.shadowRoot.querySelector('merch-card-editor');
    }

    get fragmentEditor() {
        return html`<div id="editor">
            ${this.fragment
                ? html`
                      ${this.fragmentEditorToolbar}
                      <merch-card-editor
                          .fragment=${this.fragment}
                          @close="${this.handleClose}"
                          @update-fragment="${this.updateFragment}"
                      >
                      </merch-card-editor>
                      <p>Fragment details (not shown on the card)</p>
                      <sp-divider size="s"></sp-divider>
                      <sp-field-label for="fragment-title"
                          >Fragment Title</sp-field-label
                      >
                      <sp-textfield
                          placeholder="Enter fragment title"
                          id="fragment-title"
                          data-field="title"
                          value="${this.fragment.title}"
                          @input="${this.updateFragmentInternal}"
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
                          @input="${this.updateFragmentInternal}"
                      ></sp-textfield>
                  `
                : nothing}
        </div>`;
    }

    render() {
        if (!this.fragment) return nothing;
        return html`${this.fragmentEditor} ${this.selectFragmentDialog}`;
    }
}

customElements.define('editor-panel', EditorPanel);
