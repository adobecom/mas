import { LitElement, html, css, nothing } from 'lit';

const GRID_SIZE = 12;

class MasProductPicker extends LitElement {
    static properties = {
        items: { type: Array },
        renderIcon: { attribute: false },
        recentIds: { type: Array },
        selectedId: { type: String },
        query: { type: String, state: true },
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
        }

        .search-area {
            position: relative;
        }

        sp-search {
            width: 100%;
        }

        .label {
            margin: 16px 0 8px;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            color: #222;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            row-gap: 8px;
        }

        .grid .icon-item {
            box-sizing: border-box;
            width: 100%;
            max-width: 74px;
            justify-self: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 4px 0;
            border-radius: 8px;
            cursor: pointer;
            outline: 2px solid transparent;
            font-size: 11px;
            line-height: 14px;
            font-weight: 500;
            color: #292929;
            text-align: center;
            word-break: break-word;
        }

        .grid .icon-item[aria-selected='true'] {
            outline-color: var(--spectrum-blue-600, #2680eb);
        }

        .grid .icon-item img {
            width: 48px;
            height: 48px;
            object-fit: contain;
        }

        .dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 10;
            box-sizing: border-box;
            max-height: 294px;
            overflow-y: auto;
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

        .dropdown .icon-item {
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

        .dropdown .icon-item:hover,
        .dropdown .icon-item:focus-visible {
            background: var(--spectrum-gray-200, #e9e9e9);
        }

        .dropdown .icon-item img {
            width: 40px;
            height: 40px;
            object-fit: contain;
        }
    `;

    constructor() {
        super();
        this.items = [];
        this.recentIds = [];
        this.selectedId = '';
        this.query = '';
        this.renderIcon = () => nothing;
    }

    get recentItems() {
        const byId = new Map(this.items.map((item) => [item.id, item]));
        return this.recentIds.map((id) => byId.get(id)).filter(Boolean);
    }

    get defaultItems() {
        const recents = this.recentItems;
        const recentSet = new Set(recents.map((item) => item.id));
        const base = [...recents, ...this.items.filter((item) => !recentSet.has(item.id))].slice(0, GRID_SIZE);
        const selected = this.items.find((item) => item.id === this.selectedId);
        if (!selected || base.includes(selected)) return base;
        return [selected, ...base.slice(0, GRID_SIZE - 1)];
    }

    get matches() {
        const needle = this.query.trim().toLowerCase();
        return this.items.filter((item) => item.name.toLowerCase().includes(needle));
    }

    #select(id, fromDropdown) {
        if (fromDropdown) this.query = '';
        this.dispatchEvent(new CustomEvent('item-select', { detail: { id }, bubbles: true, composed: true }));
    }

    #handleKeydown(event, id, fromDropdown) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.#select(id, fromDropdown);
    }

    #handleInput(event) {
        this.query = event.target.value ?? '';
    }

    #handleSubmit(event) {
        event.preventDefault();
    }

    get searchTemplate() {
        return html`
            <sp-search
                placeholder="Search product images"
                .value=${this.query}
                @input=${this.#handleInput}
                @submit=${this.#handleSubmit}
            ></sp-search>
        `;
    }

    get gridTemplate() {
        const label = this.recentItems.length ? 'Recently used:' : 'Products:';
        return html`
            <div class="label">${label}</div>
            <div class="grid" role="listbox">
                ${this.defaultItems.map(
                    (item) => html`
                        <div
                            class="icon-item"
                            tabindex="0"
                            role="option"
                            aria-selected=${item.id === this.selectedId ? 'true' : 'false'}
                            @click=${() => this.#select(item.id, false)}
                            @keydown=${(event) => this.#handleKeydown(event, item.id, false)}
                        >
                            ${this.renderIcon(item)}${item.name}
                        </div>
                    `,
                )}
            </div>
        `;
    }

    get dropdownTemplate() {
        return html`
            <div class="dropdown" role="listbox">
                ${this.matches.map(
                    (item) => html`
                        <div
                            class="icon-item"
                            tabindex="0"
                            role="option"
                            @click=${() => this.#select(item.id, true)}
                            @keydown=${(event) => this.#handleKeydown(event, item.id, true)}
                        >
                            ${this.renderIcon(item)}${item.name}
                        </div>
                    `,
                )}
            </div>
        `;
    }

    render() {
        const showDropdown = this.query.trim() !== '' && this.matches.length > 0;
        return html`
            <div class="search-area">${this.searchTemplate} ${showDropdown ? this.dropdownTemplate : nothing}</div>
            ${this.gridTemplate}
        `;
    }
}

customElements.define('mas-product-picker', MasProductPicker);
