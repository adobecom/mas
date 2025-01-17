import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../fields/multifield.js';
import '../fields/mnemonic-field.js';
import '../aem/aem-tag-picker-field.js';
import './variant-picker.js';
import StoreController from '../reactivity/store-controller.js';
import Store from '../store.js';

const MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

const merchCardCustomElementPromise = customElements.whenDefined('merch-card');

class MerchCardEditor extends LitElement {
    static properties = {
        disabled: { type: Boolean },
        hasChanges: { type: Boolean },
        updateFragment: { type: Function },
        superWide: { type: Boolean, state: true },
    };

    fragmentStoreController = new StoreController(this, Store.fragments.inEdit);

    constructor() {
        super();
        this.disabled = false;
        this.hasChanges = false;
        this.fragmentStore = null;
        this.updateFragment = null;
        this.superWide = false;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    get fragment() {
        return this.fragmentStoreController.value?.get();
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

    updated() {
        this.toggleFields();
    }

    async toggleFields() {
        if (!this.fragment) return;
        const merchCardCustomElement = await merchCardCustomElementPromise;
        if (!merchCardCustomElement) return;
        this.querySelectorAll('sp-field-group.toggle').forEach((field) => {
            field.style.display = 'none';
        });
        const variant = merchCardCustomElement.getFragmentMapping(
            this.fragment.variant,
        );
        if (!variant) return;
        Object.keys(variant).forEach((key) => {
            const field = this.querySelector(`sp-field-group.toggle#${key}`);
            if (field) field.style.display = 'block';
        });
        this.superWide = variant.size?.includes('super-wide');
    }

    #handleInput(e) {
        this.updateFragment?.(e);
    }

    render() {
        if (this.fragment.model.path !== MODEL_PATH) return nothing;

        const form = Object.fromEntries([
            ...this.fragment.fields.map((f) => [f.name, f]),
        ]);

        return html`
            <sp-field-group id="variant">
                <sp-field-label for="card-variant">Variant</sp-field-label>
                <variant-picker
                    id="card-variant"
                    ?show-all="false"
                    data-field="variant"
                    default-value="${form.variant.values[0]}"
                    @change="${this.#handleVariantChange}"
                    ?disabled=${this.disabled}
                ></variant-picker>
            </sp-field-group>
            <sp-field-group class="toggle" id="size">
                <sp-field-label for="card-size">Size</sp-field-label>
                <sp-picker
                    id="card-size"
                    data-field="size"
                    value="${form.size.values[0]}"
                    @change="${this.updateFragment}"
                    ?disabled=${this.disabled}
                >
                    <sp-menu-item value="">Normal</sp-menu-item>
                    <sp-menu-item value="wide">Wide</sp-menu-item>
                    ${this.superWide
                        ? html`<sp-menu-item value="super-wide"
                              >Super wide</sp-menu-item
                          >`
                        : nothing}
                </sp-picker>
            </sp-field-group>
            <sp-field-group class="toggle" id="title">
                <sp-field-label for="card-title">Title</sp-field-label>
                <sp-textfield
                    placeholder="Enter card title"
                    id="card-title"
                    data-field="cardTitle"
                    value="${form.cardTitle.values[0]}"
                    @input="${this.updateFragment}"
                    ?disabled=${this.disabled}
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="subtitle">
                <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
                <sp-textfield
                    placeholder="Enter card subtitle"
                    id="card-subtitle"
                    data-field="subtitle"
                    value="${form.subtitle.values[0]}"
                    @input="${this.updateFragment}"
                    ?disabled=${this.disabled}
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="badge">
                <sp-field-label for="card-icon">Badge</sp-field-label>
                <sp-textfield
                    placeholder="Enter badge text"
                    id="card-badge"
                    data-field="badge"
                    value="${form.badge.values[0]}"
                    @input="${this.updateFragment}"
                    ?disabled=${this.disabled}
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="mnemonics">
                <sp-field-label for="mnemonic">Mnemonics</sp-field-label>
                <mas-multifield
                    id="mnemonics"
                    .value="${this.mnemonics}"
                    @change="${this.#updateMnemonics}"
                    @input="${this.#updateMnemonics}"
                >
                    <template>
                        <mas-mnemonic-field></mas-mnemonic-field>
                    </template>
                </mas-multifield>
            </sp-field-group>
            <sp-field-group class="toggle" id="backgroundImage">
                <sp-field-label for="card-icon"
                    >Background Image</sp-field-label
                >
                <sp-textfield
                    placeholder="Enter backgroung image URL"
                    id="background-title"
                    data-field="backgroundImage"
                    value="${form.backgroundImage.values[0]}"
                    @input="${this.updateFragment}"
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
                    @input="${this.updateFragment}"
                    ?disabled=${this.disabled}
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" horizontal id="prices">
                <sp-field-label for="horizontal"> Prices </sp-field-label>
                <rte-field
                    inline
                    data-field="prices"
                    default-link-style="primary-outline"
                    @change="${this.updateFragment}"
                    ?readonly=${this.disabled}
                    >${unsafeHTML(form.prices.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-group class="toggle" horizontal id="description">
                <sp-field-label for="horizontal"> Description </sp-field-label>
                <rte-field
                    link
                    data-field="description"
                    default-link-style="secondary-link"
                    @change="${this.updateFragment}"
                    ?readonly=${this.disabled}
                    >${unsafeHTML(form.description.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-group class="toggle" horizontal id="ctas">
                <sp-field-label for="horizontal"> Footer </sp-field-label>
                <rte-field
                    link
                    inline
                    data-field="ctas"
                    default-link-style="primary-outline"
                    @change="${this.updateFragment}"
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
        `;
    }

    #handleVariantChange(e) {
        this.updateFragment(e);
        this.toggleFields();
    }

    #handeTagsChange(e) {
        const value = e.target.getAttribute('value');
        const newTags = value ? value.split(',') : []; // do not overwrite the tags array
        this.fragmentStore.updateField('tags', newTags);
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
