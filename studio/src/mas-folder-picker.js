import { html, css, LitElement } from 'lit';

export class MasFolderPicker extends LitElement {
    static properties = {
        value: { type: String },
        options: { type: Array },
        open: { type: Boolean },
        label: { type: String },
    };

    constructor() {
        super();
        this.options = [];
        this.value = '';
        this.label = '';
        this.open = false;

        this.handleTopFolders = this.handleTopFolders.bind(this);
    }

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

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('top-folders-loaded', this.handleTopFolders);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Remove the event listener
        document.removeEventListener(
            'top-folders-loaded',
            this.handleTopFolders,
        );
    }

    handleTopFolders(event) {
        const { topFolders } = event.detail;

        this.options = topFolders.map((folder) => ({
            value: folder.toLowerCase(),
            label: folder.toUpperCase(),
        }));

        if (this.options.length > 0) {
            this.value = this.options[0].value;
            this.label = this.options[0].label;
        }

        this.requestUpdate();
    }

    firstUpdated() {
        const spMenu = this.shadowRoot.querySelector('sp-menu');
        if (spMenu) {
            spMenu.addEventListener(
                'sp-announce-selected',
                this.handleSelection.bind(this),
            );
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            const spMenu = this.shadowRoot.querySelector('sp-menu');
            if (spMenu) {
                spMenu.addEventListener(
                    'folder-change',
                    this.handleSelection.bind(this),
                );
            }
        }
    }

    toggleDropdown() {
        this.open = !this.open;
    }

    closeDropdown() {
        this.open = false;
    }

    get source() {
        return document.querySelector('aem-fragments');
    }

    handleSelection(event) {
        const spMenu = event.target;
        this.value = spMenu.value;
        const selectedOption = this.options.find(
            (option) => option.value === this.value,
        );
        this.label = selectedOption ? selectedOption.label : '';
        this.closeDropdown();
        this.dispatchEvent(
            new CustomEvent('folder-change', {
                detail: { value: this.value, label: this.label },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`
            <div
                class="picker-button"
                @click=${this.toggleDropdown}
                role="button"
                aria-haspopup="true"
                aria-expanded=${this.open ? 'true' : 'false'}
                tabindex="0"
                @keydown=${this.handleKeyDown}
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
                    <span class="surface-selection">${this.label}</span>
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
                              ${this.options.map(
                                  (option) => html`
                                      <sp-menu-item
                                          .value=${option.value}
                                          ?selected=${this.value ===
                                          option.value}
                                      >
                                          ${option.label}
                                      </sp-menu-item>
                                  `,
                              )}
                          </sp-menu>
                      </sp-popover>
                  `
                : ''}
        `;
    }

    handleFocusOut(event) {
        if (!this.contains(event.relatedTarget)) {
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
        }
    }
}

customElements.define('mas-folder-picker', MasFolderPicker);
