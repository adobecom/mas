import { LitElement, html, css, nothing } from 'lit';
import { Fragment } from './aem/fragment.js';
import generateFragmentStore from './reactivity/source-fragment-store.js';
import { prepopulateFragmentCache } from './mas-repository.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import StoreController from './reactivity/store-controller.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, PAGE_NAMES, TAG_PROMOTION_PREFIX } from './constants.js';
import router from './router.js';
import { VARIANTS } from './editors/variant-picker.js';
import { generateCodeToUse, getFragmentMapping, showToast } from './utils.js';
import { getSpectrumVersion } from './constants/icon-library.js';
import './editors/merch-card-editor.js';
import './editors/merch-card-collection-editor.js';
import './mas-variation-dialog.js';
import { getCountryName } from '../../io/www/src/fragment/locales.js';

const MODEL_WEB_COMPONENT_MAPPING = {
    [CARD_MODEL_PATH]: 'merch-card',
    [COLLECTION_MODEL_PATH]: 'merch-card-collection',
};

export default class MasFragmentEditor extends LitElement {
    static styles = css`
        #fragment-editor {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 20px;
            max-width: 100%;
            margin: 0 auto;
            background: var(--spectrum-global-color-gray-75);
        }

        #breadcrumbs {
            margin-bottom: 32px;
        }

        sp-breadcrumbs {
            margin-bottom: 0;
        }

        sp-breadcrumb-item {
            cursor: pointer;
            color: var(--spectrum-global-color-gray-800);
            font-size: 14px;
        }

        sp-breadcrumb-item:hover {
            color: var(--spectrum-global-color-blue-600);
        }

        #editor-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            flex: 1;
            padding-bottom: 48px;
        }

        @media (max-width: 1200px) {
            #editor-content {
                grid-template-columns: 1fr;
                overflow: auto;
            }
        }

        #form-column {
            padding-right: 16px;
        }

        #preview-column {
            position: sticky;
            top: 16px;
            height: fit-content;
            max-height: calc(100vh - 200px);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }

        #preview-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0 auto;
            border-radius: 12px;
            box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.16);
            overflow-y: auto;
        }

        @media (max-width: 1200px) {
            #preview-column {
                position: relative;
                max-height: none;
            }
        }

        .preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 16px 0 16px;
            width: 100%;
            box-sizing: border-box;
        }

        .preview-header-title {
            font-size: 14px;
            font-weight: 400;
            color: var(--spectrum-global-color-gray-800);
        }

        .preview-content {
            padding: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: auto;
            position: relative;
        }

        #preview-column:has(.placeholder-failed) {
            background-color: var(--merch-color-error-background);
        }

        #preview-column:has(a[is='checkout-link'].placeholder-failed)::after {
            content: 'CTA has an invalid offer';
            display: block;
            color: var(--merch-color-error);
            font-size: 14px;
            padding: 8px 16px;
            text-align: center;
        }

        .section {
            background: var(--spectrum-global-color-gray-50);
            border: 1px solid var(--spectrum-global-color-gray-300);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.16);
        }

        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--spectrum-global-color-gray-900);
            letter-spacing: -0.01em;
        }

        .section-description {
            font-size: 13px;
            color: var(--spectrum-global-color-gray-700);
            margin-bottom: 24px;
            line-height: 1.5;
        }

        mas-fragment-editor sp-field-group {
            margin-bottom: 16px;
        }

        mas-fragment-editor sp-divider {
            margin: 24px 0;
        }

        #loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            min-height: 400px;
            color: var(--spectrum-global-color-gray-600);
        }

        .empty-state sp-icon {
            width: 64px;
            height: 64px;
            margin-bottom: 16px;
        }

        .card-variant-change-warning {
            background: var(--spectrum-global-color-yellow-100);
            border-left: 4px solid var(--spectrum-global-color-yellow-400);
            padding: 12px 16px;
            margin-bottom: 16px;
            border-radius: 4px;
        }

        .card-variant-change-warning sp-icon {
            color: var(--spectrum-global-color-yellow-700);
        }

        .clickable {
            cursor: pointer;
        }

        .locale-variation-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--spectrum-global-color-gray-700);
            margin-bottom: 16px;
        }

        .locale-variation-header strong {
            font-weight: 700;
            color: var(--spectrum-global-color-gray-900);
        }

        #author-path {
            margin: 0 0 16px 0;
            font-size: 14px;
            color: var(--spectrum-global-color-gray-700);
        }

        .preview-skeleton {
            width: 300px;
            min-height: 400px;
            background: var(--spectrum-gray-100);
            border-radius: 8px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .skeleton-element {
            background: linear-gradient(
                90deg,
                var(--spectrum-gray-200) 25%,
                var(--spectrum-gray-100) 50%,
                var(--spectrum-gray-200) 75%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
        }

        @keyframes shimmer {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }

        .skeleton-header {
            height: 24px;
            width: 60%;
        }

        .skeleton-subtitle {
            height: 16px;
            width: 40%;
        }

        .skeleton-body {
            height: 80px;
            width: 100%;
        }

        .skeleton-price {
            height: 32px;
            width: 50%;
        }

        .skeleton-cta {
            height: 40px;
            width: 100%;
            margin-top: auto;
        }
    `;

