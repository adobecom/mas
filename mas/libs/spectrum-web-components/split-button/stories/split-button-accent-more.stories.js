"use strict";
import { ElementSizes } from "@spectrum-web-components/base";
import {
  args,
  argTypes,
  parameters,
  renderSplitButtonSet,
  splitbutton
} from "./index.js";
import "@spectrum-web-components/split-button/sp-split-button.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
const variant = "accent";
const type = "more";
export default {
  title: "Split Button/Accent/More",
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
export const sOpen = (args2) => splitbutton(args2);
sOpen.args = { size: ElementSizes.s, open: true };
export const m = (args2) => renderSplitButtonSet(args2);
m.args = { size: ElementSizes.m };
export const mOpen = (args2) => splitbutton(args2);
mOpen.args = { size: ElementSizes.m, open: true };
export const l = (args2) => renderSplitButtonSet(args2);
l.args = { size: ElementSizes.l };
export const lOpen = (args2) => splitbutton(args2);
lOpen.args = { size: ElementSizes.l, open: true };
export const XL = (args2) => renderSplitButtonSet(args2);
XL.args = { size: ElementSizes.xl };
export const XLOpen = (args2) => splitbutton(args2);
XLOpen.args = { size: ElementSizes.xl, open: true };
//# sourceMappingURL=split-button-accent-more.stories.js.map
