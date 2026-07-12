import { LitElement, html, css } from 'lit';
import '../rte/rte-field.js';

class MasRteFieldItem extends LitElement {
    static properties = {
        label: { type: String },
        osi: { type: String },
    };

    static styles = css`
        :host {
            display: block;
        }

        .wrapper {
            position: relative;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 8px;
            padding: 12px 44px 12px 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .delete-btn {
            position: absolute;
            top: 6px;
            right: 6px;
        }

        sp-textfield {
            width: 100%;
        }
    `;

    _value = '';

    get value() {
        const item = {};
        if (this._value) item.value = this._value;
        if (this.label) item.label = this.label;
        return item;
    }

    set value(v) {
        if (typeof v === 'string') {
            const old = this._value;
            this._value = v;
            this.requestUpdate('_value', old);
        }
    }

    static get observedAttributes() {
        return [...super.observedAttributes, 'value'];
    }

    attributeChangedCallback(name, old, newVal) {
        if (name === 'value') {
            this.value = newVal ?? '';
        } else {
            super.attributeChangedCallback(name, old, newVal);
        }
    }

    constructor() {
        super();
        this.label = '';
        this.osi = '';
    }


    render() {
        return html`
            <div class="wrapper">
                <sp-action-button class="delete-btn" quiet @click=${this.#handleDelete}>
                    <sp-icon-delete slot="icon"></sp-icon-delete>
                </sp-action-button>
                <sp-textfield
                    placeholder="Enter title"
                    .value="${this.label || ''}"
                    @input=${(e) => e.stopPropagation()}
                    @change=${this.#handleLabelChange}
                ></sp-textfield>
                <rte-field
                    styling
                    link
                    upt-link
                    list
                    mnemonic
                    icon
                    default-link-style="secondary-link"
                    .osi=${this.osi || ''}
                    .value=${this._value || ''}
                    @change=${this.#handleRteChange}
                    @input=${this.#handleRteChange}
                ></rte-field>
            </div>
        `;
    }

    #handleDelete = () => {
        this.dispatchEvent(new CustomEvent('delete-field', { bubbles: true, composed: true }));
    };

    #handleLabelChange = (e) => {
        e.stopPropagation();
        this.label = e.target.value;
        this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
    };

    #handleRteChange = (e) => {
        e.stopPropagation();
        this._value = e.target.value;
        this.dispatchEvent(new CustomEvent(e.type, { bubbles: true, composed: true }));
    };
}

customElements.define('mas-rte-field-item', MasRteFieldItem);
