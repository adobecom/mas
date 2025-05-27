"use strict";
import { html } from "@spectrum-web-components/base";
function nextFrame() {
  return new Promise((res) => requestAnimationFrame(() => res()));
}
class IsOverlayOpen extends HTMLElement {
  constructor() {
    super();
    this.handleOpened = async (event) => {
      const overlay = event.target;
      const actions = [nextFrame(), overlay.updateComplete];
      await Promise.all(actions);
      await nextFrame();
      await nextFrame();
      await nextFrame();
      await nextFrame();
      this.ready(true);
    };
    this.readyPromise = Promise.resolve(false);
    this.readyPromise = new Promise((res) => {
      this.ready = res;
      this.setup();
    });
  }
  async setup() {
    await nextFrame();
    document.addEventListener("sp-opened", this.handleOpened);
  }
  get updateComplete() {
    return this.readyPromise;
  }
}
customElements.define("is-overlay-open", IsOverlayOpen);
export const isOverlayOpen = (story) => {
  return html`
        ${story()}
        <is-overlay-open></is-overlay-open>
    `;
};
//# sourceMappingURL=index.js.map
