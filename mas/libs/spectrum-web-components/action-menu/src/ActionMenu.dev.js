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
  html
} from "@spectrum-web-components/base";
import { state } from "@spectrum-web-components/base/src/decorators.js";
import { ifDefined } from "@spectrum-web-components/base/src/directives.js";
import { property } from "@spectrum-web-components/base/src/decorators.js";
import { DESCRIPTION_ID, PickerBase } from "@spectrum-web-components/picker";
import "@spectrum-web-components/action-button/sp-action-button.js";
import { ObserveSlotPresence } from "@spectrum-web-components/shared/src/observe-slot-presence.js";
import { ObserveSlotText } from "@spectrum-web-components/shared/src/observe-slot-text.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-more.js";
import actionMenuStyles from "./action-menu.css.js";
import { SlottableRequestEvent } from "@spectrum-web-components/overlay/src/slottable-request-event.js";
export class ActionMenu extends ObserveSlotPresence(
  ObserveSlotText(PickerBase, "label"),
  '[slot="label-only"]'
) {
  constructor() {
    super(...arguments);
    this.selects = void 0;
    this.static = void 0;
    this.listRole = "menu";
    this.itemRole = "menuitem";
    this.handleSlottableRequest = (event) => {
      this.dispatchEvent(new SlottableRequestEvent(event.name, event.data));
    };
  }
  static get styles() {
    return [actionMenuStyles];
  }
  get hasLabel() {
    return this.slotHasContent;
  }
  get labelOnly() {
    return this.slotContentIsPresent;
  }
  get buttonContent() {
    return [
      html`
                ${this.labelOnly ? html`` : html`
                          <slot
                              name="icon"
                              slot="icon"
                              ?icon-only=${!this.hasLabel}
                              ?hidden=${this.labelOnly}
                          >
                              <sp-icon-more class="icon"></sp-icon-more>
                          </slot>
                      `}
                <slot name="label" ?hidden=${!this.hasLabel}></slot>
                <slot name="label-only"></slot>
                <slot
                    name="tooltip"
                    @slotchange=${this.handleTooltipSlotchange}
                ></slot>
            `
    ];
  }
  render() {
    if (this.tooltipEl) {
      this.tooltipEl.disabled = this.open;
    }
    return html`
            <sp-action-button
                aria-describedby=${DESCRIPTION_ID}
                ?quiet=${this.quiet}
                ?selected=${this.open}
                static=${ifDefined(this.static)}
                aria-haspopup="true"
                aria-controls=${ifDefined(this.open ? "menu" : void 0)}
                aria-expanded=${this.open ? "true" : "false"}
                aria-label=${ifDefined(this.label || void 0)}
                id="button"
                class="button"
                size=${this.size}
                @blur=${this.handleButtonBlur}
                @focus=${this.handleButtonFocus}
                @keydown=${{
      handleEvent: this.handleEnterKeydown,
      capture: true
    }}
                ?disabled=${this.disabled}
            >
                ${this.buttonContent}
            </sp-action-button>
            ${this.renderMenu} ${this.renderDescriptionSlot}
        `;
  }
  update(changedProperties) {
    if (changedProperties.has("invalid")) {
      this.invalid = false;
    }
    super.update(changedProperties);
  }
}
__decorateClass([
  property({ type: String })
], ActionMenu.prototype, "selects", 2);
__decorateClass([
  property({ type: String, reflect: true })
], ActionMenu.prototype, "static", 2);
__decorateClass([
  state()
], ActionMenu.prototype, "labelOnly", 1);
//# sourceMappingURL=ActionMenu.dev.js.map
