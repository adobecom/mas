"use strict";
import "@spectrum-web-components/picker/sync/sp-picker.js";
import "@spectrum-web-components/field-label/sp-field-label.js";
import {
  elementUpdated,
  expect,
  fixture,
  html,
  nextFrame,
  oneEvent
} from "@open-wc/testing";
import { setViewport } from "@web/test-runner-commands";
import { sendMouse } from "../../../test/plugins/browser.js";
describe("Picker, responsive", () => {
  let el;
  const pickerFixture = async () => {
    const test = await fixture(html`
            <div>
                <sp-field-label for="picker">Where do you live?</sp-field-label>
                <sp-picker
                    id="picker"
                    style="width: 200px; --spectrum-alias-ui-icon-chevron-size-100: 10px;"
                >
                    <sp-menu-item>Deselect</sp-menu-item>
                    <sp-menu-item value="option-2">Select Inverse</sp-menu-item>
                    <sp-menu-item>Feather...</sp-menu-item>
                    <sp-menu-item>Select and Mask...</sp-menu-item>
                    <sp-menu-divider></sp-menu-divider>
                    <sp-menu-item>Save Selection</sp-menu-item>
                    <sp-menu-item disabled>Make Work Path</sp-menu-item>
                </sp-picker>
            </div>
        `);
    return test.querySelector("sp-picker");
  };
  describe("container", () => {
    beforeEach(async () => {
      el = await pickerFixture();
      await elementUpdated(el);
    });
    it("is a Tray in mobile", async () => {
      el.isMobile.matches = true;
      el.bindEvents();
      await setViewport({ width: 360, height: 640 });
      await nextFrame();
      const opened = oneEvent(el, "sp-opened");
      const boundingRect = el.button.getBoundingClientRect();
      sendMouse({
        steps: [
          {
            type: "click",
            position: [
              boundingRect.x + boundingRect.width / 2,
              boundingRect.y + boundingRect.height / 2
            ]
          }
        ]
      });
      await opened;
      const tray = el.shadowRoot.querySelector("sp-tray");
      expect(tray).to.not.be.null;
    });
    it("is a Popover in desktop", async () => {
      await setViewport({ width: 701, height: 640 });
      await nextFrame();
      await nextFrame();
      const opened = oneEvent(el, "sp-opened");
      el.open = true;
      await opened;
      const popover = el.shadowRoot.querySelector("sp-popover");
      expect(popover).to.not.be.null;
    });
  });
});
//# sourceMappingURL=picker-responsive.test.js.map
