import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { Fragment } from '../aem/fragment.js';
import { styles } from './merch-card-collection-editor.css.js';
import { VARIANT_NAMES } from './variant-picker.js';
import { FIELD_MODEL_MAPPING, COLLECTION_MODEL_PATH, CARD_MODEL_PATH, VARIANT_CAPABILITIES } from '../constants.js';
import Store from '../store.js';
import router from '../router.js';
import { getFromFragmentCache } from '../mas-repository.js';
import generateFragmentStore from '../reactivity/source-fragment-store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { showToast } from '../utils.js';
import { renderSpIcon } from '../constants/icon-library.js';

const CARDS_SECTION = 'cards-section';

class MerchCardCollectionEditor extends LitElement {
    static get properties() {
        return {
            draggingFieldName: { type: String, state: true },
            draggingIndex: { type: Number, state: true },
            fragmentStore: { type: Object, attribute: false },
            localeDefaultFragment: { type: Object, attribute: false },
            isVariation: { type: Boolean },
            updateFragment: { type: Function },
            hideCards: { type: Boolean, state: true },
        };
    }

    #fragmentReferencesMap = new Map();

    static get styles() {
        return [styles];
    }

    constructor() {
        super();
        this.draggingIndex = -1;
        this.hideCards = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.#addEventListeners();

        if (this.fragmentStore) {
            this.initFragmentReferencesMap();
        }
    }

    disconnectedCallback() {
        this.#removeEventListeners();
        super.disconnectedCallback();
        this.hideItemPreview();
    }

