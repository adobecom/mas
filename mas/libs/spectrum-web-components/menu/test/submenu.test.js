"use strict";
import "@spectrum-web-components/menu/sp-menu.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import {
  aTimeout,
  elementUpdated,
  expect,
  html,
  nextFrame,
  oneEvent
} from "@open-wc/testing";
import { fixture } from "../../../test/testing-helpers.js";
import { sendMouse } from "../../../test/plugins/browser.js";
import { spy } from "sinon";
import { sendKeys } from "@web/test-runner-commands";
import "@spectrum-web-components/action-menu/sp-action-menu.js";
import "@spectrum-web-components/menu/sp-menu-group.js";
import "@spectrum-web-components/overlay/sp-overlay.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-show-menu.js";
import { slottableRequest } from "@spectrum-web-components/overlay/src/slottable-request-directive.js";
const selectsWithKeyboardData = [
  {
    dir: "ltr",
    openKey: "ArrowRight",
    closeKey: "ArrowLeft"
  },
  {
    dir: "rtl",
    openKey: "ArrowLeft",
    closeKey: "ArrowRight"
  }
];
describe("Submenu", () => {
  function selectWithPointer() {
    it("with pointer", async function() {
      const rootItemBoundingRect = this.rootItem.getBoundingClientRect();
      expect(this.rootItem.open).to.be.false;
      const opened = oneEvent(this.rootItem, "sp-opened");
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await opened;
      expect(this.rootItem.open).to.be.true;
      const item2 = document.querySelector(".submenu-item-2");
      const item2BoundingRect = item2.getBoundingClientRect();
      const closed = oneEvent(this.rootItem, "sp-closed");
      await sendMouse({
        steps: [
          {
            type: "click",
            position: [
              item2BoundingRect.left + item2BoundingRect.width / 2,
              item2BoundingRect.top + item2BoundingRect.height / 2
            ]
          }
        ]
      });
      await closed;
      expect(
        this.submenuChanged.withArgs("Two").calledOnce,
        `submenu changed ${this.submenuChanged.callCount} times`
      ).to.be.true;
      expect(
        this.rootChanged.withArgs("Has submenu").calledOnce,
        "root changed"
      ).to.be.true;
    });
  }
  function selectsWithKeyboard(testData) {
    it(`with keyboard: ${testData.dir}`, async function() {
      var _a, _b;
      this.el.parentElement.dir = testData.dir;
      await elementUpdated(this.el);
      expect(this.rootItem.open).to.be.false;
      const input = document.createElement("input");
      this.el.insertAdjacentElement("beforebegin", input);
      input.focus();
      await sendKeys({
        press: "Tab"
      });
      await sendKeys({
        press: "ArrowDown"
      });
      await elementUpdated(this.rootItem);
      expect(this.rootItem.focused).to.be.true;
      let opened = oneEvent(this.rootItem, "sp-opened");
      await sendKeys({
        press: testData.openKey
      });
      await opened;
      let submenu = this.el.querySelector('[slot="submenu"]');
      let submenuItem = this.el.querySelector(
        ".submenu-item-2"
      );
      expect(this.rootItem.open).to.be.true;
      expect(
        submenu === document.activeElement,
        `${(_a = document.activeElement) == null ? void 0 : _a.id}`
      ).to.be.true;
      let closed = oneEvent(this.rootItem, "sp-closed");
      await sendKeys({
        press: testData.closeKey
      });
      await closed;
      expect(this.rootItem.open).to.be.false;
      expect(
        this.el === document.activeElement,
        `${(_b = document.activeElement) == null ? void 0 : _b.id}`
      ).to.be.true;
      opened = oneEvent(this.rootItem, "sp-opened");
      await sendKeys({
        press: testData.openKey
      });
      await opened;
      submenu = this.el.querySelector('[slot="submenu"]');
      submenuItem = this.el.querySelector(".submenu-item-2");
      expect(this.rootItem.open).to.be.true;
      await sendKeys({
        press: "ArrowDown"
      });
      await elementUpdated(submenu);
      await elementUpdated(submenuItem);
      expect(submenu.getAttribute("aria-activedescendant")).to.equal(
        submenuItem.id
      );
      closed = oneEvent(this.rootItem, "sp-closed");
      await sendKeys({
        press: "Enter"
      });
      await closed;
      expect(this.submenuChanged.calledWith("Two"), "submenu changed").to.be.true;
      expect(this.rootChanged.called, "root has changed").to.be.true;
      expect(
        this.rootChanged.calledWith("Has submenu"),
        "root specifically changed"
      ).to.be.true;
    });
  }
  function returnsFocusToRootWhenClosingSubmenu() {
    it("returns visible focus when submenu closed", async function() {
      var _a;
      const input = document.createElement("input");
      this.el.insertAdjacentElement("beforebegin", input);
      input.focus();
      await sendKeys({
        press: "Tab"
      });
      await elementUpdated(this.el);
      await nextFrame();
      await nextFrame();
      await sendKeys({
        press: "ArrowDown"
      });
      await elementUpdated(this.el);
      await nextFrame();
      await nextFrame();
      expect(this.rootItem.active, "not active").to.be.false;
      expect(
        this.rootItem.focused,
        `focused: ${(_a = document.activeElement) == null ? void 0 : _a.localName}`
      ).to.be.true;
      expect(this.rootItem.open, "not open").to.be.false;
      const opened = oneEvent(this.rootItem, "sp-opened");
      await sendKeys({
        press: "ArrowRight"
      });
      await opened;
      expect(this.rootItem.active).to.be.true;
      expect(this.rootItem.focused).to.be.false;
      expect(this.rootItem.open).to.be.true;
      await sendKeys({
        press: "ArrowDown"
      });
      expect(this.rootItem.active).to.be.true;
      expect(this.rootItem.focused).to.be.false;
      expect(this.rootItem.open).to.be.true;
      const closed = oneEvent(this.rootItem, "sp-closed");
      await sendKeys({
        press: "ArrowLeft"
      });
      await closed;
      expect(this.rootItem.active).to.be.false;
      expect(this.rootItem.focused).to.be.true;
      expect(this.rootItem.open).to.be.false;
    });
  }
  function closesOnPointerLeave() {
    it("closes on `pointerleave`", async function() {
      const rootItemBoundingRect = this.rootItem.getBoundingClientRect();
      expect(this.rootItem.open).to.be.false;
      const opened = oneEvent(this.rootItem, "sp-opened");
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await opened;
      expect(this.rootItem.open).to.be.true;
      const closed = oneEvent(this.rootItem, "sp-closed");
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height * 2
            ]
          }
        ]
      });
      await closed;
      expect(this.rootItem.open).to.be.false;
    });
  }
  function persistsThroughMouseLeaveAndReturn() {
    it("stays open when mousing off menu item and back again", async function() {
      const rootItemBoundingRect = this.rootItem.getBoundingClientRect();
      expect(this.rootItem.open).to.be.false;
      const opened = oneEvent(this.rootItem, "sp-opened");
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height * 2
            ]
          }
        ]
      });
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await opened;
      expect(this.rootItem.open).to.be.true;
      const closed = oneEvent(this.rootItem, "sp-closed");
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height * 2
            ]
          }
        ]
      });
      await closed;
    });
  }
  function doesNotOpenWhenDisabled() {
    it("does not open when disabled", async function() {
      this.rootItem.disabled = true;
      await elementUpdated(this.rootItem);
      const rootItemBoundingRect = this.rootItem.getBoundingClientRect();
      expect(this.rootItem.open).to.be.false;
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await new Promise((r) => setTimeout(r, 200));
      expect(this.rootItem.open).to.be.false;
    });
  }
  function persistsWhenMovingBetweenItemAndSubmenu() {
    it("stays open when mousing between menu item and submenu", async function() {
      const rootItemBoundingRect = this.rootItem.getBoundingClientRect();
      expect(this.rootItem.open).to.be.false;
      const opened = oneEvent(this.rootItem, "sp-opened");
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await opened;
      await nextFrame();
      await nextFrame();
      const subItem = this.el.querySelector(
        ".submenu-item-2"
      );
      const clickSpy = spy();
      subItem.addEventListener("click", () => clickSpy());
      const subItemBoundingRect = subItem.getBoundingClientRect();
      expect(this.rootItem.open).to.be.true;
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              subItemBoundingRect.left + subItemBoundingRect.width / 2,
              subItemBoundingRect.top + subItemBoundingRect.height / 2
            ]
          }
        ]
      });
      expect(this.rootItem.open).to.be.true;
      await aTimeout(150);
      expect(this.rootItem.open).to.be.true;
      const closed = oneEvent(this.rootItem, "sp-closed");
      await sendMouse({
        steps: [
          {
            type: "click",
            position: [
              subItemBoundingRect.left + subItemBoundingRect.width / 2,
              subItemBoundingRect.top + subItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await closed;
      expect(clickSpy.callCount).to.equal(1);
    });
  }
  function continuesToOpenWhenMovingBetweenItemAndSubmenu() {
    it("continues to open when mousing between menu item and submenu", async function() {
      const rootItemBoundingRect = this.rootItem.getBoundingClientRect();
      expect(this.rootItem.open).to.be.false;
      const opened = oneEvent(this.rootItem, "sp-opened");
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
              rootItemBoundingRect.top + rootItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await nextFrame();
      await nextFrame();
      await nextFrame();
      await nextFrame();
      await nextFrame();
      await nextFrame();
      await nextFrame();
      await nextFrame();
      const subItem = this.el.querySelector(
        ".submenu-item-2"
      );
      const clickSpy = spy();
      subItem.addEventListener("click", () => clickSpy());
      const subItemBoundingRect = subItem.getBoundingClientRect();
      await sendMouse({
        steps: [
          {
            type: "move",
            position: [
              subItemBoundingRect.left + subItemBoundingRect.width / 2,
              subItemBoundingRect.top + subItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await opened;
      expect(this.rootItem.open).to.be.true;
      await aTimeout(150);
      expect(this.rootItem.open).to.be.true;
      const closed = oneEvent(this.rootItem, "sp-closed");
      await sendMouse({
        steps: [
          {
            type: "click",
            position: [
              subItemBoundingRect.left + subItemBoundingRect.width / 2,
              subItemBoundingRect.top + subItemBoundingRect.height / 2
            ]
          }
        ]
      });
      await closed;
      expect(clickSpy.callCount).to.equal(1);
    });
  }
  const renderSubmenu = () => html`
        <sp-menu-item class="submenu-item-1">One</sp-menu-item>
        <sp-menu-item class="submenu-item-2">Two</sp-menu-item>
        <sp-menu-item class="submenu-item-3">Three</sp-menu-item>
    `;
  describe("static DOM", () => {
    beforeEach(async function() {
      this.rootChanged = spy();
      this.submenuChanged = spy();
      this.el = await fixture(html`
                <sp-menu
                    @change=${(event) => {
        this.rootChanged(event.target.value);
      }}
                >
                    <sp-menu-item>No submenu</sp-menu-item>
                    <sp-menu-item class="root">
                        Has submenu
                        <sp-menu
                            slot="submenu"
                            @change=${(event) => {
        this.submenuChanged(event.target.value);
      }}
                        >
                            ${renderSubmenu()}
                        </sp-menu>
                    </sp-menu-item>
                </sp-menu>
            `);
      await elementUpdated(this.el);
      this.rootItem = this.el.querySelector(".root");
      await elementUpdated(this.rootItem);
    });
    describe.skip("selects", () => {
      selectWithPointer();
      selectsWithKeyboardData.map((testData) => {
        selectsWithKeyboard(testData);
      });
    });
    closesOnPointerLeave();
    returnsFocusToRootWhenClosingSubmenu();
    persistsThroughMouseLeaveAndReturn();
    doesNotOpenWhenDisabled();
    persistsWhenMovingBetweenItemAndSubmenu();
    continuesToOpenWhenMovingBetweenItemAndSubmenu();
  });
  describe("directive", () => {
    beforeEach(async function() {
      this.rootChanged = spy();
      this.submenuChanged = spy();
      this.el = await fixture(html`
                <sp-menu
                    @change=${(event) => {
        this.rootChanged(event.target.value);
      }}
                >
                    <sp-menu-item>No submenu</sp-menu-item>
                    <sp-menu-item class="root">
                        Has submenu
                        <sp-menu
                            slot="submenu"
                            @change=${(event) => {
        this.submenuChanged(event.target.value);
      }}
                            ${slottableRequest(renderSubmenu)}
                        ></sp-menu>
                    </sp-menu-item>
                </sp-menu>
            `);
      await elementUpdated(this.el);
      this.rootItem = this.el.querySelector(".root");
      await elementUpdated(this.rootItem);
    });
    describe("selects", () => {
      selectWithPointer();
      selectsWithKeyboardData.map((testData) => {
        selectsWithKeyboard(testData);
      });
    });
    closesOnPointerLeave();
    returnsFocusToRootWhenClosingSubmenu();
    persistsThroughMouseLeaveAndReturn();
    doesNotOpenWhenDisabled();
    persistsWhenMovingBetweenItemAndSubmenu();
    continuesToOpenWhenMovingBetweenItemAndSubmenu();
  });
  it("closes deep tree on selection", async function() {
    const rootChanged = spy();
    const submenuChanged = spy();
    const subSubmenuChanged = spy();
    const el = await fixture(
      html`
                <sp-menu
                    @change=${(event) => {
        rootChanged(event.target.value);
      }}
                >
                    <sp-menu-item class="root">
                        Has submenu
                        <sp-menu
                            slot="submenu"
                            @change=${(event) => {
        submenuChanged(event.target.value);
      }}
                        >
                            <sp-menu-item class="submenu-item-1">
                                One
                            </sp-menu-item>
                            <sp-menu-item class="submenu-item-2">
                                Two
                                <sp-menu
                                    slot="submenu"
                                    @change=${(event) => {
        subSubmenuChanged(event.target.value);
      }}
                                >
                                    <sp-menu-item class="sub-submenu-item-1">
                                        A
                                    </sp-menu-item>
                                    <sp-menu-item class="sub-submenu-item-2">
                                        B
                                    </sp-menu-item>
                                    <sp-menu-item class="sub-submenu-item-3">
                                        C
                                    </sp-menu-item>
                                </sp-menu>
                            </sp-menu-item>
                            <sp-menu-item class="submenu-item-3">
                                Three
                            </sp-menu-item>
                        </sp-menu>
                    </sp-menu-item>
                </sp-menu>
            `
    );
    const rootItem = el.querySelector(".root");
    const rootItemBoundingRect = rootItem.getBoundingClientRect();
    const item2 = document.querySelector(".submenu-item-2");
    const itemC = document.querySelector(".sub-submenu-item-3");
    expect(rootItem.open).to.be.false;
    let opened = oneEvent(rootItem, "sp-opened");
    await sendMouse({
      steps: [
        {
          type: "move",
          position: [
            rootItemBoundingRect.left + rootItemBoundingRect.width / 2,
            rootItemBoundingRect.top + rootItemBoundingRect.height / 2
          ]
        }
      ]
    });
    await opened;
    expect(rootItem.open).to.be.true;
    const item2BoundingRect = item2.getBoundingClientRect();
    opened = oneEvent(item2, "sp-opened");
    await sendMouse({
      steps: [
        {
          type: "move",
          position: [
            item2BoundingRect.left + item2BoundingRect.width / 2,
            item2BoundingRect.top + item2BoundingRect.height / 2
          ]
        }
      ]
    });
    await opened;
    expect(item2.open).to.be.true;
    const closed = oneEvent(rootItem, "sp-closed");
    const itemCBoundingRect = itemC.getBoundingClientRect();
    await sendMouse({
      steps: [
        {
          type: "click",
          position: [
            itemCBoundingRect.left + itemCBoundingRect.width / 2,
            itemCBoundingRect.top + itemCBoundingRect.height / 2
          ]
        }
      ]
    });
    await closed;
    expect(rootChanged.calledWith("Has submenu"), "root changed").to.be.true;
    expect(submenuChanged.calledWith("Two"), "submenu changed").to.be.true;
    expect(subSubmenuChanged.calledWith("C"), "sub submenu changed").to.be.true;
  });
  it("closes all decendent submenus when closing a ancestor menu", async () => {
    const el = await fixture(html`
            <sp-action-menu label="Closing ancestors will close submenus">
                <sp-icon-show-menu slot="icon"></sp-icon-show-menu>
                <sp-menu-group role="none" id="group">
                    <span slot="header">New York</span>
                    <sp-menu-item>Bronx</sp-menu-item>
                    <sp-menu-item id="submenu-item-1">
                        Brooklyn
                        <sp-menu slot="submenu" id="submenu-1">
                            <sp-menu-item id="submenu-item-2">
                                Ft. Greene
                                <sp-menu slot="submenu" id="submenu-2">
                                    <sp-menu-item>S. Oxford St</sp-menu-item>
                                    <sp-menu-item>S. Portland Ave</sp-menu-item>
                                    <sp-menu-item>S. Elliot Pl</sp-menu-item>
                                </sp-menu>
                            </sp-menu-item>
                            <sp-menu-item disabled>Park Slope</sp-menu-item>
                            <sp-menu-item>Williamsburg</sp-menu-item>
                        </sp-menu>
                    </sp-menu-item>
                    <sp-menu-item id="submenu-item-3">
                        Manhattan
                        <sp-menu slot="submenu" id="submenu-3">
                            <sp-menu-item disabled>SoHo</sp-menu-item>
                            <sp-menu-item>
                                Union Square
                                <sp-menu slot="submenu">
                                    <sp-menu-item>14th St</sp-menu-item>
                                    <sp-menu-item>Broadway</sp-menu-item>
                                    <sp-menu-item>Park Ave</sp-menu-item>
                                </sp-menu>
                            </sp-menu-item>
                            <sp-menu-item>Upper East Side</sp-menu-item>
                        </sp-menu>
                    </sp-menu-item>
                </sp-menu-group>
            </sp-action-menu>
        `);
    const rootMenu1 = el.querySelector("#submenu-item-1");
    const rootMenu2 = el.querySelector("#submenu-item-3");
    const childMenu2 = el.querySelector("#submenu-item-2");
    expect(el.open).to.be.false;
    let opened = oneEvent(el, "sp-opened");
    el.click();
    await opened;
    expect(el.open).to.be.true;
    opened = oneEvent(rootMenu1, "sp-opened");
    rootMenu1.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true })
    );
    await opened;
    expect(rootMenu1.open).to.be.true;
    opened = oneEvent(childMenu2, "sp-opened");
    childMenu2.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true })
    );
    await opened;
    expect(childMenu2.open).to.be.true;
    const childMenu2Closed = oneEvent(childMenu2, "sp-closed");
    const rootMenu1Closed = oneEvent(rootMenu1, "sp-closed");
    const rootMenu2Opened = oneEvent(rootMenu2, "sp-opened");
    rootMenu2.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true })
    );
    await childMenu2Closed;
    await rootMenu1Closed;
    await rootMenu2Opened;
  });
  describe("deep tree", () => {
    beforeEach(async function() {
      this.el = await fixture(html`
                <sp-action-menu label="Deep submenu tree">
                    <sp-icon-show-menu slot="icon"></sp-icon-show-menu>
                    <sp-menu-group role="none">
                        <span slot="header">New York</span>
                        <sp-menu-item id="no-submenu">Bronx</sp-menu-item>
                        <sp-menu-item id="submenu-item-1">
                            Brooklyn
                            <sp-menu slot="submenu">
                                <sp-menu-item id="submenu-item-2">
                                    Ft. Greene
                                    <sp-menu slot="submenu">
                                        <sp-menu-item>
                                            S. Oxford St
                                        </sp-menu-item>
                                        <sp-menu-item>
                                            S. Portland Ave
                                        </sp-menu-item>
                                        <sp-menu-item>
                                            S. Elliot Pl
                                        </sp-menu-item>
                                    </sp-menu>
                                </sp-menu-item>
                                <sp-menu-item disabled>Park Slope</sp-menu-item>
                                <sp-menu-item id="ancestor-item">
                                    Williamsburg
                                </sp-menu-item>
                            </sp-menu>
                        </sp-menu-item>
                        <sp-menu-item id="submenu-item-3">
                            Manhattan
                            <sp-menu slot="submenu">
                                <sp-menu-item disabled>SoHo</sp-menu-item>
                                <sp-menu-item>
                                    Union Square
                                    <sp-menu slot="submenu">
                                        <sp-menu-item>14th St</sp-menu-item>
                                        <sp-menu-item>Broadway</sp-menu-item>
                                        <sp-menu-item>Park Ave</sp-menu-item>
                                    </sp-menu>
                                </sp-menu-item>
                                <sp-menu-item>Upper East Side</sp-menu-item>
                            </sp-menu>
                        </sp-menu-item>
                    </sp-menu-group>
                </sp-action-menu>
            `);
      await nextFrame();
      await nextFrame();
    });
    it("closes back to the first overlay without a `root` when clicking away", async function() {
      const rootMenu1 = this.el.querySelector("#submenu-item-1");
      const childMenu2 = this.el.querySelector("#submenu-item-2");
      expect(this.el.open).to.be.false;
      let opened = oneEvent(this.el, "sp-opened");
      this.el.click();
      await opened;
      expect(this.el.open).to.be.true;
      opened = oneEvent(rootMenu1, "sp-opened");
      rootMenu1.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true })
      );
      await opened;
      opened = oneEvent(childMenu2, "sp-opened");
      childMenu2.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true })
      );
      await opened;
      const closed = Promise.all([
        oneEvent(childMenu2, "sp-closed"),
        oneEvent(rootMenu1, "sp-closed"),
        oneEvent(this.el, "sp-closed")
      ]);
      await sendMouse({
        steps: [
          {
            type: "click",
            position: [600, 5]
          }
        ]
      });
      await closed;
    });
    it("closes decendent menus when Menu Item in ancestor without a submenu is pointerentered", async function() {
      const rootMenu = this.el.querySelector(
        "#submenu-item-1"
      );
      const noSubmenu = this.el.querySelector("#no-submenu");
      expect(this.el.open).to.be.false;
      let opened = oneEvent(this.el, "sp-opened");
      this.el.click();
      await opened;
      expect(this.el.open).to.be.true;
      opened = oneEvent(rootMenu, "sp-opened");
      rootMenu.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true })
      );
      await opened;
      const closed = oneEvent(rootMenu, "sp-closed");
      noSubmenu.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true })
      );
      await closed;
    });
    it("closes decendent menus when Menu Item in ancestor is clicked", async function() {
      const rootMenu1 = this.el.querySelector(
        "#submenu-item-1"
      );
      const childMenu2 = this.el.querySelector(
        "#submenu-item-2"
      );
      const ancestorItem = this.el.querySelector(
        "#ancestor-item"
      );
      expect(this.el.open).to.be.false;
      let opened = oneEvent(this.el, "sp-opened");
      this.el.click();
      await opened;
      expect(this.el.open).to.be.true;
      opened = oneEvent(rootMenu1, "sp-opened");
      rootMenu1.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true })
      );
      await opened;
      opened = oneEvent(childMenu2, "sp-opened");
      childMenu2.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true })
      );
      await opened;
      const closed = Promise.all([
        oneEvent(childMenu2, "sp-closed"),
        oneEvent(rootMenu1, "sp-closed"),
        oneEvent(this.el, "sp-closed")
      ]);
      const rect = ancestorItem.getBoundingClientRect();
      await sendMouse({
        steps: [
          {
            type: "click",
            position: [
              rect.left + rect.width / 2,
              rect.top + rect.height / 2
            ]
          }
        ]
      });
      await closed;
    });
  });
  it('cleans up submenus that close before they are "open"', async () => {
    if ("showPopover" in document.createElement("div")) {
      return;
    }
    await sendMouse({
      steps: [
        {
          type: "move",
          position: [1, 1]
        }
      ]
    });
    const el = await fixture(
      html`
                <sp-menu>
                    <sp-menu-item class="root-1">
                        Has submenu
                        <sp-menu slot="submenu">${renderSubmenu()}</sp-menu>
                    </sp-menu-item>
                    <sp-menu-item class="root-2">
                        Has submenu
                        <sp-menu slot="submenu">${renderSubmenu()}</sp-menu>
                    </sp-menu-item>
                </sp-menu>
            `
    );
    await elementUpdated(el);
    const rootItem1 = el.querySelector(".root-1");
    const rootItem2 = el.querySelector(".root-2");
    expect(rootItem1.open, "initially closed 1").to.be.false;
    expect(rootItem2.open, "initially closed 2").to.be.false;
    const rootItemBoundingRect1 = rootItem1.getBoundingClientRect();
    const rootItemBoundingRect2 = rootItem2.getBoundingClientRect();
    await sendMouse({
      steps: [
        {
          type: "move",
          position: [
            rootItemBoundingRect1.left + rootItemBoundingRect1.width / 2,
            rootItemBoundingRect1.top + rootItemBoundingRect1.height / 2
          ]
        }
      ]
    });
    await sendMouse({
      steps: [
        {
          type: "move",
          position: [
            rootItemBoundingRect2.left + rootItemBoundingRect2.width / 2,
            rootItemBoundingRect2.top + rootItemBoundingRect2.height / 2
          ]
        }
      ]
    });
    await sendMouse({
      steps: [
        {
          type: "move",
          position: [
            rootItemBoundingRect1.left + rootItemBoundingRect1.width / 2,
            rootItemBoundingRect1.top + rootItemBoundingRect1.height / 2
          ]
        }
      ]
    });
    await sendMouse({
      steps: [
        {
          type: "move",
          position: [
            rootItemBoundingRect2.left + rootItemBoundingRect2.width / 2,
            rootItemBoundingRect2.top + rootItemBoundingRect2.height / 2
          ]
        }
      ]
    });
    await nextFrame();
    await nextFrame();
    await nextFrame();
    await nextFrame();
    await nextFrame();
    await nextFrame();
    const closed = oneEvent(rootItem2, "sp-closed");
    await sendMouse({
      steps: [
        {
          type: "move",
          position: [
            rootItemBoundingRect2.left + rootItemBoundingRect2.width / 2,
            rootItemBoundingRect2.top + rootItemBoundingRect2.height * 2
          ]
        }
      ]
    });
    await closed;
    expect(rootItem1.open, "finally closed 1").to.be.false;
    expect(rootItem2.open, "finally closed 2").to.be.false;
  });
});
//# sourceMappingURL=submenu.test.js.map
