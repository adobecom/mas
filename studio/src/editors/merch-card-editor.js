import { html, LitElement, nothing } from 'lit';
import { Reaction } from 'mobx';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

const MODEL_PATH = '/conf/sandbox/settings/dam/cfm/models/merch-card';

class MerchCardEditor extends MobxReactionUpdateCustom(LitElement, Reaction) {
    static properties = {
        fragment: { type: Object },
    };

    createRenderRoot() {
        return this;
    }

    render() {
        if (this.fragment.model.path !== MODEL_PATH) return nothing;
        const form = Object.fromEntries(
            this.fragment.fields.map((f) => [f.name, f]),
        );
        return html` <p>${this.fragment.path}</p>
            <sp-field-label for="card-variant">Variant</sp-field-label>
            <sp-picker
                id="card-variant"
                data-field="variant"
                value="${form.variant.values[0]}"
                @change="${this.updateFragment}"
            >
                <span slot="label">Choose a variant:</span>
                <sp-menu-item value="ccd-action">CCD Action</sp-menu-item>
                <sp-menu-item value="catalog">Catalog</sp-menu-item>
                <sp-menu-item value="special-offers"
                    >Special Offers</sp-menu-item
                >
                <sp-menu-item value="ah">AH</sp-menu-item>
            </sp-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="title"
                value="${form.title.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-icon">Icons</sp-field-label>
            <sp-textfield
                placeholder="Enter icon URLs"
                id="card-icon"
                data-field="icon"
                multiline
                value="${form.icon.values.join(',')}"
                @change="${this.updateFragment}"
            ></sp-textfield>
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
                <rte-editor data-field="prices" @blur="${this.updateFragment}"
                    >${unsafeHTML(form.prices.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor
                    data-field="description"
                    @blur="${this.updateFragment}"
                    >${unsafeHTML(form.description.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Footer </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="ctas" @blur="${this.updateFragment}"
                    >${unsafeHTML(form.ctas.values[0])}</rte-editor
                >
            </sp-field-group>`;
    }

    updateFragment(e) {
        this.dispatchEvent(new CustomEvent('update-fragment', { detail: e }));
    }
}

customElements.define('merch-card-editor', MerchCardEditor);