    #addEventListeners() {
        this.addEventListener('dragover', this.handleDragOver);
        this.addEventListener('dragleave', this.handleDragLeave);
        this.addEventListener('drop', this.handleDrop);
    }

    #removeEventListeners() {
        this.removeEventListener('dragover', this.handleDragOver);
        this.removeEventListener('dragleave', this.handleDragLeave);
        this.removeEventListener('drop', this.handleDrop);
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore') || changedProperties.has('localeDefaultFragment')) {
            this.initFragmentReferencesMap();
        }
        super.update(changedProperties);
    }

    async initFragmentReferencesMap() {
        if (!this.fragmentStore) return;

        this.#fragmentReferencesMap.clear();
        const ownReferences = this.fragment?.references || [];
        // In variation context, also load parent references so inherited cards/categories can be displayed
        const parentReferences = this.localeDefaultFragment?.references || [];
        const allReferences = [...ownReferences];
        for (const ref of parentReferences) {
            if (!allReferences.find((r) => r.id === ref.id)) allReferences.push(ref);
        }

        const previewStores = [];
        for (const ref of allReferences) {
            let fragmentStore = Store.fragments.list.data.get().find((store) => store.value.id === ref.id);

            if (!fragmentStore) {
                // Use hydrated ref data first (from ?references=direct-hydrated); fall back to aem-fragment cache
                const fragment = ref.fields ? ref : await getFromFragmentCache(ref.id);
                if (!fragment) continue;
                fragmentStore = generateFragmentStore(fragment);
                previewStores.push(fragmentStore.previewStore);
            }
            this.#fragmentReferencesMap.set(ref.path, fragmentStore);
        }
        this.reactiveController = new ReactiveController(this, [this.fragmentStore, ...previewStores]);

        this.requestUpdate();

        if (this.defaultChild) {
            this.requestUpdate();
        }
    }

    async editFragment(item) {
        const fragmentStore = this.#fragmentReferencesMap.get(item);
        if (fragmentStore) {
            const fragment = fragmentStore.get();
            if (fragment?.id) {
                await router.navigateToFragmentEditor(fragment.id);
            }
        }
    }

    #getFieldValue(fieldName) {
        return this.fragment?.fields?.find((f) => f.name === fieldName)?.values?.[0] || '';
    }

    #getFieldValues(fieldName) {
        return this.fragment?.fields?.find((f) => f.name === fieldName)?.values || [];
    }

    get queryLabel() {
        return this.fragment?.getEffectiveFieldValue('queryLabel', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get label() {
        return this.fragment?.getEffectiveFieldValue('label', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get navigationLabel() {
        return this.fragment?.getEffectiveFieldValue('navigationLabel', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get icon() {
        return this.fragment?.getEffectiveFieldValue('icon', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get iconLight() {
        return this.fragment?.getEffectiveFieldValue('iconLight', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get isGroupedVariation() {
        return Fragment.isGroupedVariationPath(this.fragment?.path);
    }

    get pznTagsValue() {
        return this.fragment?.getFieldValues('pznTags').join(',') ?? '';
    }

    get searchText() {
        return this.fragment?.getEffectiveFieldValue('searchText', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get tagFiltersTitle() {
        return this.fragment?.getEffectiveFieldValue('tagFiltersTitle', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get tagFilters() {
        return (this.fragment?.getEffectiveFieldValues('tagFilters', this.localeDefaultFragment, this.isVariation) ?? []).join(
            ',',
        );
    }

    get linksTitle() {
        return this.fragment?.getEffectiveFieldValue('linksTitle', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get link() {
        return this.fragment?.getEffectiveFieldValue('link', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get linkIcon() {
        return this.fragment?.getEffectiveFieldValue('linkIcon', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    get linkText() {
        return this.fragment?.getEffectiveFieldValue('linkText', this.localeDefaultFragment, this.isVariation) ?? '';
    }

    #getField(fieldName) {
        return this.fragment?.fields?.find((field) => field.name === fieldName);
    }

    #getFieldState(fieldName) {
        return this.fragment?.getFieldState(fieldName, this.localeDefaultFragment, this.isVariation);
    }

    /** Only shows restore indicator (sp-icon-unlink) when the field is overridden — same as card editor. */
    #renderTextFieldStatusIndicator(fieldName) {
        if (!this.isVariation || !this.localeDefaultFragment) return nothing;
        if (this.#getFieldState(fieldName) !== 'overridden') return nothing;
        return this.#renderOverrideIndicatorLink(() => this.#resetTextFieldToParent(fieldName));
    }

    #resetTextFieldToParent(fieldName) {
        const parentValues = this.localeDefaultFragment?.fields?.find((f) => f.name === fieldName)?.values || [];
        const success = this.fragmentStore.resetFieldToParent(fieldName, parentValues);
        if (success) showToast('Field restored to parent value', 'positive');
    }

    #renderOverrideIndicatorLink(resetCallback) {
        return html`
            <div class="field-status-indicator">
                <sp-icon-unlink
                    class="field-status-icon field-status-inherited-link"
                    @click=${(event) => {
                        event.preventDefault();
                        resetCallback();
                    }}
                ></sp-icon-unlink>
                <a
                    href="#"
                    class="field-status-restore-link"
                    @click=${(event) => {
                        event.preventDefault();
                        resetCallback();
                    }}
                    >Click to restore.</a
                >
            </div>
        `;
    }

    #renderInheritedIndicatorLink(overrideCallback) {
        return html`
            <div class="field-status-indicator">
                <sp-icon-link class="field-status-icon field-status-inherited-link"></sp-icon-link>
                <a
                    href="#"
                    class="field-status-restore-link"
                    @click=${(event) => {
                        event.preventDefault();
                        overrideCallback();
                    }}
                    >Click to override.</a
                >
            </div>
        `;
    }

    #renderFieldStatusIndicator(fieldName, overrideCallback, resetCallback) {
        if (!this.isVariation || !this.localeDefaultFragment) return nothing;
        const state = this.#getFieldState(fieldName);
        if (state === 'inherited') return this.#renderInheritedIndicatorLink(overrideCallback);
        if (state === 'overridden' || state === 'same-as-parent') return this.#renderOverrideIndicatorLink(resetCallback);
        return nothing;
    }

    #overrideField(fieldName) {
        const parentField = this.localeDefaultFragment?.fields?.find((f) => f.name === fieldName);
        const parentValues = parentField?.values || [];
        if (!parentValues.length) return;

        // Cannot go through updateField/updateFragment because Fragment.updateField
        // auto-resets to inherited when values exactly match the parent's.
        // Directly mutate fields and notify the store.
        const fragment = this.fragmentStore.get();
        const existingField = fragment.fields?.find((f) => f.name === fieldName);
        if (existingField) {
            existingField.values = [...parentValues];
        } else {
            const newField = { name: fieldName, type: parentField?.type || 'text', values: [...parentValues] };
            if (parentField?.multiple) newField.multiple = true;
            fragment.fields.push(newField);
        }
        fragment.hasChanges = true;
        this.fragmentStore.notify();
        this.requestUpdate();
        showToast(`${fieldName} overridden`, 'positive');
    }

    #resetField(fieldName) {
        this.#updateFieldValues(fieldName, []);
        showToast(`${fieldName} restored to parent`, 'positive');
    }

    get defaultChild() {
        return this.#getFieldValue('defaultchild');
    }

    get #firstCardVariant() {
        if (!this.fragment) return null;

        const cardsField = this.#getField('cards');
        if (!cardsField?.values?.length) return null;

        const firstCardPath = cardsField.values[0];
        const firstCardStore = this.#fragmentReferencesMap.get(firstCardPath);
        if (!firstCardStore) return null;

        const firstCardFragment = firstCardStore.get();
        return firstCardFragment?.fields?.find((f) => f.name === 'variant')?.values?.[0];
    }

    get #supportsDefaultCard() {
        const variant = this.#firstCardVariant;
        if (!variant) return false;

        return VARIANT_CAPABILITIES.defaultCard.supported.includes(variant);
    }

    get #cardsHeader() {
        return html`
            <div class="section-header">
                <div class="section-title">
                    <h2>Cards</h2>
                    ${this.#renderFieldStatusIndicator(
                        'cards',
                        () => this.#overrideField('cards'),
                        () => this.#resetField('cards'),
                    )}
                </div>
                <div class="hide-cards-control">
                    <sp-field-label for="hide-cards">hide</sp-field-label>
                    <sp-switch id="hide-cards" .selected=${this.hideCards} @change=${this.handleHideCardsChange}></sp-switch>
                </div>
            </div>
        `;
    }

    get #cards() {
        if (!this.fragment) return nothing;

        const cardsValues = this.fragment.getEffectiveFieldValues('cards', this.localeDefaultFragment, this.isVariation);
        const hasCards = cardsValues.length > 0;
        const inherited = this.#getFieldState('cards') === 'inherited';

        // Always show cards section to allow drops
        return html`
            ${this.#cardsHeader}
            <div class="cards-container ${this.hideCards ? 'hidden' : ''}">
                ${hasCards
                    ? this.getItems({ values: cardsValues }, inherited)
                    : html`<div class="empty-cards-placeholder"></div>`}
            </div>
        `;
    }

    get #defaultCardDropZone() {
        const hasDefaultCard = !!this.defaultChild;
        const defaultCardPath = hasDefaultCard ? this.getCardPathById(this.defaultChild) : null;
        const defaultCardStore = defaultCardPath ? this.#fragmentReferencesMap.get(defaultCardPath) : null;
        const defaultCardFragment = defaultCardStore?.get();
        const config = VARIANT_CAPABILITIES.defaultCard;

        return html`
            <div class="default-card-section">
                <div class="default-card-header">
                    <sp-icon-star size="s"></sp-icon-star>
                    <span>${config.label}</span>
                </div>
                <div
                    class="default-card-drop-zone ${hasDefaultCard ? 'has-default' : 'empty'}"
                    @dragover=${this.handleDefaultCardDragOver}
                    @dragleave=${this.handleDefaultCardDragLeave}
                    @drop=${this.handleDefaultCardDrop}
                    @dragenter=${(e) => e.preventDefault()}
                >
                    ${hasDefaultCard
                        ? html`
                              <div class="default-card-content">
                                  <div class="default-card-info">
                                      <div class="default-card-details">
                                          <span class="default-card-title"
                                              >${defaultCardFragment?.title ||
                                              defaultCardFragment?.fields?.find((f) => f.name === 'cardTitle')?.values?.[0] ||
                                              'Default Card'}</span
                                          >
                                          <span class="default-card-name">${defaultCardFragment?.name || ''}</span>
                                      </div>
                                  </div>
                                  <sp-action-button quiet size="s" @click=${this.removeDefaultCard}>
                                      <sp-icon-close slot="icon"></sp-icon-close>
                                  </sp-action-button>
                              </div>
                          `
                        : html`
                              <div class="drop-zone-placeholder">
                                  <sp-icon-order size="l"></sp-icon-order>
                                  <p>${config.helpText}</p>
                              </div>
                          `}
                </div>
            </div>
        `;
    }

    getCardPathById(fragmentId) {
        const cardsField = this.#getField('cards');
        if (!cardsField?.values) return null;

        const cardPath = cardsField.values.find((path) => {
            const cardStore = this.#fragmentReferencesMap.get(path);
            return cardStore?.get()?.id === fragmentId;
        });

        return cardPath || this.fragment?.references?.find((ref) => ref.id === fragmentId)?.path || null;
    }

    get #collections() {
        if (!this.fragment) return nothing;

        const collectionsValues = this.fragment.getEffectiveFieldValues(
            'collections',
            this.localeDefaultFragment,
            this.isVariation,
        );
        const hasCollections = collectionsValues.length > 0;
        const inherited = this.#getFieldState('collections') === 'inherited';

        return html`
            <div data-field-name="collections">
                <div class="section-header">
                    <div class="section-title">
                        <h2>Categories</h2>
                        ${this.#renderFieldStatusIndicator(
                            'collections',
                            () => this.#overrideField('collections'),
                            () => this.#resetField('collections'),
                        )}
                    </div>
                </div>
                <div class="collections-container">
                    ${hasCollections
                        ? this.getItems({ values: collectionsValues }, inherited)
                        : html`<div class="empty-cards-placeholder"></div>`}
                </div>
            </div>
        `;
    }

    get #tip() {
        const cardsField = this.#getField('cards');
        const collectionsField = this.#getField('collections');
        const hasCards = cardsField?.values?.length > 0;
        const hasCollections = collectionsField?.values?.length > 0;

        if (hasCards || hasCollections) return nothing;

        return html`
            <div class="tip">
                <sp-icon-info-outline size="m"></sp-icon-info-outline>
                <div>Drag and drop cards or collections to add to this collection.</div>
            </div>
        `;
    }

    #buildItemActions(fragment) {
        return html`
            <div class="item-actions">
                <sp-action-button quiet variant="secondary" @click="${() => this.removeItem(fragment.path)}">
                    <sp-icon-close slot="icon" label="Remove item"></sp-icon-close>
                </sp-action-button>
                <sp-action-button quiet variant="secondary" @click="${() => this.editFragment(fragment.path)}">
                    <sp-icon-edit slot="icon" label="Edit item"></sp-icon-edit>
                </sp-action-button>
                ${fragment.model?.path === CARD_MODEL_PATH
                    ? html`
                          <sp-icon-preview
                              slot="icon"
                              label="Preview item"
                              @mouseover="${(e) => this.showItemPreview(e, fragment)}"
                              @mouseout="${() => this.hideItemPreview()}"
                          ></sp-icon-preview>
                      `
                    : nothing}
                <sp-icon-order size="m" label="Order"></sp-icon-order>
            </div>
        `;
    }

    #extractPlainText(html) {
        if (!html) return '';
        if (!html.includes('<')) return html;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }

    #getFragmentInfo(fragment) {
        const isCollection = fragment.model?.path === COLLECTION_MODEL_PATH;

        // Get label based on fragment type
        const label =
            fragment.fields?.find((field) => field.name === (isCollection ? 'label' : 'cardTitle'))?.values?.[0] || '';

        // Get icons based on fragment type
        let iconPaths = [];
        if (isCollection) {
            const iconPath = fragment.fields?.find((field) => field.name === 'icon')?.values?.[0];

            if (iconPath) iconPaths = [iconPath];
        } else {
            // For cards, get mnemonic icons
            iconPaths = fragment.fields?.find((field) => field.name === 'mnemonicIcon')?.values || [];
        }

        return { label, iconPaths: iconPaths.slice(0, 2) };
    }

    #renderIcon(iconPath, label) {
        if (!iconPath) {
            return nothing;
        } else if (iconPath.startsWith('sp-icon-')) {
            return html`${renderSpIcon(iconPath, VARIANT_NAMES.PLANS)}`;
        } else {
            return html`<img src="${iconPath}" alt="${label} icon" class="item-icon" />`;
        }
    }

    getItems(field, inherited = false) {
        return html`
            <div
                class="items-container ${inherited ? 'inherited' : ''}"
                @dragover="${(e) => !inherited && this.#handleItemsContainerDragOver(e, field)}"
                @drop="${(e) => !inherited && this.#handleItemsContainerDrop(e, field)}"
            >
                ${repeat(
                    field.values,
                    (item) => item,
                    (item, index) => {
                        const fragmentStore = this.#fragmentReferencesMap.get(item);
                        if (!fragmentStore) return nothing;

                        const fragment = fragmentStore.previewStore.get();
                        if (!fragment) return nothing;

                        const { label, iconPaths } = this.#getFragmentInfo(fragment);
                        const isDefaultCard =
                            this.#supportsDefaultCard &&
                            fragment.id === this.defaultChild &&
                            fragment.model?.path === CARD_MODEL_PATH;

                        return html`
                            <div
                                class="item-wrapper ${isDefaultCard ? 'is-default-card' : ''}"
                                draggable="${!inherited}"
                                @dragstart="${(e) => !inherited && this.#dragStart(e, index, fragment.model)}"
                                @dragover="${(e) => !inherited && this.#dragOver(e, index, fragment.model)}"
                                @dragleave="${!inherited ? this.#dragLeave : nothing}"
                                @drop="${(e) => !inherited && this.#drop(e, index, fragment.model)}"
                                @dragend="${!inherited ? this.#dragEnd : nothing}"
                            >
                                <div class="item-content">
                                    ${isDefaultCard
                                        ? html` <sp-icon-star class="default-indicator" size="s"></sp-icon-star> `
                                        : nothing}
                                    <div class="item-text">
                                        <div class="item-label">${this.#extractPlainText(label)}</div>
                                        <div class="item-subtext">${this.#extractPlainText(fragment.title)}</div>
                                    </div>
                                    ${iconPaths.length > 0
                                        ? html`
                                              <div class="item-icons">
                                                  ${iconPaths.map((iconPath) => html`${this.#renderIcon(iconPath, label)}`)}
                                              </div>
                                          `
                                        : nothing}
                                </div>
                                ${inherited ? nothing : this.#buildItemActions(fragment)}
                            </div>
                        `;
                    },
                )}
            </div>
        `;
    }

    #dragStart(e, index, model) {
        this.draggingIndex = index;
        this.draggingFieldName = FIELD_MODEL_MAPPING[model.path];

        const field = this.#getField(this.draggingFieldName);
        const fragmentPath = field?.values?.[index];
        const fragmentStore = this.#fragmentReferencesMap.get(fragmentPath);
        const fragment = fragmentStore?.get();

        const dragData = {
            isInternalDrag: true,
            sourceIndex: index,
            fieldName: this.draggingFieldName,
            id: fragment?.id,
            path: fragment?.path,
            model: fragment?.model,
            title: fragment?.title,
        };

        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    #dragOver(e, index, model) {
        e.preventDefault();
        // Handle external drag
        if (this.draggingIndex === -1) {
            if (this.#canAcceptExternalDrag(e)) {
                e.dataTransfer.dropEffect = 'copy';
                e.target.closest('.item-wrapper')?.classList.add('dragover');
            }
            return;
        }

        // For internal drags, only allow if models match
        if (this.draggingIndex !== index && this.draggingFieldName === FIELD_MODEL_MAPPING[model.path]) {
            e.target.classList.add('dragover');
        }
    }

    #dragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        const itemWrapper = e.currentTarget.closest('.item-wrapper');
        if (itemWrapper) {
            itemWrapper.classList.remove('dragover');
        } else if (e.currentTarget === e.target) {
            e.currentTarget.classList.remove('dragover');
        }
    }

    #drop(e, index, model) {
        if (e.composedPath().find((el) => el.classList?.contains('default-card-drop-zone'))) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        if (!this.fragment) return;

        const isInternalDrop = this.draggingIndex !== -1;
        const targetFieldName = isInternalDrop && model ? FIELD_MODEL_MAPPING[model?.path] : null;

        this.handleDropOperation(e, targetFieldName, index, isInternalDrop);

        if (isInternalDrop) {
            this.draggingIndex = -1;
            this.draggingFieldName = null;
        }
    }

    #dragEnd(e) {
        e.target.classList.remove('dragging');
        this.#removeAllDragoverClasses();
        this.draggingIndex = -1;
        this.draggingFieldName = null;
    }

    #canAcceptExternalDrag(event) {
        try {
            let fragmentData;
            try {
                const data = event.dataTransfer.getData('application/json');
                if (data) fragmentData = JSON.parse(data);
            } catch {}

            if (fragmentData?.isInternalDrag === true) return true;
            if (!fragmentData) return event.dataTransfer.types.includes('application/json');

            const modelPath = fragmentData.model?.path;
            if (!modelPath || !FIELD_MODEL_MAPPING[modelPath]) return false;

            return !fragmentData.path || !this.isFragmentAlreadyInCollection(fragmentData.path);
        } catch {
            return true;
        }
    }

    isFragmentAlreadyInCollection(fragmentPath) {
        if (!this.fragment || !fragmentPath) return false;

        const cardsField = this.#getField('cards');
        const collectionsField = this.#getField('collections');

        return [...(cardsField?.values || []), ...(collectionsField?.values || [])].includes(fragmentPath);
    }

    handleDropOperation(event, targetFieldName = null, targetIndex = -1, isInternalDrop = false) {
        if (!this.fragment) return;
        event.preventDefault();
        event.stopPropagation();

        this.#removeAllDragoverClasses();

        try {
            const data = event.dataTransfer.getData('application/json');
            if (!data) {
                return;
            }

            const parsedData = JSON.parse(data);

            // Handle internal drag
            if (isInternalDrop && this.draggingFieldName) {
                this.#handleInternalDrop(parsedData, targetFieldName, targetIndex);
                return;
            }

            // Skip internal marker in external context
            if (parsedData.isInternalDrag === true && !isInternalDrop) {
                return;
            }

            this.#handleExternalDrop(parsedData, targetFieldName, targetIndex, event);
        } catch (error) {
            // Silently handle error
        }
    }

    #handleInternalDrop(parsedData, targetFieldName, targetIndex) {
        const fieldName = this.draggingFieldName;
        const field = this.#getField(fieldName);

        if (!field || !field.values) {
            return;
        }

        // Check if dropping into different field type
        if (targetFieldName && targetFieldName !== fieldName) {
            return;
        }

        // For internal reordering
        const newValues = [...field.values];

        // Get the dragged item path
        const draggedPath = newValues[this.draggingIndex];
        if (!draggedPath) {
            return;
        }

        // Remove from original position and insert at new position
        newValues.splice(this.draggingIndex, 1);
        newValues.splice(targetIndex, 0, draggedPath);

        this.#updateFieldValues(fieldName, newValues);
    }

    #handleExternalDrop(fragmentData, targetFieldName, targetIndex, event) {
        // Validate model path
        if (!fragmentData.model || !FIELD_MODEL_MAPPING[fragmentData.model.path]) {
            return;
        }

        // Check for duplicates
        if (this.isFragmentAlreadyInCollection(fragmentData.path)) {
            return;
        }

        const fieldName = targetFieldName || FIELD_MODEL_MAPPING[fragmentData.model.path];

        // Check if drop is on specific section
        if (!targetFieldName) {
            const dropTarget = event.target.closest('[data-field-name]');
            if (dropTarget) {
                const sectionFieldName = dropTarget.getAttribute('data-field-name');
                if (sectionFieldName !== fieldName && sectionFieldName !== CARDS_SECTION) {
                    return;
                }
            }
        }

        const field = this.#getField(fieldName);

        // Add item to values (field may not exist yet if this is the first item)
        const newValues = [...(field?.values || [])];

        if (targetIndex !== -1) {
            newValues.splice(targetIndex, 0, fragmentData.path);
        } else {
            newValues.push(fragmentData.path);
        }

        // Ensure no duplicates
        const uniqueValues = [...new Set(newValues)];

        this.#updateFieldValues(fieldName, uniqueValues);

        // Add reference if needed
        this.#addFragmentReference(fragmentData);
    }

    #updateFieldValues(fieldName, values) {
        this.updateFragment({
            target: {
                multiline: true,
                dataset: { field: fieldName },
            },
            values: values,
        });

        this.requestUpdate();
    }

    #addFragmentReference(fragmentData) {
        // Check if reference already exists
        const existingReference = this.fragment.references?.find((ref) => ref.path === fragmentData.path);

        if (!existingReference) {
            // Add the new reference
            this.fragment.references = [...(this.fragment.references || []), fragmentData];

            // Create a FragmentStore for the new reference
            const newFragment = new Fragment(fragmentData);
            const newFragmentStore = generateFragmentStore(newFragment);
            this.#fragmentReferencesMap.set(fragmentData.path, newFragmentStore);
        }
    }

    #removeAllDragoverClasses() {
        // Remove from host element
        this.classList.remove('dragover');

        // Remove from shadow DOM elements
        if (this.shadowRoot) {
            this.shadowRoot
                .querySelectorAll('.dragover, .dragging')
                .forEach((element) => element.classList.remove('dragover', 'dragging'));
        }
    }

    removeItem(path) {
        if (!this.fragment) return;

        const fragmentStore = this.#fragmentReferencesMap.get(path);
        if (!fragmentStore) return;

        const fragment = fragmentStore.get();
        if (!fragment) return;

        const fieldName = FIELD_MODEL_MAPPING[fragment.model?.path];
        if (!fieldName) return;

        const field = this.#getField(fieldName);
        if (!field?.values?.length) return;

        const newValues = [...field.values];
        const index = newValues.indexOf(path);
        if (index === -1) return;

        newValues.splice(index, 1);

        this.#updateFieldValues(fieldName, newValues);
    }

    #handleDragEvent(event, action) {
        event.preventDefault();

        if (action === 'over' && this.draggingIndex === -1) {
            const isAcceptable = this.#canAcceptExternalDrag(event);
            event.dataTransfer.dropEffect = isAcceptable ? 'copy' : 'none';
            if (isAcceptable) this.classList.add('dragover');
        } else if (action === 'leave') {
            if (event.currentTarget === this && !this.contains(event.relatedTarget)) {
                this.classList.remove('dragover');
            }
        } else if (action === 'drop') {
            if (this.#canAcceptExternalDrag(event)) {
                this.handleDropOperation(event);
            } else {
                this.#removeAllDragoverClasses();
            }
        }
    }

    handleDragOver(event) {
        this.#handleDragEvent(event, 'over');
    }

    handleDragLeave(event) {
        this.#handleDragEvent(event, 'leave');
    }

    handleDrop(event) {
        this.#handleDragEvent(event, 'drop');
    }

    handleHideCardsChange(event) {
        this.hideCards = event.target.checked;
    }

    handleDefaultCardDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
        event.currentTarget.classList.add('dragover');
    }

    handleDefaultCardDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('dragover');
    }

    #handleItemsContainerDragOver(e, field) {
        if (this.draggingIndex === -1) {
            e.preventDefault();
            if (this.#canAcceptExternalDrag(e)) {
                e.dataTransfer.dropEffect = 'copy';
            }
        } else {
            e.preventDefault();
        }
    }

    #handleItemsContainerDrop(e, field) {
        if (this.draggingIndex === -1) {
            e.preventDefault();
            e.stopPropagation();
            this.handleDropOperation(e, field.name);
        }
    }

    #parseDropData(event) {
        const data =
            event.dataTransfer.getData('aem/fragment') ||
            event.dataTransfer.getData('application/json') ||
            event.dataTransfer.getData('text/plain') ||
            event.dataTransfer.getData('text');

        return data ? JSON.parse(data) : null;
    }

    #isCardInCollection(fragmentId) {
        const cardsField = this.#getField('cards');
        if (!cardsField?.values) return false;

        return cardsField.values.some((cardPath) => {
            const cardStore = this.#fragmentReferencesMap.get(cardPath);
            return cardStore?.get()?.id === fragmentId;
        });
    }

    #updateDefaultChild(fragmentId) {
        if (this.updateFragment) {
            this.updateFragment({
                target: {
                    dataset: { field: 'defaultchild' },
                    multiline: false,
                },
                values: [fragmentId],
            });
        } else {
            this.fragmentStore.updateField('defaultchild', [fragmentId]);
        }
    }

    #handleTagFilterChange(e) {
        if (Store.showCloneDialog.get()) return;
        const value = e.target.getAttribute('value');
        const newTags = value ? value.split(',') : []; // do not overwrite the tags array
        this.fragmentStore.updateField('tagFilters', newTags);
    }

    #handlePznTagsChange(e) {
        if (Store.showCloneDialog.get()) return;
        const value = e.target.getAttribute('value');
        const newTags = value ? value.split(',') : [];
        this.fragmentStore.updateField('pznTags', newTags);
    }

    get groupedVariationTagsTemplate() {
        if (!this.isGroupedVariation) return nothing;
        return html`
            <div class="form-row">
                <sp-field-group id="grouped-variation-tags">
                    <sp-field-label>Grouped variation tags</sp-field-label>
                    <aem-tag-picker-field
                        selection="checkbox-tags"
                        display-value
                        label="Locale tags"
                        namespace="/content/cq:tags/mas"
                        top="locale,pzn"
                        multiple
                        value="${this.pznTagsValue}"
                        @change=${this.#handlePznTagsChange}
                    ></aem-tag-picker-field>
                </sp-field-group>
            </div>
        `;
    }

    #updateIcon(event, fieldName) {
        const icon = event.detail.icon;
        this.fragmentStore.updateField(fieldName, [icon]);
    }

    handleDefaultCardDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('dragover');

        try {
            const parsedData = this.#parseDropData(event);
            if (!parsedData) return;

            const modelPath = parsedData.model?.path || parsedData.model;
            if (modelPath === COLLECTION_MODEL_PATH) {
                showToast('Cannot set a collection as default card', 'negative');
                return;
            }

            const fragmentId = parsedData.id;
            if (!fragmentId) return;

            if (!this.#isCardInCollection(fragmentId)) {
                showToast('Card is not in this collection', 'negative');
                return;
            }

            this.#updateDefaultChild(fragmentId);

            const cardPath = this.getCardPathById(fragmentId);
            const cardStore = this.#fragmentReferencesMap.get(cardPath);
            const cardFragment = cardStore?.get();
            const cardTitle =
                cardFragment?.title || this.#getFieldValue.call({ fragment: cardFragment }, 'cardTitle') || 'Card';

            showToast(`${cardTitle} set as default card`, 'positive');
            this.requestUpdate();
        } catch (error) {
            showToast('Error setting default card', 'negative');
        }
    }

    removeDefaultCard() {
        if (this.updateFragment) {
            this.updateFragment({
                target: {
                    dataset: { field: 'defaultchild' },
                    multiline: false,
                },
                values: [],
            });
        } else {
            const defaultChildField = this.fragment.fields?.find((f) => f.name === 'defaultchild');
            if (defaultChildField) {
                this.fragmentStore.updateField('defaultchild', []);
            }
        }
        showToast('Default card removed', 'positive');
        this.requestUpdate();
    }

    showItemPreview(event, fragment) {
        event.stopPropagation();

        // Get position information
        const triggerRect = event.target.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const editorRect = this.getBoundingClientRect();

        // Determine which side has more space
        const spaceOnRight = viewportWidth - editorRect.right;
        const spaceOnLeft = editorRect.left;

        const position = {
            top: triggerRect.top,
            ...(spaceOnRight > spaceOnLeft
                ? {
                      left: editorRect.right + spaceOnRight / 2 - 150,
                      right: undefined,
                  }
                : {
                      right: viewportWidth - editorRect.left + spaceOnLeft / 2 - 150,
                      left: undefined,
                  }),
        };

        this.renderPreviewInLightDOM(position, fragment);
    }

    hideItemPreview() {
        const previewElement = document.querySelector('.preview-container');
        if (previewElement && document.body.contains(previewElement)) {
            document.body.removeChild(previewElement);
        }
    }

    async renderPreviewInLightDOM(position, previewItem) {
        this.hideItemPreview();

        const fragmentStore = this.#fragmentReferencesMap.get(previewItem.path);
        if (!fragmentStore?.get()) return;

        const container = document.createElement('div');
        container.className = 'preview-container';
        const positionClass = position.left !== undefined ? 'position-left' : 'position-right';
        const positionValue = position.left !== undefined ? position.left : position.right;
        container.innerHTML = `
            <div class="preview-backdrop"></div>
            <div class="preview-popover">
                <div class="preview-content columns mas-fragment">
                    <merch-card>
                        <aem-fragment author ims fragment="${previewItem.id}"></aem-fragment>
                    </merch-card>
                    <sp-progress-circle class="preview" indeterminate size="l"></sp-progress-circle>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        try {
            await container.querySelector('aem-fragment').updateComplete;
            await container.querySelector('merch-card').checkReady();
            container.querySelector('sp-progress-circle')?.remove();
            // Apply size after hydration (cleanup() removes it)
            const merchCard = container.querySelector('merch-card');
            const size = fragmentStore.get()?.fields?.find((f) => f.name === 'size')?.values?.[0];
            if (size && size.trim()) {
                merchCard.setAttribute('size', size);
            }
        } catch (error) {
            console.error('Failed to load preview card:', error);
            container.querySelector('sp-progress-circle')?.remove();
            const errorMsg = document.createElement('div');
            errorMsg.textContent = 'Failed to load preview';
            errorMsg.style.color = 'var(--spectrum-global-color-red-600)';
            container.querySelector('.preview-content').appendChild(errorMsg);
        }
    }

    get #form() {
        return html`
            <div class="form-container">
                <div class="form-row">
                    <sp-field-label for="queryLabel">Query label</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('queryLabel')}
                    <sp-textfield
                        id="queryLabel"
                        data-field="queryLabel"
                        data-field-state="${this.#getFieldState('queryLabel')}"
                        .value=${this.queryLabel}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="label">label</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('label')}
                    <sp-textfield
                        id="label"
                        data-field="label"
                        data-field-state="${this.#getFieldState('label')}"
                        .value=${this.label}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="icon">Default icon (dark, mandatory if you need icon)</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('icon')}
                    <mas-mnemonic-field
                        id="icon"
                        data-field-state="${this.#getFieldState('icon')}"
                        .iconLibrary="${true}"
                        .icon="${this.icon}"
                        .variant="${VARIANT_NAMES.PLANS}"
                        @change=${(e) => this.#updateIcon(e, 'icon')}
                    ></mas-mnemonic-field>
                </div>
                <div class="form-row">
                    <sp-field-label for="icon">Selected Icon (light, optional)</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('iconLight')}
                    <mas-mnemonic-field
                        id="iconLight"
                        data-field-state="${this.#getFieldState('iconLight')}"
                        .iconLibrary="${true}"
                        .icon="${this.iconLight}"
                        .variant="${VARIANT_NAMES.PLANS}"
                        @change=${(e) => this.#updateIcon(e, 'iconLight')}
                    ></mas-mnemonic-field>
                </div>
            </div>
        `;
    }

    get #sidenav() {
        return html`
            <h2>Side Navigation</h2>
            <div class="form-container">
                <div class="form-row">
                    <sp-field-label for="searchText">Search Text</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('searchText')}
                    <sp-textfield
                        id="searchText"
                        data-field="searchText"
                        data-field-state="${this.#getFieldState('searchText')}"
                        .value=${this.searchText}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="tagFiltersTitle">Tag Filters Title</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('tagFiltersTitle')}
                    <sp-textfield
                        id="tagFiltersTitle"
                        data-field="tagFiltersTitle"
                        data-field-state="${this.#getFieldState('tagFiltersTitle')}"
                        .value=${this.tagFiltersTitle}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="tagFilters">Tag Filters</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('tagFilters')}
                    <aem-tag-picker-field
                        label="Tag Filters"
                        id="tagFilters"
                        data-field-state="${this.#getFieldState('tagFilters')}"
                        namespace="/content/cq:tags/mas"
                        multiple
                        value="${this.tagFilters}"
                        @change=${this.#handleTagFilterChange}
                    ></aem-tag-picker-field>
                </div>
                ${this.groupedVariationTagsTemplate}
                <div class="form-row">
                    <sp-field-label for="linksTitle">Links Title</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('linksTitle')}
                    <sp-textfield
                        id="linksTitle"
                        data-field="linksTitle"
                        data-field-state="${this.#getFieldState('linksTitle')}"
                        .value=${this.linksTitle}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="link">Link</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('link')}
                    <sp-textfield
                        id="link"
                        data-field="link"
                        data-field-state="${this.#getFieldState('link')}"
                        .value=${this.link}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="linkIcon">Link Icon</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('linkIcon')}
                    <sp-textfield
                        id="linkIcon"
                        data-field="linkIcon"
                        data-field-state="${this.#getFieldState('linkIcon')}"
                        .value=${this.linkIcon}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="linkText">Link Text</sp-field-label>
                    ${this.#renderTextFieldStatusIndicator('linkText')}
                    <sp-textfield
                        id="linkText"
                        data-field="linkText"
                        data-field-state="${this.#getFieldState('linkText')}"
                        .value=${this.linkText}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
            </div>
        `;
    }

    render() {
        const hasCards =
            (this.fragment?.getEffectiveFieldValues('cards', this.localeDefaultFragment, this.isVariation) ?? []).length > 0;
        const supportsDefault = this.#supportsDefaultCard;

        return html`<div class="editor-container">
            ${this.#form} ${hasCards && supportsDefault ? this.#defaultCardDropZone : nothing}
            <div data-field-name="${CARDS_SECTION}">${this.#cards}</div>
            ${this.#collections} ${this.#tip} ${this.#sidenav}
        </div>`;
    }
}

customElements.define('merch-card-collection-editor', MerchCardCollectionEditor);
