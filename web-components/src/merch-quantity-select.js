import { styles } from './merch-quantity-select.css.js';
import { debounce, escapeHTML } from './utils.js';

import { ARROW_DOWN, ARROW_UP, ENTER, TAB } from './focus.js';
import {
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
} from './constants.js';

const OPTION_ATTRIBUTES = ['min', 'max', 'step', 'default-value'];

export class MerchQuantitySelect extends HTMLElement {
    static observedAttributes = [
        'closed',
        'selected',
        'max-input',
        'options',
        'highlightedindex',
        'title',
        ...OPTION_ATTRIBUTES,
    ];

    static get styles() {
        return styles;
    }

    #closed = true;
    #options = [];
    #highlightedIndex = 0;
    #selectedValue = 0;
    #built = false;
    #itemsMarkup;
    #renderedValue;
    #firstUpdate = true;
    #changed = new Set();
    #updatePending = false;
    #updatePromise;
    #resolveConnected;
    #connected = new Promise((resolve) => {
        this.#resolveConnected = resolve;
    });

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.toggleMenu = this.toggleMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.openMenu = this.openMenu.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.boundKeydownListener = this.handleKeydown.bind(this);
        this.handleKeyupDebounced = debounce(this.handleKeyup.bind(this), 500);
        this.debouncedQuantityUpdate = debounce(
            this.handleQuantityUpdate.bind(this),
            500,
        );
        this.requestUpdate();
    }

    get closed() {
        return this.#closed;
    }

    set closed(value) {
        const closed = Boolean(value);
        if (closed === this.#closed) return;
        this.#closed = closed;
        this.toggleAttribute('closed', closed);
        this.requestUpdate();
    }

    get selected() {
        return numberAttribute(this, 'selected', undefined);
    }

    set selected(value) {
        setAttribute(this, 'selected', value);
    }

    get min() {
        return numberAttribute(this, 'min', 0);
    }

    set min(value) {
        setAttribute(this, 'min', value);
    }

    get max() {
        return numberAttribute(this, 'max', 0);
    }

    set max(value) {
        setAttribute(this, 'max', value);
    }

    get step() {
        return numberAttribute(this, 'step', 0);
    }

    set step(value) {
        setAttribute(this, 'step', value);
    }

    get maxInput() {
        return numberAttribute(this, 'max-input', undefined);
    }

    set maxInput(value) {
        setAttribute(this, 'max-input', value);
    }

    get defaultValue() {
        return numberAttribute(this, 'default-value', undefined);
    }

    set defaultValue(value) {
        setAttribute(this, 'default-value', value);
    }

    get options() {
        return this.#options;
    }

    set options(value) {
        if (Object.is(value, this.#options)) return;
        this.#options = value;
        this.requestUpdate();
    }

    get highlightedIndex() {
        return this.#highlightedIndex;
    }

    set highlightedIndex(value) {
        if (Object.is(value, this.#highlightedIndex)) return;
        this.#highlightedIndex = value;
        this.requestUpdate();
    }

    get selectedValue() {
        return this.#selectedValue;
    }

    set selectedValue(value) {
        if (Object.is(value, this.#selectedValue)) return;
        this.#selectedValue = value;
        this.requestUpdate();
    }

    attributeChangedCallback(name, oldValue, value) {
        if (oldValue === value) return;
        if (name === 'closed') this.#closed = value !== null;
        if (name === 'options') {
            try {
                this.#options = JSON.parse(value);
            } catch {
                this.#options = null;
            }
        }
        if (name === 'highlightedindex') {
            this.#highlightedIndex = value === null ? null : Number(value);
        }
        this.requestUpdate(name);
    }

    requestUpdate(name) {
        if (name) this.#changed.add(name);
        if (this.#updatePending) return;
        this.#updatePending = true;
        this.#updatePromise = this.#enqueueUpdate();
    }

    get updateComplete() {
        return this.#updatePromise.then(() =>
            this.#updatePending ? this.updateComplete : true,
        );
    }

    async #enqueueUpdate() {
        await this.#connected;
        if (
            this.#firstUpdate ||
            OPTION_ATTRIBUTES.some((name) => this.#changed.has(name))
        ) {
            this.options = this.generateOptionsArray();
            const fallback = this.options[0];
            const resolved =
                this.defaultValue != null &&
                this.options.includes(this.defaultValue)
                    ? this.defaultValue
                    : fallback;
            this.highlightedIndex = this.options.indexOf(resolved);
            this.handleMenuOption(resolved);
        }
        if (this.#firstUpdate) this.toggleAttribute('closed', this.#closed);
        this.#firstUpdate = false;
        this.#changed = new Set();
        this.#updatePending = false;
        this.#render();
        return true;
    }

    connectedCallback() {
        for (const property of [
            'closed',
            'selected',
            'min',
            'max',
            'step',
            'maxInput',
            'options',
            'highlightedIndex',
            'defaultValue',
            'title',
            'selectedValue',
        ]) {
            if (!Object.hasOwn(this, property)) continue;
            const value = this[property];
            delete this[property];
            this[property] = value;
        }
        this.#resolveConnected();
        this.addEventListener('keydown', this.boundKeydownListener);
        window.addEventListener('mousedown', this.handleClickOutside);
        this.addEventListener(
            EVENT_MERCH_CARD_QUANTITY_CHANGE,
            this.debouncedQuantityUpdate,
        );
    }

    get button() {
        return this.shadowRoot.querySelector('button');
    }

    handleKeyup(e) {
        if (e.key === ARROW_DOWN || e.key === ARROW_UP) return;
        this.handleInput();
        this.sendEvent();
    }

    selectValue() {
        if (!this.closed) {
            const option = this.options[this.highlightedIndex];
            if (!option) {
                this.closed = true;
                return;
            }
            this.selectedValue = option;
            this.handleMenuOption(this.selectedValue);
            this.closed = true;
        }
    }

    handleKeydown(e) {
        switch (e.key) {
            case ' ':
                this.selectValue();
                break;
            case 'Escape':
                this.closed = true;
                break;
            case TAB:
                this.selectValue();
                break;
            case ARROW_DOWN:
                if (!this.closed) {
                    this.highlightedIndex =
                        (this.highlightedIndex + 1) % this.options.length;
                } else {
                    this.openMenu();
                }
                e.preventDefault();
                break;
            case ARROW_UP:
                if (!this.closed) {
                    this.highlightedIndex =
                        (this.highlightedIndex - 1 + this.options.length) %
                        this.options.length;
                }
                e.preventDefault();
                break;
            case ENTER:
                this.selectValue();
                if (this.button.classList.contains('focused'))
                    e.preventDefault();
                break;
        }
        if (e.composedPath().includes(this)) e.stopPropagation();
    }

    adjustInput(inputField, value) {
        this.selectedValue = value;
        inputField.value = value;
        this.highlightedIndex = this.options.indexOf(value);
    }

    handleInput() {
        const inputField = this.shadowRoot.querySelector('.text-field-input');
        const numericValue = inputField.value.replace(/\D/g, '');
        inputField.value = numericValue;
        const inputValue = parseInt(numericValue);
        if (isNaN(inputValue)) {
            return;
        }
        if (inputValue > 0 && inputValue !== this.selectedValue) {
            let adjustedInputValue = inputValue;
            if (this.maxInput && inputValue > this.maxInput)
                adjustedInputValue = this.maxInput;
            if (this.min && adjustedInputValue < this.min)
                adjustedInputValue = this.min;
            this.adjustInput(inputField, adjustedInputValue);
        } else
            this.adjustInput(inputField, this.selectedValue || this.min || 1);
    }

    disconnectedCallback() {
        window.removeEventListener('mousedown', this.handleClickOutside);
        this.removeEventListener('keydown', this.boundKeydownListener);
        this.removeEventListener(
            EVENT_MERCH_CARD_QUANTITY_CHANGE,
            this.debouncedQuantityUpdate,
        );
    }

    generateOptionsArray() {
        const options = [];
        if (this.step > 0) {
            for (let value = this.min; value <= this.max; value += this.step) {
                options.push(value);
            }
        }
        return options;
    }

    handleClickOutside(event) {
        const path = event.composedPath();
        if (!path.includes(this)) {
            this.closeMenu();
        }
    }

    toggleMenu() {
        this.closed = !this.closed;
        this.adjustPopoverPlacement();
        if (this.closed)
            this.highlightedIndex = this.options.indexOf(this.selectedValue);
    }

    closeMenu() {
        this.closed = true;
        this.highlightedIndex = this.options.indexOf(this.selectedValue);
    }

    openMenu() {
        this.closed = false;
        this.adjustPopoverPlacement();
    }

    adjustPopoverPlacement() {
        const popover = this.shadowRoot.querySelector('.popover');
        if (
            this.closed ||
            popover.getBoundingClientRect().bottom <= window.innerHeight
        )
            popover.setAttribute('placement', 'bottom');
        else popover.setAttribute('placement', 'top');
    }

    handleMouseEnter(index) {
        this.highlightedIndex = index;
    }

    handleMenuOption(option, close) {
        if (option === this.max)
            this.shadowRoot.querySelector('.text-field-input')?.focus();
        this.selectedValue = option;
        this.sendEvent();
        if (close) this.closeMenu();
    }

    sendEvent() {
        const customEvent = new CustomEvent(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            {
                detail: { option: this.selectedValue },
                bubbles: true,
            },
        );
        this.dispatchEvent(customEvent);
    }

    get configured() {
        return this.title || this.min || this.step;
    }

    get offerSelect() {
        return this.querySelector('merch-offer-select');
    }

    get itemsMarkup() {
        return this.options
            .map(
                (option, index) =>
                    `
                    <div class="item" role="option" id="qs-item-${index}">
                        ${escapeHTML(option === this.max ? `${option}+` : String(option))}
                    </div>
                `,
            )
            .join('');
    }

    handleQuantityUpdate({ detail: { quantity } }) {
        if (quantity && quantity !== this.selectedValue) {
            this.selectedValue = quantity;
            const inputField =
                this.shadowRoot.querySelector('.text-field-input');
            if (inputField) {
                inputField.value = quantity;
            }
            this.sendEvent();
        }
    }

    onButtonFocus(e) {
        e.target.classList.add('focused');
    }

    onButtonBlur(e) {
        e.target.classList.remove('focused');
    }

    #build() {
        this.shadowRoot.innerHTML = `
            <div class="label" id="qsLabel"></div>
            <div class="text-field">
                <input
                    class="text-field-input"
                    aria-labelledby="qsLabel"
                    name="quantity"
                    role="combobox"
                    aria-controls="qsPopover"
                    type="text"
                    autocomplete="on"
                />
                <button class="picker-button" aria-controls="qsPopover" aria-labelledby="qsLabel">
                    <div class="picker-button-fill"></div>
                </button>
                <div
                    id="qsPopover"
                    class="popover"
                    placement="bottom"
                    role="listbox"
                    aria-multiselectable="false"
                    aria-labelledby="qsLabel"
                    tabindex="-1"
                ></div>
            </div>
        `;
        const input = this.shadowRoot.querySelector('input');
        input.addEventListener('keydown', (e) => this.handleKeydown(e));
        input.addEventListener('keyup', (e) => this.handleKeyupDebounced(e));
        const button = this.button;
        button.addEventListener('focus', (e) => this.onButtonFocus(e));
        button.addEventListener('blur', (e) => this.onButtonBlur(e));
        button.addEventListener('click', () => this.toggleMenu());
        const popover = this.shadowRoot.querySelector('.popover');
        popover.addEventListener('click', (e) => {
            const index = this.#itemIndex(e);
            if (index >= 0) this.handleMenuOption(this.options[index], true);
        });
        popover.addEventListener(
            'mouseenter',
            (e) => {
                if (!e.target.classList?.contains('item')) return;
                this.handleMouseEnter(this.#itemIndex(e));
            },
            true,
        );
    }

    #itemIndex(e) {
        const item = e.target.closest?.('.item');
        if (!item) return -1;
        return [...item.parentElement.children].indexOf(item);
    }

    #render() {
        if (!this.configured) {
            this.#built = false;
            this.#itemsMarkup = undefined;
            this.#renderedValue = undefined;
            this.shadowRoot.innerHTML = '';
            return;
        }
        if (!this.#built) {
            this.#built = true;
            this.#build();
        }
        const { closed, highlightedIndex, selectedValue } = this;
        const root = this.shadowRoot;
        root.querySelector('.label').textContent = this.title;
        const input = root.querySelector('input');
        const button = this.button;
        for (const element of [input, button]) {
            element.setAttribute('aria-expanded', String(!closed));
            if (closed) element.removeAttribute('aria-activedescendant');
            else
                element.setAttribute(
                    'aria-activedescendant',
                    `qs-item-${highlightedIndex}`,
                );
        }
        if (selectedValue !== this.#renderedValue) {
            this.#renderedValue = selectedValue;
            input.value = selectedValue;
        }
        root.querySelector('.picker-button-fill').className =
            `picker-button-fill ${closed ? 'open' : 'closed'}`;
        const popover = root.querySelector('.popover');
        popover.classList.toggle('closed', closed);
        popover.classList.toggle('open', !closed);
        const itemsMarkup = this.itemsMarkup;
        if (itemsMarkup !== this.#itemsMarkup) {
            this.#itemsMarkup = itemsMarkup;
            popover.innerHTML = itemsMarkup;
        }
        for (const [index, item] of [...popover.children].entries()) {
            const selected = selectedValue === this.options[index];
            item.classList.toggle('highlighted', index === highlightedIndex);
            item.classList.toggle('selected', selected);
            item.setAttribute('aria-selected', String(selected));
        }
    }
}

function numberAttribute(element, name, fallback) {
    const value = element.getAttribute(name);
    return value === null ? fallback : Number(value);
}

function setAttribute(element, name, value) {
    if (value == null) element.removeAttribute(name);
    else element.setAttribute(name, value);
}

const sheet = new CSSStyleSheet();
sheet.replaceSync(MerchQuantitySelect.styles);

customElements.define('merch-quantity-select', MerchQuantitySelect);
