"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import {
  html,
  SizedMixin
} from "@spectrum-web-components/base";
import {
  property,
  query
} from "@spectrum-web-components/base/src/decorators.js";
import { ifDefined } from "@spectrum-web-components/base/src/directives.js";
import "@spectrum-web-components/popover/sp-popover.js";
import "@spectrum-web-components/menu/sp-menu.js";
import "@spectrum-web-components/button/sp-button.js";
import { PickerBase } from "@spectrum-web-components/picker";
import "@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-more.js";
import chevronStyles from "@spectrum-web-components/icon/src/spectrum-icon-chevron.css.js";
import styles from "./split-button.css.js";
const chevronClass = {
  s: "spectrum-UIIcon-ChevronDown75",
  m: "spectrum-UIIcon-ChevronDown100",
  l: "spectrum-UIIcon-ChevronDown200",
  xl: "spectrum-UIIcon-ChevronDown300"
};
export class SplitButton extends SizedMixin(PickerBase) {
  constructor() {
    super(...arguments);
    this.left = false;
    this.variant = "accent";
    this.type = "field";
    this.listRole = "menu";
    this.itemRole = "menuitem";
  }
  static get styles() {
    return [styles, chevronStyles];
  }
  get focusElement() {
    if (this.open) {
      return this.optionsMenu;
    }
    if (this.left) {
      return this.trigger;
    }
    return this.button;
  }
  passClick() {
    const target = this.type === "more" ? this.menuItems[0] : this.selectedItem || this.menuItems[0];
    if (target) {
      target.click();
    }
  }
  get buttonContent() {
    var _a;
    return [
      html`
                <div
                    id="label"
                    role="presentation"
                    class=${ifDefined(this.value ? void 0 : "placeholder")}
                >
                    ${((_a = this.selectedItem) == null ? void 0 : _a.itemText) || ""}
                </div>
                <slot name="tooltip"></slot>
            `
    ];
  }
  update(changes) {
    if (changes.has("type")) {
      if (this.type === "more") {
        this.selects = void 0;
      } else {
        this.selects = "single";
      }
    }
    if (true) {
      window.__swc.warn(
        this,
        `<${this.localName}> is deprecated and will be removed in the SWC 1.0 release. Use a Button Group to show any additional actions related to the most critical action.`,
        "https://opensource.adobe.com/spectrum-web-components/components/split-button/#deprecation",
        { level: "deprecation" }
      );
    }
    super.update(changes);
  }
  render() {
    var _a;
    const treatment = ["cta", "accent"].includes(this.variant) ? "fill" : "outline";
    const buttons = [
      html`
                <sp-button
                    aria-label=${ifDefined(
        this.label || ((_a = this.selectedItem) == null ? void 0 : _a.itemText) || void 0
      )}
                    id="button"
                    class="button ${this.variant}"
                    @click=${this.passClick}
                    ?disabled=${this.disabled}
                    variant=${this.variant}
                    treatment=${treatment}
                    size=${this.size}
                >
                    ${this.buttonContent}
                </sp-button>
            `,
      html`
                <sp-button
                    aria-haspopup="true"
                    aria-expanded=${this.open ? "true" : "false"}
                    aria-controls=${ifDefined(this.open ? "menu" : void 0)}
                    class="button trigger ${this.variant}"
                    @blur=${this.handleButtonBlur}
                    @focus=${this.handleButtonFocus}
                    @keydown=${{
        handleEvent: this.handleEnterKeydown,
        capture: true
      }}
                    ?disabled=${this.disabled}
                    aria-labelledby="button"
                    variant=${this.variant}
                    treatment=${treatment}
                    size=${this.size}
                >
                    ${this.type === "field" ? html`
                              <sp-icon-chevron100
                                  class="icon ${chevronClass[this.size]}"
                                  slot="icon"
                              ></sp-icon-chevron100>
                          ` : html`
                              <sp-icon-more
                                  class="icon"
                                  slot="icon"
                              ></sp-icon-more>
                          `}
                </sp-button>
            `
    ];
    if (this.left) {
      buttons.reverse();
    }
    return html`
            ${buttons} ${this.renderMenu}
        `;
  }
  bindButtonKeydownListener() {
    this.trigger.addEventListener("keydown", this.handleKeydown);
  }
  async manageSelection() {
    await this.manageSplitButtonItems();
    await super.manageSelection();
  }
  async manageSplitButtonItems() {
    if (!this.menuItems.length) {
      await this.optionsMenu.updateComplete;
      if (!this.menuItems.length) {
        return;
      }
    }
    if (this.type === "more") {
      this.menuItems[0].hidden = true;
      this.menuItems.forEach((el) => el.selected = false);
      this.selectedItem = this.menuItems[0];
    } else {
      this.selectedItem = this.selectedItem || this.menuItems[0];
    }
    this.value = this.selectedItem.value;
  }
}
__decorateClass([
  property({ type: Boolean, reflect: true })
], SplitButton.prototype, "left", 2);
__decorateClass([
  property({ reflect: true })
], SplitButton.prototype, "variant", 2);
__decorateClass([
  property({ type: String })
], SplitButton.prototype, "type", 2);
__decorateClass([
  query(".trigger")
], SplitButton.prototype, "trigger", 2);
__decorateClass([
  query(".trigger")
], SplitButton.prototype, "button", 2);
//# sourceMappingURL=SplitButton.dev.js.map
