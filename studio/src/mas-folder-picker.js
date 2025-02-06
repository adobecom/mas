import { html, css, LitElement } from 'lit';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';

export class MasFolderPicker extends LitElement {
    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 200px;
        }

        .picker-button {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 4px 12px;
            border-radius: 4px;
            background-color: transparent;
            cursor: pointer;
            box-sizing: border-box;
        }

        .picker-button:hover {
            border-color: var(--spectrum-global-color-gray-500, #6e6e6e);
        }

        .button-content {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-grow: 1;
            min-width: 0;
        }

        .button-content span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .icon {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
        }

        .chevron {
            width: 16px;
            height: 16px;
            color: var(--spectrum-alias-text-color, #000);
            flex-shrink: 0;
        }

        sp-popover {
            position: absolute;
            z-index: 1;
            width: 100%;
            margin-top: 4px;
            box-sizing: border-box;
            background-color: transparent;
            border: none;
        }

        sp-menu {
            width: 100%;
            max-height: none;
            overflow: visible;
            background-color: var(--spectrum-white, #fff);
        }

        sp-menu-item[selected] {
            font-weight: bold;
        }

        sp-menu-item[selected] {
            font-weight: bold;
            &::after {
                display: none;
            }
        }
    `;

    static properties = {
        open: { state: true },
    };

    constructor() {
        super();
        this.open = false;
    }

    foldersLoaded = new StoreController(this, Store.folders.loaded);
    folders = new StoreController(this, Store.folders.data);
    search = new StoreController(this, Store.search);
    selecting = new StoreController(this, Store.selecting);

    toggleDropdown() {
        this.open = !this.open;
    }

    closeDropdown() {
        this.open = false;
    }

    handleSelection(event) {
        const value = event.target.value;
        Store.search.update((prev) => ({ ...prev, path: value }));
        this.closeDropdown();
    }

    render() {
        const options = this.folders.value.map((folder) => ({
            value: folder.toLowerCase(),
            label: folder.toUpperCase(),
        }));
        const currentFolder = options.find(
            (option) => option.value === this.search.value.path,
        );
        return html`
            <div
                class="picker-button"
                @click=${this.toggleDropdown}
                role="button"
                aria-haspopup="true"
                aria-expanded=${this.open ? 'true' : 'false'}
                tabindex="0"
                @keydown=${this.handleKeyDown}
                @focusout=${this.handleFocusOut}
            >
                <span class="button-content">
                    <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        x="0"
                        y="0"
                        viewBox="0 0 30 26"
                        width="18px"
                        xml:space="preserve"
                        role="img"
                        aria-label="Adobe"
                    >
                        <path
                            fill="#292929"
                            d="M19 0h11v26zM11.1 0H0v26zM15 9.6L22.1 26h-4.6l-2.1-5.2h-5.2z"
                        ></path>
                    </svg>
                    <span class="surface-selection"
                        >${currentFolder?.label}</span
                    >
                </span>
                <sp-icon-chevron-down
                    dir="ltr"
                    class="chevron"
                ></sp-icon-chevron-down>
            </div>
            ${this.open
                ? html`
                      <sp-popover placement="bottom-start" open>
                          <sp-menu
                              @change=${this.handleSelection}
                              selects="single"
                              role="listbox"
                          >
                              ${options.map(({ value, label }) => {
                                  const selected =
                                      this.search.value.path === value;
                                  return html`
                                      <sp-menu-item
                                          .value=${value}
                                          ?selected=${selected}
                                      >
                                          ${label}
                                      </sp-menu-item>
                                  `;
                              })}
                          </sp-menu>
                      </sp-popover>
                  `
                : ''}
        `;
    }

    handleFocusOut(event) {
        if (this.shadowRoot.contains(event.relatedTarget)) {
            return;
        } else {
            this.closeDropdown();
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggleDropdown();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.open = true;
            this.updateComplete.then(() => {
                const firstMenuItem =
                    this.renderRoot.querySelector('sp-menu-item');
                if (firstMenuItem) {
                    firstMenuItem.focus();
                }
            });
        } else if (event.key === 'Escape' || event.key === 'Tab') {
            this.closeDropdown();
        }
    }
}

customElements.define('mas-folder-picker', MasFolderPicker);
