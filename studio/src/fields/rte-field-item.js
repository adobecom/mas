import { LitElement, html, css } from 'lit';
import '../rte/rte-field.js';
import { confirmation } from '../mas-confirm-dialog.js';

class MasRteFieldItem extends LitElement {
    static properties = {
        label: { type: String },
        osi: { type: String },
        _labelLocked: { type: Boolean, state: true },
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
        this._labelLocked = false;
    }

    willUpdate(changed) {
        // Lock the label field whenever an external label value arrives.
        if (changed.has('label') && this.label) {
            this._labelLocked = true;
        }
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
                    ?readonly=${this._labelLocked}
                    @click=${this.#handleLabelClick}
                    @input=${(e) => e.stopPropagation()}
                    @change=${this.#handleLabelChange}
                ></sp-textfield>
                <rte-field
                    styling
                    link
                    list
                    default-link-style="secondary-link"
                    .osi=${this.osi || ''}
                    .value=${this._value || ''}
                    @change=${this.#handleRteChange}
                    @input=${this.#handleRteChange}
                ></rte-field>
                <!-- upt-link, mnemonic, icon not supported yet in custom fields -->
            </div>
        `;
    }

    #handleDelete = () => {
        this.dispatchEvent(new CustomEvent('delete-field', { bubbles: true, composed: true }));
    };

    #handleLabelClick = async (e) => {
        if (!this._labelLocked) return;
        e.preventDefault();
        const confirmed = await confirmation({
            variant: 'warning',
            title: 'Rename custom field',
            content: `"${this.label}" is used as the key in any documents that reference this field. Renaming it will break those references. Are you sure?`,
            confirmLabel: 'Rename',
            cancelLabel: 'Cancel',
        });
        if (!confirmed) return;
        this._labelLocked = false;
        await this.updateComplete;
        this.shadowRoot.querySelector('sp-textfield')?.focus();
    };

    #handleLabelChange = (e) => {
        e.stopPropagation();
        this.label = e.target.value;
        if (this.label) this._labelLocked = true;
        this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
    };

    #handleRteChange = (e) => {
        e.stopPropagation();
        this._value = e.target.value;
        this.dispatchEvent(new CustomEvent(e.type, { bubbles: true, composed: true }));
    };
}

customElements.define('mas-rte-field-item', MasRteFieldItem);
