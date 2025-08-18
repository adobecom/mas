import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { styles } from './merch-card-collection-editor.css.js';
import { FIELD_MODEL_MAPPING, COLLECTION_MODEL_PATH, CARD_MODEL_PATH, VARIANT_CAPABILITIES } from '../constants.js';
import Store, { editFragment } from '../store.js';
import { getFromFragmentCache } from '../mas-repository.js';
import { showToast } from '../utils.js';

const CARDS_SECTION = 'cards-section';

class MerchCardCollectionEditor extends LitElement {
    static get properties() {
        return {
            draggingFieldName: { type: String, state: true },
            draggingIndex: { type: Number, state: true },
            fragmentStore: { type: Object, attribute: false },
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
        if (changedProperties.has('fragmentStore')) {
            this.initFragmentReferencesMap();
        }
        super.update(changedProperties);
    }

    async initFragmentReferencesMap() {
        if (!this.fragmentStore) return;

        this.#fragmentReferencesMap.clear();
        const references = this.fragment?.references || [];

        for (const ref of references) {
            let fragmentStore = Store.fragments.list.data.get().find((store) => store.value.id === ref.id);

            if (!fragmentStore) {
                const fragment = await getFromFragmentCache(ref.id);
                if (!fragment) continue;
                fragmentStore = new FragmentStore(fragment);
            }
            this.#fragmentReferencesMap.set(ref.path, fragmentStore);
        }

        this.requestUpdate();

        if (this.defaultChild) {
            this.requestUpdate();
        }
    }

    editFragment(item) {
        const fragmentStore = this.#fragmentReferencesMap.get(item);
        if (fragmentStore) editFragment(fragmentStore);
    }

    #getFieldValue(fieldName) {
        return this.fragment?.fields?.find((f) => f.name === fieldName)?.values?.[0] || '';
    }

    get queryLabel() {
        return this.fragment?.fields?.find((f) => f.name === 'queryLabel')?.values?.[0] || '';
    }

    get label() {
        return this.#getFieldValue('label');
    }

    get navigationLabel() {
        return this.#getFieldValue('navigationLabel');
    }

    get icon() {
        return this.#getFieldValue('icon');
    }

