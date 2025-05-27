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
  SpectrumElement
} from "@spectrum-web-components/base";
import { property } from "@spectrum-web-components/base/src/decorators.js";
import iconStyles from "./icon.css.js";
export class IconBase extends SpectrumElement {
  constructor() {
    super(...arguments);
    this.label = "";
  }
  static get styles() {
    return [iconStyles];
  }
  update(changes) {
    if (changes.has("label")) {
      if (this.label) {
        this.removeAttribute("aria-hidden");
      } else {
        this.setAttribute("aria-hidden", "true");
      }
    }
    super.update(changes);
  }
  render() {
    return html`
            <slot></slot>
        `;
  }
}
__decorateClass([
  property()
], IconBase.prototype, "label", 2);
__decorateClass([
  property({ reflect: true })
], IconBase.prototype, "size", 2);
//# sourceMappingURL=IconBase.dev.js.map
