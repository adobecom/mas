"use strict";
import { html } from "@spectrum-web-components/base";
import { ifDefined } from "@spectrum-web-components/base/src/directives.js";
import "@spectrum-web-components/action-group/sp-action-group.js";
import "@spectrum-web-components/icon/sp-icon.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-edit.js";
import "@spectrum-web-components/action-button/sp-action-button.js";
export function renderButton(properties) {
  return html`
        <sp-action-button
            ?quiet="${!!properties.quiet}"
            ?emphasized="${!!properties.emphasized}"
            static="${ifDefined(properties.variant)}"
            ?disabled=${!!properties.disabled}
            ?selected=${!!properties.selected}
            ?toggles=${!!properties.toggles}
            size=${properties.size || "m"}
            ?hold-affordance=${!!properties.holdAffordance}
            ?active=${!!properties.active}
        >
            ${properties.icon}${properties.label}
        </sp-action-button>
    `;
}
function renderGroup(properties) {
  const label = "Edit";
  const holdAffordance = true;
  const icon = html`
        <sp-icon-edit slot="icon"></sp-icon-edit>
    `;
  return html`
        <sp-action-group
            ?quiet="${!!properties.quiet}"
            ?emphasized="${!!properties.emphasized}"
            size=${properties.size || "m"}
        >
            ${renderButton({
    ...properties,
    label
  })}
            ${renderButton({
    ...properties,
    label,
    icon
  })}
            ${renderButton({
    ...properties,
    icon
  })}
            ${renderButton({
    ...properties,
    icon,
    holdAffordance
  })}
        </sp-action-group>
    `;
}
export function renderButtons(properties) {
  const selected = true;
  const disabled = true;
  return html`
        <div
            style="display: flex; flex-direction: column; gap: calc(var(--spectrum-spacing-100) * var(--swc-scale-factor));"
        >
            ${renderGroup({
    ...properties
  })}
            ${renderGroup({
    ...properties,
    selected
  })}
            ${renderGroup({
    ...properties,
    disabled
  })}
            ${renderGroup({
    ...properties,
    disabled,
    selected
  })}
        </div>
    `;
}
//# sourceMappingURL=index.js.map
