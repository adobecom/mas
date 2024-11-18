import { html, css, LitElement, nothing } from 'lit';
import { EVENT_CHANGE } from '../events.js';

class MasMultifield extends LitElement {
    static get properties() {
        return {
            min: { type: Number, attribute: true },
            value: { type: Array, attribute: false },
            draggingIndex: { type: Number, state: true },
        };
    }

    /**
     * @type {HTMLElement}
     */
    #template;

    constructor() {
        super();
        this.draggingIndex = -1;
        this.min = 0;
    }

    initValue() {
        // auto assign ids.
        this.value =
            this.value?.map((field, i) => ({
                ...field,
            })) ?? [];
    }

    firstUpdated() {
        this.initValue();
        this.initFieldTemplate();
    }

    // Initialize the field template
    initFieldTemplate() {
        const template = this.querySelector('template');
        if (!template) {
            console.warn('Template field not found', this);
            return;
        }
        this.#template = template.content;
        template.remove();
        if (this.value.length === 0) {
            for (let i = 0; i < this.min; i++) {
                this.addField();
            }
        }
    }

    // Add a new field
    addField() {
        this.value = [...this.value, {}];
        this.#changed();
    }

    getFieldIndex(element) {
        return Array.from(
            this.shadowRoot.querySelectorAll('.field-wrapper'),
        ).indexOf(element.closest('.field-wrapper'));
    }

    // Remove a field by its index
    removeField(index) {
        this.value.splice(index, 1);
        this.value = [...this.value];
        this.#changed();
    }

    #changed() {
        this.dispatchEvent(
            new CustomEvent(EVENT_CHANGE, {
                bubbles: true,
                composed: true,
            }),
        );
    }

    // Handle the value change of a field
    handleChange(e) {
        e.stopPropagation();
        let newValue = e.target.value;
        if (typeof newValue === 'string') {
            newValue = { value: newValue };
        }
        const index = this.getFieldIndex(e.target);
        const value = this.value[index];
        if (!value) return;
        Object.assign(value, newValue);
        // Dispatch change event
        this.#changed();
    }

    /* c8 ignore start */
    // Handle drag start
    dragStart(e, index) {
        const activeElement = this.shadowRoot.activeElement;
        if (
            activeElement &&
            activeElement.tagName.toLowerCase().includes('-field')
        ) {
            e.preventDefault();
            return;
        }
        this.draggingIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    // Handle drag over
    dragOver(e, index) {
        e.preventDefault();
        if (this.draggingIndex !== index) {
            e.target.classList.add('dragover');
        }
    }

    // Handle drag leave
    dragLeave(e) {
        e.target.classList.remove('dragover');
    }

    // Handle drop
    drop(e, index) {
        e.preventDefault();
        const draggingField = this.value[this.draggingIndex];

        // Remove the dragging field from its original position
        let updatedValue = [...this.value];
        updatedValue.splice(this.draggingIndex, 1);

        // Insert the dragging field into the new position
        updatedValue.splice(index, 0, draggingField);

        // Update the fields
        this.value = updatedValue;

        // Reset drag state
        e.target.classList.remove('dragover');
        this.draggingIndex = -1;
        this.#changed();
    }

    // Handle drag end
    dragEnd(e) {
        e.target.classList.remove('dragging');
    }
    /* c8 ignore end */

    // Render individual field with reorder and delete options
    renderField(field, index) {
        let fieldEl = this.#template.cloneNode(true).firstElementChild;
        // if the element is a wrapper, get the field element
        fieldEl = fieldEl.querySelector('.field') ?? fieldEl;
        Object.keys(field).forEach((key) => {
            fieldEl.setAttribute(key, field[key]);
        });

        return html`
            <div
                class="field-wrapper"
                draggable="true"
                @dragstart=${(e) => this.dragStart(e, index)}
                @dragover=${(e) => this.dragOver(e, index)}
                @dragleave=${this.dragLeave}
                @drop=${(e) => this.drop(e, index)}
                @dragend=${this.dragEnd}
            >
                ${fieldEl}
                <sp-icon-close
                    label="Remove field"
                    @click=${() => this.removeField(index)}
                ></sp-icon-close>
                <sp-icon-drag-handle label="Order"></sp-icon-drag-handle>
            </div>
        `;
    }

    render() {
        if (!this.#template || !this.value) return nothing;
        return html`
            <div @change="${this.handleChange}">
                ${this.value.map((field, index) =>
                    this.renderField(field, index),
                )}
                <sp-action-button quiet @click=${this.addField}>
                    <sp-icon-add label="Add" slot="icon"></sp-icon-add>Add
                </sp-action-button>
            </div>
        `;
    }

    static styles = css`
        :host {
            display: block;
        }

        :host > div {
            display: contents;
        }

        .field-wrapper {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 4px;
        }

        .field-wrapper:hover {
            outline: 2px dashed var(--spectrum-global-color-gray-400);
            border-radius: var(--spectrum-global-dimension-size-50);
        }

        .field-wrapper > *:first-child {
            flex: 1;
        }

        .field-wrapper.dragging {
            opacity: 0.5;
        }

        .field-wrapper.dragover {
            border: 1px dashed #007bff;
        }

        sp-icon-drag-handle {
            visibility: hidden;
            margin-block-start: 24px;
            cursor: grab;
            pointer-events: auto;
        }

        .field-wrapper:hover sp-icon-drag-handle {
            visibility: visible;
        }

        sp-icon-close {
            pointer-events: auto;
            padding: 8px;
            margin-block-start: 24px;
            align-self: start;
            cursor: pointer;
        }

        sp-icon-close:hover {
            cursor: pointer;
        }
    `;
}

customElements.define('mas-multifield', MasMultifield);
