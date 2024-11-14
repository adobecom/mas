import { css, html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../fields/multifield.js';
import '../fields/mnemonic-field.js';

const MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

class MerchCardEditor extends LitElement {
    static properties = {
        fragment: { type: Object },
    };

    static styles = css`
        aem-tag-picker-field {
            margin-top: 25px;
        }
    `;

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('keydown', this.#handleKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('keydown', this.#handleKeyDown);
    }

    #handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.stopPropagation();
        }
    }

    render() {
        if (this.fragment.model.path !== MODEL_PATH) return nothing;
        const form = Object.fromEntries([
            ...this.fragment.fields.map((f) => [f.name, f]),
        ]);
        return html`
            <p>${this.fragment.path}</p>
            <sp-field-label for="card-variant">Variant</sp-field-label>
            <variant-picker
                id="card-variant"
                ?show-all="false"
                data-field="variant"
                default-value="${form.variant.values[0]}"
                @change="${this.updateFragment}"
            ></variant-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="cardTitle"
                value="${form.cardTitle.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
            <sp-textfield
                placeholder="Enter card subtitle"
                id="card-subtitle"
                data-field="subtitle"
                value="${form.subtitle.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-size">Size</sp-field-label>
            <sp-textfield
                placeholder="Enter card size"
                id="card-size"
                data-field="size"
                value="${form.size.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-icon">Badge</sp-field-label>
            <sp-textfield
                placeholder="Enter badge text"
                id="card-badge"
                data-field="badge"
                value="${form.badge.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="mnemonic">Mnemonics</sp-field-label>
            <mas-multifield
                id="mnemonic"
                .value="${this.fragment.computed?.mnemonics}"
                @change="${this.updateMnemonics}"
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
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="horizontal"> Prices </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-field
                    inline
                    data-field="prices"
                    default-link-style="primary-outline"
                    @change="${this.updateFragment}"
                    >${unsafeHTML(form.prices.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-field
                    link
                    data-field="description"
                    default-link-style="secondary-link"
                    @change="${this.updateFragment}"
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

    #handeTagsChange(e) {
        const value = e.target.getAttribute('value');
        this.fragment.newTags = value ? value.split(',') : []; // do not overwrite the tags array
        this.fragment.updateField('tags', this.fragment.newTags);
    }

    updateFragment(e) {
        this.dispatchEvent(new CustomEvent('update-fragment', { detail: e }));
    }

    updateMnemonics(e) {
        const mnemonicIcon = [];
        const mnemonicAlt = [];
        const mnemonicLink = [];
        e.target.value.forEach(({ icon, alt, link }) => {
            mnemonicIcon.push(icon ?? '');
            mnemonicAlt.push(alt ?? '');
            mnemonicLink.push(link ?? '');
        });
        this.fragment.updateField('mnemonicIcon', mnemonicIcon);
        this.fragment.updateField('mnemonicAlt', mnemonicAlt);
        this.fragment.updateField('mnemonicLink', mnemonicLink);
        this.dispatchEvent(new CustomEvent('refresh-fragment'));
    }
}

customElements.define('merch-card-editor', MerchCardEditor);
