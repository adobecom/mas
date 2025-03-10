import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import '../fields/multifield.js';
import '../fields/mnemonic-field.js';
import '../swc.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { styles } from './merch-card-collection-editor.css.js';

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
        return [styles];
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
        // If this collection is already expanded, just toggle it off
        const currentState =
            this.expandedCollections.get(collectionId) || false;

        if (currentState) {
            // If it's already expanded, just collapse it
            this.expandedCollections.set(collectionId, false);
        } else {
            // If it's not expanded, collapse all other collections first
            // and then expand this one
            this.expandedCollections.forEach((_, key) => {
                this.expandedCollections.set(key, false);
            });
            // Now expand this collection
            this.expandedCollections.set(collectionId, true);
        }

        // Force a re-render
        this.requestUpdate();
    }

    isCollectionExpanded(collectionId) {
        return this.expandedCollections.get(collectionId) || false;
    }

    get #collection() {
        // For subcollections, render a minimal header
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

        // For main collections, render the full header
        return html`<h2 class="collection-title" id="${collectionId}">
            <img src="${iconField?.values?.[0] || ''}" alt="" />
            ${titleField?.values?.[0] || ''}
        </h2>`;
    }

    // Handle drag start
    dragStart(e, index, type) {
        console.log(
            `dragStart: index=${index}, type=${type}, target=`,
            e.currentTarget,
        );
        // Store the dragging information
        this.draggingIndex = index;
        this.draggingType = type;

        // Set data transfer properties if available
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            // Add the type to help with drop validation
            e.dataTransfer.setData('application/type', type);
        }

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
        console.log('dragLeave', e.currentTarget);
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

        // Try to get the type from dataTransfer if draggingType is not set
        if (!this.draggingType && e.dataTransfer) {
            this.draggingType = e.dataTransfer.getData('application/type');
            console.log(
                `Retrieved type from dataTransfer: ${this.draggingType}`,
            );
        }

        // Only process if we're dropping on a different item of the same type
        if (this.draggingType !== type || this.draggingIndex === index) {
            console.log('Drop canceled: same index or different type');
            console.log(`draggingType: ${this.draggingType}, type: ${type}`);
            console.log(
                `draggingIndex: ${this.draggingIndex}, index: ${index}`,
            );
            return false;
        }

        // Get the field name based on type
        const fieldName = type === 'card' ? 'cards' : 'collections';

        // Find the field in the fragment
        const field = this.fragment.value.fields.find(
            (field) => field.name === fieldName,
        );
        if (!field || !field.values) {
            console.error(`Field ${fieldName} not found or has no values`);
            return false;
        }

        // Create a copy of the values array
        const values = [...field.values];

        // Get the item being dragged
        const draggedItem = values[this.draggingIndex];
        if (!draggedItem) {
            console.error(
                `Item at index ${this.draggingIndex} not found in ${fieldName}`,
            );
            return false;
        }

        console.log(`Dragged item: ${draggedItem}`);

        // Remove the item from its original position
        values.splice(this.draggingIndex, 1);

        // Insert the item at the new position
        values.splice(index, 0, draggedItem);

        console.log(
            `Reordering ${fieldName}: moved item from ${this.draggingIndex} to ${index}`,
        );

        // Update the field values directly for immediate visual feedback
        field.values = values;

        // Update the fragment
        try {
            this.fragment.updateField(fieldName, values);
            console.log(`Successfully updated fragment field ${fieldName}`);
        } catch (error) {
            console.error(`Error updating fragment field ${fieldName}:`, error);
        }

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
        console.log('dragEnd', e.currentTarget);
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

    // Handle nested drag events
    handleNestedDragEvent(e) {
        console.log('Received nested drag event:', e.type, e.detail);
        // For drag events, we need to handle them differently than custom events
        if (e.type.startsWith('drag') && e.type !== 'fragment-changed') {
            // For drag events, we need to handle the original event directly
            // instead of creating a new custom event

            // Update our local drag state
            if (e.detail && e.detail.draggingIndex !== undefined) {
                this.draggingIndex = e.detail.draggingIndex;
                this.draggingType = e.detail.draggingType;
                this.draggingElement = e.detail.draggingElement;
            }

            // For dragstart events, we need to dispatch a real DragEvent to the parent
            // but we can't create a real DragEvent with dataTransfer, so we'll just
            // update our local state and let the parent handle it
            this.requestUpdate();
            return;
        }

        // For non-drag events, forward them to the parent component
        this.dispatchEvent(
            new CustomEvent(e.type, {
                bubbles: true,
                composed: true,
                detail: e.detail,
            }),
        );

        // If it's a fragment-changed event, update our local state
        if (e.type === 'fragment-changed') {
            this.requestUpdate();
        }
    }

    // Add a method to handle direct drag events on collection items
    handleCollectionDrag(e, index, type) {
        // For dragover events, we need to prevent default to allow drop
        if (e.type === 'dragover') {
            e.preventDefault();
        }

        // For drop events, we need to prevent default and stop propagation
        if (e.type === 'drop') {
            e.preventDefault();
        }

        // Handle the drag event directly
        if (e.type === 'dragstart') {
            this.dragStart(e, index, type);
        } else if (e.type === 'dragover') {
            this.dragOver(e, index, type);
        } else if (e.type === 'dragleave') {
            this.dragLeave(e);
        } else if (e.type === 'drop') {
            this.drop(e, index, type);
        } else if (e.type === 'dragend') {
            this.dragEnd(e);
        }

        // Stop propagation after handling the event
        // This prevents the event from bubbling up to parent elements
        e.stopPropagation();
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
                                        this.handleCollectionDrag(
                                            e,
                                            index,
                                            'card',
                                        )}
                                    @dragover=${(e) =>
                                        this.handleCollectionDrag(
                                            e,
                                            index,
                                            'card',
                                        )}
                                    @dragleave=${(e) =>
                                        this.handleCollectionDrag(
                                            e,
                                            null,
                                            null,
                                        )}
                                    @drop=${(e) =>
                                        this.handleCollectionDrag(
                                            e,
                                            index,
                                            'card',
                                        )}
                                    @dragend=${(e) =>
                                        this.handleCollectionDrag(
                                            e,
                                            null,
                                            null,
                                        )}
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
                                draggable="true"
                                id="${collectionId}"
                                @dragstart=${(e) =>
                                    this.handleCollectionDrag(
                                        e,
                                        index,
                                        'collection',
                                    )}
                                @dragover=${(e) =>
                                    this.handleCollectionDrag(
                                        e,
                                        index,
                                        'collection',
                                    )}
                                @dragleave=${(e) =>
                                    this.handleCollectionDrag(e, null, null)}
                                @drop=${(e) =>
                                    this.handleCollectionDrag(
                                        e,
                                        index,
                                        'collection',
                                    )}
                                @dragend=${(e) =>
                                    this.handleCollectionDrag(e, null, null)}
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
                                              .draggingIndex=${this
                                                  .draggingIndex}
                                              .draggingType=${this.draggingType}
                                              .draggingElement=${this
                                                  .draggingElement}
                                              @fragment-changed=${this
                                                  .handleNestedDragEvent}
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
