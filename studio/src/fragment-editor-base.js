import { LitElement } from 'lit';
import StoreController from './reactivity/store-controller.js';
import { MasRepository } from './mas-repository.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import Store from './store.js';

export class FragmentEditorBase extends LitElement {
    static properties = {
        loading: { type: Boolean },
        refreshing: { type: Boolean },
        disabled: { type: Boolean },
        hasChanges: { type: Boolean },
        bucket: { type: String },
        showToast: { type: Function },
    };

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    fragmentStoreController = new StoreController(this, Store.fragments.inEdit);

    /** @type {FragmentStore | null} */
    get fragmentStore() {
        if (!this.fragmentStoreController.value) return null;
        return this.fragmentStoreController.value;
    }

    /** @type {Fragment | null} */
    get fragment() {
        if (!this.fragmentStore) return null;
        return this.fragmentStore.get();
    }

    // Add the common editor functionality here
    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.handleKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * @returns {boolean} Whether or not the editor was closed
     */
    close() {
        if (!this.fragmentStore) return true;
        if (this.hasChanges && !window.confirm('Discard all current changes?'))
            return false;
        if (this.hasChanges) this.discardChanges();
        this.fragmentStore = null;
        return true;
    }

    /**
     * @returns {boolean} Whether or not the editor was closed
     */
    close() {
        if (!this.fragmentStore) return true;
        if (this.hasChanges && !window.confirm('Discard all current changes?'))
            return false;
        this.discardChanges(false);
        Store.fragments.inEdit.set(null);
        return true;
    }

    discardChanges(refresh = true) {
        if (!this.hasChanges) return;
        this.fragmentStore.discardChanges();
        this.hasChanges = false;
        if (refresh) this.refresh();
    }

    aemAction(action, reset = false) {
        return async function () {
            this.disabled = true;
            const ok = await action();
            if (ok && reset) this.hasChanges = false;
            this.disabled = false;
        };
    }

    get merchCardEditor() {
        return document.querySelector('merch-card-editor');
    }

    updatePosition(position) {
        this.merchCardEditor.style.setProperty(
            '--editor-left',
            position === 'left' ? '0' : 'inherit',
        );
        this.merchCardEditor.style.setProperty(
            '--editor-right',
            position === 'right' ? '0' : 'inherit',
        );
        this.setAttribute('position', position);
    }

    /**
     * @param {FragmentStore} store
     * @param {number | undefined} x
     */
    async editFragment(store, x) {
        if (x) {
            const newPosition = x > window.innerWidth / 2 ? 'left' : 'right';
            this.updatePosition(newPosition);
        }
        const id = store.get().id;
        const currentId = this.fragmentStore?.get().id;
        if (id === currentId) return;
        const wasEmpty = !currentId;
        if (
            !wasEmpty &&
            this.hasChanges &&
            !window.confirm('Discard all current changes?')
        )
            return;
        this.discardChanges(false);
        this.loading = true;
        await this.repository.refreshFragment(store);
        this.loading = false;
        Store.fragments.inEdit.set(store);
        if (!wasEmpty) this.refresh();
    }

    async refresh() {
        this.refreshing = true;
        await this.updateComplete;
        this.refreshing = false;
    }
}
