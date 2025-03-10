import { html, LitElement, nothing, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import '../fields/multifield.js';
import '../fields/mnemonic-field.js';
import '../swc.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';

const MODEL_PATH = '/conf/mas/settings/dam/cfm/models/collection';

class MerchCardCollectionEditor extends LitElement {
    static get properties() {
        return {
            fragment: { type: Object, attribute: false },
            draggingIndex: { type: Number, state: true },
            draggingType: { type: String, state: true },
            fragmentReferencesMap: { type: Object, attribute: false },
            draggingElement: { type: Object, state: true },
            expandedCollections: { type: Object, state: true },
            subCollections: { type: Boolean },
        };
    }

    static get styles() {
        return css`
            :host {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Collection title styles */
            .collection-title {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                font-weight: bold;
                flex-grow: 1;
                margin-right: 8px;
            }

            .collection-title img {
                width: 24px;
                height: 24px;
            }

            /* Collection header styles */
            .collection-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                position: relative;
                width: 100%;
                box-sizing: border-box;
                justify-content: flex-start;
            }

            .collection-header .collection-title {
                margin-bottom: 0;
            }

            /* Collection icon styles */
            .collection-icon {
                width: 24px;
                height: 24px;
                object-fit: contain;
            }

            /* Card icon styles */
            .card-icon {
                width: 24px;
                height: 24px;
            }

            /* Collection wrapper styles */
            .collection-wrapper {
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                margin-bottom: 8px;
                overflow: hidden;
                width: 100%;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            }

            .collection-wrapper.expanded {
                background-color: #f9f9f9;
            }

            .collection-wrapper.dragging {
                opacity: 0.5;
            }

            .collection-wrapper.dragover {
                outline: 2px dashed var(--spectrum-global-color-blue-400);
            }

            /* Collection content styles */
            .collection-content {
                padding: 12px;
                width: 100%;
                box-sizing: border-box;
            }

            /* Expand icon styles */
            .expand-icon {
                transition: transform 0.2s ease;
            }

            .expand-icon.expanded {
                transform: rotate(90deg);
            }

            /* Merch card list styles */
            .merch-card-list {
                list-style: none;
                padding: 0;
                margin: 0;
                width: 100%;
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
            }

            /* Merch card item styles */
            .merch-card-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                margin-bottom: 8px;
                padding-inline-end: 100px;
                position: relative;
            }

            .merch-card-item.dragging {
                opacity: 0.5;
            }

            .merch-card-item.dragover {
                outline: 2px dashed var(--spectrum-global-color-blue-400);
            }

            /* Drag handle styles */
            sp-icon-drag-handle {
                visibility: hidden;
                position: absolute;
                right: 8px;
                cursor: grab;
                color: #666;
            }

            /* Position drag handle for cards */
            .merch-card-item sp-icon-drag-handle {
                top: 50%;
                transform: translateY(-50%);
            }

            /* Position drag handle for collections */
            .collection-wrapper sp-icon-drag-handle {
                top: 8px;
            }

            /* Show drag handle on hover */
            .merch-card-item:hover sp-icon-drag-handle,
            .collection-wrapper:hover sp-icon-drag-handle {
                visibility: visible;
            }

            /* Disable drag handle when collection is expanded */
            .collection-wrapper.expanded sp-icon-drag-handle {
                opacity: 0.3;
                pointer-events: none;
            }
        `;
    }

    constructor() {
        super();
        this.fragment = null;
        this.cards = [];
        this.collections = [];
        this.draggingIndex = -1;
        this.draggingType = '';
        this.draggingElement = null;
        this.fragmentReferencesMap = null;
        this.expandedCollections = new Map();
    }

    update(changedProperties) {
        // Initialize fragment references map when fragment changes
        if (changedProperties.has('fragment')) {
            this.initFragmentReferencesMap();
        }
        super.update(changedProperties);
    }

    initFragmentReferencesMap() {
        if (this.fragmentReferencesMap) return;
        if (!this.fragment) return;

        this.fragmentReferencesMap = new Map(
            this.fragment.value.references.map((ref) => [
                ref.path,
                new FragmentStore(new Fragment(ref)),
            ]),
        );
    }

    toggleCollectionExpanded(collectionId) {
        // Toggle the expanded state for this collection
        const currentState =
            this.expandedCollections.get(collectionId) || false;

        this.expandedCollections.set(collectionId, !currentState);

        // Force a re-render
        this.requestUpdate();
    }

    isCollectionExpanded(collectionId) {
        return this.expandedCollections.get(collectionId) || false;
    }

    get #collection() {
        if (this.subCollections) {
            return nothing;
        }

        // Get the collection data from the fragment
        const titleField = this.fragment.value.fields.find(
            (field) => field.name === 'title',
        );
        const iconField = this.fragment.value.fields.find(
            (field) => field.name === 'icon',
        );

        // Get the collection ID from the fragment value
        const collectionId = this.fragment.value.id || '';

        return html`<h2 class="collection-title" id="${collectionId}">
            <img src="${iconField?.values?.[0] || ''}" alt="" />
            ${titleField?.values?.[0] || ''}
        </h2>`;
    }

    // Handle drag start
    dragStart(e, index, type) {
        // Store the dragging information
        this.draggingIndex = index;
        this.draggingType = type;

        // Set data transfer properties
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);

        // Add visual indication
        e.currentTarget.classList.add('dragging');

        // Store the dragging element for reliable reference
        this.draggingElement = e.currentTarget;

        // Remove dragging class from all other elements of the same type
        this.shadowRoot
            .querySelectorAll(
                type === 'card' ? '.merch-card-item' : '.collection-wrapper',
            )
            .forEach((item) => {
                if (item !== e.currentTarget) {
                    item.classList.remove('dragging');
                }
            });
    }

    // Handle drag over
    dragOver(e, index, type) {
        // Prevent default to allow drop
        e.preventDefault();

        // Only show drop indication if it's the same type and different index
        if (this.draggingType === type && this.draggingIndex !== index) {
            e.currentTarget.classList.add('dragover');
        }

        return false;
    }

    // Handle drag leave
    dragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    // Handle drop
    drop(e, index, type) {
        // Prevent default browser behavior
        e.preventDefault();
        e.stopPropagation();

        // Remove visual indication
        e.currentTarget.classList.remove('dragover');

        // Remove dragging class from the dragged element
        if (this.draggingElement) {
            this.draggingElement.classList.remove('dragging');
            this.draggingElement = null;
        }

        // Only process if we're dropping on a different item of the same type
        if (this.draggingType !== type || this.draggingIndex === index) {
            return false;
        }

        // Get the field name based on type
        const fieldName = type === 'card' ? 'cards' : 'collections';

        // Find the field in the fragment
        const field = this.fragment.value.fields.find(
            (field) => field.name === fieldName,
        );
        if (!field || !field.values) {
            return false;
        }

        // Create a copy of the values array
        const values = [...field.values];

        // Get the item being dragged
        const draggedItem = values[this.draggingIndex];

        // Remove the item from its original position
        values.splice(this.draggingIndex, 1);

        // Insert the item at the new position
        values.splice(index, 0, draggedItem);

        // Update the field values directly for immediate visual feedback
        field.values = values;

        this.fragment.updateField(fieldName, values);

        // Dispatch a change event to notify parent components
        this.dispatchEvent(
            new CustomEvent('fragment-changed', {
                bubbles: true,
                composed: true,
                detail: {
                    fieldName,
                    values,
                },
            }),
        );

        // Reset drag state
        this.draggingIndex = -1;
        this.draggingType = '';

        // Force a re-render
        this.requestUpdate();

        return false;
    }

    // Handle drag end
    dragEnd(e) {
        // Remove visual indication
        if (this.draggingElement) {
            this.draggingElement.classList.remove('dragging');
            this.draggingElement = null;
        } else {
            e.currentTarget.classList.remove('dragging');
        }

        // Reset drag state
        this.draggingIndex = -1;
        this.draggingType = '';
    }

    get #cards() {
        const cardsField = this.fragment.value.fields.find(
            (field) => field.name === 'cards',
        );

        if (!cardsField?.values?.length) return nothing;

        return html` <ul class="merch-card-list">
            ${repeat(
                cardsField.values,
                (cardPath, index) => cardPath || index,
                (cardPath, index) => {
                    // If it's a path, look up the reference
                    if (typeof cardPath === 'string') {
                        const cardRef =
                            this.fragmentReferencesMap.get(cardPath);
                        if (cardRef) {
                            const titleField = cardRef.value.fields.find(
                                (field) => field.name === 'title',
                            );
                            const iconField = cardRef.value.fields.find(
                                (field) => field.name === 'icon',
                            );
                            const iconSrc =
                                iconField?.values?.[0] ||
                                '/test/mocks/img/icon.svg';
                            return html`
                                <li
                                    class="merch-card-item"
                                    draggable="true"
                                    @dragstart=${(e) =>
                                        this.dragStart(e, index, 'card')}
                                    @dragover=${(e) =>
                                        this.dragOver(e, index, 'card')}
                                    @dragleave=${this.dragLeave}
                                    @drop=${(e) => this.drop(e, index, 'card')}
                                    @dragend=${this.dragEnd}
                                >
                                    <img
                                        src="${iconSrc}"
                                        alt=""
                                        class="card-icon"
                                    />
                                    ${titleField?.values?.[0] || ''}
                                    <sp-icon-drag-handle
                                        class="drag-handle"
                                        label="Order"
                                    ></sp-icon-drag-handle>
                                </li>
                            `;
                        }
                    }
                },
            )}
        </ul>`;
    }

    get #collections() {
        const collectionsField = this.fragment.value.fields.find(
            (field) => field.name === 'collections',
        );

        if (!collectionsField?.values?.length) return nothing;

        return html` <ul class="merch-card-list">
            ${repeat(
                collectionsField.values,
                (collectionPath, index) => collectionPath || index,
                (collectionPath, index) => {
                    // If it's a path, look up the reference
                    if (typeof collectionPath === 'string') {
                        const collectionRef =
                            this.fragmentReferencesMap.get(collectionPath);

                        // Get collection ID, title and icon
                        const collectionId =
                            collectionRef.value?.id || `collection-${index}`;
                        const titleField = collectionRef.value.fields?.find(
                            (field) => field.name === 'title',
                        );
                        const iconField = collectionRef.value.fields?.find(
                            (field) => field.name === 'icon',
                        );
                        const title =
                            titleField?.values?.[0] || 'Untitled Collection';
                        const iconSrc = iconField?.values?.[0] || '';

                        const isExpanded =
                            this.isCollectionExpanded(collectionId);

                        return html`
                            <div
                                class="collection-wrapper ${isExpanded
                                    ? 'expanded'
                                    : 'collapsed'}"
                                draggable="${!isExpanded}"
                                id="${collectionId}"
                                @dragstart=${(e) => {
                                    if (!isExpanded) {
                                        this.dragStart(e, index, 'collection');
                                    } else {
                                        e.preventDefault();
                                    }
                                }}
                                @dragover=${(e) =>
                                    this.dragOver(e, index, 'collection')}
                                @dragleave=${this.dragLeave}
                                @drop=${(e) =>
                                    this.drop(e, index, 'collection')}
                                @dragend=${this.dragEnd}
                            >
                                <div
                                    class="collection-header"
                                    @click=${() =>
                                        this.toggleCollectionExpanded(
                                            collectionId,
                                        )}
                                >
                                    <sp-icon-chevron-right
                                        class="expand-icon ${isExpanded
                                            ? 'expanded'
                                            : ''}"
                                    ></sp-icon-chevron-right>
                                    ${iconSrc
                                        ? html`<img
                                              src="${iconSrc}"
                                              alt=""
                                              class="collection-icon"
                                          />`
                                        : nothing}
                                    <span class="collection-title">
                                        ${title}
                                    </span>
                                    <sp-icon-drag-handle
                                        class="drag-handle"
                                        label="Order"
                                    ></sp-icon-drag-handle>
                                </div>
                                ${isExpanded
                                    ? html`<div class="collection-content">
                                          <merch-card-collection-editor
                                              .fragmentReferencesMap=${this
                                                  .fragmentReferencesMap}
                                              .fragment=${collectionRef}
                                              .subCollections=${true}
                                          ></merch-card-collection-editor>
                                      </div>`
                                    : nothing}
                            </div>
                        `;
                    }
                },
            )}
        </ul>`;
    }

    render() {
        if (!this.fragment || this.fragment.value.model?.path !== MODEL_PATH) {
            return nothing;
        }

        return html` ${this.#collection} ${this.#cards} ${this.#collections} `;
    }
}

customElements.define(
    'merch-card-collection-editor',
    MerchCardCollectionEditor,
);
