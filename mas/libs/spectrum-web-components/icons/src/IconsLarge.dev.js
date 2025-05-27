"use strict";
import { IconsetSVG } from "@spectrum-web-components/iconset/src/iconset-svg.js";
import iconsSVG from "./icons-large.svg.dev.js";
export class IconsLarge extends IconsetSVG {
  constructor() {
    super();
    this.name = "ui";
  }
  renderDefaultContent() {
    return iconsSVG;
  }
  /**
   * Overrides createIconName to make icon strings compatible with spectrum-icon id format
   * @param icon
   * @param size
   */
  getSVGIconName(icon) {
    return `spectrum-icon-${icon}`;
  }
  getSanitizedIconName(icon) {
    return icon.replace("spectrum-icon-", "");
  }
}
//# sourceMappingURL=IconsLarge.dev.js.map