    // Initialization states: 'idle' | 'loading' | 'ready'
    static INIT_STATE = { IDLE: 'idle', LOADING: 'loading', READY: 'ready' };

    static properties = {
        fragmentId: { type: String, attribute: 'fragment-id' },
        showDeleteDialog: { type: Boolean, state: true },
        deleteInProgress: { type: Boolean, state: true },
        showDiscardDialog: { type: Boolean, state: true },
        showCloneDialog: { type: Boolean, state: true },
        showCreateVariationDialog: { type: Boolean, state: true },
        cloneInProgress: { type: Boolean, state: true },
        localeDefaultFragment: { type: Object, state: true },
        previewResolved: { type: Boolean, state: true },
        variationsToDelete: { type: Array, state: true },
        initState: { type: String, state: true },
    };

    page = new StoreController(this, Store.page);
    inEdit = Store.fragments.inEdit;
    operation = Store.operation;
    reactiveController = new ReactiveController(this);
    editorContextStore = Store.fragmentEditor.editorContext;

    discardPromiseResolver;
    #pendingDiscardPromise = null;
    titleClone = '';
    tagsClone = [];
    osiClone = null;

    constructor() {
        super();
        this.fragmentId = null;
        this.showDeleteDialog = false;
        this.showDiscardDialog = false;
        this.showCloneDialog = false;
        this.showCreateVariationDialog = false;
        this.cloneInProgress = false;
        this.localeDefaultFragment = null;
        this.previewResolved = false;
        this.discardPromiseResolver = null;
        this.variationsToDelete = [];
        this.initState = MasFragmentEditor.INIT_STATE.IDLE;

        this.updateFragment = this.updateFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
        this.confirmDelete = this.confirmDelete.bind(this);
        this.cancelDelete = this.cancelDelete.bind(this);
        this.discardConfirmed = this.discardConfirmed.bind(this);
        this.cancelDiscard = this.cancelDiscard.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    get styles() {
        return html`<style>
            ${MasFragmentEditor.styles.cssText}
        </style>`;
    }

    get isLoading() {
        return this.initState !== MasFragmentEditor.INIT_STATE.READY;
    }

    connectedCallback() {
        super.connectedCallback();
        this.handleFragmentIdChange = this.handleFragmentIdChange.bind(this);

        const currentFragmentId = Store.fragmentEditor.fragmentId.get();
        if (currentFragmentId) {
            this.fragmentId = currentFragmentId;
        }

        Store.fragmentEditor.fragmentId.subscribe(this.handleFragmentIdChange);
        if (this.page.value === PAGE_NAMES.FRAGMENT_EDITOR && currentFragmentId) {
            this.initFragment();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Store.fragmentEditor.fragmentId.unsubscribe(this.handleFragmentIdChange);
    }

    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (this.fragmentStore?.previewStore) {
            this.previewResolved = this.fragmentStore.previewStore.resolved || false;
        }
    }

    handleFragmentIdChange(newFragmentId) {
        if (this.page.value === PAGE_NAMES.FRAGMENT_EDITOR && newFragmentId && newFragmentId !== this.fragmentId) {
            this.initFragment();
        }
    }

    get previewSkeleton() {
        return html`
            <div id="preview-column">
                <div class="preview-content">
                    <div class="preview-skeleton">
                        <div class="skeleton-element skeleton-header"></div>
                        <div class="skeleton-element skeleton-subtitle"></div>
                        <div class="skeleton-element skeleton-body"></div>
                        <div class="skeleton-element skeleton-price"></div>
                        <div class="skeleton-element skeleton-cta"></div>
                    </div>
                </div>
            </div>
        `;
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get fragmentStore() {
        return this.inEdit.get();
    }

    get previewAttributes() {
        const attrs = {};
        const fragment = this.fragmentStore?.previewStore?.value || this.fragment;

        if (!fragment) {
            return attrs;
        }

        // Helper to get field value
        const getField = (name, index = 0) => fragment.getFieldValue(name, index);
        const getAllFieldValues = (name) => fragment.getField(name)?.values || [];

        // Variant (required)
        const variant = getField('variant');

        if (variant) attrs.variant = variant;

        // Size (validate against allowed sizes for the variant)
        const size = getField('size');

        if (size && size !== 'Default') {
            const variantMapping = getFragmentMapping(variant);
            const allowedSizes = variantMapping?.size || [];
            const sizeLower = size.toLowerCase();
            const allowedSizesLower = allowedSizes.map((s) => s.toLowerCase());

            if (allowedSizesLower.includes(sizeLower)) {
                attrs.size = sizeLower;
            }
        }

        // Card name
        const cardName = getField('cardName');
        if (cardName) attrs.name = cardName;

        // Background image
        const backgroundImage = getField('backgroundImage');
        if (backgroundImage !== undefined) {
            attrs.backgroundImage = backgroundImage || '';
        }

        // Stock offers
        const stockOfferOsis = getAllFieldValues('stockOfferOsis');
        if (stockOfferOsis?.length > 0) {
            attrs.stockOfferOsis = stockOfferOsis.join(',');
        }

        // Checkbox label
        const checkboxLabel = getField('checkboxLabel');
        if (checkboxLabel) attrs.checkboxLabel = checkboxLabel;

        // Storage option
        const storageOption = getField('storageOption');
        if (storageOption) attrs.storage = storageOption;

        // Analytics ID (from tags with mas:product_code/ prefix)
        const productCodeTag = fragment.tags?.find((tag) => tag.id?.startsWith('mas:product_code/'));
        if (productCodeTag) {
            const analyticsId = productCodeTag.id.replace('mas:product_code/', '');
            if (analyticsId) attrs.analyticsId = analyticsId;
        }

        return attrs;
    }

    get previewCSSCustomProperties() {
        const styles = [];
        const fragment = this.fragmentStore?.previewStore?.value || this.fragment;
        if (!fragment) return '';

        const getField = (name, index = 0) => fragment.getFieldValue(name, index);

        // Background color
        const backgroundColor = getField('backgroundColor');
        if (backgroundColor && backgroundColor.toLowerCase() !== 'default') {
            const allowedColors = {
                'gray-100': '--spectrum-gray-100',
                'gray-200': '--spectrum-gray-200',
                'gray-75': '--spectrum-gray-75',
            };
            if (allowedColors[backgroundColor]) {
                styles.push(`--merch-card-custom-background-color: var(${allowedColors[backgroundColor]})`);
            }
        }

        // Border color
        const borderColor = getField('borderColor');
        if (borderColor) {
            if (borderColor.toLowerCase() === 'transparent') {
                styles.push('--consonant-merch-card-border-color: transparent');
            } else if (!borderColor.includes('-gradient')) {
                // Regular color (not gradient)
                styles.push(`--consonant-merch-card-border-color: var(--${borderColor})`);
            }
        }

        return styles.join('; ');
    }

    get previewBorderColorAttributes() {
        const attrs = {};
        const fragment = this.fragmentStore?.previewStore?.value || this.fragment;
        if (!fragment) return attrs;

        const borderColor = fragment.getFieldValue('borderColor', 0);
        if (!borderColor) return attrs;

        // Check if it's a gradient
        const isGradient = /-gradient/.test(borderColor);

        if (isGradient) {
            attrs.gradientBorder = true;
            attrs.borderColor = borderColor;
        }

        return attrs;
    }

    #updateLocaleIfNeeded(path) {
        const locale = this.extractLocaleFromPath(path);
        if (locale && Store.localeOrRegion() !== locale) {
            Store.search.set((prev) => ({ ...prev, region: locale }));
        }
        return locale;
    }

    async initFragment() {
        const fragmentId = Store.fragmentEditor.fragmentId.get();

        if (!fragmentId) {
            console.error('No fragment ID in store');
            return;
        }

        this.fragmentId = fragmentId;
        this.previewResolved = false;
        this.initState = MasFragmentEditor.INIT_STATE.LOADING;

        // Check for existing store first
        const existingStore = Store.fragments.list.data.get().find((store) => store.get()?.id === fragmentId);

        if (existingStore) {
            // Use existing store - just refresh it
            if (existingStore.previewStore) {
                existingStore.previewStore.resolved = false;
            }
            this.repository.refreshFragment(existingStore).then(() => {
                this.dispatchFragmentLoaded();
            });
            this.inEdit.set(existingStore);
            Store.editor.resetChanges();
            this.reactiveController.updateStores([this.inEdit, existingStore, existingStore.previewStore, this.operation]);

            const fragmentPath = existingStore.get().path;
            this.#updateLocaleIfNeeded(fragmentPath);
            this.localeDefaultFragment = existingStore.parentFragment;

            // Reload context to correctly determine if this fragment is a variation
            await this.editorContextStore.loadFragmentContext(fragmentId, fragmentPath);

            this.initState = MasFragmentEditor.INIT_STATE.READY;
            this.requestUpdate();
            return;
        }

        // New fragment - need to fetch and potentially get parent
        try {
            // Start loading placeholders early
            const placeholdersPromise = this.repository.loadPreviewPlaceholders().catch(() => null);

            // Fetch fragment data
            const fragmentData = await this.repository.aem.sites.cf.fragments.getById(fragmentId);
            const fragment = new Fragment(fragmentData);

            this.#updateLocaleIfNeeded(fragment.path);

            // Load context to determine if this is a variation
            await this.editorContextStore.loadFragmentContext(fragmentId, fragment.path);

            const skipVariation = this.repository?.skipVariationDetection;
            if (this.repository?.skipVariationDetection) {
                this.repository.skipVariationDetection = false;
            }

            const isVariation = this.editorContextStore.isVariation(fragmentId);
            let parentFragment = null;

            // For variations, fetch parent fragment BEFORE creating stores
            if (isVariation && !skipVariation) {
                const parentData = await this.editorContextStore.getLocaleDefaultFragmentAsync();
                if (parentData) {
                    parentFragment = new Fragment(parentData);
                    this.localeDefaultFragment = parentFragment;
                }
            }

            // Wait for placeholders before creating stores (needed for preview resolution)
            await placeholdersPromise;

            // Create fragment store with parent (if variation)
            const fragmentStore = generateFragmentStore(fragment, parentFragment);
            Store.fragments.list.data.set((prev) => [fragmentStore, ...prev]);
            this.inEdit.set(fragmentStore);
            this.reactiveController.updateStores([this.inEdit, fragmentStore, fragmentStore.previewStore, this.operation]);
            this.dispatchFragmentLoaded();

            // Handle locale-specific placeholder reload for variations
            if (isVariation) {
                const fragmentLocale = this.extractLocaleFromPath(fragment.path);
                if (fragmentLocale && fragmentLocale !== Store.localeOrRegion()) {
                    Store.search.set((prev) => ({ ...prev, region: fragmentLocale }));
                    await this.repository.loadPreviewPlaceholders();
                    fragmentStore.resolvePreviewFragment();
                }
            }

            Store.editor.resetChanges();
            this.initState = MasFragmentEditor.INIT_STATE.READY;
            this.requestUpdate();
        } catch (error) {
            console.error('Failed to fetch fragment:', error);
            showToast(`Failed to load fragment: ${error.message}`, 'negative');
            this.initState = MasFragmentEditor.INIT_STATE.IDLE;
        }
    }

    dispatchFragmentLoaded() {
        this.dispatchEvent(
            new CustomEvent('fragment-loaded', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    async navigateToLocaleDefaultFragment() {
        if (!this.localeDefaultFragment) return;
        const parentLocale = this.extractLocaleFromPath(this.localeDefaultFragment.path);
        if (parentLocale) {
            Store.removeRegionOverride();
        }
        await router.navigateToFragmentEditor(this.localeDefaultFragment.id);
    }

    getFragmentEditorUrl(fragmentId) {
        // Preserve the current path parameter from the URL
        const currentParams = new URLSearchParams(window.location.hash.slice(1));
        const path = currentParams.get('path');

        let url = `#page=fragment-editor&fragmentId=${fragmentId}`;
        if (path) {
            url += `&path=${path}`;
        }
        return url;
    }

    promptDiscardChanges() {
        if (this.#pendingDiscardPromise) {
            return this.#pendingDiscardPromise;
        }
        this.#pendingDiscardPromise = new Promise((resolve) => {
            this.discardPromiseResolver = resolve;
            this.showDiscardDialog = true;
        });
        return this.#pendingDiscardPromise;
    }

    discardConfirmed() {
        this.showDiscardDialog = false;
        if (this.discardPromiseResolver) {
            this.fragmentStore.discardChanges();
            this.discardPromiseResolver(true);
            this.discardPromiseResolver = null;
        }
        this.#pendingDiscardPromise = null;
    }

    cancelDiscard() {
        this.showDiscardDialog = false;
        Store.viewMode.set('editing');
        if (this.discardPromiseResolver) {
            this.discardPromiseResolver(false);
            this.discardPromiseResolver = null;
        }
        this.#pendingDiscardPromise = null;
    }

    updateCloneFragmentInternal(event) {
        this.titleClone = event.target.value;
    }

    updateFragment({ target, detail, values }) {
        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }

        // For variations: skip updates that just echo the parent value
        if (this.localeDefaultFragment && this.editorContextStore.isVariation(this.fragment?.id)) {
            const sourceField = this.fragment.getField(fieldName);

            // Skip if field is being restored (prevents RTE change events from re-adding the field)
            const editor = this.querySelector('merch-card-editor, merch-card-collection-editor');
            if (editor?.isFieldBeingRestored?.(fieldName)) {
                return;
            }

            // If field doesn't exist in source (inherited), skip update
            // This prevents RTE re-rendering from re-adding a just-removed field
            if (!sourceField) {
                return;
            }

            // If field exists but is empty, skip if value matches parent (RTE initialization)
            if (sourceField) {
                const sourceValues = sourceField.values || [];
                const isSourceEmpty = sourceValues.length === 0 || (sourceValues.length === 1 && sourceValues[0] === '');

                if (isSourceEmpty) {
                    const isNewValueEmpty = value.length === 0 || (value.length === 1 && value[0] === '');

                    // If new value is empty, preserve inheritance
                    if (isNewValueEmpty) {
                        return;
                    }

                    const parentValues = this.localeDefaultFragment.getFieldValues(fieldName) || [];
                    // If new value matches parent, it's likely RTE initialization - skip
                    if (value.length === parentValues.length && value.every((v, i) => v === parentValues[i])) {
                        return;
                    }
                }
            }
        }

        this.fragmentStore.updateField(fieldName, value);
    }

    async deleteFragment() {
        if (!this.editorContextStore.isVariation(this.fragment.id)) {
            this.variationsToDelete = this.fragment.getVariations();
        } else {
            this.variationsToDelete = [];
        }
        this.showDeleteDialog = true;
    }

    async confirmDelete() {
        this.deleteInProgress = true;
        showToast('Deleting fragment...');
        try {
            if (this.editorContextStore.isVariation(this.fragment.id)) {
                const localeDefaultFragment = await this.editorContextStore.getLocaleDefaultFragmentAsync();
                if (localeDefaultFragment) {
                    await this.repository.removeFromParentVariations(localeDefaultFragment, this.fragment.path);
                }
                const deleted = await this.repository.deleteFragment(this.fragment);
                if (!deleted) {
                    console.warn('Regular delete failed for variation, trying force delete');
                    await this.repository.aem.sites.cf.fragments.forceDelete({ path: this.fragment.path });
                }
            } else {
                await this.repository.deleteFragmentWithVariations(this.fragment);
            }
            showToast('Fragment successfully deleted.', 'positive');
            Store.fragments.inEdit.set(null);
            Store.viewMode.set('default');
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
        } catch (error) {
            console.error('Error deleting fragment:', error);
            showToast('Failed to delete fragment', 'negative');
            this.deleteInProgress = false;
        } finally {
            this.showDeleteDialog = false;
        }
    }

    cancelDelete() {
        if (this.deleteInProgress) return;
        this.showDeleteDialog = false;
    }

    async showClone() {
        if (Store.editor.hasChanges) {
            const confirmed = await this.promptDiscardChanges();
            if (!confirmed) return;
        }
        this.showCloneDialog = true;
        Store.showCloneDialog.set(true);
    }

    showCreateVariation() {
        this.showCreateVariationDialog = true;
    }

    cancelCreateVariation() {
        this.showCreateVariationDialog = false;
    }

    async confirmClone() {
        const osi = this.fragment.getFieldValue('osi', 0);
        if (this.fragment.model.path === CARD_MODEL_PATH && !this.osiClone && !osi) {
            showToast('Please select an offer', 'negative');
            return;
        }

        try {
            this.cloneInProgress = true;
            await this.repository.copyFragment(this.titleClone, this.osiClone, this.tagsClone);
            this.cancelClone();
        } catch (error) {
            console.error('Error cloning fragment:', error);
        } finally {
            this.cloneInProgress = false;
        }
    }

    cancelClone() {
        this.showCloneDialog = false;
        Store.showCloneDialog.set(false);
        this.tagsClone = [];
        this.osiClone = null;
    }

    handleTagsChangeOnClone(e) {
        const value = e.target.getAttribute('value');
        this.tagsClone = value ? value.split(',') : [];
    }

    onOstSelectClone = ({ detail: { offerSelectorId, offer } }) => {
        if (!offer) return;
        this.osiClone = offerSelectorId;
    };

    async saveFragment() {
        try {
            await this.repository.saveFragment(this.fragmentStore, true);
        } catch (error) {
            console.error('Failed to save fragment:', error);
            showToast(`Failed to save fragment: ${error.message}`, 'negative');
            throw error;
        }
    }

    async publishFragment() {
        try {
            await this.repository.publishFragment(this.fragment);
        } catch (error) {
            console.error('Failed to publish fragment:', error);
            showToast(`Failed to publish fragment: ${error.message}`, 'negative');
            throw error;
        }
    }

    async copyToUse() {
        const { code, richText, href } = generateCodeToUse(
            this.fragment,
            Store.search.get().path,
            PAGE_NAMES.CONTENT,
            'Failed to copy code to clipboard',
        );
        if (!code || !richText || !href) return;

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([href], { type: 'text/plain' }),
                    'text/html': new Blob([richText], { type: 'text/html' }),
                }),
            ]);
            showToast('Code copied to clipboard', 'positive');
        } catch (e) {
            showToast('Failed to copy code to clipboard', 'negative');
        }
    }

    get deleteConfirmationDialog() {
        if (!this.showDeleteDialog) return nothing;
        const hasVariations = this.variationsToDelete.length > 0;
        const message = hasVariations
            ? html`<p>Are you sure you want to delete this fragment?</p>
                  <p>
                      <strong>Warning:</strong> This will also delete ${this.variationsToDelete.length} locale variation(s).
                      This action cannot be undone.
                  </p>`
            : html`<p>Are you sure you want to delete this fragment? This action cannot be undone.</p>`;
        return html`
            <sp-underlay open @click="${this.deleteInProgress ? undefined : this.cancelDelete}"></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                @sp-dialog-confirm="${this.confirmDelete}"
                @sp-dialog-dismiss="${this.cancelDelete}"
            >
                <h1 slot="heading">Confirm Deletion</h1>
                ${message}
                <sp-button slot="button" variant="secondary" ?disabled=${this.deleteInProgress} @click="${this.cancelDelete}">
                    Cancel
                </sp-button>
                <sp-button slot="button" variant="accent" ?disabled=${this.deleteInProgress} @click="${this.confirmDelete}">
                    Delete
                </sp-button>
            </sp-dialog>
        `;
    }

    get discardConfirmationDialog() {
        if (!this.showDiscardDialog) return nothing;
        return html`
            <sp-underlay open @click="${this.cancelDiscard}"></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                @sp-dialog-confirm="${this.discardConfirmed}"
                @sp-dialog-dismiss="${this.cancelDiscard}"
            >
                <h1 slot="heading">Confirm Discard</h1>
                <p>Are you sure you want to discard changes? This action cannot be undone.</p>
                <sp-button slot="button" variant="secondary" @click="${this.cancelDiscard}"> Cancel </sp-button>
                <sp-button slot="button" variant="accent" id="btnDiscard" @click="${this.discardConfirmed}">
                    Discard
                </sp-button>
            </sp-dialog>
        `;
    }

    get cloneConfirmationDialog() {
        if (!this.showCloneDialog) return nothing;
        const osiValues = this.fragment.getField('osi')?.values;
        return html`
            <sp-underlay open @click="${this.cancelClone}"></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                class="clone-dialog"
                @sp-dialog-confirm="${this.confirmClone}"
                @sp-dialog-dismiss="${this.cancelClone}"
                @ost-offer-select="${this.onOstSelectClone}"
            >
                <h1 slot="heading">Confirm Cloning</h1>
                <p>Please enter new fragment title</p>
                <sp-textfield
                    placeholder="new fragment title"
                    id="new-fragment-title"
                    data-field="title"
                    value="${this.fragment.title}"
                    @input=${this.updateCloneFragmentInternal}
                ></sp-textfield>
                ${this.fragment.model.path === CARD_MODEL_PATH
                    ? html`
                          <sp-field-group>
                              <sp-field-label for="osi">OSI Search</sp-field-label>
                              <osi-field
                                  id="osi"
                                  .value=${osiValues?.length ? osiValues[0] : null}
                                  data-field="osi"
                              ></osi-field>
                          </sp-field-group>
                          <aem-tag-picker-field
                              label="Tags"
                              namespace="/content/cq:tags/mas"
                              multiple
                              value="${this.fragment.tags.map((tag) => tag.id).join(',')}"
                              @change=${this.handleTagsChangeOnClone}
                          ></aem-tag-picker-field>
                      `
                    : nothing}
                <sp-button slot="button" variant="secondary" @click="${this.cancelClone}"> Cancel </sp-button>
                <sp-button slot="button" variant="accent" ?disabled=${this.cloneInProgress} @click="${this.confirmClone}">
                    ${this.cloneInProgress
                        ? html`<sp-progress-circle indeterminate size="s"></sp-progress-circle>`
                        : html`Clone`}
                </sp-button>
            </sp-dialog>
        `;
    }

    get copyVariationDialog() {
        if (!this.showCreateVariationDialog) return nothing;
        const parentForVariation = this.localeDefaultFragment || this.fragment;
        return html`
            <mas-variation-dialog
                .fragment=${parentForVariation}
                .isVariation=${this.editorContextStore.isVariation(this.fragment?.id)}
                @fragment-copied=${this.handleFragmentCopied}
                @cancel=${this.cancelCreateVariation}
            ></mas-variation-dialog>
        `;
    }

    handleFragmentCopied(e) {
        this.cancelCreateVariation();
        const copiedFragment = e.detail?.fragment;
        if (copiedFragment?.id) {
            const AemFragment = customElements.get('aem-fragment');
            if (AemFragment?.cache) {
                AemFragment.cache.add(copiedFragment);
            }
            router.navigateToFragmentEditor(copiedFragment.id);
        }
    }

    extractLocaleFromPath(path) {
        if (!path) return null;
        const parts = path.split('/');
        const localeIndex = parts.indexOf('mas') + 2;
        return parts[localeIndex] || null;
    }

    displayRegionalVarationInfo(clazz) {
        const localeCode = this.extractLocaleFromPath(this.fragment.path);
        if (!localeCode) return nothing;
        const [lang, country] = localeCode.split('_');
        if (!lang || !country) return nothing;
        return html`<div class="${clazz}">
            <span>Regional variation: <strong>${getCountryName(country)} (${lang.toUpperCase()})</strong></span>
        </div>`;
    }

    get localeVariationHeader() {
        if (!this.fragment || !this.editorContextStore.isVariation(this.fragment.id)) {
            return nothing;
        }
        return this.displayRegionalVarationInfo('locale-variation-header');
    }

    get localeDefaultLocaleLabel() {
        if (!this.localeDefaultFragment) return '';
        const localeCode = this.extractLocaleFromPath(this.localeDefaultFragment.path);
        if (!localeCode) return '';
        const [lang, country] = localeCode.split('_');
        return `: Default ${country} (${lang.toUpperCase()})`;
    }

    get derivedFromContainer() {
        if (!this.fragment || !this.localeDefaultFragment || this.localeDefaultFragment.id === this.fragment.id) {
            return nothing;
        }

        return html`
            <div class="derived-from-container">
                <div class="derived-from-header">
                    <div class="derived-from-label">
                        <sp-icon-link size="s"></sp-icon-link>
                        <span>Derived from</span>
                    </div>
                    <a @click="${this.navigateToLocaleDefaultFragment}" class="derived-from-link clickable">
                        <span>View fragment</span>
                        <sp-icon-open-in size="s"></sp-icon-open-in>
                    </a>
                </div>
                <a @click="${this.navigateToLocaleDefaultFragment}" class="derived-from-content clickable">
                    ${this.localeDefaultFragment.title}${this.localeDefaultLocaleLabel}
                </a>
            </div>
        `;
    }

    /**
     * Navigates to the variations table view with the parent fragment expanded.
     */
    navigateToVariationsTable() {
        const isVariation = this.editorContextStore.isVariation(this.fragment?.id);
        // If viewing a variation, navigate to the parent fragment's variations
        // Otherwise, navigate to this fragment's variations
        const targetFragmentId = isVariation ? this.localeDefaultFragment?.id : this.fragment?.id;

        if (targetFragmentId) {
            router.navigateToVariationsTable(targetFragmentId);
        }
    }

    get relatedVariationsSection() {
        if (!this.fragment) return nothing;

        const isVariation = this.editorContextStore.isVariation(this.fragment?.id);
        // Use parent fragment for counts if this is a variation, otherwise use current fragment
        const sourceFragment = isVariation ? this.localeDefaultFragment : this.fragment;

        if (!sourceFragment) return nothing;

        let localeCount = sourceFragment.getLocaleVariationCount?.() || 0;
        let promoCount = sourceFragment.getPromoVariationCount?.() || 0;

        // Subtract 1 from the appropriate count if current fragment is not the source (i.e., it's a variation)
        if (isVariation) {
            const isPromoVariation = this.fragment.tags?.some((tag) => tag.id?.startsWith(TAG_PROMOTION_PREFIX));
            if (isPromoVariation) {
                promoCount = Math.max(0, promoCount - 1);
            } else {
                localeCount = Math.max(0, localeCount - 1);
            }
        }

        // If no variations exist, don't render the container
        if (localeCount === 0 && promoCount === 0) return nothing;

        // Determine the label suffix based on whether we're in a variation
        const siblingLabel = isVariation ? ' sibling' : '';

        // Build the variation count lines
        const localeText =
            localeCount > 0
                ? html`<p class="related-variations-count">
                      ${localeCount} Regional${siblingLabel} variation${localeCount !== 1 ? 's' : ''}
                  </p>`
                : nothing;
        const promoText =
            promoCount > 0
                ? html`<p class="related-variations-count">
                      ${promoCount} promo${siblingLabel} variation${promoCount !== 1 ? 's' : ''}
                  </p>`
                : nothing;

        return html`
            <div class="related-variations-container">
                <div class="related-variations-header">
                    <p class="related-variations-label">Related variations:</p>
                    <a @click="${this.navigateToVariationsTable}" class="related-variations-link clickable">
                        <sp-icon-open-in size="s"></sp-icon-open-in>
                        <span>View variations</span>
                    </a>
                </div>
                <div class="related-variations-counts">${localeText} ${promoText}</div>
            </div>
        `;
    }

    get authorPath() {
        if (!this.fragment) return nothing;
        const modelName = MODEL_WEB_COMPONENT_MAPPING[this.fragment.model.path] || 'fragment';

        const pathParts = this.fragment.path?.split('/') || [];
        const masIndex = pathParts.indexOf('mas');
        const surface = masIndex >= 0 && pathParts[masIndex + 1] ? pathParts[masIndex + 1].toUpperCase() : '';

        const variantCode = this.fragment.getField('variant')?.values[0];
        const variantLabel = VARIANTS.find((v) => v.value === variantCode)?.label || '';
        const customerSegment = this.fragment.getTagTitle('customer_segment') || '';
        const marketSegment = this.fragment.getTagTitle('market_segment') || '';
        const product = this.fragment.getTagTitle('mas:product/') || '';
        const promotion = this.fragment.getTagTitle(TAG_PROMOTION_PREFIX) || '';

        const buildPart = (part) => (part ? ` / ${part}` : '');
        const fragmentParts = `${surface}${buildPart(variantLabel)}${buildPart(customerSegment)}${buildPart(marketSegment)}${buildPart(product)}${buildPart(promotion)}`;

        return html`<p id="author-path">${modelName}: ${fragmentParts}</p>`;
    }

    get fragmentEditor() {
        if (!this.fragment) return nothing;

        let editorContent = nothing;

        switch (this.fragment.model.path) {
            case CARD_MODEL_PATH:
                editorContent = html`
                    <merch-card-editor
                        .fragmentStore=${this.fragmentStore}
                        .updateFragment=${this.updateFragment}
                        .localeDefaultFragment=${this.localeDefaultFragment}
                        .isVariation=${this.editorContextStore.isVariation(this.fragment?.id)}
                    ></merch-card-editor>
                `;
                break;
            case COLLECTION_MODEL_PATH:
                editorContent = html`
                    <merch-card-collection-editor
                        .fragmentStore=${this.fragmentStore}
                        .updateFragment=${this.updateFragment}
                        .localeDefaultFragment=${this.localeDefaultFragment}
                        .isVariation=${this.editorContextStore.isVariation(this.fragment?.id)}
                    ></merch-card-collection-editor>
                `;
                break;
        }

        return html`
            ${this.derivedFromContainer}
            <div class="section">${this.authorPath} ${this.localeVariationHeader} ${editorContent}</div>
        `;
    }

    get previewColumn() {
        if (!this.fragment || this.fragment.model.path !== CARD_MODEL_PATH) return nothing;

        if (!this.previewResolved) {
            return this.previewSkeleton;
        }

        const attrs = this.previewAttributes;
        const borderAttrs = this.previewBorderColorAttributes;
        const cssProps = this.previewCSSCustomProperties;

        const previewFragment = this.fragmentStore?.previewStore?.value;
        prepopulateFragmentCache(this.fragment.id, previewFragment);

        return html`
            <div id="preview-column">
                <div id="preview-wrapper">
                    ${this.editorContextStore.isVariation(this.fragment.id)
                        ? this.displayRegionalVarationInfo('preview-header')
                        : nothing}
                    <div class="preview-content columns mas-fragment">
                        <sp-theme color="light" scale="medium" system="${getSpectrumVersion(this.fragment?.variant)}">
                            <merch-card
                                variant=${attrs.variant || nothing}
                                size=${attrs.size || nothing}
                                name=${attrs.name || nothing}
                                border-color=${borderAttrs.borderColor || nothing}
                                background-image=${attrs.backgroundImage || nothing}
                                stock-offer-osis=${attrs.stockOfferOsis || nothing}
                                checkbox-label=${attrs.checkboxLabel || nothing}
                                storage=${attrs.storage || nothing}
                                daa-lh=${attrs.analyticsId || nothing}
                                ?gradient-border=${borderAttrs.gradientBorder}
                                style=${cssProps || nothing}
                            >
                                <aem-fragment ?author=${true} loading="cache" fragment="${this.fragment.id}"></aem-fragment>
                            </merch-card>
                        </sp-theme>
                    </div>
                </div>
                ${this.relatedVariationsSection}
            </div>
        `;
    }

    render() {
        if (!this.fragment) {
            return html`
                ${this.styles}
                <div id="fragment-editor">
                    <div id="loading-state">
                        <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                    </div>
                </div>
            `;
        }

        if (this.fragmentStore?.loading) {
            return html`
                ${this.styles}
                <div id="fragment-editor">
                    <div id="loading-state">
                        <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                    </div>
                </div>
            `;
        }

        return html`
            ${this.styles}
            <div id="fragment-editor">
                <div id="editor-content">
                    <div id="form-column">${this.fragmentEditor}</div>
                    ${this.previewColumn}
                </div>
                ${this.deleteConfirmationDialog} ${this.discardConfirmationDialog} ${this.cloneConfirmationDialog}
                ${this.copyVariationDialog}
            </div>
        `;
    }
}

customElements.define('mas-fragment-editor', MasFragmentEditor);
