import { html, css, LitElement } from 'lit';
import Store from '../store.js';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasLocalePicker extends LitElement {
    static properties = {
        search: { type: String },
    };

    static styles = css`
        .flag {
            margin-right: 8px;
        }

        sp-popover {
            padding: 8px;
            max-height: 326px;
        }

        sp-search {
            margin-bottom: 8px;
            width: 100%;
        }

        sp-menu {
            overflow-y: auto;
            padding-top: 8px;
        }
    `;

    storeController = new ReactiveController(this, [Store.locale.current]);

    constructor() {
        super();
        this.search = '';
    }

    render() {
        // Filter the locales by name based on the current search string.
        const filteredLocales = Store.locale.data.filter(
            (locale) =>
                locale.code.toLowerCase().includes(this.search.toLowerCase()) ||
                locale.name.toLowerCase().includes(this.search.toLowerCase()),
        );

        // Find the currently selected locale (if any).
        const currentValue = Store.locale.current.get();

        return html`
            <overlay-trigger placement="bottom">
                <!-- The action button that triggers the overlay -->
                <sp-action-button slot="trigger" quiet>
                    Country
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>

                <!-- The popover content: a search field and a list of items -->
                <sp-popover slot="click-content">
                    <sp-search
                        placeholder="Search Locales"
                        .value="${this.search}"
                        @input="${this.handleSearchInput}"
                    ></sp-search>
                    <sp-menu>
                        ${repeat(
                            filteredLocales,
                            (locale) => locale.code,
                            (locale) => html`
                                <sp-menu-item
                                    value="${locale.code}"
                                    ?selected="${locale.code === currentValue}"
                                    @click="${this.handleSelect}"
                                >
                                    <span slot="icon" class="flag"
                                        >${locale.flag}</span
                                    >
                                    ${locale.name} (${locale.code})
                                </sp-menu-item>
                            `,
                        )}
                    </sp-menu>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    /**
     * Updates the search query as the user types.
     */
    handleSearchInput(e) {
        this.search = e.target.value;
    }

    handleSelect(e) {
        const selectedValue =
            e.currentTarget.getAttribute('value') || Store.locale.current.get();
        Store.locale.current.set(selectedValue);
        e.target.closest('overlay-trigger').open = false;
    }
}

customElements.define('mas-locale-picker', MasLocalePicker);
