"use strict";
import "@spectrum-web-components/theme/sp-theme.js";
import { elementUpdated, expect, fixture, html } from "@open-wc/testing";
import { stub } from "sinon";
describe("Dev mode", () => {
  let consoleWarnStub;
  before(() => {
    window.__swc.verbose = true;
    consoleWarnStub = stub(console, "warn");
  });
  afterEach(() => {
    consoleWarnStub.resetHistory();
  });
  after(() => {
    window.__swc.verbose = false;
    consoleWarnStub.restore();
  });
  it("warns in Dev Mode when no attributes or fragments", async () => {
    const el = await fixture(html`
            <sp-theme></sp-theme>
        `);
    await elementUpdated(el);
    expect(consoleWarnStub.called).to.be.true;
    const spyCall = consoleWarnStub.getCall(0);
    expect(
      spyCall.args.at(0).includes("theme delivery"),
      'confirm "theme delivery"-centric message'
    ).to.be.true;
    expect(spyCall.args.at(-1), "confirm `data` shape").to.deep.equal({
      data: {
        localName: "sp-theme",
        type: "api",
        level: "default"
      }
    });
  });
  it("warns in Dev Mode when you pass a theme attribute", async () => {
    const el = await fixture(html`
            <sp-theme theme="classic" color="dark" scale="medium"></sp-theme>
        `);
    await elementUpdated(el);
    expect(consoleWarnStub.called).to.be.true;
    const spyCall = consoleWarnStub.getCall(0);
    expect(
      spyCall.args.at(0).includes("deprecated"),
      'confirm "theme-deprecation"-centric message'
    ).to.be.true;
    expect(spyCall.args.at(-1), "confirm `data` shape").to.deep.equal({
      data: {
        localName: "sp-theme",
        type: "api",
        level: "deprecation"
      }
    });
  });
  it("warns in Dev Mode when you use Spectrum Two theme ", async () => {
    const el = await fixture(html`
            <sp-theme
                system="spectrum-two"
                color="dark"
                scale="medium"
            ></sp-theme>
        `);
    await elementUpdated(el);
    expect(consoleWarnStub.called).to.be.true;
    const spyCall = consoleWarnStub.getCall(0);
    expect(
      spyCall.args.at(0).includes("beta version"),
      'confirm "beta-theme"-centric message'
    ).to.be.true;
    expect(spyCall.args.at(-1), "confirm `data` shape").to.deep.equal({
      data: {
        localName: "sp-theme",
        type: "api",
        level: "high"
      }
    });
  });
});
//# sourceMappingURL=theme-devmode.test.js.map
