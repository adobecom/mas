// src/merch-quantity-select.js
import { html, LitElement, nothing } from "/deps/lit-all.min.js";

// src/merch-quantity-select.css.js
import { css } from "/deps/lit-all.min.js";
var styles = css`
    :host {
        box-sizing: border-box;
        --background-color: var(--qs-background-color, #f6f6f6);
        --text-color: #000;
        --radius: 5px;
        --border-color: var(--qs-border-color, #e8e8e8);
        --border-width: var(--qs-border-width, 1px);
        --label-font-size: var(--qs-label-font-size, 12px);
        --font-size: var(--qs-font-size, 12px);
        --label-color: var(--qs-lable-color, #000);
        --input-height: var(--qs-input-height, 30px);
        --input-width: var(--qs-input-width, 72px);
        --button-width: var(--qs-button-width, 30px);
        --font-size: var(--qs-font-size, 12px);
        --picker-down-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18"><path d="M4 7.01a1 1 0 0 1 1.706-.706L8.993 9.59l3.29-3.285A1 1 0 0 1 13.72 7.69l-.024.025L9.7 11.707a1 1 0 0 1-1.413 0L4.293 7.716A.995.995 0 0 1 4 7.01z" fill="%23787878"/></svg>');
        --picker-up-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18"><path d="M14 10.99a1 1 0 0 1-1.706.706L9.005 8.41l-3.289 3.286a1 1 0 0 1-1.437-1.387l.025-.024L8.3 6.293a1 1 0 0 1 1.413 0l3.994 3.991a.995.995 0 0 1 .293.706z" fill="%23787878"/></svg>');
        --checkmark-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M8.648 1.613a.922.922 0 0 0-1.294.156L3.794 6.3 2.632 4.906a.922.922 0 0 0-1.416 1.18l1.89 2.269c.02.023.048.032.07.052a.862.862 0 0 0 .07.083.883.883 0 0 0 .128.07.892.892 0 0 0 .095.051.917.917 0 0 0 .345.076h.001a.915.915 0 0 0 .357-.08.897.897 0 0 0 .099-.057.88.88 0 0 0 .134-.077.862.862 0 0 0 .069-.086c.02-.021.047-.03.066-.053l4.264-5.427a.921.921 0 0 0-.156-1.294z" fill="%23787878"/></svg>');
        --qs-transition: var(--transition);

        display: block;
        position: relative;
        color: var(--text-color);
        line-height: var(--qs-line-height, 2);
    }

    .text-field {
        display: flex;
        align-items: center;
        width: var(--input-width);
        position: relative;
        margin-top: 6px;
    }

    .text-field-input {
        font-family: inherit;
        padding: 0;
        font-size: var(--font-size);
        height: var(--input-height);
        width: calc(var(--input-width) - var(--button-width));
        border: var(--border-width) solid var(--border-color);
        border-top-left-radius: var(--radius);
        border-bottom-left-radius: var(--radius);
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        border-right: none;
        padding-inline-start: 12px;
        box-sizing: border-box;
        -moz-appearance: textfield;
    }

    .text-field-input::-webkit-inner-spin-button,
    .text-field-input::-webkit-outer-spin-button {
        margin: 0;
        -webkit-appearance: none;
    }

    .label {
        font-size: var(--label-font-size);
        color: var(--label-color);
    }

    .picker-button {
        width: var(--button-width);
        height: var(--input-height);
        position: absolute;
        inset-inline-end: 0;
        border: var(--border-width) solid var(--border-color);
        border-top-right-radius: var(--radius);
        border-bottom-right-radius: var(--radius);
        background-color: var(--background-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
    }

    .picker-button-fill {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-image: var(--picker-down-icon);
        background-position: center;
        background-repeat: no-repeat;
    }

    .picker-button-fill.closed {
        background-image: var(--picker-up-icon);
    }

    .popover {
        position: absolute;
        left: 0;
        width: var(--input-width);
        border-radius: var(--radius);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        z-index: 100;
        transition: var(--qs-transition);
        visibility: hidden;
        box-sizing: border-box;
    }

    .popover[placement='bottom'] {
        top: var(--input-height);
        margin-top: var(--popover-margin-top, 6px);
    }

    .popover[placement='top'] {
        bottom: var(--input-height);
        margin-bottom: var(--popover-margin-bottom, 6px);
    }

    .popover.open {
        visibility: visible;
        background: #ffffff;
        border: var(--border-width) solid var(--border-color);
    }

    .popover.closed {
        visibility: hidden;
        pointer-events: none;
        transition: none;
    }

    ::slotted(p) {
        margin: 0;
    }

    .item {
        display: flex;
        align-items: center;
        color: var(--text-color);
        font-size: var(--font-size);
        padding-inline-start: 12px;
        box-sizing: border-box;
    }

    .item.highlighted {
        background-color: var(--background-color);
    }

    .item.selected {
        background-image: var(--checkmark-icon);
        background-position: right 7px center;
        background-repeat: no-repeat;
    }
`;

