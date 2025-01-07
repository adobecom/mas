import { html, nothing } from 'lit';
import { FragmentEditorBase } from '../fragment-editor-base.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../fields/multifield.js';
import '../fields/mnemonic-field.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import '../aem/aem-tag-picker-field.js';
import './variant-picker.js';
import '../editor-panel.js';

const MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

class MerchCardEditor extends FragmentEditorBase {
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
        this.close = this.close.bind(this);
        this.discardChanges = this.discardChanges.bind(this);
        this.refresh = this.refresh.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    get mnemonics() {
        if (!this.fragment) return [];

        const mnemonicIcon =
            this.fragment.fields.find((f) => f.name === 'mnemonicIcon')
                ?.values ?? [];
        const mnemonicAlt =
            this.fragment.fields.find((f) => f.name === 'mnemonicAlt')
                ?.values ?? [];
        const mnemonicLink =
            this.fragment.fields.find((f) => f.name === 'mnemonicLink')
                ?.values ?? [];
        return (
            mnemonicIcon?.map((icon, index) => ({
                icon,
                alt: mnemonicAlt[index] ?? '',
                link: mnemonicLink[index] ?? '',
            })) ?? []
        );
    }

    render() {
        if (this.loading)
            return html`<div id="editor">
                <sp-progress-circle indeterminate size="l"></sp-progress-circle>
            </div>`;

        if (this.refreshing || !this.fragment) return nothing;

        if (this.fragment.model.path !== MODEL_PATH) return nothing;

        const form = Object.fromEntries([
            ...this.fragment.fields.map((f) => [f.name, f]),
        ]);

        return html`<div id="editor">
            <editor-panel
                .fragment=${this.fragment}
                .source=${this.repository}
                .bucket=${this.bucket}
                .showToast=${this.showToast}
                ?disabled=${this.disabled}
                ?hasChanges=${this.hasChanges}
            ></editor-panel>
            <sp-field-label for="card-variant">Variant</sp-field-label>
            <variant-picker
                id="card-variant"
                ?show-all="false"
                data-field="variant"
                default-value="${form.variant.values[0]}"
                @input="${this.#updateFragment}"
                @change="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></variant-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="cardTitle"
                value="${form.cardTitle.values[0]}"
                @input="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
            <sp-textfield
                placeholder="Enter card subtitle"
                id="card-subtitle"
                data-field="subtitle"
                value="${form.subtitle.values[0]}"
                @input="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="card-size">Size</sp-field-label>
            <sp-textfield
                placeholder="Enter card size"
                id="card-size"
                data-field="size"
                value="${form.size.values[0]}"
                @input="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="card-icon">Badge</sp-field-label>
            <sp-textfield
                placeholder="Enter badge text"
                id="card-badge"
                data-field="badge"
                value="${form.badge.values[0]}"
                @input="${this.#updateFragment}"
                ?disabled=${this.disabled}
            ></sp-textfield>
            <sp-field-label for="mnemonic">Mnemonics</sp-field-label>
            <mas-multifield
                id="mnemonic"
                .value="${this.mnemonics}"
                @change="${this.#updateMnemonics}"
                @input="${this.#updateMnemonics}"
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
                @input="${this.#updateFragment}"
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
                @input="${this.#updateFragment}"
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
                value="${this.fragment.tags.map((tag) => tag.id).join(',')}"
                @change=${this.#handeTagsChange}
            ></aem-tag-picker-field>
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

    #updateMnemonics(event) {
        const mnemonicIcon = [];
        const mnemonicAlt = [];
        const mnemonicLink = [];
        event.target.value.forEach(({ icon, alt, link }) => {
            mnemonicIcon.push(icon ?? '');
            mnemonicAlt.push(alt ?? '');
            mnemonicLink.push(link ?? '');
        });
        const fragment = this.fragmentStore.get();
        fragment.updateField('mnemonicIcon', mnemonicIcon);
        fragment.updateField('mnemonicAlt', mnemonicAlt);
        fragment.updateField('mnemonicLink', mnemonicLink);
        this.fragmentStore.set(fragment);
        this.hasChanges = true;
    }
}

customElements.define('merch-card-editor', MerchCardEditor);

/**
 * @returns {MerchCardEditor}
 */
export function getMerchCardEditor() {
    return document.querySelector('merch-card-editor');
}

/**
 * @param {FragmentStore} store
 * @param {number | undefined} x - The clientX value of the mouse event (used for positioning - optional)
 */
export async function editFragment(store, x) {
    const editor = getMerchCardEditor();
    editor.editFragment(store, x);
}
