import { LitElement, html, css, nothing } from 'lit';
import router from './router.js';
import Store from './store.js';
import { PAGE_NAMES, SURFACES } from './constants.js';
import Events from './events.js';
import { generateFieldLink, camelToTitle, previewValue } from './utils.js';
import './mas-side-nav-item.js';
import ReactiveController from './reactivity/reactive-controller.js';

const EVENT_MAS_READY = 'mas:ready';
const PRICE_SELECTOR = 'span[is="inline-price"][data-template="price"], span[is="inline-price"]';
const FIELD_SOURCE = {
    CURRENT: 'current',
    INHERITED: 'inherited',
};
const OVERRIDDEN_SECTION_LABEL = 'Overridden in this variation';
const INHERITED_SECTION_LABEL = 'Inherited from base fragment';

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

        .field-entry-overridden {
            border-inline-start: 2px solid #7da0ff;
            padding-inline-start: 8px;
        }

        .copy-section-item {
            --mod-menu-item-min-height: 28px;
            --mod-menu-item-top-edge-to-text: 6px;
            --mod-menu-item-bottom-edge-to-text: 6px;
        }

        .copy-section-item.overridden-section {
            --mod-menu-item-background-color-default: #eef4ff;
            --mod-menu-item-label-content-color-disabled: #2c5fda;
        }

        .copy-section-item.inherited-section {
            --mod-menu-item-background-color-default: #f3f5f7;
            --mod-menu-item-label-content-color-disabled: #5b6676;
        }

        .copy-section-label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .copy-section-label::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: currentColor;
            opacity: 0.85;
        }

        .copy-field-scroll {
            /* Keep a stable panel height so right-placement vertical centering is consistent across contexts. */
            height: min(72vh, calc(100vh - 96px));
            overflow-y: auto;
            overscroll-behavior: contain;
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

    resolvedPriceText = '';
    #copyFieldMenuOpenedByPointer = false;
    #onMerchCardReady = (event) => {
        const card = this.#getPreviewCard();
        if (!card || event.target !== card) return;
        this.#updateResolvedPrice(this.#getFirstResolvedPriceText(card));
    };
    #onCopyFieldTriggerPointerDown = () => {
        this.#copyFieldMenuOpenedByPointer = true;
    };
    #onCopyFieldMenuOpened = (event) => {
        if (!this.#copyFieldMenuOpenedByPointer) return;
        this.#copyFieldMenuOpenedByPointer = false;
        const overlayTrigger = event.currentTarget;
        requestAnimationFrame(() => {
            const menu = overlayTrigger.querySelector('sp-menu');
            const focusedItem = menu?.querySelector('sp-menu-item[focused]');
            focusedItem?.blur();
            focusedItem?.removeAttribute('focused');
        });
    };
    #onCopyFieldMenuClosed = () => {
        this.#copyFieldMenuOpenedByPointer = false;
    };

    constructor() {
        super();
        this.variationDataLoading = false;
    }

    connectedCallback() {
        super.connectedCallback();
        Store.fragments.inEdit.subscribe(this.#handleFragmentInEditChange);
        document.addEventListener(EVENT_MAS_READY, this.#onMerchCardReady);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Store.fragments.inEdit.unsubscribe(this.#handleFragmentInEditChange);
        document.removeEventListener(EVENT_MAS_READY, this.#onMerchCardReady);
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
            if (fragmentStore.previewStore) {
                stores.push(fragmentStore.previewStore);
            }
            this.resolvedPriceText = '';
            this.variationDataLoading = true;
            this.#syncPricePreview();
        } else {
            this.variationDataLoading = false;
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

        const editorContextStore = Store.fragmentEditor.editorContext;
        const fragmentId = this.fragmentEditor?.fragment?.id;

        if (!fragmentId) {
            this.variationDataLoading = false;
            this.requestUpdate();
            return;
        }

        if (editorContextStore.isVariation(fragmentId) && editorContextStore.parentFetchPromise) {
            const didTimeout = await Promise.race([
                editorContextStore.parentFetchPromise
                    .then(() => false)
                    .catch((error) => {
                        console.warn('Variation parent fetch failed:', error);
                        return false;
                    }),
                new Promise((resolve) => {
                    setTimeout(() => resolve(true), 10000);
                }),
            ]);
            if (didTimeout) {
                console.warn('Variation parent fetch timeout - forcing buttons to enable');
            }
        }

        this.variationDataLoading = false;
        this.requestUpdate();
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
    static HIDDEN_FIELDS = new Set(['quantitySelect', 'perUnitLabel']);

    #getPreviewCard() {
        return this.fragmentEditor?.querySelector('merch-card');
    }

    #syncPricePreview() {
        const card = this.#getPreviewCard();
        if (!card) return;
        this.#updateResolvedPrice(this.#getFirstResolvedPriceText(card));
    }

    #getFirstResolvedPriceText(card) {
        const prices = [...card.querySelectorAll(PRICE_SELECTOR)];
        for (const price of prices) {
            const text = price.textContent?.replace(/\s+/g, ' ').trim() ?? '';
            if (text) return text;
        }
        return '';
    }

    #updateResolvedPrice(value) {
        const text = value?.replace(/\s+/g, ' ').trim() ?? '';
        if (!text || text === this.resolvedPriceText) return;
        this.resolvedPriceText = text;
        this.requestUpdate();
    }

    #hasDisplayValue(values) {
        return values?.some((v) => v !== '' && v !== null && v !== undefined);
    }

    #getDisplayValues(field) {
        const previewFragment = this.fragmentEditor?.fragmentStore?.previewStore?.value;
        const previewField = previewFragment?.fields?.find((f) => f.name === field.name);
        return this.#hasDisplayValue(previewField?.values) ? previewField.values : field.values;
    }

    #isVariationFragment(fragmentId) {
        return !!fragmentId && !!this.fragmentEditor?.editorContextStore?.isVariation?.(fragmentId);
    }

    #buildCopyableField(field, source, sourceFragment) {
        const preview =
            field.name === 'prices'
                ? this.resolvedPriceText || previewValue(this.#getDisplayValues(field))
                : previewValue(this.#getDisplayValues(field));

        return {
            name: field.name,
            displayName: MasSideNav.FIELD_DISPLAY_NAMES[field.name] ?? camelToTitle(field.name),
            preview,
            source,
            sourceFragment,
        };
    }

    /** Non-empty fragment fields with display names and value previews. */
    get copyableFields() {
        const fragment = this.fragmentEditor?.fragment;
        if (!fragment?.fields) return [];
        const currentFields = fragment.fields
            .filter((f) => !fragment.isValueEmpty(f.values) && !MasSideNav.HIDDEN_FIELDS.has(f.name))
            .map((f) => this.#buildCopyableField(f, FIELD_SOURCE.CURRENT, fragment));

        const fragmentId = fragment?.id;
        if (!this.#isVariationFragment(fragmentId)) {
            return currentFields;
        }

        const baseFragment = this.fragmentEditor?.localeDefaultFragment;
        if (!baseFragment?.fields?.length) {
            return currentFields;
        }

        const currentFieldNames = new Set(currentFields.map((field) => field.name));
        const inheritedFields = baseFragment.fields
            .filter((f) => !MasSideNav.HIDDEN_FIELDS.has(f.name) && !currentFieldNames.has(f.name))
            .map((f) => this.#buildCopyableField(f, FIELD_SOURCE.INHERITED, baseFragment))
            .filter((f) => !!f.preview);

        return [...currentFields, ...inheritedFields];
    }

    /** Copy Field popover listing fragment fields with preview values. */
    get copyFieldButton() {
        const loading = this.variationDataLoading;
        const isVariation = this.#isVariationFragment(this.fragmentEditor?.fragment?.id);
        const currentFields = this.copyableFields.filter((field) => field.source === FIELD_SOURCE.CURRENT);
        const inheritedFields = this.copyableFields.filter((field) => field.source === FIELD_SOURCE.INHERITED);
        const showOverriddenSection = isVariation && currentFields.length;
        const showInheritedSection = inheritedFields.length;
        const renderRow = ({ name, displayName, preview, source, sourceFragment }) => html`
            <sp-menu-item @click=${() => this.copyField(name, sourceFragment)}>
                ${preview
                    ? html`<div
                          class="field-entry ${isVariation && source === FIELD_SOURCE.CURRENT ? 'field-entry-overridden' : ''}"
                      >
                          <span class="field-label">${displayName}</span>
                          <span class="field-value">${preview}</span>
                      </div>`
                    : displayName}
            </sp-menu-item>
        `;
        return html`
            <overlay-trigger
                placement="right"
                offset="8"
                @sp-opened=${this.#onCopyFieldMenuOpened}
                @sp-closed=${this.#onCopyFieldMenuClosed}
            >
                <mas-side-nav-item
                    label="Copy Field"
                    ?disabled=${loading}
                    slot="trigger"
                    @pointerdown=${this.#onCopyFieldTriggerPointerDown}
                >
                    <sp-icon-copy slot="icon"></sp-icon-copy>
                </mas-side-nav-item>
                <sp-popover slot="click-content" direction="right" tip>
                    <div class="copy-field-scroll">
                        <sp-menu>
                            ${showOverriddenSection
                                ? html`<sp-menu-item disabled class="copy-section-item overridden-section">
                                      <span class="copy-section-label">${OVERRIDDEN_SECTION_LABEL}</span>
                                  </sp-menu-item>`
                                : nothing}
                            ${currentFields.map(
                                (field, i) =>
                                    html`${i > 0 ? html`<sp-menu-divider></sp-menu-divider>` : nothing}${renderRow(field)}`,
                            )}
                            ${showInheritedSection
                                ? html`
                                      ${currentFields.length || showOverriddenSection
                                          ? html`<sp-menu-divider></sp-menu-divider>`
                                          : nothing}
                                      <sp-menu-item disabled class="copy-section-item inherited-section">
                                          <span class="copy-section-label">${INHERITED_SECTION_LABEL}</span>
                                      </sp-menu-item>
                                      ${inheritedFields.map(
                                          (field, i) =>
                                              html`${i > 0 ? html`<sp-menu-divider></sp-menu-divider>` : nothing}${renderRow(
                                                  field,
                                              )}`,
                                      )}
                                  `
                                : nothing}
                        </sp-menu>
                    </div>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    /** Copies a rich link for the given field to the clipboard. */
    async copyField(fieldName, sourceFragment = this.fragmentEditor?.fragment) {
        const fragment = sourceFragment;
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
