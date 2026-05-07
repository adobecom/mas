import { css, html, LitElement } from 'lit';
import { fieldStatusStyles } from './field-status.css.js';
import Events from '../../events.js';

export const QUANTITY_SELECT_TAG = 'merch-quantity-select';

/**
 * Builds a serialized merch quantity selector HTML value.
 * @param {{ title: string, min: string, step: string, defaultValue: string }} config
 * @returns {string}
 */
export const createQuantitySelectValue = ({ title, min, step, defaultValue }) => {
    const element = document.createElement(QUANTITY_SELECT_TAG);
    element.setAttribute('title', `${title}`);
    element.setAttribute('min', `${min}`);
    element.setAttribute('default-value', `${defaultValue}`);
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
    if (!value) return { title: '', min: '1', step: '1', defaultValue: '1' };
    const parser = new DOMParser();
    const documentRoot = parser.parseFromString(value, 'text/html');
    const element = documentRoot.querySelector(QUANTITY_SELECT_TAG);
    return {
        title: `${element?.getAttribute('title') ?? ''}`,
        min: `${element?.getAttribute('min') ?? '1'}`,
        step: `${element?.getAttribute('step') ?? '1'}`,
        defaultValue: `${element?.getAttribute('default-value') ?? element?.getAttribute('min') ?? '1'}`,
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
        defaultValue: { type: String, state: true },
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
        this.defaultValue = '1';
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
        this.defaultValue = parsed.defaultValue;
    }

    #dispatchChange() {
        this.value = createQuantitySelectValue({
            title: this.title,
            min: this.min,
            step: this.step,
            defaultValue: this.defaultValue,
        });
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: this.value },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #defaultFitsStepLadder() {
        const min = Number(this.min);
        const step = Number(this.step);
        const def = Number(this.defaultValue);
        const max = 10;
        if (isNaN(min) || isNaN(step) || step <= 0 || isNaN(def)) {
            return true;
        }
        for (let v = min; v <= max; v += step) {
            if (v === def) return true;
        }
        return false;
    }

    #ensureDefaultOnStepLadder() {
        if (!this.#defaultFitsStepLadder()) {
            this.defaultValue = `${Number(this.min)}`;
        }
    }

    #handleTitleChange = (event) => {
        this.title = event.target.value;
        this.#dispatchChange();
    };

    #handleMinChange = (event) => {
        if (event.target.value && !isNaN(event.target.value) && this.defaultValue && event.target.value > this.defaultValue) {
            event.target.value = this.min;
            Events.toast.emit({
                variant: 'negative',
                content: 'Minimum quantity value cannot be higher than the default quantity value',
            });
        } else {
            this.min = event.target.value;
            this.#ensureDefaultOnStepLadder();
            this.#dispatchChange();
        }
    };

    #handleStepChange = (event) => {
        this.step = event.target.value;
        this.#ensureDefaultOnStepLadder();
        this.#dispatchChange();
    };

    #handleDefaultChange = (event) => {
        if (event.target.value && !isNaN(event.target.value) && this.min && event.target.value < this.min) {
            event.target.value = this.defaultValue;
            Events.toast.emit({
                variant: 'negative',
                content: 'Default quantity value cannot be smaller than the minimum quantity value',
            });
        } else {
            this.defaultValue = event.target.value;
            this.#dispatchChange();
        }
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
                <sp-field-label>Default quantity</sp-field-label>
                <div class="field-row">
                    <sp-textfield
                        id="quantity-selector-default"
                        size="m"
                        ?disabled=${this.disabled}
                        pattern="[0-9]*"
                        .value=${this.defaultValue}
                        @change=${this.#suppressNativeChange}
                        @input=${this.#handleDefaultChange}
                    ></sp-textfield>
                    ${this.fieldIndicatorTemplate('defaultValue')}
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
