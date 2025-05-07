import { html, css, LitElement } from 'lit';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';

export class MasFolderPicker extends LitElement {
    static styles = css`
        :host {
            width: 100%;
            --mod-actionbutton-min-width: 100%;
            --swc-menu-width: 171px;
        }

        sp-action-menu {
            width: 100%;
        }

        .folder-picker-wrapper {
            display: flex;
            padding-left: 12px;
            align-items: center;
        }

        .icon {
            padding-right: 5px;
            flex-shrink: 0;
        }

        sp-action-menu [slot='icon'] {
            order: 2;
            margin-left: auto;
        }

        sp-menu-item[selected] {
            font-weight: bold;
        }
    `;

    foldersLoaded = new StoreController(this, Store.folders.loaded);
    folders = new StoreController(this, Store.folders.data);
    search = new StoreController(this, Store.search);
    selecting = new StoreController(this, Store.selecting);

    _handleSelection(selectedValue) {
        Store.search.set((prev) => ({ ...prev, path: selectedValue }));
        Store.fragments.list.data.set([]);
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
            <div class="folder-picker-wrapper">
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
                    slot="icon"
                    class="icon"
                >
                    <path
                        fill="#292929"
                        d="M19 0h11v26zM11.1 0H0v26zM15 9.6L22.1 26h-4.6l-2.1-5.2h-5.2z"
                    ></path>
                </svg>
                <sp-action-menu size="m" value=${this.search.value.path} quiet>
                    <sp-icon-chevron-down
                        dir="ltr"
                        class="chevron"
                        slot="icon"
                    ></sp-icon-chevron-down>
                    <span slot="label">${currentFolder?.label}</span>
                    <sp-menu size="m">
                        ${options.map(({ value, label }) => {
                            return html`
                                <sp-menu-item
                                    .value=${value}
                                    ?selected=${this.search.value.path ===
                                    value}
                                    @click=${() => this._handleSelection(value)}
                                >
                                    <div class="test">${label}</div>
                                </sp-menu-item>
                            `;
                        })}
                    </sp-menu>
                </sp-action-menu>
            </div>
        `;
    }
}

customElements.define('mas-folder-picker', MasFolderPicker);
