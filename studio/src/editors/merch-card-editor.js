import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../fields/multifield.js';
import '../fields/mnemonic-field.js';
import Store from '../store.js';
import StoreController from '../reactiveStore/storeController.js';
import { getFragmentStore } from '../storeUtils.js';
import './variant-picker.js';

const MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

export class MerchCardEditor extends LitElement {
    /**
     * @param {int} x Triggering click x position
     * @returns {boolean} Position changed
     */
    static setPosition(x) {
        const newPosition = x > window.innerWidth / 2 ? 'left' : 'right';
        if (newPosition === Store.editorPosition.get()) return false;
        Store.editorPosition.set(newPosition);
        return true;
    }

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.initialFragment = null;
        this.close = this.close.bind(this);
    }

    fragmentInEdit = new StoreController(this, Store.fragments.inEdit);

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.close);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.close);
    }

    update() {
        if (!this.fragmentInEdit.value) this.fragment = null;
        else
            this.fragment = new StoreController(
                this,
                getFragmentStore(this.fragmentInEdit.value),
            );
        super.update();
    }

    close(event) {
        if (event.key !== 'Escape') return;
        if (!this.fragmentInEdit.value) return;
        Store.fragments.inEdit.set(null);
        // this.fragmentStore.data.set(this.initialFragment);
    }

    render() {
        console.log('RERENDER editor card');
        if (!this.fragmentInEdit.value) return nothing;

        const fragment = this.fragment.value;

        if (fragment.model.path !== MODEL_PATH) return nothing;

        const form = Object.fromEntries([
            ...fragment.fields.map((f) => [f.name, f]),
        ]);

        // Set position
        const position = Store.editorPosition.get();
        this.style.setProperty(
            '--editor-left',
            position === 'left' ? '0' : 'inherit',
        );
        this.style.setProperty(
            '--editor-right',
            position === 'right' ? '0' : 'inherit',
        );

        return html`<div id="editor">
            <p>${fragment.path}</p>
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
                @input="${this.updateFragment}"
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
                .value="${fragment.computed?.mnemonics}"
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
            <p>Fragment details (not shown on the card)</p>
            <sp-divider size="s"></sp-divider>
            <sp-field-label for="fragment-title">Fragment Title</sp-field-label>
            <sp-textfield
                placeholder="Enter fragment title"
                id="fragment-title"
                data-field="title"
                value="${fragment.title}"
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
            ></sp-textfield>
        </div>`;
    }

    updateFragment(event) {
        const fieldName = event.target.dataset.field;
        let value = event.target.value || event.detail?.value;
        value = event.target.multiline ? value?.split(',') : [value ?? ''];
        const fragment = this.fragment.value;
        fragment.updateField(fieldName, value);
        this.fragment.store.set(fragment);
        document
            .querySelector(`aem-fragment[fragment="${fragment.id}"]`)
            ?.refresh(false);
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
