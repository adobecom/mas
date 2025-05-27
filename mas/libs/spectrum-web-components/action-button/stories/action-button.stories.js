"use strict";
import { html } from "@spectrum-web-components/base";
import "@spectrum-web-components/action-group/sp-action-group.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-edit.js";
import { renderButton } from "./index.js";
import "@spectrum-web-components/action-button/sp-action-button.js";
export default {
  component: "sp-action-button",
  title: "Action Button"
};
function renderButtonsSelected(args) {
  const disabled = Object.assign({}, args, { disabled: true });
  const selected = Object.assign({}, args, { selected: true });
  return html`
        <sp-action-group
            ?emphasized="${!!args.emphasized}"
            ?quiet="${!!args.quiet}"
        >
            ${renderButton(args)} ${renderButton(selected)}
            ${renderButton(disabled)}
        </sp-action-group>
    `;
}
export const toggles = (args) => renderButtonsSelected(args);
toggles.args = {
  toggles: true,
  icon: html`
        <sp-icon-edit hidden slot="icon"></sp-icon-edit>
    `
};
export const iconSizeOverridden = (args) => {
  return html`
        ${renderButton(args)}
        <h1>For testing purposes only</h1>
        <p>
            This is a test to ensure that sizing the icon will still work when
            it's in the scope of a parent element. You shouldn't normally do
            this as it deviates from the Spectrum design specification.
        </p>
    `;
};
iconSizeOverridden.args = {
  label: "",
  size: "xl",
  icon: html`
        <sp-icon-edit slot="icon" size="s"></sp-icon-edit>
    `
};
//# sourceMappingURL=action-button.stories.js.map