    get iconLight() {
        return this.#getFieldValue('iconLight');
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    #getField(fieldName) {
        return this.fragment?.fields?.find((field) => field.name === fieldName);
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
                <h2>Cards</h2>
                <div class="hide-cards-control">
                    <sp-field-label for="hide-cards">hide</sp-field-label>
                    <sp-switch id="hide-cards" .selected=${this.hideCards} @change=${this.handleHideCardsChange}></sp-switch>
                </div>
            </div>
        `;
    }

    get #cards() {
        if (!this.fragment) return nothing;

        const cardsField = this.#getField('cards');
        const hasCards = cardsField?.values?.length > 0;

        // Always show cards section to allow drops
        return html`
            ${this.#cardsHeader}
            <div class="cards-container ${this.hideCards ? 'hidden' : ''}">
                ${hasCards ? this.getItems(cardsField) : html`<div class="empty-cards-placeholder"></div>`}
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
                                  <sp-icon-drag-handle size="l"></sp-icon-drag-handle>
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

        const collectionsField = this.#getField('collections');
        if (!collectionsField?.values?.length) return nothing;

        return html`
            <div data-field-name="collections">
                <div class="section-header">
                    <h2>Categories</h2>
                </div>
                ${this.getItems(collectionsField)}
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
                <sp-icon-info-outline></sp-icon-info-outline>
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
                <sp-icon-drag-handle label="Order"></sp-icon-drag-handle>
            </div>
        `;
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

    getItems(field) {
        return html`
            <div
                class="items-container"
                @dragover="${(e) => this.#handleItemsContainerDragOver(e, field)}"
                @drop="${(e) => this.#handleItemsContainerDrop(e, field)}"
            >
                ${repeat(
                    field.values,
                    (item) => item,
                    (item, index) => {
                        const fragmentStore = this.#fragmentReferencesMap.get(item);
                        if (!fragmentStore) return nothing;

                        const fragment = fragmentStore.get();
                        if (!fragment) return nothing;

                        const { label, iconPaths } = this.#getFragmentInfo(fragment);
                        const isDefaultCard =
                            this.#supportsDefaultCard &&
                            fragment.id === this.defaultChild &&
                            fragment.model?.path === CARD_MODEL_PATH;

                        return html`
                            <div
                                class="item-wrapper ${isDefaultCard ? 'is-default-card' : ''}"
                                draggable="true"
                                @dragstart="${(e) => this.#dragStart(e, index, fragment.model)}"
                                @dragover="${(e) => this.#dragOver(e, index, fragment.model)}"
                                @dragleave="${this.#dragLeave}"
                                @drop="${(e) => this.#drop(e, index, fragment.model)}"
                                @dragend="${this.#dragEnd}"
                            >
                                <div class="item-content">
                                    ${isDefaultCard
                                        ? html` <sp-icon-star class="default-indicator" size="s"></sp-icon-star> `
                                        : nothing}
                                    <div class="item-text">
                                        <div class="item-label">${label}</div>
                                        <div class="item-subtext">${fragment.name}</div>
                                    </div>
                                    ${iconPaths.length > 0
                                        ? html`
                                              <div class="item-icons">
                                                  ${iconPaths.map(
                                                      (iconPath) => html`
                                                          <img src="${iconPath}" alt="${label} icon" class="item-icon" />
                                                      `,
                                                  )}
                                              </div>
                                          `
                                        : nothing}
                                </div>
                                ${this.#buildItemActions(fragment)}
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
        if (!field) {
            return;
        }

        // Add item to values
        const newValues = [...(field.values || [])];

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
            this.#fragmentReferencesMap.set(fragmentData.path, new FragmentStore(new Fragment(fragmentData)));
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
        container.innerHTML = `
            <div class="preview-backdrop"></div>
            <div class="preview-popover" style="${position.left !== undefined ? `left: ${position.left}px` : `right: ${position.right}px`}">
                <div class="preview-content">
                    <merch-card>
                        <aem-fragment author ims fragment="${previewItem.id}"></aem-fragment>
                    </merch-card>
                    <sp-progress-circle class="preview" indeterminate size="l"></sp-progress-circle>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        await container.querySelector('aem-fragment').updateComplete;
        await container.querySelector('merch-card').checkReady();
        container.querySelector('sp-progress-circle').remove();
    }

    get #form() {
        return html`
            <div class="form-container">
                <div class="form-row">
                    <sp-field-label for="queryLabel">Query label</sp-field-label>
                    <sp-textfield
                        id="queryLabel"
                        data-field="queryLabel"
                        .value=${this.queryLabel}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="label">label</sp-field-label>
                    <sp-textfield
                        id="label"
                        data-field="label"
                        .value=${this.label}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="icon">Default icon (dark, mandatory if you need icon)</sp-field-label>
                    <sp-textfield id="icon" data-field="icon" .value=${this.icon} @input=${this.updateFragment}></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="icon">Selected Icon (light, optional)</sp-field-label>
                    <sp-textfield
                        id="iconLight"
                        data-field="iconLight"
                        .value=${this.iconLight}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
            </div>
        `;
    }

    render() {
        const cardsField = this.#getField('cards');
        const hasCards = cardsField?.values?.length > 0;
        const supportsDefault = this.#supportsDefaultCard;

        return html`<div class="editor-container">
            ${this.#form} ${hasCards && supportsDefault ? this.#defaultCardDropZone : nothing}
            <div data-field-name="${CARDS_SECTION}">${this.#cards}</div>
            ${this.#collections} ${this.#tip}
        </div>`;
    }
}

customElements.define('merch-card-collection-editor', MerchCardCollectionEditor);
