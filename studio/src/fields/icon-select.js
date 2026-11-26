import { LitElement, html, css, nothing } from 'lit';
import { ICON_LIBRARY, renderSpIcon } from '../constants/icon-library.js';

class MasIconSelect extends LitElement {
    static properties = {
        value: { type: String },
        variant: { type: String },
        placeholder: { type: String },
        choices: { attribute: false },
        open: { type: Boolean, state: true },
        query: { type: String, state: true },
    };

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }

        .trigger {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            min-height: 32px;
            padding: 4px 12px;
            background: var(--spectrum-gray-50, #fff);
            border: 1px solid var(--spectrum-gray-400, #b1b1b1);
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            line-height: 18px;
            color: var(--spectrum-gray-900, #131313);
            text-align: left;
        }

        .trigger:focus-visible {
            outline: 2px solid var(--spectrum-blue-600, #2680eb);
            outline-offset: 2px;
        }

        .trigger sp-icon-chevron-down {
            margin-left: auto;
        }

        .placeholder {
            color: var(--spectrum-gray-600, #6e6e6e);
        }

        .panel {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 10;
            box-sizing: border-box;
            margin-top: 4px;
            padding: 8px;
            background: #fff;
            border: none;
            border-radius: 10px;
            box-shadow:
                0 4px 12px rgba(0, 0, 0, 0.08),
                0 2px 6px rgba(0, 0, 0, 0.04),
                0 0 2px rgba(0, 0, 0, 0.12);
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        sp-search {
            width: 100%;
            margin-bottom: 6px;
        }

        .list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            max-height: var(--mas-icon-select-list-max-height, 168px);
            overflow-y: auto;
        }

        .icon-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            line-height: 18px;
            font-weight: 500;
            color: var(--spectrum-gray-900, #131313);
        }

        .icon-item:hover,
        .icon-item:focus-visible {
            background: var(--spectrum-gray-200, #e9e9e9);
        }
    `;

    constructor() {
        super();
        this.value = '';
        this.variant = '';
        this.placeholder = 'Select icon';
        this.choices = ICON_LIBRARY;
        this.open = false;
        this.query = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('keydown', this.#handleHostKeydown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('keydown', this.#handleHostKeydown);
        document.removeEventListener('pointerdown', this.#handleOutside);
    }

    get matches() {
        const needle = this.query.trim().toLowerCase();
        return this.choices.filter((icon) => icon.name.toLowerCase().includes(needle));
    }

    /** Product logos are image URLs; every other choice is a library icon id. */
    renderChoiceIcon(choice) {
        if (choice.product) return html`<img src=${choice.id} alt="" width="20" height="20" />`;
        return renderSpIcon(choice.id, this.variant);
    }

    focus() {
        this.shadowRoot.querySelector('.trigger').focus();
    }

    #handleHostKeydown = (event) => {
        if (event.key === 'Escape' && this.open) {
            event.stopPropagation();
            this.#close();
        }
    };

    #handleOutside = (event) => {
        if (!event.composedPath().includes(this)) this.#close();
    };

    #toggle() {
        if (this.open) {
            this.#close();
            return;
        }
        this.open = true;
        document.addEventListener('pointerdown', this.#handleOutside);
    }

    #close() {
        this.open = false;
        this.query = '';
        document.removeEventListener('pointerdown', this.#handleOutside);
    }

    #select(id) {
        this.value = id;
        this.#close();
        this.dispatchEvent(new CustomEvent('change', { detail: { id }, bubbles: true, composed: true }));
    }

    #handleKeydown(event, id) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.#select(id);
    }

    get selectedIcon() {
        return this.choices.find((icon) => icon.id === this.value);
    }

    get triggerTemplate() {
        const selected = this.selectedIcon;
        return html`
            <button type="button" class="trigger" aria-haspopup="listbox" aria-expanded=${this.open} @click=${this.#toggle}>
                ${selected
                    ? html`${this.renderChoiceIcon(selected)}<span>${selected.name}</span>`
                    : html`<span class="placeholder">${this.placeholder}</span>`}
                <sp-icon-chevron-down></sp-icon-chevron-down>
            </button>
        `;
    }

    get panelTemplate() {
        return html`
            <div class="panel">
                <sp-search
                    placeholder="Search icon"
                    label="Search icon"
                    .value=${this.query}
                    @input=${(event) => (this.query = event.target.value ?? '')}
                    @submit=${(event) => event.preventDefault()}
                ></sp-search>
                <div class="list" role="listbox">
                    ${this.matches.map(
                        (icon) => html`
                            <div
                                class="icon-item"
                                tabindex="0"
                                role="option"
                                aria-selected=${icon.id === this.value ? 'true' : 'false'}
                                @click=${() => this.#select(icon.id)}
                                @keydown=${(event) => this.#handleKeydown(event, icon.id)}
                            >
                                ${this.renderChoiceIcon(icon)}${icon.name}
                            </div>
                        `,
                    )}
                </div>
            </div>
        `;
    }

    render() {
        return html`${this.triggerTemplate}${this.open ? this.panelTemplate : nothing}`;
    }
}

customElements.define('mas-icon-select', MasIconSelect);
