import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { styles } from './merch-card-collection-editor.css.js';
import { FIELD_MODEL_MAPPING, COLLECTION_MODEL_PATH, CARD_MODEL_PATH } from '../constants.js';
import Store, { editFragment } from '../store.js';
import { getFromFragmentCache } from '../mas-repository.js';

class MerchCardCollectionEditor extends LitElement {
    static get properties() {
        return {
            draggingFieldName: { type: String, state: true },
            draggingIndex: { type: Number, state: true },
            fragmentStore: { type: Object, attribute: false },
            updateFragment: { type: Function },
            hideCards: { type: Boolean, state: true },
            previewItem: { type: String, state: true },
            previewPosition: { type: Object, state: true },
            previewElement: { type: Object, state: true },
        };
    }

    #fragmentReferencesMap = new Map();

    static get styles() {
        return [styles];
    }

    constructor() {
        super();
        this.draggingFieldName = null;
        this.draggingIndex = -1;
        this.fragmentStore = null;
        this.updateFragment = null;
        this.hideCards = false;
        this.previewItem = null;
        this.previewPosition = { top: 0, left: 0 };
        this.previewElement = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.#addEventListeners();
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
    }

    editFragment(item) {
        const fragmentStore = this.#fragmentReferencesMap.get(item);
        if (fragmentStore) editFragment(fragmentStore);
    }

    get label() {
        return this.fragment?.fields?.find((f) => f.name === 'label')?.values?.[0] || '';
    }

    get navigationLabel() {
        return this.fragment?.fields?.find((f) => f.name === 'navigationLabel')?.values?.[0] || '';
    }

    get icon() {
        return this.fragment?.fields?.find((f) => f.name === 'icon')?.values?.[0] || '';
    }

