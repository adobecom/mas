import { html, css, LitElement, nothing } from 'lit';
import { EVENT_CHANGE, EVENT_INPUT } from '../constants.js';
import { deepEquals } from '../utils.js';

class MasMultifield extends LitElement {
    static get properties() {
        return {
            min: { type: Number, attribute: true },
            value: { type: Array, attribute: false },
            draggingIndex: { type: Number, state: true },
            buttonLabel: { type: String, attribute: 'button-label' },
        };
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

        .field-wrapper > *:first-child {
            flex: 1;
        }

        .field-wrapper.dragging {
            opacity: 0.5;
        }

        .field-wrapper.dragover {
            border: 1px dashed #007bff;
        }

        .add-button-wrapper {
            display: flex;
            margin-top: 12px;
        }

        .add-button-wrapper sp-action-button {
            flex: 1;
        }
    `;

    /**
     * @type {HTMLElement}
     */
    #template;
    #boundHandlers;

    constructor() {
        super();
        this.draggingIndex = -1;
        this.min = 0;
        this.buttonLabel = 'Add';
        this.#boundHandlers = {
            deleteField: this.#handleDeleteField.bind(this),
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.initFieldTemplate();
        this.addEventListener('delete-field', this.#boundHandlers.deleteField);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('delete-field', this.#boundHandlers.deleteField);
    }

    shouldUpdate(changedProperties) {
        if (!this.#template) return false;
        if (changedProperties.has('value')) {
            const oldValue = changedProperties.get('value');
            const newValue = this.value;
            if (!this.hasUpdated) {
                return true;
            }
            return !deepEquals(oldValue, newValue);
        }
        return true;
    }

    #handleDeleteField(event) {
        event.stopPropagation();
        const path = event.composedPath();
        const fieldWrapper = path.find((el) => el.classList?.contains('field-wrapper'));
        if (fieldWrapper) {
            const index = Array.from(this.shadowRoot.querySelectorAll('.field-wrapper')).indexOf(fieldWrapper);
            if (index !== -1) {
                this.removeField(index);
            }
        }
    }

    initValue() {
        // auto assign ids.
        this.value =
            this.value?.map((field) => ({
                ...field,
            })) ?? [];
    }

    firstUpdated() {
        this.initValue();
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

    addField() {
        this.value = [...this.value, {}];
        this.#dispatchEvent();
        requestAnimationFrame(() => {
            const fields = this.shadowRoot.querySelectorAll('.field-wrapper');
            const lastField = fields[fields.length - 1];
            if (lastField) {
                const field = lastField.firstElementChild;
                if (field?.openModal) {
                    field.openModal();
                }
            }
        });
    }

    getFieldIndex(element) {
        return Array.from(this.shadowRoot.querySelectorAll('.field-wrapper')).indexOf(element.closest('.field-wrapper'));
    }

    // Remove a field by its index
    removeField(index) {
        this.value.splice(index, 1);
        this.value = [...this.value];
        this.#dispatchEvent();
    }

    #dispatchEvent(eventType = EVENT_CHANGE) {
        this.dispatchEvent(
            new CustomEvent(eventType, {
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
        this.#dispatchEvent();
    }

    // Handle the value change of a field
    handleInput(e) {
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
        this.#dispatchEvent(EVENT_INPUT);
    }

    /* c8 ignore start */
    // Handle drag start
    dragStart(e, index) {
        const activeElement = this.shadowRoot.activeElement;
        if (activeElement) {
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
        const updatedValue = [...this.value];
        updatedValue.splice(this.draggingIndex, 1);

        // Insert the dragging field into the new position
        updatedValue.splice(index, 0, draggingField);

        // Update the fields
        this.value = updatedValue;

        // Reset drag state
        e.target.classList.remove('dragover');
        this.draggingIndex = -1;
        this.#dispatchEvent();
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
            if (key !== 'fieldState') {
                fieldEl.setAttribute(key, field[key]);
            }
        });
        const fieldState = field.fieldState || this.getAttribute('data-field-state');
        if (fieldState) {
            fieldEl.setAttribute('data-field-state', fieldState);
        }

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
            </div>
        `;
    }

    render() {
        if (!this.#template || !this.value) return nothing;
        return html`
            <div @change="${this.handleChange}" @input="${this.handleInput}">
                ${this.value.map((field, index) => this.renderField(field, index))}
                <div class="add-button-wrapper">
                    <sp-action-button @click=${this.addField}>
                        <sp-icon-add label="Add" slot="icon"></sp-icon-add>${this.buttonLabel}
                    </sp-action-button>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-multifield', MasMultifield);
