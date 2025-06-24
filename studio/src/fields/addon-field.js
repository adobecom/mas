import { css, html, LitElement, nothing } from 'lit';
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
    }

    static get styles() {
        return css`
            :host {
                display: block;
                --spectrum-fieldgroup-margin: 0;
            }

            div {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            sp-combobox {
                width: 100%;
                margin-block-end: 16px;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this.repository.loadAddonPlaceholders();
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    #handleToggle(e) {
        this.editable = e.target.checked;
        if (!this.editable) this.value = '';
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
                <div>
                    <sp-field-label for="addon-field">${this.label}</sp-field-label>
                    <sp-switch size="m" .checked="${this.isEditable}" @change="${this.#handleToggle}"></sp-switch>
                </div>
                <!-- style hack -->
                <span></span>
                ${this.combobox}
            </sp-field-group>
        `;
    }
}

customElements.define('mas-addon-field', AddonField);
