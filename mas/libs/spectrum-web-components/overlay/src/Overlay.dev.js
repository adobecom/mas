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
import {
  property,
  query,
  queryAssignedElements,
  state
} from "@spectrum-web-components/base/src/decorators.js";
import {
  ElementResolutionController,
  elementResolverUpdatedSymbol
} from "@spectrum-web-components/reactive-controllers/src/ElementResolution.js";
import {
  ifDefined,
  styleMap
} from "@spectrum-web-components/base/src/directives.js";
import { randomID } from "@spectrum-web-components/shared/src/random-id.js";
import { AbstractOverlay, nextFrame } from "./AbstractOverlay.dev.js";
import { OverlayDialog } from "./OverlayDialog.dev.js";
import { OverlayPopover } from "./OverlayPopover.dev.js";
import { OverlayNoPopover } from "./OverlayNoPopover.dev.js";
import { overlayStack } from "./OverlayStack.dev.js";
import { VirtualTrigger } from "./VirtualTrigger.dev.js";
import { PlacementController } from "./PlacementController.dev.js";
export { LONGPRESS_INSTRUCTIONS } from "./LongpressController.dev.js";
import { strategies } from "./strategies.dev.js";
import {
  removeSlottableRequest,
  SlottableRequestEvent
} from "./slottable-request-event.dev.js";
import styles from "./overlay.css.js";
const supportsPopover = "showPopover" in document.createElement("div");
let OverlayFeatures = OverlayDialog(AbstractOverlay);
if (supportsPopover) {
  OverlayFeatures = OverlayPopover(OverlayFeatures);
} else {
  OverlayFeatures = OverlayNoPopover(OverlayFeatures);
}
const _Overlay = class _Overlay extends OverlayFeatures {
  constructor() {
    super(...arguments);
    this._delayed = false;
    this._disabled = false;
    this.offset = 0;
    this._open = false;
    /**
     * The state in which the last `request-slottable` event was dispatched.
     * Do not allow overlays from dispatching the same state twice in a row.
     */
    this.lastRequestSlottableState = false;
    this.receivesFocus = "auto";
    this._state = "closed";
    this.triggerElement = null;
    this.type = "auto";
    this.wasOpen = false;
    this.closeOnFocusOut = (event) => {
      if (!event.relatedTarget) {
        return;
      }
      const relationEvent = new Event("overlay-relation-query", {
        bubbles: true,
        composed: true
      });
      event.relatedTarget.addEventListener(
        relationEvent.type,
        (event2) => {
          if (!event2.composedPath().includes(this)) {
            this.open = false;
          }
        }
      );
      event.relatedTarget.dispatchEvent(relationEvent);
    };
  }
  get delayed() {
    var _a;
    return ((_a = this.elements.at(-1)) == null ? void 0 : _a.hasAttribute("delayed")) || this._delayed;
  }
  set delayed(delayed) {
    this._delayed = delayed;
  }
  get disabled() {
    return this._disabled;
  }
  set disabled(disabled) {
    var _a;
    this._disabled = disabled;
    if (disabled) {
      (_a = this.strategy) == null ? void 0 : _a.abort();
      this.wasOpen = this.open;
      this.open = false;
    } else {
      this.bindEvents();
      this.open = this.open || this.wasOpen;
      this.wasOpen = false;
    }
  }
  get hasNonVirtualTrigger() {
    return !!this.triggerElement && !(this.triggerElement instanceof VirtualTrigger);
  }
  get placementController() {
    if (!this._placementController) {
      this._placementController = new PlacementController(this);
    }
    return this._placementController;
  }
  get open() {
    return this._open;
  }
  set open(open) {
    var _a;
    if (open && this.disabled) return;
    if (open === this.open) return;
    if (((_a = this.strategy) == null ? void 0 : _a.activelyOpening) && !open) return;
    this._open = open;
    if (this.open) {
      _Overlay.openCount += 1;
    }
    this.requestUpdate("open", !this.open);
    if (this.open) {
      this.requestSlottable();
    }
  }
  get state() {
    return this._state;
  }
  set state(state2) {
    var _a;
    if (state2 === this.state) return;
    const oldState = this.state;
    this._state = state2;
    if (this.state === "opened" || this.state === "closed") {
      (_a = this.strategy) == null ? void 0 : _a.shouldCompleteOpen();
    }
    this.requestUpdate("state", oldState);
  }
  get elementResolver() {
    if (!this._elementResolver) {
      this._elementResolver = new ElementResolutionController(this);
    }
    return this._elementResolver;
  }
  get usesDialog() {
    return this.type === "modal" || this.type === "page";
  }
  get popoverValue() {
    const hasPopoverAttribute = "popover" in this;
    if (!hasPopoverAttribute) {
      return void 0;
    }
    switch (this.type) {
      case "modal":
      case "page":
        return void 0;
      case "hint":
        return "manual";
      default:
        return this.type;
    }
  }
  get requiresPosition() {
    if (this.type === "page" || !this.open) return false;
    if (!this.triggerElement || !this.placement && this.type !== "hint")
      return false;
    return true;
  }
  managePosition() {
    if (!this.requiresPosition || !this.open) return;
    const offset = this.offset || 0;
    const trigger = this.triggerElement;
    const placement = this.placement || "right";
    const tipPadding = this.tipPadding;
    this.placementController.placeOverlay(this.dialogEl, {
      offset,
      placement,
      tipPadding,
      trigger,
      type: this.type
    });
  }
  async managePopoverOpen() {
    super.managePopoverOpen();
    const targetOpenState = this.open;
    if (this.open !== targetOpenState) {
      return;
    }
    await this.manageDelay(targetOpenState);
    if (this.open !== targetOpenState) {
      return;
    }
    await this.ensureOnDOM(targetOpenState);
    if (this.open !== targetOpenState) {
      return;
    }
    const focusEl = await this.makeTransition(targetOpenState);
    if (this.open !== targetOpenState) {
      return;
    }
    await this.applyFocus(targetOpenState, focusEl);
  }
  async applyFocus(targetOpenState, focusEl) {
    if (this.receivesFocus === "false" || this.type === "hint") {
      return;
    }
    await nextFrame();
    await nextFrame();
    if (targetOpenState === this.open && !this.open) {
      if (this.hasNonVirtualTrigger && this.contains(this.getRootNode().activeElement)) {
        this.triggerElement.focus();
      }
      return;
    }
    focusEl == null ? void 0 : focusEl.focus();
  }
  returnFocus() {
    var _a;
    if (this.open || this.type === "hint") return;
    const getAncestors = () => {
      var _a2, _b;
      const ancestors = [];
      let currentNode = document.activeElement;
      while ((_a2 = currentNode == null ? void 0 : currentNode.shadowRoot) == null ? void 0 : _a2.activeElement) {
        currentNode = currentNode.shadowRoot.activeElement;
      }
      while (currentNode) {
        const ancestor = currentNode.assignedSlot || currentNode.parentElement || ((_b = currentNode.getRootNode()) == null ? void 0 : _b.host);
        if (ancestor) {
          ancestors.push(ancestor);
        }
        currentNode = ancestor;
      }
      return ancestors;
    };
    if (this.receivesFocus !== "false" && !!((_a = this.triggerElement) == null ? void 0 : _a.focus) && (this.contains(this.getRootNode().activeElement) || getAncestors().includes(this) || // eslint-disable-next-line @spectrum-web-components/document-active-element
    document.activeElement === document.body)) {
      this.triggerElement.focus();
    }
  }
  async manageOpen(oldOpen) {
    if (!this.isConnected && this.open) return;
    if (!this.hasUpdated) {
      await this.updateComplete;
    }
    if (this.open) {
      overlayStack.add(this);
      if (this.willPreventClose) {
        document.addEventListener(
          "pointerup",
          () => {
            this.dialogEl.classList.toggle(
              "not-immediately-closable",
              false
            );
            this.willPreventClose = false;
          },
          { once: true }
        );
        this.dialogEl.classList.toggle(
          "not-immediately-closable",
          true
        );
      }
    } else {
      if (oldOpen) {
        this.dispose();
      }
      overlayStack.remove(this);
    }
    if (this.open && this.state !== "opened") {
      this.state = "opening";
    } else if (!this.open && this.state !== "closed") {
      this.state = "closing";
    }
    if (this.usesDialog) {
      this.manageDialogOpen();
    } else {
      this.managePopoverOpen();
    }
    if (this.type === "auto") {
      const listenerRoot = this.getRootNode();
      if (this.open) {
        listenerRoot.addEventListener(
          "focusout",
          this.closeOnFocusOut,
          { capture: true }
        );
      } else {
        listenerRoot.removeEventListener(
          "focusout",
          this.closeOnFocusOut,
          { capture: true }
        );
      }
    }
  }
  bindEvents() {
    var _a;
    (_a = this.strategy) == null ? void 0 : _a.abort();
    this.strategy = void 0;
    if (!this.hasNonVirtualTrigger) return;
    if (!this.triggerInteraction) return;
    this.strategy = new strategies[this.triggerInteraction](
      this.triggerElement,
      {
        overlay: this
      }
    );
  }
  handleBeforetoggle(event) {
    if (event.newState !== "open") {
      this.handleBrowserClose();
    }
  }
  handleBrowserClose() {
    var _a;
    if (!((_a = this.strategy) == null ? void 0 : _a.activelyOpening)) {
      this.open = false;
      return;
    }
    this.manuallyKeepOpen();
  }
  manuallyKeepOpen() {
    this.open = true;
    this.placementController.allowPlacementUpdate = true;
    this.manageOpen(false);
  }
  handleSlotchange() {
    var _a, _b;
    if (!this.elements.length) {
      (_a = this.strategy) == null ? void 0 : _a.releaseDescription();
    } else if (this.hasNonVirtualTrigger) {
      (_b = this.strategy) == null ? void 0 : _b.prepareDescription(
        this.triggerElement
      );
    }
  }
  shouldPreventClose() {
    const shouldPreventClose = this.willPreventClose;
    this.willPreventClose = false;
    return shouldPreventClose;
  }
  requestSlottable() {
    if (this.lastRequestSlottableState === this.open) {
      return;
    }
    if (!this.open) {
      document.body.offsetHeight;
    }
    this.dispatchEvent(
      new SlottableRequestEvent(
        "overlay-content",
        this.open ? {} : removeSlottableRequest
      )
    );
    this.lastRequestSlottableState = this.open;
  }
  willUpdate(changes) {
    var _a;
    if (!this.hasAttribute("id")) {
      this.setAttribute(
        "id",
        `${this.tagName.toLowerCase()}-${randomID()}`
      );
    }
    if (changes.has("open") && (this.hasUpdated || this.open)) {
      this.manageOpen(changes.get("open"));
    }
    if (changes.has("trigger")) {
      const [id, interaction] = ((_a = this.trigger) == null ? void 0 : _a.split("@")) || [];
      this.elementResolver.selector = id ? `#${id}` : "";
      this.triggerInteraction = interaction;
    }
    let oldTrigger = false;
    if (changes.has(elementResolverUpdatedSymbol)) {
      oldTrigger = this.triggerElement;
      this.triggerElement = this.elementResolver.element;
    }
    if (changes.has("triggerElement")) {
      oldTrigger = changes.get("triggerElement");
    }
    if (oldTrigger !== false) {
      this.bindEvents();
    }
  }
  updated(changes) {
    super.updated(changes);
    if (changes.has("placement")) {
      if (this.placement) {
        this.dialogEl.setAttribute("actual-placement", this.placement);
      } else {
        this.dialogEl.removeAttribute("actual-placement");
      }
      if (this.open && typeof changes.get("placement") !== "undefined") {
        this.placementController.resetOverlayPosition();
      }
    }
    if (changes.has("state") && this.state === "closed" && typeof changes.get("state") !== "undefined") {
      this.placementController.clearOverlayPosition();
    }
  }
  renderContent() {
    return html`
            <slot @slotchange=${this.handleSlotchange}></slot>
        `;
  }
  get dialogStyleMap() {
    return {
      "--swc-overlay-open-count": _Overlay.openCount.toString()
    };
  }
  renderDialog() {
    return html`
            <dialog
                class="dialog"
                part="dialog"
                placement=${ifDefined(
      this.requiresPosition ? this.placement || "right" : void 0
    )}
                style=${styleMap(this.dialogStyleMap)}
                @close=${this.handleBrowserClose}
                @cancel=${this.handleBrowserClose}
                @beforetoggle=${this.handleBeforetoggle}
                ?is-visible=${this.state !== "closed"}
            >
                ${this.renderContent()}
            </dialog>
        `;
  }
  renderPopover() {
    return html`
            <div
                class="dialog"
                part="dialog"
                placement=${ifDefined(
      this.requiresPosition ? this.placement || "right" : void 0
    )}
                popover=${ifDefined(this.popoverValue)}
                style=${styleMap(this.dialogStyleMap)}
                @beforetoggle=${this.handleBeforetoggle}
                @close=${this.handleBrowserClose}
                ?is-visible=${this.state !== "closed"}
            >
                ${this.renderContent()}
            </div>
        `;
  }
  render() {
    const isDialog = this.type === "modal" || this.type === "page";
    return html`
            ${isDialog ? this.renderDialog() : this.renderPopover()}
            <slot name="longpress-describedby-descriptor"></slot>
        `;
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("close", () => {
      this.open = false;
    });
    if (this.hasUpdated) {
      this.bindEvents();
    }
  }
  disconnectedCallback() {
    var _a;
    (_a = this.strategy) == null ? void 0 : _a.releaseDescription();
    this.open = false;
    super.disconnectedCallback();
  }
};
_Overlay.styles = [styles];
_Overlay.openCount = 1;
__decorateClass([
  property({ type: Boolean })
], _Overlay.prototype, "delayed", 1);
__decorateClass([
  query(".dialog")
], _Overlay.prototype, "dialogEl", 2);
__decorateClass([
  property({ type: Boolean })
], _Overlay.prototype, "disabled", 1);
__decorateClass([
  queryAssignedElements({
    flatten: true,
    selector: ':not([slot="longpress-describedby-descriptor"], slot)'
    // gather only elements slotted into the default slot
  })
], _Overlay.prototype, "elements", 2);
__decorateClass([
  property({ type: Number })
], _Overlay.prototype, "offset", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], _Overlay.prototype, "open", 1);
__decorateClass([
  property()
], _Overlay.prototype, "placement", 2);
__decorateClass([
  property({ attribute: "receives-focus" })
], _Overlay.prototype, "receivesFocus", 2);
__decorateClass([
  query("slot")
], _Overlay.prototype, "slotEl", 2);
__decorateClass([
  state()
], _Overlay.prototype, "state", 1);
__decorateClass([
  property({ type: Number, attribute: "tip-padding" })
], _Overlay.prototype, "tipPadding", 2);
__decorateClass([
  property()
], _Overlay.prototype, "trigger", 2);
__decorateClass([
  property({ attribute: false })
], _Overlay.prototype, "triggerElement", 2);
__decorateClass([
  property({ attribute: false })
], _Overlay.prototype, "triggerInteraction", 2);
__decorateClass([
  property()
], _Overlay.prototype, "type", 2);
export let Overlay = _Overlay;
//# sourceMappingURL=Overlay.dev.js.map
