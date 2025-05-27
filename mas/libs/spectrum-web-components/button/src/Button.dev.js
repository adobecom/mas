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
import { property } from "@spectrum-web-components/base/src/decorators.js";
import { ButtonBase } from "./ButtonBase.dev.js";
import buttonStyles from "./button.css.js";
import { when } from "@spectrum-web-components/base/src/directives.js";
export const VALID_VARIANTS = [
  "accent",
  "primary",
  "secondary",
  "negative",
  "white",
  "black"
];
export const VALID_STATICS = ["white", "black"];
export class Button extends SizedMixin(ButtonBase, { noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.pendingLabel = "Pending";
    this.pending = false;
    this.cachedAriaLabel = null;
    this._variant = "accent";
    this.treatment = "fill";
  }
  static get styles() {
    return [...super.styles, buttonStyles];
  }
  click() {
    if (this.pending) {
      return;
    }
    super.click();
  }
  get variant() {
    return this._variant;
  }
  set variant(variant) {
    if (variant === this.variant) return;
    this.requestUpdate("variant", this.variant);
    switch (variant) {
      case "cta":
        this._variant = "accent";
        if (true) {
          window.__swc.warn(
            this,
            `The "cta" value of the "variant" attribute on <${this.localName}> has been deprecated and will be removed in a future release. Use "variant='accent'" instead.`,
            "https://opensource.adobe.com/spectrum-web-components/components/button/#variants"
          );
        }
        break;
      case "overBackground":
        this.removeAttribute("variant");
        this.static = "white";
        this.treatment = "outline";
        if (true) {
          window.__swc.warn(
            this,
            `The "overBackground" value of the "variant" attribute on <${this.localName}> has been deprecated and will be removed in a future release. Use "static='white'" with "treatment='outline'" instead.`,
            "https://opensource.adobe.com/spectrum-web-components/components/button#static"
          );
        }
        return;
      case "white":
      case "black":
        this.static = variant;
        this.removeAttribute("variant");
        if (true) {
          window.__swc.warn(
            this,
            `The "black" and "white" values of the "variant" attribute on <${this.localName}> has been deprecated and will be removed in a future release. Use "static='black'" or "static='white'" instead.`,
            "https://opensource.adobe.com/spectrum-web-components/components/button#static"
          );
        }
        return;
      case null:
        return;
      default:
        if (!VALID_VARIANTS.includes(variant)) {
          this._variant = "accent";
        } else {
          this._variant = variant;
        }
        break;
    }
    this.setAttribute("variant", this.variant);
  }
  set quiet(quiet) {
    this.treatment = quiet ? "outline" : "fill";
  }
  get quiet() {
    return this.treatment === "outline";
  }
  firstUpdated(changes) {
    super.firstUpdated(changes);
    if (!this.hasAttribute("variant")) {
      this.setAttribute("variant", this.variant);
    }
  }
  updated(changed) {
    super.updated(changed);
    if (changed.has("pending")) {
      if (this.pending && this.pendingLabel !== this.getAttribute("aria-label")) {
        if (!this.disabled) {
          this.cachedAriaLabel = this.getAttribute("aria-label") || "";
          this.setAttribute("aria-label", this.pendingLabel);
        }
      } else if (!this.pending && this.cachedAriaLabel) {
        this.setAttribute("aria-label", this.cachedAriaLabel);
      } else if (!this.pending && this.cachedAriaLabel === "") {
        this.removeAttribute("aria-label");
      }
    }
    if (changed.has("disabled")) {
      if (!this.disabled && this.pendingLabel !== this.getAttribute("aria-label")) {
        if (this.pending) {
          this.cachedAriaLabel = this.getAttribute("aria-label") || "";
          this.setAttribute("aria-label", this.pendingLabel);
        }
      } else if (this.disabled && this.cachedAriaLabel) {
        this.setAttribute("aria-label", this.cachedAriaLabel);
      } else if (this.disabled && this.cachedAriaLabel == "") {
        this.removeAttribute("aria-label");
      }
    }
  }
  renderButton() {
    return html`
            ${this.buttonContent}
            ${when(this.pending, () => {
      import("@spectrum-web-components/progress-circle/sp-progress-circle.js");
      return html`
                    <sp-progress-circle
                        indeterminate
                        static="white"
                        aria-hidden="true"
                    ></sp-progress-circle>
                `;
    })}
        `;
  }
}
__decorateClass([
  property({ type: String, attribute: "pending-label" })
], Button.prototype, "pendingLabel", 2);
__decorateClass([
  property({ type: Boolean, reflect: true, attribute: true })
], Button.prototype, "pending", 2);
__decorateClass([
  property()
], Button.prototype, "variant", 1);
__decorateClass([
  property({ type: String, reflect: true })
], Button.prototype, "static", 2);
__decorateClass([
  property({ reflect: true })
], Button.prototype, "treatment", 2);
__decorateClass([
  property({ type: Boolean })
], Button.prototype, "quiet", 1);
//# sourceMappingURL=Button.dev.js.map
