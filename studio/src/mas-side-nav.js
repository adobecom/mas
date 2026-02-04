import { LitElement, html, css, nothing } from 'lit';
import router from './router.js';
import Store from './store.js';
import { PAGE_NAMES, SURFACES } from './constants.js';
import Events from './events.js';
import './mas-side-nav-item.js';
import ReactiveController from './reactivity/reactive-controller.js';

class MasSideNav extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: auto;
            width: 68px;
            padding: 32px 12px 12px 5px;
            box-sizing: content-box;
            overflow-y: overlay;
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

    reactiveController = new ReactiveController(
        this,
        [Store.page, Store.search, Store.viewMode, Store.fragmentEditor.editorContext],
        this.handleStoreChanges,
    );

    handleStoreChanges() {
        // Redirect away from the translation page when it becomes disabled
        if (!this.isTranslationEnabled && [PAGE_NAMES.TRANSLATIONS, PAGE_NAMES.TRANSLATION_EDITOR].includes(Store.page.get())) {
            Store.page.set(PAGE_NAMES.CONTENT);
        }
    }

    get loading() {
        return Store.fragmentEditor.editorContext.loading;
    }

    get fragmentEditor() {
        return document.querySelector('mas-fragment-editor');
    }

    get isTranslationEnabled() {
        const surface = Store.search.value?.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        return [SURFACES.ACOM.name, SURFACES.EXPRESS.name, SURFACES.SANDBOX.name, SURFACES.NALA.name].includes(surface);
    }

    async saveFragment() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.saveFragment();
    }

    async createVariant() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.showCreateVariation();
    }

    async duplicateFragment() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.showClone();
    }

    async publishFragment() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.publishFragment();
    }

    async copyCode() {
        if (!this.fragmentEditor) return;
        await this.fragmentEditor.copyToUse();
    }

    async showHistory() {
        const fragmentId = this.fragmentEditor?.fragment?.id;
        if (!fragmentId) return;

        // Store the fragment ID in the version store
        Store.version.fragmentId.set(fragmentId);

        // Navigate to the version history page
        router.navigateToPage(PAGE_NAMES.VERSION)();
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
            <mas-side-nav-item
                label="Fragments"
                ?selected=${Store.page.get() === PAGE_NAMES.CONTENT}
                @nav-click="${router.navigateToPage(PAGE_NAMES.CONTENT)}"
            >
                <sp-icon-apps slot="icon"></sp-icon-apps>
            </mas-side-nav-item>
            <mas-side-nav-item label="Collections" disabled>
                <sp-icon-aspect-ratio slot="icon"></sp-icon-aspect-ratio>
            </mas-side-nav-item>
            <mas-side-nav-item label="Promotions" disabled>
                <sp-icon-promote slot="icon"></sp-icon-promote>
            </mas-side-nav-item>
            <mas-side-nav-item label="Offers" disabled>
                <sp-icon-market slot="icon"></sp-icon-market>
            </mas-side-nav-item>
            <mas-side-nav-item
                label="Placeholders"
                ?selected=${Store.page.get() === PAGE_NAMES.PLACEHOLDERS}
                @nav-click="${router.navigateToPage(PAGE_NAMES.PLACEHOLDERS)}"
            >
                <sp-icon-bookmark slot="icon"></sp-icon-bookmark>
            </mas-side-nav-item>
            <mas-side-nav-item
                label="Translations"
                ?selected=${Store.page.get() === PAGE_NAMES.TRANSLATIONS}
                @nav-click=${this.isTranslationEnabled ? router.navigateToPage(PAGE_NAMES.TRANSLATIONS) : nothing}
            >
                <sp-icon-translate slot="icon"></sp-icon-translate>
            </mas-side-nav-item>
            <mas-side-nav-item
                class="side-nav-support"
                label="Support"
                @nav-click="${() => window.open('https://adobe.enterprise.slack.com/archives/C02RZERR9CH', '_blank')}"
            >
                <sp-icon-help slot="icon"></sp-icon-help>
                <sp-icon-link-out-light size="m" class="side-nav-new-window"></sp-icon-link-out-light>
            </mas-side-nav-item>
        `;
    }

    get editNavigation() {
        const fragmentId = this.fragmentEditor?.fragment?.id;
        const isVariation = fragmentId && this.fragmentEditor?.editorContextStore?.isVariation(fragmentId);

        return html`
            <mas-side-nav-item
                label="Save"
                ?disabled=${!Store.editor.hasChanges || this.loading}
                @nav-click="${this.saveFragment}"
            >
                <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
            </mas-side-nav-item>
            ${!isVariation
                ? html`
                      <mas-side-nav-item label="Create Variation" ?disabled=${this.loading} @nav-click="${this.createVariant}">
                          <sp-icon-add slot="icon"></sp-icon-add>
                      </mas-side-nav-item>
                      <mas-side-nav-item label="Duplicate" ?disabled=${this.loading} @nav-click="${this.duplicateFragment}">
                          <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                      </mas-side-nav-item>
                  `
                : ''}
            <mas-side-nav-item label="Publish" ?disabled=${this.loading} @nav-click="${this.publishFragment}">
                <sp-icon-publish slot="icon"></sp-icon-publish>
            </mas-side-nav-item>
            <mas-side-nav-item label="Unpublish" disabled>
                <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
            </mas-side-nav-item>
            <mas-side-nav-item label="Copy Code" ?disabled=${this.loading} @nav-click="${this.copyCode}">
                <sp-icon-code slot="icon"></sp-icon-code>
            </mas-side-nav-item>
            <mas-side-nav-item label="History" ?disabled=${this.loading} @nav-click="${this.showHistory}">
                <sp-icon-history slot="icon"></sp-icon-history>
            </mas-side-nav-item>
            <mas-side-nav-item label="Unlock" @nav-click="${this.unlockFragment}" disabled>
                <sp-icon-settings slot="icon"></sp-icon-settings>
            </mas-side-nav-item>
            <mas-side-nav-item label="Delete" ?disabled=${this.loading} @nav-click="${this.deleteFragment}">
                <sp-icon-delete slot="icon"></sp-icon-delete>
            </mas-side-nav-item>
        `;
    }

    render() {
        const isEditMode = Store.viewMode.value === 'editing';

        return html`<div class="nav-container">
            <div class="nav-items">${isEditMode ? this.editNavigation : this.defaultNavigation}</div>
        </div>`;
    }
}

customElements.define('mas-side-nav', MasSideNav);
