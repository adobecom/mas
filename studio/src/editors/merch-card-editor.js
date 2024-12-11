import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../fields/multifield.js';
import '../fields/mnemonic-field.js';
import Store, { getFragmentStore, getInEditFragment } from '../store.js';
import StoreController from '../reactivity/storeController.js';
import { FragmentStore } from '../reactivity/reactiveStore.js';
import '../aem/aem-tag-picker-field.js';
import { MasFetcher } from '../mas-fetcher.js';
import './variant-picker.js';

const MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

class MerchCardEditor extends LitElement {
    static properties = {
        refreshing: { state: true, attribute: true },
        disabled: { state: true, attribute: true },
        hasChanges: { state: true, attribute: true },
        loading: { state: true, attribute: true },
    };

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.disabled = false;
        this.refreshing = false;
        this.hasChanges = false;
        this.loading = false;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.close = this.close.bind(this);
        this.discardChanges = this.discardChanges.bind(this);
        this.refresh = this.refresh.bind(this);
    }

    /** @type {MasFetcher} */
    get fetcher() {
        return document.querySelector('mas-fetcher');
    }

    fragmentInEdit = new StoreController(this, Store.fragments.inEdit);

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.handleKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    /** @type {FragmentStore} */
    get fragmentStore() {
        return getFragmentStore(Store.fragments.inEdit.get());
    }

    handleKeyDown(event) {
        event.stopPropagation();
        if (event.code === 'Escape') this.close();
        if (event.code === 'ArrowLeft' && event.shiftKey)
            this.updatePosition('left');
        if (event.code === 'ArrowRight' && event.shiftKey)
            this.updatePosition('right');
    }

    close() {
        if (!this.fragmentInEdit.value) return;
        if (this.hasChanges && !window.confirm('Discard all current changes?'))
            return;
        this.discardChanges(false);
        Store.fragments.inEdit.set(null);
    }

    discardChanges(refresh = true) {
        this.fragmentStore.discardChanges();
        this.hasChanges = false;
        if (refresh) this.refresh();
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

    async editFragment(id, x) {
        if (x) {
            const newPosition = x > window.innerWidth / 2 ? 'left' : 'right';
            this.updatePosition(newPosition);
        }
        if (this.fragmentInEdit.value === id) return;
        const wasEmpty = !Store.fragments.inEdit.get();
        if (
            !wasEmpty &&
            this.hasChanges &&
            !window.confirm('Discard all current changes?')
        )
            return;
        if (!wasEmpty) this.discardChanges(false);
        this.loading = true;
        await this.fetcher.refreshFragment(id);
        this.loading = false;
        Store.fragments.inEdit.set(id);
        if (!wasEmpty) this.refresh();
    }

    async refresh() {
        this.refreshing = true;
        await this.updateComplete;
        this.refreshing = false;
    }

    render() {
        if (this.loading)
            return html`<div id="editor">
                <sp-progress-circle indeterminate size="l"></sp-progress-circle>
            </div>`;

        if (this.refreshing) return nothing;
        if (!this.fragmentInEdit.value) return nothing;

        const fragment = this.fragmentStore.get();
        if (fragment.model.path !== MODEL_PATH) return nothing;
        const form = Object.fromEntries([
            ...fragment.fields.map((f) => [f.name, f]),
        ]);

        // Mnemonics
        const mnemonicIcon =
            fragment.fields.find((f) => f.name === 'mnemonicIcon')?.values ??
            [];
        const mnemonicAlt =
            fragment.fields.find((f) => f.name === 'mnemonicAlt')?.values ?? [];
        const mnemonicLink =
            fragment.fields.find((f) => f.name === 'mnemonicLink')?.values ??
            [];
        const mnemonics =
            mnemonicIcon?.map((icon, index) => ({
                icon,
                alt: mnemonicAlt[index] ?? '',
                link: mnemonicLink[index] ?? '',
            })) ?? [];

        return html`<div id="editor">
            ${this.toolbar}
            <p>${fragment.path}</p>
            <sp-field-label for="card-variant">Variant</sp-field-label>
            <variant-picker
                id="card-variant"
                ?show-all="false"
                data-field="variant"
                default-value="${form.variant.values[0]}"
                @change="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></variant-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="cardTitle"
                value="${form.cardTitle.values[0]}"
                @change="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
            <sp-textfield
                placeholder="Enter card subtitle"
                id="card-subtitle"
                data-field="subtitle"
                value="${form.subtitle.values[0]}"
                @change="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="card-size">Size</sp-field-label>
            <sp-textfield
                placeholder="Enter card size"
                id="card-size"
                data-field="size"
                value="${form.size.values[0]}"
                @change="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="card-icon">Badge</sp-field-label>
            <sp-textfield
                placeholder="Enter badge text"
                id="card-badge"
                data-field="badge"
                value="${form.badge.values[0]}"
                @change="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="mnemonic">Mnemonics</sp-field-label>
            <mas-multifield
                id="mnemonic"
                .value="${mnemonics}"
                @change="${this.#updateMnemonics}"
            >
                <template>
                    <mas-mnemonic-field></mas-mnemonic-field>
                </template>
            </mas-multifield>
            <sp-field-label for="card-icon">Background Image</sp-field-label>
            <sp-textfield
                placeholder="Enter backgroung image URL"
                id="background-title"
                data-field="backgroundImage"
                value="${form.backgroundImage.values[0]}"
                @change="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="card-icon"
                >Background Image Alt Text</sp-field-label
            >
            <sp-textfield
                placeholder="Enter backgroung image Alt Text"
                id="background-alt-text"
                data-field="backgroundImageAltText"
                value="${form.backgroundImageAltText.values[0]}"
                @change="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="horizontal"> Prices </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-field
                    inline
                    data-field="prices"
                    default-link-style="primary-outline"
                    @change="${this.#updateFragment}"
                    ?readonly=${this.disabled}
                    >${unsafeHTML(form.prices.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-field
                    link
                    data-field="description"
                    default-link-style="secondary-link"
                    @change="${this.#updateFragment}"
                    ?readonly=${this.disabled}
                    >${unsafeHTML(form.description.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Footer </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-field
                    link
                    inline
                    data-field="ctas"
                    default-link-style="primary-outline"
                    @change="${this.#updateFragment}"
                    ?readonly=${this.disabled}
                    >${unsafeHTML(form.ctas.values[0])}</rte-field
                >
            </sp-field-group>
            <aem-tag-picker-field
                label="Tags"
                namespace="/content/cq:tags/mas"
                multiple
                value="${fragment.tags.map((tag) => tag.id).join(',')}"
                @change=${this.#handeTagsChange}
            ></aem-tag-picker-field>
            <p>Fragment details (not shown on the card)</p>
            <sp-divider size="s"></sp-divider>
            <sp-field-label for="fragment-title">Fragment Title</sp-field-label>
            <sp-textfield
                placeholder="Enter fragment title"
                id="fragment-title"
                data-field="title"
                value="${fragment.title}"
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
                value="${fragment.description}"
                ?disabled=${this.disabled}
            ></sp-textfield>
        </div> `;
    }

    #handeTagsChange(e) {
        const value = e.target.getAttribute('value');
        const newTags = value ? value.split(',') : []; // do not overwrite the tags array
        this.fragmentStore.updateField('tags', newTags);
        this.hasChanges = true;
    }

    #updateFragment(event) {
        const fieldName = event.target.dataset.field;
        let value = event.target.value || event.detail?.value;
        value = event.target.multiline ? value?.split(',') : [value ?? ''];
        this.fragmentStore.updateField(fieldName, value);
        this.hasChanges = true;
    }

    #updateMnemonics(e) {
        const fragment = this.fragmentStore.get();
        fragment.updateField('mnemonicIcon', mnemonicIcon);
        fragment.updateField('mnemonicAlt', mnemonicAlt);
        fragment.updateField('mnemonicLink', mnemonicLink);
        this.fragmentStore.set(fragment);
        this.hasChanges = true;
    }

    // #region Toolbar

    aemAction(action, reset = false) {
        return async function () {
            this.disabled = true;
            const ok = await action();
            if (ok && reset) this.hasChanges = false;
            this.disabled = false;
        };
    }

    openFragmentInOdin() {
        const fragment = getInEditFragment();
        window.open(
            `https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${fragment?.fragmentName}`,
            '_blank',
        );
    }

    async copyToUse() {
        const code = `<merch-card><aem-fragment fragment="${Store.fragments.inEdit.get()}"></aem-fragment></merch-card>`;
        try {
            await navigator.clipboard.writeText(code);
            Events.showToast.emit({
                variant: 'positive',
                content: 'Code copied to clipboard',
            });
        } catch (error) {
            console.error(`Failed to copy code to clipboard: ${error.message}`);
            Events.showToast.emit({
                variant: 'negative',
                content: 'Failed to copy code to clipboard',
            });
        }
    }

    get toolbar() {
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
                    @click="${this.aemAction(this.fetcher.saveFragment, true)}"
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
                    @click="${this.aemAction(this.fetcher.copyFragment)}"
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
                    @click="${this.aemAction(this.fetcher.publishFragment)}"
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
                    @click="${this.aemAction(this.fetcher.unpublishFragment)}"
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
                    @click="${this.aemAction(this.fetcher.deleteFragment)}"
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

    // #endregion
}

customElements.define('merch-card-editor', MerchCardEditor);

export async function editFragment(id, x) {
    /** @type {MerchCardEditor} */
    const editor = document.querySelector('merch-card-editor');
    if (!editor) return;
    return editor.editFragment(id, x);
}
