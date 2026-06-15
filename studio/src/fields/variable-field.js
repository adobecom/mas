import { html, css, LitElement } from 'lit';

/**
 * A single key:value row for use inside mas-multifield.
 * Stores its combined value as the string "key:value".
 * Splits on the first colon so values may contain colons (e.g. URLs).
 */
class MasVariableField extends LitElement {
    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        sp-textfield {
            flex: 1;
            min-width: 0;
        }
    `;

    static properties = {
        key: { state: true },
        value: { state: true },
    };

    static get observedAttributes() {
        return [...super.observedAttributes, 'value'];
    }

    constructor() {
        super();
        this.key = '';
        this.value = '';
    }

    // mas-multifield sets 'value' via setAttribute — parse into key/val here.
    attributeChangedCallback(name, oldVal, newVal) {
        super.attributeChangedCallback(name, oldVal, newVal);
        if (name === 'value') {
            const s = newVal ?? '';
            const colon = s.indexOf(':');
            this.key = colon >= 0 ? s.slice(0, colon) : s;
            this.value = colon >= 0 ? s.slice(colon + 1) : '';
        }
    }

    get value() {
        return `${this.key}:${this.value}`;
    }

    #onKeyInput(e) {
        e.stopPropagation();
        this.key = e.target.value;
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }

    #onValInput(e) {
        e.stopPropagation();
        this.value = e.target.value;
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }

    #delete() {
        this.dispatchEvent(new CustomEvent('delete-field', { bubbles: true, composed: true }));
    }

    render() {
        return html`
            <sp-textfield placeholder="Key" .value=${this.key} @input=${this.#onKeyInput}></sp-textfield>
            <sp-textfield placeholder="Value" .value=${this.value} @input=${this.#onValInput}></sp-textfield>
            <sp-action-button quiet @click=${this.#delete}>
                <sp-icon-delete slot="icon" label="Remove"></sp-icon-delete>
            </sp-action-button>
        `;
    }
}

customElements.define('mas-variable-field', MasVariableField);
