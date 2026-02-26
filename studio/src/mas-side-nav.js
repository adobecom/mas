import { LitElement, html, css, nothing } from 'lit';
import router from './router.js';
import Store from './store.js';
import { PAGE_NAMES, SURFACES } from './constants.js';
import Events from './events.js';
import { generateFieldLink, camelToTitle, previewValue } from './utils.js';
import './mas-side-nav-item.js';
import ReactiveController from './reactivity/reactive-controller.js';

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

        sp-menu-divider {
            margin: 1px 0;
            opacity: 0.4;
        }

        .field-entry {
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 2px 0;
        }

        .field-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #999;
        }

        .field-value {
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    `;

    reactiveController = new ReactiveController(
        this,
        [Store.page, Store.search, Store.viewMode, Store.fragmentEditor.editorContext, Store.fragmentEditor.loading],
        this.handleStoreChanges,
    );

    variationLoadingTimeout = null;
    resolvedPriceText = '';

    constructor() {
        super();
        this.variationDataLoading = false;
    }

    connectedCallback() {
        super.connectedCallback();
        Store.fragments.inEdit.subscribe(this.#handleFragmentInEditChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Store.fragments.inEdit.unsubscribe(this.#handleFragmentInEditChange);
        if (this.variationLoadingTimeout) {
            clearTimeout(this.variationLoadingTimeout);
            this.variationLoadingTimeout = null;
        }
    }

    #handleFragmentInEditChange = (fragmentStore) => {
        const stores = [
            Store.page,
            Store.search,
            Store.viewMode,
            Store.fragmentEditor.editorContext,
            Store.fragmentEditor.loading,
        ];
        if (fragmentStore) {
            stores.push(fragmentStore);
            this.resolvedPriceText = '';
            this.variationDataLoading = true;
            this.setupVariationLoadingTimeout();
        } else {
            this.variationDataLoading = false;
            if (this.variationLoadingTimeout) {
                clearTimeout(this.variationLoadingTimeout);
                this.variationLoadingTimeout = null;
            }
        }
        this.reactiveController.updateStores(stores);
    };

    handleStoreChanges() {
        // Redirect away from the translation page when it becomes disabled
        if (!this.isTranslationEnabled && [PAGE_NAMES.TRANSLATIONS, PAGE_NAMES.TRANSLATION_EDITOR].includes(Store.page.get())) {
            Store.page.set(PAGE_NAMES.CONTENT);
        }
        this.updateVariationLoadingState();
    }

    async updateVariationLoadingState() {
        if (!this.variationDataLoading) {
            return;
        }
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
        this.fragmentEditor?.addEventListener('preview-updated', () => this.#resolvePricePreview(), { once: true });
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

    // --- Copy Field config ---

    static FIELD_DISPLAY_NAMES = {
        variant: 'Template',
        osi: 'OSI',
        ctas: 'CTAs',
        whatsIncluded: "What's Included",
        originalId: 'Original ID',
    };
    static HIDDEN_FIELDS = new Set(['quantitySelect']);

    /**
     * Waits for the merch-card preview to finish rendering (including WCS price
     * resolution), then caches the resolved price text for the Copy Field popover.
     * Uses the same checkReady() pattern as mas-card-preview.js.
     */
    async #resolvePricePreview() {
        const editor = this.fragmentEditor;
        if (!editor) return;
        // Ensure the fragment editor has rendered the merch-card
        await editor.updateComplete;
        const card = editor.querySelector('merch-card');
        if (!card) return;
        // Wait for the card to fully render, including WCS price resolution
        await card.checkReady?.();
        const price = card.querySelector('span[is="inline-price"]');
        const text = price?.textContent.trim() ?? '';
        if (text && text !== this.resolvedPriceText) {
            this.resolvedPriceText = text;
            this.requestUpdate();
        }
    }

    /** Non-empty fragment fields with display names and value previews. */
    get copyableFields() {
        const fragment = this.fragmentEditor?.fragment;
        if (!fragment?.fields) return [];
        return fragment.fields
            .filter((f) => !fragment.isValueEmpty(f.values) && !MasSideNav.HIDDEN_FIELDS.has(f.name))
            .map((f) => ({
                name: f.name,
                displayName: MasSideNav.FIELD_DISPLAY_NAMES[f.name] ?? camelToTitle(f.name),
                // Prices contain unresolved <inline-price> HTML — prefer cached resolved text
                preview: f.name === 'prices' ? this.resolvedPriceText || previewValue(f.values) : previewValue(f.values),
            }));
    }

    /** Copy Field popover listing fragment fields with preview values. */
    get copyFieldButton() {
        const loading = this.variationDataLoading;
        return html`
            <overlay-trigger placement="right" offset="8">
                <mas-side-nav-item label="Copy Field" ?disabled=${loading} slot="trigger">
                    <sp-icon-copy slot="icon"></sp-icon-copy>
                </mas-side-nav-item>
                <sp-popover slot="click-content" direction="right" tip>
                    <sp-menu>
                        ${this.copyableFields.map(
                            ({ name, displayName, preview }, i) => html`
                                ${i > 0 ? html`<sp-menu-divider></sp-menu-divider>` : nothing}
                                <sp-menu-item @click=${() => this.copyField(name)}>
                                    ${preview
                                        ? html`<div class="field-entry">
                                              <span class="field-label">${displayName}</span>
                                              <span class="field-value">${preview}</span>
                                          </div>`
                                        : displayName}
                                </sp-menu-item>
                            `,
                        )}
                    </sp-menu>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    /** Copies a rich link for the given field to the clipboard. */
    async copyField(fieldName) {
        const fragment = this.fragmentEditor?.fragment;
        if (!fragment) return;
        const path = Store.search.get().path;
        const link = generateFieldLink(fragment, path, PAGE_NAMES.CONTENT, fieldName);
        if (!link) return;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([link.displayText], { type: 'text/plain' }),
                    'text/html': new Blob([link.richText], { type: 'text/html' }),
                }),
            ]);
            const displayName = MasSideNav.FIELD_DISPLAY_NAMES[fieldName] ?? camelToTitle(fieldName);
            Events.toast.emit({ variant: 'positive', content: `Copied ${displayName} field link` });
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
        const loading = Store.fragmentEditor.loading.get();
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
            ${this.copyFieldButton}
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
        const isEditMode = Store.viewMode.value === 'editing';

        return html`<div class="nav-container">
            <div class="nav-items">${isEditMode ? this.editNavigation : this.defaultNavigation}</div>
        </div>`;
    }
}

customElements.define('mas-side-nav', MasSideNav);
