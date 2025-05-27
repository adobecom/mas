"use strict";
import { html } from "@spectrum-web-components/base";
class CountdownWatcher extends HTMLElement {
  constructor() {
    super(...arguments);
    this.readyPromise = Promise.resolve(false);
  }
  connectedCallback() {
    this.previousElementSibling.addEventListener(
      "countdown-complete",
      () => {
        this.ready(true);
      }
    );
    this.readyPromise = new Promise((res) => {
      this.ready = res;
    });
  }
  get updateComplete() {
    return this.readyPromise;
  }
}
customElements.define("countdown-complete-watcher", CountdownWatcher);
export const disabledButtonDecorator = (story) => {
  return html`
        ${story()}
        <countdown-complete-watcher></countdown-complete-watcher>
    `;
};
//# sourceMappingURL=index.js.map
