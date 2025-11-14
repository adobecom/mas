import { LitElement, html, css } from 'lit';
import router from './router.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { PAGE_NAMES } from './constants.js';
import Events from './events.js';
import './mas-side-nav-item.js';

class MasSideNav extends LitElement {
    static properties = {
        editorHasChanges: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 92px;
            padding: 16px 0;
            box-sizing: border-box;
        }

        .nav-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .nav-items {
            display: flex;
            flex-direction: column;
        }

        .side-nav-support {
            margin-top: auto;
            position: relative;
        }

        .side-nav-new-window {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 14px;
            height: 14px;
        }
    `;

    currentPage = new StoreController(this, Store.page);
    viewMode = new StoreController(this, Store.viewMode);
    editorHasChanges = false;
    fragmentStoreSubscription = null;

    connectedCallback() {
        super.connectedCallback();
        this.updateEditorChangesState();

        const fragmentStoreHandler = () => {
            this.updateEditorChangesState();
            this.requestUpdate();
        };

        const parentStoreHandler = (fragmentStore) => {
            if (this.fragmentStoreSubscription) {
                const oldStore = Store.fragments.inEdit.get();
                if (oldStore) {
                    oldStore.unsubscribe(this.fragmentStoreSubscription);
                }
            }

            if (fragmentStore) {
                this.fragmentStoreSubscription = fragmentStoreHandler;
                fragmentStore.subscribe(this.fragmentStoreSubscription);
            }

            this.updateEditorChangesState();
            this.requestUpdate();
        };

        Store.fragments.inEdit.subscribe(parentStoreHandler);

        this.unsubscribe = () => {
            Store.fragments.inEdit.unsubscribe(parentStoreHandler);
            if (this.fragmentStoreSubscription) {
                const store = Store.fragments.inEdit.get();
                if (store) {
                    store.unsubscribe(this.fragmentStoreSubscription);
                }
            }
        };
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.unsubscribe) this.unsubscribe();
    }

    updateEditorChangesState() {
        this.editorHasChanges = Store.editor.hasChanges;
    }

    get fragmentEditor() {
        return document.querySelector('mas-fragment-editor');
    }

    async saveFragment() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.saveFragment();
    }

    async duplicateFragment() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.showClone();
    }

    async publishFragment() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.publishFragment();
    }

    async unpublishFragment() {
        Events.toast.emit({
            variant: 'info',
            content: 'Unpublish feature coming soon',
        });
    }

    async copyCode() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.copyToUse();
    }

    async showHistory() {
        Events.toast.emit({
            variant: 'info',
            content: 'History feature coming soon',
        });
    }

    async unlockFragment() {
        Events.toast.emit({
            variant: 'info',
            content: 'Unlock feature coming soon',
        });
    }

    async deleteFragment() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.deleteFragment();
    }

    get defaultNavigation() {
        return html`
            <mas-side-nav-item
                label="Home"
                ?selected=${Store.page.get() === PAGE_NAMES.WELCOME}
                @nav-click="${router.navigateToPage(PAGE_NAMES.WELCOME)}"
            >
                <sp-icon-home slot="icon"></sp-icon-home>
            </mas-side-nav-item>
            <mas-side-nav-item label="Offers" disabled>
                <sp-icon-offer slot="icon"></sp-icon-offer>
            </mas-side-nav-item>
            <mas-side-nav-item
                label="Fragments"
                ?selected=${Store.page.get() === PAGE_NAMES.CONTENT}
                @nav-click="${router.navigateToPage(PAGE_NAMES.CONTENT)}"
            >
                <sp-icon-view-grid slot="icon"></sp-icon-view-grid>
            </mas-side-nav-item>
            <mas-side-nav-item label="Promotions" disabled>
                <sp-icon-promote slot="icon"></sp-icon-promote>
            </mas-side-nav-item>
            <mas-side-nav-item label="Collections" disabled>
                <sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>
            </mas-side-nav-item>
            <mas-side-nav-item
                label="Placeholders"
                ?selected=${Store.page.get() === PAGE_NAMES.PLACEHOLDERS}
                @nav-click="${router.navigateToPage(PAGE_NAMES.PLACEHOLDERS)}"
            >
                <sp-icon-cclibrary slot="icon"></sp-icon-cclibrary>
            </mas-side-nav-item>
            <mas-side-nav-item
                class="side-nav-support"
                label="Support"
                @nav-click="${() => window.open('https://adobe.enterprise.slack.com/archives/C02RZERR9CH', '_blank')}"
            >
                <sp-icon-help slot="icon"></sp-icon-help>
                <sp-icon-link-out-light class="side-nav-new-window"></sp-icon-link-out-light>
            </mas-side-nav-item>
        `;
    }

    get editNavigation() {
        return html`
            <mas-side-nav-item label="Save" ?disabled=${!this.editorHasChanges} @nav-click="${this.saveFragment}">
                <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
            </mas-side-nav-item>
            <mas-side-nav-item label="Duplicate" @nav-click="${this.duplicateFragment}">
                <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
            </mas-side-nav-item>
            <mas-side-nav-item label="Publish" @nav-click="${this.publishFragment}">
                <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
            </mas-side-nav-item>
            <mas-side-nav-item label="Unpublish" @nav-click="${this.unpublishFragment}">
                <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
            </mas-side-nav-item>
            <mas-side-nav-item label="Copy Code" @nav-click="${this.copyCode}">
                <sp-icon-code slot="icon"></sp-icon-code>
            </mas-side-nav-item>
            <mas-side-nav-item label="History" @nav-click="${this.showHistory}">
                <sp-icon-history slot="icon"></sp-icon-history>
            </mas-side-nav-item>
            <mas-side-nav-item label="Unlock" @nav-click="${this.unlockFragment}" disabled>
                <sp-icon-settings slot="icon"></sp-icon-settings>
            </mas-side-nav-item>
            <mas-side-nav-item label="Delete" @nav-click="${this.deleteFragment}">
                <sp-icon-delete-outline slot="icon"></sp-icon-delete-outline>
            </mas-side-nav-item>
        `;
    }

    render() {
        const isEditMode = this.viewMode.value === 'editing';

        return html`<div class="nav-container">
            <div class="nav-items">${isEditMode ? this.editNavigation : this.defaultNavigation}</div>
        </div>`;
    }
}

customElements.define('mas-side-nav', MasSideNav);
