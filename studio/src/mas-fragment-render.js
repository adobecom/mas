import { LitElement, html, nothing } from 'lit';
import Store, { toggleSelection } from './store.js';
import './mas-fragment-status.js';
import { CARD_MODEL_PATH } from './constants.js';
import { styles } from './mas-fragment-render.css.js';
import ReactiveController from './reactivity/reactive-controller.js';

class MasFragmentRender extends LitElement {
    static properties = {
        selected: { type: Boolean, attribute: true },
        fragmentStore: { type: Object, attribute: false },
    };

    static styles = [styles];

    #reactiveControllers = new ReactiveController(this);

    createRenderRoot() {
        return this;
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore')) {
            this.#reactiveControllers.updateStores([
                this.fragmentStore,
                Store.selecting,
            ]);
        }
        super.update(changedProperties);
    }

    select() {
        toggleSelection(this.fragment.id);
    }

    get fragment() {
        return this.fragmentStore.get();
    }

    handleDragStart(event) {
        if (Store.selecting.get()) {
            event.preventDefault();
            return;
        }

        const fragment = this.fragment;

        if (!fragment) {
            console.error('No fragment available for drag operation');
            event.preventDefault();
            return;
        }

        try {
            // Prepare the data for the drag operation
            const dragData = {
                id: fragment.id,
                path: fragment.path,
                model: fragment.model,
                label: fragment.getField('label')?.values[0],
                references: fragment.references || [],
                fields: fragment.fields || [],
            };

            // Set data for the drag operation
            event.dataTransfer.setData(
                'application/json',
                JSON.stringify(dragData),
            );

            // Set the drag effect
            event.dataTransfer.effectAllowed = 'copy';

            // Add a class to indicate dragging
            event.currentTarget
                .closest('.render-fragment')
                .classList.add('dragging');

            console.log(
                'Started dragging fragment:',
                dragData.path,
                'with model path:',
                dragData.modelPath,
            );
        } catch (error) {
            console.error('Error setting drag data:', error);
            event.preventDefault();
        }
    }

    handleDragEnd(event) {
        // Remove the dragging class
        event.currentTarget
            .closest('.render-fragment')
            .classList.remove('dragging');
    }

    get selectionOverlay() {
        if (!Store.selecting.value) return nothing;
        return html`<div class="overlay" @click="${this.select}">
            ${this.selected
                ? html`<sp-icon-remove slot="icon"></sp-icon-remove>`
                : html`<sp-icon-add slot="icon"></sp-icon-add>`}
        </div>`;
    }

    get merchCard() {
        return html`<merch-card slot="trigger">
            <aem-fragment
                fragment="${this.fragment.id}"
                ims
                author
            ></aem-fragment>
            ${this.selectionOverlay}
        </merch-card>`;
    }

    get unknown() {
        const label = this.fragment.fields.find(
            (field) => field.name === 'label',
        )?.values[0];
        return html`<div class="unknown-fragment" slot="trigger">
            <sp-icon-document-fragment></sp-icon-document-fragment> ${label}
            ${this.selectionOverlay}
            <p class="model-name">${this.fragment.title}</p>
        </div>`;
    }

    render() {
        return html`<div class="render-fragment">
            <div class="render-fragment-header">
                <div class="render-fragment-actions"></div>
                <mas-fragment-status
                    variant=${this.fragment.statusVariant}
                ></mas-fragment-status>
            </div>
            <div
                class="render-fragment-content"
                draggable="true"
                @dragstart=${this.handleDragStart}
                @dragend=${this.handleDragEnd}
            >
                <overlay-trigger placement="top">
                    ${this.fragment.model.path === CARD_MODEL_PATH
                        ? this.merchCard
                        : this.unknown}

                    <sp-tooltip slot="hover-content" placement="top"
                        >Double click the card to start editing.</sp-tooltip
                    >
                </overlay-trigger>
            </div>
        </div>`;
    }
}

customElements.define('mas-fragment-render', MasFragmentRender);
