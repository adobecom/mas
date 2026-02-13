import { LitElement, html, css, nothing } from 'lit';
import router from './router.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { PAGE_NAMES, SURFACES } from './constants.js';
import Events from './events.js';
import { generateFieldLink } from './utils.js';
import './mas-side-nav-item.js';

class MasSideNav extends LitElement {
    static properties = {
        variationDataLoading: { type: Boolean, state: true },
    };

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

    currentPage = new StoreController(this, Store.page);
    viewMode = new StoreController(this, Store.viewMode);
    search = new StoreController(this, Store.search);
    variationDataLoading = false;
    fragmentStoreSubscription = null;
    variationLoadingTimeout = null;

    connectedCallback() {
        super.connectedCallback();

        const fragmentStoreHandler = () => {
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
                this.variationDataLoading = true;
                this.setupVariationLoadingTimeout();
                this.fragmentStoreSubscription = fragmentStoreHandler;
                fragmentStore.subscribe(this.fragmentStoreSubscription);
            } else {
                this.variationDataLoading = false;
                if (this.variationLoadingTimeout) {
                    clearTimeout(this.variationLoadingTimeout);
                    this.variationLoadingTimeout = null;
                }
            }

            this.requestUpdate();
        };

        Store.fragments.inEdit.subscribe(parentStoreHandler);

        const editorContextHandler = () => {
            if (this.variationLoadingTimeout) {
                clearTimeout(this.variationLoadingTimeout);
                this.variationLoadingTimeout = null;
            }
            this.updateVariationLoadingState();
        };
        Store.fragmentEditor.editorContext.subscribe(editorContextHandler);

        // Redirect away from the translation page when it becomes disabled
        const searchHandler = () => {
            if (
                !this.isTranslationEnabled &&
                [PAGE_NAMES.TRANSLATIONS, PAGE_NAMES.TRANSLATION_EDITOR].includes(Store.page.get())
            ) {
                Store.page.set(PAGE_NAMES.CONTENT);
            }
        };
        Store.search.subscribe(searchHandler);

        this.unsubscribe = () => {
            Store.fragments.inEdit.unsubscribe(parentStoreHandler);
            Store.search.unsubscribe(searchHandler);
            Store.fragments.inEdit.unsubscribe(parentStoreHandler);
            Store.fragmentEditor.editorContext.unsubscribe(editorContextHandler);
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
        if (this.variationLoadingTimeout) {
            clearTimeout(this.variationLoadingTimeout);
            this.variationLoadingTimeout = null;
        }
    }

    async updateVariationLoadingState() {
        if (this.variationLoadingTimeout) {
            clearTimeout(this.variationLoadingTimeout);
            this.variationLoadingTimeout = null;
        }

        const editorContextStore = Store.fragmentEditor.editorContext;
        const fragmentId = this.fragmentEditor?.fragment?.id;

        if (!fragmentId) {
            this.variationDataLoading = false;
            this.requestUpdate();
            return;
        }

        if (editorContextStore.isVariation(fragmentId) && editorContextStore.parentFetchPromise) {
            await editorContextStore.parentFetchPromise;
        }

        this.variationDataLoading = false;
        this.requestUpdate();
    }

    setupVariationLoadingTimeout() {
        this.variationLoadingTimeout = setTimeout(() => {
            if (this.variationDataLoading) {
                console.warn('Variation data loading timeout - forcing buttons to enable');
                this.variationDataLoading = false;
                this.requestUpdate();
            }
        }, 10000);
    }

    get fragmentEditor() {
        return document.querySelector('mas-fragment-editor');
    }

