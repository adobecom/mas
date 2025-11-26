import { LitElement, html, css, nothing } from 'lit';
import { Fragment } from './aem/fragment.js';
import generateFragmentStore from './reactivity/source-fragment-store.js';
import { EditorContextStore } from './reactivity/editor-context-store.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import StoreController from './reactivity/store-controller.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, LOCALES, PAGE_NAMES } from './constants.js';
import router from './router.js';
import { generateCodeToUse, getFragmentMapping, showToast } from './utils.js';
import './editors/merch-card-editor.js';
import './editors/merch-card-collection-editor.js';
import './mas-variation-dialog.js';

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
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: fit-content;
            margin: 0 auto;
            border-radius: 12px;
            box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.16);
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
            width: fit-content;
            position: relative;
        }

        .preview-content .preview-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        .preview-loading-standalone {
            margin: 0 auto;
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
    `;

    static properties = {
        fragmentId: { type: String, attribute: 'fragment-id' },
        showDeleteDialog: { type: Boolean, state: true },
        showDiscardDialog: { type: Boolean, state: true },
        showCloneDialog: { type: Boolean, state: true },
        showCreateVariationDialog: { type: Boolean, state: true },
        cloneInProgress: { type: Boolean, state: true },
        parentFragment: { type: Object, state: true },
        parentFragmentLoading: { type: Boolean, state: true },
        previewResolved: { type: Boolean, state: true },
    };

    page = new StoreController(this, Store.page);
    inEdit = Store.fragments.inEdit;
    operation = Store.operation;
    reactiveController = new ReactiveController(this);
    editorContextStore = new EditorContextStore(null);

    discardPromiseResolver;
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
        this.parentFragment = null;
        this.previewResolved = false;
        this.discardPromiseResolver = null;

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

    connectedCallback() {
        super.connectedCallback();
        this.handleFragmentIdChange = this.handleFragmentIdChange.bind(this);
        Store.fragmentEditor.fragmentId.subscribe(this.handleFragmentIdChange);
        if (this.page.value === PAGE_NAMES.FRAGMENT_EDITOR && Store.fragmentEditor.fragmentId.get()) {
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

    async updated() {
        super.updated();
        await this.updateComplete;

        const spinner = this.querySelector('#preview-column .preview-loading');
        if (!spinner) return;

        const aemFragment = this.querySelector('#preview-column aem-fragment');
        const merchCard = this.querySelector('#preview-column merch-card');

        if (aemFragment && merchCard) {
            try {
                // Give element time to initialize and start fetching
                await Promise.resolve();
                // Only await updateComplete if it's a valid promise
                if (aemFragment.updateComplete instanceof Promise) {
                    await aemFragment.updateComplete;
                }
                if (merchCard.checkReady) {
                    await merchCard.checkReady();
                }
            } catch (error) {
                console.error('[FragmentEditor] Preview failed:', error.message);
            } finally {
                spinner.remove();
            }
        }
    }

    handleFragmentIdChange(newFragmentId) {
        if (this.page.value === PAGE_NAMES.FRAGMENT_EDITOR && newFragmentId && newFragmentId !== this.fragmentId) {
            this.initFragment();
        }
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

            if (allowedSizes.includes(sizeLower)) {
                attrs.size = sizeLower;
            }
        }

        // Card name
        const cardName = getField('cardName');
        if (cardName) attrs.name = cardName;

        // Badge attributes (simple attribute-based badges)
        const badge = getField('badge');
        if (badge) {
            attrs.badgeText = badge;
            attrs.badgeColor = getField('badgeColor') || '#000000';
            attrs.badgeBackgroundColor = getField('badgeBackgroundColor') || '#F8D904';
        }

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

    async initFragment() {
        const fragmentId = Store.fragmentEditor.fragmentId.get();

        if (!fragmentId) {
            console.error('No fragment ID in store');
            return;
        }

        this.fragmentId = fragmentId;

        // DEFENSE LAYER 1: Ensure placeholders are loaded before proceeding
        // This prevents race condition where PreviewFragmentStore attempts resolution before placeholders are ready
        try {
            await this.repository.loadPreviewPlaceholders();
        } catch (error) {
            // Continue anyway - Layer 2 (subscription) will handle retry if needed
        }

        const existingStore = Store.fragments.list.data.get().find((store) => store.get()?.id === fragmentId);

        if (existingStore) {
            await this.repository.refreshFragment(existingStore);
            this.inEdit.set(existingStore);

            // Load context to get parent ID from fragmentsIds['default-locale-id']
            await this.editorContextStore.loadFragmentContext(fragmentId);
            const hasParent = this.editorContextStore.hasParent();
            if (hasParent) {
                this.parentFragmentLoading = true;
            }

            await this.fetchParentFragment();
            this.reactiveController.updateStores([this.inEdit, existingStore, existingStore.previewStore, this.operation]);
            this.previewResolved = existingStore.previewStore?.resolved || false;
            this.requestUpdate();
        } else {
            try {
                const fragmentData = await this.repository.aem.sites.cf.fragments.getById(fragmentId);
                const fragment = new Fragment(fragmentData);
                const fragmentStore = generateFragmentStore(fragment);
                Store.fragments.list.data.set((prev) => [fragmentStore, ...prev]);
                this.inEdit.set(fragmentStore);

                // Load context to get parent ID from fragmentsIds['default-locale-id']
                await this.editorContextStore.loadFragmentContext(fragmentId);
                const hasParent = this.editorContextStore.hasParent();
                if (hasParent) {
                    this.parentFragmentLoading = true;
                }

                await this.fetchParentFragment();
                this.reactiveController.updateStores([this.inEdit, fragmentStore, fragmentStore.previewStore, this.operation]);
                this.previewResolved = fragmentStore.previewStore?.resolved || false;
                this.requestUpdate();
            } catch (error) {
                console.error('Failed to fetch fragment:', error);
                showToast(`Failed to load fragment: ${error.message}`, 'negative');
            }
        }

        // Dispatch fragment-loaded event to trigger breadcrumb updates
        this.dispatchEvent(
            new CustomEvent('fragment-loaded', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    async fetchParentFragment() {
        // Use context-based parent ID from fragmentsIds['default-locale-id']
        const parentId = this.editorContextStore.getParentId();
        if (!parentId || parentId === this.fragment?.id) {
            this.parentFragment = null;
            this.parentFragmentLoading = false;
            return;
        }

        this.parentFragmentLoading = true;
        try {
            const parentData = await this.repository.aem.sites.cf.fragments.getById(parentId);
            this.parentFragment = new Fragment(parentData);

            // Merge essential parent fields needed for preview hydration
            this.mergeEssentialParentFields();
        } catch (error) {
            console.error('Failed to fetch parent fragment:', error);
            showToast(`Failed to load parent fragment: ${error.message}`, 'negative');
            this.parentFragment = null;
        } finally {
            this.parentFragmentLoading = false;
        }
    }

    mergeEssentialParentFields() {
        if (!this.parentFragment || !this.fragment) return;

        const fragmentStore = this.fragmentStore;
        if (!fragmentStore || !fragmentStore.value || !fragmentStore.previewStore) return;
        if (!this.parentFragment.fields || !this.fragment.fields) return;

        // Merge ALL parent fields that the variation doesn't have or has empty values
        this.parentFragment.fields.forEach((parentField) => {
            const hasOwnField = this.fragment.fields.some(
                (f) => f.name === parentField.name && f.values?.length > 0 && f.values.some((v) => v !== null && v !== ''),
            );

            // Only merge if variation doesn't have this field or it's empty
            if (!hasOwnField && parentField?.values?.length > 0) {
                // Update source store's fragment
                const sourceFieldIndex = fragmentStore.value.fields.findIndex((f) => f.name === parentField.name);
                if (sourceFieldIndex >= 0) {
                    fragmentStore.value.fields[sourceFieldIndex] = { ...parentField };
                } else {
                    fragmentStore.value.fields.push({ ...parentField });
                }

                // Update preview store's fragment
                const previewFieldIndex = fragmentStore.previewStore.value.fields.findIndex((f) => f.name === parentField.name);
                if (previewFieldIndex >= 0) {
                    fragmentStore.previewStore.value.fields[previewFieldIndex] = { ...parentField };
                } else {
                    fragmentStore.previewStore.value.fields.push({ ...parentField });
                }
            }
        });

        // Trigger preview resolution with all merged fields
        fragmentStore.previewStore.resolveFragment();
    }

    async navigateToParentFragment() {
        if (!this.parentFragment) return;
        await router.navigateToFragmentEditor(this.parentFragment.id);
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
        return new Promise((resolve) => {
            this.discardPromiseResolver = resolve;
            this.showDiscardDialog = true;
        });
    }

    discardConfirmed() {
        this.showDiscardDialog = false;
        if (this.discardPromiseResolver) {
            this.fragmentStore.discardChanges();
            this.discardPromiseResolver(true);
            this.discardPromiseResolver = null;
        }
    }

    cancelDiscard() {
        this.showDiscardDialog = false;
        if (this.discardPromiseResolver) {
            this.discardPromiseResolver(false);
            this.discardPromiseResolver = null;
        }
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
        this.fragmentStore.updateField(fieldName, value);
    }

    async deleteFragment() {
        this.showDeleteDialog = true;
    }

    async confirmDelete() {
        this.showDeleteDialog = false;
        try {
            await this.repository.deleteFragment(this.fragment);
            Store.viewMode.set('default');
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
        } catch (error) {
            console.error('Error deleting fragment:', error);
        }
    }

    cancelDelete() {
        this.showDeleteDialog = false;
    }

    async showClone() {
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
            this.cloneInProgress = false;
        } catch (error) {
            this.cloneInProgress = false;
            console.error('Error cloning fragment:', error);
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
            await this.repository.saveFragment(this.fragmentStore);
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
            Store.page.get(),
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
        return html`
            <sp-underlay open @click="${this.cancelDelete}"></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                @sp-dialog-confirm="${this.confirmDelete}"
                @sp-dialog-dismiss="${this.cancelDelete}"
            >
                <h1 slot="heading">Confirm Deletion</h1>
                <p>Are you sure you want to delete this fragment? This action cannot be undone.</p>
                <sp-button slot="button" variant="secondary" @click="${this.cancelDelete}"> Cancel </sp-button>
                <sp-button slot="button" variant="accent" @click="${this.confirmDelete}"> Delete </sp-button>
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
        document.addEventListener('ost-offer-select', this.onOstSelectClone);
        const osiValues = this.fragment.getField('osi')?.values;
        return html`
            <sp-underlay open @click="${this.cancelClone}"></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                class="clone-dialog"
                @sp-dialog-confirm="${this.confirmClone}"
                @sp-dialog-dismiss="${this.cancelClone}"
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
        return html`
            <mas-variation-dialog
                .fragment=${this.fragment}
                @fragment-copied=${this.handleFragmentCopied}
                @cancel=${this.cancelCreateVariation}
            ></mas-variation-dialog>
        `;
    }

    handleFragmentCopied(e) {
        this.cancelCreateVariation();
        const copiedFragment = e.detail?.fragment;
        if (copiedFragment?.id) {
            router.navigateToFragmentEditor(copiedFragment.id);
        }
    }

    extractLocaleFromPath(path) {
        if (!path) return null;
        const parts = path.split('/');
        const localeIndex = parts.indexOf('mas') + 2;
        return parts[localeIndex] || null;
    }

    getLocaleInfo(localeCode) {
        if (!localeCode) return null;
        return LOCALES.find((locale) => locale.code === localeCode);
    }

    get localeVariationHeader() {
        if (!this.fragment || !this.editorContextStore.hasParent()) {
            return nothing;
        }

        const localeCode = this.extractLocaleFromPath(this.fragment.path);
        if (!localeCode) return nothing;

        const localeInfo = this.getLocaleInfo(localeCode);
        if (!localeInfo) return nothing;

        return html`
            <div class="locale-variation-header">
                <span
                    >Regional variation:
                    <strong>${localeInfo.name?.split(' (')[0]} (${localeCode?.split('_')[0].toUpperCase()})</strong></span
                >
            </div>
        `;
    }

    get derivedFromContainer() {
        if (!this.fragment || !this.parentFragment || this.parentFragment.id === this.fragment.id) {
            return nothing;
        }

        return html`
            <div class="derived-from-container">
                <div class="derived-from-header">
                    <div class="derived-from-label">
                        <sp-icon-link size="s"></sp-icon-link>
                        <span>Derived from</span>
                    </div>
                    <a @click="${this.navigateToParentFragment}" class="derived-from-link clickable">
                        <span>View fragment</span>
                        <sp-icon-open-in size="s"></sp-icon-open-in>
                    </a>
                </div>
                <a @click="${this.navigateToParentFragment}" class="derived-from-content clickable">
                    ${this.parentFragment.title}
                </a>
            </div>
        `;
    }

    get fragmentEditor() {
        if (!this.fragment) return nothing;

        if (this.editorContextStore.hasParent() && this.parentFragmentLoading) {
            return html`
                ${this.derivedFromContainer}
                <div class="section">
                    ${this.localeVariationHeader}
                    <div class="loading-container">
                        <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                        <div class="loading-text">Loading parent fragment...</div>
                    </div>
                </div>
            `;
        }

        let editorContent = nothing;

        switch (this.fragment.model.path) {
            case CARD_MODEL_PATH:
                editorContent = html`
                    <merch-card-editor
                        .fragmentStore=${this.fragmentStore}
                        .updateFragment=${this.updateFragment}
                        .parentFragment=${this.parentFragment}
                    ></merch-card-editor>
                `;
                break;
            case COLLECTION_MODEL_PATH:
                editorContent = html`
                    <merch-card-collection-editor
                        .fragmentStore=${this.fragmentStore}
                        .updateFragment=${this.updateFragment}
                        .parentFragment=${this.parentFragment}
                    ></merch-card-collection-editor>
                `;
                break;
        }

        return html`
            ${this.derivedFromContainer}
            <div class="section">${this.localeVariationHeader} ${editorContent}</div>
        `;
    }

    get previewColumn() {
        if (!this.fragment || this.fragment.model.path !== CARD_MODEL_PATH) return nothing;

        if (!this.previewResolved) {
            return html` <sp-progress-circle class="preview-loading-standalone" indeterminate size="l"></sp-progress-circle> `;
        }

        const attrs = this.previewAttributes;
        const borderAttrs = this.previewBorderColorAttributes;
        const cssProps = this.previewCSSCustomProperties;

        const localeCode = this.extractLocaleFromPath(this.fragment.path);
        const localeInfo = this.getLocaleInfo(localeCode);

        // Pre-populate AemFragment cache with preview data
        const AemFragment = customElements.get('aem-fragment');
        const previewFragment = this.fragmentStore?.previewStore?.value;

        if (AemFragment?.cache && previewFragment) {
            // Remove old cache entry
            AemFragment.cache.remove(this.fragment.id);

            // Normalize field values for hydration compatibility
            const normalizedFields = previewFragment.fields.map((field) => {
                // Normalize size values to lowercase to match hydration expectations
                if (field.name === 'size' && field.values && field.values.length > 0) {
                    return {
                        ...field,
                        values: field.values.map((v) => (typeof v === 'string' ? v.toLowerCase() : v)),
                    };
                }
                return field;
            });

            // Create a cache-compatible data structure
            const cacheData = {
                id: previewFragment.id,
                fields: normalizedFields,
                tags: previewFragment.tags || [],
                settings: {},
                priceLiterals: {},
                dictionary: {},
                placeholders: {},
            };

            // Add preview data to cache
            AemFragment.cache.add(cacheData);
        }

        return html`
            <div id="preview-column">
                ${this.editorContextStore.hasParent()
                    ? html`
                          <div class="preview-header">
                              <div class="preview-header-title">
                                  Regional variation:
                                  <strong
                                      >${localeInfo?.name?.split(' (')[0]} (${localeCode?.split('_')[0].toUpperCase()})</strong
                                  >
                              </div>
                          </div>
                      `
                    : nothing}
                <div class="preview-content columns">
                    <merch-card
                        variant=${attrs.variant || nothing}
                        size=${attrs.size || nothing}
                        name=${attrs.name || nothing}
                        badge-text=${attrs.badgeText || nothing}
                        badge-color=${attrs.badgeColor || nothing}
                        badge-background-color=${attrs.badgeBackgroundColor || nothing}
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
                    <sp-progress-circle class="preview-loading" indeterminate size="l"></sp-progress-circle>
                </div>
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
