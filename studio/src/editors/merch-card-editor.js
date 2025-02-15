import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../fields/multifield.js';
import '../fields/mnemonic-field.js';
import '../aem/aem-tag-picker-field.js';
import './variant-picker.js';

const MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

const merchCardCustomElementPromise = customElements.whenDefined('merch-card');

class MerchCardEditor extends LitElement {
    static properties = {
        fragment: { type: Object, attribute: false },
        fragmentStore: { type: Object, attribute: false },
        updateFragment: { type: Function },
        availableSizes: { type: Array, state: true },
    };

    constructor() {
        super();
        this.updateFragment = null;
        this.availableSizes = ['normal'];
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

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('fragment')) {
            this.#updateAvailableSizes();
            this.toggleFields();
        }
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
        Object.entries(variant).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length === 0) return;
            const field = this.querySelector(`sp-field-group.toggle#${key}`);
            if (field) field.style.display = 'block';
        });
    }

    render() {
        if (!this.fragment) return nothing;
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
                ></variant-picker>
            </sp-field-group>
            <sp-field-group class="toggle" id="size">
                <sp-field-label for="card-size">Size</sp-field-label>
                <sp-picker
                    id="card-size"
                    data-field="size"
                    value="${form.size.values[0] || 'normal'}"
                    data-default-value="normal"
                    @change="${this.updateFragment}"
                >
                    ${(this.availableSizes || []).map(
                        (size) => html`
                            <sp-menu-item value="${size}"
                                >${this.#formatSizeName(size)}</sp-menu-item
                            >
                        `,
                    )}
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
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="badge">
                <sp-field-label for="card-badge">Badge</sp-field-label>
                <sp-textfield
                    placeholder="Enter badge text"
                    id="card-badge"
                    data-field="badge"
                    value="${form.badge.values[0]}"
                    @input="${this.updateFragment}"
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="mnemonics">
                <sp-field-label for="mnemonics">Mnemonics</sp-field-label>
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
                <sp-field-label for="background-image"
                    >Background Image</sp-field-label
                >
                <sp-textfield
                    placeholder="Enter background image URL"
                    id="background-image"
                    data-field="backgroundImage"
                    value="${form.backgroundImage.values[0]}"
                    @input="${this.updateFragment}"
                ></sp-textfield>
                <sp-field-label for="background-image-alt-text"
                    >Background Image Alt Text</sp-field-label
                >
                <sp-textfield
                    placeholder="Enter background image Alt Text"
                    id="background-image-alt-text"
                    data-field="backgroundImageAltText"
                    value="${form.backgroundImageAltText.values[0]}"
                    @input="${this.updateFragment}"
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="prices">
                <sp-field-label for="prices">Prices</sp-field-label>
                <rte-field
                    id="prices"
                    inline
                    link
                    data-field="prices"
                    default-link-style="primary-outline"
                    @change="${this.updateFragment}"
                    >${unsafeHTML(form.prices.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-group class="toggle" id="description">
                <sp-field-label for="description">Description</sp-field-label>
                <rte-field
                    id="description"
                    link
                    data-field="description"
                    default-link-style="secondary-link"
                    @change="${this.updateFragment}"
                    >${unsafeHTML(form.description.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-group class="toggle" id="ctas">
                <sp-field-label for="ctas">Footer</sp-field-label>
                <rte-field
                    id="ctas"
                    link
                    inline
                    data-field="ctas"
                    default-link-style="primary-outline"
                    @change="${this.updateFragment}"
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
        this.#updateAvailableSizes();
        this.toggleFields();
    }

    #handeTagsChange(e) {
        const value = e.target.getAttribute('value');
        const newTags = value ? value.split(',') : []; // do not overwrite the tags array
        this.fragmentStore.updateField('tags', newTags);
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
    }

    #formatSizeName(size) {
        return size
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async #updateAvailableSizes() {
        if (!this.fragment) return;
        const merchCardCustomElement = await merchCardCustomElementPromise;
        const variant = merchCardCustomElement?.getFragmentMapping(
            this.fragment.variant,
        );
        this.availableSizes = ['normal', ...(variant?.size || ['normal'])];
    }
}

customElements.define('merch-card-editor', MerchCardEditor);
