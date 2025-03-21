import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { styles } from './merch-card-collection-editor.css.js';
import {
    FIELD_MODEL_MAPPING,
    COLLECTION_MODEL_PATH,
    CARD_MODEL_PATH,
} from '../constants.js';
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

    #fragmentReferencesMap;

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
        // Add event listeners to the host element
        this.addEventListener('dragover', this.handleDragOver);
        this.addEventListener('dragleave', this.handleDragLeave);
        this.addEventListener('drop', this.handleDrop);
    }

    disconnectedCallback() {
        // Remove event listeners when component is disconnected
        this.removeEventListener('dragover', this.handleDragOver);
        this.removeEventListener('dragleave', this.handleDragLeave);
        this.removeEventListener('drop', this.handleDrop);
        super.disconnectedCallback();
        // Remove any preview element from the light DOM
        this.hideItemPreview();
    }

    update(changedProperties) {
        // Initialize fragment references map when fragment changes
        if (changedProperties.has('fragmentStore')) {
            this.initFragmentReferencesMap();
        }
        super.update(changedProperties);
    }

    async initFragmentReferencesMap() {
        if (!this.fragmentStore) return;

        // Create a new map or clear the existing one
        this.#fragmentReferencesMap = new Map();

        // Get all references from the fragment
        const references = this.fragment.references || [];

        // Create a FragmentStore for each reference
        for (const ref of references) {
            let fragmentStore = Store.fragments.list.data
                .get()
                .find((store) => store.value.id === ref.id);

            if (!fragmentStore) {
                const fragment = await getFromFragmentCache(ref.id);
                if (!fragment) continue;
                fragmentStore = new FragmentStore(fragment);
                this.#fragmentReferencesMap.set(ref.path, fragmentStore);
            }
        }

        // Request an update to reflect changes
        this.requestUpdate();
    }

    editFragment(item) {
        const fragmentStore = this.#fragmentReferencesMap.get(item);
        if (!fragmentStore) return;
        editFragment(fragmentStore);
    }

    get label() {
        return (
            this.fragment?.fields?.find((f) => f.name === 'label')
                ?.values?.[0] || ''
        );
    }

    get icon() {
        return (
            this.fragment?.fields?.find((f) => f.name === 'icon')
                ?.values?.[0] || ''
        );
    }

    get #cardsHeader() {
        return html`
            <div class="section-header">
                <h2>Cards</h2>
                <div class="hide-cards-control">
                    <sp-field-label for="hide-cards">hide</sp-field-label>
                    <sp-switch
                        id="hide-cards"
                        .selected=${this.hideCards}
                        @change=${this.handleHideCardsChange}
                    ></sp-switch>
                </div>
            </div>
        `;
    }

    get fragment() {
        return this.fragmentStore.get();
    }

    /** returns only if there are cards to render */
    get #cards() {
        if (!this.fragment) return nothing;

        const cardsField = this.fragment.fields.find(
            (field) => field.name === 'cards',
        );

        if (!cardsField?.values?.length) return nothing;

        return html`
            ${this.#cardsHeader}
            <div class="${this.hideCards ? 'hidden' : ''}">
                ${this.getItems(cardsField)}
            </div>
        `;
    }

    get #collections() {
        if (!this.fragment) return nothing;

        const collectionsField = this.fragment.fields.find(
            (field) => field.name === 'collections',
        );

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

    actions(fragment) {
        return html`
            <div class="item-actions">
                <sp-action-button
                    quiet
                    variant="secondary"
                    @click="${() => this.removeItem(fragment.path)}"
                >
                    <sp-icon-close
                        slot="icon"
                        label="Remove item"
                    ></sp-icon-close>
                </sp-action-button>
                <sp-action-button
                    quiet
                    variant="secondary"
                    @click="${() => this.editFragment(fragment.path)}"
                >
                    <sp-icon-edit slot="icon" label="Edit item"></sp-icon-edit>
                </sp-action-button>
                ${fragment.model?.path === CARD_MODEL_PATH
                    ? html`
                          <sp-icon-preview
                              slot="icon"
                              label="Preview item"
                              @mouseover="${(e) =>
                                  this.showItemPreview(e, fragment)}"
                              @mouseout="${() => this.hideItemPreview()}"
                          ></sp-icon-preview>
                      `
                    : nothing}
                <sp-icon-drag-handle label="Order"></sp-icon-drag-handle>
            </div>
        `;
    }

    getItems(field) {
        return html`
            <div class="items-container">
                ${repeat(
                    field.values,
                    (item) => item, // Use the item path as the key
                    (item, index) => {
                        // Get the fragment reference for this item
                        const fragmentStore =
                            this.#fragmentReferencesMap.get(item);
                        if (!fragmentStore) return nothing;

                        const fragment = fragmentStore.get();
                        if (!fragment) return nothing;

                        // Get the label and icon from the fragment based on its type
                        let label;
                        let iconPaths = [];

                        if (fragment.model?.path === COLLECTION_MODEL_PATH) {
                            // For collections
                            label = fragment.fields?.find(
                                (field) => field.name === 'label',
                            )?.values?.[0];

                            const iconPath =
                                fragment.fields?.find(
                                    (field) => field.name === 'icon',
                                )?.values?.[0] || '';

                            if (iconPath) {
                                iconPaths = [iconPath];
                            }
                        } else {
                            // For cards
                            label = fragment.fields?.find(
                                (field) => field.name === 'cardTitle',
                            )?.values?.[0];

                            // Get all icons from mnemonicIcon array
                            iconPaths =
                                fragment.fields?.find(
                                    (field) => field.name === 'mnemonicIcon',
                                )?.values || [];
                        }

                        iconPaths = iconPaths.slice(0, 2);

                        return html`
                            <div
                                class="item-wrapper"
                                draggable="true"
                                @dragstart="${(e) =>
                                    this.#dragStart(e, index, fragment.model)}"
                                @dragover="${(e) =>
                                    this.#dragOver(e, index, fragment.model)}"
                                @dragleave="${this.#dragLeave}"
                                @drop="${(e) =>
                                    this.#drop(e, index, fragment.model)}"
                                @dragend="${this.#dragEnd}"
                            >
                                <div class="item-content">
                                    <div class="item-text">
                                        <div class="item-label">${label}</div>
                                        <div class="item-subtext">
                                            ${fragment.name}
                                        </div>
                                    </div>
                                    ${iconPaths.length > 0
                                        ? html`
                                              <div class="item-icons">
                                                  ${iconPaths.map(
                                                      (iconPath) => html`
                                                          <img
                                                              src="${iconPath}"
                                                              alt="${label} icon"
                                                              class="item-icon"
                                                          />
                                                      `,
                                                  )}
                                              </div>
                                          `
                                        : nothing}
                                </div>
                                ${this.actions(fragment)}
                            </div>
                        `;
                    },
                )}
            </div>
        `;
    }

    // Handle drag start
    #dragStart(e, index, model) {
        this.draggingIndex = index;

        this.draggingFieldName = FIELD_MODEL_MAPPING[model.path];

        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    // Handle drag over
    #dragOver(e, index, model) {
        e.preventDefault();
        e.stopPropagation();

        // Check if this is an external drag (draggingIndex is -1)
        if (this.draggingIndex === -1) {
            // For external drags, check if we can accept this type of fragment
            try {
                // Check if the dataTransfer contains application/json type
                const hasJsonData = Array.from(e.dataTransfer.types).includes(
                    'application/json',
                );

                if (hasJsonData) {
                    e.dataTransfer.dropEffect = 'copy';
                    e.target
                        .closest('.item-wrapper')
                        ?.classList.add('dragover');
                }
            } catch (error) {
                console.error('Error in external dragOver:', error);
            }
            return;
        }

        // For internal drags, only allow drag over if the model paths match (card to card, collection to collection)
        if (
            this.draggingIndex !== index &&
            this.draggingFieldName === FIELD_MODEL_MAPPING[model.path]
        ) {
            e.target.classList.add('dragover');
        }
    }

    // Handle drag leave
    #dragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        // Remove dragover class from the item wrapper
        const itemWrapper = e.currentTarget.closest('.item-wrapper');
        if (itemWrapper) {
            itemWrapper.classList.remove('dragover');
        } else if (e.currentTarget === e.target) {
            // Make sure we're only removing the class from the current target
            // and not from child elements
            e.currentTarget.classList.remove('dragover');
        }
    }

    // Handle drop
    #drop(e, index, model) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.fragment) return;

        // Check if this is an external drop (draggingIndex is -1 for external drops)
        if (this.draggingIndex === -1) {
            // This is an external drop, so handle it with the main handleDrop method
            // We need to pass the correct field name based on the model path
            const fieldName = FIELD_MODEL_MAPPING[model.path];

            try {
                const data = e.dataTransfer.getData('application/json');
                if (data) {
                    const fragmentData = JSON.parse(data);

                    // Check if the model types match
                    if (
                        FIELD_MODEL_MAPPING[fragmentData.model.path] !==
                        fieldName
                    ) {
                        console.warn(
                            'Cannot drop items between different sections',
                        );
                        return;
                    }

                    // Get the current field values
                    const field = this.fragment.fields.find(
                        (field) => field.name === fieldName,
                    );

                    if (!field) {
                        console.error(`Field ${fieldName} not found`);
                        return;
                    }

                    // Add the new item at the specific index
                    const newValues = [...(field.values || [])];
                    newValues.splice(index, 0, fragmentData.path);

                    this.updateFragment({
                        target: {
                            multiline: true,
                            dataset: { field: fieldName },
                        },
                        values: [...new Set(newValues)], // Ensure no duplicates
                    });

                    // Check if the reference already exists
                    const existingReference = this.fragment.references?.find(
                        (ref) => ref.path === fragmentData.path,
                    );

                    if (!existingReference) {
                        // Add the new reference
                        this.fragment.references = [
                            ...(this.fragment.references || []),
                            fragmentData,
                        ];

                        // Create a FragmentStore for the new reference
                        this.#fragmentReferencesMap.set(
                            fragmentData.path,
                            new FragmentStore(new Fragment(fragmentData)),
                        );
                    }

                    // Remove dragover class from all elements
                    this.#removeAllDragoverClasses();

                    this.requestUpdate();
                }
            } catch (error) {
                console.error('Error handling external drop:', error);
            }

            return;
        }

        // Prevent dropping cards into collections and vice versa
        if (this.draggingFieldName !== FIELD_MODEL_MAPPING[model.path]) {
            console.warn('Cannot drop items between different sections');
            return;
        }

        const currentFieldName = FIELD_MODEL_MAPPING[model.path];

        // Get the values from the current field
        const field = this.fragment.fields.find(
            (field) => field.name === currentFieldName,
        );

        if (!field?.values?.length) {
            console.error(`Field ${currentFieldName} has no values`);
            return;
        }

        // Get the dragged item path
        const draggedPath = field.values[this.draggingIndex];
        if (!draggedPath) {
            console.error(`No item found at index ${this.draggingIndex}`);
            return;
        }

        // Create a copy of the values array
        const newValues = [...field.values];

        // Remove the dragging item from its original position
        newValues.splice(this.draggingIndex, 1);

        // Insert the dragging item into the new position
        newValues.splice(index, 0, draggedPath);

        this.updateFragment({
            target: {
                multiline: true,
                dataset: { field: currentFieldName },
            },
            values: newValues,
        });

        // Remove dragover class from all elements
        this.#removeAllDragoverClasses();

        // Reset drag state
        this.draggingIndex = -1;
        this.draggingFieldName = null;

        // Request an update to reflect changes
        this.requestUpdate();
    }

    // Helper method to remove all dragover classes
    #removeAllDragoverClasses() {
        // Remove dragover class from all elements in shadow DOM
        if (this.shadowRoot) {
            this.shadowRoot.querySelectorAll('.dragover').forEach((element) => {
                element.classList.remove('dragover');
            });
        }

        // Remove dragover class from the host element
        this.classList.remove('dragover');

        // Find all item wrappers and remove dragover class
        const itemWrappers = this.shadowRoot?.querySelectorAll('.item-wrapper');
        if (itemWrappers) {
            itemWrappers.forEach((wrapper) => {
                wrapper.classList.remove('dragover');
            });
        }
    }

    // Handle drag end
    #dragEnd(e) {
        e.target.classList.remove('dragging');
        // Remove all dragover indicators
        this.#removeAllDragoverClasses();
        // Reset drag state
        this.draggingIndex = -1;
        this.draggingFieldName = null;
    }

    // Method to remove an item
    removeItem(path) {
        if (!this.fragment) return;

        // Get the fragment reference for this path
        const fragmentStore = this.#fragmentReferencesMap.get(path);
        if (!fragmentStore) return;

        const fragment = fragmentStore.get();
        if (!fragment) return;

        // Determine if this is a card or collection based on the model path
        const fieldName = FIELD_MODEL_MAPPING[fragment.model?.path];
        if (!fieldName) return;

        const field = this.fragment.fields.find(
            (field) => field.name === fieldName,
        );

        if (!field?.values?.length) return;

        // Create a copy of the values array
        const newValues = [...field.values];

        // Find the index of the path in the values array
        const index = newValues.indexOf(path);
        if (index === -1) return;

        // Remove the item at the specified index
        newValues.splice(index, 1);

        this.updateFragment({
            target: {
                multiline: true,
                dataset: { field: fieldName },
            },
            values: newValues,
        });

        // Request an update to reflect changes
        this.requestUpdate();
    }

    handleHideCardsChange(event) {
        this.hideCards = event.target.checked;
    }

    get form() {
        return html`
            <div class="form-container">
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
                    <sp-field-label for="icon">Icon</sp-field-label>
                    <sp-textfield
                        id="icon"
                        data-field="icon"
                        .value=${this.icon}
                        @input=${this.updateFragment}
                    ></sp-textfield>
                </div>
            </div>
        `;
    }

    get #tip() {
        if (this.#cards !== nothing || this.#collections !== nothing)
            return nothing;
        return html`
            <div class="tip">
                <sp-icon-info-outline></sp-icon-info-outline>
                <div>
                    Drag and drop cards or collections to add to this
                    collection.
                </div>
            </div>
        `;
    }

    handleDragOver(event) {
        // Prevent default to allow drop
        event.preventDefault();

        // Check if we can accept this type of fragment
        const isAcceptable = this.canAcceptDraggedFragment(event);

        if (isAcceptable) {
            event.dataTransfer.dropEffect = 'copy';
            this.classList.add('dragover');
        } else {
            event.dataTransfer.dropEffect = 'none';
        }
    }

    handleDragLeave(event) {
        // Only remove the class if we're leaving the host element
        // and not just moving between its children
        if (
            event.currentTarget === this &&
            !this.contains(event.relatedTarget)
        ) {
            this.classList.remove('dragover');
        }
    }

    canAcceptDraggedFragment(event) {
        try {
            // During dragover, getData might not be available in some browsers
            // We'll try to get the data, but if it fails, we'll use a more permissive approach
            let fragmentData;
            try {
                const data = event.dataTransfer.getData('application/json');
                if (data) {
                    fragmentData = JSON.parse(data);
                }
            } catch (e) {
                // During dragover, getData might throw an error in some browsers
                // We'll continue with a null fragmentData
            }

            // If we couldn't get the data (common during dragover), check if the dataTransfer has the right type
            if (!fragmentData) {
                // Check if the dataTransfer contains application/json type
                return Array.from(event.dataTransfer.types).includes(
                    'application/json',
                );
            }

            // Check if the model path is one we can accept
            return FIELD_MODEL_MAPPING[fragmentData.model.path] !== undefined;
        } catch (e) {
            console.error('Error in canAcceptDraggedFragment:', e);
            // During dragover, we'll be more permissive
            // Allow the drop for now, we'll validate on actual drop
            return true;
        }
    }

    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.classList.remove('dragover');

        const data = event.dataTransfer.getData('application/json');
        if (!data) {
            console.warn('No data received in drop event');
            // Remove any lingering dragover indicators
            this.#removeAllDragoverClasses();
            return;
        }

        const fragmentData = JSON.parse(data);
        // Determine the appropriate field based on the model path
        const fieldName = FIELD_MODEL_MAPPING[fragmentData.model.path];

        if (!fieldName) {
            console.warn(
                `No field mapping found for model path: ${fragmentData.model.path}`,
            );
            // Remove any lingering dragover indicators
            this.#removeAllDragoverClasses();
            return;
        }

        // Ensure we have a fragment to work with
        if (!this.fragment) {
            console.error('No fragment available to update');
            // Remove any lingering dragover indicators
            this.#removeAllDragoverClasses();
            return;
        }

        // Get the current field values
        const field = this.fragment.fields.find(
            (field) => field.name === fieldName,
        );

        // Check if the drop target is a specific section
        const dropTarget = event.target.closest('[data-field-name]');
        if (dropTarget) {
            const targetFieldName = dropTarget.getAttribute('data-field-name');
            // If dropping onto a specific section, ensure the model type matches
            if (targetFieldName !== fieldName) {
                console.warn(
                    `Cannot drop ${fieldName} into ${targetFieldName} section`,
                );
                // Remove any lingering dragover indicators
                this.#removeAllDragoverClasses();
                return;
            }
        }

        this.updateFragment({
            target: {
                multiline: true,
                dataset: { field: fieldName },
            },
            values: [...new Set([...field.values, fragmentData.path])],
        });

        // Check if the reference already exists
        const existingReference = this.fragment.references?.find(
            (ref) => ref.path === fragmentData.path,
        );

        if (!existingReference) {
            // Add the new reference
            this.fragment.references = [
                ...this.fragment.references,
                fragmentData,
            ];

            // Create a FragmentStore for the new reference
            this.#fragmentReferencesMap.set(
                fragmentData.path,
                new FragmentStore(new Fragment(fragmentData)),
            );
        }

        // Remove any lingering dragover indicators
        this.#removeAllDragoverClasses();

        this.requestUpdate();
    }

    // Handle preview show
    showItemPreview(event, fragment) {
        event.stopPropagation();

        // Get the position of the trigger element (icon that was hovered)
        const triggerRect = event.target.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        // Get the editor panel element
        const editorRect = this.getBoundingClientRect();

        // Determine which side has more space (left or right of the editor)
        const spaceOnRight = viewportWidth - editorRect.right;
        const spaceOnLeft = editorRect.left;

        const position = {
            // Align with the top of the trigger for vertical positioning
            top: triggerRect.top,
            // Center the preview in the available space outside the editor
            ...(spaceOnRight > spaceOnLeft
                ? {
                      left: editorRect.right + spaceOnRight / 2 - 150, // Assuming preview width ~300px
                      right: undefined,
                  }
                : {
                      right:
                          viewportWidth -
                          editorRect.left +
                          spaceOnLeft / 2 -
                          150,
                      left: undefined,
                  }),
        };

        this.previewItem = fragment;
        this.renderPreviewInLightDOM(position, fragment);
    }

    // Handle preview hide
    hideItemPreview() {
        // Remove the preview element from the light DOM
        if (
            this.previewElement &&
            document.body.contains(this.previewElement)
        ) {
            document.body.removeChild(this.previewElement);
            this.previewElement = null;
        }
    }

    // Render the preview in the light DOM
    async renderPreviewInLightDOM(position, previewItem) {
        // Remove any existing preview element
        if (
            this.previewElement &&
            document.body.contains(this.previewElement)
        ) {
            document.body.removeChild(this.previewElement);
        }
        // Get the fragment reference for this item
        const fragmentStore = this.#fragmentReferencesMap.get(previewItem.path);
        if (!fragmentStore) return;

        const fragment = fragmentStore.get();
        if (!fragment) return;

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

        // Store reference to the container element
        this.previewElement = container;
        await container.querySelector('aem-fragment').updateComplete;
        await container.querySelector('merch-card').checkReady();
        container.querySelector('sp-progress-circle').remove();
    }

    render() {
        return html`<div class="editor-container">
            ${this.form}
            <div data-field-name="cards-section">${this.#cards}</div>
            ${this.#collections} ${this.#tip}
        </div>`;
    }
}

customElements.define(
    'merch-card-collection-editor',
    MerchCardCollectionEditor,
);
