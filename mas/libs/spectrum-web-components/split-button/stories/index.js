"use strict";
import { html } from "@spectrum-web-components/base";
import "@spectrum-web-components/split-button/sp-split-button.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
const menu = ({
  firstItemHandler = function() {
    return;
  },
  secondItemHandler = function() {
    return;
  },
  thirdItemHandler = function() {
    return;
  }
}) => html`
    <sp-menu-item @click=${firstItemHandler}>Option 1</sp-menu-item>
    <sp-menu-item @click=${secondItemHandler}>
        Option Really Extended
    </sp-menu-item>
    <sp-menu-item @click=${thirdItemHandler}>Short</sp-menu-item>
`;
export const args = {
  disabled: false,
  invalid: false,
  left: false,
  open: false,
  type: "field",
  variant: "accent"
};
export const argTypes = {
  disabled: {
    name: "disabled",
    type: { name: "boolean", required: false },
    description: "Disable this control. It will not receive focus or events.",
    table: {
      type: { summary: "boolean" },
      defaultValue: { summary: false }
    },
    control: {
      type: "boolean"
    }
  },
  invalid: {
    name: "invalid",
    type: { name: "boolean", required: false },
    table: {
      type: { summary: "boolean" },
      defaultValue: { summary: false }
    },
    control: {
      type: "boolean"
    }
  },
  left: {
    name: "left",
    type: { name: "boolean", required: false },
    description: "Whether the split begins on the left.",
    table: {
      type: { summary: "boolean" },
      defaultValue: { summary: false }
    },
    control: {
      type: "boolean"
    }
  },
  open: {
    name: "open",
    type: { name: "boolean", required: false },
    description: "Whether the picker menu is open.",
    table: {
      type: { summary: "boolean" },
      defaultValue: { summary: false }
    },
    control: {
      type: "boolean"
    }
  },
  type: {
    name: "type",
    type: { name: "string", required: false },
    description: "Whether the split button shows the chosen action from the overlay menu. The `more` type maintains its original value.",
    table: {
      type: { summary: "string" },
      defaultValue: { summary: "field" }
    },
    control: {
      type: "inline-radio",
      options: ["field", "more"]
    }
  },
  variant: {
    name: "variant",
    type: { name: "string", required: false },
    description: "The visual variant to apply to the button.",
    table: {
      type: { summary: "string" },
      defaultValue: { summary: "cta" }
    },
    control: {
      type: "inline-radio",
      options: [
        "accent",
        "primary",
        "secondary",
        "negative",
        "black",
        "white"
      ]
    }
  }
};
export const parameters = {
  badges: ["deprecated"]
};
export const splitbutton = (properties = {}) => html`
    <sp-split-button
        ?left=${!!properties.left}
        size=${properties.size || "m"}
        variant=${properties.variant || "cta"}
        type=${properties.type || "field"}
        ?open=${!!properties.open}
        ?disabled=${properties.disabled}
    >
        ${menu(properties)}
    </sp-split-button>
`;
const left = true;
export const renderSplitButtonSet = (properties = {}) => html`
    ${splitbutton(properties)}
    ${splitbutton({
  ...properties,
  left
})}
`;
//# sourceMappingURL=index.js.map
