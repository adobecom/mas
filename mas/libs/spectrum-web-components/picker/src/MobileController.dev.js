"use strict";
import {
  InteractionController,
  InteractionTypes
} from "./InteractionController.dev.js";
export class MobileController extends InteractionController {
  constructor() {
    super(...arguments);
    this.type = InteractionTypes.mobile;
  }
  handleClick() {
    if (this.preventNextToggle == "no") {
      this.open = !this.open;
    }
    this.preventNextToggle = "no";
  }
  handlePointerdown() {
    this.preventNextToggle = this.open ? "yes" : "no";
  }
  init() {
    var _a;
    (_a = this.abortController) == null ? void 0 : _a.abort();
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.target.addEventListener("click", () => this.handleClick(), {
      signal
    });
    this.target.addEventListener(
      "pointerdown",
      () => this.handlePointerdown(),
      { signal }
    );
    this.target.addEventListener(
      "focus",
      (event) => this.handleButtonFocus(event),
      {
        signal
      }
    );
  }
}
//# sourceMappingURL=MobileController.dev.js.map
