import { html, css, LitElement } from 'lit';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';

export class MasNavFolderPicker extends LitElement {
    static styles = css`
        :host {
            --mod-actionbutton-min-width: auto;
            --mod-actionbutton-background-color-default: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-background-color-hover: var(--spectrum-gray-900, #1e1e1e);
            --mod-actionbutton-background-color-down: var(--spectrum-gray-900, #1e1e1e);
            --mod-actionbutton-background-color-focus: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-border-color-default: transparent;
            --mod-actionbutton-border-color-hover: transparent;
            --mod-actionbutton-border-color-down: transparent;
            --mod-actionbutton-border-color-focus: transparent;
            --mod-actionbutton-content-color-default: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-hover: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-down: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-focus: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-border-radius: 16px;
            --spectrum-actionbutton-height: 32px;
            --spectrum-actionbutton-min-width: auto;
        }

        .folder-picker-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .icon {
            flex-shrink: 0;
            display: none;
        }

        sp-action-menu [slot='icon'] {
            order: 2;
            margin-left: auto;
            color: var(--spectrum-gray-50, #ffffff);
        }

        sp-menu-item[selected] {
            font-weight: bold;
        }

        .folder-label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--spectrum-gray-50, #ffffff);
            font-weight: 700;
            font-size: 14px;
            font-family: 'Adobe Clean', sans-serif;
        }
    `;

    foldersLoaded = new StoreController(this, Store.folders.loaded);
    folders = new StoreController(this, Store.folders.data);
    search = new StoreController(this, Store.search);

    handleSelection(selectedValue) {
        Store.search.set((prev) => ({ ...prev, path: selectedValue }));
        Store.fragments.list.data.set([]);
    }

    formatFolderName(folder) {
        return folder.charAt(0).toUpperCase() + folder.slice(1).toLowerCase();
    }

    render() {
        const options = this.folders.value.map((folder) => ({
            value: folder.toLowerCase(),
            label: this.formatFolderName(folder),
        }));
        const currentFolder = options.find((option) => option.value === this.search.value.path);

        return html`
            <div class="folder-picker-wrapper">
                <sp-action-menu size="m" value=${this.search.value.path}>
                    <sp-icon-chevron-down dir="ltr" class="chevron" slot="icon"></sp-icon-chevron-down>
                    <span slot="label" class="folder-label">
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
                            class="icon"
                        >
                            <path fill="#292929" d="M19 0h11v26zM11.1 0H0v26zM15 9.6L22.1 26h-4.6l-2.1-5.2h-5.2z"></path>
                        </svg>
                        <span>${currentFolder?.label}</span>
                    </span>
                    <sp-menu size="m">
                        ${options.map(({ value, label }) => {
                            return html`
                                <sp-menu-item
                                    .value=${value}
                                    ?selected=${this.search.value.path === value}
                                    @click=${() => this.handleSelection(value)}
                                >
                                    ${label}
                                </sp-menu-item>
                            `;
                        })}
                    </sp-menu>
                </sp-action-menu>
            </div>
        `;
    }
}

customElements.define('mas-nav-folder-picker', MasNavFolderPicker);
