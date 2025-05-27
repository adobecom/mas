"use strict";
import { ElementSizes } from "@spectrum-web-components/base";
import {
  args,
  argTypes,
  parameters,
  renderSplitButtonSet,
  splitbutton
} from "./index.js";
import { isOverlayOpen } from "../../overlay/stories/index.js";
import "../../overlay/stories/index.js";
import "@spectrum-web-components/split-button/sp-split-button.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
const variant = "primary";
const type = "more";
export default {
  title: "Split Button/Primary/More",
  component: "sp-split-button",
  args: {
    ...args,
    variant,
    type
  },
  argTypes,
  parameters
};
export const s = (args2) => renderSplitButtonSet(args2);
s.args = { size: ElementSizes.s };
export const m = (args2) => renderSplitButtonSet(args2);
m.args = { size: ElementSizes.m };
export const l = (args2) => renderSplitButtonSet(args2);
l.args = { size: ElementSizes.l };
export const XL = (args2) => renderSplitButtonSet(args2);
XL.args = { size: ElementSizes.xl };
export const open = (args2) => splitbutton(args2);
open.args = { open: true };
open.decorators = [isOverlayOpen];
//# sourceMappingURL=split-button-primary-more.stories.js.map
