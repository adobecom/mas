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
  nothing,
  render,
  SizedMixin
} from "@spectrum-web-components/base";
import {
  classMap,
  ifDefined,
  styleMap,
  when
} from "@spectrum-web-components/base/src/directives.js";
import {
  property,
  query,
  state
} from "@spectrum-web-components/base/src/decorators.js";
import pickerStyles from "./picker.css.js";
import chevronStyles from "@spectrum-web-components/icon/src/spectrum-icon-chevron.css.js";
import { Focusable } from "@spectrum-web-components/shared/src/focusable.js";
import "@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-alert.js";
import "@spectrum-web-components/menu/sp-menu.js";
import {
  IS_MOBILE,
  MatchMediaController
} from "@spectrum-web-components/reactive-controllers/src/MatchMedia.js";
import { DependencyManagerController } from "@spectrum-web-components/reactive-controllers/src/DependencyManger.js";
import { strategies } from "./strategies.dev.js";
const chevronClass = {
  s: "spectrum-UIIcon-ChevronDown75",
  m: "spectrum-UIIcon-ChevronDown100",
  l: "spectrum-UIIcon-ChevronDown200",
  xl: "spectrum-UIIcon-ChevronDown300"
};
export const DESCRIPTION_ID = "option-picker";
export class PickerBase extends SizedMixin(Focusable, { noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.isMobile = new MatchMediaController(this, IS_MOBILE);
    this.dependencyManager = new DependencyManagerController(this);
    this.deprecatedMenu = null;
    this.disabled = false;
    this.focused = false;
    this.invalid = false;
    this.pending = false;
    this.pendingLabel = "Pending";
    this.open = false;
    this.readonly = false;
    this.selects = "single";
    this._selfManageFocusElement = false;
    this.placement = "bottom-start";
    this.quiet = false;
    this.value = "";
    this.listRole = "listbox";
    this.itemRole = "option";
    this.handleKeydown = (event) => {
      this.focused = true;
      if (event.code !== "ArrowDown" && event.code !== "ArrowUp") {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.toggle(true);
    };
    this.handleSlottableRequest = (_event) => {
    };
    this.applyFocusElementLabel = (value, labelElement) => {
      this.appliedLabel = value;
      this.labelAlignment = labelElement.sideAligned ? "inline" : void 0;
    };
    this.hasRenderedOverlay = false;
    this.willManageSelection = false;
    this.selectionPromise = Promise.resolve();
    this.recentlyConnected = false;
    this.enterKeydownOn = null;
    this.handleEnterKeydown = (event) => {
      if (event.code !== "Enter") {
        return;
      }
      if (this.enterKeydownOn) {
        event.preventDefault();
        return;
      }
      this.enterKeydownOn = event.target;
      this.addEventListener(
        "keyup",
        async (keyupEvent) => {
          if (keyupEvent.code !== "Enter") {
            return;
          }
          this.enterKeydownOn = null;
        },
        { once: true }
      );
    };
  }
  get menuItems() {
    return this.optionsMenu.childItems;
  }
  get selfManageFocusElement() {
    return this._selfManageFocusElement;
  }
  get selectedItem() {
    return this._selectedItem;
  }
  set selectedItem(selectedItem) {
    this.selectedItemContent = selectedItem ? selectedItem.itemChildren : void 0;
    if (selectedItem === this.selectedItem) return;
    const oldSelectedItem = this.selectedItem;
    this._selectedItem = selectedItem;
    this.requestUpdate("selectedItem", oldSelectedItem);
  }
  get focusElement() {
    if (this.open) {
      return this.optionsMenu;
    }
    return this.button;
  }
  forceFocusVisible() {
    if (this.disabled) {
      return;
    }
    this.focused = true;
  }
  click() {
    if (this.disabled) {
      return;
    }
    this.toggle();
  }
  handleButtonBlur() {
    this.focused = false;
  }
  focus(options) {
    super.focus(options);
    if (!this.disabled && this.focusElement) {
      this.focused = this.hasVisibleFocusInTree();
    }
  }
  handleHelperFocus() {
    this.focused = true;
    this.button.focus();
  }
  handleChange(event) {
    if (this.strategy) {
      this.strategy.preventNextToggle = "no";
    }
    const target = event.target;
    const [selected] = target.selectedItems;
    event.stopPropagation();
    if (event.cancelable) {
      this.setValueFromItem(selected, event);
    } else {
      this.open = false;
      if (this.strategy) {
        this.strategy.open = false;
      }
    }
  }
  handleButtonFocus(event) {
    var _a;
    (_a = this.strategy) == null ? void 0 : _a.handleButtonFocus(event);
  }
  async setValueFromItem(item, menuChangeEvent) {
    var _a;
    this.open = false;
    if (this.strategy) {
      this.strategy.open = false;
    }
    const oldSelectedItem = this.selectedItem;
    const oldValue = this.value;
    this.selectedItem = item;
    this.value = (_a = item == null ? void 0 : item.value) != null ? _a : "";
    await this.updateComplete;
    const applyDefault = this.dispatchEvent(
      new Event("change", {
        bubbles: true,
        // Allow it to be prevented.
        cancelable: true,
        composed: true
      })
    );
    if (!applyDefault && this.selects) {
      if (menuChangeEvent) {
        menuChangeEvent.preventDefault();
      }
      this.setMenuItemSelected(this.selectedItem, false);
      if (oldSelectedItem) {
        this.setMenuItemSelected(oldSelectedItem, true);
      }
      this.selectedItem = oldSelectedItem;
      this.value = oldValue;
      this.open = true;
      if (this.strategy) {
        this.strategy.open = true;
      }
      return;
    } else if (!this.selects) {
      this.selectedItem = oldSelectedItem;
      this.value = oldValue;
      return;
    }
    if (oldSelectedItem) {
      this.setMenuItemSelected(oldSelectedItem, false);
    }
    this.setMenuItemSelected(item, !!this.selects);
  }
  setMenuItemSelected(item, value) {
    if (this.selects == null) return;
    item.selected = value;
  }
  toggle(target) {
    if (this.readonly || this.pending) {
      return;
    }
    this.open = typeof target !== "undefined" ? target : !this.open;
    if (this.strategy) {
      this.strategy.open = this.open;
    }
    if (this.open) {
      this._selfManageFocusElement = true;
    } else {
      this._selfManageFocusElement = false;
    }
  }
  close() {
    if (this.readonly) {
      return;
    }
    if (this.strategy) {
      this.open = false;
      this.strategy.open = false;
    }
  }
  get containerStyles() {
    if (this.isMobile.matches) {
      return {
        "--swc-menu-width": "100%"
      };
    }
    return {};
  }
  get selectedItemContent() {
    return this._selectedItemContent || { icon: [], content: [] };
  }
  set selectedItemContent(selectedItemContent) {
    if (selectedItemContent === this.selectedItemContent) return;
    const oldContent = this.selectedItemContent;
    this._selectedItemContent = selectedItemContent;
    this.requestUpdate("selectedItemContent", oldContent);
  }
  handleTooltipSlotchange(event) {
    this.tooltipEl = event.target.assignedElements()[0];
  }
  renderLabelContent(content) {
    if (this.value && this.selectedItem) {
      return content;
    }
    return html`
            <slot name="label" id="label">
                <span
                    aria-hidden=${ifDefined(
      this.appliedLabel ? void 0 : "true"
    )}
                >
                    ${this.label}
                </span>
            </slot>
        `;
  }
  get buttonContent() {
    const labelClasses = {
      "visually-hidden": this.icons === "only" && !!this.value,
      placeholder: !this.value,
      label: true
    };
    const appliedLabel = this.appliedLabel || this.label;
    return [
      html`
                <span id="icon" ?hidden=${this.icons === "none"}>
                    ${this.selectedItemContent.icon}
                </span>
                <span
                    id=${ifDefined(
        this.value && this.selectedItem ? "label" : void 0
      )}
                    class=${classMap(labelClasses)}
                >
                    ${this.renderLabelContent(this.selectedItemContent.content)}
                </span>
                ${this.value && this.selectedItem ? html`
                          <span
                              aria-hidden="true"
                              class="visually-hidden"
                              id="applied-label"
                          >
                              ${appliedLabel}
                              <slot name="label"></slot>
                          </span>
                      ` : html`
                          <span hidden id="applied-label">${appliedLabel}</span>
                      `}
                ${this.invalid && !this.pending ? html`
                          <sp-icon-alert
                              class="validation-icon"
                          ></sp-icon-alert>
                      ` : nothing}
                ${when(this.pending, () => {
        import("@spectrum-web-components/progress-circle/sp-progress-circle.js");
        return html`
                        <sp-progress-circle
                            id="loader"
                            size="s"
                            indeterminate
                            aria-valuetext=${this.pendingLabel}
                            class="progress-circle"
                        ></sp-progress-circle>
                    `;
      })}
                <sp-icon-chevron100
                    class="picker ${chevronClass[this.size]}"
                ></sp-icon-chevron100>
                <slot
                    aria-hidden="true"
                    name="tooltip"
                    id="tooltip"
                    @slotchange=${this.handleTooltipSlotchange}
                ></slot>
            `
    ];
  }
  renderOverlay(menu) {
    var _a, _b, _c;
    if (((_a = this.strategy) == null ? void 0 : _a.overlay) === void 0) {
      return menu;
    }
    const container = this.renderContainer(menu);
    render(container, (_b = this.strategy) == null ? void 0 : _b.overlay, {
      host: this
    });
    return (_c = this.strategy) == null ? void 0 : _c.overlay;
  }
  get renderDescriptionSlot() {
    return html`
            <div id=${DESCRIPTION_ID}>
                <slot name="description"></slot>
            </div>
        `;
  }
  // a helper to throw focus to the button is needed because Safari
  // won't include buttons in the tab order even with tabindex="0"
  render() {
    if (this.tooltipEl) {
      this.tooltipEl.disabled = this.open;
    }
    return html`
            <span
                id="focus-helper"
                tabindex="${this.focused || this.open ? "-1" : "0"}"
                @focus=${this.handleHelperFocus}
                aria-describedby=${DESCRIPTION_ID}
            ></span>
            <button
                aria-controls=${ifDefined(this.open ? "menu" : void 0)}
                aria-describedby="tooltip"
                aria-expanded=${this.open ? "true" : "false"}
                aria-haspopup="true"
                aria-labelledby="loader icon label applied-label"
                id="button"
                class=${ifDefined(
      this.labelAlignment ? `label-${this.labelAlignment}` : void 0
    )}
                @blur=${this.handleButtonBlur}
                @keydown=${{
      handleEvent: this.handleEnterKeydown,
      capture: true
    }}
                ?disabled=${this.disabled}
                tabindex="-1"
            >
                ${this.buttonContent}
            </button>
            ${this.renderMenu} ${this.renderDescriptionSlot}
        `;
  }
  update(changes) {
    var _a, _b;
    if (this.selects) {
      this.selects = "single";
    }
    if (changes.has("disabled") && this.disabled) {
      if (this.strategy) {
        this.open = false;
        this.strategy.open = false;
      }
    }
    if (changes.has("pending") && this.pending) {
      if (this.strategy) {
        this.open = false;
        this.strategy.open = false;
      }
    }
    if (changes.has("value")) {
      this.shouldScheduleManageSelection();
    }
    if (!this.hasUpdated) {
      this.deprecatedMenu = this.querySelector(":scope > sp-menu");
      (_a = this.deprecatedMenu) == null ? void 0 : _a.toggleAttribute("ignore", true);
      (_b = this.deprecatedMenu) == null ? void 0 : _b.setAttribute("selects", "inherit");
    }
    if (true) {
      if (!this.hasUpdated && this.querySelector(":scope > sp-menu")) {
        const { localName } = this;
        window.__swc.warn(
          this,
          `You no longer need to provide an <sp-menu> child to ${localName}. Any styling or attributes on the <sp-menu> will be ignored.`,
          "https://opensource.adobe.com/spectrum-web-components/components/picker/#sizes",
          { level: "deprecation" }
        );
      }
      this.updateComplete.then(async () => {
        await new Promise((res) => requestAnimationFrame(res));
        await new Promise((res) => requestAnimationFrame(res));
        if (!this.label && !this.getAttribute("aria-label") && !this.getAttribute("aria-labelledby") && !this.appliedLabel) {
          window.__swc.warn(
            this,
            "<${this.localName}> needs one of the following to be accessible:",
            "https://opensource.adobe.com/spectrum-web-components/components/picker/#accessibility",
            {
              type: "accessibility",
              issues: [
                `an <sp-field-label> element with a \`for\` attribute referencing the \`id\` of the \`<${this.localName}>\`, or`,
                'value supplied to the "label" attribute, which will be displayed visually as placeholder text, or',
                'text content supplied in a <span> with slot="label", which will also be displayed visually as placeholder text.'
              ]
            }
          );
        }
      });
    }
    super.update(changes);
  }
  bindButtonKeydownListener() {
    this.button.addEventListener("keydown", this.handleKeydown);
  }
  updated(changes) {
    super.updated(changes);
    if (changes.has("open")) {
      this.strategy.open = this.open;
    }
  }
  firstUpdated(changes) {
    super.firstUpdated(changes);
    this.bindButtonKeydownListener();
    this.bindEvents();
  }
  get dismissHelper() {
    return html`
            <div class="visually-hidden">
                <button
                    tabindex="-1"
                    aria-label="Dismiss"
                    @click=${this.close}
                ></button>
            </div>
        `;
  }
  renderContainer(menu) {
    const accessibleMenu = html`
            ${this.dismissHelper} ${menu} ${this.dismissHelper}
        `;
    if (this.isMobile.matches) {
      this.dependencyManager.add("sp-tray");
      import("@spectrum-web-components/tray/sp-tray.js");
      return html`
                <sp-tray
                    id="popover"
                    role="presentation"
                    style=${styleMap(this.containerStyles)}
                >
                    ${accessibleMenu}
                </sp-tray>
            `;
    }
    this.dependencyManager.add("sp-popover");
    import("@spectrum-web-components/popover/sp-popover.js");
    return html`
            <sp-popover
                id="popover"
                role="presentation"
                style=${styleMap(this.containerStyles)}
                placement=${this.placement}
            >
                ${accessibleMenu}
            </sp-popover>
        `;
  }
  get renderMenu() {
    const menu = html`
            <sp-menu
                aria-labelledby="applied-label"
                @change=${this.handleChange}
                id="menu"
                @keydown=${{
      handleEvent: this.handleEnterKeydown,
      capture: true
    }}
                role=${this.listRole}
                .selects=${this.selects}
                .selected=${this.value ? [this.value] : []}
                size=${this.size}
                @sp-menu-item-added-or-updated=${this.shouldManageSelection}
            >
                <slot @slotchange=${this.shouldScheduleManageSelection}></slot>
            </sp-menu>
        `;
    this.hasRenderedOverlay = this.hasRenderedOverlay || this.focused || this.open || !!this.deprecatedMenu;
    if (this.hasRenderedOverlay) {
      if (this.dependencyManager.loaded) {
        this.dependencyManager.add("sp-overlay");
      }
      return this.renderOverlay(menu);
    }
    return menu;
  }
  shouldScheduleManageSelection(event) {
    if (!this.willManageSelection && (!event || event.target.getRootNode().host === this)) {
      this.willManageSelection = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.manageSelection();
        });
      });
    }
  }
  shouldManageSelection() {
    if (this.willManageSelection) {
      return;
    }
    this.willManageSelection = true;
    this.manageSelection();
  }
  async manageSelection() {
    if (this.selects == null) return;
    this.selectionPromise = new Promise(
      (res) => this.selectionResolver = res
    );
    let selectedItem;
    await this.optionsMenu.updateComplete;
    if (this.recentlyConnected) {
      await new Promise((res) => requestAnimationFrame(() => res(true)));
      this.recentlyConnected = false;
    }
    this.menuItems.forEach((item) => {
      if (this.value === item.value && !item.disabled) {
        selectedItem = item;
      } else {
        item.selected = false;
      }
    });
    if (selectedItem) {
      selectedItem.selected = !!this.selects;
      this.selectedItem = selectedItem;
    } else {
      this.value = "";
      this.selectedItem = void 0;
    }
    if (this.open) {
      await this.optionsMenu.updateComplete;
      this.optionsMenu.updateSelectedItemIndex();
    }
    this.selectionResolver();
    this.willManageSelection = false;
  }
  async getUpdateComplete() {
    const complete = await super.getUpdateComplete();
    await this.selectionPromise;
    return complete;
  }
  bindEvents() {
    var _a;
    (_a = this.strategy) == null ? void 0 : _a.abort();
    if (this.isMobile.matches) {
      this.strategy = new strategies["mobile"](this.button, this);
    } else {
      this.strategy = new strategies["desktop"](this.button, this);
    }
  }
  connectedCallback() {
    super.connectedCallback();
    this.recentlyConnected = this.hasUpdated;
  }
  disconnectedCallback() {
    var _a;
    this.close();
    (_a = this.strategy) == null ? void 0 : _a.releaseDescription();
    super.disconnectedCallback();
  }
}
__decorateClass([
  state()
], PickerBase.prototype, "appliedLabel", 2);
__decorateClass([
  query("#button")
], PickerBase.prototype, "button", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], PickerBase.prototype, "disabled", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], PickerBase.prototype, "focused", 2);
__decorateClass([
  property({ type: String, reflect: true })
], PickerBase.prototype, "icons", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], PickerBase.prototype, "invalid", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], PickerBase.prototype, "pending", 2);
__decorateClass([
  property({ type: String, attribute: "pending-label" })
], PickerBase.prototype, "pendingLabel", 2);
__decorateClass([
  property()
], PickerBase.prototype, "label", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], PickerBase.prototype, "open", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], PickerBase.prototype, "readonly", 2);
__decorateClass([
  state()
], PickerBase.prototype, "labelAlignment", 2);
__decorateClass([
  query("sp-menu")
], PickerBase.prototype, "optionsMenu", 2);
__decorateClass([
  query("sp-overlay")
], PickerBase.prototype, "overlayElement", 2);
__decorateClass([
  property()
], PickerBase.prototype, "placement", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], PickerBase.prototype, "quiet", 2);
__decorateClass([
  property({ type: String })
], PickerBase.prototype, "value", 2);
__decorateClass([
  property({ attribute: false })
], PickerBase.prototype, "selectedItem", 1);
__decorateClass([
  state()
], PickerBase.prototype, "selectedItemContent", 1);
export class Picker extends PickerBase {
  constructor() {
    super(...arguments);
    this.handleKeydown = (event) => {
      const { code } = event;
      this.focused = true;
      if (!code.startsWith("Arrow") || this.readonly || this.pending) {
        return;
      }
      if (code === "ArrowUp" || code === "ArrowDown") {
        this.toggle(true);
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const selectedIndex = this.selectedItem ? this.menuItems.indexOf(this.selectedItem) : -1;
      const nextOffset = selectedIndex < 0 || code === "ArrowRight" ? 1 : -1;
      let nextIndex = selectedIndex + nextOffset;
      while (this.menuItems[nextIndex] && this.menuItems[nextIndex].disabled) {
        nextIndex += nextOffset;
      }
      if (!this.menuItems[nextIndex] || this.menuItems[nextIndex].disabled) {
        return;
      }
      if (!this.value || nextIndex !== selectedIndex) {
        this.setValueFromItem(this.menuItems[nextIndex]);
      }
    };
  }
  static get styles() {
    return [pickerStyles, chevronStyles];
  }
  get containerStyles() {
    const styles = super.containerStyles;
    if (!this.quiet) {
      styles["min-width"] = `${this.offsetWidth}px`;
    }
    return styles;
  }
}
//# sourceMappingURL=Picker.dev.js.map