    get iconLight() {
        return this.fragment?.fields?.find((f) => f.name === 'iconLight')?.values?.[0] || '';
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    #getField(fieldName) {
        return this.fragment?.fields?.find((field) => field.name === fieldName);
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
        if (!cardsField?.values?.length) return nothing;

        return html`
            ${this.#cardsHeader}
            <div class="cards-container ${this.hideCards ? 'hidden' : ''}">${this.getItems(cardsField)}</div>
        `;
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
        if (this.#cards !== nothing || this.#collections !== nothing) return nothing;

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
            <div class="items-container">
                ${repeat(
                    field.values,
                    (item) => item,
                    (item, index) => {
                        const fragmentStore = this.#fragmentReferencesMap.get(item);
                        if (!fragmentStore) return nothing;

                        const fragment = fragmentStore.get();
                        if (!fragment) return nothing;

                        const { label, iconPaths } = this.#getFragmentInfo(fragment);

                        return html`
                            <div
                                class="item-wrapper"
                                draggable="true"
                                @dragstart="${(e) => this.#dragStart(e, index, fragment.model)}"
                                @dragover="${(e) => this.#dragOver(e, index, fragment.model)}"
                                @dragleave="${this.#dragLeave}"
                                @drop="${(e) => this.#drop(e, index, fragment.model)}"
                                @dragend="${this.#dragEnd}"
                            >
                                <div class="item-content">
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

        // Set data for internal drags - needed for Firefox and other browsers that require data
        e.dataTransfer.setData(
            'application/json',
            JSON.stringify({
                isInternalDrag: true,
                sourceIndex: index,
                fieldName: this.draggingFieldName,
            }),
        );

        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    #dragOver(e, index, model) {
        e.preventDefault();
        e.stopPropagation();

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
            e.currentTarget.classListn.remove('dragover');
        }
    }

    #drop(e, index, model) {
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
                if (data) {
                    fragmentData = JSON.parse(data);
                }
            } catch (e) {
                // During dragover, getData might throw in some browsers
            }

            // Check for internal drag
            if (fragmentData && fragmentData.isInternalDrag === true) {
                return true;
            }

            // If data not available, check type
            if (!fragmentData) {
                return Array.from(event.dataTransfer.types).includes('application/json');
            }

            // Validate model path
            if (!fragmentData.model || FIELD_MODEL_MAPPING[fragmentData.model.path] === undefined) {
                return false;
            }

            // Check for duplicates
            if (fragmentData.path && this.isFragmentAlreadyInCollection(fragmentData.path)) {
                return false;
            }

            return true;
        } catch (e) {
            // Be permissive during dragover
            return true;
        }
    }

    isFragmentAlreadyInCollection(fragmentPath) {
        if (!this.fragment || !fragmentPath) return false;

        const cardsField = this.#getField('cards');
        const collectionsField = this.#getField('collections');

        const existingItems = [...(cardsField?.values || []), ...(collectionsField?.values || [])];

        return existingItems.includes(fragmentPath);
    }

    handleDropOperation(event, targetFieldName = null, targetIndex = -1, isInternalDrop = false) {
        if (!this.fragment) return;
        event.preventDefault();
        event.stopPropagation();

        this.#removeAllDragoverClasses();

        try {
            const data = event.dataTransfer.getData('application/json');
            if (!data) {
                console.warn('No data received in drop event');
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
            console.error('Error handling drop:', error);
        }
    }

    #handleInternalDrop(parsedData, targetFieldName, targetIndex) {
        const fieldName = this.draggingFieldName;
        const field = this.#getField(fieldName);

        if (!field || !field.values) {
            console.error(`Field ${fieldName} not found or has no values`);
            return;
        }

        // Check if dropping into different field type
        if (targetFieldName && targetFieldName !== fieldName) {
            console.warn('Cannot drop items between different sections');
            return;
        }

        // For internal reordering
        const newValues = [...field.values];

        // Get the dragged item path
        const draggedPath = newValues[this.draggingIndex];
        if (!draggedPath) {
            console.error(`No item found at index ${this.draggingIndex}`);
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
            console.warn(`No field mapping found for model path: ${fragmentData.model?.path}`);
            return;
        }

        // Check for duplicates
        if (this.isFragmentAlreadyInCollection(fragmentData.path)) {
            console.warn(`Fragment already exists in collection: ${fragmentData.path}`);
            return;
        }

        const fieldName = targetFieldName || FIELD_MODEL_MAPPING[fragmentData.model.path];

        // Check if drop is on specific section
        if (!targetFieldName) {
            const dropTarget = event.target.closest('[data-field-name]');
            if (dropTarget) {
                const sectionFieldName = dropTarget.getAttribute('data-field-name');
                if (sectionFieldName !== fieldName && sectionFieldName !== 'cards-section') {
                    console.warn(`Cannot drop ${fieldName} into ${sectionFieldName} section`);
                    return;
                }
            }
        }

        const field = this.#getField(fieldName);
        if (!field) {
            console.error(`Field ${fieldName} not found`);
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

    handleDragOver(event) {
        event.preventDefault();

        // Skip styling for internal drag
        if (this.draggingIndex !== -1) return;

        const isAcceptable = this.#canAcceptExternalDrag(event);

        if (isAcceptable) {
            event.dataTransfer.dropEffect = 'copy';
            this.classList.add('dragover');
        } else {
            event.dataTransfer.dropEffect = 'none';
        }
    }

    handleDragLeave(event) {
        if (event.currentTarget === this && !this.contains(event.relatedTarget)) {
            this.classList.remove('dragover');
        }
    }

    handleDrop(event) {
        const isAcceptable = this.#canAcceptExternalDrag(event);
        if (!isAcceptable) {
            this.#removeAllDragoverClasses();
            return;
        }

        this.handleDropOperation(event);
    }

    handleHideCardsChange(event) {
        this.hideCards = event.target.checked;
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

        this.previewItem = fragment;
        this.renderPreviewInLightDOM(position, fragment);
    }

    hideItemPreview() {
        if (this.previewElement && document.body.contains(this.previewElement)) {
            document.body.removeChild(this.previewElement);
            this.previewElement = null;
        }
    }

    async renderPreviewInLightDOM(position, previewItem) {
        // Remove any existing preview
        this.hideItemPreview();

        // Get the fragment for preview
        const fragmentStore = this.#fragmentReferencesMap.get(previewItem.path);
        if (!fragmentStore) return;

        const fragment = fragmentStore.get();
        if (!fragment) return;

        // Create preview container
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="preview-container">
                <div class="preview-backdrop"></div>
                <div class="preview-popover" style="${position.left !== undefined ? `left: ${position.left}px` : `right: ${position.right}px`}">
                    <div class="preview-content">
                        <merch-card>
                            <aem-fragment
                                author
                                ims
                                fragment="${previewItem.id}"
                            ></aem-fragment>
                        </merch-card>
                        <sp-progress-circle class="preview" indeterminate size="l"></sp-progress-circle>
                    </div>
                </div>
            </div>
        `;

        // Add to document body
        document.body.appendChild(container);
        this.previewElement = container;

        // Wait for components to load
        await container.querySelector('aem-fragment').updateComplete;
        await container.querySelector('merch-card').checkReady();
        container.querySelector('sp-progress-circle').remove();
    }

    get #form() {
        return html`
            <div class="form-container">
                <div class="form-row">
                    <sp-field-label for="label">Query label</sp-field-label>
                    <sp-textfield
                        id="label"
                        data-field="label"
                        .value=${this.label}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
                <div class="form-row">
                    <sp-field-label for="navigationLabel">Navigation label</sp-field-label>
                    <sp-textfield
                        id="navigationLabel"
                        data-field="navigationLabel"
                        .value=${this.navigationLabel}
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
        return html`<div class="editor-container">
            ${this.#form}
            <div data-field-name="cards-section">${this.#cards}</div>
            ${this.#collections} ${this.#tip}
        </div>`;
    }
}

customElements.define('merch-card-collection-editor', MerchCardCollectionEditor);
