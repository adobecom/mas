"use strict";
import { makeOverBackground } from "../../button/stories/index.js";
import { renderButtons } from "./index.js";
export default {
  component: "sp-action-button",
  title: "Action Button/Static Black",
  decorators: [makeOverBackground("black")]
};
const variant = "black";
export const XS = (args) => renderButtons(args);
XS.args = {
  size: "xs",
  variant
};
export const s = (args) => renderButtons(args);
s.args = {
  size: "s",
  variant
};
export const m = (args) => renderButtons(args);
m.args = {
  size: "m",
  variant
};
export const l = (args) => renderButtons(args);
l.args = {
  size: "l",
  variant
};
export const XL = (args) => renderButtons(args);
XL.args = {
  size: "xl",
  variant
};
//# sourceMappingURL=action-button-black.stories.js.map