// src/constants.js
var Commitment = Object.freeze({
  MONTH: "MONTH",
  YEAR: "YEAR",
  TWO_YEARS: "TWO_YEARS",
  THREE_YEARS: "THREE_YEARS",
  PERPETUAL: "PERPETUAL",
  TERM_LICENSE: "TERM_LICENSE",
  ACCESS_PASS: "ACCESS_PASS",
  THREE_MONTHS: "THREE_MONTHS",
  SIX_MONTHS: "SIX_MONTHS"
});
var Term = Object.freeze({
  ANNUAL: "ANNUAL",
  MONTHLY: "MONTHLY",
  TWO_YEARS: "TWO_YEARS",
  THREE_YEARS: "THREE_YEARS",
  P1D: "P1D",
  P1Y: "P1Y",
  P3Y: "P3Y",
  P10Y: "P10Y",
  P15Y: "P15Y",
  P3D: "P3D",
  P7D: "P7D",
  P30D: "P30D",
  HALF_YEARLY: "HALF_YEARLY",
  QUARTERLY: "QUARTERLY"
});
var SELECTOR_MAS_INLINE_PRICE = 'span[is="inline-price"][data-wcs-osi]';
var SELECTOR_MAS_CHECKOUT_LINK = 'a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';
var SELECTOR_MAS_UPT_LINK = 'a[is="upt-link"]';
var SELECTOR_MAS_ELEMENT = `${SELECTOR_MAS_INLINE_PRICE},${SELECTOR_MAS_CHECKOUT_LINK},${SELECTOR_MAS_UPT_LINK}`;
var EVENT_MERCH_QUANTITY_SELECTOR_CHANGE = "merch-quantity-selector:change";
var EVENT_MERCH_CARD_QUANTITY_CHANGE = "merch-card-quantity:change";
var CheckoutWorkflowStep = Object.freeze({
  SEGMENTATION: "segmentation",
  BUNDLE: "bundle",
  COMMITMENT: "commitment",
  RECOMMENDATION: "recommendation",
  EMAIL: "email",
  PAYMENT: "payment",
  CHANGE_PLAN_TEAM_PLANS: "change-plan/team-upgrade/plans",
  CHANGE_PLAN_TEAM_PAYMENT: "change-plan/team-upgrade/payment"
});
var Env = Object.freeze({
  STAGE: "STAGE",
  PRODUCTION: "PRODUCTION",
  LOCAL: "LOCAL"
});

// src/utils.js
function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

// src/focus.js
var [ARROW_LEFT, ARROW_RIGHT, ARROW_UP, ARROW_DOWN, ENTER, TAB] = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Enter",
  "Tab"
];

