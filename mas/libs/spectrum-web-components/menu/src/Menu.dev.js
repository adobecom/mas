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
  SizedMixin,
  SpectrumElement
} from "@spectrum-web-components/base";
import {
  property,
  query
} from "@spectrum-web-components/base/src/decorators.js";
import menuStyles from "./menu.css.js";
function elementIsOrContains(el, isOrContains) {
  return !!isOrContains && (el === isOrContains || el.contains(isOrContains));
}
export class Menu extends SizedMixin(SpectrumElement, { noDefaultSize: true }) {
  constructor() {
    super();
    this.label = "";
    this.ignore = false;
    this.value = "";
    this.valueSeparator = ",";
    this._selected = [];
    this.selectedItems = [];
    this.childItemSet = /* @__PURE__ */ new Set();
    this.focusedItemIndex = 0;
    this.focusInItemIndex = 0;
    this.selectedItemsMap = /* @__PURE__ */ new Map();
    // if the click and pointerup events are on the same target, we should not
    // handle the click event.
    this.pointerUpTarget = null;
    this.descendentOverlays = /* @__PURE__ */ new Map();
    this.handleSubmenuClosed = (event) => {
      event.stopPropagation();
      const target = event.composedPath()[0];
      target.dispatchEvent(
        new Event("sp-menu-submenu-closed", {
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleSubmenuOpened = (event) => {
      event.stopPropagation();
      const target = event.composedPath()[0];
      target.dispatchEvent(
        new Event("sp-menu-submenu-opened", {
          bubbles: true,
          composed: true
        })
      );
      const focusedItem = this.childItems[this.focusedItemIndex];
      if (focusedItem) {
        focusedItem.focused = false;
      }
      const openedItem = event.composedPath().find((el) => this.childItemSet.has(el));
      if (!openedItem) return;
      const openedItemIndex = this.childItems.indexOf(openedItem);
      this.focusedItemIndex = openedItemIndex;
      this.focusInItemIndex = openedItemIndex;
    };
    this._hasUpdatedSelectedItemIndex = false;
    this._willUpdateItems = false;
    this.cacheUpdated = Promise.resolve();
    /* c8 ignore next 3 */
    this.resolveCacheUpdated = () => {
      return;
    };
    this.addEventListener(
      "sp-menu-item-added-or-updated",
      this.onSelectableItemAddedOrUpdated
    );
    this.addEventListener(
      "sp-menu-item-added-or-updated",
      this.onFocusableItemAddedOrUpdated,
      {
        capture: true
      }
    );
    this.addEventListener("click", this.handleClick);
    this.addEventListener("pointerup", this.handlePointerup);
    this.addEventListener("focusin", this.handleFocusin);
    this.addEventListener("blur", this.handleBlur);
    this.addEventListener("sp-opened", this.handleSubmenuOpened);
    this.addEventListener("sp-closed", this.handleSubmenuClosed);
  }
  static get styles() {
    return [menuStyles];
  }
  get isSubmenu() {
    return this.slot === "submenu";
  }
  get selected() {
    return this._selected;
  }
  set selected(selected) {
    if (selected === this.selected) {
      return;
    }
    const old = this.selected;
    this._selected = selected;
    this.selectedItems = [];
    this.selectedItemsMap.clear();
    this.childItems.forEach((item) => {
      if (this !== item.menuData.selectionRoot) {
        return;
      }
      item.selected = this.selected.includes(item.value);
      if (item.selected) {
        this.selectedItems.push(item);
        this.selectedItemsMap.set(item, true);
      }
    });
    this.requestUpdate("selected", old);
  }
  get childItems() {
    if (!this.cachedChildItems) {
      this.cachedChildItems = this.updateCachedMenuItems();
    }
    return this.cachedChildItems;
  }
  updateCachedMenuItems() {
    this.cachedChildItems = [];
    if (!this.menuSlot) {
      return [];
    }
    const slottedElements = this.menuSlot.assignedElements({
      flatten: true
    });
    for (const [i, slottedElement] of slottedElements.entries()) {
      if (this.childItemSet.has(slottedElement)) {
        this.cachedChildItems.push(slottedElement);
        continue;
      }
      const isHTMLSlotElement = slottedElement.localName === "slot";
      const flattenedChildren = isHTMLSlotElement ? slottedElement.assignedElements({
        flatten: true
      }) : [...slottedElement.querySelectorAll(`:scope > *`)];
      slottedElements.splice(
        i,
        1,
        slottedElement,
        ...flattenedChildren
      );
    }
    return this.cachedChildItems;
  }
  /**
   * Hide this getter from web-component-analyzer until
   * https://github.com/runem/web-component-analyzer/issues/131
   * has been addressed.
   *
   * @private
   */
  get childRole() {
    if (this.resolvedRole === "listbox") {
      return "option";
    }
    switch (this.resolvedSelects) {
      case "single":
        return "menuitemradio";
      case "multiple":
        return "menuitemcheckbox";
      default:
        return "menuitem";
    }
  }
  get ownRole() {
    return "menu";
  }
  /**
   * When a descendant `<sp-menu-item>` element is added or updated it will dispatch
   * this event to announce its presence in the DOM. During the CAPTURE phase the first
   * Menu based element that the event encounters will manage the focus state of the
   * dispatching `<sp-menu-item>` element.
   * @param event
   */
  onFocusableItemAddedOrUpdated(event) {
    event.menuCascade.set(this, {
      hadFocusRoot: !!event.item.menuData.focusRoot,
      ancestorWithSelects: event.currentAncestorWithSelects
    });
    if (this.selects) {
      event.currentAncestorWithSelects = this;
    }
    event.item.menuData.focusRoot = event.item.menuData.focusRoot || this;
  }
  /**
   * When a descendant `<sp-menu-item>` element is added or updated it will dispatch
   * this event to announce its presence in the DOM. During the BUBBLE phase the first
   * Menu based element that the event encounters that does not inherit selection will
   * manage the selection state of the dispatching `<sp-menu-item>` element.
   * @param event
   */
  onSelectableItemAddedOrUpdated(event) {
    var _a, _b;
    const cascadeData = event.menuCascade.get(this);
    if (!cascadeData) return;
    event.item.menuData.parentMenu = event.item.menuData.parentMenu || this;
    if (cascadeData.hadFocusRoot && !this.ignore) {
      this.tabIndex = -1;
    }
    this.addChildItem(event.item);
    if (this.selects === "inherit") {
      this.resolvedSelects = "inherit";
      const ignoreMenu = (_a = event.currentAncestorWithSelects) == null ? void 0 : _a.ignore;
      this.resolvedRole = ignoreMenu ? "none" : ((_b = event.currentAncestorWithSelects) == null ? void 0 : _b.getAttribute("role")) || this.getAttribute("role") || void 0;
    } else if (this.selects) {
      this.resolvedRole = this.ignore ? "none" : this.getAttribute("role") || void 0;
      this.resolvedSelects = this.selects;
    } else {
      this.resolvedRole = this.ignore ? "none" : this.getAttribute("role") || void 0;
      this.resolvedSelects = this.resolvedRole === "none" ? "ignore" : "none";
    }
    const selects = this.resolvedSelects === "single" || this.resolvedSelects === "multiple";
    event.item.menuData.cleanupSteps.push(
      (item) => this.removeChildItem(item)
    );
    if ((selects || !this.selects && this.resolvedSelects !== "ignore") && !event.item.menuData.selectionRoot) {
      event.item.setRole(this.childRole);
      event.item.menuData.selectionRoot = event.item.menuData.selectionRoot || this;
      if (event.item.selected) {
        this.selectedItemsMap.set(event.item, true);
        this.selectedItems = [...this.selectedItems, event.item];
        this._selected = [...this.selected, event.item.value];
        this.value = this.selected.join(this.valueSeparator);
      }
    }
  }
  addChildItem(item) {
    this.childItemSet.add(item);
    this.handleItemsChanged();
  }
  async removeChildItem(item) {
    this.childItemSet.delete(item);
    this.cachedChildItems = void 0;
    if (item.focused) {
      this.handleItemsChanged();
      await this.updateComplete;
      this.focus();
    }
  }
  focus({ preventScroll } = {}) {
    if (!this.childItems.length || this.childItems.every((childItem) => childItem.disabled)) {
      return;
    }
    if (this.childItems.some(
      (childItem) => childItem.menuData.focusRoot !== this
    )) {
      super.focus({ preventScroll });
      return;
    }
    this.focusMenuItemByOffset(0);
    super.focus({ preventScroll });
    const selectedItem = this.selectedItems[0];
    if (selectedItem && !preventScroll) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }
  handleClick(event) {
    if (this.pointerUpTarget === event.target) {
      this.pointerUpTarget = null;
      return;
    }
    this.handlePointerBasedSelection(event);
  }
  handlePointerup(event) {
    this.pointerUpTarget = event.target;
    this.handlePointerBasedSelection(event);
  }
  handlePointerBasedSelection(event) {
    if (event instanceof MouseEvent && event.button !== 0) {
      return;
    }
    const path = event.composedPath();
    const target = path.find((el) => {
      if (!(el instanceof Element)) {
        return false;
      }
      return el.getAttribute("role") === this.childRole;
    });
    if (event.defaultPrevented) {
      const index = this.childItems.indexOf(target);
      if ((target == null ? void 0 : target.menuData.focusRoot) === this && index > -1) {
        this.focusedItemIndex = index;
      }
      return;
    }
    if ((target == null ? void 0 : target.href) && target.href.length) {
      this.dispatchEvent(
        new Event("change", {
          bubbles: true,
          composed: true
        })
      );
      return;
    } else if ((target == null ? void 0 : target.menuData.selectionRoot) === this && this.childItems.length) {
      event.preventDefault();
      if (target.hasSubmenu || target.open) {
        return;
      }
      this.selectOrToggleItem(target);
    } else {
      return;
    }
    this.prepareToCleanUp();
  }
  handleFocusin(event) {
    var _a;
    if (this.childItems.some(
      (childItem) => childItem.menuData.focusRoot !== this
    )) {
      return;
    }
    const activeElement = this.getRootNode().activeElement;
    const selectionRoot = ((_a = this.childItems[this.focusedItemIndex]) == null ? void 0 : _a.menuData.selectionRoot) || this;
    if (activeElement !== selectionRoot || event.target !== this) {
      selectionRoot.focus({ preventScroll: true });
      if (activeElement && this.focusedItemIndex === 0) {
        const offset = this.childItems.findIndex(
          (childItem) => childItem === activeElement
        );
        this.focusMenuItemByOffset(Math.max(offset, 0));
      }
    }
    this.startListeningToKeyboard();
  }
  startListeningToKeyboard() {
    this.addEventListener("keydown", this.handleKeydown);
  }
  handleBlur(event) {
    if (elementIsOrContains(this, event.relatedTarget)) {
      return;
    }
    this.stopListeningToKeyboard();
    this.childItems.forEach((child) => child.focused = false);
    this.removeAttribute("aria-activedescendant");
  }
  stopListeningToKeyboard() {
    this.removeEventListener("keydown", this.handleKeydown);
  }
  handleDescendentOverlayOpened(event) {
    const target = event.composedPath()[0];
    if (!target.overlayElement) return;
    this.descendentOverlays.set(
      target.overlayElement,
      target.overlayElement
    );
  }
  handleDescendentOverlayClosed(event) {
    const target = event.composedPath()[0];
    if (!target.overlayElement) return;
    this.descendentOverlays.delete(target.overlayElement);
  }
  async selectOrToggleItem(targetItem) {
    const resolvedSelects = this.resolvedSelects;
    const oldSelectedItemsMap = new Map(this.selectedItemsMap);
    const oldSelected = this.selected.slice();
    const oldSelectedItems = this.selectedItems.slice();
    const oldValue = this.value;
    const focusedChild = this.childItems[this.focusedItemIndex];
    if (focusedChild) {
      focusedChild.focused = false;
      focusedChild.active = false;
    }
    this.focusedItemIndex = this.childItems.indexOf(targetItem);
    this.forwardFocusVisibleToItem(targetItem);
    if (resolvedSelects === "multiple") {
      if (this.selectedItemsMap.has(targetItem)) {
        this.selectedItemsMap.delete(targetItem);
      } else {
        this.selectedItemsMap.set(targetItem, true);
      }
      const selected = [];
      const selectedItems = [];
      this.childItemSet.forEach((childItem) => {
        if (childItem.menuData.selectionRoot !== this) return;
        if (this.selectedItemsMap.has(childItem)) {
          selected.push(childItem.value);
          selectedItems.push(childItem);
        }
      });
      this._selected = selected;
      this.selectedItems = selectedItems;
      this.value = this.selected.join(this.valueSeparator);
    } else {
      this.selectedItemsMap.clear();
      this.selectedItemsMap.set(targetItem, true);
      this.value = targetItem.value;
      this._selected = [targetItem.value];
      this.selectedItems = [targetItem];
    }
    const applyDefault = this.dispatchEvent(
      new Event("change", {
        cancelable: true,
        bubbles: true,
        composed: true
      })
    );
    if (!applyDefault) {
      this._selected = oldSelected;
      this.selectedItems = oldSelectedItems;
      this.selectedItemsMap = oldSelectedItemsMap;
      this.value = oldValue;
      return;
    }
    if (resolvedSelects === "single") {
      for (const oldItem of oldSelectedItemsMap.keys()) {
        if (oldItem !== targetItem) {
          oldItem.selected = false;
        }
      }
      targetItem.selected = true;
    } else if (resolvedSelects === "multiple") {
      targetItem.selected = !targetItem.selected;
    }
  }
  navigateWithinMenu(event) {
    const { key } = event;
    const lastFocusedItem = this.childItems[this.focusedItemIndex];
    const direction = key === "ArrowDown" ? 1 : -1;
    const itemToFocus = this.focusMenuItemByOffset(direction);
    if (itemToFocus === lastFocusedItem) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    itemToFocus.scrollIntoView({ block: "nearest" });
  }
  navigateBetweenRelatedMenus(event) {
    const { key } = event;
    event.stopPropagation();
    const shouldOpenSubmenu = this.isLTR && key === "ArrowRight" || !this.isLTR && key === "ArrowLeft";
    const shouldCloseSelfAsSubmenu = this.isLTR && key === "ArrowLeft" || !this.isLTR && key === "ArrowRight";
    if (shouldOpenSubmenu) {
      const lastFocusedItem = this.childItems[this.focusedItemIndex];
      if (lastFocusedItem == null ? void 0 : lastFocusedItem.hasSubmenu) {
        lastFocusedItem.openOverlay();
      }
    } else if (shouldCloseSelfAsSubmenu && this.isSubmenu) {
      this.dispatchEvent(new Event("close", { bubbles: true }));
      this.updateSelectedItemIndex();
    }
  }
  handleKeydown(event) {
    if (event.defaultPrevented) {
      return;
    }
    const lastFocusedItem = this.childItems[this.focusedItemIndex];
    if (lastFocusedItem) {
      lastFocusedItem.focused = true;
    }
    const { key } = event;
    if (event.shiftKey && event.target !== this && this.hasAttribute("tabindex")) {
      this.removeAttribute("tabindex");
      const replaceTabindex = (event2) => {
        if (!event2.shiftKey && !this.hasAttribute("tabindex")) {
          this.tabIndex = 0;
          document.removeEventListener("keyup", replaceTabindex);
          this.removeEventListener("focusout", replaceTabindex);
        }
      };
      document.addEventListener("keyup", replaceTabindex);
      this.addEventListener("focusout", replaceTabindex);
    }
    if (key === "Tab") {
      this.prepareToCleanUp();
      return;
    }
    if (key === " ") {
      if (lastFocusedItem == null ? void 0 : lastFocusedItem.hasSubmenu) {
        lastFocusedItem.openOverlay();
        return;
      }
    }
    if (key === " " || key === "Enter") {
      const childItem = this.childItems[this.focusedItemIndex];
      if (childItem && childItem.menuData.selectionRoot === event.target) {
        event.preventDefault();
        childItem.click();
      }
      return;
    }
    if (key === "ArrowDown" || key === "ArrowUp") {
      const childItem = this.childItems[this.focusedItemIndex];
      if (childItem && childItem.menuData.selectionRoot === event.target) {
        this.navigateWithinMenu(event);
      }
      return;
    }
    this.navigateBetweenRelatedMenus(event);
  }
  focusMenuItemByOffset(offset) {
    const step = offset || 1;
    const focusedItem = this.childItems[this.focusedItemIndex];
    if (focusedItem) {
      focusedItem.focused = false;
      focusedItem.active = focusedItem.open;
    }
    this.focusedItemIndex = (this.childItems.length + this.focusedItemIndex + offset) % this.childItems.length;
    let itemToFocus = this.childItems[this.focusedItemIndex];
    let availableItems = this.childItems.length;
    while ((itemToFocus == null ? void 0 : itemToFocus.disabled) && availableItems) {
      availableItems -= 1;
      this.focusedItemIndex = (this.childItems.length + this.focusedItemIndex + step) % this.childItems.length;
      itemToFocus = this.childItems[this.focusedItemIndex];
    }
    if (!(itemToFocus == null ? void 0 : itemToFocus.disabled)) {
      this.forwardFocusVisibleToItem(itemToFocus);
    }
    return itemToFocus;
  }
  prepareToCleanUp() {
    document.addEventListener(
      "focusout",
      () => {
        requestAnimationFrame(() => {
          const focusedItem = this.childItems[this.focusedItemIndex];
          if (focusedItem) {
            focusedItem.focused = false;
            this.updateSelectedItemIndex();
          }
        });
      },
      { once: true }
    );
  }
  updateSelectedItemIndex() {
    let firstOrFirstSelectedIndex = 0;
    const selectedItemsMap = /* @__PURE__ */ new Map();
    const selected = [];
    const selectedItems = [];
    let itemIndex = this.childItems.length;
    while (itemIndex) {
      itemIndex -= 1;
      const childItem = this.childItems[itemIndex];
      if (childItem.menuData.selectionRoot === this) {
        if (childItem.selected || !this._hasUpdatedSelectedItemIndex && this.selected.includes(childItem.value)) {
          firstOrFirstSelectedIndex = itemIndex;
          selectedItemsMap.set(childItem, true);
          selected.unshift(childItem.value);
          selectedItems.unshift(childItem);
        }
        if (itemIndex !== firstOrFirstSelectedIndex) {
          childItem.focused = false;
        }
      }
    }
    selectedItems.map((item, i) => {
      if (i > 0) {
        item.focused = false;
      }
    });
    this.selectedItemsMap = selectedItemsMap;
    this._selected = selected;
    this.selectedItems = selectedItems;
    this.value = this.selected.join(this.valueSeparator);
    this.focusedItemIndex = firstOrFirstSelectedIndex;
    this.focusInItemIndex = firstOrFirstSelectedIndex;
  }
  handleItemsChanged() {
    this.cachedChildItems = void 0;
    if (!this._willUpdateItems) {
      this._willUpdateItems = true;
      this.cacheUpdated = this.updateCache();
    }
  }
  async updateCache() {
    if (!this.hasUpdated) {
      await Promise.all([
        new Promise((res) => requestAnimationFrame(() => res(true))),
        this.updateComplete
      ]);
    } else {
      await new Promise((res) => requestAnimationFrame(() => res(true)));
    }
    if (this.cachedChildItems === void 0) {
      this.updateSelectedItemIndex();
      this.updateItemFocus();
    }
    this._willUpdateItems = false;
  }
  updateItemFocus() {
    if (this.childItems.length == 0) {
      return;
    }
    const focusInItem = this.childItems[this.focusInItemIndex];
    if (this.getRootNode().activeElement === focusInItem.menuData.focusRoot) {
      this.forwardFocusVisibleToItem(focusInItem);
    }
  }
  closeDescendentOverlays() {
    this.descendentOverlays.forEach((overlay) => {
      overlay.open = false;
    });
    this.descendentOverlays = /* @__PURE__ */ new Map();
  }
  forwardFocusVisibleToItem(item) {
    if (!item || item.menuData.focusRoot !== this) {
      return;
    }
    this.closeDescendentOverlays();
    const focused = this.hasVisibleFocusInTree() || !!this.childItems.find((child) => {
      return child.hasVisibleFocusInTree();
    });
    item.focused = focused;
    this.setAttribute("aria-activedescendant", item.id);
    if (item.menuData.selectionRoot && item.menuData.selectionRoot !== this) {
      item.menuData.selectionRoot.focus();
    }
  }
  handleSlotchange({
    target
  }) {
    const assignedElements = target.assignedElements({
      flatten: true
    });
    if (this.childItems.length !== assignedElements.length) {
      assignedElements.forEach((item) => {
        if (typeof item.triggerUpdate !== "undefined") {
          item.triggerUpdate();
        } else if (typeof item.childItems !== "undefined") {
          item.childItems.forEach((child) => {
            child.triggerUpdate();
          });
        }
      });
    }
  }
  renderMenuItemSlot() {
    return html`
            <slot
                @sp-menu-submenu-opened=${this.handleDescendentOverlayOpened}
                @sp-menu-submenu-closed=${this.handleDescendentOverlayClosed}
                @slotchange=${this.handleSlotchange}
            ></slot>
        `;
  }
  render() {
    return this.renderMenuItemSlot();
  }
  firstUpdated(changed) {
    super.firstUpdated(changed);
    if (!this.hasAttribute("tabindex") && !this.ignore) {
      const role = this.getAttribute("role");
      if (role === "group") {
        this.tabIndex = -1;
      } else {
        this.tabIndex = 0;
      }
    }
    const updates = [
      new Promise((res) => requestAnimationFrame(() => res(true)))
    ];
    [...this.children].forEach((item) => {
      if (item.localName === "sp-menu-item") {
        updates.push(item.updateComplete);
      }
    });
    this.childItemsUpdated = Promise.all(updates);
  }
  updated(changes) {
    super.updated(changes);
    if (changes.has("selects") && this.hasUpdated) {
      this.selectsChanged();
    }
    if (changes.has("label") && (this.label || typeof changes.get("label") !== "undefined")) {
      if (this.label) {
        this.setAttribute("aria-label", this.label);
      } else {
        this.removeAttribute("aria-label");
      }
    }
  }
  selectsChanged() {
    const updates = [
      new Promise((res) => requestAnimationFrame(() => res(true)))
    ];
    this.childItemSet.forEach((childItem) => {
      updates.push(childItem.triggerUpdate());
    });
    this.childItemsUpdated = Promise.all(updates);
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role") && !this.ignore) {
      this.setAttribute("role", this.ownRole);
    }
    this.updateComplete.then(() => this.updateItemFocus());
  }
  disconnectedCallback() {
    this.cachedChildItems = void 0;
    this.selectedItems = [];
    this.selectedItemsMap.clear();
    this.childItemSet.clear();
    this.descendentOverlays = /* @__PURE__ */ new Map();
    super.disconnectedCallback();
  }
  async getUpdateComplete() {
    const complete = await super.getUpdateComplete();
    await this.childItemsUpdated;
    await this.cacheUpdated;
    return complete;
  }
}
__decorateClass([
  property({ type: String, reflect: true })
], Menu.prototype, "label", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], Menu.prototype, "ignore", 2);
__decorateClass([
  property({ type: String, reflect: true })
], Menu.prototype, "selects", 2);
__decorateClass([
  property({ type: String })
], Menu.prototype, "value", 2);
__decorateClass([
  property({ type: String, attribute: "value-separator" })
], Menu.prototype, "valueSeparator", 2);
__decorateClass([
  property({ attribute: false })
], Menu.prototype, "selected", 1);
__decorateClass([
  property({ attribute: false })
], Menu.prototype, "selectedItems", 2);
__decorateClass([
  query("slot:not([name])")
], Menu.prototype, "menuSlot", 2);
//# sourceMappingURL=Menu.dev.js.map
