"use strict";
import "@spectrum-web-components/menu/sp-menu.js";
import "@spectrum-web-components/menu/sp-menu-divider.js";
import "@spectrum-web-components/menu/sp-menu-group.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import {
  aTimeout,
  elementUpdated,
  expect,
  html,
  nextFrame,
  waitUntil
} from "@open-wc/testing";
import {
  arrowDownEvent,
  arrowUpEvent,
  fixture,
  tabEvent,
  testForLitDevWarnings,
  tEvent
} from "../../../test/testing-helpers.js";
import { sendMouse } from "../../../test/plugins/browser.js";
import { spy } from "sinon";
import { sendKeys } from "@web/test-runner-commands";
import { isWebKit } from "@spectrum-web-components/shared";
describe("Menu", () => {
  it("renders empty", async () => {
    const el = await fixture(html`
            <sp-menu tabindex="0"><a href="#anchor">Test</a></sp-menu>
        `);
    const anchor = el.querySelector("a");
    await elementUpdated(el);
    expect(document.activeElement === el, "self not focused, 1").to.be.false;
    expect(document.activeElement === anchor, "child not focused, 1").to.be.false;
    expect(el.getAttribute("role")).to.equal("menu");
    el.focus();
    await elementUpdated(el);
    expect(document.activeElement === el, "self not focused, 2").to.be.false;
    expect(document.activeElement === anchor, "child not focused, 2").to.be.false;
    anchor.focus();
    expect(document.activeElement === el, "self not focused, 3").to.be.false;
    expect(document.activeElement === anchor, "anchor").to.be.true;
  });
  it("renders w/ [disabled] menu items", async () => {
    const focusinSpy = spy();
    const el = await fixture(html`
            <sp-menu tabindex="0" @focusin=${() => focusinSpy()}>
                <sp-menu-item disabled>Disabled item</sp-menu-item>
            </sp-menu>
        `);
    await elementUpdated(el);
    expect(document.activeElement === el, "self not focused, 1").to.be.false;
    el.focus();
    await elementUpdated(el);
    expect(document.activeElement === el, "self not focused, 2").to.be.false;
    expect(focusinSpy.callCount).to.equal(0);
  });
  it("renders w/ all [disabled] menu items", async () => {
    const focusinSpy = spy();
    const el = await fixture(html`
            <sp-menu tabindex="0" @focusin=${() => focusinSpy()}>
                <sp-menu-item disabled>Disabled item 1</sp-menu-item>
                <sp-menu-item disabled>Disabled item 2</sp-menu-item>
            </sp-menu>
        `);
    const firstItem = el.querySelector("sp-menu-item");
    await elementUpdated(el);
    expect(document.activeElement === el, "self not focused, 1").to.be.false;
    el.focus();
    await elementUpdated(el);
    expect(document.activeElement === el, "self not focused, 2").to.be.false;
    expect(focusinSpy.callCount).to.equal(0);
    firstItem.focus();
    await elementUpdated(el);
    expect(document.activeElement === el, "self not focused, 2").to.be.false;
    expect(focusinSpy.callCount).to.equal(0);
    expect(el.matches(":focus-within")).to.be.false;
  });
  it("renders w/ menu items", async () => {
    const el = await fixture(html`
            <sp-menu label="Pick an action:">
                <sp-menu-item>Deselect</sp-menu-item>
                <sp-menu-item>Select Inverse</sp-menu-item>
                <sp-menu-item>Feather...</sp-menu-item>
                <sp-menu-item>Select and Mask...</sp-menu-item>
                <sp-menu-divider></sp-menu-divider>
                <sp-menu-item>Save Selection</sp-menu-item>
                <sp-menu-item disabled>Make Work Path</sp-menu-item>
            </sp-menu>
        `);
    await waitUntil(
      () => el.childItems.length == 6,
      "expected menu to manage 6 menu items"
    );
    await elementUpdated(el);
    const inTabindexElement = el.querySelector(
      '[tabindex]:not([tabindex="-1"])'
    );
    expect(inTabindexElement).to.be.null;
    await expect(el).to.be.accessible();
  });
  testForLitDevWarnings(
    async () => await fixture(html`
                <sp-menu selects="single">
                    <sp-menu-item>Not Selected</sp-menu-item>
                    <sp-menu-item selected>Selected</sp-menu-item>
                    <sp-menu-item>Other</sp-menu-item>
                </sp-menu>
            `)
  );
  it("renders w/ selected", async () => {
    const el = await fixture(html`
            <sp-menu selects="single">
                <sp-menu-item>Not Selected</sp-menu-item>
                <sp-menu-item selected>Selected</sp-menu-item>
                <sp-menu-item>Other</sp-menu-item>
            </sp-menu>
        `);
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });
  it('has a "value" that can be copied during "change" events', async function() {
    if (isWebKit()) {
      this.skip();
    }
    const el = await fixture(html`
            <sp-menu
                selects="single"
                @change=${({
      target: { value }
    }) => {
      navigator.clipboard.writeText(value);
    }}
            >
                <sp-menu-item>Not Selected</sp-menu-item>
                <sp-menu-item selected>Selected</sp-menu-item>
                <sp-menu-item id="other">Other</sp-menu-item>
            </sp-menu>
        `);
    await elementUpdated(el);
    const otherItem = el.querySelector("#other");
    otherItem.focus();
    await elementUpdated(el);
    await sendKeys({
      press: "ArrowDown"
    });
    await elementUpdated(el);
    await sendKeys({
      press: "Enter"
    });
    await elementUpdated(el);
    const clipboardText = await navigator.clipboard.readText();
    expect(clipboardText).to.equal("Other");
  });
  it("accepts Numpad keys", async function() {
    if (isWebKit()) {
      this.skip();
    }
    const el = await fixture(html`
            <sp-menu
                selects="single"
                @change=${({
      target: { value }
    }) => {
      navigator.clipboard.writeText(value);
    }}
            >
                <sp-menu-item>Not Selected</sp-menu-item>
                <sp-menu-item selected>Selected</sp-menu-item>
                <sp-menu-item id="other">Other</sp-menu-item>
            </sp-menu>
        `);
    await elementUpdated(el);
    const otherItem = el.querySelector("#other");
    otherItem.focus();
    await elementUpdated(el);
    await sendKeys({
      press: "ArrowDown"
    });
    await elementUpdated(el);
    await sendKeys({
      press: "NumpadEnter"
    });
    await elementUpdated(el);
    const clipboardText = await navigator.clipboard.readText();
    expect(clipboardText).to.equal("Other");
  });
  it("renders w/ hrefs", async () => {
    const el = await fixture(html`
            <sp-menu>
                <sp-menu-item href="not-selected.html">
                    Not Selected
                </sp-menu-item>
                <sp-menu-item href="selected.html">Selected</sp-menu-item>
                <sp-menu-item href="other.html">Other</sp-menu-item>
            </sp-menu>
        `);
    await waitUntil(
      () => el.childItems.length == 3,
      "expected menu to manage 3 items"
    );
    await elementUpdated(el);
    await expect(el).to.be.accessible();
    expect(el.getAttribute("role")).to.equal("menu");
  });
  it("handle focus and keyboard input", async () => {
    const el = await fixture(html`
            <sp-menu>
                <sp-menu-item>Deselect</sp-menu-item>
                <sp-menu-item>Select Inverse</sp-menu-item>
                <sp-menu-item>Feather...</sp-menu-item>
                <sp-menu-item>Select and Mask...</sp-menu-item>
                <sp-menu-divider></sp-menu-divider>
                <sp-menu-item>Save Selection</sp-menu-item>
                <sp-menu-item disabled>Make Work Path</sp-menu-item>
            </sp-menu>
        `);
    await waitUntil(
      () => el.childItems.length == 6,
      "expected menu to manage 6 items"
    );
    await elementUpdated(el);
    const firstItem = el.querySelector(
      "sp-menu-item:nth-of-type(1)"
    );
    const thirdToLastItem = el.querySelector(
      "sp-menu-item:nth-last-of-type(3)"
    );
    const secondToLastItem = el.querySelector(
      "sp-menu-item:nth-last-of-type(2)"
    );
    el.focus();
    await elementUpdated(el);
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "ArrowUp" });
    expect(document.activeElement === el).to.be.true;
    expect(firstItem.focused).to.be.true;
    el.dispatchEvent(arrowUpEvent());
    el.dispatchEvent(arrowUpEvent());
    el.dispatchEvent(tEvent());
    expect(document.activeElement === el).to.be.true;
    expect(thirdToLastItem.focused).to.be.true;
    el.dispatchEvent(arrowDownEvent());
    expect(document.activeElement === el).to.be.true;
    expect(secondToLastItem.focused).to.be.true;
  });
  it("handle focus and late descendent additions", async () => {
    const el = await fixture(html`
            <sp-menu>
                <sp-menu-group selects="inherit">
                    <span slot="header">Options</span>
                    <sp-menu-item>Deselect</sp-menu-item>
                </sp-menu-group>
            </sp-menu>
        `);
    await waitUntil(
      () => el.childItems.length == 1,
      "expected menu to manage 1 item"
    );
    await elementUpdated(el);
    const firstItem = el.querySelector(
      "sp-menu-item:nth-of-type(1)"
    );
    el.focus();
    await elementUpdated(el);
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "ArrowUp" });
    expect(document.activeElement === el, "active element").to.be.true;
    expect(firstItem.focused, "visually focused").to.be.true;
    el.blur();
    const group = el.querySelector("sp-menu-group");
    const prependedItem = document.createElement("sp-menu-item");
    prependedItem.textContent = "Prepended Item";
    const appendedItem = document.createElement("sp-menu-item");
    appendedItem.textContent = "Appended Item";
    group.prepend(prependedItem);
    group.append(appendedItem);
    await elementUpdated(el);
    await waitUntil(() => {
      return el.childItems.length == 3;
    }, "expected menu to manage 3 items");
    await elementUpdated(el);
    expect(document.activeElement === el).to.be.false;
    expect(firstItem.focused).to.be.false;
    expect(prependedItem.focused).to.be.false;
    el.focus();
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "ArrowUp" });
    expect(document.activeElement === el, "another active element").to.be.true;
    expect(prependedItem.focused, "another visibly focused").to.be.true;
    el.dispatchEvent(arrowUpEvent());
    expect(document.activeElement === el, "last active element").to.be.true;
    expect(appendedItem.focused, "last visibly focused").to.be.true;
  });
  it("cleans up when tabbing away", async () => {
    const el = await fixture(html`
            <sp-menu tabindex="0">
                <sp-menu-item>Deselect</sp-menu-item>
                <sp-menu-item>Select Inverse</sp-menu-item>
                <sp-menu-item>Third Item</sp-menu-item>
            </sp-menu>
        `);
    await waitUntil(
      () => el.childItems.length == 3,
      "expected menu to manage 3 items"
    );
    await elementUpdated(el);
    const firstItem = el.querySelector(
      "sp-menu-item:nth-of-type(1)"
    );
    const secondItem = el.querySelector(
      "sp-menu-item:nth-of-type(2)"
    );
    const thirdItem = el.querySelector(
      "sp-menu-item:nth-of-type(3)"
    );
    el.focus();
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "ArrowUp" });
    expect(document.activeElement === el).to.be.true;
    expect(firstItem.focused, "first").to.be.true;
    el.dispatchEvent(arrowDownEvent());
    el.dispatchEvent(arrowDownEvent());
    expect(thirdItem.focused, "third").to.be.true;
    el.dispatchEvent(tabEvent());
    el.dispatchEvent(
      new CustomEvent("focusout", {
        composed: true,
        bubbles: true
      })
    );
    await nextFrame();
    el.startListeningToKeyboard();
    el.dispatchEvent(arrowDownEvent());
    expect(secondItem.focused, "second").to.be.true;
  });
  it("handles focus across focused MenuItem removals", async () => {
    const el = await fixture(html`
            <sp-menu id="test">
                <sp-menu-item class="first">Deselect</sp-menu-item>
                <sp-menu-item>Invert Selection</sp-menu-item>
                <sp-menu-item>Feather...</sp-menu-item>
                <sp-menu-item>Select and Mask...</sp-menu-item>
                <sp-menu-item selected class="selected">
                    Save Selection
                </sp-menu-item>
            </sp-menu>
        `);
    const firstItem = el.querySelector(".first");
    const selectedItem = el.querySelector(".selected");
    await elementUpdated(el);
    await nextFrame();
    el.focus();
    expect(document.activeElement).to.equal(el);
    await sendKeys({
      press: "ArrowUp"
    });
    await sendKeys({
      press: "ArrowDown"
    });
    expect(selectedItem.focused).to.be.true;
    selectedItem.remove();
    await elementUpdated(el);
    expect(document.activeElement).to.equal(el);
    expect(firstItem.focused).to.be.true;
  });
  it("handles single selection", async () => {
    const el = await fixture(html`
            <sp-menu selects="single">
                <sp-menu-item selected>First</sp-menu-item>
                <sp-menu-item>Second</sp-menu-item>
                <sp-menu-item>Third</sp-menu-item>
            </sp-menu>
        `);
    await waitUntil(
      () => el.childItems.length == 3,
      "expected menu to manage 3 items"
    );
    await waitUntil(
      () => el.selectedItems.length == 1,
      "expected menu to have 1 selected item"
    );
    await elementUpdated(el);
    const firstItem = el.querySelector(
      "sp-menu-item:nth-of-type(1)"
    );
    const secondItem = el.querySelector(
      "sp-menu-item:nth-of-type(2)"
    );
    expect(firstItem.getAttribute("role")).to.equal("menuitemradio");
    expect(secondItem.getAttribute("role")).to.equal("menuitemradio");
    expect(firstItem.selected).to.be.true;
    expect(secondItem.selected).to.be.false;
    expect(firstItem.getAttribute("aria-checked")).to.equal("true");
    expect(secondItem.getAttribute("aria-checked")).to.equal("false");
    expect(el.value).to.equal("First");
    secondItem.click();
    await elementUpdated(el);
    await elementUpdated(firstItem);
    await elementUpdated(secondItem);
    expect(firstItem.selected).to.be.false;
    expect(secondItem.selected).to.be.true;
    expect(firstItem.getAttribute("aria-checked")).to.equal("false");
    expect(secondItem.getAttribute("aria-checked")).to.equal("true");
    expect(el.value).to.equal("Second");
  });
  it("does not make a selection on a right/middle mouse click", async () => {
    const changeSpy = spy();
    const el = await fixture(html`
            <sp-menu
                selects="single"
                @change=${() => {
      changeSpy();
    }}
            >
                <sp-menu-item>First</sp-menu-item>
                <sp-menu-item>Second</sp-menu-item>
                <sp-menu-item>Third</sp-menu-item>
            </sp-menu>
        `);
    await waitUntil(
      () => el.childItems.length == 3,
      "expected menu to manage 3 items"
    );
    await elementUpdated(el);
    const secondItem = el.querySelector(
      "sp-menu-item:nth-of-type(2)"
    );
    const rect = secondItem.getBoundingClientRect();
    sendMouse({
      steps: [
        {
          position: [
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          ],
          type: "click",
          options: {
            button: "right"
          }
        }
      ]
    });
    await elementUpdated(el);
    await elementUpdated(secondItem);
    await aTimeout(150);
    expect(changeSpy.callCount, "no change").to.equal(0);
    sendMouse({
      steps: [
        {
          position: [
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          ],
          type: "click",
          options: {
            button: "middle"
          }
        }
      ]
    });
    await elementUpdated(el);
    await elementUpdated(secondItem);
    await aTimeout(150);
    expect(changeSpy.callCount, "no change").to.equal(0);
  });
  it("handles multiple selection", async () => {
    const changeSpy = spy();
    const el = await fixture(html`
            <sp-menu selects="multiple" @change=${() => changeSpy()}>
                <sp-menu-item selected>First</sp-menu-item>
                <sp-menu-item>Second</sp-menu-item>
                <sp-menu-item>Third</sp-menu-item>
            </sp-menu>
        `);
    await waitUntil(
      () => el.childItems.length == 3,
      "expected menu to manage 3 items"
    );
    await elementUpdated(el);
    const firstItem = el.querySelector(
      "sp-menu-item:nth-of-type(1)"
    );
    const secondItem = el.querySelector(
      "sp-menu-item:nth-of-type(2)"
    );
    expect(firstItem.getAttribute("role")).to.equal("menuitemcheckbox");
    expect(secondItem.getAttribute("role")).to.equal("menuitemcheckbox");
    expect(firstItem.selected).to.be.true;
    expect(secondItem.selected).to.be.false;
    expect(firstItem.getAttribute("aria-checked")).to.equal("true");
    expect(secondItem.getAttribute("aria-checked")).to.equal("false");
    expect(el.value).to.equal("First");
    expect(el.selectedItems.length).to.equal(1);
    secondItem.click();
    await elementUpdated(el);
    await elementUpdated(firstItem);
    await elementUpdated(secondItem);
    expect(changeSpy.callCount, "one change").to.equal(1);
    expect(firstItem.selected).to.be.true;
    expect(secondItem.selected).to.be.true;
    expect(firstItem.getAttribute("aria-checked")).to.equal("true");
    expect(secondItem.getAttribute("aria-checked")).to.equal("true");
    expect(el.value).to.equal("First,Second");
    expect(el.selectedItems.length).to.equal(2);
    firstItem.click();
    await elementUpdated(el);
    await elementUpdated(firstItem);
    await elementUpdated(secondItem);
    expect(changeSpy.callCount, "two changes").to.equal(2);
    expect(firstItem.selected).to.be.false;
    expect(secondItem.selected).to.be.true;
    expect(firstItem.getAttribute("aria-checked")).to.equal("false");
    expect(secondItem.getAttribute("aria-checked")).to.equal("true");
    expect(el.value).to.equal("Second");
    expect(el.selectedItems.length).to.equal(1);
  });
  it("can be controlled to manage a single togglable selection", async () => {
    const toggleSingleSelected = (event) => {
      event.preventDefault();
      const selected = [];
      if (event.target.selected.length) {
        selected.push(event.target.selected.at(-1));
      }
      event.target.updateComplete.then(() => {
        event.target.selected = selected;
      });
    };
    const el = await fixture(html`
            <sp-menu selects="multiple" @change=${toggleSingleSelected}>
                <sp-menu-item value="1">First</sp-menu-item>
                <sp-menu-item value="2">Second</sp-menu-item>
                <sp-menu-item value="3">Third</sp-menu-item>
            </sp-menu>
        `);
    await nextFrame();
    await nextFrame();
    expect(el.selected).to.deep.equal([]);
    const items = [...el.children];
    await Promise.all(items.map((child) => child.updateComplete));
    items[0].click();
    await nextFrame();
    await nextFrame();
    expect(el.selected).to.deep.equal(["1"]);
    items[0].click();
    await nextFrame();
    await nextFrame();
    expect(el.selected).to.deep.equal([]);
    items[1].click();
    await nextFrame();
    await nextFrame();
    expect(el.selected).to.deep.equal(["2"]);
    items[2].click();
    await nextFrame();
    await nextFrame();
    expect(el.selected).to.deep.equal(["3"]);
  });
});
//# sourceMappingURL=menu.test.js.map
