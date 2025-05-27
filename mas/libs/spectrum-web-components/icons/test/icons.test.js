"use strict";
import "@spectrum-web-components/icons/sp-icons-large.js";
import "@spectrum-web-components/icons/sp-icons-medium.js";
import IconsetSVG from "../src/icons-large.svg.js";
import { elementUpdated, expect, fixture, html } from "@open-wc/testing";
describe("icons", () => {
  it("large", async () => {
    const el = await fixture(
      html`
                <sp-icons-large></sp-icons-large>
            `
    );
    await elementUpdated(el);
    expect(el).to.not.equal(void 0);
    expect(el.getIconList().length).to.be.above(0);
  });
  it("medium", async () => {
    const el = await fixture(
      html`
                <sp-icons-medium></sp-icons-medium>
            `
    );
    await elementUpdated(el);
    expect(el).to.not.equal(void 0);
    expect(el.getIconList().length).to.be.above(0);
  });
  it("listens to slotchange events", async () => {
    const el = await fixture(
      html`
                <sp-icons-medium>${IconsetSVG}</sp-icons-medium>
            `
    );
    await elementUpdated(el);
    expect(el).to.not.equal(void 0);
    expect(el.getIconList().length).to.equal(48);
  });
});
//# sourceMappingURL=icons.test.js.map