    get isTranslationEnabled() {
        const surface = this.search.value?.path?.split('/').filter(Boolean)[0]?.toLowerCase();
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

    static stripHtml(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }

    static previewValue(values) {
        const raw = values?.[0] ?? '';
        if (!raw) return '';
        const text = typeof raw === 'string' && raw.includes('<')
            ? MasSideNav.stripHtml(raw)
            : String(raw);
        return text.length > 60 ? `${text.slice(0, 57)}...` : text;
    }

    getResolvedPriceText() {
        const card = this.fragmentEditor?.querySelector('merch-card')
            || document.querySelector('merch-card');
        if (!card) return '';
        let prices = card.querySelectorAll('span[is="inline-price"]');
        if (!prices.length && card.shadowRoot) {
            prices = card.shadowRoot.querySelectorAll('span[is="inline-price"]');
        }
        const texts = [...prices].map((p) => p.textContent.trim()).filter(Boolean);
        return texts.join(', ');
    }

    get copyableFields() {
        const fragment = this.fragmentEditor?.fragment;
        if (!fragment?.fields) return [];
        return fragment.fields
            .filter((f) => !fragment.isValueEmpty(f.values))
            .map((f) => {
                let preview = MasSideNav.previewValue(f.values);
                if (!preview && f.name === 'prices') {
                    preview = this.getResolvedPriceText();
                }
                return {
                    name: f.name,
                    displayName: f.name === 'variant' ? 'template' : f.name,
                    preview,
                };
            });
    }

    async copyField(fieldName) {
        const fragment = this.fragmentEditor?.fragment;
        if (!fragment) return;
        const path = Store.search.get().path;
        const link = generateFieldLink(fragment, path, fieldName);
        if (!link) return;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([link.displayText], { type: 'text/plain' }),
                    'text/html': new Blob([link.richText], { type: 'text/html' }),
                }),
            ]);
            Events.toast.emit({ variant: 'positive', content: `Copied ${fieldName} field link` });
        } catch {
            Events.toast.emit({ variant: 'negative', content: 'Failed to copy field link' });
        }
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
        const loading = this.variationDataLoading;

        return html`
            <mas-side-nav-item label="Save" ?disabled=${!Store.editor.hasChanges || loading} @nav-click="${this.saveFragment}">
                <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
            </mas-side-nav-item>
            ${!isVariation
                ? html`
                      <mas-side-nav-item label="Create Variation" ?disabled=${loading} @nav-click="${this.createVariant}">
                          <sp-icon-add slot="icon"></sp-icon-add>
                      </mas-side-nav-item>
                      <mas-side-nav-item label="Duplicate" ?disabled=${loading} @nav-click="${this.duplicateFragment}">
                          <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                      </mas-side-nav-item>
                  `
                : ''}
            <mas-side-nav-item label="Publish" ?disabled=${loading} @nav-click="${this.publishFragment}">
                <sp-icon-publish slot="icon"></sp-icon-publish>
            </mas-side-nav-item>
            <mas-side-nav-item label="Unpublish" disabled>
                <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
            </mas-side-nav-item>
            <mas-side-nav-item label="Copy Code" ?disabled=${loading} @nav-click="${this.copyCode}">
                <sp-icon-code slot="icon"></sp-icon-code>
            </mas-side-nav-item>
            <overlay-trigger placement="right" offset="8">
                <mas-side-nav-item label="Copy Field" ?disabled=${loading} slot="trigger"
                    @mousedown=${() => this.requestUpdate()}>
                    <sp-icon-copy slot="icon"></sp-icon-copy>
                </mas-side-nav-item>
                <sp-popover slot="click-content" direction="right" tip>
                    <sp-menu>
                        ${this.copyableFields.map(
                            ({ name, displayName, preview }) => html`
                                <sp-menu-item @click=${() => this.copyField(name)}>
                                    <strong>${displayName}</strong>
                                    ${preview
                                        ? html`<span slot="description" style="font-style: italic; opacity: 0.7;">${preview}</span>`
                                        : nothing}
                                </sp-menu-item>
                            `,
                        )}
                    </sp-menu>
                </sp-popover>
            </overlay-trigger>
            <mas-side-nav-item label="History" ?disabled=${loading} @nav-click="${this.showHistory}">
                <sp-icon-history slot="icon"></sp-icon-history>
            </mas-side-nav-item>
            <mas-side-nav-item label="Unlock" @nav-click="${this.unlockFragment}" disabled>
                <sp-icon-settings slot="icon"></sp-icon-settings>
            </mas-side-nav-item>
            <mas-side-nav-item label="Delete" ?disabled=${loading} @nav-click="${this.deleteFragment}">
                <sp-icon-delete slot="icon"></sp-icon-delete>
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