// src/merch-quantity-select.js
var MerchQuantitySelect = class extends LitElement {
  static get properties() {
    return {
      closed: { type: Boolean, reflect: true },
      selected: { type: Number },
      min: { type: Number },
      max: { type: Number },
      step: { type: Number },
      maxInput: { type: Number, attribute: "max-input" },
      options: { type: Array },
      highlightedIndex: { type: Number },
      defaultValue: {
        type: Number,
        attribute: "default-value",
        reflect: true
      },
      title: { type: String }
    };
  }
  static get styles() {
    return styles;
  }
  constructor() {
    super();
    this.options = [];
    this.title = "";
    this.closed = true;
    this.min = 0;
    this.max = 0;
    this.step = 0;
    this.maxInput = void 0;
    this.defaultValue = void 0;
    this.selectedValue = 0;
    this.highlightedIndex = 0;
    this.toggleMenu = this.toggleMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.boundKeydownListener = this.handleKeydown.bind(this);
    this.handleKeyupDebounced = debounce(this.handleKeyup.bind(this), 500);
    this.debouncedQuantityUpdate = debounce(
      this.handleQuantityUpdate.bind(this),
      500
    );
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("keydown", this.boundKeydownListener);
    window.addEventListener("mousedown", this.handleClickOutside);
    this.addEventListener(
      EVENT_MERCH_CARD_QUANTITY_CHANGE,
      this.debouncedQuantityUpdate
    );
  }
  get button() {
    return this.shadowRoot.querySelector("button");
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
      case " ":
        this.selectValue();
        break;
      case "Escape":
        this.closed = true;
        break;
      case TAB:
        this.selectValue();
        break;
      case ARROW_DOWN:
        if (!this.closed) {
          this.highlightedIndex = (this.highlightedIndex + 1) % this.options.length;
        } else {
          this.openMenu();
        }
        e.preventDefault();
        break;
      case ARROW_UP:
        if (!this.closed) {
          this.highlightedIndex = (this.highlightedIndex - 1 + this.options.length) % this.options.length;
        }
        e.preventDefault();
        break;
      case ENTER:
        this.selectValue();
        if (this.button.classList.contains("focused"))
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
    const inputField = this.shadowRoot.querySelector(".text-field-input");
    const numericValue = inputField.value.replace(/\D/g, "");
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
    super.disconnectedCallback();
    window.removeEventListener("mousedown", this.handleClickOutside);
    this.removeEventListener("keydown", this.boundKeydownListener);
    this.removeEventListener(
      EVENT_MERCH_CARD_QUANTITY_CHANGE,
      this.debouncedQuantityUpdate
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
  update(changedProperties) {
    if (changedProperties.has("min") || changedProperties.has("max") || changedProperties.has("step") || changedProperties.has("defaultValue")) {
      this.options = this.generateOptionsArray();
      this.highlightedIndex = this.defaultValue ? this.options.indexOf(this.defaultValue) : 0;
      this.handleMenuOption(
        this.defaultValue ? this.defaultValue : this.options[0]
      );
    }
    super.update(changedProperties);
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
    const popover = this.shadowRoot.querySelector(".popover");
    if (this.closed || popover.getBoundingClientRect().bottom <= window.innerHeight)
      popover.setAttribute("placement", "bottom");
    else popover.setAttribute("placement", "top");
  }
  handleMouseEnter(index) {
    this.highlightedIndex = index;
  }
  handleMenuOption(option, close) {
    if (option === this.max)
      this.shadowRoot.querySelector(".text-field-input")?.focus();
    this.selectedValue = option;
    this.sendEvent();
    if (close) this.closeMenu();
  }
  sendEvent() {
    const customEvent = new CustomEvent(
      EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
      {
        detail: { option: this.selectedValue },
        bubbles: true
      }
    );
    this.dispatchEvent(customEvent);
  }
  get offerSelect() {
    return this.querySelector("merch-offer-select");
  }
  get popover() {
    return html` <div
            id="qsPopover"
            class="popover ${this.closed ? "closed" : "open"}"
            placement="bottom"
            role="listbox"
            aria-multiselectable="false"
            aria-labelledby="qsLabel"
            tabindex="-1"
        >
            ${this.options.map(
      (option, index) => html`
                    <div
                        class="item ${index === this.highlightedIndex ? "highlighted" : ""}${this.selectedValue === option ? " selected" : ""}"
                        role="option"
                        id="${`qs-item-${index}`}"
                        aria-selected=${this.selectedValue === option}
                        @click="${() => this.handleMenuOption(option, true)}"
                        @mouseenter="${() => this.handleMouseEnter(index)}"
                    >
                        ${option === this.max ? `${option}+` : option}
                    </div>
                `
    )}
        </div>`;
  }
  handleQuantityUpdate({ detail: { quantity } }) {
    if (quantity && quantity !== this.selectedValue) {
      this.selectedValue = quantity;
      const inputField = this.shadowRoot.querySelector(".text-field-input");
      if (inputField) {
        inputField.value = quantity;
      }
      this.sendEvent();
    }
  }
  onButtonFocus(e) {
    e.target.classList.add("focused");
  }
  onButtonBlur(e) {
    e.target.classList.remove("focused");
  }
  render() {
    return html`
            <div class="label" id="qsLabel">${this.title}</div>
            <div class="text-field">
                <input
                    class="text-field-input"
                    aria-labelledby="qsLabel"
                    name="quantity"
                    role="combobox"
                    aria-expanded=${!this.closed}
                    aria-controls="qsPopover"
                    aria-activedescendant="${!this.closed ? `qs-item-${this.highlightedIndex}` : nothing}"
                    .value="${this.selectedValue}"
                    type="text"
                    autocomplete="off"
                    @keydown="${this.handleKeydown}"
                    @keyup="${this.handleKeyupDebounced}"
                />
                <button
                    class="picker-button"
                    aria-activedescendant="${!this.closed ? `qs-item-${this.highlightedIndex}` : nothing}"
                    @focus="${this.onButtonFocus}"
                    @blur="${this.onButtonBlur}"
                    aria-controls="qsPopover"
                    aria-expanded=${!this.closed}
                    aria-labelledby="qsLabel"
                    @click="${this.toggleMenu}"
                >
                    <div
                        class="picker-button-fill ${this.closed ? "open" : "closed"}"
                    ></div>
                </button>
                ${this.popover}
            </div>
        `;
  }
};
customElements.define("merch-quantity-select", MerchQuantitySelect);
export {
  MerchQuantitySelect
};
//# sourceMappingURL=merch-quantity-select.js.map
