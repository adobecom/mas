import { html, LitElement, nothing } from 'lit';
import { EVENT_INPUT } from '../constants.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import Store from '../store.js';
import { MasRepository } from '../mas-repository.js';

export class AddonField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        placeholderKey: { type: String },
        editable: { type: Boolean, state: true },
        indicatorTemplate: { attribute: false },
    };

    addons = Store.placeholders.addons.data;
    loading = Store.placeholders.addons.loading;
    reactiveController = new ReactiveController(this, [this.addons, this.loading]);

    constructor() {
        super();
        this.id = '';
        this.label = '';
        this.value = '';
        this.disabled = false;
        this.editable = false;
        this.indicatorTemplate = nothing;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.#loadAddonPlaceholders();
    }

    updated(changedProperties) {
        if (changedProperties.has('placeholderKey')) {
            this.#loadAddonPlaceholders();
        }
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    #loadAddonPlaceholders() {
        if (!this.placeholderKey) return;
        this.repository?.loadAddonPlaceholders();
    }

    #handleToggle(e) {
        this.editable = e.target.checked;
        if (this.editable) {
            this.repository.loadAddonPlaceholders();
        } else {
            this.value = '';
        }
        this.dispatchInputEvent();
    }

    #handleChange(e) {
        this.value = e.target.value;
        this.dispatchInputEvent(this.value);
    }

    dispatchInputEvent() {
        const inputEvent = new CustomEvent(EVENT_INPUT, {
            bubbles: true,
            composed: true,
            detail: this,
        });
        this.dispatchEvent(inputEvent);
    }

    get isEditable() {
        return this.placeholderKey || this.editable;
    }

    set value(value) {
        this.placeholderKey = value?.replace(/{{|}}/g, '') ?? '';
    }

    get value() {
        return `{{${this.placeholderKey}}}`;
    }

    get combobox() {
        if (!this.editable && !this.placeholderKey) return nothing;
        return html` <sp-combobox
            id="addon-field"
            .options="${this.addons.value}"
            .pending="${this.loading.value}"
            .value="${this.placeholderKey}"
            @change="${this.#handleChange}"
            placeholder="Select an addon placeholder"
        ></sp-combobox>`;
    }

    render() {
        return html`
            <sp-field-group>
                <div class="field-row">
                    <sp-switch size="m" .checked="${this.isEditable}" @change="${this.#handleToggle}">${this.label}</sp-switch>
                    ${this.indicatorTemplate}
                </div>
                <!-- style hack -->
                <span></span>
                ${this.combobox}
            </sp-field-group>
        `;
    }
}

customElements.define('mas-addon-field', AddonField);
