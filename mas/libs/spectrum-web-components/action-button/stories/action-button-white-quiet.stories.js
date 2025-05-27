"use strict";
import { makeOverBackground } from "../../button/stories/index.js";
import { renderButtons } from "./index.js";
export default {
  component: "sp-action-button",
  title: "Action Button/Static White Quiet",
  decorators: [makeOverBackground()]
};
const variant = "white";
const quiet = true;
export const XS = (args) => renderButtons(args);
XS.args = {
  size: "xs",
  quiet,
  variant
};
export const s = (args) => renderButtons(args);
s.args = {
  size: "s",
  quiet,
  variant
};
export const m = (args) => renderButtons(args);
m.args = {
  size: "m",
  quiet,
  variant
};
export const l = (args) => renderButtons(args);
l.args = {
  size: "l",
  quiet,
  variant
};
export const XL = (args) => renderButtons(args);
XL.args = {
  size: "xl",
  quiet,
  variant
};
//# sourceMappingURL=action-button-white-quiet.stories.js.map
