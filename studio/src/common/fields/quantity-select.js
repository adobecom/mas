import { css, html, LitElement } from 'lit';
import { fieldStatusStyles } from './field-status.css.js';

export const QUANTITY_SELECT_TAG = 'merch-quantity-select';

/**
 * Builds a serialized merch quantity selector HTML value.
 * @param {{ title: string, min: string, step: string }} config
 * @returns {string}
 */
export const createQuantitySelectValue = ({ title, min, step }) => {
    const element = document.createElement(QUANTITY_SELECT_TAG);
    element.setAttribute('title', `${title}`);
    element.setAttribute('min', `${min}`);
    element.setAttribute('max', '10');
    element.setAttribute('step', `${step}`);
    return element.outerHTML;
};

/**
 * Parses a serialized merch quantity selector HTML value.
 * @param {string} value
 * @returns {{ title: string, min: string, step: string }}
 */
export const parseQuantitySelectValue = (value) => {
    if (!value) return { title: '', min: '1', step: '1' };
    const parser = new DOMParser();
    const documentRoot = parser.parseFromString(value, 'text/html');
    const element = documentRoot.querySelector(QUANTITY_SELECT_TAG);
    return {
        title: `${element?.getAttribute('title') ?? ''}`,
        min: `${element?.getAttribute('min') ?? '1'}`,
        step: `${element?.getAttribute('step') ?? '1'}`,
    };
};

/**
 * Settings custom value editor for merch quantity select markup.
 */
export class QuantitySelectField extends LitElement {
    static properties = {
        value: { type: String },
        title: { type: String, state: true },
        min: { type: String, state: true },
        step: { type: String, state: true },
        layout: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        fieldIndicatorTemplate: { attribute: false },
    };

    static styles = css`
        :host {
            display: block;
        }

        sp-field-group {
            width: 100%;
        }

        ${fieldStatusStyles}
    `;

    constructor() {
        super();
        this.value = '';
        this.title = '';
        this.min = '1';
        this.step = '1';
        this.layout = 'grid';
        this.disabled = false;
        this.fieldIndicatorTemplate = () => {};
    }

    willUpdate(changedProperties) {
        if (!changedProperties.has('value')) return;
        const parsed = parseQuantitySelectValue(this.value);
        this.title = parsed.title;
        this.min = parsed.min;
        this.step = parsed.step;
    }

    #dispatchChange() {
        this.value = createQuantitySelectValue({
            title: this.title,
            min: this.min,
            step: this.step,
        });
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: this.value },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #handleTitleChange = (event) => {
        this.title = event.target.value;
        this.#dispatchChange();
    };

    #handleMinChange = (event) => {
        this.min = event.target.value;
        this.#dispatchChange();
    };

    #handleStepChange = (event) => {
        this.step = event.target.value;
        this.#dispatchChange();
    };

    #suppressNativeChange = (event) => {
        event.stopPropagation();
    };

    render() {
        return html`
            <sp-field-group>
                <sp-field-label>Quantity selector title</sp-field-label>
                <div class="field-row">
                    <sp-textfield
                        id="quantity-selector-title"
                        size="m"
                        ?disabled=${this.disabled}
                        .value=${this.title}
                        @change=${this.#suppressNativeChange}
                        @input=${this.#handleTitleChange}
                    ></sp-textfield>
                    ${this.fieldIndicatorTemplate('title')}
                </div>
            </sp-field-group>
            <sp-field-group>
                <sp-field-label>Start quantity</sp-field-label>
                <div class="field-row">
                    <sp-textfield
                        id="quantity-selector-start"
                        size="m"
                        ?disabled=${this.disabled}
                        pattern="[0-9]*"
                        .value=${this.min}
                        @change=${this.#suppressNativeChange}
                        @input=${this.#handleMinChange}
                    ></sp-textfield>
                    ${this.fieldIndicatorTemplate('min')}
                </div>
            </sp-field-group>
            <sp-field-group>
                <sp-field-label>Step</sp-field-label>
                <div class="field-row">
                    <sp-textfield
                        id="quantity-selector-step"
                        size="m"
                        ?disabled=${this.disabled}
                        pattern="[0-9]*"
                        .value=${this.step}
                        @change=${this.#suppressNativeChange}
                        @input=${this.#handleStepChange}
                    ></sp-textfield>
                    ${this.fieldIndicatorTemplate('step')}
                </div>
            </sp-field-group>
        `;
    }
}

customElements.define('quantity-select-field', QuantitySelectField);
