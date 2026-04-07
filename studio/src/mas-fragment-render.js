import { LitElement, html, nothing } from 'lit';
import Store, { toggleSelection } from './store.js';
import './mas-fragment-status.js';
import { CARD_MODEL_PATH } from './constants.js';
import { getSpectrumVersion } from './constants/icon-library.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { cardSkeleton } from './mas-content.js';

class MasFragmentRender extends LitElement {
    static properties = {
        selected: { type: Boolean, attribute: true },
        fragmentStore: { type: Object, attribute: false },
        visible: { type: Boolean, state: true },
    };

    #reactiveControllers = new ReactiveController(this);
    #observer = null;

    createRenderRoot() {
        return this;
    }

    firstUpdated() {
        const root = this.closest('.main-container') ?? document.querySelector('.main-container');
        this.#observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    this.visible = true;
                    this.#observer.disconnect();
                    this.#observer = null;
                    this.fragmentStore?.resolvePreviewFragment?.();
                }
            },
            {
                root,
                rootMargin: '200px',
            },
        );
        this.#observer.observe(this);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#observer?.disconnect();
        this.#observer = null;
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore')) {
            this.#reactiveControllers.updateStores([this.fragmentStore, Store.selecting]);
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
            event.dataTransfer.setData('application/json', JSON.stringify(dragData));

            // Set the drag effect
            event.dataTransfer.effectAllowed = 'copy';

            // Add a class to indicate dragging
            event.currentTarget.closest('.render-fragment').classList.add('dragging');
        } catch (error) {
            console.error('Error setting drag data:', error);
            event.preventDefault();
        }
    }

    handleDragEnd(event) {
        // Remove the dragging class
        event.currentTarget.closest('.render-fragment').classList.remove('dragging');
    }

    get selectionOverlay() {
        if (!Store.selecting.value) return nothing;
        return html`<div class="overlay" @click="${this.select}">
            ${this.selected
                ? html`<sp-icon-select-no size="xl" label="Remove from selection"></sp-icon-select-no>`
                : html`<sp-icon-select-rectangle size="xl" label="Add to selection"></sp-icon-select-rectangle>`}
        </div>`;
    }

    get merchCard() {
        return html`<merch-card slot="trigger">
            <aem-fragment author fragment="${this.fragment.id}"></aem-fragment>
        </merch-card>`;
    }

    get placeholder() {
        return cardSkeleton();
    }

    get unknown() {
        const label = this.fragment.fields.find((field) => field.name === 'label')?.values[0];
        return html`<div class="unknown-fragment" slot="trigger">
            <sp-icon-collection size="m"></sp-icon-collection> ${label}
            <p class="model-name">${this.fragment.title}</p>
        </div>`;
    }

    render() {
        if (!this.visible) return this.placeholder;
        if (!this.fragment || !this.fragment.model) {
            return nothing;
        }

        return html`<div class="render-fragment">
            <div class="render-fragment-header">
                <div class="render-fragment-actions"></div>
                <mas-fragment-status variant=${this.fragment.statusVariant}></mas-fragment-status>
            </div>
            <div
                class="render-fragment-content"
                draggable="true"
                @dragstart=${this.handleDragStart}
                @dragend=${this.handleDragEnd}
                aria-grabbed="${this.isDragging}"
                aria-label="Draggable fragment ${this.fragment?.title || ''}"
            >
                <sp-theme color="light" scale="medium" system="${getSpectrumVersion(this.fragment?.variant)}">
                    <overlay-trigger placement="top">
                        ${this.fragment.model.path === CARD_MODEL_PATH ? this.merchCard : this.unknown}

                        <sp-tooltip slot="hover-content" placement="top">Double click the card to start editing.</sp-tooltip>
                    </overlay-trigger>
                    ${this.selectionOverlay}
                </sp-theme>
            </div>
        </div>`;
    }
}

customElements.define('mas-fragment-render', MasFragmentRender);
