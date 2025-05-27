"use strict";
import "@spectrum-web-components/split-button/sp-split-button.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import { html } from "lit";
import { measureFixtureCreation } from "../../../../test/benchmark/helpers.js";
class SplitButtonWorkflow extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
    this.readyPromise = Promise.resolve(false);
    this.readyPromise = new Promise((res) => {
      this.ready = res;
      this.setup();
    });
  }
  async setup() {
    this.splitButton = this.nextElementSibling;
    this.splitButton.addEventListener("sp-opened", () => {
      requestAnimationFrame(() => this.splitButton.open = false);
    });
    this.splitButton.addEventListener("sp-closed", () => {
      this.count += 1;
      if (this.count >= 5) {
        this.ready(true);
        return;
      }
      requestAnimationFrame(() => this.splitButton.open = true);
    });
    requestAnimationFrame(() => this.splitButton.open = true);
  }
  get updateComplete() {
    return this.readyPromise;
  }
}
customElements.define("split-button-workflow", SplitButtonWorkflow);
measureFixtureCreation(
  html`
        <split-button-workflow></split-button-workflow>
        <sp-split-button>
            <sp-menu-item>Action 1</sp-menu-item>
            <sp-menu-item>Action 2</sp-menu-item>
            <sp-menu-item>Action 3</sp-menu-item>
        </sp-split-button>
    `,
  { numRenders: 1 }
);
//# sourceMappingURL=basic-test.js.map
