import { LitElement, html } from 'lit';
import Store from './store.js';
import StoreController from './reactiveStore/storeController.js';

class MasFolderPicker extends LitElement {
    foldersLoaded = new StoreController(this, Store.folders.loaded);
    folders = new StoreController(this, Store.folders.data);
    search = new StoreController(this, Store.search);
    selecting = new StoreController(this, Store.selecting);

    render() {
        console.log('RERENDER folder picker');
        return html`<sp-picker
            @change=${(ev) =>
                Store.search.update((prev) => ({
                    ...prev,
                    path: ev.target.value,
                }))}
            label="Top folder"
            size="m"
            value=${!this.foldersLoaded.value ? null : this.search.value.path}
            ?disabled=${!this.foldersLoaded.value || this.selecting.value}
            id="folder-select"
        >
            ${this.folders.value.map(
                (folder) =>
                    html`<sp-menu-item value=${folder}>
                        ${folder.toUpperCase()}
                    </sp-menu-item>`,
            )}
        </sp-picker>`;
    }
}

customElements.define('mas-folder-picker', MasFolderPicker);
